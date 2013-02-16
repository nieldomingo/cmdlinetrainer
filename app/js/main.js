
(function ($) {
    var printStatus = function(msg) {
            $('#status_message').text(msg);
        },
        app = Sammy('#main', function () {

        this.use('Mustache');

        this.get('#home', function () {
            this.render('js/tpl/home.mustache', {}).swap();
        });
        
        this.get('#:section', function () {
            var sectionId = this.params['section'];
            this.load('json/' + sectionId + '.json', function (data) {
                var d = {
                            section: sectionId
                    };
                this.render('js/tpl/section.mustache', d).swap(function() {
                    var questionState={},
                        numQuestions=10,
                        qSession=null,
                        qIndex=null,
                        qNum=null,
                        sessionOn=false,
                        correctAnswers=0,
                        wrongAnswers=0,
                        timeToAnswer=10000,
                        timedMode=false,
                        nextQuestion=function () {
                            return Math.floor(Math.random() * data.length);
                        },
                        startSeries = function (evt) {
                            qIndex = nextQuestion();
                            qNum = 0;
                            qSession = new Date().getTime() / 1000;
                            sessionOn = true;
                            correctAnswers = 0;
                            wrongAnswers = 0;

                            if (!$('#start_question').hasClass('disabled')) {
                                $('#start_question').addClass('disabled');
                                $('#start_question').attr('disabled', true);
                                
                                $('#stop_question').removeClass('disabled');
                                $('#stop_question').attr('disabled', false);
                            }
                            $('#command_question').show();

                            $('#correct_answers').text('0');
                            $('#wrong_answers').text('0');

                            $(questionState).trigger('question', [qIndex, 0]);
                        },
                        endSeries = function (evt) {
                            sessionOn = false;
                            stateKey = String(qIndex) + ':' + String(qNum) + ':' + String(qSession),
                            questionState[stateKey] = 'done';

                            $('#stop_question').addClass('disabled');
                            $('#stop_question').attr('disabled', true);
                            
                            $('#start_question').removeClass('disabled');
                            $('#start_question').attr('disabled', false);
                        
                            $('#command_question').hide();

                            console.log("end of questions");
                        },
                        startQuestion = function (evt) {
                            var question = data[qIndex],
                                cmdDescription = question['description'],
                                cmdAnswer = question['command'],
                                stateKey = String(qIndex) + ':' + String(qNum) + ':' + String(qSession),
                                nextQIndex = nextQuestion(),
                                startTime = new Date().getTime(),
                                updateTime = function () {
                                    var currTime=new Date().getTime() - startTime,
                                        pctTime=(currTime / timeToAnswer) * 100.0,
                                        pctWidth=String(pctTime) + '%';

                                    if (questionState[stateKey] == 'ongoing' && sessionOn == true) {
                                        
                                        $('#elapsed_progress .bar').css('width', pctWidth);
                                        setTimeout(updateTime, 50);
                                    }

                                };

                            timedMode = true;
                            
                            $('#command_description').text(cmdDescription);
                            $('#command_answer').val('');
                            $('#command_answer').focus();
                            $('#elapsed_progress .bar').css('width', '0%');
                            $('#command_hint').text('');
                            printStatus('Ongoing...');

                            questionState[stateKey]= 'ongoing';
                            
                            setTimeout(function () {
                                    if (questionState[stateKey] == 'ongoing' && sessionOn == true) {
                                        $('#command_hint').text(cmdAnswer);
                                    }
                            }, timeToAnswer / 4);

                            setTimeout(function () {
                                    if (questionState[stateKey] == 'ongoing' && sessionOn == true) {
                                        console.log("time's up");
                                        questionState[stateKey] = 'done';
                                        $('#elapsed_progress .bar').css('width', '100%');
                                        wrongAnswers += 1;
                                        $('#wrong_answers').text(String(wrongAnswers));
                                        /*
                                        qNum = qNum + 1;
                                        if (qNum < numQuestions) {
                                            qIndex = nextQIndex;
                                            $(questionState).trigger('question')
                                        }
                                        else {
                                            $(questionState).trigger('endseries');
                                        }
                                        */
                                        $(questionState).trigger('graceperiod');
                                    }
                            }, timeToAnswer);

                            updateTime(stateKey);

                        },
                        answerQuestion = function(timedMode) {
                            var answer = $('#command_answer').val(),
                                question = data[qIndex],
                                cmdAnswer = question['command'],
                                stateKey = String(qIndex) + ':' + String(qNum) + ':' + String(qSession);

                            questionState[stateKey] = 'answered';

                            if (answer == cmdAnswer) {
                                nextQIndex = nextQuestion();
                                console.log('answer correct');

                                if (timedMode) {
                                    correctAnswers += 1;
                                    $('#correct_answers').text(String(correctAnswers));
                                }
                                qNum = qNum + 1;
                                if (qNum < numQuestions) {
                                    qIndex = nextQIndex;
                                    $(questionState).trigger('question');
                                }
                                else {
                                    $(questionState).trigger('endseries');
                                }
                            }
                            else {
                                console.log('answer wrong');
                                wrongAnswers += 1;
                                $('#wrong_answers').text(String(wrongAnswers));

                                $('#elapsed_progress .bar').css('width', '100%');
                                printStatus('Wrong answer... Copy hint for now');
                                $('#command_hint').text(cmdAnswer);
                            }
                            
                        },
                        gracePeriod = function(evt) {
                            printStatus('Time\'s up... Copy hint for now');
                            timedMode = false;

                            $('#command_answer').focus();
                        };

                    $(questionState).bind('question', startQuestion);
                    $(questionState).bind('endseries', endSeries);
                    $(questionState).bind('graceperiod', gracePeriod);

                    $('#stop_question').addClass('disabled');
                    $('#stop_question').attr('disabled', true);

                    $('#command_question').hide();
                    
                    $('#start_question').click(startSeries);
                    $('#stop_question').click(endSeries);
                    $('#submit_command').click(function () {
                        timedMode = false;
                        answerQuestion(timedMode);
                    });
                    $('#command_answer').bind('keypress', function (evt) {
                        if (evt.keyCode == 13) {
                            evt.preventDefault();
                            answerQuestion();
                        }
                    });

                    /*
                    $('#start_question').click(function() {
                        var i = 0,
                            stopFlag = false,
                            questionIndex = 0,
                            command_description='',
                            command_correct='',
                            question=null;

                        if (!$('#start_question').hasClass('disabled')) {
                            $('#start_question').addClass('disabled');
                            $('#start_question').attr('disabled', true);
                            
                            $('#stop_question').removeClass('disabled');
                            $('#stop_question').attr('disabled', false);
                        }
                        $('#command_question').show();

                        for (i=0; i < 15; i++) {
                            if (stopFlag == true) {
                                break;
                            }

                            questionIndex = Math.floor(Math.random() * data.length);

                            question = data[questionIndex];
                            command_description = question['description'];
                            command_correct = question['command'];

                            $('#command_description').text(command_description);


                        }
                    });
                    
                    $('#stop_question').click(function() {
                        if (!$('#stop_question').hasClass('disabled')) {
                            $('#stop_question').addClass('disabled');
                            $('#stop_question').attr('disabled', true);
                            
                            $('#start_question').removeClass('disabled');
                            $('#start_question').attr('disabled', false);
                        }
                        $('#command_question').hide();
                    });
                    */
                });

            });
        });
        
        /*
        this.post('#submit', function () {
            console.log(this.params['command']);
        });
        */
        
    });

    app.run('#home');
})(jQuery);
