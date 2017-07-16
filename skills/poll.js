/**
 * Created by mehamasum on 6/30/2017.
 */

const TAG = "meha, poll.js: ";
var mammoth = require("mammoth");
var fs = require('fs');
var request = require('request');
var randomstring = require("randomstring");
var env = require('node-env-file');
env(__dirname + '/../.env');


module.exports = function(controller) {
    controller.hears(['add poll with tex', 'set poll with tex', 'create poll with tex', 'new poll with tex'], 'direct_message', function(bot, message) {
        handel(controller, bot, message, "SET_TEX");
    });

    controller.hears(['add poll', 'set poll', 'create poll', 'new poll'], 'direct_message', function(bot, message) {
        if (message.original_message.files) {
            // could be an latex or normal file
            handel(controller, bot, message, "FILE");
        }
        else {
            handel(controller, bot, message, "SET");
        }
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
    var file = null;
    if(method==="FILE")
        file = message.original_message.files[0];

    controller.storage.users.get(person, function(err, user) {
        if (!user) {
            bot.reply(message, "Sorry. We don't share a classroom!");
            return;
        }

        var rooms = user.details.rooms;

        if(rooms.length===1) {
            bot.startConversation(message, function(err,convo) {
                if(method==="FILE") {
                    roomSelectedForFileParsing(person, controller, bot, convo, method, 1, rooms, file);
                }
                else {
                    roomSelected(person, controller, bot, convo, method, 1, rooms);
                }
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

                        if(method==="FILE") {
                            roomSelectedForFileParsing(person, controller, bot, convo, method, opt, rooms, file);
                        }
                        else {
                            roomSelected(person, controller, bot, convo, method, opt, rooms);
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

        })

    });
}

function roomSelected(person, controller, bot, convo, method, opt, rooms) {
    if(opt>=1 && opt<=rooms.length) {

        var my_room = rooms[opt-1];

        if(method==="SET" || method==="SET_TEX" || method==="DELETE" || method==="RESULT") {
            if (my_room.teacher) {

                if(method==="SET" || method==="SET_TEX") {

                    var tex_in = false;

                    var qQ = 'Enter the poll question i.e. `Which day do you prefer?` or `quit` to abort';
                    var oQ = 'Enter the options separated by semicolon i.e. `Sunday; Monday; Tuesday` or `quit` to abort';

                    if(method==="SET_TEX") {
                        tex_in = true;

                        var tip = '**Remember**: This question will be parsed as Tex data, ' +
                            '  \n- Use a backslash followed by a space to render a space' +
                            '  \n- Use two backslashes for a new line'+
                            '  \nGet help [here](https://www.codecogs.com/latex/eqneditor.php)'
                        ;

                        qQ = 'Enter the poll question in Tex or `quit` to abort  \n' + tip;
                        qQ += "  \ni.e: `What\\ is\\ the\\ value\\ of\\int H(x,x')\\psi(x')dx'?`";

                        oQ = 'Enter the options in Tex **separated by semicolon** or `quit` to abort  \n' + tip;
                        oQ += "  \ni.e: `+V(x)\psi(x); -V(x)\psi(x); None\\ of\\ them`";
                    }

                    convo.ask(qQ, [
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
                                convo.ask(oQ, [
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
                                            controller.storage.channels.get(my_room.id, function (err, room) {
                                                if (room) {
                                                    room.details.poll = { question: ques, tex: tex_in, options: opts, votes: new Array(n), voters:[]} ;
                                                    controller.storage.channels.save(room, function (err, id) {
                                                        if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                                    });
                                                }
                                            });

                                            // notify everyone
                                            bot.reply({channel: my_room.id}, 'New poll!  \nType `poll` in a **personal conversation** to respond');

                                            // done
                                            var confirmation = 'Poll set!';
                                            //if(method==="SET")
                                            confirmation+= "  \n[Download]("+ make_url(controller, ques, opts, tex_in) + ") this question to reuse later";

                                            convo.say(confirmation);
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
                    controller.storage.channels.get(my_room.id, function (err, room) {
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
                    // TODO ux graph

                    controller.storage.channels.get(my_room.id, function (err, room) {
                        if (room) {
                            if(room.details.poll && room.details.poll.votes) {
                                var opts = room.details.poll.options.split(";");
                                var vote_arr = room.details.poll.votes;
                                var tol = room.details.poll.voters.length;

                                if(room.details.poll.tex) {
                                    var voteQ = {
                                        text: "The poll  \n"+"Rendered by [CodeCogs](http://www.codecogs.com)",
                                        files: image_url(controller, room.details.poll.question, opts)
                                    }
                                }
                                else {
                                    var voteQ = "The poll:  \n";
                                    voteQ += "**"+room.details.poll.question +"**  \n";
                                    for(var idt= 0; idt<opts.length; idt++) {
                                        voteQ += (idt+1) + ". " + opts[idt] +"  \n";
                                    }
                                }

                                convo.say(voteQ);

                                var res = "Total response:  "+ tol +"\n";
                                for (var k = 0; k<opts.length; k++) {
                                    if (vote_arr[k]) {
                                        res += "* Option "+ (k+1) + ": " + vote_arr[k] + " vote(s) *"+ (vote_arr[k]/tol*100).toFixed(2) +"%*  \n";
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

            /*if (room.teacher) {
                controller.storage.channels.get(room.id, function (err, room) {
                    if (room) {
                        if(room.details.poll) {
                            var opts = room.details.poll.options.split(";");
                            var voteQ = "Active poll:  \n**"+room.details.poll.question +"**  \n";
                            for(var idt= 0; idt<opts.length; idt++) {
                                voteQ += (idt+1) + ". " + opts[idt] +"  \n";
                            }
                            convo.say(voteQ);
                        }
                        else {
                            convo.say("No active poll found!");
                        }
                    }
                });
            }*/

            // get from room
            controller.storage.channels.get(my_room.id, function (err, room) {
                if (room) {
                    if(room.details.poll) {

                        var getQ = "Reply with the number i.e. `1`, `2` etc. or `quit` to abort  \n";
                        if(my_room.teacher)
                            getQ = "Active poll  \n";

                        var q = room.details.poll;
                        if(contains(q.voters, person)) {
                            convo.say("You already answered!");
                        }
                        else {
                            var opts = room.details.poll.options.split(";");

                            if(q.tex) {
                                var voteQ = {
                                    text: getQ + "Rendered by [CodeCogs](http://www.codecogs.com)",
                                    files: image_url(controller, q.question, opts)
                                }
                            }
                            else {
                                var voteQ = getQ;
                                voteQ += "**"+room.details.poll.question +"**  \n";
                                for(var idt= 0; idt<opts.length; idt++) {
                                    voteQ += (idt+1) + ". " + opts[idt] +"  \n";
                                }
                            }

                            if(my_room.teacher){
                                convo.say(voteQ);
                            }
                            else {
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
                    }
                    else {
                        convo.say("No active poll found!");
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

function roomSelectedForFileParsing(person, controller, bot, convo, method, opt, rooms, file) {

    console.log(TAG+ "file uri = " + file);

    if(opt>=1 && opt<=rooms.length) {

        var room = rooms[opt-1];

        bot.retrieveFileInfo(file, function(err, fileInfo) {
            if(fileInfo && fileInfo["content-type"]==="application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                // show in italic

                var filename = randomstring.generate(16)+".docx";

                var options = {
                    url: file,
                    headers: {
                        'Authorization': 'Bearer ' + controller.config.ciscospark_access_token
                    }
                };

                request(options).pipe(fs.createWriteStream(filename)).on('close', function(){
                    try {
                        mammoth.extractRawText({path: filename})
                            .then(function(result){
                                var text = result.value.trim(); // The raw text
                                var messages = result.messages;


                                var opts = text;
                                var splited = opts.split(";");

                                var n = splited.length;

                                // atleast question text and a option and last digit
                                if(n<=2) {
                                    //todo; messgae undefined bug
                                    convo.say("Not a valid `.docx` file!");
                                }
                                else {
                                    var texFile = false;
                                    console.log(">>>> "+ splited[n-1].length);
                                    if(splited[n-1].indexOf("1")!=-1) {
                                        texFile = true;
                                    }
                                    var actualOpts = splited.slice(1, n-1).join("; ");
                                    //console.log(TAG+" >>> "+actualOpts);

                                    // add to room
                                    controller.storage.channels.get(room.id, function (err, room) {
                                        if (room) {
                                            room.details.poll = { question: splited[0], tex: texFile, options: actualOpts, votes: new Array(n), voters:[]} ;
                                            controller.storage.channels.save(room, function (err, id) {
                                                if (err) console.error(TAG+ "controller.storage.channels.save not working");
                                            });
                                        }
                                    });

                                    // notify everyone
                                    bot.reply({channel: room.id}, 'New poll!  \nType `poll` in a **personal conversation** to respond');

                                    // done
                                    // var voteQ = "Poll set";
                                    convo.say("Poll set");
                                }

                                fs.unlink(filename, function (err) {
                                    if (err) {
                                        console.log(TAG+ err.toString());
                                    }
                                });
                            })
                            .done();
                    }
                    catch (e) {
                        convo.say("Not a valid `.docx` file!");
                    }
                    convo.next();
                });

            }
            else {
                convo.say("This is not a `.docx` file!");
            }
        });

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

function make_url(controller, ques, opts, tex) {
    if(tex)
        return process.env.public_address+"/download?q="+encodeURIComponent(ques)+"&o="+encodeURIComponent(opts)+"&t=1";
    else
        return process.env.public_address+"/download?q="+encodeURIComponent(ques)+"&o="+encodeURIComponent(opts)+"&t=0";
}

function image_url(controller, ques, opts) {
    var ret = "https://latex.codecogs.com/gif.latex?" + encodeURIComponent(ques) + "%5C%5C";
    for(var idt= 0; idt<opts.length; idt++) {
        ret += (idt+1) + ".%5C%20"+ encodeURIComponent(opts[idt]) +"%5C%5C";
    }
    return [ret];
}