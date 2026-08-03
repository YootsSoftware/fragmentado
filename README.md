# Fragmentado

Sitio oficial y Electronic Press Kit digital de Fragmentado, proyecto de música regional mexicana original desde la Sierra Mixe de Oaxaca.

## Stack

- Next.js 15.5 con App Router
- React 18
- CSS Modules
- MongoDB
- Spotify Web API y Song.link
- Chart.js para estadísticas del administrador

## Rutas principales

- `/`: sitio público, catálogo, videos, historia, press kit y contrataciones.
- `/fg-admin`: administración de álbumes, lanzamientos, redes, cuenta y estadísticas.
- `/api/releases`: contenido público desde MongoDB.
- `/api/contact`: recepción de solicitudes de contratación en `contact_requests`.
- `/pre-save`: campañas públicas para próximos lanzamientos.
- `/api/pre-saves`: campañas de pre-save publicadas.
- `/robots.txt` y `/sitemap.xml`: configuración SEO.

## Contenido

Los álbumes, lanzamientos, portadas, videos y enlaces de plataformas se administran desde `/fg-admin` y se guardan en MongoDB. El contenido editorial del sitio público está centralizado en `lib/site-content.js`.

Las imágenes subidas desde el administrador se optimizan a WebP y se guardan en MongoDB mediante GridFS. Los documentos de lanzamientos y pre-save conservan únicamente la URL pública de cada imagen.

El administrador también permite crear varias campañas de pre-save, conservarlas como borrador y publicar únicamente las que tengan portada, fecha y al menos un enlace de plataforma.

Las solicitudes del formulario se validan en el servidor y se guardan en la colección `contact_requests` con estado `new`.

La sección de prensa funciona como EPK digital con datos rápidos, videos y acceso directo a contrataciones.

## Seguridad

- Las rutas administrativas requieren una sesión firmada y bloquean solicitudes cruzadas.
- Login, alta inicial, formulario de contacto, previews y métricas tienen límites por cliente.
- La primera cuenta administrativa requiere `FG_ADMIN_SETUP_SECRET` en producción.
- El sitio publica CSP, HSTS, protección contra framing y políticas restrictivas del navegador.
- Los enlaces y datos estructurados se normalizan antes de publicarse.

## Variables de entorno

Consulta `.env.example` para la lista completa:

```env
FG_ADMIN_SECRET=
FG_ADMIN_SETUP_SECRET=
FG_ADMIN_COOKIE_SECURE=true
FG_ADMIN_COOKIE_DOMAIN=
FG_UPLOADS_DIR=

MONGODB_URI=
MONGODB_DB_NAME=fragmentado

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_ARTIST_ID=
SPOTIFY_MARKET=MX
```

## Desarrollo

Requiere Node.js 20.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Verificación

```bash
npm run lint
npm run build
```

No ejecutes `next dev` y `next build` al mismo tiempo porque ambos comparten la carpeta `.next`.

## Produccion en Railway

1. Conecta `fragmentado.com` como dominio personalizado del servicio. Railway proporciona los registros DNS y administra el certificado HTTPS.
2. Las imágenes no requieren Volume porque se guardan en MongoDB GridFS. Agrega un Volume únicamente si se habilitarán cargas persistentes de audio o video.
3. Configura `FG_ADMIN_COOKIE_SECURE=true` y deja `FG_ADMIN_COOKIE_DOMAIN` vacio para limitar la cookie al host actual.
4. Define secretos largos y distintos en `FG_ADMIN_SECRET` y `FG_ADMIN_SETUP_SECRET`, ademas de las variables de MongoDB y Spotify.

`FG_UPLOADS_DIR` solo es necesario para definir una carpeta persistente de audio o video distinta al Volume detectado automáticamente.
