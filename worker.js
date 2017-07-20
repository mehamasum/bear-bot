// check out: https://github.com/avoidwork/tiny-worker
// more: https://www.npmjs.com/package/tiny-worker

var Worker = require("tiny-worker");
var worker = new Worker(function () {
    console.log("pre");
    self.onmessage = function (ev) {
        var https = require("https");
        var token = "ODY5MzZiZjEtMjNhNy00ZDU1LWIxZTQtNWQxMjY5ZDAzZmYwMzIzNzgyOTAtZjQw";
        var fs = require("fs");
        var db = require("path").join(__dirname, "db/json_db/channels");

        setInterval(function () {
            fs.readdirSync(db).forEach(function(file) {
                console.log(file);
                fs.readFile("./db/json_db/channels/"+file, 'utf8', function (err, data) {
                    var channel = JSON.parse(data);
                    if (err) {
                        return console.log(err);
                    }
                    console.log(channel.id+"\n"+token);

                    var post_data = JSON.stringify({
                        roomId: channel.id,
                        text: "HAHA!"
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
                                    console.log("meha: "+"notifier: 200");
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

                });
            });
        }, 54000)

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