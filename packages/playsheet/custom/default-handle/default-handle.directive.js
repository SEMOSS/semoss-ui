(function () {
    'use strict';

    /**
     * @name default-handle.directive.js
     * @desc given a json from the back end, creates a widget handle
     */
    angular.module('app.default-handle.directive', [])
        .directive('defaultHandle', defaultHandle);

    defaultHandle.$inject = ['$rootScope', 'dataService', 'pkqlService', 'monolithService', 'alertService', 'widgetConfigService'];

    function defaultHandle($rootScope, dataService, pkqlService, monolithService, alertService, widgetConfigService) {

        defaultHandleCtrl.$inject = ['$scope'];
        defaultHandleLink.$inject = ['scope', 'ele', 'attrs'];

        return {
            restrict: 'E',
            templateUrl: 'custom/default-handle/default-handle.directive.html',
            controller: defaultHandleCtrl,
            link: defaultHandleLink,
            scope: {},
            bindToController: {
                handle: "@?"
            },
            controllerAs: 'defaultHandle'
        };

        function defaultHandleCtrl() {
            var defaultHandle = this;

            defaultHandle.getPKQLRoutine = getPKQLRoutine;
            defaultHandle.saveJSONInput = saveJSONInput;
            defaultHandle.savePKQLInput = savePKQLInput;
            defaultHandle.resetPKQLChoice = resetPKQLChoice;
            defaultHandle.inputsEmpty = inputsEmpty;
            defaultHandle.toggleSavePKQL = toggleSavePKQL;
            defaultHandle.createPKQL = createPKQL;
            defaultHandle.createPKQLString = createPKQLString;
            defaultHandle.saveAsWidget = saveAsWidget;
            defaultHandle.insightId = "new";
            defaultHandle.jsonPresent = false;
            defaultHandle.chosenPKQLRoutine = 'Free text PKQL';
            defaultHandle.freeTextInput = '';
            defaultHandle.chosenPKQLJson = '';
            defaultHandle.contents = [];
            defaultHandle.iconChosen = '';
            defaultHandle.savePKQL = false;
            defaultHandle.icons = {
                'Camera': 'fa-camera',
                'Birthday Cake': 'fa-birthday-cake',
                'Cube': 'fa-cube',
                'Cubes': 'fa-cubes',
                'Bar Chart': 'fa-bar-chart',
                'Pie Chart': 'fa-pie-chart',
                'Line Chart': 'fa-line-chart',
                'Adjust': 'fa-adjust',
                'Calendar': 'fa-calendar',
                'Calculator': 'fa-calculator',
                'Circle': 'fa-circle-o',
                'Circle Colored': 'fa-circle',
                'Comment': 'fa-comment-o',
                'Comment Colored': 'fa-comment',
                'Fork': 'fa-code-fork',
                'Gears': 'fa-cog',
                'Code': 'fa-code',
                'Cloud': 'fa-cloud',
                'Checkmark': 'fa-check',
                'Right Arrow': 'fa-caret-square-o-right',
                'Left Arrow': 'fa-caret-square-o-left',
                'Arrows': 'fa-arrows',
                'Download': 'fa-download',
                'Desktop': 'fa-desktop',
                'Envelope': 'fa-envelope',
                'External Link': 'fa-external-link',
                'Feed': 'fa-feed',
                'Files': 'fa-files-o',
                'Audio File': 'fa-file-audio-o',
                'Code File': 'fa-file-code-o',
                'Archive File': 'fa-file-archive-o',
                'Image File': 'fa-file-image-o',
                'Movie File': 'fa-file-movie-o',
                'PDF File': 'fa-file-pdf-o',
                'Excel File': 'fa-file-excel-o',
                'Powerpoint File': 'fa-file-powerpoint-o',
                'Picture File': 'fa-file-picture-o',
                'Zip File': 'fa-file-zip-o',
                'Folder': 'fa-folder',
                'Folder Open': 'fa-folder-open',
                'Group': 'fa-group',
                'Percent': 'fa-percent',
                'Pencil': 'fa-pencil',
                'Pencil Drawing': 'fa-pencil-square-o',
                'Object Ungroup': 'fa-object-ungroup',
                'Object Group': 'fa-object-group',
                'Puzzle Piece': 'fa-puzzle-piece',
                'Refresh': 'fa-refresh',
                'Remove': 'fa-remove',
                'Add': 'fa-plus',
                'Search': 'fa-search',
                'Star': 'fa-star',
                'Font': 'fa-font',
                'Table': 'fa-table',
                'Repeat': 'fa-repeat',
                'Undo': 'fa-undo'
            };

            defaultHandle.showMenu = true;
            defaultHandle.updateOptions = updateOptions;
            defaultHandle.chainedPKQL = "";
            defaultHandle.initializeInputs = initializeInputs;
            defaultHandle.executePKQL = executePKQL;

            defaultHandle.HTMLStorage = {
                'dropdown': "<select ng-model='handle.value' class='full-width xs-padding' ng-change='defaultHandle.updateOptions(handle.name, handle.value)'><option value=''>-- Select an option --</option><option ng-repeat='header in handle.options | orderBy' value='{{header}}'>{{header}}</option></select>",
                'freetext': "<input ng-model='handle.value' class='full-width' type='text'/></input>",
                'radio': "<input  ng-model='handle.value' ng-click='handle.value = value; defaultHandle.executePKQL()' class='full-width' type='radio'/></input>",
                'buttonGroup': "<div class='btn-group' {{buttonGroupAttr}}> <button {{buttonAttr}} ng-repeat='button in handle.options' type='button' ng-model='button' ng-click='handle.value = button; defaultHandle.executePKQL()' class='btn btn-primary'>{{button}}</button></div>",
                'slider': "<div class='tool-slider'>" +
                                "<div class='slider-title'>Number of Buckets</div>" +
                                "<div class='pull-left sm-font' ng-bind-html='handle.options[0]'></div>" +
                                "<div class='pull-right sm-font' ng-bind-html='handle.options[1]'></div>" +
                                "<div class='clearfix'></div>" +
                                "<slider id='defaultSlider' ng-model='handle.value' on-stop-slide='' value='handle.options[1]' min='handle.options[0]' max='handle.options[1]' step='1'></slider>" +
                          "</div>"
            };
            var currentWidget = dataService.getWidgetData();
            dataService.setDefaultHandle(false);

            //check to see if default-handle is being created with existing json
            if(defaultHandle.handle) {
                defaultHandle.json = widgetConfigService.getJsonViewForHandle(defaultHandle.handle);

                //defaulthandle.json will either contain an object or be false
                if(defaultHandle.json) {
                    defaultHandle.jsonPresent = true;
                } else {
                    defaultHandle.json = {};
                    defaultHandle.jsonPresent = false;
                }

                defaultHandle.insightId = currentWidget.insightId;

                initializeInputs();
            }

            /**
             * @name initializeInputs
             * @desc looks through the json object and then creates the UI components to display in the side menu. auto runs the pkql command if no inputs needed
             */
            function initializeInputs() {
                var autoRun = true; //boolean to indicate whether we can run the pkql command straight away
                defaultHandle.dependMapping = {}; //instantiate mapping for first json

                //check for inputs, if none then we automatically run the pkql command
                for(var pkqlInfo in defaultHandle.json) {
                    defaultHandle.inputJson = defaultHandle.json[pkqlInfo].input;

                    if(Object.keys(defaultHandle.inputJson).length > 0) {
                        //there are inputs required from the user so we will turn the boolean off
                        autoRun = false;
                    }

                    for (var input in defaultHandle.inputJson) {
                        //here we grab the html from the storage and use them as templates, then we replace attribute tags with values passed from the json
                        //this way, the json can define how the element will look like
                        defaultHandle.inputJson[input].completeHTML = defaultHandle.HTMLStorage[defaultHandle.inputJson[input].type];
                        for(var attribute in defaultHandle.inputJson[input].attribute) {
                            defaultHandle.inputJson[input].completeHTML = defaultHandle.inputJson[input].completeHTML.replace("{{"+attribute+"}}", defaultHandle.inputJson[input].attribute[attribute]);
                        }

                        //here we will push html elements into the html storage
                        //this is used for custom html that users want to use aside from the ones from the storage
                        for(var html in defaultHandle.inputJson[input].html) {
                            defaultHandle.HTMLStorage[html] = defaultHandle.inputJson[input].html[html];
                        }

                        if (!defaultHandle.dependMapping[input]) {
                            //creating our dependency mapping
                            defaultHandle.dependMapping[input] = {};
                        }

                        //get options only when optionsGetter is defined
                        if (!_.isEmpty(defaultHandle.inputJson[input].optionsGetter)) {
                            // Doesn't need inputs, can populate right away
                            if (defaultHandle.inputJson[input].optionsGetter.dependInput.length === 0) {
                                //run inputJson[input].optionsGetter.command to get options
                                if(defaultHandle.inputJson[input].optionsGetter.command) { //only if there is a pkql command
                                    populateOptions(defaultHandle.inputJson[input].optionsGetter.command, input);
                                }
                            } else {
                                cascadeOptionValues(input);
                                for (var depInput in defaultHandle.inputJson[input].optionsGetter.dependInput) {
                                    if (!defaultHandle.dependMapping[input]) {
                                        //creating our dependency mapping
                                        defaultHandle.dependMapping[input] = {};
                                    }

                                    //lets map all of the children to the input {parent: child: {}}
                                    defaultHandle.dependMapping[defaultHandle.inputJson[input].optionsGetter.dependInput[depInput]][input] = {};
                                }
                            }
                        }
                    }
                }

                if(autoRun) { //no inputs needed so we will run the pkql commmand/s as is
                    var fullCommand = "";
                    defaultHandle.showMenu = false;
                    // dataService.setDefaultHandle(true);
                    for(var jsonIndex = 0; jsonIndex < defaultHandle.json.length; jsonIndex++) {
                        fullCommand += defaultHandle.json[jsonIndex].pkqlCommand;
                    }
                    dataService.toggleWidgetHandle('');

                    //we will concatenate the pkql commands and run them here
                    pkqlService.executePKQL(defaultHandle.insightId, fullCommand);
                }
            }

            /**
             * @name cascadeOptionValues
             * @param input
             * @desc check to see if all variables are filled in before running the pkql to grab options values
             */
            function cascadeOptionValues(input) {
                var inputJson = {};
                for(var pkqlInfo = 0; pkqlInfo < defaultHandle.json.length; pkqlInfo++) {
                    var executePkql = true;
                        inputJson = defaultHandle.json[pkqlInfo].input;

                    for (var depInput = 0; depInput < inputJson[input].optionsGetter.dependInput.length; depInput++) {
                        if (!inputJson[inputJson[input].optionsGetter.dependInput[depInput]].value) { //depended values not filled in so clear options
                            inputJson[input].options = [];
                            executePkql = false;
                        }
                    }

                    if(executePkql) {
                        //replace variables in the pkqlCommand with corresponding values and then run to get options
                        populateOptions(fillPKQL(inputJson[input].optionsGetter.command, pkqlInfo), input);
                    }
                }
            }

            /**
             * @name populateOptions
             * @param pkqlCommand
             * @param input
             * @desc run a pkql query to get options to populate values
             */
            function populateOptions(pkqlCommand, input) {
                monolithService.runPKQLQuery(defaultHandle.insightId, pkqlCommand).then(function(data){
                    //populate in the options field
                    var inputJson = {};
                    for(var pkqlInfo in defaultHandle.json) {
                        defaultHandle.json[pkqlInfo].input[input].value = "";
                        defaultHandle.json[pkqlInfo].input[input].options = [];
                        inputJson = defaultHandle.json[pkqlInfo].input;

                        for (var i = 0; i < data.insights[0].pkqlData[0].returnData.list.length; i++) {
                            //taking care of engines that return
                            //TODO need to have BE fix this so it doesnt return engines we dont want to select...
                            if (data.insights[0].pkqlData[0].returnData.list[i] && data.insights[0].pkqlData[0].returnData.list[i] !== "LocalMasterDatabase" && data.insights[0].pkqlData[0].returnData.list[i] !== "security" && data.insights[0].pkqlData[0].returnData.list[i] !== "form_builder_engine") {
                                //TODO backend returning duplicate engines...get them to fix so we can remove this check
                                if (inputJson[input].options.indexOf(data.insights[0].pkqlData[0].returnData.list[i]) === -1) {
                                    inputJson[input].options.push(data.insights[0].pkqlData[0].returnData.list[i]);
                                }
                            }
                        }
                    }
                });
            }

            /**
             * @name fillPKQL
             * @param pkqlCommand
             * @param pkqlInfoIndex
             * @returns {*} the completed pkqlCommand
             * @desc replace the variables in the pkql command with instance/selected values
             */
            function fillPKQL(pkqlCommand) {
                for(var pkqlInfoIndex = 0; pkqlInfoIndex < defaultHandle.json.length; pkqlInfoIndex++) {
                    for (var input in defaultHandle.json[pkqlInfoIndex].input) { //loop through all of the inputs and replace with their values
                        if (typeof defaultHandle.json[pkqlInfoIndex].input[input].value === "string") {
                            pkqlCommand = pkqlCommand.replace("<" + input + ">", defaultHandle.json[pkqlInfoIndex].input[input].value);
                        } else {
                            pkqlCommand = pkqlCommand.replace("<" + input + ">", JSON.stringify(defaultHandle.json[pkqlInfoIndex].input[input].value));
                        }
                    }
                }

                return pkqlCommand;
            }

            /**
             * @name updateOptions
             * @param input
             * @param selection
             * @desc check for dependencies and then update any options/values that have dependencies on the changed input
             */
            function updateOptions(input, selection) {
                for(var jsonIndex = 0; jsonIndex < defaultHandle.json.length; jsonIndex++) {
                    defaultHandle.json[jsonIndex].input[input].value = selection;
                }

                //if there are any children for this input--they will get impacted upon parent's value change
                if (!_.isEmpty(defaultHandle.dependMapping[input])) {
                    for (var depend in defaultHandle.dependMapping[input]) {
                        cascadeOptionValues(depend);
                    }
                }
            }

            /**
             * @name executePKQL
             * @desc execute the pkql
             */
            function executePKQL() {
                //grab the pkqlCommand and replace with values for all the variables in the inputs and then run it
                var completePKQL = "";
                for(var pkqlInfoIndex = 0; pkqlInfoIndex < defaultHandle.json.length; pkqlInfoIndex++) {
                    completePKQL += fillPKQL(defaultHandle.json[pkqlInfoIndex].pkqlCommand);
                }

                pkqlService.executePKQL(defaultHandle.insightId, completePKQL);
            }

            function createWidgetJSON() {
                var json = {};

                json = {
                    'name': defaultHandle.widgetName,
                    'groups': [defaultHandle.widgetGroup],
                    'buttonContent': '<i class="fa widget-button-icon-size ' + defaultHandle.icons[defaultHandle.iconChosen] + '"></i>',
                    'buttonTitle': defaultHandle.widgetName,
                    'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === '" + defaultHandle.widgetName + "'}",
                    'buttonActions': {
                        'click': function () {
                            dataService.toggleWidgetHandle(defaultHandle.widgetName);
                        }
                    },
                    'pinned': true,
                    'widgetHandleContent': 'default-handle',
                    'widgetHandleContentFiles': [
                        {
                            files: [
                                'bower_components/checklist-model/checklist-model.js'
                            ]
                        },
                        {
                            files: [
                                'custom/default-handle/default-handle.css'
                            ]
                        },
                        {
                            files: [
                                'custom/default-handle/default-handle.directive.js'
                            ]
                        }
                    ]
                };

                // functions were not written yet...
                // widgetConfigService.addWidgethandle(defaultHandle.widgetName, json);
                // widgetHandleService.addWidgetHandle(defaultHandle.widgetName, json);
            }

            /**
             * @name saveInput
             * @desc creates a PKQL statement with the user's current inputs
             * and saves that PKQL statement to the global PKQL queue
             */
            function saveJSONInput() {
                try {
                    defaultHandle.json = JSON.parse(defaultHandle.freeTextInput);
                } catch (error) {
                    alertService(error.message, 'Invalid JSON', 'toast-error', 5000);
                    return;
                }
                //defaultHandle.inputJson = JSON.parse(JSON.stringify(defaultHandle.json.input));
                defaultHandle.jsonPresent = true;

                initializeInputs();
                defaultHandle.resetPKQLChoice();
            }

            /**
             * @name savePKQLInput
             * @desc Currently this function executes the PKQL, will save the pkql in the future
             */
            function savePKQLInput() {
                defaultHandle.contents.push({
                    handle: defaultHandle.createPKQL(defaultHandle.json.pkqlCommand, defaultHandle.inputJson)
                });
            }

            function createPKQLString(pkql, inputs) {
                var output = pkql.substring(0, pkql.search(/\(/));
                var inputString = "";

                for (var cur in inputs) {
                    if (cur !== inputs.length - 1) {
                        inputString += (inputs[cur] + ", ");
                    } else {
                        inputString += (inputs[cur] + ");");
                    }
                }

                output = output + inputString;
                return output;
            }

            /**
             * @name resetPKQLChoice
             * @desc sets the input parameters back to their original state so that
             * after the user saves their input they are brought back to
             * the original 'screen' where they must choose a PKQL routine to begin
             */
            function resetPKQLChoice() {
                defaultHandle.chosenPKQLRoutine = '';
                defaultHandle.getPKQLRoutine(defaultHandle.chosenPKQLRoutine);
                defaultHandle.chosenPKQLJson = '';
                defaultHandle.freeTextInput = '';
            }

            /**
             * @name getPKQLRoutine
             * @param pkqlChosen
             * @desc checks if the chosen PKQL routine is null, if not then this function
             * retrieves the metaddata for the chosen PKQL routine from the back-end
             */
            function getPKQLRoutine(pkqlChosen){
                defaultHandle.inputValues = {};
                if (pkqlChosen === '' || pkqlChosen === 'freeTextPKQL'){
                    defaultHandle.chosenPKQLJson = '';
                }
            }

            /**
             * @returns {boolean} do all input parameters have non-empty values?
             * @desc for the current PKQL routine, checks if all parameters have inputs;
             * if not then this function returns false
             */
            function inputsEmpty() {
                // don't want to do a .length on an empty data set, but also need to make sure that we
                // are getting the values from Free text pkql's
                if(defaultHandle.chosenPKQLRoutine !== 'Free text PKQL') {
                    if (_.isEmpty(defaultHandle.inputJson)) {
                        return;
                    }

                    for (var input in defaultHandle.inputJson) {
                        if (!defaultHandle.inputJson[input].value && defaultHandle.inputJson[input].required === true) {
                            return false;
                        }
                    }

                    return true;
                } else {
                    return defaultHandle.freeTextInput !== '';
                }
            }

            /**
             * @name createPKQL
             * @param {string} [pkqlCommand] the template string for the pkql command
             * @param {object[]} [inputs] array of objects defining the input values
             * @return {string} ready to execute PKQL
             * @desc creates the completed PKQL String from the selected UI options
             */
            function createPKQL(pkqlCommand, inputs) {
                var commandString = '';

                if (pkqlCommand.indexOf('col.filter') === 0) {
                    for (var filter in inputs[0].value){
                        inputs[0].value[filter] = "'" + inputs[0].value[filter] + "'";
                    }
                    commandString = "col.filter(c:" + inputs[0].columnValue + "=[" + inputs[0].value + "]);";
                }

                else {
                    commandString = pkqlCommand;

                    //var regExp = /\[([^)]+)\]/; //everything between [] parentheses
                    var regExp = /\(([^)]+)\)/; //everything between () parentheses
                    var rxResult = regExp.exec(commandString);
                    var pkqlInputArray = rxResult[1].split(",");

                    for (var i = 0; i < inputs.length; i++) {
                        var input = inputs[i];
                        var index = pkqlInputArray.findIndex(function (e) {
                            return (e === input.varName)
                        });

                        if (input.dataType === "column") {
                            pkqlInputArray[index] = "c:" + input.value;
                        } else if (input.dataType === "multiColumn") {
                            var colArrayString = "[";
                            for (var j = 0; j < input.value.length; j++) {
                                var col = input.value[j];
                                colArrayString += "c:" + col + ",";
                            }
                            colArrayString += "]";
                            colArrayString = colArrayString.slice(0, -1); //remove last comma
                            pkqlInputArray[index] = colArrayString;
                        } else if (input.dataType === "number") {
                            pkqlInputArray[index] = input.value;
                        } else if (input.dataType === "delimiter"){
                            pkqlInputArray[index] = '"' + input.value + '"';
                        } else {
                            pkqlInputArray[index] = input.value;
                        }
                    }

                    var newPKQLparams = pkqlInputArray.join();

                    commandString = commandString.replace(rxResult[1], newPKQLparams);
                }
                return commandString;
            }

            /**
             * @name toggleSavePKQL
             * @desc toggles whether the user is saving the PKQL stack
             */
            function toggleSavePKQL() {
                //defaultHandle.savePKQLInput();
                defaultHandle.savePKQL = !defaultHandle.savePKQL;
            }

            function saveAsWidget() {
                //createWidgetJSON(); TODO Working on saving this part still...
            }
        }

        function defaultHandleLink(scope, ele, attrs) {
            //listener to grab data from widget service and run through initialize()
            var defaultHandleListener = $rootScope.$on('default-handle-receive', function (event, message, data) {
                if(message === "update-inputs") {
                    scope.defaultHandle.initializeInputs();
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                defaultHandleListener();
                console.log('destroying default handle');
            });
        }
    }
})();