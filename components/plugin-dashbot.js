const Dashbot = require('dashbot');

module.exports = function(controller) {
  // Dashbot is a turnkey analytics platform for bots.
  // Sign up for a free key here: https://www.dashbot.io/ to see your bot analytics in real time.
  const dashbotKey = process.env.DASHBOT_API_KEY;
  if (dashbotKey) {
    const dashbot = Dashbot(dashbotKey).slack;
    controller.middleware.receive.use(dashbot.receive);
    controller.middleware.send.use(dashbot.send);
    const hasKeyMsg = 'Thanks for using Dashbot. Visit https://www.dashbot.io/ to see your bot analytics in real time.';
    controller.log.info(hasKeyMsg);
  } else {
    let noKeyMsg = 'No DASHBOT_API_KEY specified. \n';
    noKeyMsg += 'For free turnkey analytics for your bot, go to https://www.dashbot.io/ to get your key.';
    controller.log.info(noKeyMsg);
  }
};
