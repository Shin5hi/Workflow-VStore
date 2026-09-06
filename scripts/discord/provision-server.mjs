import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const API_BASE_URL = "https://discord.com/api/v10";

const CHANNEL_TYPES = {
  text: 0,
  voice: 2,
  category: 4
};

const OVERWRITE_TYPES = {
  role: 0
};

const PERMISSIONS = {
  ViewChannel: 1n << 10n,
  SendMessages: 1n << 11n,
  ManageMessages: 1n << 13n,
  EmbedLinks: 1n << 14n,
  AttachFiles: 1n << 15n,
  ReadMessageHistory: 1n << 16n,
  UseApplicationCommands: 1n << 31n,
  Connect: 1n << 20n,
  Speak: 1n << 21n,
  MuteMembers: 1n << 22n,
  DeafenMembers: 1n << 23n,
  MoveMembers: 1n << 24n
};

const TEXT_READ = [
  "ViewChannel",
  "ReadMessageHistory",
  "UseApplicationCommands"
];

const TEXT_WRITE = [
  ...TEXT_READ,
  "SendMessages",
  "EmbedLinks",
  "AttachFiles"
];

const TEXT_MODERATE = [
  ...TEXT_WRITE,
  "ManageMessages"
];

const VOICE_JOIN = [
  "ViewChannel",
  "Connect",
  "Speak"
];

const VOICE_MODERATE = [
  ...VOICE_JOIN,
  "MuteMembers",
  "DeafenMembers",
  "MoveMembers"
];

const REQUIRED_ENV = ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID"];

const flags = new Set(process.argv.slice(2));
const applyChanges = flags.has("--apply");
const dryRun = flags.has("--dry-run") || !applyChanges;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const structurePath = path.join(__dirname, "server-structure.json");
const structure = JSON.parse(await fs.readFile(structurePath, "utf8"));

const env = Object.fromEntries(
  REQUIRED_ENV.map((key) => [key, process.env[key]])
);

function permissionValue(names) {
  return names.reduce((total, name) => {
    const value = PERMISSIONS[name];
    if (value === undefined) {
      throw new Error(`Unknown Discord permission: ${name}`);
    }

    return total | value;
  }, 0n).toString();
}

function roleOverwrite(roleId, allow = [], deny = []) {
  return {
    id: roleId,
    type: OVERWRITE_TYPES.role,
    allow: permissionValue(allow),
    deny: permissionValue(deny)
  };
}

function requireRoleId(roleIds, roleName) {
  const roleId = roleIds.get(roleName);
  if (!roleId) {
    throw new Error(`Missing required role: ${roleName}`);
  }

  return roleId;
}

function buildOverwrites(policy, roleIds, guildId) {
  const everyone = guildId;
  const staff = requireRoleId(roleIds, "Staff");
  const support = requireRoleId(roleIds, "Soporte");
  const bot = requireRoleId(roleIds, "Bot");
  const client = requireRoleId(roleIds, "Cliente");
  const member = requireRoleId(roleIds, "Miembro");

  const denyView = ["ViewChannel"];
  const denySend = ["SendMessages"];
  const denyVoice = ["Connect", "Speak"];

  const staffText = roleOverwrite(staff, TEXT_MODERATE);
  const supportText = roleOverwrite(support, TEXT_WRITE);
  const botText = roleOverwrite(bot, TEXT_WRITE);
  const staffVoice = roleOverwrite(staff, VOICE_MODERATE);
  const supportVoice = roleOverwrite(support, VOICE_MODERATE);

  const policies = {
    publicReadOnly: [
      roleOverwrite(everyone, TEXT_READ, denySend),
      staffText,
      botText
    ],
    publicAnnouncements: [
      roleOverwrite(everyone, TEXT_READ, denySend),
      staffText,
      botText
    ],
    membersReadOnly: [
      roleOverwrite(everyone, [], denyView),
      roleOverwrite(member, TEXT_READ, denySend),
      roleOverwrite(client, TEXT_READ, denySend),
      staffText,
      supportText,
      botText
    ],
    memberChat: [
      roleOverwrite(everyone, [], denyView),
      roleOverwrite(member, TEXT_WRITE),
      roleOverwrite(client, TEXT_WRITE),
      staffText,
      supportText,
      botText
    ],
    memberSupport: [
      roleOverwrite(everyone, [], denyView),
      roleOverwrite(member, TEXT_WRITE),
      roleOverwrite(client, TEXT_WRITE),
      staffText,
      supportText,
      botText
    ],
    customerSupport: [
      roleOverwrite(everyone, [], denyView),
      roleOverwrite(client, TEXT_WRITE),
      staffText,
      supportText,
      botText
    ],
    supportVoice: [
      roleOverwrite(everyone, [], denyView),
      roleOverwrite(member, VOICE_JOIN),
      roleOverwrite(client, VOICE_JOIN),
      staffVoice,
      supportVoice,
      roleOverwrite(bot, ["ViewChannel", "Connect", "Speak"])
    ],
    memberVoice: [
      roleOverwrite(everyone, [], denyView),
      roleOverwrite(member, VOICE_JOIN),
      roleOverwrite(client, VOICE_JOIN),
      staffVoice,
      supportVoice
    ],
    staffOnly: [
      roleOverwrite(everyone, [], denyView),
      staffText
    ],
    staffAndBot: [
      roleOverwrite(everyone, [], denyView),
      staffText,
      botText
    ],
    staffVoice: [
      roleOverwrite(everyone, [], [...denyView, ...denyVoice]),
      staffVoice
    ]
  };

  const overwrites = policies[policy];
  if (!overwrites) {
    throw new Error(`Unknown channel permission policy: ${policy}`);
  }

  return overwrites;
}

