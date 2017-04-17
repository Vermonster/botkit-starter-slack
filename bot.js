require('./build-support/check-node-version');
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ______     ______     ______   __  __     __     ______
 /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
 \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
 \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
 \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


 This is a sample Slack bot built with Botkit.

 This bot demonstrates many of the core features of Botkit:

 * Connect to Slack using the real time API
 * Receive messages based on "spoken" patterns
 * Reply to messages
 * Use the conversation system to ask questions
 * Use the built in storage system to store and retrieve information
 for a user.

 # RUN THE BOT:

 Create a new app via the Slack Developer site:

 -> http://api.slack.com

 Get a Botkit Studio token from Botkit.ai:

 -> https://studio.botkit.ai/

 Run your bot from the command line:

 clientId=<MY SLACK TOKEN> clientSecret=<my client secret> PORT=<3000> studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js

 # USE THE BOT:

 Navigate to the built-in login page:

 https://<myhost.com>/login

 This will authenticate you with Slack.

 If successful, your bot will come online and greet you.


 # EXTEND THE BOT:

 Botkit has many features for building cool and useful bots!

 Read all about it here:

 -> http://howdy.ai/botkit

 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pluginDashbot = require('./components/plugin_dashbot.js');

const usageTip = function() {
  console.log('~~~~~~~~~~');
  console.log('Botkit Starter Kit');
  console.log('Execute your bot application like this:');
  console.log('clientId=<SLACK CLIENT ID> clientSecret=<CLIENT SECRET> PORT=3000 node bot.js');
  console.log('Get Slack app credentials here: https://api.slack.com/apps');
  console.log('Get a Botkit Studio token here: https://studio.botkit.ai/');
  console.log('~~~~~~~~~~');
};

const { clientId, clientSecret, PORT, studio_token, studio_command_uri } = process.env;

if (!clientId || !clientSecret || !PORT) {
  usageTip();
  throw new Error('Specify clientId clientSecret and PORT in environment');
}

const Botkit = require('botkit');
const bindWebserverToController = require('./components/express_webserver.js');
const debug = require('debug')('botkit:main');

// Create the Botkit controller, which controls all instances of the bot.
const controller = Botkit.slackbot({
  clientId,
  clientSecret,
  // debug: true,
  scopes: ['bot'],
  studio_token,
  studio_command_uri,
  json_file_store: `${__dirname}/.db/` // store user data in a simple JSON format
});

controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
bindWebserverToController(controller);

// Set up a simple storage backend for keeping a record of customers
// who sign up for the app via the oauth
require('./components/user_registration.js')(controller);

// Send an onboarding message when a new team joins
require('./components/onboarding.js')(controller);

// no longer necessary since slack now supports the always on event bots
// Set up a system to manage connections to Slack's RTM api
// This will eventually be removed when Slack fixes support for bot presence
// const rtmManager = require('./components/rtm_manager.js')(controller);
//
// // Reconnect all pre-registered bots
// rtmManager.reconnect();

// Enable Dashbot.io plugin
pluginDashbot(controller);


const normalizedPath = path.join(__dirname, 'skills');
fs.readdirSync(normalizedPath).forEach((file) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(`./skills/${file}`)(controller);
});


// This captures and evaluates any message sent to the bot as a DM
// or sent to the bot in the form "@bot message" and passes it to
// Botkit Studio to evaluate for trigger words and patterns.
// If a trigger is matched, the conversation will automatically fire!
// You can tie into the execution of the script using the functions
// controller.studio.before, controller.studio.after and controller.studio.validate
if (process.env.studio_token) {
  controller.on('direct_message,direct_mention,mention', (bot, message) => {
    controller.studio.runTrigger(bot, message.text, message.user, message.channel).then((convo) => {
      if (!convo) {
        // no trigger was matched
        // If you want your bot to respond to every message,
        // define a 'fallback' script in Botkit Studio
        // and uncomment the line below.
        // controller.studio.run(bot, 'fallback', message.user, message.channel);
      } else {
        // set variables here that are needed for EVERY script
        // use controller.studio.before('script') to set variables specific to a script
        convo.setVar('current_time', new Date());
      }
    }).catch((err) => {
      bot.reply(message, `I experienced an error with a request to Botkit Studio: ${err}`);
      debug('Botkit Studio: ', err);
    });
  });
} else {
  console.log('~~~~~~~~~~');
  console.log('NOTE: Botkit Studio functionality has not been enabled');
  console.log('To enable, pass in a studio_token parameter with a token from https://studio.botkit.ai/');
}
