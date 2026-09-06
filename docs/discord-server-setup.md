# Discord server setup

Este documento define la estructura inicial del servidor de Discord para Workflow-VStore.

La V1 del proyecto usa Discord como comunidad y punto de soporte para la tienda web. La estructura esta pensada para ser simple, mantener permisos claros y dejar preparada la integracion futura del bot en Cloudflare Workers.

## Roles

| Rol | Uso | Permisos base |
| --- | --- | --- |
| Admin | Propietario y administradores del servidor | Administrador |
| Staff | Gestion diaria, moderacion y soporte | Gestionar mensajes, expulsar miembros, silenciar miembros, mover miembros, ver canales staff |
| Soporte | Equipo que atiende dudas y pedidos | Ver canales de soporte, responder tickets, conectar a voz soporte |
| Bot | Bot de Discord de Workflow-VStore | Ver canales necesarios, enviar mensajes, usar comandos, gestionar interacciones |
| Cliente | Usuarios que han comprado o estan en seguimiento | Ver comunidad, tienda y canales de cliente |
| Miembro | Usuarios verificados de la comunidad | Ver comunidad, escribir en canales publicos |
| @everyone | Usuarios recien llegados | Ver entrada y reglas, permisos minimos |

## Categorias y canales

### Entrada

| Canal | Tipo | Proposito | Permisos |
| --- | --- | --- | --- |
| reglas | Texto | Normas basicas del servidor | @everyone puede ver; solo Staff/Admin puede escribir |
| anuncios | Texto | Noticias importantes de la tienda y comunidad | @everyone puede ver; solo Staff/Admin/Bot puede escribir |
| bienvenida | Texto | Mensaje inicial y pasos para nuevos usuarios | @everyone puede ver; solo Staff/Admin/Bot puede escribir |

### Tienda

| Canal | Tipo | Proposito | Permisos |
| --- | --- | --- | --- |
| productos | Texto | Catalogo resumido y avisos de productos | Miembro/Cliente puede ver; solo Staff/Admin/Bot puede escribir |
| stock | Texto | Disponibilidad y reposiciones | Miembro/Cliente puede ver; solo Staff/Admin/Bot puede escribir |
| pedidos-info | Texto | Como comprar, estado general y enlaces utiles | Miembro/Cliente puede ver; solo Staff/Admin/Bot puede escribir |
| ofertas | Texto | Promociones puntuales | Miembro/Cliente puede ver; solo Staff/Admin/Bot puede escribir |

### Soporte

| Canal | Tipo | Proposito | Permisos |
| --- | --- | --- | --- |
| ayuda | Texto | Dudas generales antes de abrir ticket | Miembro/Cliente puede ver y escribir; Staff/Soporte responde |
| soporte-tickets | Texto | Entrada para crear tickets con bot o instrucciones manuales | Miembro/Cliente puede ver; solo Staff/Admin/Bot puede escribir |
| seguimiento-pedidos | Texto | Seguimiento no sensible de pedidos | Cliente puede ver y escribir; Staff/Soporte/Admin puede ver y responder |
| soporte-voz | Voz | Atencion por voz cuando haga falta | Cliente/Miembro puede conectar; Soporte/Staff/Admin puede mover/silenciar |

### Comunidad

| Canal | Tipo | Proposito | Permisos |
| --- | --- | --- | --- |
| general | Texto | Conversacion principal de la comunidad | Miembro/Cliente puede ver y escribir |
| dudas | Texto | Preguntas sobre productos, web o Discord | Miembro/Cliente puede ver y escribir |
| sugerencias | Texto | Ideas para tienda, productos y mejoras | Miembro/Cliente puede ver y escribir |
| off-topic | Texto | Conversacion secundaria | Miembro/Cliente puede ver y escribir |
| sala-general | Voz | Voz abierta para comunidad | Miembro/Cliente puede conectar y hablar |

### Staff

| Canal | Tipo | Proposito | Permisos |
| --- | --- | --- | --- |
| staff-chat | Texto | Coordinacion interna | Solo Staff/Admin |
| pedidos-admin | Texto | Gestion interna de pedidos | Solo Staff/Admin |
| logs-bot | Texto | Logs del bot e integraciones | Solo Staff/Admin/Bot |
| moderacion | Texto | Incidencias y decisiones internas | Solo Staff/Admin |
| reunion-staff | Voz | Reuniones internas | Solo Staff/Admin |

## Orden recomendado de creacion

1. Crear roles: Admin, Staff, Soporte, Bot, Cliente, Miembro.
2. Configurar permisos base de `@everyone` con privilegios minimos.
3. Crear categorias: Entrada, Tienda, Soporte, Comunidad, Staff.
4. Crear canales de texto y voz dentro de cada categoria.
5. Aplicar permisos por categoria para heredar ajustes.
6. Ajustar excepciones canal por canal cuando sea necesario.
7. Probar con una cuenta sin permisos para verificar que no ve canales internos.
8. Probar con Staff/Soporte/Bot para verificar que cada rol ve lo necesario.

## Politica de permisos

- Los canales de entrada son visibles para todos, pero solo Staff/Admin/Bot escriben en los canales informativos.
- Los canales de tienda son visibles para miembros y clientes; las publicaciones las hace Staff/Admin/Bot.
- Soporte permite escribir a miembros/clientes solo donde hace falta.
- Staff queda completamente oculto para usuarios normales.
- El rol Bot no debe tener Administrador por defecto; solo se le daran permisos concretos segun la integracion.
