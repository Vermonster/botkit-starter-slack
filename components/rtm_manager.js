const debug = require('debug')('botkit:rtm_manager');

module.exports = function(controller) {
  const managedBots = {};

  // The manager object exposes some useful tools for managing the RTM
  const manager = {
    start(bot) {
      if (managedBots[bot.config.token]) {
        debug('Start RTM: already online');
      } else {
        bot.startRTM((err, rtmBot) => {
          if (err) {
            debug('Error starting RTM:', err);
          } else {
            managedBots[rtmBot.config.token] = rtmBot.rtm;
            debug('Start RTM: Success');
          }
        });
      }
    },
    stop(bot) {
      if (managedBots[bot.config.token]) {
        if (managedBots[bot.config.token].rtm) {
          debug('Stop RTM: Stopping bot');
          managedBots[bot.config.token].closeRTM();
        }
      }
    },
    remove(bot) {
      debug('Removing bot from manager');
      delete managedBots[bot.config.token];
    },
    reconnect() {
      debug('Reconnecting all existing bots...');
      controller.storage.teams.all((err, list) => {
        if (err) {
          throw new Error('Error: Could not load existing bots:', err);
        } else {
          list.forEach(team => manager.start(controller.spawn(team.bot)));
        }
      });
    }
  };

  // Capture the rtm:start event and actually start the RTM...
  controller.on('rtm:start', (config) => {
    const bot = controller.spawn(config);
    manager.start(bot);
  });

  //
  controller.on('rtm_close', (bot) => {
    manager.remove(bot);
  });

  return manager;
};
