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
