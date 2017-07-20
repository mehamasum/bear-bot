var env = require('node-env-file');
env(__dirname + '/.env');


if (!process.env.access_token) {
    console.log('Error: Specify a Cisco Spark access_token in environment.');
    process.exit(1);
}

if (!process.env.public_address) {
    console.log('Error: Specify an SSL-enabled URL as this bot\'s public_address in environment.');
    process.exit(1);
}

var Botkit = require('botkit');
var Util = require("./components/util.js");
var debug = require('debug')('botkit:main');

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.sparkbot({
    debug: true,
    // limit_to_domain: ['mycompany.com'],
    // limit_to_org: 'my_cisco_org_id',
    json_file_store: 'db/json_db',
    public_address: process.env.public_address,
    ciscospark_access_token: process.env.access_token,
    studio_token: process.env.studio_token,
    secret: process.env.secret,
    webhook_name: 'Cisco Spark bot created with Botkit, override me before going to production',
    studio_command_uri: process.env.studio_command_uri,
});

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);

// Tell Cisco Spark to start sending events to this application
require(__dirname + '/components/subscribe_events.js')(controller);

// Enable Dashbot.io plugin
// require(__dirname + '/components/plugin_dashbot.js')(controller);

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller);
});

controller.hears(/./, 'direct_message', function(bot, message) {
    bot.reply(message, "Didn't get you. Use `help` to see a list of available commands please.");
});

// notifier
var Worker = require("tiny-worker");
var worker = new Worker(function () {
    console.log("pre");
    self.onmessage = function (ev) {
        var https = require("https");
        var token = process.env.access_token;
        var fs = require("fs");
        var db = require("path").join(__dirname, "db/json_db/channels");

        setInterval(function () {
            fs.readdirSync(db).forEach(function(file) {
                //console.log(file);
                fs.readFile("./db/json_db/channels/"+file, 'utf8', function (err, data) {

                    var room = JSON.parse(data);

                    if (err) {
                        return console.log(err);
                    }

                    var notice = "Reminder ⏰  \n";
                    var delever = false;
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
                    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

                    // create new Date object for different city
                    // using supplied offset
                    var nd = new Date(utc + (3600000*offset));

                    var dues, choice, cnt, idk, given, diff;

                    // due
                    if(room.details.due && room.details.due.length>0) {
                        dues = room.details.due;
                        choice = "**Upcoming due:**  \n";
                        cnt = 0;
                        for(idk= 0; idk<dues.length; idk++) {
                            given = new Date(dues[idk].time);
                            diff = given.getTime() - nd.getTime();
                            //console.log('TIME DIFF >>> ' + diff);
                            if(diff >= 0 && diff<=86400000)
                            {
                                cnt++;
                                choice += "**"+ cnt + ". " + dues[idk].name +"**  \n"+dues[idk].description+"  \n"+"Deadline: "+dues[idk].time+"  \n";
                            }
                        }

                        if(cnt>0) {
                            delever = true;
                            notice+= choice;
                        }
                    }
                    // exam
                    if(room.details.exam && room.details.exam.length>0) {
                        dues = room.details.exam;
                        choice += "  \n**Upcoming exams:**  \n";
                        cnt = 0;
                        for(idk= 0; idk<dues.length; idk++) {
                            given = new Date(dues[idk].time);
                            diff = given.getTime() - nd.getTime();
                            //console.log('TIME DIFF >>> ' + diff);
                            if(diff >= 0 && diff<=86400000)
                            {
                                cnt++;
                                choice += "**"+ cnt + ". " + dues[idk].name +"**  \n"+dues[idk].description+"  \n"+"Date: "+dues[idk].time+"  \n";
                            }
                        }

                        if(cnt>0) {
                            delever = true;
                            notice+= choice;
                        }
                    }
                    // event
                    if(room.details.event && room.details.event.length>0) {
                        dues = room.details.event;
                        choice += "  \n**Upcoming events:**  \n";
                        cnt = 0;
                        for(idk= 0; idk<dues.length; idk++) {
                            given = new Date(dues[idk].time);
                            diff = given.getTime() - nd.getTime();
                            //console.log('TIME DIFF >>> ' + diff);
                            if(diff >= 0 && diff<=86400000)
                            {
                                cnt++;
                                choice += "**"+ cnt + ". " + dues[idk].name +"**  \n"+dues[idk].description+"  \n"+"Scheduled: "+dues[idk].time+"  \n";
                            }
                        }

                        if(cnt>0) {
                            delever = true;
                            notice+= choice;
                        }
                    }

                    //console.log(channel.id+"\n"+token);
                    if(delever) {
                        var post_data = JSON.stringify({
                            roomId: room.id,
                            text: notice,
                            markdown: notice
                        });

                        // An object of options to indicate where to post to
                        var post_options = {
                            host: 'api.ciscospark.com',
                            path: '/v1/messages',
                            method: 'POST',
                            headers: {
                                'Authorization' : 'Bearer ' + token,
                                'Content-Type': 'application/json; charset=utf-8',
                            }
                        };

                        var req = https.request(post_options, function (response) {
                            var chunks = [];
                            response.on('data', function (chunk) {
                                chunks.push(chunk);
                            });
                            response.on("end", function () {
                                switch (response.statusCode) {
                                    case 200:
                                        //console.log("meha: "+"notifier: 200");
                                        break; // we're good, let's proceed

                                    case 401:
                                        console.log("meha: "+"notifier: Spark authentication failed: 401, bad token");
                                        return;

                                    default:
                                        console.log("meha: "+"notifier: status code: " + response.statusCode);
                                        return;
                                }

                                // TODO: Robustify by checking the payload format
                            });
                        });

                        // post the data
                        req.on('error', function(err) {
                            console.log("meha: "+"notifier: error: " + err);
                        });

                        req.write(post_data);
                        req.end();
                    }

                });
            });
        }, 86400000)

        // done: never :v
        // postMessage(ev.data + " DONE B|");
    };
});

worker.onmessage = function (ev) {
    console.log("post: "+ ev.data);
    worker.terminate();
};

const util = require('util');
// JSON.stringify(util.inspect(controller))
worker.postMessage("go");
