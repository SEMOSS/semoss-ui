'use strict';

import './text-widget.scss';

export default angular
    .module('app.text-widget.directive', [])
    .directive('textWidget', textWidget);

textWidget.$inject = ['$compile', '$sce'];

function textWidget($compile, $sce) {
    textWidgetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: textWidgetLink,
        template: require('./text-widget.directive.html'),
    };

    function textWidgetLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateViewListener,
            updateFrameFilterListener,
            updateFrame,
            refreshTask,
            smssValues = [
                '<CurrentPanel>',
                '<Layout>',
                '<InsightId>',
                '<NewCloneId>',
                '<Frame>',
            ],
            compiledEle,
            count = 0;

        // binding everything to textWidget. We need to instantiate, because we do not have a controller.;
        scope.textWidget = {};

        // edit functions
        scope.textWidget.save = save;
        scope.textWidget.addParam = addParam;
        scope.textWidget.removeParam = removeParam;

        // view functions
        scope.textWidget.editWidget = editWidget;
        scope.textWidget.runPixel = runPixel;
        scope.textWidget.toggleListeners = toggleListeners;
        scope.textWidget.trustAsResourceUrl = trustAsResourceUrl;

        // declare and initialize local variables
        scope.textWidget.html = '';
        scope.textWidget.compiledTemplate = false;
        scope.textWidget.varList = [
            {
                name: '',
                query: '',
            },
        ];
        scope.textWidget.customParams = {};
        scope.textWidget.freeze = false;
        scope.textWidget.loading = true; // toggle to use the main loading screen or use one in the directive
        scope.textWidget.cloak = true;

        /**
         * @name trustAsResourceUrl
         * @param {*} url the url link
         * @desc trusts the url link
         * @returns {object} the trusted url
         */
        function trustAsResourceUrl(url) {
            return $sce.trustAsResourceUrl(url);
        }

        /**
         * @name getSemossData
         * @param {*} dataToGrab which data to grab
         * @desc get semoss values
         * @returns {string} the semoss value
         */
        function getSemossData(dataToGrab) {
            var value;

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
                default:
                    value = '';
            }

            return value;
        }

        /**
         * @name save
         * @desc saves te view
         * @returns {void}
         */
        function save() {
            var callback;

            callback = function () {
                // if freeze option is checked, we need to manually trigger the setData to update/compile the view.
                // freeze means all listeners are turned off
                if (scope.textWidget.freeze) {
                    setData();
                }
            };

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelView',
                        components: [
                            'text-widget',
                            {
                                html: scope.textWidget.html,
                                varList: scope.textWidget.varList,
                                freeze: scope.textWidget.freeze,
                                loading: scope.textWidget.loading,
                            },
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name addParam
         * @desc adds an additional parameter
         * @returns {void}
         */
        function addParam() {
            scope.textWidget.varList.push({
                name: '',
                query: '',
            });
        }

        /**
         * @name removeParam
         * @param {number} index position of var list to splice from
         * @desc removes the param from the list
         * @returns {void}
         */
        function removeParam(index) {
            scope.textWidget.varList.splice(index, 1);
        }

        /**
         * @name getVars
         * @desc get the variable information
         * @returns {void}
         */
        function getVars() {
            // create a list of notebooks
            var restrictedNames = ['textWidget'],
                i,
                len,
                completeQuery,
                smssValueIdx,
                regex,
                listeners = [];

            if (scope.textWidget.html) {
                scope.textWidget.html = scope.textWidget.html
                    .replace(/\\t/g, '')
                    .replace(/\\n/g, '');

                count = 0;

                for (
                    i = 0, len = scope.textWidget.varList.length;
                    i < len;
                    i++
                ) {
                    if (
                        restrictedNames.indexOf(
                            scope.textWidget.varList[i].name
                        ) > -1
                    ) {
                        scope.widgetCtrl.alert(
                            'error',
                            scope.textWidget.varList[i].name +
                                ' is a restricted parameter name.'
                        );
                        return;
                    }

                    // don't want them overriding scope.$ anything...
                    if (scope.textWidget.varList[i].name.indexOf('$') > -1) {
                        scope.widgetCtrl.alert(
                            'error',
                            "'$' is not allowed in the parameter name."
                        );
                        return;
                    }

                    if (
                        scope.textWidget.varList[i].query &&
                        scope.textWidget.varList[i].name
                    ) {
                        completeQuery = scope.textWidget.varList[i].query;
                        // replace anything that matches the values in smssValues
                        for (
                            smssValueIdx = 0;
                            smssValueIdx < smssValues.length;
                            smssValueIdx++
                        ) {
                            regex = new RegExp(smssValues[smssValueIdx], 'g');
                            completeQuery = completeQuery.replace(
                                regex,
                                getSemossData(smssValues[smssValueIdx])
                            );
                        }

                        count++;

                        if (scope.textWidget.loading) {
                            listeners = [scope.widgetCtrl.widgetId];
                        } else {
                            listeners = [scope.widgetCtrl.insightID];
                        }

                        scope.widgetCtrl.meta(
                            [
                                {
                                    type: 'Pixel',
                                    components: [completeQuery],
                                    terminal: true,
                                    meta: true,
                                },
                            ],
                            setVars.bind(
                                null,
                                scope.textWidget.varList[i].name
                            ),
                            listeners
                        );
                    }
                }

                // if all of the notebooks are done running
                if (count === 0) {
                    compileHTML();
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

            // if all of the notebooks are done running
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
            if (compiledEle) {
                compiledEle.parentNode.removeChild(compiledEle);
                compiledEle = undefined;
            }

            scope.textWidget.html = _sanitizeCss(scope.textWidget.html);

            compiledEle = $compile(
                '<div id="TextWidget" style="overflow-y: auto; height:100%">' +
                    scope.textWidget.html +
                    '</div>'
            )(scope)[0];
            ele[0].appendChild(compiledEle);

            scope.textWidget.compiledTemplate = true;
            scope.textWidget.cloak = false;
        }

        /**
         * @name _sanitizeCss
         * @param {string} html - the html to check
         * @desc look through html and add textwidget id to css in order
         * to put css rules in proper scope.
         * 1. go thru html until we bump into style tag
         * 2. parse css rules and add necessary selector to each rule without it
         * 3. look for closing style tag to stop parsing css
         * NOTE: We assume css is not malformed
         * @return {string} html all cleaned up
         */
        function _sanitizeCss(html) {
            var sanitizedContent = '',
                i = 0,
                j,
                k,
                rules,
                checkTag = '',
                inStyle = false,
                timeToAddSelector,
                selector = '#TextWidget',
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
                            .map(nameSpaceCSSRule.bind(this, selector, atRule))
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

                    // TODO: fix this, media notebooks will put i at length of html
                    if (i < html.length) {
                        sanitizedContent += html[i];
                    }
                    i++;
                }
            }

            return sanitizedContent;
        }

        /**
         * @name nameSpaceCSSRule
         * @param {string} selector - selector to namespace with
         * @param {boolean} atRule - if true, do not add selector (ie @import, @font-face, etc...)
         * @param {string} rule - the rule being namespaced.
         * @return {string} the namespaced css rule
         */
        function nameSpaceCSSRule(selector, atRule, rule) {
            if (rule.indexOf(selector) === -1 && !atRule) {
                return selector + ' ' + rule.trim();
            }

            return rule.trim();
        }

        /**
         * @name editText
         * @returns {void}
         */
        function editWidget() {
            scope.textWidget.compiledTemplate = false;
            if (compiledEle) {
                compiledEle.parentNode.removeChild(compiledEle);
                compiledEle = undefined;
            }
        }

        /**
         * @name setData
         * @desc called to set the data from the store
         * @return {void}
         */
        function setData() {
            // check state if html exists then we set variables and compile html
            var currentOptions =
                    scope.widgetCtrl.getWidget('view.text-widget.options') ||
                    {},
                param,
                regex;

            if (currentOptions.html) {
                scope.textWidget.html = currentOptions.html;
            }

            if (currentOptions.varList) {
                scope.textWidget.varList = currentOptions.varList;
            }

            if (typeof currentOptions.freeze !== 'undefined') {
                scope.textWidget.freeze = currentOptions.freeze;
                setListeners(); // TODO: Hack.... we should NOT call this multiple times
            }

            if (typeof currentOptions.loading !== 'undefined') {
                scope.textWidget.loading = currentOptions.loading;
            }

            if (currentOptions.params) {
                for (param in currentOptions.params) {
                    if (currentOptions.params.hasOwnProperty(param)) {
                        scope.textWidget.customParams[param] =
                            currentOptions.params[param];
                        regex = new RegExp('<' + param + '>', 'g');
                        scope.textWidget.html = scope.textWidget.html.replace(
                            regex,
                            currentOptions.params[param]
                        );
                    }
                }
            }

            if (scope.textWidget.html) {
                getVars();
            } else {
                scope.textWidget.cloak = false;
            }
        }

        /**
         * @name runPixel
         * @param {*} pixel the pixel to run
         * @param {*} paramNames the list of params you want to replace
         * @param {*} paramValues the values you want to replace the params with
         * @desc expose the running of a pixel through the HTML they're building
         * @returns {void}
         */
        function runPixel(pixel, paramNames, paramValues) {
            var newPixel = pixel;

            if (
                paramNames &&
                paramValues &&
                paramNames.length === paramValues.length
            ) {
                paramNames.forEach(function (paramName, idx) {
                    var regEx, newName;
                    newName = '<' + paramName + '>';
                    regEx = new RegExp(newName, 'g');
                    newPixel = newPixel.replace(
                        regEx,
                        JSON.stringify(paramValues[idx])
                    );
                });
            }

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [newPixel],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name toggleListeners
         * @return {void}
         */
        function toggleListeners() {
            console.warn('freezing status is....' + scope.textWidget.freeze);

            // TODO: Optimize....
            // scope.textWidget.freeze = !scope.textWidget.freeze;
            setListeners();
        }

        /**
         * @name setListeners
         * @desc set the listeners based on the freeze
         * @return {void}
         */
        function setListeners() {
            if (updateViewListener) {
                updateViewListener();
            }
            if (updateFrameFilterListener) {
                updateFrameFilterListener();
            }
            if (updateFrame) {
                updateFrame();
            }
            if (refreshTask) {
                refreshTask();
            }

            if (!scope.textWidget.freeze) {
                updateViewListener = scope.widgetCtrl.on(
                    'update-view',
                    function () {
                        setData();
                    }
                );

                updateFrameFilterListener = scope.widgetCtrl.on(
                    'update-frame-filter',
                    function () {
                        setData();
                    }
                );

                updateFrame = scope.widgetCtrl.on('update-frame', function () {
                    setData();
                });

                refreshTask = scope.widgetCtrl.on('refresh-task', function () {
                    setData();
                });
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @return {void}
         */
        function initialize() {
            setData();
            setListeners();
        }

        initialize();

        scope.$on('$destroy', function () {
            // not frozen so these have not been destroyed yet. destroy them.
            if (!scope.textWidget.freeze) {
                updateViewListener();
                updateFrameFilterListener();
                updateFrame();
                refreshTask();
            }
        });
    }
}
