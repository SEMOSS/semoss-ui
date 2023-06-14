'use strict';
/**
 * @name infographic
 * @desc This is an infographic widget for compiling and displaying HTML in a panel based on
 *       user input and preferences. Much of the logic of this widget mirrors text-widget so
 *       flow is similar. setData() kicks off everything by first checking if data already exists
 *       for the compiled HTML or not as well as populating our headers choices with whatever
 *       headers are available in the current data frame. From here, a user can input data into
 *       multiple "groups", where each group is made up of a sub-header (optional), description (
 *       optional) and a "command" (required). This command can be either a custom pixel or a pixel
 *       that is created by taking in the user input and constructing an appropriate pixel. This
 *       pixel construction takes place in the buildPixels() function. Prior to building our
 *       pixels, however, we actually construct an HTML template for each "group" through the
 *       processGroups() function, which essentially assings a template from buildHTML() to a
 *       unique group id. These group ids are constructed by keeping a paramCount and appending it
 *       to 'myGroup' so that we have 'myGroup0', 'myGroup1', etc. These unique ids are important
 *       because once we have constructed our template and built our pixels, we execute our pixels
 *       through the getVars() command. Each pixel output is assigned to a scope variable that has
 *       the same name as our group id from earlier. Because of this, we are able to use the
 *       processCommands() function which goes through each group's HTML and replaces the occurance
 *       of the group id with the output of the corresponding scope variable. For now, we only take in
 *       the first index of the output regardless of what comes back - in the future we will need to
 *       be able to account for multiple outputs and display in some sort of visual format (most likely
 *       a table).
 */
import './infographic.scss';

export default angular
    .module('app.infographic.directive', [])
    .directive('infographic', infographic);

infographic.$inject = ['$compile', 'semossCoreService'];

