module.exports = function(controller) {

// DM convo
// start
    controller.hears(['hi', 'hello', 'howdy', 'hey'], 'direct_message', function (bot, message) {
        bot.reply(message, 'Hi there! Type `help` to get a list of available commands.');


        /*
        // example of threading:
        var Worker = require("tiny-worker");
        var worker = new Worker(function () {
            console.log("pre");
            self.onmessage = function (ev) {

                for (var i = 0; i < 10000000; i++)
                    console.log(".");
                // example how to send message to others:
                bot.reply({channel: "Y2lzY29zcGFyazovL3VzL1JPT00vNDA1ZmU1ZDAtM2JiNy0xMWU3LTk1ODctYjExYmY3ZGU0ZGQ1"}, 'Hi there! Type `help` to get a list of available commands.');

                // done
                postMessage();
            };
        });

        worker.onmessage = function (ev) {
            console.log("post");
            worker.terminate();
        };

        worker.postMessage("Hello World!");*/

        // without thread
        /*for(var i=0; i<10000000; i++)
         console.log(".");
         bot.reply({channel: "Y2lzY29zcGFyazovL3VzL1JPT00vNDA1ZmU1ZDAtM2JiNy0xMWU3LTk1ODctYjExYmY3ZGU0ZGQ1"}, 'Hi there! Type `help` to get a list of available commands.');
         */

    });

};