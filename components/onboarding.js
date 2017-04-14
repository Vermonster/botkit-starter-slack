const debug = require('debug')('botkit:onboarding');

module.exports = function(controller) {
  controller.on('onboard', (bot) => {
    debug('Starting an onboarding experience!');

    if (controller.config.studio_token) {
      bot.api.im.open({ user: bot.config.createdBy }, (onboardError, directMessage) => {
        if (onboardError) {
          debug('Error sending onboarding message:', onboardError);
        } else {
          controller.studio.run(bot, 'onboarding', bot.config.createdBy, directMessage.channel.id).catch((err) => {
            debug('Error: encountered an error loading onboarding script from Botkit Studio:', err);
          });
        }
      });
    } else {
      bot.startPrivateConversation({ user: bot.config.createdBy }, (startConvoError, convo) => {
        if (startConvoError) {
          console.log(startConvoError);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });
    }
  });
};
