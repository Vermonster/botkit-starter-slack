const debug = require('debug')('botkit:incoming_webhooks');

const HTTP_STATUS_OK = 200;

module.exports = function(webserver, controller) {
  debug('Configured /slack/receive url');
  webserver.post('/slack/receive', (req, res) => {
    // NOTE: we should enforce the token check here

    // respond to Slack that the webhook has been received.
    res.status(HTTP_STATUS_OK);

    // Now, pass the webhook into be processed
    controller.handleWebhookPayload(req, res);
  });
};
