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

Configura `APP_URL` en `.env` con la URL pública del sitio (ej. `https://tu-dominio.com/`).

## Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Framework preset: **Other**
3. Build command: vacío (o `npm install`)
4. Output directory: vacío
5. Variables de entorno (opcional):
   - `APP_URL` = `https://oasis-piercing.vercel.app/` (tu dominio de Vercel)

El archivo `vercel.json` enruta todas las peticiones al servidor Express en `api/index.js`.
