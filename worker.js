// check out: https://github.com/avoidwork/tiny-worker
// more: https://www.npmjs.com/package/tiny-worker


var Worker = require("tiny-worker");
var worker = new Worker(function () {
    //console.log("pre");
    self.onmessage = function (ev) {
        //console.log("pre: "+ ev.data);


        // done
        postMessage(ev.data + " DONE B|");
    };
});

worker.onmessage = function (ev) {
    //console.log("post: "+ ev.data);
    worker.terminate();
};

worker.postMessage("");
