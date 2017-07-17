/**
 * Created by mehamasum on 6/30/2017.
 */
module.exports = function(controller) {

    const TAG = "meha, event.js: ";
    var Worker = require("tiny-worker");
    var roomAPI = require(__dirname + '/../components/room_api.js');
    var Util = require("../components/util.js");

    controller.on('bot_space_join', function (bot, message) {

        var botId = message.original_message.data.personId;
        var roomId = message.original_message.data.roomId;

        roomAPI.getRoomDetails(roomId, function (err, details) {
            if (err) {
                console.log(TAG + "roomAPI.getRoomDetails not working");
                return;
            }

            if (details.type === "group") {
                // assuming data is not in my db ->
                // save the room data marked as inactive, save persons in the room

                bot.reply(message, 'Hello 👋  \nI am Bear, the classroom bot!  \n'
                    + 'Type `hi` in a **direct message** to talk to me');

                var creatorId = details.creatorId;
                var title = details.title;

                roomAPI.getRoomMembers(roomId, function (err, members) {
                    if (err) {
                        console.error(TAG+ "roomAPI.getRoomMembers not working");
                        return;
                    }

                    // save persons in the room

                    var room_members = [];

                    members.items.forEach(function (element) {

                        var person = element.personId;
                        var name = element.personDisplayName;
                        var personEmail = element.personEmail;

                        if (person == botId) return; // if bot iteself -> skip

                        var teacher = false;
                        if (person == creatorId) { // teacher
                            teacher = true;
                        }

                        room_members.push({id: person, personEmail: personEmail, personDisplayName: name, teacher: teacher});

                        controller.storage.users.get(person, function (err, user) {
                            if (!user) {
                                user = {
                                    id: person,
                                    details: {
                                        personEmail: personEmail,
                                        personDisplayName: name,
                                        rooms: [{id: roomId, title: title, teacher: teacher}]
                                    }
                                };
                            }
                            else {
                                user.details.rooms.push({id: roomId, title: title, teacher: teacher});
                            }

                            controller.storage.users.save(user, function (err, id) {
                                if (err) console.error(TAG+ "controller.storage.user.save not working");
                            });
                        });
                    });


                    // save the room data marked as inactive
                    controller.storage.channels.save(
                        {
                            id: message.channel,
                            details: {
                                title: title,
                                creatorId: creatorId,
                                active: false,
                                members: room_members
                            }
                        }
                        , function (err) {
                            if (err) console.log("meha: controller.storage.channels.save not working");
                        }
                    );
                });


            }

            /*else {
                 // is it a private room?
                 // stay quiet
                 // console.log("meha: roomAPI says DM");
             }*/

        });


    });

    controller.on('user_space_join', function (bot, message) {

        // invokes in both DM and convo
        var newcomerId = message.original_message.data.personId;
        var name = message.original_message.data.personDisplayName;
        var roomId = message.original_message.data.roomId;
        var personEmail =  message.original_message.data.personEmail;


        roomAPI.getRoomDetails(roomId, function (err, details) {

            var title = details.title;

            if (err) {
                console.error(TAG+ " roomAPI.getRoomDetails not working");
                return;
            }
            if (details.type === "group") {

                bot.reply(message, 'Hello, <@personId:'+newcomerId+'|'+name+'> 👋  \n'
                    + 'Type `hi` in a **direct message** to talk to me');

                // save user
                controller.storage.users.get(newcomerId, function (err, user) {
                    if (!user) {
                        user = {
                            id: newcomerId,
                            details: {
                                personEmail: personEmail,
                                personDisplayName: name,
                                rooms: [{id: roomId, title: title,  teacher: false}]
                            }
                        };
                    }
                    else {
                        user.details.rooms.push({id: roomId, title: title, teacher: false});
                    }

                    controller.storage.users.save(user, function (err, id) {
                        if (err) console.error(TAG+ " controller.storage.user.save not working");
                    });
                });

                // add to room

                controller.storage.channels.get(roomId, function (err, room) {
                    if (room) {
                        room.details.members.push({id: newcomerId, personEmail: personEmail, personDisplayName: name, teacher: false});

                        controller.storage.channels.save(room, function (err, id) {
                            if (err) console.error(TAG+ "controller.storage.channels.save not working");
                        });
                    }
                });

            }
        });


    });


    controller.on('user_space_leave', function (bot, message) {

        //console.log("meha: user_space_leave " + message);
        var newcomerId = message.original_message.data.personId;
        var name = message.original_message.data.personDisplayName;
        var roomId = message.original_message.data.roomId;


        roomAPI.getRoomDetails(roomId, function (err, details) {
            if (err) {
                console.error(TAG+"roomAPI.getRoomDetails not working"); return;
            }
            if (details.type === "group") {

                // update user
                controller.storage.users.get(newcomerId, function (err, user) {
                    if (user) {

                        if(user.details.rooms.length===1) {
                            // delete the whole user
                            controller.storage.users.delete(newcomerId, function(err) {
                                if (err) console.error(TAG+ " controller.storage.user.delete not working");
                            });
                        }
                        else {
                            Util.deleteRoomFromUser(user, roomId);
                            controller.storage.users.save(user, function (err, id) {
                                if (err) console.error(TAG+ " controller.storage.user.save not working");
                            });
                        }
                    }

                });

                // delete from room
                controller.storage.channels.get(roomId, function (err, room) {
                    if (room) {
                        Util.deleteUserFromRoom(room, newcomerId);
                        controller.storage.channels.save(room, function (err, id) {
                            if (err) console.error(TAG+ "controller.storage.channels.save not working");
                        });
                    }
                });

            }
        });


    });

    controller.on('bot_space_leave', function (bot, message) {

        controller.storage.channels.get(message.channel, function (err, room) {
            if (room) {
                room.details.members.forEach(function (element) {
                    var person = element.id;

                    // update user
                    controller.storage.users.get(person, function (err, user) {
                        if (user) {

                            if(user.details.rooms.length===1) {
                                // delete the whole user
                                controller.storage.users.delete(person, function(err) {
                                    if (err) console.error(TAG+ " controller.storage.user.delete not working");
                                });
                            }
                            else {
                                Util.deleteRoomFromUser(user, message.channel);
                                controller.storage.users.save(user, function (err, id) {
                                    if (err) console.error(TAG+ " controller.storage.user.save not working");
                                });
                            }
                        }
                    });
                });


                // delete the room data
                controller.storage.channels.delete(message.channel, function (err) {
                    if (err) console.error(TAG+ " controller.storage.channels.delete not working " + err);
                });
            }
        });

    });

};