async function discordRequest(route, options = {}) {
  if (!env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN is required for Discord API calls.");
  }

  const response = await fetch(`${API_BASE_URL}${route}`, {
    ...options,
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "Workflow-VStore Discord Provisioner",
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? response.statusText;
    throw new Error(`Discord API ${response.status} ${route}: ${message}`);
  }

  return data;
}

async function getGuildState(guildId) {
  const [guild, roles, channels] = await Promise.all([
    discordRequest(`/guilds/${guildId}`),
    discordRequest(`/guilds/${guildId}/roles`),
    discordRequest(`/guilds/${guildId}/channels`)
  ]);

  return { guild, roles, channels };
}

async function ensureRole(role, roleIds, guildId) {
  if (role.managedManually) {
    if (!roleIds.has(role.name)) {
      console.log(`Manual role missing: ${role.name}`);
    }

    return roleIds.get(role.name);
  }

  const existingRoleId = roleIds.get(role.name);
  if (existingRoleId) {
    console.log(`Role exists: ${role.name}`);
    return existingRoleId;
  }

  if (dryRun) {
    console.log(`Would create role: ${role.name}`);
    const placeholderId = `dry-run-role-${role.name.toLowerCase()}`;
    roleIds.set(role.name, placeholderId);
    return placeholderId;
  }

  const createdRole = await discordRequest(`/guilds/${guildId}/roles`, {
    method: "POST",
    body: JSON.stringify({
      name: role.name,
      color: role.color ?? 0,
      mentionable: false
    })
  });

  console.log(`Created role: ${createdRole.name}`);
  roleIds.set(createdRole.name, createdRole.id);
  return createdRole.id;
}

async function ensureCategory(category, guildId, channelIdsByName, roleIds) {
  const existingCategoryId = channelIdsByName.get(category.name);
  if (existingCategoryId) {
    console.log(`Category exists: ${category.name}`);
    return existingCategoryId;
  }

  if (dryRun) {
    console.log(`Would create category: ${category.name}`);
    const placeholderId = `dry-run-category-${category.name.toLowerCase()}`;
    channelIdsByName.set(category.name, placeholderId);
    return placeholderId;
  }

  const createdCategory = await discordRequest(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name: category.name,
      type: CHANNEL_TYPES.category,
      permission_overwrites: buildCategoryOverwrites(category.name, roleIds, guildId)
    })
  });

  console.log(`Created category: ${createdCategory.name}`);
  channelIdsByName.set(createdCategory.name, createdCategory.id);
  return createdCategory.id;
}

function buildCategoryOverwrites(categoryName, roleIds, guildId) {
  const categoryPolicies = {
    Entrada: "publicReadOnly",
    Tienda: "membersReadOnly",
    Soporte: "memberSupport",
    Comunidad: "memberChat",
    Staff: "staffOnly"
  };

  return buildOverwrites(categoryPolicies[categoryName], roleIds, guildId);
}

async function ensureChannel(channel, categoryId, guildId, channelIdsByName, roleIds) {
  const existingChannelId = channelIdsByName.get(channel.name);
  if (existingChannelId) {
    console.log(`Channel exists: ${channel.name}`);
    return existingChannelId;
  }

  if (dryRun) {
    console.log(`Would create ${channel.type} channel: ${channel.name}`);
    return `dry-run-channel-${channel.name}`;
  }

  const createdChannel = await discordRequest(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name: channel.name,
      type: CHANNEL_TYPES[channel.type],
      parent_id: categoryId,
      permission_overwrites: buildOverwrites(channel.policy, roleIds, guildId)
    })
  });

  console.log(`Created ${channel.type} channel: ${createdChannel.name}`);
  channelIdsByName.set(createdChannel.name, createdChannel.id);
  return createdChannel.id;
}

async function main() {
  console.log(dryRun ? "Running in dry-run mode." : "Applying changes to Discord.");

  if (!env.DISCORD_GUILD_ID || (dryRun && !env.DISCORD_BOT_TOKEN)) {
    const missing = REQUIRED_ENV.filter((key) => !env[key]).join(", ");
    console.log(`Missing Discord API environment: ${missing}. Showing local plan only.`);
    printPlan();
    return;
  }

  const { guild, roles, channels } = await getGuildState(env.DISCORD_GUILD_ID);
  console.log(`Target guild: ${guild.name} (${guild.id})`);

  const roleIds = new Map(roles.map((role) => [role.name, role.id]));
  const channelIdsByName = new Map(channels.map((channel) => [channel.name, channel.id]));

  for (const role of structure.roles) {
    await ensureRole(role, roleIds, guild.id);
  }

  for (const category of structure.categories) {
    const categoryId = await ensureCategory(category, guild.id, channelIdsByName, roleIds);

    for (const channel of category.channels) {
      await ensureChannel(channel, categoryId, guild.id, channelIdsByName, roleIds);
    }
  }
}

function printPlan() {
  console.log("Roles:");
  for (const role of structure.roles) {
    console.log(`- ${role.name}${role.managedManually ? " (manual)" : ""}`);
  }

  console.log("\nCategories and channels:");
  for (const category of structure.categories) {
    console.log(`- ${category.name}`);
    for (const channel of category.channels) {
      console.log(`  - ${channel.name} (${channel.type}, ${channel.policy})`);
    }
  }
}

await main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
