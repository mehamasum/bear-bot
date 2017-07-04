/**
 * Created by mehamasum on 6/30/2017.
 */

const TAG = "meha, poll.js: ";


module.exports = function(controller) {
    controller.hears(['add poll', 'set poll', 'create poll', 'new poll'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET");
    });

    controller.hears(['delete poll'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "DELETE");
    });

    controller.hears(['poll'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "GET"); // student only
    });

    controller.hears(['result'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "RESULT"); // teacher only
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
                roomSelected(person, controller, bot, convo, method, 1, rooms);
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
                        roomSelected(person, controller, bot, convo, method, opt, rooms);

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

function roomSelected(person, controller, bot, convo, method, opt, rooms) {
    if(opt>=1 && opt<=rooms.length) {

        var room = rooms[opt-1];

        if(method==="SET" || method==="DELETE" || method==="RESULT") {
            if (room.teacher) {

                if(method==="SET") {
                    convo.ask('Enter the poll question i.e. `Which day do you prefer?` or `quit` to abort', [
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
                                // this is the question

                                var ques = response.text;
                                convo.ask('Enter the options separated by semicolon i.e. `Sunday; Monday; Tuesday` or `quit` to abort', [
                                    {
                                        pattern:  'quit',
                                        callback: function(response, convo) {
                                            convo.say('Aborted');
                                            convo.next();
                                        }
                                    },
                                    {
                                        pattern: new RegExp(/(( *).+( *))(;( *).+( *))*/),
                                        callback: function(response, convo) {
                                            // this is the options

                                            var opts = response.text;
                                            var n = opts.split(";").length;

                                            // add to room
                                            controller.storage.channels.get(room.id, function (err, room) {
                                                if (room) {
                                                    room.details.poll = { question: ques, options: opts, votes: new Array(n), voters:[]} ;
                                                    controller.storage.channels.save(room, function (err, id) {
                                                        if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                                    });
                                                }
                                            });

                                            // notify everyone
                                            bot.reply({channel: room.id}, 'New poll!  \nType `poll` in a **personal conversation** to respond');

                                            // done
                                            convo.say('Poll set');
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
                }
                else if(method==="DELETE") {
                    // delete from room
                    controller.storage.channels.get(room.id, function (err, room) {
                        if (room) {
                            room.details.poll = null;
                            controller.storage.channels.save(room, function (err, id) {
                                if (err) console.error(TAG+ "controller.storage.channels.save not working");
                            });
                        }
                    });

                    // done
                    convo.say('Poll deleted');
                    convo.next();
                }
                else if(method==="RESULT") {
                    // TODO ux

                    controller.storage.channels.get(room.id, function (err, room) {
                        if (room) {
                            if(room.details.poll && room.details.poll.votes) {
                                var opts = room.details.poll.options.split(";");
                                var vote_arr = room.details.poll.votes;
                                var tol = room.details.poll.voters.length;
                                var res = "Total response:  "+ tol +"\n";
                                for (var k = 0; k<opts.length; k++) {
                                    if (vote_arr[k]) {
                                        res += "* "+ opts[k] + ": " + vote_arr[k] + " vote(s) *"+ (vote_arr[k]/tol*100).toFixed(2) +"%*  \n";
                                    }
                                }
                                convo.say(res);
                            }
                            else {
                                convo.say("No votes yet");
                            }
                        }
                    });
                }
            }
            else { //student
                convo.say("Sorry. You are not authorized to set this information");
            }
        }
        else if(method==="GET") {

            if (room.teacher) {
                convo.say("Students only");
            }
            else { //student
                // get from room
                controller.storage.channels.get(room.id, function (err, room) {
                    if (room) {
                        if(room.details.poll) {
                            // TODO ux, check already voted

                            var q = room.details.poll;
                            if(contains(q.voters, person)) {
                                convo.say("You already answered!");
                            }
                            else {

                                var opts = room.details.poll.options.split(";");
                                var voteQ = "**"+room.details.poll.question +"**  \n";
                                voteQ += "Reply with the number i.e. `1`, `2` etc. or `quit` to abort  \n  \n";
                                for(var idt= 0; idt<opts.length; idt++) {
                                    voteQ += (idt+1) + ". " + opts[idt] +"  \n";
                                }

                                convo.addQuestion(voteQ,[
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
                                            var vote = parseInt(response.text);
                                            if (vote >= 1 && vote <= opts.length) {

                                                convo.say("Answer recorded!");

                                                q.voters.push(person);

                                                var picked = vote - 1;
                                                if(q.votes[picked])
                                                    q.votes[picked] += 1;
                                                else
                                                    q.votes[picked] = 1;

                                                room.details.poll = q;
                                                controller.storage.channels.save(room, function (err, id) {
                                                    if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                                });

                                            }
                                            else {
                                                convo.repeat();
                                            }
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
                                ],{},'default');


                            }
                        }
                        else {
                            convo.say("No active poll found!");
                        }
                    }
                });
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

function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}