'use strict';

import Resizable from '@/core/utility/resizable.ts';
import Utility from '@/core/utility/utility.js';

import './html-widget.scss';

import './html-widget-dimensions/html-widget-dimensions.directive';

export default angular
    .module('app.html-widget.directive', [
        'app.html-widget.html-widget-dimensions',
    ])
    .directive('htmlWidget', htmlWidgetDirective);

htmlWidgetDirective.$inject = [
    '$timeout',
    '$q',
    '$compile',
    'semossCoreService',
];

function htmlWidgetDirective($timeout, $q, $compile, semossCoreService) {
    htmlWidgetCtrl.$inject = [];
    htmlWidgetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget'],
        controllerAs: 'htmlWidget',
        bindToController: {},
        template: require('./html-widget.directive.html'),
        controller: htmlWidgetCtrl,
        link: htmlWidgetLink,
        replace: true,
    };

    function htmlWidgetCtrl() {}

    function htmlWidgetLink(scope, ele, attrs, ctrl) {
        const RESTRICED_NAMES = ['scope'],
            RESTRICTED_CHARACTERS = ['$'];

        let editResizable,
            contentEle,
            renderedScope,
            renderedEle,
            listeners = [];

        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        scope.htmlWidget.tools = true;

        scope.htmlWidget.presentation = false;

        scope.htmlWidget.edit = {
            open: false,
            view: 'wysiwyg',
        };

        scope.htmlWidget.content = {
            html: '',
            freeze: false,
            sanitize: true,
            variables: [],
            api: {},
        };

        scope.htmlWidget.parameters = {};

        scope.htmlWidget.file = {};

        scope.htmlWidget.save = {
            open: false,
            new: true,
            name: '',
            comment: '',
        };

        scope.htmlWidget.renderCustom = renderCustom;
        scope.htmlWidget.resetCustom = resetCustom;
        scope.htmlWidget.previewCustom = previewCustom;
        scope.htmlWidget.openEdit = openEdit;
        scope.htmlWidget.renderEdit = renderEdit;
        scope.htmlWidget.keydownEdit = keydownEdit;
        scope.htmlWidget.switchEditView = switchEditView;
        scope.htmlWidget.addEditVariable = addEditVariable;
        scope.htmlWidget.removeEditVariable = removeEditVariable;
        scope.htmlWidget.openFile = openFile;
        scope.htmlWidget.openSave = openSave;
        scope.htmlWidget.closeSave = closeSave;
        scope.htmlWidget.saveSave = saveSave;
        scope.htmlWidget.updateListeners = updateListeners;

        /**
         * @name updateCustom
         * @desc set the data from the store, if a file exists load it
         * @return {void}
         */
        function updateCustom() {
            // check state if html exists then we set variables and compile html
            let options =
                    scope.widgetCtrl.getWidget('view.html-widget.options') ||
                    {},
                name;

            // in the form of name:value, these update the html + variables
            if (
                options.parameters &&
                Object.keys(options.parameters).length > 0
            ) {
                scope.htmlWidget.parameters = options.parameters;
            } else {
                scope.htmlWidget.parameters = {};
            }

            if (!options.path) {
                openEdit();
                updateListeners();
                return;
            }

            name = options.path.split('/').pop();

            // open the file in this space with this path
            openFile({
                name: name,
                path: options.path,
                space: options.space,
            });

            // close edit if open
            scope.htmlWidget.edit.open = false;
        }

        /**
         * @name refreshCustom
         * @desc refresh the data and then compile the view
         * @returns {void}
         */
        function refreshCustom() {
            let promises = [];

            for (
                let variableIdx = 0,
                    variableLen = scope.htmlWidget.content.variables.length;
                variableIdx < variableLen;
                variableIdx++
            ) {
                const variable =
                    scope.htmlWidget.content.variables[variableIdx];

                // if there is no variable name, skip it
                if (!variable.name) {
                    continue;
                }

                if (variable.type === 'Query') {
                    let deferred = $q.defer(),
                        pixel,
                        callback;

                    pixel = updateSEMOSSValues(variable.value);

                    // eslint-disable-next-line no-loop-func
                    callback = (response) => {
                        let type = response.pixelReturn[0].operationType[0];

                        if (
                            type.indexOf('ERROR') > -1 ||
                            !response.pixelReturn
                        ) {
                            // remove the variable
                            delete scope.htmlWidget.content.api[variable.name];
                        } else {
                            // register the variable to the bound
                            scope.htmlWidget.content.api[variable.name] =
                                response.pixelReturn;
                        }

                        deferred.resolve();
                    };

                    promises.push(deferred.promise);

                    scope.widgetCtrl.meta(
                        [
                            {
                                type: 'Pixel',
                                components: [pixel],
                                terminal: true,
                                meta: true,
                            },
                        ],
                        callback,
                        [scope.widgetCtrl.widgetId]
                    );
                } else if (variable.type === 'Value') {
                    scope.htmlWidget.content.api[variable.name] =
                        variable.value;
                }
            }

            scope.widgetCtrl.emit('start-loading', {
                id: scope.widgetCtrl.widgetId,
                message: 'Loading Widget',
            });

            $q.all(promises).then(function () {
                renderCustom();

                scope.widgetCtrl.emit('stop-loading', {
                    id: scope.widgetCtrl.widgetId,
                });
            });
        }

        /**
         * @name renderCustom
         * @desc actually render the data
         * @returns {void}
         */
        function renderCustom() {
            let html,
                id = `html-widget__content__compiled__${scope.$id}`; // it will be unique across

            if (renderedScope) {
                renderedScope.$destroy();
            }

            if (renderedEle) {
                renderedEle.parentNode.removeChild(renderedEle);
                renderedEle = undefined;
            }

            renderedScope = scope.$new();

            // set up the api
            renderedScope.execute = execute;

            // bind variables to the scope
            for (let prop in scope.htmlWidget.content.api) {
                if (
                    scope.htmlWidget.content.api.hasOwnProperty(prop) &&
                    !renderedScope.hasOwnProperty(prop)
                ) {
                    renderedScope[prop] = scope.htmlWidget.content.api[prop];
                }
            }

            html = `
            <div class="html-widget__content__compiled" id="${id}">
                ${scope.htmlWidget.content.html}
            </div>`;

            if (scope.htmlWidget.content.sanitize) {
                html = sanitize(html, `#${id}`);
            }

            renderedEle = $compile(html)(renderedScope)[0];
            contentEle.appendChild(renderedEle);
        }

        /**
         * @name resetCustom
         * @desc reset to the original file
         * @return {void}
         */
        function resetCustom() {
            scope.htmlWidget.edit.open = false;

            // this will set it to the original one
            parseFile(scope.htmlWidget.file.content);
        }

        /**
         * @name previewCustom
         * @desc preview the data
         * @return {void}
         */
        function previewCustom() {
            if (validateEditVariable()) {
                refreshCustom();
            }
        }

        /** Edit Functions **/
        /**
         * @name openEdit
         * @desc open edit, so we can edit the data
         * @return {void}
         */
        function openEdit() {
            scope.htmlWidget.edit.open = true;

            addEditVariable();
        }

        /**
         * @name renderEdit
         * @desc render the editor
         * @return {void}
         */
        function renderEdit() {
            let editorEle = ele[0].querySelector('#html-widget__editor');

            if (editResizable && editResizable.hasOwnProperty('destroy')) {
                editResizable.destroy();
            }

            contentEle.style.left = null;

            editResizable = new Resizable({
                available: ['E'],
                unit: '%',
                content: editorEle,
                container: ele[0],
                restrict: {
                    minimumWidth: '20%',
                    maximumWidth: '70%',
                },
                on: function (top, left, height, width) {
                    contentEle.style.left = width + '%';
                    contentEle.style.width = 100 - width + '%';
                },
                stop: function () {
                    $timeout();
                },
            });
        }

        /**
         * @name keydownEdit
         * @desc prevent tab clicks
         * @param {event} $event - event for the action
         * @returns {void}
         */
        function keydownEdit($event) {
            // prevent tabbing
            // TODO: enable tab
            if ($event.keyCode === 9) {
                $event.preventDefault();
            }
        }

        /**
         * @name switchEditView
         * @desc switch the view to something else
         * @param {string} view - view to switch to
         * @returns {void}
         */
        function switchEditView(view) {
            scope.htmlWidget.edit.view = view;
        }

        /**
         * @name checkEditVariable
         * @desc has it been modified.
         * @returns {boolean} is edit modified?
         */
        function checkEditVariable() {
            if (scope.htmlWidget.file.html !== scope.htmlWidget.content.html) {
                return true;
            }

            let variables = [];
            for (
                let variableIdx = 0,
                    variableLen = scope.htmlWidget.content.variables.length;
                variableIdx < variableLen;
                variableIdx++
            ) {
                const variable =
                    scope.htmlWidget.content.variables[variableIdx];

                // if there is no variable name, skip it
                if (!variable.name) {
                    continue;
                }

                variables.push(variable);
            }

            if (scope.htmlWidget.file.variables.length !== variables.length) {
                return true;
            }

            for (
                let variableIdx = 0,
                    variableLen = scope.htmlWidget.file.variables.length;
                variableIdx < variableLen;
                variableIdx++
            ) {
                if (
                    scope.htmlWidget.file.variables[variableIdx].name !==
                        variables[variableIdx].name ||
                    scope.htmlWidget.file.variables[variableIdx].type !==
                        variables[variableIdx].type ||
                    scope.htmlWidget.file.variables[variableIdx].value !==
                        variables[variableIdx].value
                ) {
                    return true;
                }
            }

            return false;
        }

        /**
         * @name validateEditVariable
         * @desc adds an additional parameter
         * @returns {boolean} is edit valid?
         */
        function validateEditVariable() {
            const previous = {};

            let valid = true;
            for (
                let variableIdx = 0,
                    variableLen = scope.htmlWidget.content.variables.length;
                variableIdx < variableLen;
                variableIdx++
            ) {
                const variable =
                    scope.htmlWidget.content.variables[variableIdx];

                // if there is no variable name, skip it
                if (!variable.name) {
                    continue;
                }

                if (previous[variable.name]) {
                    scope.widgetCtrl.alert(
                        'error',
                        `${variable.name} has a duplicate name. Please remove duplicates.`
                    );

                    valid = false;
                }

                previous[variable.name] = true;

                if (RESTRICED_NAMES.indexOf(variable.name) > -1) {
                    scope.widgetCtrl.alert(
                        'error',
                        `${variable.name} is a restricted parameter name. Please rename the new parameter.`
                    );

                    valid = false;
                }

                for (
                    let characterIdx = 0,
                        characterLen = RESTRICTED_CHARACTERS.length;
                    characterIdx < characterLen;
                    characterIdx++
                ) {
                    if (
                        variable.name.indexOf(
                            RESTRICTED_CHARACTERS[characterIdx]
                        ) > -1
                    ) {
                        scope.widgetCtrl.alert(
                            'error',
                            `${variable.name} contains a restricted character (${RESTRICTED_CHARACTERS[characterIdx]}). Please rename the new parameter.`
                        );

                        valid = false;
                        break;
                    }
                }

                if (!variable.type) {
                    scope.widgetCtrl.alert(
                        'error',
                        `${variable.name} needs a type.`
                    );

                    valid = false;
                }

                if (!variable.value) {
                    scope.widgetCtrl.alert(
                        'error',
                        `${variable.name} needs a query.`
                    );

                    valid = false;
                }
            }

            return valid;
        }

        /**
         * @name addEditVariable
         * @desc adds an additional parameter
         * @returns {void}
         */
        function addEditVariable() {
            scope.htmlWidget.content.variables.push({
                name: '',
                type: 'Query',
                value: '',
            });
        }

        /**
         * @name removeEditVariable
         * @param {idx} idx - idx of variable to delete
         * @desc removes the param from the list
         * @returns {void}
         */
        function removeEditVariable(idx) {
            scope.htmlWidget.content.variables.splice(idx, 1);
        }

        /** File Functions **/
        /**
         * @name openFile
         * @desc open the file
         * @param {object} file - file to open
         * @return {void}
         */
        function openFile(file) {
            let callback;

            callback = function (response) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.htmlWidget.file = {
                    name: file.name,
                    path: file.path,
                    space: file.space,
                    content: output,
                    html: '',
                    variables: [],
                };

                if (!output) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Template does not have any content'
                    );
                }

                parseFile(output);
            };

            scope.widgetCtrl.execute(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `GetAsset(filePath=["${file.path}"], space=[${
                                file.space ? `"${file.space}"` : ''
                            }]);`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name parseFile
         * @param {string} html - html to extract data from
         * @desc extract important components form the file and update the data
         * @return {void}
         */
        function parseFile(html) {
            let updated = html,
                element,
                dataEle;

            // clear it out
            scope.htmlWidget.content = {
                html: '',
                freeze: false,
                sanitize: true,
                variables: [],
                api: {},
            };

            // update based on the parameters
            if (Object.keys(scope.htmlWidget.parameters).length > 0) {
                let tokens = semossCoreService.pixel.tokenize(html);
                updated = semossCoreService.pixel.construct(
                    tokens,
                    scope.htmlWidget.parameters
                );
            }

            // parse the html and extract the data, we do this by creating an element
            element = document.createElement('div');

            // create an HTML fragment
            element.innerHTML = updated;

            // grab the element
            dataEle =
                element.querySelector('#semoss') ||
                element.querySelector('semoss');

            if (dataEle) {
                if (dataEle.textContent) {
                    try {
                        let options = JSON.parse(dataEle.textContent) || {};

                        if (Array.isArray(options.variables)) {
                            scope.htmlWidget.content.variables =
                                options.variables;
                        } else if (
                            options.variables !== null &&
                            typeof options.variables === 'object'
                        ) {
                            scope.htmlWidget.content.variables = [];

                            for (let name in options.variables) {
                                if (options.variables.hasOwnProperty(name)) {
                                    scope.htmlWidget.content.variables.push({
                                        name: name,
                                        type:
                                            options[name].variables || 'Query',
                                        value: options[name].variables || '',
                                    });
                                }
                            }
                        } else {
                            scope.htmlWidget.content.variables = [];
                        }

                        scope.htmlWidget.content.freeze =
                            options.freeze || false;
                        scope.htmlWidget.content.sanitize =
                            options.sanitize || true;
                    } catch (error) {
                        scope.widgetCtrl.alert(
                            'Error',
                            'Error extracting data from html'
                        );
                    }
                }

                // remove the element
                dataEle.parentNode.removeChild(dataEle);
            }

            scope.htmlWidget.content.html = element.innerHTML || '';

            // save back to the file, this is the original. It will be helpful for checking if it has been changed or modified.
            scope.htmlWidget.file.html = scope.htmlWidget.content.html;
            scope.htmlWidget.file.variables = JSON.parse(
                JSON.stringify(scope.htmlWidget.content.variables)
            );

            // update the data
            refreshCustom();
            updateListeners();
        }

        /** Save */
        /**
         * @name openSave
         * @desc open the save modal
         * @returns {void}
         */
        function openSave() {
            // check if the edit variables have been modified, if they have not skip ahead to the view
            if (!checkEditVariable()) {
                saveView();

                return;
            }

            // check if is valid
            if (validateEditVariable()) {
                scope.htmlWidget.save = {
                    open: true,
                    new:
                        !scope.htmlWidget.file ||
                        Object.keys(scope.htmlWidget.file).length === 0,
                    name:
                        scope.htmlWidget.file && scope.htmlWidget.file.name
                            ? scope.htmlWidget.file.name
                            : '',
                    comment: '',
                };
            }
        }

        /**
         * @name closeSave
         * @desc close the save modal
         * @returns {void}
         */
        function closeSave() {
            scope.htmlWidget.save = {
                open: false,
                new: true,
                name: '',
                comment: '',
            };
        }

        /**
         * @name saveSave
         * @desc actually perform the save
         * @returns {void}
         */
        function saveSave() {
            let callback, path, space, content, variables;

            if (!scope.htmlWidget.save.name) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please include a name for your text widget.'
                );
                return;
            }

            if (!scope.htmlWidget.save.comment) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please include a comment to describe your changes.'
                );
                return;
            }

            callback = function (response) {
                const type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // update the file object
                scope.htmlWidget.file = {
                    name: scope.htmlWidget.save.name,
                    path: path,
                    space: space,
                    content: content,
                    html: scope.htmlWidget.content.html,
                    variables: JSON.parse(JSON.stringify(variables)),
                };

                // update the view
                saveView();

                // close the save modal
                closeSave();
            };

            // if it is new we save it relative
            if (scope.htmlWidget.save.new) {
                path = `${scope.htmlWidget.save.name}.html`;
                space = '';
            } else {
                path = scope.htmlWidget.file.path;
                space = scope.htmlWidget.file.space;
            }

            variables = [];
            for (
                let variableIdx = 0,
                    variableLen = scope.htmlWidget.content.variables.length;
                variableIdx < variableLen;
                variableIdx++
            ) {
                const variable =
                    scope.htmlWidget.content.variables[variableIdx];

                // if there is no variable name, skip it
                if (!variable.name) {
                    continue;
                }

                variables.push(variable);
            }

            content = `${scope.htmlWidget.content.html}
<script type="application/json" id="semoss">
    ${JSON.stringify(
        {
            variables: variables,
            freeze: scope.htmlWidget.content.freeze,
            sanitize: scope.htmlWidget.content.sanitize,
        },
        null,
        '\t'
    )}
</script>`;

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `SaveAsset(fileName=["${path}"], content=["<encode>${content}</encode>"], space=[${
                                space ? `"${space}"` : ''
                            }])`,
                        ],
                        terminal: true,
                    },
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `CommitAsset(filePath=["${path}"], comment=["${
                                scope.htmlWidget.save.comment
                            }"], space=[${space ? `"${space}"` : ''}])`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Listeners */
        /**
         * @name listen
         * @desc listen for changes to update the data
         * @returns {void}
         */
        function updateListeners() {
            // this will remove all of the old listeners
            if (listeners) {
                for (
                    let listenerIdx = 0, listenerLen = listeners.length;
                    listenerIdx < listenerLen;
                    listenerIdx++
                ) {
                    if (listeners[listenerIdx]) {
                        listeners[listenerIdx]();
                    }
                }
            }

            // add new if applicable
            if (!scope.htmlWidget.content.freeze) {
                listeners = [
                    scope.widgetCtrl.on('update-frame-filter', refreshCustom),
                    scope.widgetCtrl.on('update-frame', refreshCustom),
                    scope.widgetCtrl.on('refresh-task', refreshCustom),
                ];
            }
        }

        /** View */
        /**
         * @name updateView
         * @desc called to set the view from the store
         * @return {void}
         */
        function updateView() {
            let options =
                scope.widgetCtrl.getWidget('view.htmlWidget.options') || {};

            // this will load a new file or refresh the file
            if (
                !scope.htmlWidget.file.path ||
                (scope.htmlWidget.file.path !== options.path &&
                    scope.htmlWidget.file.space !== options.space)
            ) {
                updateCustom();
            } else {
                // refresh the data
                refreshCustom();

                scope.htmlWidget.edit.open = false;
            }
        }

        /**
         * @name saveView
         * @desc actually save the view
         * @return {void}
         */
        function saveView() {
            // set the view
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'html-widget',
                        {
                            path: scope.htmlWidget.file.path,
                            space: scope.htmlWidget.file.space,
                        },
                    ],
                    terminal: true,
                },
            ]);
        }

        /** Presentation */
        /**
         * @name updatePresentation
         * @desc called when the presentation information changes
         * @returns {void}
         */
        function updatePresentation() {
            scope.htmlWidget.presentation =
                scope.insightCtrl.getWorkspace('presentation');
        }

        /** Utility */
        /**
         * @name updateSEMOSSValues
         * @param {string} pixel - query the query used to replace smss values
         * @desc this will check to see if the query has semoss values that need to be used and update them
         * @returns {string} - the filled in query
         */
        function updateSEMOSSValues(pixel) {
            let tempQuery = pixel,
                semossVarRegex = new RegExp('<!*SMSS_[\\w_.]+>', 'g'),
                matches = tempQuery.match(semossVarRegex) || [];

            for (
                let matchIdx = 0, matchLen = matches.length;
                matchIdx < matchLen;
                matchIdx++
            ) {
                let accessor, variable, value, matchedValue;

                // remove the start < and end >
                accessor = matches[matchIdx].substring(
                    1,
                    matches[matchIdx].length - 1
                );

                // split so we can remove the param, so we can get it using the accessor
                accessor = accessor.split('.');
                variable = accessor.shift();

                if (variable.indexOf('!') === 0) {
                    variable = variable.substring(1, variable.length);
                }

                // add the start < and end > back
                variable = '<' + variable + '>';

                value = getSEMOSSValues(variable);
                if (typeof value === 'undefined') {
                    // no variable is set
                    continue;
                }

                // get the accessor
                accessor = accessor.join('.');

                // special logic for values that come back as object and user wants to access a specific key in the object
                matchedValue = Utility.getter(value, accessor);

                // this is toggling all the booleans...e.g. <!SMSS_SHARED_STATE.displayValue>
                // first character is <
                if (
                    matches[matchIdx].indexOf('!') === 1 &&
                    typeof matchedValue === 'boolean'
                ) {
                    matchedValue = !matchedValue;
                }

                tempQuery = tempQuery.replace(matches[matchIdx], matchedValue);
            }

            return tempQuery;
        }

        /**
         * @name getSEMOSSValues
         * @param {*} variable - the value to grab
         * @desc grabs values stored internally on the FE
         * @returns {*} returns the value
         */
        function getSEMOSSValues(variable) {
            let value;

            switch (variable) {
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
                case '<SMSS_FRAME>':
                    value = scope.widgetCtrl.getShared(
                        'frames.' + scope.widgetCtrl.getWidget('frame')
                    );
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
                    value = semossCoreService.getOptions(
                        scope.widgetCompiler.widgetId,
                        'limit'
                    );
                    break;
                case '<SMSS_USER>':
                    let logins = semossCoreService.getCurrentLogins();
                    value = Utility.isEmpty(logins)
                        ? ''
                        : logins[Object.keys(logins)[0]];
                    break;
                default:
                    value = undefined;
            }

            return value;
        }

        /**
         * @name sanitize
         * @desc sanitize the HTML and help the css become scoped.
         * 1. go thru html until we bump into style tag
         * 2. parse css rules and add necessary selector to each rule without it
         * 3. look for closing style tag to stop parsing css
         * NOTE: We assume css is not malformed
         * @param {string} html - html to clean
         * @param {string} selector - selector to tag
         * @returns {void}
         */
        function sanitize(html, selector) {
            var sanitizedContent = '',
                i = 0,
                j,
                k,
                rules,
                checkTag = '',
                inStyle = false,
                timeToAddSelector,
                determineNoSelector = '',
                atRule = false;

            while (i < html.length) {
                sanitizedContent += html[i];

                // this is not a closing tag,
                // lets get content inside of tag to determine if
                // it is a style tag
                if (html[i] === '<' && html[i + 1] !== '/') {
                    j = i + 1;
                    checkTag = '<'; // we already swallowed open bracket so lets just add it to checkTag
                    while (html[j - 1] !== '>' && j < html.length) {
                        checkTag += html[j];
                        sanitizedContent += html[j];
                        j++;
                    }
                    i = j - 1;

                    if (checkTag.replace(/ /g, '').indexOf('<style') > -1) {
                        inStyle = true;
                        timeToAddSelector = true;
                    }
                }
                i++;

                while (inStyle && i < html.length) {
                    // keep adding any additional whitespace so
                    // selector ends up on same line as rule
                    while (
                        html[i] === ' ' ||
                        html[i] === '\t' ||
                        (html[i] === '\n' && i < html.length)
                    ) {
                        sanitizedContent += html[i];
                        i++;
                    }
                    // now that we need to add the selector
                    // look at latest string (which are css rules)
                    if (timeToAddSelector) {
                        j = i;
                        determineNoSelector = '';

                        // do not want to add selectors to @ rules
                        if (html[j] === '@') {
                            atRule = true;
                        }

                        while (html[j] !== '{' && j < html.length) {
                            if (html[j] === ';' && atRule) {
                                break;
                            }
                            determineNoSelector += html[j];
                            j++;
                        }

                        // split rules on comma, add selector if not there.
                        // add to sanitizedContent
                        // trimming rules to prevent whitespace growth
                        rules = determineNoSelector
                            .split(',')
                            // eslint-disable-next-line no-loop-func
                            .map((rule) => {
                                if (rule.indexOf(selector) === -1 && !atRule) {
                                    return selector + ' ' + rule.trim();
                                }

                                return rule.trim();
                            })
                            .join(', ');

                        sanitizedContent += rules;
                        i = j;

                        // if it is an @ rule, will be adding a selector at the next rule
                        // so keep timeToAddSelector true
                        // since normal flow is to look for an opening brace then stop until close,
                        // with @ rule we are looking for either  an opening brace, then won't have a closing brace
                        // until after the first rule inside of it or a semi colon in case of @import
                        if (!atRule) {
                            timeToAddSelector = false;
                        }
                        atRule = false;
                    }

                    if (html[i] === '}') {
                        k = i + 1;
                        checkTag = '';

                        // before saying we need to add a selector, make sure it is not final rule
                        while (k < html.length) {
                            // ignore whitespace
                            if (
                                html[k] === ' ' ||
                                html[k] === '\n' ||
                                html[k] === '\t'
                            ) {
                                k++;
                                // not the end, add selector
                                // check for closing tag as well as closing bracket in case of
                                // nested media query
                            } else if (html[k] !== '<' && html[k] !== '}') {
                                timeToAddSelector = true;
                                break;
                            } else {
                                break;
                            }
                        }
                    }

                    // check to see if we are done with the style component
                    if (html[i] === '<' && html[i + 1] === '/') {
                        inStyle = false;
                    }

                    // TODO: fix this, media queries will put i at length of html
                    if (i < html.length) {
                        sanitizedContent += html[i];
                    }
                    i++;
                }
            }

            // update the content
            return sanitizedContent;
        }

        /** API */
        /**
         * @name execute
         * @param {string} pixel - the pixel to run
         * @param {array} names - names to update
         * @param {array} values - values to update
         * @desc run a pixel from the html
         * @returns {void}
         */
        function execute(pixel, names, values) {
            let updated = pixel;

            // TODO: Tokenize and then construct?
            if (names && values && names.length === values.length) {
                let parameters = {},
                    tokens = semossCoreService.pixel.tokenize(updated);

                for (
                    let nameIdx = 0, nameLen = names.length;
                    nameIdx < nameLen;
                    nameIdx++
                ) {
                    parameters[names[nameIdx]] = values[nameIdx];
                }

                updated = semossCoreService.pixel.construct(tokens, parameters);
            }

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [updated],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @return {void}
         */
        function initialize() {
            let updateViewListener, updatedPresentationListener;

            contentEle = ele[0].querySelector('#html-widget__content');

            updateCustom();
            updatePresentation();

            updateViewListener = scope.widgetCtrl.on('update-view', updateView);
            updatedPresentationListener = scope.insightCtrl.on(
                'updated-presentation',
                updatePresentation
            );

            scope.$on('$destroy', function () {
                updateViewListener();
                updatedPresentationListener();

                if (listeners) {
                    for (
                        let listenerIdx = 0, listenerLen = listeners.length;
                        listenerIdx < listenerLen;
                        listenerIdx++
                    ) {
                        if (listeners[listenerIdx]) {
                            listeners[listenerIdx]();
                        }
                    }
                }

                if (editResizable && editResizable.hasOwnProperty('destroy')) {
                    editResizable.destroy();
                }
            });
        }

        initialize();
    }
}
