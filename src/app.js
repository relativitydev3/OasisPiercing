require('./config/env');
const compression = require('compression');
const express = require('express');
const { createSessionMiddleware } = require('./config/session');
const configRoutes = require('./routes/config.routes');
const catalogRoutes = require('./routes/catalog.routes');
const pedidoRoutes = require('./routes/pedido.routes');
const mediaRoutes = require('./routes/media.routes');
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const adminRoutes = require('./routes/admin.routes');
const indexRoutes = require('./routes/index.routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { csrfLocals } = require('./middlewares/csrf');
const { cspNonce, helmetCsp } = require('./middlewares/csp');
const { localsMiddleware } = require('./utils/flash');
const { publicDir, viewsDir } = require('./utils/paths');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', viewsDir);

app.use(compression());
app.use(cspNonce);
app.use(helmetCsp);

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use((req, res, next) => {
  res.locals.user = null;
  next();
});
app.use(createSessionMiddleware());
app.use(csrfLocals);
app.use(localsMiddleware);

app.use(configRoutes);
app.use('/api', catalogRoutes);
app.use('/api', pedidoRoutes);
app.use(mediaRoutes);
app.use(express.static(publicDir, { maxAge: '7d', etag: true }));
app.use(authRoutes);
app.use(accountRoutes);
app.use('/admin', adminRoutes);
app.use(indexRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
