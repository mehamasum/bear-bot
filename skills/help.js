module.exports = function(controller) {
    controller.hears(['help'], 'direct_message', function(bot, message) {
        //bot.reply(message, 'Hold on while I gather a list of available commands for you.');

        var person = message.original_message.personId;

        controller.storage.users.get(person, function(err, user) {
            if (!user) {
                bot.reply(message, "Sorry. We don't share a classroom!");
            }
            else {

                var rooms = user.details.rooms;
                var teacher = 0;
                var student = 0;

                for(var idx= 0; idx<rooms.length; idx++) {
                    var room = rooms[idx];

                    if (room.teacher) teacher++;
                    else student++;
                }

                if(teacher>0) {
                    bot.reply(message, "Here is the full list of supported actions **for Professors**:  \n"

                        + "**Office Hours**  \n"
                        + "-`set/delete office hours`: To set or delete office hour info  \n"
                        + "-`office hours`: To get office hour info  \n"

                        + "**Course Website**  \n"
                        + "-`set/delete website`: To set or delete course website info  \n"
                        + "-`website`: To get course website info  \n"

                        + "**Syllabus**  \n"
                        + "-`set/delete syllabus`: To set or delete a link of syllabus  \n"
                        + "-`syllabus`: To get the link of syllabus   \n"

                        + "**Course Resources**  \n"
                        + "-`set/delete resources`: To set or delete a link of course resources  \n"
                        + "-`resources`: To get the link of course resources  \n"


                        + "**Due**  \n"
                        + "-`add/update/delete due`: For dues (homework, assignments, reports) with title, description and date  \n"
                        + "-`due`: To get the list of upcoming dues  \n"

                        + "**Exam**  \n"
                        + "-`add/update/delete exam`: For exams (quiz, midterm, finals) announcement with title, description and date  \n"
                        + "-`exam`: To get the list of upcoming exams  \n"

                        + "**Events**  \n"
                        + "-`add/update/delete event`: For events with title, description and date  \n"
                        + "-`event`: To get the list of upcoming event  \n"

                        + "**News**  \n"
                        + "-`add/update/delete news`: For important announcements and notifications  \n"
                        + "-`news`: To get the latest news  \n"



                        + "**Poll**  \n"
                        + "-`set/delete poll`: For in-class questions or polls  \n"
                        + "-`set poll` with `.docx` file attached: Create poll from file  \n"
                        + "-`set poll with tex`: Create poll with Latex equations  \n"
                        + "-`poll`: To view the active poll  \n"
                        + "-`result`: To get result of an active poll  \n"

                        + "**Settings**  \n"
                        + "-`set timezone`: To set timezone, all queries and reminders will fire according to this  \n"
                        + "-`timezone`: To get the currently set timezone  \n"
                        + "-`make admin`: To give someone admin privilege (using email)   \n"
                        + "-`remove admin`: To remove admin privilege (using email)   \n"
                        + "-`admin`: To see the status of admin privilege of yourself  \n"
                    );
                }
                if(student>0) {
                    bot.reply(message, "Here is the full list of supported actions **for Students**:  \n"

                        + "**Office Hours**  \n"
                        + "-`office hours`: To get office hour info  \n"

                        + "**Course Website**  \n"
                        + "-`website`: To get course website info  \n"

                        + "**Syllabus**  \n"
                        + "-`syllabus`: To get the link of syllabus   \n"

                        + "**Course Resources**  \n"
                        + "-`resources`: To get the link of course resources  \n"

                        + "**Timezone (Settings)**  \n"
                        + "-`timezone`: To get the currently set timezone  \n"



                        + "**Due**  \n"
                        + "-`due`: To get the list of upcoming dues  \n"

                        + "**Exam**  \n"
                        + "-`exam`: To get the list of upcoming exams  \n"

                        + "**Events**  \n"
                        + "-`event`: To get the list of upcoming event  \n"

                        + "**News**  \n"
                        + "-`news`: To get the latest news  \n"


                        + "**Poll**  \n"
                        + "-`poll`: To anonymously participate in in-class questions or polls  \n"

                        + "**Anonymous Group Post**  \n"
                        + "-`post`: To anonymously post a issue/concern  \n"

                    );
                }
            }
        });

    });

}
