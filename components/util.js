/**
 * Created by mehamasum on 5/20/2017.
 */
Util={};
module.exports = Util;

zone = new Array(39);
zone['-11:00']="Pacific/Midway";
zone['-10:00']="America/Adak";
zone['-09:30']="Pacific/Marquesas";
zone['-09:00']="America/Anchorage";
zone['-08:00']="America/Dawson";
zone['-07:00']="America/Boise";
zone['-06:00']="America/Bahia_Banderas";
zone['-05:00']="America/Atikokan";
zone['-04:30']="America/Caracas";
zone['-04:00']="America/Anguilla";
zone['-03:30']="America/St_Johns";
zone['-03:00']="America/Araguaina";
zone['-02:00']="America/Montevideo";
zone['-01:00']="America/Scoresbysund";
zone['+00:00']="Africa/Abidjan";
zone['+01:00']="Africa/Algiers";
zone['+02:00']="Africa/Blantyre";
zone['+03:00']="Africa/Addis_Ababa";
zone['+03:30']="Asia/Tehran";
zone['+04:00']="Asia/Baku";
zone['+04:30']="Asia/Kabul";
zone['+05:00']="Antarctica/Mawson";
zone['+05:30']="Asia/Colombo";
zone['+05:45']="Asia/Kathmandu";
zone['+06:00']="Antarctica/Vostok";
zone['+06:30']="Asia/Yangon";
zone['+07:00']="Antarctica/Davis";
zone['+08:00']="Antarctica/Casey";
zone['+08:45']="Australia/Eucla";
zone['+09:00']="Asia/Dili";
zone['+09:30']="Australia/Darwin";
zone['+10:00']="Antarctica/DumontDUrville";
zone['+10:30']="Australia/Adelaide";
zone['+11:00']="Antarctica/Macquarie";
zone['+11:30']="Pacific/Norfolk";
zone['+12:00']="Asia/Anadyr";
zone['+13:00']="Antarctica/McMurdo";
zone['+13:45']="Pacific/Chatham";
zone['+14:00']="Pacific/Apia";


Util.deleteRoomFromUser = function (user, roomId) {
    var len = user.details.rooms.length;
    var index = -1;

    for(var idx =0; idx<len; idx++) {
        var room = user.details.rooms[idx];
        if(room.id==roomId) {
            index = idx;
            break;
        }
    }

    console.log("meha: deleteRoomFromUser "+ idx);

    if (index > -1) {
        user.details.rooms.splice(index, 1);
    }
};

Util.deleteUserFromRoom = function (room, userId) {
    var len = room.details.members.length;
    var index = -1;

    for(var idx =0; idx<len; idx++) {
        var member = room.details.members[idx];
        //console.log("deleteUserFromRoom: "+ idx+ " - "+ personDisplayName);

        if(member.id==userId) {
            index = idx;
            break;
        }
    }

    console.log("meha: deleteUserFromRoom "+ idx);

    if (index > -1) {
        room.details.members.splice(index, 1);
    }
};

Util.deleteItemFromArray = function (arr, index) {
    arr.splice(index, 1);
};


Util.buildCalendar = function (classname, event, timezone) {
    // {name: name, description: description, time: YYYY-MM-DD HH-MM}

    /*
     atc_privacy	    public or private
     atc_date_start	    YYYY-MM-DD hh24:mm:ss
     atc_date_end	    YYYY-MM-DD hh24:mm:ss
     ?atc_timezone	    Location/Areafrom list:
     atc_title	        string
     atc_description    string
     atc_location	    string
    */

    var privacy = "private";
    var start_date, end_date;
    start_date = end_date = encodeURIComponent(event.time + ":00");

    var title = encodeURIComponent(event.name);
    var desc = encodeURIComponent(event.description);
    var location = encodeURIComponent(classname);

    var timezone_str = encodeURIComponent("Africa/Abidjan");
    if(zone[timezone])
        timezone_str = encodeURIComponent(zone[timezone]);

    var tail = 'e[0][date_start]='+start_date+'&e[0][date_end]='+end_date+'&e[0][timezone]='+timezone_str+'&e[0][title]='+title+'&e[0][description]='+desc+'&e[0][location]='+location+'&e[0][privacy]=private)';


    var arr = new Array(4);
    arr[0] = '[+Google Calendar](http://addtocalendar.com/atc/google?f=m&' + tail;
    arr[1] = '[+Outlook Calendar](http://addtocalendar.com/atc/outlookonline?f=m&' + tail;
    arr[2] = '[+Yahoo Calendar](http://addtocalendar.com/atc/yahoo?f=m&' + tail;
    arr[3] = '[+iCalendar](http://addtocalendar.com/atc/ical?f=m&' + tail;

    return arr;
};


Util.buildCalendarNew = function (classname, event_name, event_desc, event_time, timezone) {
    // {name: name, description: description, time: YYYY-MM-DD HH-MM}

    /*
     atc_privacy	    public or private
     atc_date_start	    YYYY-MM-DD hh24:mm:ss
     atc_date_end	    YYYY-MM-DD hh24:mm:ss
     ?atc_timezone	    Location/Areafrom list:
     atc_title	        string
     atc_description    string
     atc_location	    string
     */

    var privacy = "private";
    var start_date, end_date;
    start_date = end_date = encodeURIComponent(event_time + ":00");

    var title = encodeURIComponent(event_name);
    var desc = encodeURIComponent(event_desc);
    var location = encodeURIComponent(classname);

    var timezone_str = encodeURIComponent("Africa/Abidjan");
    if(zone[timezone])
        timezone_str = encodeURIComponent(zone[timezone]);

    var tail = 'e[0][date_start]='+start_date+'&e[0][date_end]='+end_date+'&e[0][timezone]='+timezone_str+'&e[0][title]='+title+'&e[0][description]='+desc+'&e[0][location]='+location+'&e[0][privacy]=private)';


    var arr = new Array(4);
    arr[0] = '[+Google Calendar](http://addtocalendar.com/atc/google?f=m&' + tail;
    arr[1] = '[+Outlook Calendar](http://addtocalendar.com/atc/outlookonline?f=m&' + tail;
    arr[2] = '[+Yahoo Calendar](http://addtocalendar.com/atc/yahoo?f=m&' + tail;
    arr[3] = '[+iCalendar](http://addtocalendar.com/atc/ical?f=m&' + tail;

    return arr;
};