function infographic($compile, semossCoreService) {
    infographicLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: infographicLink,
        template: require('./infographic.directive.html'),
    };

    function infographicLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var smssValues = [
                '<CurrentPanel>',
                '<Layout>',
                '<InsightId>',
                '<NewCloneId>',
                '<Frame>',
            ],
            compiledEle,
            count = 0;

        // binding everything to infographic. We need to instantiate, because we do not have a controller.;
        scope.infographic = {};

        // edit functions
        scope.infographic.save = save;
        scope.infographic.editWidget = editWidget;

        // view functions
        scope.infographic.resetCmd = resetCmd;
        scope.infographic.getCmdTypes = getCmdTypes;
        scope.infographic.checkForDuplicateLabel = checkForDuplicateLabel;
        scope.infographic.addNewGroup = addNewGroup;
        scope.infographic.removeGroup = removeGroup;

        /** ******************* BEGIN GLOBALS ******************* **/

        // GLOBAL Objects
        scope.infographic.headerTypes = {};
        scope.infographic.pixelCommands = {
            Average: 'Select (Average(<ele>))',
            Max: 'Select(Max(<ele>))',
            Min: 'Select(Min(<ele>))',
            Sum: 'Select(Sum(<ele>))',
            Median: 'Select(Median(<ele>))',
            'Unique Count': 'UniqueCount(<ele>)',
            Count: 'Count(<ele>)',
            'Unique Average': 'Select (UniqueAverage(<ele>))',
        };

        // GLOBAL Arrays
        scope.infographic.headers = [];
        scope.infographic.labels = ['-No Label-'];
        scope.infographic.cmdTypes = [
            'Average',
            'Max',
            'Min',
            'Sum',
            'Median',
            'Unique Count',
            'Count',
            'Unique Average',
        ];
        scope.infographic.stringCmdTypes = ['Unique Count', 'Count'];
        scope.infographic.groups = [
            {
                id: '', // used to track our group
                description: '', // storage for description
                cmdType: '', // storage for our "constructor" pixel
                cmd: '', // pixel return
                descriptionPosition: 'Below', // description below or above data
                dataType: '', // what data is our selected header?
                selectedHeader: '', // what column has the user selected
                instance: '-No Instance-', // storage for instance
                label: '-No Label-', // storage for label, defaults to None
                instances: [], // storage for instances
                dataSource: '', // where is our data coming from?
                decimalFormat: 2, // how many decimal places should your value use?
                descriptionFontSize: 36, // font size for description
                dataFontSize: 72, // font size for data
                format: 'None', // how should your value be formatted (%, $, etc.)
                customDataFontSize: false, // use custom font size for our data?
                customDescFontSize: false, // use custom font size for our description?
            },
        ];
        scope.infographic.dataSources = ['Custom Pixel', 'Data from Frame'];
        scope.infographic.dataFormatTypes = [
            'None',
            '$ USD',
            '% Percentage',
            '£ English Pound',
            '€ Euro',
        ];

        // GLOBAL Primitives
        scope.infographic.html = '';
        scope.infographic.compiledTemplate = false;
        scope.infographic.paramCount = 0;
        scope.infographic.cloak = true;

        /** ******************* END GLOBALS ******************* **/

        /**
         * @name getSemossValues
         * @param {string} dataToGrab String command to be replaced with data from store
         * @return {primitive} The relavent data from store
         * @desc Takes in a string between two brackets and replaces it with the actual value
         *       from Embed's store. Currently selecting these options is only available through
         *       the user inputting a custom pixel command.
         */
        function getSemossValues(dataToGrab) {
            var value, logins;

            switch (dataToGrab) {
                case '<CurrentPanel>':
                    value = scope.widgetCtrl.panelId;
                    break;
                case '<Layout>':
                    value = scope.widgetCtrl.getWidget(
                        'view.visualization.layout'
                    );
                    break;
                case '<InsightId>':
                    value = scope.widgetCtrl.insightID;
                    break;
                case '<NewCloneId>':
                    value = scope.widgetCtrl.getShared('panelCounter') + 1;
                    break;
                case '<TaskId>':
                    value = scope.widgetCtrl.getWidget('view.taskId');
                    break;
                case '<Frame>':
                    value = scope.widgetCtrl.getFrame('name');
                    break;
                case '<SMSS_PANEL_ID>':
                    value = scope.widgetCtrl.getWidget('panelId');
                    break;
                case '<SMSS_LAYOUT>':
                    value = scope.widgetCtrl.getWidget(
                        'view.visualization.layout'
                    );
                    break;
                case '<SMSS_META>':
                    value = scope.widgetCtrl.getWidget('meta');
                    break;
                case '<SMSS_SHARED_STATE>':
                    value = scope.widgetCtrl.getWidget(
                        'view.visualization.tools.shared'
                    );
                    break;
                case '<SMSS_ACTIVE_STATE>':
                    value = scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' +
                            scope.widgetCtrl.getWidget(
                                'view.visualization.layout'
                            )
                    );
                    break;
                case '<SMSS_INSIGHT_ID>':
                    value = scope.widgetCtrl.getShared('insightID');
                    break;
                case '<SMSS_FRAME_NAME>':
                    value = scope.widgetCtrl.getShared(
                        'frames.' +
                            scope.widgetCtrl.getWidget('frame') +
                            '.name'
                    );
                    break;
                case '<SMSS_FRAME_TYPE>':
                    value = scope.widgetCtrl.getShared(
                        'frames.' +
                            scope.widgetCtrl.getWidget('frame') +
                            '.type'
                    );
                    break;
                case '<SMSS_CLONE_ID>':
                    value = scope.widgetCtrl.getShared('panelCounter') + 1;
                    break;
                case '<SMSS_INSIGHT>':
                    value = scope.widgetCtrl.getShared('insight');
                    break;
                case '<SMSS_CREDENTIALS>':
                    value = semossCoreService.getCredentials();
                    break;
                case '<SMSS_LIMIT>':
                    value = scope.widgetCtrl.getOptions('limit');
                    break;
                case '<SMSS_USER>':
                    logins = semossCoreService.getCurrentLogins();
                    value = semossCoreService.utility.isEmpty(logins)
                        ? ''
                        : logins[Object.keys(logins)[0]];
                    break;
                default:
                    value = '';
            }

            return value;
        }

        /**
         * @name save
         * @returns {void}
         * @desc Actions taken once the user hits the Compile button. We process all of
         *       the command groups that the user has created, build out our pixels, execute them,
         *       and if successful change our view to the compiled HTML
         */
        function save() {
            if (checkCompileDisabled()) {
                return;
            }

            processGroups();
            buildPixels();

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'infographic',
                        {
                            html: scope.infographic.html,
                            groups: scope.infographic.groups,
                        },
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name processGroups
         * @return {void}
         * @desc Takes in all of the user's groups, prepares their data so that
         *       they can easily be converted to our HTML structure and then
         *       sends them to the buildHTML function to construct our HTML
         */
        function processGroups() {
            var i;

            for (i = 0; i < scope.infographic.groups.length; i++) {
                if (scope.infographic.groups[i].id) {
                    continue;
                } else {
                    scope.infographic.groups[i].id = generateNewGroupName();
                }
            }

            buildHTML();
        }

        /**
         * @name processCommands
         * @return {boolean} Did the pixel successfully return data?
         * @desc Processes all of our "commands", which are what the user has chosen
         *       for their pixel output. Must account for all cases including custom pixel,
         *       Count, UniqueCount, etc.
         */
        function processCommands() {
            var regex, groupName, returnVal, formatSnippet, i;

            if (scope.infographic.groups.length === 0) {
                scope.widgetCtrl.alert(
                    'error',
                    'No data to display - please enter command(s)'
                );
                return false;
            }

            // Loop through our groups
            for (i = 0; i < scope.infographic.groups.length; i++) {
                groupName = scope.infographic.groups[i].id;

                if (
                    scope.infographic.groups[i].dataSource === 'Data from Frame'
                ) {
                    if (
                        !scope[groupName] ||
                        scope.infographic.groups[i].cmd === ''
                    ) {
                        scope.widgetCtrl.alert('error', 'No data returned');
                        return false;
                    }

                    // Make sure that the pixel returned data, if not exit
                    if (!scope[groupName][0].output.data) {
                        scope.widgetCtrl.alert(
                            'error',
                            'Invalid Pixel command, Exact error is: ' +
                                scope[groupName][0].output
                        );
                        return false;
                    }
                }

                // We currently only send back the first result regardless of what is in output.data.values...need to handle multiple
                regex = new RegExp(scope.infographic.groups[i].id, 'g');
                returnVal = scope[groupName][scope[groupName].length - 1].output
                    .data
                    ? scope[groupName][scope[groupName].length - 1].output.data
                          .values[0]
                    : [scope[groupName][scope[groupName].length - 1].output];

                // Round value
                if (scope.infographic.groups[i].decimalFormat < 0) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Can not have a negative decimal value. Please choose a decimal value greater than or equal to 0.'
                    );
                    return false;
                }

                if (typeof returnVal[0] === 'string') {
                    returnVal[0] = returnVal[0].replace(/_/g, ' ');
                } else if (typeof returnVal[0] === 'number') {
                    returnVal[0] = returnVal[0].toFixed(
                        scope.infographic.groups[i].decimalFormat
                    );

                    // Give commas to our value
                    if (scope.infographic.groups[i].decimalFormat === 0) {
                        returnVal = parseInt(returnVal, 10).toLocaleString();
                    } else {
                        returnVal = parseFloat(returnVal).toLocaleString();
                    }
                }

                // Format as money
                if (
                    scope.infographic.groups[i].format !== '' &&
                    scope.infographic.groups[i].format !== 'None'
                ) {
                    formatSnippet = scope.infographic.groups[
                        i
                    ].format.substring(0, 1);

                    if (formatSnippet === '%') {
                        returnVal = returnVal + formatSnippet;
                    } else {
                        returnVal = formatSnippet + returnVal;
                    }
                }

                scope.infographic.html = scope.infographic.html.replace(
                    regex,
                    returnVal
                );
            }

            return true;
        }

        /**
         * @name getVars
         * @return {void}
         * @desc Compiles our HTML while replacing the name of the scope variables
         *       with the data that was stored for them from the metapixel
         */
        function getVars() {
            var query, i, len;

            // Ensure that we have HTML, execute the pixel commands
            if (scope.infographic.html) {
                count = 0;
                for (
                    i = 0, len = scope.infographic.groups.length;
                    i < len;
                    i++
                ) {
                    // Take the pixel array in cmd and run it as a metapixel
                    if (scope.infographic.groups[i].cmd instanceof Array) {
                        query = scope.infographic.groups[i].cmd;
                    } else if (
                        typeof scope.infographic.groups[i].cmd === 'string'
                    ) {
                        query = [
                            {
                                meta: true,
                                type: 'Pixel',
                                components: [scope.infographic.groups[i].cmd],
                                terminal: true,
                            },
                        ];
                    } else {
                        // Case that we were not able to find pixel commands to execute
                        scope.widgetCtrl.alert(
                            'error',
                            'No pixel command to execute'
                        );
                    }

                    if (!query) {
                        continue;
                    }

                    count++;

                    scope.widgetCtrl.meta(
                        query,
                        setVars.bind(null, scope.infographic.groups[i].id),
                        [scope.widgetCtrl.widgetId]
                    );
                }
            }
        }

        /**
         * @name setVars
         * @param {string} name - name of variable
         * @param {object} response - variable data
         * @return {void}
         */
        function setVars(name, response) {
            count--;

            if (response.pixelReturn) {
                scope[name] = response.pixelReturn;
            } else {
                delete scope[name];
            }

            // if all of the queries are done running
            if (count === 0) {
                compileHTML();
            }
        }

        /**
         * @name compileHTML
         * @desc takes what is in the text box and compile it
         * @returns {void}
         */
        function compileHTML() {
            var success,
                elementToAppendTo = ele[0].querySelector('#infographic');

            // If a compiled HTML exists then delete it since we don't want them to stack
            if (compiledEle) {
                compiledEle.parentNode.removeChild(compiledEle);
                compiledEle = undefined;
            }

            // Format HTML and process our commands
            scope.infographic.html = scope.infographic.html
                .replace(/\\t/g, '')
                .replace(/\\n/g, '');
            success = processCommands();

            // If successful, compile, otherwise don't
            if (success) {
                compiledEle = $compile(
                    '<div id="infographic" class="infographic-calculated-values">' +
                        scope.infographic.html +
                        '</div>'
                )(scope)[0];
                elementToAppendTo.appendChild(compiledEle);
                scope.infographic.compiledTemplate = true;
                scope.infographic.cloak = false;
            }
        }

        /**
         * @name buildHTML
         * @return {void}
         * @desc Constructs the HTML of the infographic widget and replaces all of
         *       the appropriate variables with the input that the user has entered
         */
        function buildHTML() {
            var html = '',
                dataFontSize,
                descFontSize,
                i;

            for (i = 0; i < scope.infographic.groups.length; i++) {
                if (scope.infographic.groups.length === 1) {
                    html += '<div class="infographic-single-output">';
                } else if (scope.infographic.groups.length === 2) {
                    html += '<div class="infographic-double-output">';
                } else if (scope.infographic.groups.length === 3) {
                    html += '<div class="infographic-triple-output">';
                } else if (
                    scope.infographic.groups.length === 4 ||
                    scope.infographic.groups.length > 4
                ) {
                    html += '<div class="infographic-quadruple-output">';
                }

                if (scope.infographic.groups[i].customDataFontSize) {
                    dataFontSize =
                        scope.infographic.groups[i].dataFontSize + 'px;';
                } else {
                    dataFontSize = 'calc(20px + 2.5vmin);';
                }

                if (
                    scope.infographic.groups[i].customDescFontSize &&
                    scope.infographic.groups[i].description !== ''
                ) {
                    descFontSize =
                        scope.infographic.groups[i].descriptionFontSize + 'px;';
                } else if (
                    scope.infographic.groups[i].descriptionPosition !== ''
                ) {
                    descFontSize = 'calc(10px + 1.1vmax);';
                }

                if (scope.infographic.groups[i].description === '') {
                    html +=
                        '<div class="infographic-value" style="font-size: ' +
                        dataFontSize +
                        '">' +
                        '<div class="infographic-value-text-above">' +
                        scope.infographic.groups[i].id +
                        '</div>' +
                        '</div>';
                } else if (
                    scope.infographic.groups[
                        i
                    ].descriptionPosition.toUpperCase() === 'ABOVE'
                ) {
                    html +=
                        '<div class="infographic-desc" style="font-size: ' +
                        descFontSize +
                        '">' +
                        '<div class="infographic-desc-text">' +
                        scope.infographic.groups[i].description +
                        '</div>' +
                        '</div>';
                    html +=
                        '<div class="infographic-value" style="font-size: ' +
                        dataFontSize +
                        '">' +
                        '<div class="infographic-value-text-below">' +
                        scope.infographic.groups[i].id +
                        '</div>' +
                        '</div>';
                } else {
                    html +=
                        '<div class="infographic-value" style="font-size: ' +
                        dataFontSize +
                        '">' +
                        '<div class="infographic-value-text-above">' +
                        scope.infographic.groups[i].id +
                        '</div>' +
                        '</div>';
                    html +=
                        '<div class="infographic-desc" style="padding-top: 1.5%; font-size: ' +
                        descFontSize +
                        '">' +
                        scope.infographic.groups[i].description +
                        '</div>';
                }

                html += '</div>';
            }

            scope.infographic.html = html;
        }

        /**
         * @name editText
         * @return {void}
         * @desc Triggered when the user is in the view of their compiled HTML, sends them back
         *       to the UI input and removes their compiled HTML
         */
        function editWidget() {
            scope.infographic.compiledTemplate = false;

            if (compiledEle) {
                compiledEle.parentNode.removeChild(compiledEle);
                compiledEle = undefined;
            }
        }

        /**
         * @name setData
         * @return {void}
         * @desc Called on load to ensure that there isn't already existing data, compiles our
         *       HTML for us as well after save() function has run and view has changed
         */
        function setData() {
            // check state if html exists then we set variables and compile html
            var currentOptions = scope.widgetCtrl.getWidget(
                    'view.infographic.options'
                ),
                headers,
                headerIdx,
                headerLen;

            // Check to see if we need to grab frameHeaders (we only need to on initialize)
            if (
                scope.infographic.headers.length === 0 &&
                scope.infographic.labels.length === 1
            ) {
                // Get the FrameHeaders
                // register message to come back to
                // Push in our frameHeaders
                headers = scope.widgetCtrl.getFrame('headers') || [];
                for (
                    headerIdx = 0, headerLen = headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    scope.infographic.headerTypes[
                        headers[headerIdx].displayName
                    ] = headers[headerIdx].dataType;
                    scope.infographic.headers.push(
                        headers[headerIdx].displayName
                    );
                    scope.infographic.labels.push(
                        headers[headerIdx].displayName
                    );
                }
            }

            // Replace values if necessary
            if (currentOptions.html) {
                scope.infographic.html = currentOptions.html;
            }

            if (currentOptions.groups) {
                scope.infographic.groups = currentOptions.groups;
            }

            if (scope.infographic.html) {
                getVars();
            } else {
                scope.infographic.cloak = false;
            }
        }

        /**
         * @name replaceVarsInPixel
         * @param {string} query Current pixel query
         * @return {string} The query with smssValues replaced
         * @desc Takes in a query with smssValues as defined above and replaces
         *       them with the appropriate actual values that are pulled from the store
         */
        function replaceVarsInPixel(query) {
            var semossVarRegexStr,
                semossVarRegex,
                semossVarsInQuery,
                index,
                length,
                varSplit,
                value,
                valueToReplace,
                tempQuery;

            tempQuery = query;

            // this is old ... we can probably delete it. I doubt anyone uses it.
            for (
                index = 0, length = smssValues.length;
                index < length;
                index++
            ) {
                tempQuery = tempQuery.replace(
                    new RegExp(smssValues[index], 'g'),
                    getSemossValues(smssValues[index])
                );
            }

            // this is new
            semossVarRegexStr = '<!*SMSS_[\\w_.]+>';
            semossVarRegex = new RegExp(semossVarRegexStr, 'g');
            semossVarsInQuery = tempQuery.match(semossVarRegex) || [];

            for (
                index = 0, length = semossVarsInQuery.length;
                index < length;
                index++
            ) {
                varSplit = semossVarsInQuery[index].split('.'); // splitting for any semoss variables that come back in objects like SMSS_SHARED_STATE

                if (varSplit.length > 1) {
                    // special logic for values that come back as object and user wants to access a specific key in the object
                    value = getSemossValues(varSplit[0].replace('!', '') + '>');
                    if (value) {
                        valueToReplace = value[varSplit[1].replace('>', '')];
                        if (varSplit[0].indexOf('!') > -1) {
                            // this is toggling all the booleans...e.g. <!SMSS_SHARED_STATE.displayValue>
                            valueToReplace = !valueToReplace;
                        }
                        tempQuery = tempQuery.replace(
                            semossVarsInQuery[index],
                            valueToReplace
                        );
                    }
                } else {
                    // if it exists in semossValuesMap
                    value = getSemossValues(semossVarsInQuery[index]);
                    if (value || value === 0) {
                        tempQuery = tempQuery.replace(
                            semossVarsInQuery[index],
                            value
                        );
                    }
                }
            }

            return tempQuery;
        }

        /**
         * @name generateNewGroupName
         * @return {void}
         * @desc Helper method that generate a new, unique name for
         *       a newly created group so that we do no have any overlap
         */
        function generateNewGroupName() {
            var name = 'group' + scope.infographic.paramCount;
            scope.infographic.paramCount++;

            return name;
        }

        /**
         * @name resetCmd
         * @param {string} type The type of reset to trigger
         * @param {Object} group The group to reset the command for
         * @return {void}
         * @desc Helper method that resets the values in the UI based on
         *       what type is passed - used so that certain elements don't
         *       linger when the user chooses certain variables
         */
        function resetCmd(type, group) {
            if (type === 'selectedHeader') {
                group.instance = '';
                group.instances = ['-No Instance-'];
                group.label = '-No Label-';
                group.cmdType = '';
                group.decimalFormat = 2;
                group.dataFontSize = 72;
                group.descriptionFontSize = 36;
                group.customDataFontSize = false;
                group.customDescFontSize = false;
                group.format = 'None';
            } else if (type === 'dataSource') {
                if (group.dataSource === 'Custom Pixel') {
                    group.cmd = '';
                    group.cmdType = 'Custom Pixel';
                    group.decimalFormat = 2;
                    group.dataFontSize = 72;
                    group.descriptionFontSize = 36;
                    group.customDataFontSize = false;
                    group.customDescFontSize = false;
                    group.format = 'None';
                } else if (group.dataSource === 'Data from Frame') {
                    group.instance = '';
                    group.instances = ['-No Instance-'];
                    group.label = '-No Label-';
                    group.cmdType = '';
                    group.selectedHeader = '';
                    group.decimalFormat = 2;
                    group.dataFontSize = 72;
                    group.descriptionFontSize = 36;
                    group.customDataFontSize = false;
                    group.customDescFontSize = false;
                    group.format = 'None';
                }
            } else if (type === 'instanceLevel') {
                group.instance = '';
            }
        }

        /**
         * @name getCmdTypes
         * @param {string} header the selectedHeader for a group
         * @return {array} The appropriate command types for a header
         *                 based off of its data type (STRING, DATE, NUMBER)
         * @desc Takes in a selectedHeader for a group and populates that group's
         *       instances array with the appropriate command types based on the
         *       data type of the selected header
         */
        function getCmdTypes(header) {
            var type;

            // Get the data type for our header
            type = scope.infographic.headerTypes[header];

            // If it's a string we should only show Count & Unique Count
            if (type === 'STRING') {
                return scope.infographic.stringCmdTypes;
            }

            // Otherwise show all the command types
            return scope.infographic.cmdTypes;
        }

        /**
         * @name getInstances
         * @param {Object} group the current group to get instances for
         * @return {void}
         * @desc Takes in a group and populates its instances array with the
         *       appropriate values...currently defaults to using the label value
         *       to grab the instances but this could be easily genericized
         */
        function getInstances(group) {
            var callback;

            if (group.label === '-No Label-') {
                return; // No need to run trhough this function if -No Label- to grab instances with
            }

            // Frame filter model grabs all the values for a unique label name

            // Run the metapixel and populate if data comes back, error if not
            // register message to come back to
            callback = function (data) {
                if (data.pixelReturn.length > 0) {
                    group.instances = data.pixelReturn[0].output.unfilterValues;
                    group.instances.unshift('-No Instance-');
                } else {
                    scope.widgetCtrl.alert(
                        'error',
                        group.selectedHeader + ' has no data to return!'
                    );
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frameFilterModel',
                        components: [group.label, '', -1, 0],
                        meta: true,
                        terminal: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name checkForDuplicateLabel
         * @param {Object} group current group to check duplicates for
         * @return {void}
         * @desc Checks to make sure that the selectedHeader and selected label
         *       for a command group aren't equivalent (doesn't make sense for them to be),
         *       if they are, produces a toastr error
         */
        function checkForDuplicateLabel(group) {
            if (group.selectedHeader === group.label) {
                scope.widgetCtrl.alert(
                    'error',
                    'Cannot have the same header selected for instance and label!'
                );
                group.label = '-No Label-';
            } else {
                getInstances(group);
                resetCmd('instanceLevel', group);
            }
        }

        /**
         * @name buildPixels
         * @return {void}
         * @desc Loops through each group in the widget scope and constructs the pixel command
         *       for it based on the various user inputs that the user has selected. These pixels
         *       are later accessed in the getVars() function to produce data to display
         */
        function buildPixels() {
            var pixel = '',
                pixelComponents = [],
                tempObj = {},
                regex,
                i;

            // Loop through each command group in the scope
            for (i = 0; i < scope.infographic.groups.length; i++) {
                if (scope.infographic.groups[i].dataSource === 'Custom Pixel') {
                    scope.infographic.groups[i].cmd = replaceVarsInPixel(
                        scope.infographic.groups[i].cmd
                    );
                    // Else construct our pixel based on the inputs the user has provided through the UI
                } else if (
                    scope.infographic.groups[i].dataSource === 'Data from Frame'
                ) {
                    // Grab the "template" pixel for our given command type and replace the <> var with
                    // the appropriate data
                    pixel = '';
                    pixel += scope.widgetCtrl.getFrame('name') + ' | ';
                    pixel +=
                        scope.infographic.pixelCommands[
                            scope.infographic.groups[i].cmdType
                        ];
                    regex = new RegExp('<ele>', 'g');
                    pixel = pixel.replace(
                        regex,
                        scope.infographic.groups[i].selectedHeader
                    );

                    pixelComponents.push({
                        type: 'Pixel',
                        components: [pixel],
                        meta: true,
                    });

                    // If the pixel has a label, we have to incorporate it either on an instance or
                    // non-instanc level
                    if (scope.infographic.groups[i].label !== '-No Label-') {
                        // Instance level
                        if (
                            scope.infographic.groups[i].instance !==
                            '-No Instance-'
                        ) {
                            // Create our filter obj
                            tempObj[scope.infographic.groups[i].label] = {
                                comparator: '==',
                                value: scope.infographic.groups[i].instance,
                            };

                            pixelComponents.push(
                                {
                                    type: 'group',
                                    components: [
                                        [scope.infographic.groups[i].label],
                                    ],
                                },
                                {
                                    type: 'filter',
                                    components: [tempObj],
                                }
                            );

                            tempObj = {};

                            // Non-instance
                        } else if (
                            scope.infographic.groups[i].instance ===
                            '-No Instance-'
                        ) {
                            pixelComponents.push({
                                type: 'group',
                                components: [
                                    [scope.infographic.groups[i].label],
                                ],
                            });
                        }
                    }

                    pixelComponents.push({
                        type: 'collect',
                        components: [-1],
                        terminal: true,
                    });

                    // Set the group's 'cmd' attribute and reset our pixel and pixelComponents vars
                    scope.infographic.groups[i].cmd = pixelComponents;
                    pixel = '';
                    pixelComponents = [];
                }
            }
        }

        /**
         * @name checkCompileDisabled
         * @return {void}
         * @desc Helper method called when the user hits compile, used to check
         *       if the user has entered all appropriate inputs for each group and
         *       if not, send a message back to the user stating so.
         */
        function checkCompileDisabled() {
            var i;

            for (i = 0; i < scope.infographic.groups.length; i++) {
                if (scope.infographic.groups[i].dataSource === 'Custom Pixel') {
                    // Case that no command when a custom pixel is selected
                    if (scope.infographic.groups[i].cmd === '') {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Custom Pixel input is missing. Please type in a custom pixel to continue.'
                        );
                        return true;
                    }
                } else if (
                    scope.infographic.groups[i].dataSource === 'Data from Frame'
                ) {
                    // Case that no column has been selected from which to pull data from
                    if (scope.infographic.groups[i].selectedHeader === '') {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Chosen data column is empty. Please choose a column to pull data from.'
                        );
                        return true;
                        // Case that no math operation
                    } else if (scope.infographic.groups[i].cmdType === '') {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Math operation type is empty. Please choose a math operation type.'
                        );
                        return true;
                        // Case that user has chosen a label for grouping but hasn't made an instance-level choice yet
                    } else if (
                        scope.infographic.groups[i].label !== '-No Label-' &&
                        scope.infographic.groups[i].instance === ''
                    ) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Instance is missing. Please choose an instance to continue'
                        );
                        return true;
                    } else if (
                        scope.infographic.groups[i].description !== '' &&
                        scope.infographic.groups[i].descriptionPosition === ''
                    ) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Please select a position for your text description.'
                        );
                        return true;
                    }
                    // Case that no dataSource was selected
                } else {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Please select a data source to continue.'
                    );
                    return true;
                }
            }

            return false;
        }

        /**
         * @name removeGroup
         * @param {number} groupIdx position of group to splice from
         * @returns {void}
         * @desc removes the group from the list of commands
         */
        function removeGroup(groupIdx) {
            scope.infographic.groups.splice(groupIdx, 1);
        }

        /**
         * @name addNewGroup
         * @return {void}
         * @desc Helper method that adds a new group for the user
         */
        function addNewGroup() {
            scope.infographic.groups.push({
                id: '',
                description: '',
                cmdType: '',
                cmd: '',
                descriptionPosition: 'Below',
                dataType: '',
                selectedHeader: '',
                instance: '-No Instance-',
                label: '-No Label-',
                instances: [],
                dataSource: '',
                decimalFormat: 2,
                descriptionFontSize: 36,
                dataFontSize: 72,
                format: 'None',
                customDataFontSize: false,
                customDescFontSize: false,
            });
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @return {void}
         */
        function initialize() {
            var updateViewListener, updateFilterListener;

            // add listeners
            updateViewListener = scope.widgetCtrl.on(
                'update-view',
                function () {
                    setData();
                }
            );

            updateFilterListener = scope.widgetCtrl.on(
                'update-frame-filter',
                function () {
                    setData();
                }
            );

            scope.$on('$destroy', function () {
                updateViewListener();
                updateFilterListener();
            });

            setData();
        }

        initialize();
    }
}
