/**
 * Created by mehamasum on 6/30/2017.
 */
const TAG = "meha, news.js: ";

var Util = require("../components/util.js");

module.exports = function(controller) {
    controller.hears(['add news', 'set news'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET");
    });


    controller.hears(['update news', 'edit news'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "EDIT");
    });

    controller.hears(['delete news'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "DELETE");
    });


    controller.hears(['news'], 'direct_message', function(bot, message) {
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

function form(controller, bot, convo, room, idx, due) {

    var nameQ = 'Enter a title i.e. `Class schedule is changing for 20th August` or `quit` to abort';
    var descQ = 'Enter a description i.e. `New schedule: MTF 10am-11am, details here: foo.bar` or `quit` to abort';
    if(due) {
        nameQ += "  \n  \n*Current: "+due.name+"*";
        descQ += "  \n  \n*Current: "+due.description+"*";
    }

    convo.ask(nameQ, [
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
                // this is the name string
                var name = response.text;
                convo.ask(descQ, [
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
                            // this is the description string
                            var description = response.text;

                            var notif ='Notice:  \n**'+name+'**  \n'+description+'  \n';

                            // save it
                            if(due) {
                                notif = 'Notice '+ due.name+' has been updated:  \n**'+name+'**  \n'+description+'  \n';

                                // update
                                controller.storage.channels.get(room.id, function (err, room) {
                                    if (room) {
                                        room.details.news[idx]= {name: name, description: description};
                                        controller.storage.channels.save(room, function (err, id) {
                                            if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                        });
                                    }
                                });

                            }
                            else {
                                controller.storage.channels.get(room.id, function (err, room) {
                                    if (room) {

                                        if(!room.details.news) room.details.news = [];

                                        room.details.news.push({name: name, description: description});

                                        controller.storage.channels.save(room, function (err, id) {
                                            if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                        });
                                    }
                                });
                            }

                            // notify everyone
                            // TODO calendar
                            // get from room
                            controller.storage.channels.get(room.id, function (err, room) {
                                if (room) {
                                    bot.reply({channel: room.id}, notif);
                                }
                            });

                            convo.say('Saved news');

                            convo.next();
                        }
                    }
                ]);

                convo.next();
            }
        }
    ]);
}

function roomSelected(controller, bot, convo, method, opt, rooms) {
    if(opt>=1 && opt<=rooms.length) {

        var room = rooms[opt-1];

        if(method==="SET" || method==="EDIT" || method==="DELETE") {
            if (room.teacher) {

                if(method==="SET") {
                    form(controller, bot, convo, room, null, null);
                }


                else if(method==="EDIT" || method==="DELETE" ) {
                    // get from room
                    controller.storage.channels.get(room.id, function (err, room) {
                        if(room.details.news && room.details.news.length>0) {
                            var dues = room.details.news;

                            var choice = "Which news? Reply with the number i.e. `1`, `2` etc. or `quit` to abort  \n";
                            for(var idp= 0; idp<dues.length; idp++) {
                                choice += (idp+1) + ". " + dues[idp].name +"  \n";
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
                                        var optdue = parseInt(response.text);

                                        if(optdue>=1 && optdue<=dues.length) {

                                            var due = dues[optdue-1];

                                            if(method==="EDIT") {
                                                form(controller, bot, convo, room, optdue-1, due);
                                            }
                                            else if(method==="DELETE") {
                                                Util.deleteItemFromArray(dues, optdue-1);
                                                convo.say("Deleted");
                                                room.details.news = dues;
                                                controller.storage.channels.save(room, function (err, id) {
                                                    if (err) console.error(TAG+ "controller.storage.channels.save not working");
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
                        }
                        else {
                            convo.say("No news found");
                        }
                    });
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
                    if(room.details.news && room.details.news.length>0) {

                        var dues = room.details.news;

                        // TODO: add to cal
                        var choice = "**News/Notices:**  \n";
                        var cnt = 0;
                        for(var idk= 0; idk<dues.length; idk++) {
                            cnt++;
                            choice += "**"+ cnt + ". " + dues[idk].name +"**  \n"+dues[idk].description+"  \n";
                        }

                        convo.say(choice);
                    }
                    else {
                        convo.say("No news found");
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