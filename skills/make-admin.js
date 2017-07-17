/**
 * Created by mehamasum on 7/17/2017.
 */
const TAG = "meha, make_admin.js: ";
module.exports = function(controller) {
    controller.hears('make admin', 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET");
    });
    controller.hears('remove admin', 'direct_message', function(bot, message) {
        handel(controller, bot, message, "DELETE");
    });
    controller.hears(['admin', 'status'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "GET");
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

                        // console.log("%d => "+ JSON.stringify(response));
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

        if(method==="SET" || method==="DELETE") {

            var teach = false;
            var confirm = "Removed admin privileges";
            if(method==="SET") {
                teach = true;
                confirm = "Set as Admin";
            }

            if (room.teacher) {
                convo.ask('Enter the email address of the person or `quit` to abort', [
                    {
                        pattern:  'quit',
                        callback: function(response, convo) {
                            convo.say('Aborted');
                            convo.next();
                        }
                    },
                    {
                        pattern:  new RegExp(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i),
                        callback: function(response, convo) {
                            // this is the email
                            var input_email = response.text;

                            // no change to room, only extract personId
                            controller.storage.channels.get(room.id, function (err, room) {
                                if (room) {
                                    var mems = room.details.members;
                                    mems.forEach(function (element) {
                                        if(element.personEmail===input_email) {
                                            var found = element.id;

                                            // change in person
                                            controller.storage.users.get(found, function(err, user_data) {
                                                var his_rooms = user_data.details.rooms;
                                                for(var j=0; j<his_rooms.length; j++) {
                                                    if (his_rooms[j].id === room.id) {

                                                        his_rooms[j].teacher = teach;
                                                        break;
                                                    }
                                                }

                                                user_data.details.rooms = his_rooms;
                                                controller.storage.users.save(user_data, function (err, id) {
                                                    if (err) console.error(TAG+ "controller.storage.user.save not working");
                                                });
                                            });
                                        }
                                    });
                                }
                            });

                            convo.say(confirm);
                            convo.next();
                        }
                    },
                    {
                        default: true,
                        callback: function(response, convo) {
                            convo.repeat();
                            convo.next();
                        }
                    }

                ]);
            }
            else { //student
                convo.say("Sorry. You are not authorized to set this information");
            }
        }
        else if(method==="GET") {
            if (room.teacher) {
                convo.say("Admin Status: You have admin privileges");
            }
            else { //student
                convo.say("Admin Status: You **do not** have admin privileges");
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