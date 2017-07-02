/**
 * Created by mehamasum on 6/30/2017.
 */

module.exports = function(controller) {
// reply to a direct mention - @bot hello
// must be from a group convo

    controller.on('direct_mention', function (bot, message) {
        // reply to _message_ by using the _bot_ object
        bot.reply(message, 'Sorry. I only talk in a **personal conversation**!');
    });

}