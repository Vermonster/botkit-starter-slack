const debug = require('debug')('botkit:user_registration');

const createNewTeam = function({ identity: { team_id, user_id, url, team } }) {
  return {
    id: team_id,
    createdBy: user_id,
    url,
    name: team
  };
};

const createNewBot = function({ bot: { bot_access_token, bot_user_id }, identity: { user_id }, access_token }) {
  return {
    token: bot_access_token,
    user_id: bot_user_id,
    createdBy: user_id,
    app_token: access_token
  };
};

module.exports = function(controller) {
  /* Handle event caused by a user logging in with oauth */
  controller.on('oauth:success', (payload) => {
    debug('Got a successful login!', payload);
    if (!payload.identity.team_id) {
      debug('Error: received an oauth response without a team id', payload);
    }
    controller.storage.teams.get(payload.identity.team_id, (loadError, team) => {
      if (loadError) {
        debug('Error: could not load team from storage system:', payload.identity.team_id, loadError);
      }

      const isNewTeam = !team;
      const currentTeam = team || createNewTeam(payload);
      currentTeam.bot = createNewBot(payload);

      debug('isNewTeam: ', isNewTeam);
      debug('currentTeam: ', currentTeam);

      const testbot = controller.spawn(currentTeam.bot);

      testbot.api.auth.test({}, (authError, botAuth) => {
        if (authError) {
          debug('Error: could not authenticate bot user', authError);
        } else {
          currentTeam.bot.name = botAuth.user;

          // add in info that is expected by Botkit
          testbot.identity = botAuth;
          testbot.team_info = currentTeam;

          // Replace this with your own database!

          controller.storage.teams.save(currentTeam, (saveError, _id) => {
            if (saveError) {
              debug('Error: could not save team record:', saveError);
            } else if (isNewTeam) {
              controller.trigger('create_team', [testbot, currentTeam]);
            } else {
              controller.trigger('update_team', [testbot, currentTeam]);
            }
          });
        }
      });
    });
  });


  controller.on('create_team', (bot, team) => {
    debug('Team created:', team);

    // Trigger an event that will establish an RTM connection for this bot
    controller.trigger('rtm:start', [bot.config]);

    // Trigger an event that will cause this team to receive onboarding messages
    controller.trigger('onboard', [bot, team]);
  });


  controller.on('update_team', (bot, team) => {
    debug('Team updated:', team);
    // Trigger an event that will establish an RTM connection for this bot
    controller.trigger('rtm:start', [bot]);
  });
};
