/**
 * Created by mehamasum on 6/30/2017.
 */
const TAG = "meha, exam.js: ";

var Util = require("../components/util.js");

module.exports = function(controller) {
    controller.hears(['add exam', 'set exam'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET");
    });


    controller.hears(['update exam', 'edit exam'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "EDIT");
    });

    controller.hears(['delete exam'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "DELETE");
    });


    controller.hears(['exam'], 'direct_message', function(bot, message) {
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

    var nameQ = 'Enter a name i.e. `Midterm #1` or `quit` to abort';
    var descQ = 'Enter a description i.e. `On chapter 1 to 6` or `quit` to abort';
    var timeQ = 'Enter the date in YYYY-MM-DD HH-MM format i.e. `2017-12-12 10:00` or `quit` to abort';
    if(due) {
        nameQ += "  \n  \n*Current: "+due.name+"*";
        descQ += "  \n  \n*Current: "+due.description+"*";
        timeQ += "  \n  \n*Current: "+due.time+"*";
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

                            convo.ask(timeQ, [
                                {
                                    pattern:  'quit',
                                    callback: function(response, convo) {
                                        convo.say('Aborted');
                                        convo.next();
                                    }
                                },
                                {
                                    pattern:  new RegExp(/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]$/),
                                    callback: function(response, convo) {

                                        /// this is time
                                        var time = response.text;

                                        var notif ='New exam date has been added:  \n**'+name+'**  \n'+description+'  \nDate: '+time;

                                        // save it
                                        if(due) {
                                            notif = 'Exam '+ due.name+' has been updated:  \n**'+name+'**  \n'+description+'  \nDate: '+time;

                                            // update
                                            controller.storage.channels.get(room.id, function (err, room) {
                                                if (room) {
                                                    room.details.exam[idx]= {name: name, description: description, time: time};
                                                    controller.storage.channels.save(room, function (err, id) {
                                                        if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                                    });
                                                }
                                            });

                                        }
                                        else {
                                            controller.storage.channels.get(room.id, function (err, room) {
                                                if (room) {

                                                    if(!room.details.exam) room.details.exam = [];

                                                    room.details.exam.push({name: name, description: description, time: time});

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
                                                var offset_str = null;
                                                if (room.details.timezone) {
                                                    offset_str = room.details.timezone;
                                                }
                                                var btns = Util.buildCalendarNew(room.details.title, name, description, time, offset_str);
                                                notif += "  \n📆 "+ btns[0]+" "+ btns[1]+" "+btns[2]+" "+ btns[3]+"  \n  \n";
                                                bot.reply({channel: room.id}, notif);
                                            }
                                        });

                                        convo.say('Saved exam');
                                        convo.next();
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
                            ]);

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
                        if(room.details.exam && room.details.exam.length>0) {
                            var dues = room.details.exam;

                            var choice = "Which exam? Reply with the number i.e. `1`, `2` etc. or `quit` to abort  \n";
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
                                                room.details.exam = dues;
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
                            convo.say("No exam found");
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
                    if(room.details.exam && room.details.exam.length>0) {

                        var dues = room.details.exam;

                        var offset = 0, offset_str=null;
                        if(room.details.timezone) {
                            offset_str = room.details.timezone;
                            offset = parseFloat(room.details.timezone);
                        }

                        // create Date object for current location
                        var d = new Date();

                        // convert to msec
                        // subtract local time zone offset
                        // get UTC time in msec
                        var utc = d.getTime() - (d.getTimezoneOffset() * 60000);

                        // create new Date object for different city
                        // using supplied offset
                        var nd = new Date(utc + (3600000*offset));


                        // TODO: add to cal
                        var choice = "**Upcoming exams:**  \n";
                        var cnt = 0;
                        for(var idk= 0; idk<dues.length; idk++) {

                            var given = new Date(dues[idk].time);

                            //console.log(JSON.stringify(given)+"\n\n"+JSON.stringify(nd));

                            if(given.getTime() >= nd.getTime()) {
                                cnt++;
                                choice += "**"+ cnt + ". " + dues[idk].name +"**  \n"+dues[idk].description+"  \n"+"Date: "+dues[idk].time+"  \n";
                            }
                        }

                        convo.say(choice);
                    }
                    else {
                        convo.say("No exam found");
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