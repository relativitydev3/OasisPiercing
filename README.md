# Oasis Piercing

Tienda online de piercings con Express.js.

## Estructura del proyecto

```
├── public/              # Archivos estáticos
│   ├── css/
│   ├── js/
│   └── images/
├── src/
│   ├── config/          # Variables de entorno y configuración del sitio
│   ├── controllers/     # Controladores (home, config)
│   ├── routes/          # Rutas Express
│   ├── models/          # Modelos de datos
│   ├── middlewares/     # Middlewares personalizados
│   ├── services/        # Lógica de servicio
│   ├── utils/           # Utilidades
│   ├── validations/     # Validaciones
│   └── app.js           # Configuración de Express
├── views/
│   ├── pages/           # Vistas principales
│   └── partials/        # Componentes reutilizables
├── server.js            # Punto de entrada
├── .env                 # Variables de entorno (no commitear)
└── package.json
```

## Instalación

```bash
npm install
cp .env.example .env
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Producción

```bash
npm start
```

Configura en `.env`:

- `APP_URL` — URL pública del sitio
- `DATABASE_URL` — conexión Neon PostgreSQL
- `SESSION_SECRET` — secreto largo y aleatorio para sesiones

## Autenticación

Rutas disponibles:

| Ruta | Descripción |
|---|---|
| `GET/POST /login` | Iniciar sesión |
| `GET/POST /registro` | Registro (solo rol cliente) |
| `GET/POST /logout` | Cerrar sesión |
| `/admin/usuarios` | CRUD de usuarios (solo administrador) |

### Primer administrador

1. Genera un hash bcrypt:
   ```bash
   node scripts/hash-password.js "TuContraseñaSegura"
   ```
2. Inserta el usuario en Neon con `rol_id = 2` (ver `sql/schema.sql`).

### Roles

- `1` → cliente
- `2` → administrador

## Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Framework preset: **Other**
3. Build command: vacío (o `npm install`)
4. Output directory: vacío
5. Variables de entorno:
   - `APP_URL` = `https://oasis-piercing.vercel.app/`
   - `DATABASE_URL` = tu URL de Neon
   - `SESSION_SECRET` = secreto aleatorio

El archivo `vercel.json` enruta todas las peticiones al servidor Express en `api/index.js`.
