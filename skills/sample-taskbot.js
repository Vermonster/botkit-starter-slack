/*

 This is a sample bot that provides a simple todo list function
 and demonstrates the Botkit storage system.

 Botkit comes with a generic storage system that can be used to
 store arbitrary information about a user or channel. Storage
 can be backed by a built in JSON file system, or one of many
 popular database systems.

 See:

 botkit-storage-mongo
 botkit-storage-firebase
 botkit-storage-redis
 botkit-storage-dynamodb
 botkit-storage-mysql

 */

const createNewUser = function({ user }) {
  return {
    id: user,
    tasks: []
  };
};

module.exports = function(controller) {
  // simple function to generate the text of the task list so that
  // it can be used in various places
  const formatTasks = (text, taskItem, index) => `${text}> \`${index + 1}\`) ${taskItem}\n`;
  const generateTaskList = user => user.tasks.reduce(formatTasks, '');

  // listen for someone saying 'tasks' to the bot
  // reply with a list of current tasks loaded from the storage system
  // based on this user's id
  controller.hears(['tasks', 'todo'], 'direct_message', (bot, message) => {
    // load user from storage...
    controller.storage.users.get(message.user, (err, user) => {
      // user object can contain arbitary keys. we will store tasks in .tasks
      if (!user || !user.tasks || user.tasks.length === 0) {
        bot.reply(message, 'There are no tasks on your list. Say `add _task_` to add something.');
      } else {
        let text = `Here are your current tasks: \n${generateTaskList(user)}`;
        text += 'Reply with `done _number_` to mark a task completed.';
        bot.reply(message, text);
      }
    });
  });

  // listen for a user saying "add <something>", and then add it to the user's list
  // store the new list in the storage system
  controller.hears(['add (.*)'], 'direct_message,direct_mention,mention', (bot, message) => {
    const newtask = message.match[1];
    controller.storage.users.get(message.user, (getUserError, user) => {
      const currentUser = user || createNewUser(message);

      currentUser.tasks.push(newtask);

      controller.storage.users.save(currentUser, (saveTaskError, _saved) => {
        if (saveTaskError) {
          bot.reply(message, `I experienced an error adding your task: ${saveTaskError}`);
        } else {
          bot.api.reactions.add({
            name: 'thumbsup',
            channel: message.channel,
            timestamp: message.ts
          });
        }
      });
    });
  });

  // listen for a user saying "done <number>" and mark that item as done.
  controller.hears(['done (.*)'], 'direct_message', (bot, message) => {
    const taskNumber = message.match[1];
    if (isNaN(taskNumber)) {
      bot.reply(message, 'Please specify a number.');
    } else {
      const taskIndex = parseInt(taskNumber, 10) - 1;
      controller.storage.users.get(message.user, (getUserError, user) => {
        const currentUser = user || createNewUser(message);

        if (taskIndex < 0 || taskIndex >= currentUser.tasks.length) {
          let replyMessage = 'Sorry, your input is out of range.\n';
          replyMessage += `Right now there are ${currentUser.tasks.length} items on your list.`;
          bot.reply(message, replyMessage);
        } else {
          const taskItem = currentUser.tasks.splice(taskIndex, 1);

          // reply with a strikethrough message...
          bot.reply(message, `~${taskItem}~`);

          if (currentUser.tasks.length > 0) {
            bot.reply(message, `Here are our remaining tasks:\n${generateTaskList(currentUser)}`);
          } else {
            bot.reply(message, 'Your list is now empty!');
          }
        }
      });
    }
  });
};
