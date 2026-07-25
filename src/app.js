const express = require('express');
const configRoutes = require('./routes/config.routes');
const indexRoutes = require('./routes/index.routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { publicDir } = require('./utils/paths');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(configRoutes);
app.use(express.static(publicDir));
app.use(indexRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
