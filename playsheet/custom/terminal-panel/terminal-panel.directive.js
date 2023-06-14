(function () {
    'use strict';

    angular.module('app.terminal.directive', [])
        .directive('terminalPanel', terminalPanel);

    
    terminalPanel.$inject = ['$rootScope', '$timeout', '$window', 'monolithService', 'dataService', 'pkqlService', 'alertService'];
    
    function terminalPanel($rootScope, $timeout, $window, monolithService, dataService, pkqlService, alertService) {
        
        terminalPanelCtrl.$inject = ['$scope'];
        terminalPanelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

        return {
            restrict: 'E',
            templateUrl: 'custom/terminal-panel/terminal-panel.directive.html',
            scope: {},
            controller: terminalPanelCtrl,
            link: terminalPanelLink,
            bindToController: {},
            controllerAs: 'terminal'
        };

        function terminalPanelCtrl($scope) {
            var terminal = this;
            terminal.historyStep = 0; //current step of history
            terminal.history = [{ //terminal history
                input: '',
                output: {
                    message: '',
                    status: ''
                }
            }];
            terminal.glued = true;

            terminal.turnOffGlued = turnOffGlued;
            terminal.setResponse = setResponse;
            terminal.processResponse = processResponse;
            terminal.populateWrite = populateWrite;
            terminal.setContext = setContext;
            terminal.submit = submit;
            terminal.clear = clear;

            /*** View Functions ***/
            /**
             * @name turnOffGlued
             * @desc toggles glued to false
             */
            function turnOffGlued() {
                terminal.glued = false;
            }

            /**
             * @name setResponse
             * @desc sets the resposne
             */
            function setResponse() {
                terminal.historyStep = 0;
                terminal.history = [{ //terminal history
                    input: '',
                    output: {
                        message: '',
                        status: '',
                        show: false
                    }
                }];
                if (terminal.insightData.pkqlData) {
                    for (var i = 0; i < terminal.insightData.pkqlData.length; i++) {
                        processResponse(terminal.insightData.pkqlData[i], (i === terminal.insightData.pkqlData.length - 1));
                    }
                }
            }

            /**
             * @name processResponse
             * @desc paints the appropriate response
             */
            function processResponse(responseMessage, last) {
                //reset to last one
                terminal.historyStep = terminal.history.length - 1;

                //input
                terminal.history[terminal.historyStep].input = responseMessage.command;

                //output
                //send response to terminal
                if (responseMessage.result) {
                    terminal.history[terminal.historyStep].output.message = "" + responseMessage.result;
                } else {
                    terminal.history[terminal.historyStep].output.message = "No message returned from server";
                }

                if (responseMessage.status) {
                    terminal.history[terminal.historyStep].output.status = "" + responseMessage.status;
                } else {
                    terminal.history[terminal.historyStep].output.status = "error";
                }

                //open the last one
                terminal.history[terminal.historyStep].output.show = last;

                //add next terminal line
                terminal.history.push({
                    input: '',
                    output: {
                        message: '',
                        status: '',
                        show: false
                    }
                });
                terminal.historyStep = terminal.history.length - 1;
                terminal.userInput = terminal.history[terminal.historyStep].input;
                terminal.glued = true;
            }

            /**
             * @name populateWrite
             * @desc populates the write field based on click
             * @param context {String} pkql input
             */
            function populateWrite(input) {
                terminal.turnOffGlued();
                terminal.codeMirror.doc.setValue(input);
                terminal.writeOpened = true;
            }

            /*** Write Functions ***/
            /**
             * @name setContext
             * @desc sends pkql to the backend for processing
             * @param context {String} context mode enabled
             */

            function setContext(context) {
                terminal.context = context;
                dataService.setConsoleContext(context);
            }

            /**
             * @name submit
             * @desc sends pkql to the backend for processing
             */
            function submit() {
                var userInput = terminal.codeMirror.doc.getValue();

                for (var i = 0; i < terminal.history.length; i++) {
                    terminal.history[i].output.show = false;
                }

                if (!_.isEmpty(userInput)) {
                    if (terminal.context === 'R') {
                        userInput = ('m:R([<code>' + userInput + '<code>]);')
                    } else if(terminal.context === 'Java') {
                        userInput = ('j:<code>' + userInput + '<code>;')
                    }

                    var currentWidget = dataService.getWidgetData();
                    pkqlService.executePKQL(currentWidget.insightId, userInput);
                    terminal.codeMirror.doc.setValue('');
                }
                else {
                    var response = {};
                    response.result = 'Error: Please enter a PKQL command';
                    response.status = 'error';
                    processResponse(response, true);
                }
            }

            /**
             * @name clear
             * @desc clears the contents of the console
             */
            function clear(){
                terminal.codeMirror.doc.setValue('');
            }
        }


        function terminalPanelLink(scope, ele, attrs, ctrl) {
            var codeMirrorEle = ele[0].querySelector('#code-mirror');

            scope.terminal.setWidth = function() {
                var width = angular.element(".widget-sidebar-pop-out.terminal-sidebar-pop-out").width();
                //dataService.setConsoleWidth(width);
                var widthPercentage = (width / angular.element(".widget-main").width()) * 100 + "%";
                //scope.terminal.currentWidgetData.consoleWidth = widthPercentage;
                dataService.setConsoleWidth(widthPercentage);
            }

            scope.terminal.resizeConsole = function() {
                var consoleWidth = scope.terminal.currentWidgetData.consoleWidth;
                angular.element("#terminal-resizer").css('width', consoleWidth);
                //angular.element("#terminal-vertical-resizer").css('right', 42 + consoleWidth + 'px');
                angular.element("#terminal-vertical-resizer").css('right', 'calc(' + consoleWidth + ' + 42px)');
                //angular.element("#terminal-vertical-resizer").css('right', 'calc(' + (parseFloat(consoleWidth) / 100) * angular.element(".widget-main").width() + "%" + ' + 42px)');
            }

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                scope.terminal.currentWidgetData = dataService.getWidgetData();
                scope.terminal.insightData = dataService.getInsightData();
                scope.terminal.setResponse();
                //initialize codeMirror
                scope.terminal.codeMirror = CodeMirror(codeMirrorEle, {
                    value: "",
                    lineNumbers: true,
                    lineWrapping: true,
                    extraKeys: {
                        "Ctrl-Enter": function () {
                            scope.terminal.submit();
                        },
                        "Ctrl-Up": function () {
                            if (scope.terminal.context === 'PKQL') {
                                --scope.terminal.historyStep;

                                if (scope.terminal.historyStep < 0) {
                                    scope.terminal.historyStep = 0
                                }


                                scope.terminal.populateWrite(scope.terminal.history[scope.terminal.historyStep].input)
                            }
                        },
                        "Ctrl-Down": function () {
                            if (scope.terminal.context === 'PKQL') {
                                ++scope.terminal.historyStep;
                                if (scope.terminal.historyStep > scope.terminal.history.length - 1) {
                                    scope.terminal.historyStep = scope.terminal.history.length - 1
                                }
                                scope.terminal.populateWrite(scope.terminal.history[scope.terminal.historyStep].input)
                            }
                        },
                        "Ctrl-Space": "autocomplete",
                        "'.'": function (cm) {
                            cm.replaceRange('.', cm.getCursor(), cm.getCursor(), 'complete');
                            cm.showHint();
                        },
                        "':'": function (cm) {
                            cm.replaceRange(':', cm.getCursor(), cm.getCursor(), 'complete');
                            cm.showHint();
                        }
                    },
                    hintOptions: {
                        hint: function (cm, option) {
                            //tokenizer
                            var tokens = [
                                {
                                    tag: 'data.',
                                    value: 'data.',
                                    shift: 5,
                                    children: [
                                        {
                                            tag: 'frame',
                                            value: 'data.frame()',
                                            shift: 11
                                        },
                                        {
                                            tag: 'import',
                                            value: 'data.import()',
                                            shift: 12
                                        }
                                    ]
                                },
                                {
                                    tag: 'col.',
                                    value: 'col.',
                                    shift: 4,
                                    children: [
                                        {
                                            tag: 'add',
                                            value: 'col.add()',
                                            shift: 8
                                        },
                                        {
                                            tag: 'filter',
                                            value: 'col.filter()',
                                            shift: 11
                                        }
                                    ]
                                },
                                {
                                    tag: 'm:',
                                    value: 'm:',
                                    shift: 2,
                                    children: [
                                        {
                                            tag: 'Average',
                                            value: 'm:Average([])',
                                            shift: 11
                                        },
                                        {
                                            tag: 'Concat',
                                            value: 'm:Concat([])',
                                            shift: 10
                                        },
                                        {
                                            tag: 'Count',
                                            value: 'm:Count([])',
                                            shift: 7
                                        },
                                        {
                                            tag: 'Max',
                                            value: 'm:Max([])',
                                            shift: 7
                                        },
                                        {
                                            tag: 'Median',
                                            value: 'm:Median([])',
                                            shift: 10
                                        },
                                        {
                                            tag: 'Min',
                                            value: 'm:Min([])',
                                            shift: 7
                                        },
                                        {
                                            tag: 'StandardDeviation',
                                            value: 'm:StandardDeviation([])',
                                            shift: 21
                                        },
                                        {
                                            tag: 'Sum',
                                            value: 'm:Sum([])',
                                            shift: 7
                                        }
                                    ]
                                },
                                {
                                    tag: 'panel.',
                                    value: 'panel.',
                                    shift: 6,
                                    children: [
                                        {
                                            tag: 'clone',
                                            value: 'panel.clone()',
                                            shift: 12
                                        },
                                        {
                                            tag: 'comment',
                                            value: 'panel.comment()',
                                            shift: 13
                                        },
                                        {
                                            tag: 'viz',
                                            value: 'panel.viz()',
                                            shift: 10
                                        }
                                    ]
                                }];

                            //add in tokens for header data
                            if (scope.terminal.currentWidgetData.data.chartData && scope.terminal.currentWidgetData.data.chartData.headers) {
                                var columnsHolder = {
                                    tag: 'c:',
                                    value: 'c:',
                                    shift: 2,
                                    children: []
                                };

                                for (var i = 0; i < scope.terminal.currentWidgetData.data.chartData.headers.length; i++) {
                                    columnsHolder.children.push({
                                        tag: scope.terminal.currentWidgetData.data.chartData.headers[i].filteredTitle,
                                        value: 'c:' + scope.terminal.currentWidgetData.data.chartData.headers[i].filteredTitle,
                                        shift: 2 + scope.terminal.currentWidgetData.data.chartData.headers[i].filteredTitle.length
                                    })
                                }

                                tokens.push(columnsHolder);
                            }


                            var cursor = cm.getCursor(),
                                line = cm.getLine(cursor.line),
                                start = cursor.ch,
                                end = cursor.ch;

                            //grab from start of whitespace
                            while (start && /\w|\.|\:/.test(line.charAt(start - 1))) {
                                --start;
                            }

                            while (end < line.length && /\w|\.|\:/.test(line.charAt(end))) {
                                ++end;
                            }

                            var word = line.slice(start, end).toLowerCase();


                            //token section
                            var selectedTokens;
                            for (var i = 0; i < tokens.length; i++) {
                                if (tokens[i].tag === word.slice(0, tokens[i].tag.length)) {
                                    selectedTokens = tokens[i].children;

                                    var remainingCharacters = word.slice(tokens[i].tag.length, word.length);
                                    if (remainingCharacters.length > 0) {
                                        for (var j = 0; j < remainingCharacters.length; j++) {
                                            for (var k = selectedTokens.length - 1; 0 <= k; k--) {
                                                if (remainingCharacters[j].toLowerCase() !== selectedTokens[k]['tag'][j].toLowerCase()) {
                                                    selectedTokens.splice(k, 1);
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            if (selectedTokens && selectedTokens.length > 0) {
                                var selectedList = [];
                                for (var i = 0; i < selectedTokens.length; i++) {
                                    selectedList.push({
                                        text: selectedTokens[i].value,
                                        displayText: selectedTokens[i].tag,
                                        shift: selectedTokens[i].shift,
                                        hint: function (cm, self, data) {
                                            //replace text
                                            cm.replaceRange(data.text, self.from, self.to, 'complete');

                                            //set end semi-colon (if necessary)
                                            var value = cm.getValue();
                                            if (!/\;+$/.test(value)) {
                                                value += ';';
                                                cm.setValue(value);
                                            }

                                            //set new cursor position
                                            cm.setCursor({
                                                line: self.from.line,
                                                ch: (self.from.ch + data.shift)
                                            });
                                        }
                                    })
                                }


                                return {
                                    list: selectedList,
                                    from: CodeMirror.Pos(cursor.line, start),
                                    to: CodeMirror.Pos(cursor.line, end)
                                }
                            }

                            return null
                        }
                    }
                });

                //set context
                var consoleContext = scope.terminal.currentWidgetData.consoleContext;
                scope.terminal.setContext(consoleContext);

                //set left
                scope.terminal.resizeConsole();
            }

            initialize();

            //listeners
            var terminalListner = $rootScope.$on('terminal-receive', function (event, message, data) {
                if (message === 'process-response') {
                    console.log('%cPUBSUB:', "color:blue", message, data);
                    for (var i = 0; i < data.response.length; i++) {
                        scope.terminal.processResponse(data.response[i], (i === data.response.length - 1))
                    }
                }
            });

            //events
            angular.element($window).bind('resize', scope.terminal.resizeConsole);
            angular.element("#terminal-view-content").bind("scroll", scope.terminal.turnOffGlued);

            //cleanup
            scope.$on('$destroy', function () {
                terminalListner();
                angular.element($window).unbind('resize', scope.terminal.resizeConsole);
                ele.unbind("scroll", scope.terminal.turnOffGlued);
                console.log('destroying terminal....');
            });

        }

    }

})();

