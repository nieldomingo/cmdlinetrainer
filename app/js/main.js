
(function ($) {
    var statusTable = {
            statusMessageId: 'status_message',
            hintMessageId: 'command_hint',
            correctCntId: 'correct_answers',
            wrongCntId: 'wrong_answers',
            correctCnt: 0,
            wrongCnt: 0,
            printStatusMessage: function (msg) {
                $('#' + this.statusMessageId).text(msg);
            },
            printHint: function (msg) {
                $('#' + this.hintMessageId).text(msg);
            },
            resetCnts: function () {
                this.correctCnt = 0;
                this.wrongCnt = 0;
                $('#' + this.correctCntId).text(String(this.correctCnt));
                $('#' + this.wrongCntId).text(String(this.wrongCnt));
            },
            incrementCorrectCnt: function () {
                this.correctCnt += 1;
                $('#' + this.correctCntId).text(String(this.correctCnt));
            },
            incrementWrongCnt: function () {
                this.wrongCnt += 1;
                $('#' + this.wrongCntId).text(String(this.wrongCnt));
            }
        },
        topButtons = {
            startQuestionId: 'start_question',
            stopQuestionId: 'stop_question',
            questionPaneId: 'command_question',
            startMode: function () {
                $('#' + this.startQuestionId).addClass('disabled');
                $('#' + this.startQuestionId).attr('disabled', true);
                
                $('#' + this.stopQuestionId).removeClass('disabled');
                $('#' + this.stopQuestionId).attr('disabled', false);
                
                $('#' + this.questionPaneId).show();
            },
            stopMode: function () {
                $('#' + this.stopQuestionId).addClass('disabled');
                $('#' + this.stopQuestionId).attr('disabled', true);
                
                $('#' + this.startQuestionId).removeClass('disabled');
                $('#' + this.startQuestionId).attr('disabled', false);
                
                $('#' + this.questionPaneId).hide();
            }
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
                            timeToAnswer=30000,
                            timedMode=false,
                            nextQuestion=function () {
                                return Math.floor(Math.random() * data.length);
                            },
                            startSeries = function (evt) {
                                qIndex = nextQuestion();
                                qNum = 0;
                                qSession = new Date().getTime() / 1000;
                                sessionOn = true;

                                topButtons.startMode();
                                
                                statusTable.resetCnts();

                                $(questionState).trigger('question', [qIndex, 0]);
                            },
                            endSeries = function (evt) {
                                sessionOn = false;
                                stateKey = String(qIndex) + ':' + String(qNum) + ':' + String(qSession),
                                questionState[stateKey] = 'done';

                                statusTable.stopMode();

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
                                statusTable.printHint('');
                                statusTable.printStatusMessage('Ongoing...');

                                questionState[stateKey]= 'ongoing';
                                
                                /*
                                setTimeout(function () {
                                        if (questionState[stateKey] == 'ongoing' && sessionOn == true) {
                                            statusTable.printHint(cmdAnswer);
                                        }
                                }, timeToAnswer / 4);
                                */

                                setTimeout(function () {
                                        if (questionState[stateKey] == 'ongoing' && sessionOn == true) {
                                            console.log("time's up");
                                            questionState[stateKey] = 'done';
                                            $('#elapsed_progress .bar').css('width', '100%');
                                            statusTable.incrementWrongCnt()
                                            statusTable.printHint(cmdAnswer);
                                            $(questionState).trigger('graceperiod');
                                        }
                                }, timeToAnswer);

                                updateTime(stateKey);

                            },
                            answerQuestion = function() {
                                var answer = $('#command_answer').val(),
                                    question = data[qIndex],
                                    cmdAnswer = question['command'],
                                    stateKey = String(qIndex) + ':' + String(qNum) + ':' + String(qSession);

                                questionState[stateKey] = 'answered';

                                if (answer == cmdAnswer) {
                                    nextQIndex = nextQuestion();
                                    console.log('answer correct');

                                    if (timedMode) {
                                        statusTable.incrementCorrectCnt();
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
                                    statusTable.incrementWrongCnt();
                                    statusTable.printStatusMessage('Wrong answer... Copy hint for now');
                                    statusTable.printHint(cmdAnswer);

                                    $('#elapsed_progress .bar').css('width', '100%');
                                    timedMode = false;
                                }
                                
                            },
                            gracePeriod = function(evt) {
                                statusTable.printStatusMessage('Time\'s up... Copy hint for now');
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
                        $('#submit_command').click(answerQuestion);
                        $('#command_answer').bind('keypress', function (evt) {
                            if (evt.keyCode == 13) {
                                evt.preventDefault();
                                answerQuestion();
                            }
                        });
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
