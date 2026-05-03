# Pendientes de producto

## Despliegue / dominio público

- Menús en un único host (ej. lanzamiento `https://menuly.bocal.online/m/<slug>`): fijar `NEXT_PUBLIC_APP_URL` al host canónico de escaneo; si el apex comparte sufijo DNS con otros roots, usar `NEXT_PUBLIC_ROOT_DOMAINS` listando sufijos ordenados cualquiera (`parseHost` elige el **más largo** que coincida). Si el panel vive en otro origen, `NEXT_PUBLIC_PUBLIC_MENU_URL` para la URL codificada en el QR solamente.
- Definir la URL definitiva de la landing de marketing y fijarla en producción como `NEXT_PUBLIC_MARKETING_SITE_URL` (enlace del icono Menuly en plantillas de menú QR). Hasta entonces se usa `NEXT_PUBLIC_APP_URL` o, si vacío, la ruta relativa `/`.

## Ajustes (fase siguiente, especifico Menuly)

- Menu QR (Modern):
  - revisar implementacion de search flotante solo mobile; version actual descartada por no aplicarse correctamente en entorno de prueba
- Preferencias de usuario en ajustes:
  - reintroducir zona horaria y formato de fecha cuando se conecten a analiticas/listados/exportes
  - evitar exponer estos campos si no tienen impacto real en la interfaz
- Publicacion y dominio:
  - mostrar dominio actual operativo
  - validacion DNS con estados claros
  - estado SSL y fecha de renovacion
  - reglas de redireccion visibles/editables
- Integraciones:
  - estado de conexion de Stripe, Resend y OpenAI
  - comprobacion rapida de conectividad por integracion
  - feedback de errores de configuracion con accion recomendada

## Nota de alcance

- Este bloque se aplaza para una siguiente iteracion.
- En esta entrega se ha priorizado ajustes de cuenta, preferencias, notificaciones, facturacion y seguridad.
