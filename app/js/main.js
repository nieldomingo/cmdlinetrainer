
(function ($) {
    var app = Sammy('#main', function () {

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
                    var questionState = {},
                        numQuestions = 10,
                        nextQuestion = function () {
                            return Math.floor(Math.random() * data.length);
                        },
                        startSeries = function (evt) {
                            var qIndex = nextQuestion();

                            if (!$('#start_question').hasClass('disabled')) {
                                $('#start_question').addClass('disabled');
                                $('#start_question').attr('disabled', true);
                                
                                $('#stop_question').removeClass('disabled');
                                $('#stop_question').attr('disabled', false);
                            }
                            $('#command_question').show();

                            $(window).trigger('question', [qIndex, 0]);
                        },
                        endSeries = function (evt) {
                            $('#stop_question').addClass('disabled');
                            $('#stop_question').attr('disabled', true);
                            
                            $('#start_question').removeClass('disabled');
                            $('#start_question').attr('disabled', false);
                        
                            $('#command_question').hide();

                            console.log("end of questions");
                        },
                        startQuestion = function (evt, qIndex, qNum) {
                            var question = data[qIndex],
                                cmdDescription = question['description'],
                                cmdAnswer = question['command'],
                                stateKey = String(qIndex) + ':' + String(qNum),
                                nextQIndex = nextQuestion();
                            
                            $('#command_description').text(cmdDescription);

                            questionState[stateKey]= 'ongoing';

                            setTimeout(function () {
                                    if (questionState[stateKey] == 'ongoing') {
                                        console.log("time's up");
                                        questionState[stateKey] = 'done';
                                        if (qNum < numQuestions) {
                                            $(window).trigger('question',
                                                            [nextQIndex,
                                                             qNum + 1]);
                                        }
                                        else {
                                            $(window).trigger('endseries');
                                        }
                                    }
                            }, 5000);
                        },
                        answerQuestion = function(evt) {
                        };

                    $(window).bind('question', startQuestion);
                    $(window).bind('endseries', endSeries);

                    $('#stop_question').addClass('disabled');
                    $('#stop_question').attr('disabled', true);

                    $('#command_question').hide();
                    
                    $('#start_question').click(startSeries);

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
