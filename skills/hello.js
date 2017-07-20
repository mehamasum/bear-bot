module.exports = function(controller) {

// DM convo
// start
    controller.hears(['hi', 'hello', 'howdy', 'hey'], 'direct_message', function (bot, message) {
        bot.reply(message, 'Hi there 👋 Type `help` to get a list of available commands.');
    });

};