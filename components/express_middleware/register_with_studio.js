const request = require('request');
const debug = require('debug')('botkit:register_with_studio');

const DEFAULT_COMMAND_URI = 'https://studio.botkit.ai';

module.exports = function(webserver, controller) {
  let registeredThisSession = false;
  const { studio_token: studioToken, studio_command_uri: studioCommandUri = DEFAULT_COMMAND_URI } = controller.config;

  if (webserver && studioToken) {
    webserver.use((req, res, next) => {
      if (!registeredThisSession) {
        // get URL from the request
        const host = req.get('host');

        // information about this instance of Botkit
        // send to Botkit Studio in order to display in the hosting tab
        const instance = {
          url: host,
          version: controller.version(),
          ts: new Date()
        };

        request({
          method: 'post',
          uri: `${studioCommandUri}/api/v1/bots/phonehome?access_token=${studioToken}`,
          form: instance
        }, (registerError, registerResponse, body) => {
          registeredThisSession = true;

          if (registerError) {
            debug('Error registering instance with Botkit Studio', registerError);
          } else {
            let json = null;
            try {
              json = JSON.parse(body);
            } catch (jsonParseError) {
              debug('Error registering instance with Botkit Studio', jsonParseError);
            }

            if (json) {
              if (json.error) {
                debug('Error registering instance with Botkit Studio', json.error);
              }
            }
          }
        });
      }
      next();
    });
  }
};
