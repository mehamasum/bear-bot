/**
 * Created by mehamasum on 6/30/2017.
 */

const TAG = "meha, office_hour.js: ";


module.exports = function(controller) {
    controller.hears(['set resources'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET");
    });

    controller.hears(['delete resources'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "DELETE");
    });

    controller.hears(['resources'], 'direct_message', function(bot, message) {
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
            if (room.teacher) {

                if(method==="SET") {
                    convo.ask('Enter the link of Course Resources page or `quit` to abort', [
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

                                // add to room
                                controller.storage.channels.get(room.id, function (err, room) {
                                    if (room) {
                                        room.details.resources = response.text;
                                        controller.storage.channels.save(room, function (err, id) {
                                            if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                        });
                                    }
                                });

                                // notify everyone
                                bot.reply({channel: room.id}, 'New link of Course Resources has been set to '+ response.text+'  \nType `office hours` in a **personal conversation** to query later');

                                // done
                                convo.say('Resource link set');
                                convo.next();
                            }
                        }
                    ]);
                }
                else if(method==="DELETE") {
                    // delete from room
                    controller.storage.channels.get(room.id, function (err, room) {
                        if (room) {
                            room.details.resources = null;
                            controller.storage.channels.save(room, function (err, id) {
                                if (err) console.error(TAG+ "controller.storage.channels.save not working");
                            });

                            //notify everyone
                            bot.reply({channel: room.id}, 'Link of Course Resources has been removed');
                        }
                    });

                    // done
                    convo.say('Resource link deleted');
                    convo.next();
                }
            }
            else { //student
                convo.say("Sorry. You are not authorized to set this information");
            }
        }
        else if(method==="GET") {
            // get from room
            controller.storage.channels.get(room.id, function (err, room) {
                if (room) {
                    if(room.details.resources) {
                        convo.say(room.details.resources);
                    }
                    else {
                        convo.say("Link of the Course Resources is not set");
                    }
                }
            });
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