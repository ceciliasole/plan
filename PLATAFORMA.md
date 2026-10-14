# Plataforma: cómo correrla

```
npm install
npm run dev          # http://localhost:3000, login de prueba sin Google (DEV_LOGIN=1)
```
Producción: `DATABASE_URL` (Supabase: Project Settings → Database → Connection string → *Transaction pooler*), `GOOGLE_CLIENT_ID`, `SESSION_SECRET` (largo, aleatorio), `ADMIN_EMAILS` (tu mail, separados por coma), `NODE_ENV=production`, y opcional `PAY_URL` (link de inscripción/pago que se muestra en la vista previa) y `CONTACT_EMAIL`. Requiere Node >= 22.13. Sin `DATABASE_URL` en desarrollo usa una base en memoria que se borra al apagar.

## Base de datos (Supabase)
Las tablas se crean solas al arrancar, con prefijo `impactese_` (`impactese_customers`, `impactese_orgs`, `impactese_tool_state`) para no pisar otras tablas del proyecto. En Supabase quedan con RLS activado y sin políticas: la API pública no puede leerlas; el servidor entra por la conexión directa de Postgres. La contraseña de `DATABASE_URL` es secreta: va solo en las variables de entorno del servidor, nunca en el repositorio.

Google: en Google Cloud Console → Credenciales → ID de cliente OAuth (Aplicación web) → agregar tu dominio en "Orígenes autorizados de JavaScript". El `GOOGLE_CLIENT_ID` es público; no hay secreto de cliente en este flujo.

## Flujo
1. `/` login con Google: entra cualquiera. Sin pago ve las 12 herramientas en **vista previa** (datos de ejemplo, todo deshabilitado, nada se guarda). Con pago (lista en `/admin`: mails o `@dominio.org`) las usa completas. Se revalida en cada request: si dejás de marcarlo como pago, vuelve a vista previa y su trabajo queda guardado pero oculto. Administradores (acceso total, `/admin`): `cecilia.sole@gmail.com` y `hernan@guaraniagency.com`, más lo que pongas en `ADMIN_EMAILS`.
2. `/onboarding` (primera vez): del dominio del mail toma nombre, sitio, descripción y logos candidatos. La persona confirma, corrige o sube otro logo. Los 2 colores se sacan del logo en el navegador y se corrigen a mano (avisa si no llegan a contraste 4.5:1).
3. `/app` índice con avance de los 12 pasos. `/tools/<id>` abre cada herramienta con logo y colores de la organización; guarda en servidor solo (700 ms después de cada cambio).

## Decisiones tomadas por defecto (cambiables)
- **Un espacio por dominio**: todos los de `@fundacion.org` comparten datos. Mails personales (gmail, etc.) tienen espacio propio y no se puede leer su sitio.
- **Pago = lista manual** que cargás vos en `/admin`. No hay integración con Mercado Pago/Stripe.
- Sin botón "Compartir con impactese" todavía (ver LEEME.md, punto 1).
