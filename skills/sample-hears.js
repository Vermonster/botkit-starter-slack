/*

 WHAT IS THIS?

 This module demonstrates simple uses of Botkit's `hears` handler functions.

 In these examples, Botkit is configured to listen for certain phrases, and then
 respond immediately with a single line response.

 */

const wordfilter = require('wordfilter');

const SECONDS_IN_A_MINUTE = 60;
const MINUTES_IN_AN_HOUR = 60;

const formatUptime = function(uptimeSeconds) {
  let uptime = uptimeSeconds;
  let unit = 'second';
  if (uptime > SECONDS_IN_A_MINUTE) {
    uptime /= SECONDS_IN_A_MINUTE;
    unit = 'minute';
  }
  if (uptime > MINUTES_IN_AN_HOUR) {
    uptime /= MINUTES_IN_AN_HOUR;
    unit = 'hour';
  }
  if (uptime !== 1) {
    unit = `${unit}s`;
  }
  return `${parseInt(uptime, 10)} ${unit}`;
};

module.exports = function(controller) {
  /* Collect some very simple runtime stats for use in the uptime/debug command */
  const stats = {
    triggers: 0,
    convos: 0
  };

  controller.on('heard_trigger', () => {
    stats.triggers += 1;
  });

  controller.on('conversationStarted', () => {
    stats.convos += 1;
  });

  controller.hears(['^uptime', '^debug'], 'direct_message,direct_mention', (bot, message) => {
    bot.createConversation(message, (err, convo) => {
      if (!err) {
        convo.setVar('uptime', formatUptime(process.uptime()));
        convo.setVar('convos', stats.convos);
        convo.setVar('triggers', stats.triggers);
        let uptimeMessage = 'My main process has been online for {{vars.uptime}}.\n';
        uptimeMessage += 'Since booting, I have heard {{vars.triggers}} triggers, ';
        uptimeMessage += 'and conducted {{vars.convos}} conversations.';
        convo.say(uptimeMessage);
        convo.activate();
      }
    });
  });

  controller.hears(['^say (.*)', '^say'], 'direct_message,direct_mention', (bot, message) => {
    if (message.match[1]) {
      if (!wordfilter.blacklisted(message.match[1])) {
        bot.reply(message, message.match[1]);
      } else {
        bot.reply(message, '_sigh_');
      }
    } else {
      bot.reply(message, 'I will repeat whatever you say.');
    }
  });
};
