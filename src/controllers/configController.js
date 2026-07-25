const { getClientConfig } = require('../config/site');

exports.getClientConfig = (req, res) => {
  const config = getClientConfig(req);
  res.type('application/javascript');
  res.send(`window.OASIS_CONFIG = ${JSON.stringify(config, null, 2)};`);
};
