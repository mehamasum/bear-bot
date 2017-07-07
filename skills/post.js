/**
 * Created by mehamasum on 6/30/2017.
 */
const TAG = "meha, post.js: ";
var wordfilter = require('wordfilter');

module.exports = function(controller) {
    controller.hears(['post'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET");
    });
};

function handel(controller, bot, message, method) {
    var person = message.original_message.personId;
    controller.storage.users.get(person, function(err, user) {
        if (!user) {
            bot.reply(message, "Sorry. We don't share a classroom!");
            return;
        }

        var rooms = user.details.rooms;

        if(rooms.length===1) {
            bot.startConversation(message, function(err,convo) {
                roomSelected(controller, bot, convo, method, 1, rooms);
            });
            return;
        }

        // start a conversation to handle this response.
        bot.startConversation(message, function(err,convo) {

            var choice = "";
            choice += "For which class?  \nReply with the number i.e. `1`, `2` etc. or `quit` to abort  \n  \n";
            for(var idy= 0; idy<rooms.length; idy++) {
                choice += (idy+1) + ". " + rooms[idy].title +"  \n";
            }

            convo.addQuestion(choice,[
                {
                    pattern: 'quit',
                    callback: function(response,convo) {
                        convo.say('Aborted');
                        convo.next();
                    }
                },
                {
                    pattern: new RegExp(/^\d+$/),
                    callback: function(response,convo) {

                        var opt = parseInt(response.text);
                        roomSelected(controller, bot, convo, method, opt, rooms);

                    }
                },
                {
                    default: true,
                    callback: function(response,convo) {
                        // just repeat the question
                        convo.repeat();
                        convo.next();
                    }
                }
            ],{},'default');

        })

    });
}

function roomSelected(controller, bot, convo, method, opt, rooms) {
    if(opt>=1 && opt<=rooms.length) {

        var room = rooms[opt-1];

        if(method==="SET") {
            if (!room.teacher) {
                convo.ask('Write your message or `quit` to abort', [
                    {
                        pattern:  'quit',
                        callback: function(response, convo) {
                            convo.say('Aborted');
                            convo.next();
                        }
                    },
                    {
                        default: true,
                        callback: function(response, convo) {
                            // this is the post string

                            // post
                            if (!wordfilter.blacklisted(response.text)) {
                                bot.reply({channel: room.id}, '**Anonymous Student:**  \n'+ response.text);
                                convo.say('Posted anonymously!');
                            } else {
                                convo.say('Post blocked due to offensive language');
                            }

                            convo.next();
                        }
                    }
                ]);
            }
            else { //teacher
                convo.say("Sorry. Students only");
            }
        }
        convo.next();
    }
    else {
        convo.say("Pick a number from the list!");
        // just repeat the question
        convo.repeat();
        convo.next();
    }
}