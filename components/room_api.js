

var https = require("https");

var token = process.env.access_token;


var RoomAPI = {};
module.exports = RoomAPI;


//
// cb function signature should be (err, webhook)
//

RoomAPI.getRoomDetails = function (roomId, cb) {

    //console.log("SEARCHING FOR ROOM: "+roomId);

    // An object of options to indicate where to post to
    var post_options = {
        host: 'api.ciscospark.com',
        path: '/v1/rooms/'+roomId,
        method: 'GET',
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
                    break; // we're good, let's proceed

                case 401:
                    console.log("meha: "+"getRoomDetails: Spark authentication failed: 401, bad token");
                    if (cb) cb(new Error("getRoomDetails: response status: " + response.statusCode + ", bad token"), null);
                    return;

                default:
                    console.log("meha: "+"getRoomDetails: status code: " + response.statusCode);
                    if (cb) cb(new Error("getRoomDetails: response status: " + response.statusCode), null);
                    return;
            }

            // TODO: Robustify by checking the payload format

            // Return
            var roomDetails = JSON.parse(Buffer.concat(chunks));
            if (cb) cb(null, roomDetails);
        });
    });

    // post the data
    req.on('error', function(err) {
        console.log("meha: "+"getRoomDetails: error: " + err);
        if (cb) cb(new Error("getRoomDetails: cannot find getRoomDetails"), null);
    });
    //req.write(post_data);
    req.end();
};



//
// cb function signature should be (err, webhook)
//

RoomAPI.getRoomMembers = function (roomId, cb) {


    // An object of options to indicate where to post to
    var post_options = {
        host: 'api.ciscospark.com',
        path: '/v1/memberships?roomId='+roomId,
        method: 'GET',
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
                    break; // we're good, let's proceed

                case 401:
                    console.log("meha: "+"getRoomMembers: Spark authentication failed: 401, bad token");
                    if (cb) cb(new Error("getRoomMembers: response status: " + response.statusCode + ", bad token"), null);
                    return;

                default:
                    console.log("meha: "+"getRoomMembers: status code: " + response.statusCode);
                    if (cb) cb(new Error("getRoomMembers: response status: " + response.statusCode), null);
                    return;
            }

            // TODO: Robustify by checking the payload format

            // Return
            var roomDetails = JSON.parse(Buffer.concat(chunks));
            if (cb) cb(null, roomDetails);
        });
    });

    // post the data
    req.on('error', function(err) {
        console.log("meha: "+"getRoomMembers: error: " + err);
        if (cb) cb(new Error("getRoomMembers: cannot find getRoomMembers"), null);
    });
    //req.write(post_data);
    req.end();
};
