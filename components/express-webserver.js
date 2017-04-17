const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
// const querystring = require('querystring');
const debug = require('debug')('botkit:webserver');

const DEFAULT_PORT = 3000;
const PORT = process.env.PORT || DEFAULT_PORT;

module.exports = function(controller) {
  const webserver = express();
  webserver.use(bodyParser.json());
  webserver.use(bodyParser.urlencoded({ extended: true }));

  // import express middlewares that are present in /components/express_middleware
  const middlewarePath = path.join(__dirname, 'express_middleware');
  fs.readdirSync(middlewarePath).forEach((file) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`./express_middleware/${file}`)(webserver, controller);
  });

  webserver.use(express.static('public'));

  webserver.listen(PORT, null, () => {
    debug(`Express webserver configured and listening at http://localhost:${PORT}`);
  });

  // import all the pre-defined routes that are present in /components/routes
  const routesPath = path.join(__dirname, 'routes');
  fs.readdirSync(routesPath).forEach((file) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`./routes/${file}`)(webserver, controller);
  });

  // eslint-disable-next-line no-param-reassign
  controller.webserver = webserver;

  return webserver;
};
