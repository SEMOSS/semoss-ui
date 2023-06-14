'use strict';

import './widget-compiler.scss';

import './templates/dropdown/dropdown.directive.js';
import './templates/freetext/freetext.directive.js';
import './templates/execute/execute.directive.js';
import './templates/check-box/check-box.directive.js';
import './templates/checklist/checklist.directive.js';
import './templates/number/number.directive.js';
import './templates/radio/radio.directive.js';
import './templates/slider/slider.directive.js';
import './templates/typeahead/typeahead.directive.js';
import './templates/text-area/text-area.directive.js';
import './templates/date-picker/date-picker.directive.js';
import './templates/color-picker/color-picker.directive.js';
import './templates/multiselect/multiselect.directive.js';
/**
 * @name widget-compiler.directive.js
 * @desc given a json from the back end, creates a widget handle
 */
export default angular
    .module('app.widget-compiler.directive', [
        'app.widget-compiler.dropdown',
        'app.widget-compiler.freetext',
        'app.widget-compiler.text-area',
        'app.widget-compiler.execute',
        'app.widget-compiler.check-box',
        'app.widget-compiler.checklist',
        'app.widget-compiler.number',
        'app.widget-compiler.radio',
        'app.widget-compiler.slider',
        'app.widget-compiler.typeahead',
        'app.widget-compiler.date-picker',
        'app.widget-compiler.color-picker',
        'app.widget-compiler.multiselect',
    ])
    .directive('widgetCompiler', widgetCompilerDirective);

widgetCompilerDirective.$inject = ['semossCoreService', 'ENDPOINT'];

function widgetCompilerDirective(semossCoreService, ENDPOINT) {
    widgetCompilerCtrl.$inject = [];
    widgetCompilerLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./widget-compiler.directive.html'),
        controller: widgetCompilerCtrl,
        link: widgetCompilerLink,
        scope: {},
        bindToController: {
            json: '=',
            widgetId: '=?',
            handle: '=?',
            register: '&?',
        },
        controllerAs: 'widgetCompiler',
    };

    function widgetCompilerCtrl() {}

    function widgetCompilerLink(scope) {
        var destroyListeners = [],
            dependMapping = {},
            dataLinks = {};

        scope.widgetCompiler.validateQuery = validateQuery;
        scope.widgetCompiler.buildQuery = buildQuery;
        scope.widgetCompiler.generateValues = generateValues;
        scope.widgetCompiler.executeQuery = executeQuery;
        scope.widgetCompiler.updateOptions = updateOptions;
        scope.widgetCompiler.searchInstances = searchInstances;
        scope.widgetCompiler.getMoreInstances = getMoreInstances;
        scope.widgetCompiler.setFocus = setFocus;
        scope.widgetCompiler.getHandleHTML = getHandleHTML;

        scope.widgetCompiler.showView = true;
        scope.widgetCompiler.showLoadingScreen = false;
        scope.widgetCompiler.messages = [];

        /**
         * @name resetVariables
         * @desc reset all of the variables
         * @returns {void}
         */
        function resetVariables() {
            var defaultParams,
                queryIdx,
                queryLen,
                paramIdx,
                paramLen,
                dependsOnIdx,
                dependsOnLen;

            dependMapping = {}; // instantiate mapping for first json

            // check for inputs, if none then we automatically run the pixel command
            for (
                queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                // add the listeners
                if (
                    Array.isArray(
                        scope.widgetCompiler.json[queryIdx].listeners
                    ) &&
                    scope.widgetCompiler.json[queryIdx].listeners.length > 0
                ) {
                    addListeners(scope.widgetCompiler.json[queryIdx].listeners);
                }

                if (
                    !scope.widgetCompiler.json[queryIdx].hasOwnProperty(
                        'params'
                    )
                ) {
                    continue;
                }

                for (
                    paramIdx = 0,
                        paramLen =
                            scope.widgetCompiler.json[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    // everything should have a model
                    if (
                        !scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].hasOwnProperty('model')
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model = {};
                    }

                    if (
                        !scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.hasOwnProperty('defaultOptions')
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.defaultOptions = [];
                    }

                    if (
                        !scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.hasOwnProperty('accessor')
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.accessor = '';
                    }

                    if (
                        !scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.hasOwnProperty('defaultValue') ||
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .resetValues
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.defaultValue = '';
                    }

                    // if a default value is set, we want to check to see if it's trying to grab an internal value, if so we will process it
                    if (
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .model.defaultValue
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.defaultValue = checkSEMOSSValues(
                            scope.widgetCompiler.json[queryIdx].params[paramIdx]
                                .model.defaultValue
                        );
                    }

                    // create the dependency mapping object and setup dependency mapping
                    if (
                        !dependMapping[
                            scope.widgetCompiler.json[queryIdx].params[paramIdx]
                                .paramName
                        ]
                    ) {
                        dependMapping[
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].paramName
                        ] = {};
                    }

                    if (
                        !scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.hasOwnProperty('dependsOn')
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.dependsOn = [];
                    }

                    for (
                        dependsOnIdx = 0,
                            dependsOnLen =
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.dependsOn.length;
                        dependsOnIdx < dependsOnLen;
                        dependsOnIdx++
                    ) {
                        if (
                            !dependMapping[
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.dependsOn[dependsOnIdx]
                            ]
                        ) {
                            // creating our dependency mapping
                            dependMapping[
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.dependsOn[dependsOnIdx]
                            ] = {};
                        }

                        // lets map all of the children to the input {parent: child: {}}
                        dependMapping[
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.dependsOn[dependsOnIdx]
                        ][
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].paramName
                        ] = {};
                    }

                    // nothing to view so skip over the next options
                    if (
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].hasOwnProperty('view') &&
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .view
                    ) {
                        // required is not defined so we will default to true (only when it is a view)
                        if (
                            !scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].hasOwnProperty('required')
                        ) {
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].required = true;
                        }

                        // required is not defined so we will default to true
                        if (
                            !scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].view.hasOwnProperty('displayType')
                        ) {
                            // if html is defined and displayType is not -- then we take in just the html and show it
                            if (
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].view.html
                            ) {
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].component =
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].view.html;
                            }
                        } else {
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].component = `
                            <${scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].view.displayType
                                .replace(/([A-Z])/g, '-$1')
                                .toLowerCase()} handle="handle">
                            </${scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].view.displayType
                                .replace(/([A-Z])/g, '-$1')
                                .toLowerCase()}>`;

                            // default options based on the view
                            let defaultValue =
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue;
                            if (
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].view.displayType === 'checklist' &&
                                !Array.isArray(defaultValue)
                            ) {
                                // TO DO: This is a temporary fix for maintaining state when editing pipeline components.
                                // The defaultValue is being stored as ""test","test"" so we need to remove the quotes and split into a proper array
                                if (
                                    typeof defaultValue === 'string' &&
                                    defaultValue.length
                                ) {
                                    let valueArray = defaultValue
                                        .replace(/"/g, '')
                                        .split(',');
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.defaultValue = valueArray;
                                } else {
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.defaultValue = [];
                                }
                            }
                        }
                    }

                    // start actually settting up the data
                    // get options only when query is defined other wise we will use the default Options
                    // set basd on the default options
                    if (
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .model.defaultOptions.length > 0 &&
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .model.autoSelect
                    ) {
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.defaultValue =
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultOptions[0];
                    }

                    // set the 'real' stuff
                    cascadeOptionValues(
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .paramName
                    );

                    // linking two fields together so they share same values...TODO: lets think of a better way to do this
                    if (
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .link
                    ) {
                        dataLinks[
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].link
                        ] =
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].paramName;
                    }

                    // bind component
                    scope.widgetCompiler.json[queryIdx].params[
                        paramIdx
                    ].executeQuery = executeQuery.bind(null, queryIdx);
                    scope.widgetCompiler.json[queryIdx].params[
                        paramIdx
                    ].updateOptions = updateOptions.bind(null, queryIdx);
                    scope.widgetCompiler.json[queryIdx].params[
                        paramIdx
                    ].getMoreInstances = getMoreInstances.bind(
                        null,
                        queryIdx,
                        paramIdx
                    );
                    scope.widgetCompiler.json[queryIdx].params[
                        paramIdx
                    ].searchInstances = searchInstances.bind(
                        null,
                        queryIdx,
                        paramIdx
                    );
                }
            }

            // auto execute whate we can
            for (
                queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                if (scope.widgetCompiler.json[queryIdx].execute === 'auto') {
                    executeQuery(queryIdx);
                }
            }

            // we need to check the default values (if any) we want to set. loop through them and set them in the json's params
            if (
                scope.widgetCompiler.widgetId &&
                !semossCoreService.getOptions(
                    scope.widgetCompiler.widgetId,
                    'widgetOptions.param.usedDefault'
                )
            ) {
                defaultParams = getShared('insight.params');
                // only want to run these default parameters once. so let this value so next time we don't auto-run again
                // TODO: look to see if we need to remove bound functions before removing
                semossCoreService.setOptions(
                    scope.widgetCompiler.widgetId,
                    'widgetOptions.param.usedDefault',
                    true
                );
            }

            // check for default values, set them, then try to execute. will execute if all params have been filled in.
            if (
                defaultParams &&
                !semossCoreService.utility.isEmpty(defaultParams)
            ) {
                scope.widgetCompiler.showView = false;
                for (
                    queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                    queryIdx < queryLen;
                    queryIdx++
                ) {
                    for (
                        paramIdx = 0,
                            paramLen =
                                scope.widgetCompiler.json[queryIdx].params
                                    .length;
                        paramIdx < paramLen;
                        paramIdx++
                    ) {
                        if (
                            defaultParams[
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].paramName
                            ]
                        ) {
                            // if a defaut value exists for this param
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultValue =
                                defaultParams[
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].paramName
                                ];
                        }
                    }
                    // attempt to run. if all params are not filled, it will get caught in executeQuery, so shouldn't be a problem here.
                    executeQuery(queryIdx, true);
                }
            }

            // copy the json modified JSON over
            scope.widgetCompiler.originalJSON = JSON.parse(
                JSON.stringify(scope.widgetCompiler.json)
            );
        }

        /**
         * @name cascadeOptionValues
         * @param {String} paramName - name of the parameter that is changed
         * @param {boolean} isSearch - is this coming from search
         * @desc check to see if all variables are filled in before running the pixel to grab data
         * @returns {void}
         */
        function cascadeOptionValues(paramName, isSearch) {
            var queryIdx,
                queryLen,
                paramIdx,
                paramLen,
                dependsOnIdx,
                dependsOnLen,
                parentParamIdx,
                parentParamLen,
                optionsQuery,
                valueQuery;

            // we have to look through all of the jsons to see if it contains the changed parameter, if it does, we have to update it accordingly
            outerLoop: for (
                queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                optionsQuery = '';
                valueQuery = '';
                for (
                    paramIdx = 0,
                        paramLen =
                            scope.widgetCompiler.json[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    // reset these values because the parent has been changed
                    if (
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .paramName === paramName
                    ) {
                        // reset to the original param's config
                        if (scope.widgetCompiler.originalJSON && !isSearch) {
                            Object.assign(
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ],
                                semossCoreService.utility.freeze(
                                    scope.widgetCompiler.originalJSON[queryIdx]
                                        .params[paramIdx]
                                )
                            );
                        }
                        // only clear if there's a query associated with the options so we can bring it back, otherwise persist it
                        if (
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.hasOwnProperty('query') &&
                            !semossCoreService.utility.isEmpty(
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.query
                            )
                        ) {
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultOptions = [];

                            optionsQuery =
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.query;
                        }

                        if (
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.hasOwnProperty('valueQuery') &&
                            !semossCoreService.utility.isEmpty(
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.valueQuery
                            )
                        ) {
                            valueQuery =
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.valueQuery;
                            // resetting the current default value, because we don't know if it's valid.
                            // TODO ideally we would try to persist any valid default values, but would need to make sure the immediate parent has run and updated before running the children pixels
                            // otherwise we'd run the children pixels with the old values
                            if (
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].view.displayType === 'checklist'
                            ) {
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue = [];
                            } else {
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue = '';
                            }
                        }

                        // TODO: why are we touching the defaultValue
                        // if (!isSearch) { // if we're just searching we shouldn't be clearing the selected values (also we have to have a query to clear)
                        //     if (scope.widgetCompiler.json[queryIdx].params[paramIdx].hasOwnProperty('view')) {
                        //         if (scope.widgetCompiler.json[queryIdx].params[paramIdx].view.displayType === 'checklist') {
                        //             scope.widgetCompiler.json[queryIdx].params[paramIdx].model.defaultValue = [];
                        //         } else {
                        //             scope.widgetCompiler.json[queryIdx].params[paramIdx].model.defaultValue = '';
                        //         }
                        //     }
                        // }

                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].selectAll = false;

                        // lets loop through the 'parents'
                        for (
                            dependsOnIdx = 0,
                                dependsOnLen =
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.dependsOn.length;
                            dependsOnIdx < dependsOnLen;
                            dependsOnIdx++
                        ) {
                            for (
                                parentParamIdx = 0,
                                    parentParamLen =
                                        scope.widgetCompiler.json[queryIdx]
                                            .params.length;
                                parentParamIdx < parentParamLen;
                                parentParamIdx++
                            ) {
                                if (
                                    scope.widgetCompiler.json[queryIdx].params[
                                        parentParamIdx
                                    ].paramName ===
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.dependsOn[dependsOnIdx]
                                ) {
                                    // found a parent -- check if it has a value; if no value, then we don't execute the query to populate
                                    if (
                                        isParameterEmpty(
                                            scope.widgetCompiler.json[queryIdx]
                                                .params[parentParamIdx]
                                        )
                                    ) {
                                        continue outerLoop; // skip the populateOptions function call below.. theory for this is that all of the params with the same name are linked, so no need to check anything else out =)
                                    }
                                }
                            }
                        }
                    }
                }

                // replace variables in the pixelCommand with corresponding values and then run to get options
                if (optionsQuery) {
                    populateOptions(
                        fillQuery(optionsQuery, scope.widgetCompiler.json),
                        paramName
                    );
                }

                if (valueQuery) {
                    populateValues(
                        fillQuery(valueQuery, scope.widgetCompiler.json),
                        paramName
                    );
                }
            }
        }

        /**
         * @name populateOptions
         * @param {String} query the query to run to get options
         * @param {String} paramName the name of the param to replace
         * @desc run a pixel query to get options to populate values
         * @returns {void}
         */
        function populateOptions(query, paramName) {
            var message = semossCoreService.utility.random('meta-pixel');

            scope.widgetCompiler.busyLoading = true;
            semossCoreService.once(message, function (response) {
                // populate in the options field
                var queryIdx,
                    queryLen,
                    paramIdx,
                    paramLen,
                    output =
                        response.pixelReturn[response.pixelReturn.length - 1]
                            .output,
                    type =
                        response.pixelReturn[response.pixelReturn.length - 1]
                            .operationType,
                    modified;

                if (type.indexOf('ERROR') > -1) {
                    console.error(output);
                    return;
                }

                scope.widgetCompiler.busyLoading = false;

                // MAJOR ASSUMPTION: only expecting one pixel that returns data. if you have multiple we'd always use the first one with data before breaking out of the loop
                for (
                    queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                    queryIdx < queryLen;
                    queryIdx++
                ) {
                    for (
                        paramIdx = 0,
                            paramLen =
                                scope.widgetCompiler.json[queryIdx].params
                                    .length;
                        paramIdx < paramLen;
                        paramIdx++
                    ) {
                        if (
                            scope.widgetCompiler.json[queryIdx].params[paramIdx]
                                .paramName === paramName
                        ) {
                            // only check the specified param
                            // clear out the default options
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultOptions = [];

                            // add the data it
                            modified = formatPixelData(output, type);
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultOptions = modified.data;
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.canCollect = modified.canCollect;

                            // if autoSelect, and no value, we need to set value and cascadeOptionValues again
                            if (
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.autoSelect &&
                                ((typeof scope.widgetCompiler.json[queryIdx]
                                    .params[paramIdx].model.defaultValue ===
                                    'number' &&
                                    !isNaN(
                                        scope.widgetCompiler.json[queryIdx]
                                            .params[paramIdx].model.defaultValue
                                    )) ||
                                    (typeof scope.widgetCompiler.json[queryIdx]
                                        .params[paramIdx].model.defaultValue ===
                                        'string' &&
                                        !scope.widgetCompiler.json[queryIdx]
                                            .params[paramIdx].model
                                            .defaultValue) ||
                                    typeof scope.widgetCompiler.json[queryIdx]
                                        .params[paramIdx].model.defaultValue ===
                                        'undefined')
                            ) {
                                if (
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.defaultOptions.length > 0
                                ) {
                                    if (
                                        scope.widgetCompiler.json[
                                            queryIdx
                                        ].params[paramIdx].view.hasOwnProperty(
                                            'attributes'
                                        ) &&
                                        scope.widgetCompiler.json[queryIdx]
                                            .params[paramIdx].view.attributes
                                            .display
                                    ) {
                                        // TODO: need to split by display and loop through to traverse
                                        scope.widgetCompiler.json[
                                            queryIdx
                                        ].params[paramIdx].model.defaultValue =
                                            semossCoreService.utility.getter(
                                                scope.widgetCompiler.json[
                                                    queryIdx
                                                ].params[paramIdx].model
                                                    .defaultOptions[0],
                                                scope.widgetCompiler.json[
                                                    queryIdx
                                                ].params[paramIdx].view
                                                    .attributes.display
                                            );
                                    } else {
                                        scope.widgetCompiler.json[
                                            queryIdx
                                        ].params[paramIdx].model.defaultValue =
                                            scope.widgetCompiler.json[
                                                queryIdx
                                            ].params[
                                                paramIdx
                                            ].model.defaultOptions[0];
                                    }
                                } else {
                                    // set it to null and if it has quotes around the query, we need to remove...
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.defaultValue = 'null';
                                }

                                updateOptions(
                                    queryIdx,
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].paramName,
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.defaultValue
                                );
                            }
                        }
                    }
                }
            });

            semossCoreService.emit('meta-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [query],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                insightID:
                    getShared('insightID') ||
                    semossCoreService.get('queryInsightID'),
                response: message,
            });
        }

        /**
         * @name updateOptions
         * @param {number} queryIndex - the index of the query in the json
         * @param {string} paramName - the name of the param that was updated
         * @param {*} selection the selected item/s
         * @param {boolean} isSearch is this coming from a search
         * @desc check for dependencies and then update any options/values that have dependencies on the changed input
         * @returns {void}
         */
        function updateOptions(queryIndex, paramName, selection, isSearch) {
            var queryIdx, queryLen, paramIdx, paramLen, dependName;

            // all components with this param name will have their value set to selection
            for (
                queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                for (
                    paramIdx = 0,
                        paramLen =
                            scope.widgetCompiler.json[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    if (
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .paramName === paramName
                    ) {
                        // update the selection
                        scope.widgetCompiler.json[queryIdx].params[
                            paramIdx
                        ].model.defaultValue = selection;
                    }
                }
            }

            // if there are any children for this input--they will get impacted upon parent's value change
            if (Object.keys(dependMapping[paramName]).length > 0) {
                for (dependName in dependMapping[paramName]) {
                    if (!dependMapping[paramName].hasOwnProperty(dependName)) {
                        continue;
                    }
                    // reset the param's config to the original first by looking at the originalJSON

                    // send it down to all the children
                    cascadeOptionValues(dependName, isSearch);
                }
            }

            if (dataLinks[paramName]) {
                updateLinks(paramName, selection);
            }
        }

        /* TODO: WE CAN REMOVE LOGIC FOR LINK NOW. THE NEW CHECKLIST WILL HAVE VALUES EVEN IF ITS SELECT ALL*/
        /**
         * @name updateLinks
         * @param {String} paramName - The name of the param within the dataLinks object that will be updated
         * @param {String} selection - The selection choice to be updated
         * @desc Goes through the links in default widget and updates any changes made
         * @returns {void}
         */
        function updateLinks(paramName, selection) {
            var queryIdx, queryLen, paramIdx, paramLen, addOption, i;
            for (
                queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                for (
                    paramIdx = 0,
                        paramLen =
                            scope.widgetCompiler.json[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    if (
                        scope.widgetCompiler.json[queryIdx].params[paramIdx]
                            .paramName === dataLinks[paramName]
                    ) {
                        addOption = true;
                        // Update the values of the connected param
                        if (
                            !Array.isArray(
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue
                            )
                        ) {
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultValue = [];
                        }

                        // Loop through values, if value exists, remove it. If it doesn't exist, add it
                        for (
                            i = 0;
                            i <
                            scope.widgetCompiler.json[queryIdx].params[paramIdx]
                                .model.defaultValue.length;
                            i++
                        ) {
                            if (
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue[i] === selection
                            ) {
                                // Remove it
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue.splice(i, 1);
                                addOption = false;
                            }
                        }

                        if (addOption) {
                            scope.widgetCompiler.json[queryIdx].params[
                                paramIdx
                            ].model.defaultValue.push(selection);
                        }
                    }
                }
            }
        }

        /**
         * @name populateValues
         * @param {*} query the query to execute
         * @param {*} paramName the name of the param
         * @desc populate the defaultValue of all of the params with the paramName
         * @returns {void}
         */
        function populateValues(query, paramName) {
            var message = semossCoreService.utility.random('meta-pixel');

            scope.widgetCompiler.busyLoading = true;

            semossCoreService.once(message, function (response) {
                // populate in the options field
                var queryIdx,
                    queryLen,
                    paramIdx,
                    paramLen,
                    output =
                        response.pixelReturn[response.pixelReturn.length - 1]
                            .output,
                    type =
                        response.pixelReturn[response.pixelReturn.length - 1]
                            .operationType,
                    modified;

                scope.widgetCompiler.busyLoading = false;
                // MAJOR ASSUMPTION: only expecting one pixel that returns data. if you have multiple we'd always use the first one with data before breaking out of the loop
                // loop through all params and populate the defaultValue
                for (
                    queryIdx = 0, queryLen = scope.widgetCompiler.json.length;
                    queryIdx < queryLen;
                    queryIdx++
                ) {
                    for (
                        paramIdx = 0,
                            paramLen =
                                scope.widgetCompiler.json[queryIdx].params
                                    .length;
                        paramIdx < paramLen;
                        paramIdx++
                    ) {
                        if (
                            scope.widgetCompiler.json[queryIdx].params[paramIdx]
                                .paramName === paramName
                        ) {
                            // only check the specified param
                            // add the data it
                            modified = formatPixelData(output, type);
                            if (
                                Array.isArray(
                                    scope.widgetCompiler.json[queryIdx].params[
                                        paramIdx
                                    ].model.defaultValue
                                )
                            ) {
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue = modified.data;
                            } else {
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue = modified.data[0];
                            }

                            // value is set so we'd need to update any children that depends on it
                            updateOptions(
                                queryIdx,
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].paramName,
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue
                            );
                        }
                    }
                }
            });

            semossCoreService.emit('meta-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [query],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                insightID:
                    getShared('insightID') ||
                    semossCoreService.get('queryInsightID'),
                response: message,
            });
        }

        /**
         * @name searchInstances
         * @param {number} queryIdx the query block to work with
         * @param {number} paramIdx the param to work with
         * @param {string} search - search term
         * @desc run query to search for instances based on search term
         * @returns {void}
         */
        function searchInstances(queryIdx, paramIdx, search) {
            if (
                scope.widgetCompiler.json[queryIdx].params[paramIdx].model
                    .searchParam
            ) {
                updateOptions(
                    queryIdx,
                    scope.widgetCompiler.json[queryIdx].params[paramIdx].model
                        .searchParam,
                    search,
                    true
                );
            }
        }

        /**
         * @name getMoreInstances
         * @param {number} queryIdx the query block to work with
         * @param {number} paramIdx the param to work with
         * @desc get more values
         * @returns {void}
         */
        function getMoreInstances(queryIdx, paramIdx) {
            var message = semossCoreService.utility.random('meta-pixel');

            if (
                scope.widgetCompiler.json[queryIdx].params[paramIdx].model
                    .canCollect &&
                !scope.widgetCompiler.busyLoading
            ) {
                scope.widgetCompiler.busyLoading = true;
                // register message to come back to
                semossCoreService.once(message, function (response) {
                    var output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType,
                        modified;

                    scope.widgetCompiler.busyLoading = false;

                    modified = formatPixelData(output, type);
                    scope.widgetCompiler.json[queryIdx].params[
                        paramIdx
                    ].model.defaultOptions = scope.widgetCompiler.json[
                        queryIdx
                    ].params[paramIdx].model.defaultOptions.concat(
                        modified.data
                    );
                    scope.widgetCompiler.json[queryIdx].params[
                        paramIdx
                    ].model.canCollect = modified.canCollect;
                });

                semossCoreService.emit('meta-pixel', {
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [
                                scope.widgetCompiler.json[queryIdx].params[
                                    paramIdx
                                ].model.infiniteQuery,
                            ],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    insightID:
                        getShared('insightID') ||
                        semossCoreService.get('queryInsightID'),
                    response: message,
                });
            }

            return null;
        }

        /**
         * @name setFocus
         * @desc focus on a particular parameter
         * @param {object} json - json to focus on
         * @param {number} paramIndex - particular index to focus on
         * @returns {void}
         */
        function setFocus(json, paramIndex) {
            var paramIdx, paramLen;
            for (
                paramIdx = 0, paramLen = json.params.length;
                paramIdx < paramLen;
                paramIdx++
            ) {
                json.params[paramIdx].model.focus = paramIndex === paramIdx;
            }

            json.params.forEach(function (param, idx) {
                param.model.focus = paramIndex === idx;
            });
        }

        /**
         * @name validateQuery
         * @param {number} queryIdx - the index of this query in the json
         * @param {array} json - json to pull data from
         * @desc validate if the query is valid or not
         * @returns {boolean} valid - is the query valid or not?
         */
        function validateQuery(queryIdx, json) {
            var paramIdx, paramLen;

            if (!json[queryIdx].query) {
                return false;
            }

            for (
                paramIdx = 0, paramLen = json[queryIdx].params.length;
                paramIdx < paramLen;
                paramIdx++
            ) {
                if (isParameterEmpty(json[queryIdx].params[paramIdx])) {
                    return false;
                }
            }

            return true;
        }

        /**
         * @name buildQuery
         * @param {number} queryIdx - the index of this query in the json
         * @param {object} tempJSON - json to edit
         * @desc build the pixel string for the widget
         * @returns {object} {query, refresh, refreshInsight, auto}
         */
        function buildQuery(queryIdx, tempJSON) {
            var query,
                refreshInsight = false,
                refresh = false,
                auto = false;

            query = fillQuery(tempJSON[queryIdx].query, tempJSON);

            // TODO: need to work with Maher to correctly do this...we want to replace all "null" values (string) to null (actual null) to correctly query to the BE
            // if (query.indexOf('"null"') > -1 || query.indexOf('\'null\'') > -1) {
            //     query = query.replace(/\"null\"/g, 'null');
            //     query = query.replace(/'null'/g, 'null');
            // }

            // separate checks for <SMSS_REFRESH_INSIGHT> and <SMSS_REFRESH> to be added as components
            if (query.indexOf('<SMSS_REFRESH_INSIGHT>') > -1) {
                // remove this internal param
                query = query.replace('<SMSS_REFRESH_INSIGHT>', '');

                refreshInsight = true;
            } else if (query.indexOf('<SMSS_REFRESH>') > -1) {
                // remove this internal param
                query = query.replace('<SMSS_REFRESH>', '');

                refresh = true;
            } else if (query.indexOf('<SMSS_AUTO>') > -1) {
                // remove this internal param
                query = query.replace('<SMSS_AUTO>', '');

                auto = true;
            }

            return {
                query: query,
                refresh: refresh,
                refreshInsight: refreshInsight,
                auto: auto,
            };
        }

        /**
         * @name executeQuery
         * @param {number} queryIdx - the index of this query in the json
         * @param {boolean} isDefaultParam - is executing for default param
         * @desc execute the Query
         * @returns {void}
         */
        function executeQuery(queryIdx, isDefaultParam) {
            var tempJSON = JSON.parse(
                    JSON.stringify(scope.widgetCompiler.json)
                ),
                components = [],
                builtQuery,
                message;

            if (!validateQuery(queryIdx, tempJSON)) {
                // if inputs still needed...don't run
                scope.widgetCompiler.showView = true; // for when there are params passed in but has other required params needed to be inputted

                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: 'Please fill in all required fields before continuing.',
                    insightID: scope.widgetCompiler.widgetId
                        ? getWidget('insightID')
                        : undefined,
                });

                return;
            }

            builtQuery = buildQuery(queryIdx, tempJSON);

            // check to see if this is a parameter UI, if so we need to feed it to a new reactor to rerun the recipe correctly
            if (scope.widgetCompiler.handle === 'param') {
                // parameterized insights need to be wiped with RunParameterRecipe;
                const paramQuery =
                    'META | RunParameterRecipe(recipe=["' +
                    '<encode>' +
                    builtQuery.query +
                    '</encode>"])';
                components = [
                    {
                        type: 'Pixel',
                        components: [paramQuery],
                        terminal: true,
                    },
                ];
            } else {
                components = [
                    {
                        type: 'Pixel',
                        components: [builtQuery.query],
                        terminal: true,
                    },
                ];
            }

            if (builtQuery.refreshInsight) {
                components.push({
                    type: 'refreshInsight',
                    components: [getWidget('insightID')],
                    terminal: true,
                });
            }

            if (builtQuery.refresh) {
                components.push({
                    type: 'refresh',
                    components: [scope.widgetCompiler.widgetId],
                    terminal: true,
                });
            }

            if (builtQuery.auto) {
                components.push({
                    type: 'auto',
                    components: [scope.widgetCompiler.widgetId],
                    terminal: true,
                });
            }

            // TODO: need to think about how to save the state of the json selections here. Issue comes when it gets popped out
            // TODO: look to see if we need to remove the bound functions before storing
            if (scope.widgetCompiler.widgetId) {
                semossCoreService.setOptions(
                    scope.widgetCompiler.widgetId,
                    'widgetOptions.' + scope.widgetCompiler.handle ||
                        'param' + '.json',
                    JSON.parse(JSON.stringify(scope.widgetCompiler.json))
                );
            }

            // showing the loading screen
            scope.widgetCompiler.showLoadingScreen = true;

            message = semossCoreService.utility.random('execute-query');
            scope.widgetCompiler.messages = ['Executing pixel...'];

            semossCoreService.on(message, function (response) {
                let errorCounter = 0,
                    successCounter = 0,
                    showError = false,
                    showSuccess = true,
                    hideFESuccess = false;
                // resetting the loading screen
                scope.widgetCompiler.showLoadingScreen = false;
                scope.widgetCompiler.messages = [];

                // do only for forms or for all other types of pixels?
                for (
                    let returnIdx = 0, returnLen = response.pixelReturn.length;
                    returnIdx < returnLen;
                    returnIdx++
                ) {
                    let pixelReturn = response.pixelReturn[returnIdx],
                        type = pixelReturn.operationType,
                        output = pixelReturn.output;
                    if (pixelReturn.hasOwnProperty('additionalOutput')) {
                        for (
                            let addIdx = 0;
                            addIdx < pixelReturn.additionalOutput.length;
                            addIdx++
                        ) {
                            if (
                                pixelReturn.additionalOutput[
                                    addIdx
                                ].hasOwnProperty('operationType') &&
                                pixelReturn.additionalOutput[
                                    addIdx
                                ].operationType.indexOf('SUCCESS') > -1
                            ) {
                                hideFESuccess = true;
                            }
                        }
                    }
                    if (type.indexOf('ALTER_DATABASE') > -1) {
                        if (response.pixelReturn[returnIdx].output) {
                            successCounter++;
                        } else {
                            errorCounter++;
                        }

                        showSuccess = false;
                    } else if (type.indexOf('ERROR') > -1) {
                        // only show if there is no output message, it should be caught otherwise.
                        if (!output) {
                            showError = true;
                        }

                        showSuccess = false;
                    }
                }

                if (successCounter > 0) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            successCounter > 1
                                ? successCounter +
                                  ' Successful updates to the database.'
                                : 'Successfully updated database.',
                        insightID: scope.widgetCompiler.widgetId
                            ? getWidget('insightID')
                            : undefined,
                    });
                }

                if (errorCounter > 0) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text:
                            errorCounter > 1
                                ? errorCounter +
                                  ' errors occurred while submitting form data.'
                                : 'An error occurred while submitting form data.',
                        insightID: scope.widgetCompiler.widgetId
                            ? getWidget('insightID')
                            : undefined,
                    });
                }

                if (showError) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'An error occured when executing the widget.',
                        insightID: scope.widgetCompiler.widgetId
                            ? getWidget('insightID')
                            : undefined,
                    });
                }

                if (showSuccess) {
                    let name;
                    if (scope.widgetCompiler.json[0].label) {
                        name = scope.widgetCompiler.json[0].label;
                    } else if (scope.widgetCompiler.handle) {
                        name = scope.widgetCompiler.handle
                            // kebab -> pronoun
                            .split('-')
                            .map(
                                (word) =>
                                    word[0].toUpperCase() + word.substring(1)
                            )
                            .join(' ');
                    } else {
                        name = 'Widget';
                    }

                    if (!hideFESuccess) {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: name + ' executed successfully.',
                            insightID: scope.widgetCompiler.widgetId
                                ? getWidget('insightID')
                                : undefined,
                        });
                    }
                    // if default param runs (only goes in here once) then we want to message out to say the insight has been initialized
                    if (isDefaultParam) {
                        const postMessage = {
                            message: 'semoss-insight-initialized',
                            data: '',
                        };
                        // let parent window know insight has been loaded
                        window.top.postMessage(
                            JSON.stringify(postMessage),
                            ENDPOINT.URL
                        );
                    }
                }
            });

            semossCoreService.emit('execute-pixel', {
                insightID: getWidget('insightID'),
                commandList: components,
                responseObject: {
                    response: message,
                    widgetId: scope.widgetCompiler.widgetId,
                },
            });
        }

        /** Helpers */

        /**
         * @name getWidget
         * @param {string} accessor the traversal of the data to pull
         * @desc gets the widget information
         * @returns {object} the widget data
         */
        function getWidget(accessor) {
            // we are in core
            return semossCoreService.getWidget(
                scope.widgetCompiler.widgetId,
                accessor
            );
        }

        /**
         * @name getShared
         * @param {string} accessor the traversal of the data to pull
         * @desc gets the shared information
         * @returns {object} the shared data
         */
        function getShared(accessor) {
            return semossCoreService.getShared(
                semossCoreService.getWidget(
                    scope.widgetCompiler.widgetId,
                    'insightID'
                ),
                accessor
            );
        }

        /**
         * @name getSEMOSSValues
         * @param {*} dataToGrab the value to grab
         * @desc grabs values stored internally on the FE
         * @returns {*} returns the value
         */
        function getSEMOSSValues(dataToGrab) {
            var value, logins;

            switch (dataToGrab) {
                case '<SMSS_PANEL_ID>':
                    value = getWidget('panelId');
                    break;
                case '<SMSS_SHEET_ID>':
                    value = semossCoreService.workbook.getWorkbook(
                        getShared('insightID'),
                        'worksheet'
                    );
                    break;
                case '<SMSS_LAYOUT>':
                    value = getWidget('view.visualization.layout');
                    break;
                case '<SMSS_META>':
                    value = getWidget('meta');
                    break;
                case '<SMSS_SHARED_STATE>':
                    value = getWidget('view.visualization.tools.shared');
                    break;
                case '<SMSS_ACTIVE_STATE>':
                    value = getWidget(
                        'view.visualization.tools.individual.' +
                            getWidget('view.visualization.layout')
                    );
                    break;
                case '<SMSS_INSIGHT_ID>':
                    value = getShared('insightID');
                    break;
                case '<SMSS_FRAME>':
                    value = getShared('frames.' + getWidget('frame'));
                    break;
                case '<SMSS_FRAME_NAME>':
                    value = getShared('frames.' + getWidget('frame') + '.name');
                    break;
                case '<SMSS_FRAME_TYPE>':
                    value = getShared('frames.' + getWidget('frame') + '.type');
                    break;
                case '<SMSS_CLONE_ID>':
                    value = getShared('panelCounter') + 1;
                    break;
                case '<SMSS_INSIGHT>':
                    value = getShared('insight');
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
                    logins = semossCoreService.getCurrentLogins();
                    value = semossCoreService.utility.isEmpty(logins)
                        ? ''
                        : logins[Object.keys(logins)[0]];
                    break;
                default:
                    value = undefined;
            }

            return value;
        }

        /**
         * @name isParameterEmpty
         * @param {object} param - param to generate value for
         * @desc check if the parameter has all of its required inputs fill, if it does return true
         * @returns {boolean} returns whether there are required inputs that still need to be filled out
         */
        function isParameterEmpty(param) {
            if (
                ((typeof param.model.defaultValue === 'number' &&
                    isNaN(param.model.defaultValue)) ||
                    (typeof param.model.defaultValue === 'string' &&
                        !param.model.defaultValue) ||
                    (Array.isArray(param.model.defaultValue) &&
                        param.model.defaultValue.length === 0 &&
                        !param.selectAll) ||
                    typeof param.model.defaultValue === 'undefined') &&
                param.required
            ) {
                return true;
            }

            return false;
        }

        /**
         * @name formatPixelData
         * @desc format the return data based on the type
         * @param {*} output - original data
         * @param {array} type - pixel optype
         * @returns {object} modified data and canCollect
         */
        function formatPixelData(output, type) {
            var copy = JSON.parse(JSON.stringify(output)),
                data,
                canCollect = false,
                idx,
                len;

            // NOTE ::: only will work for return data that are strings or list of strings...list of objects we will not be able to process unless we introduce all of the complexities of defaultOptions
            if (type.indexOf('TASK_DATA') > -1) {
                // looking at operationType to figure out how to grab the return data
                data = [];
                if (copy.data && copy.data.values) {
                    for (
                        idx = 0, len = copy.data.values.length;
                        idx < len;
                        idx++
                    ) {
                        data.push(copy.data.values[idx][0]);
                    }

                    canCollect = copy.data.values.length > 0;
                }
            } else if (type.indexOf('FRAME_HEADERS') > -1) {
                // TODO:look at other operationTypes and see how they are structured and set in the param as appropriate
                data = [];
                for (
                    idx = 0, len = copy.headerInfo.headers.length;
                    idx < len;
                    idx++
                ) {
                    data.push(copy.headerInfo.headers[idx]);
                }

                canCollect = copy.headerInfo.headers.length > 0;
            } else if (Array.isArray(copy)) {
                data = copy;
            } else {
                data = [copy];
            }

            return {
                data: data,
                canCollect: canCollect,
            };
        }

        /**
         * @name fillQuery
         * @param {string} query - the query we want to fill with param instances
         * @param {array} json - json to pull data from
         * @desc replace the variables in the query with instance/selected values
         * @returns {string} the completed query to be returned
         */
        function fillQuery(query, json) {
            var tempQuery = query,
                tempJSON = JSON.parse(JSON.stringify(json)),
                normalRegex,
                objectRegex,
                queryIdx,
                queryLen,
                paramIdx,
                paramLen,
                value,
                matches,
                objectMatches,
                matchedValue,
                accessor;

            if (!tempQuery) {
                return '';
            }

            // This has the assumption that <> will never be used as a value, if that is the case then I'm ok with this. Otherwise we have to split into tokens and replace
            for (
                queryIdx = 0, queryLen = tempJSON.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                // loop through all the queries
                for (
                    paramIdx = 0, paramLen = tempJSON[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    // loop through all of the params/components
                    if (!tempJSON[queryIdx].params[paramIdx].model) {
                        continue;
                    }

                    value = generateValues(
                        tempQuery,
                        tempJSON[queryIdx].params[paramIdx]
                    );
                    if (typeof value !== 'undefined') {
                        // looks for normal params such as <MyParam>
                        normalRegex = new RegExp(
                            `<!*${tempJSON[queryIdx].params[paramIdx].paramName}>`,
                            'g'
                        );
                        // looks for special object params such as <MyParam.value> to handle defaultOptions where the list is an array of objects such as {display: 'myvalue', value: 'value1'}
                        objectRegex = new RegExp(
                            `<!*${tempJSON[queryIdx].params[paramIdx].paramName}[\\w_.]+>`,
                            'g'
                        );
                        matches = tempQuery.match(normalRegex) || [];
                        objectMatches = tempQuery.match(objectRegex);
                        if (objectMatches) {
                            // if we have matches in here, we need to validate the object match by looking to see if it has '.' in the name because that's the requirement for an object match
                            // otherwise the match comes from a paramName that is a subset of another parameter name. e.g. param vs param_1;
                            // we do not want to find and replace param_1 with param's value because they are different parameters that are named similarly
                            for (
                                let matchIdx = 0;
                                matchIdx < objectMatches.length;
                                matchIdx++
                            ) {
                                if (objectMatches[matchIdx].indexOf('.') > -1) {
                                    matches.push(objectMatches[matchIdx]);
                                }
                            }
                        }

                        for (
                            let matchIdx = 0;
                            matchIdx < matches.length;
                            matchIdx++
                        ) {
                            // remove the start < and end >
                            accessor = matches[matchIdx].substring(
                                1,
                                matches[matchIdx].length - 1
                            );

                            // split so we can remove the param, so we can get it using the accessor
                            accessor = accessor.split('.');
                            accessor.shift();

                            // get the accessor
                            accessor = accessor.join('.');

                            // special logic for values that come back as object and user wants to access a specific key in the object
                            matchedValue = semossCoreService.utility.getter(
                                value,
                                accessor
                            );

                            // this is toggling all the booleans...e.g. <!SMSS_SHARED_STATE.displayValue>
                            // first character is <
                            if (
                                matches[matchIdx].indexOf('!') === 1 &&
                                typeof matchedValue === 'boolean'
                            ) {
                                matchedValue = !matchedValue;
                            }

                            // we handle nulls here by trying to replace the surrounding single/double quotes as well.
                            if (matchedValue === null) {
                                if (
                                    tempQuery.search(
                                        '"' + matches[matchIdx] + '"'
                                    ) > -1
                                ) {
                                    tempQuery = tempQuery.replace(
                                        '"' + matches[matchIdx] + '"',
                                        matchedValue
                                    );
                                    continue; // we found the match so skip to the next one
                                }

                                if (
                                    tempQuery.search(
                                        "'" + matches[matchIdx] + "'"
                                    ) > -1
                                ) {
                                    tempQuery = tempQuery.replace(
                                        "'" + matches[matchIdx] + "'",
                                        matchedValue
                                    );
                                    continue; // we found the match so skip to the next one
                                }
                            }

                            tempQuery = tempQuery.replace(
                                matches[matchIdx],
                                matchedValue
                            );
                        }
                    }
                }
            }

            // we put the SMSS value here, if it is predefined, we will use that value
            // we can probably merge checkSEMOSSValues
            tempQuery = checkSEMOSSValues(tempQuery);

            return tempQuery;
        }

        /**
         * @name generateValues
         * @param {string} query - query to match against
         * @param {object} param - param to generate value for
         * @desc return the value to add to the string
         * @returns {*} value
         */
        function generateValues(query, param) {
            var type, value, runRRegex, textWidgetRegex, valueIdx, valueLen;

            type = typeof param.model.defaultValue;

            // the case where it is 'empty'
            if (type === 'undefined') {
                // if a field is not filled in then we set it to empty string -- can happen when a field is not required
                /* var tempRegexString = ",\\s*c\\s*:\\s*\\w+\\s*!*=\\s*(\\[\\s*\"*<" + scope.widgetCompiler.json[queryIdx].params[paramIndex].paramName + ">\"*\\s*\\])\\s*";
                    var tempRegex = new RegExp(tempRegexString, "g");*/
                if (param.model.replaceEmptyWith) {
                    // if defined we will replace empty values with this
                    value = param.model.replaceEmptyWith;
                } else {
                    value = '';
                }
            } else if (type === 'string') {
                // TODO: if its a string we should just stringify it so it replaces with quotes. if number, we directly replace. can't remember why exactly we put it on the user to add quotes in the query...
                value = param.model.defaultValue;
                if (param.model.replaceSpacesWithUnderscores) {
                    value = value.replace(/ /g, '_');
                }

                // no value
                if (!value && param.model.replaceEmptyWith) {
                    value = param.model.replaceEmptyWith; // if defined we will replace empty values with this
                }
            } else if (type === 'number') {
                value = param.model.defaultValue;
            } else if (type === 'boolean') {
                value = param.model.defaultValue;
            } else if (Array.isArray(param.model.defaultValue)) {
                if (
                    param.model.defaultValue.length ===
                        param.model.defaultOptions.length &&
                    !param.useSelectedValues &&
                    !param.link &&
                    (param.model.defaultValue.length === 0 || param.selectAll)
                ) {
                    // if select all is defined and true then we leave the filter as empty
                    value = '[]';
                } else {
                    // copy it
                    value = JSON.parse(
                        JSON.stringify(param.model.defaultValue)
                    );

                    runRRegex = new RegExp(
                        'runR\\s*\\((.*)(<' + param.paramName + '>)(.*)\\)'
                    );
                    textWidgetRegex = new RegExp(
                        'SetPanelView\\s*\\((.*)text-widget(.*)(<SelectedValues>)(.*)\\)'
                    );

                    if (
                        query.match(runRRegex) ||
                        query.match(textWidgetRegex)
                    ) {
                        for (
                            valueIdx = 0, valueLen = value.length;
                            valueIdx < valueLen;
                            valueIdx++
                        ) {
                            value[valueIdx] = JSON.stringify(
                                value[valueIdx]
                            ).replace(/\\([\s\S])|(")/g, '\\$1$2');
                        }
                    } else {
                        // we need the quotes to stay as ""test","test""
                        for (
                            valueIdx = 0, valueLen = value.length;
                            valueIdx < valueLen;
                            valueIdx++
                        ) {
                            value[valueIdx] = JSON.stringify(value[valueIdx]);
                            // TODO do we need to account for when string instances themselves have double quotes? this would replace them as well...
                            if (
                                param.model.quoteType &&
                                param.model.quoteType.toLowerCase() === 'single'
                            ) {
                                // replace double quotes with single quotes (hqs)
                                value[valueIdx] = value[valueIdx].replace(
                                    /"/g,
                                    "'"
                                );
                            } else if (
                                param.model.quoteType &&
                                param.model.quoteType.toLowerCase() === 'no'
                            ) {
                                // remove quotes
                                value[valueIdx] = value[valueIdx].replace(
                                    /"/g,
                                    ''
                                );
                            }
                        }

                        // return the string form
                        value = String(value);
                    }

                    // no value
                    if (value.length === 0 && param.model.replaceEmptyWith) {
                        value = param.model.replaceEmptyWith; // if defined we will replace empty values with this
                    }
                }
            } else if (type === 'object') {
                // console.log('TODO: How did we get here?');
                value = JSON.parse(JSON.stringify(param.model.defaultValue));
            }

            return value;
        }

        /**
         * @name checkSEMOSSValues
         * @param {String} query the query used to replace smss values
         * @desc this will check to see if the query has semoss values that need to be used
         * @returns {String} the filled in query
         */
        function checkSEMOSSValues(query) {
            var tempQuery = query,
                semossVarRegex = new RegExp('<!*SMSS_[\\w_.]+>', 'g'),
                matches =
                    typeof tempQuery === 'string'
                        ? tempQuery.match(semossVarRegex) || []
                        : [],
                matchIdx,
                matchLen,
                variable,
                accessor,
                matchedValue,
                value;

            for (
                matchIdx = 0, matchLen = matches.length;
                matchIdx < matchLen;
                matchIdx++
            ) {
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
                matchedValue = semossCoreService.utility.getter(
                    value,
                    accessor
                );

                // this is toggling all the booleans...e.g. <!SMSS_SHARED_STATE.displayValue>
                // first character is <
                if (matches[matchIdx].indexOf('!') === 1) {
                    // && typeof matchedValue === 'boolean') {
                    matchedValue = !matchedValue;
                }

                tempQuery = tempQuery.replace(matches[matchIdx], matchedValue);
            }

            return tempQuery;
        }

        /**
         * @name addListeners
         * @desc add listeners for certain triggers to refresh the view
         * @param {array} listeners - listeners to trigger
         * @returns {void}
         */
        function addListeners(listeners) {
            var destroyIdx, destroyLen;

            // remove the old ones
            for (
                destroyIdx = 0, destroyLen = destroyListeners.length;
                destroyIdx < destroyLen;
                destroyIdx++
            ) {
                destroyListeners[destroyIdx]();
            }

            // clear the array so we can save new ones
            destroyListeners = [];

            if (listeners.indexOf('updateTask') > -1) {
                destroyListeners.push(
                    semossCoreService.on('update-task', function () {
                        scope.widgetCompiler.json = JSON.parse(
                            JSON.stringify(scope.widgetCompiler.originalJSON)
                        );
                        resetVariables();
                    })
                );
            }

            if (listeners.indexOf('updateFrame') > -1) {
                destroyListeners.push(
                    semossCoreService.on('update-frame', function () {
                        scope.widgetCompiler.json = JSON.parse(
                            JSON.stringify(scope.widgetCompiler.originalJSON)
                        );
                        resetVariables();
                    })
                );
            }

            if (listeners.indexOf('addedData') > -1) {
                destroyListeners.push(
                    semossCoreService.on('added-data', function () {
                        scope.widgetCompiler.json = JSON.parse(
                            JSON.stringify(scope.widgetCompiler.originalJSON)
                        );
                        resetVariables();
                    })
                );
            }

            if (listeners.indexOf('alterDatabase') > -1) {
                destroyListeners.push(
                    semossCoreService.on('alter-database', function () {
                        scope.widgetCompiler.json = JSON.parse(
                            JSON.stringify(scope.widgetCompiler.originalJSON)
                        );
                        resetVariables();
                    })
                );
            }

            if (listeners.indexOf('selectedData') > -1) {
                destroyListeners.push(
                    semossCoreService.on('update-selected', function () {
                        var params = scope.widgetCompiler.json[0].params,
                            eventParams,
                            focusedParam,
                            model,
                            index,
                            selected = semossCoreService.getSelected(
                                scope.widgetCompiler.widgetId,
                                'selected'
                            );

                        if (selected && selected.length > 0) {
                            // update input only with the frame headers query
                            // useful if the user uses the grid actions for updating all select boxes
                            eventParams = params.filter(function (param) {
                                return (
                                    param.model.query &&
                                    param.model.query.indexOf('FrameHeaders') >
                                        -1
                                );
                            });

                            // only one param can have focus
                            focusedParam = eventParams.find(function (param) {
                                return param.model.focus;
                            });

                            // Choose whether to use the default eventParam or to use the focused param
                            model = eventParams[0].model;
                            if (focusedParam) {
                                model = focusedParam.model;
                            }

                            // Determine if default value is a dropdown or input
                            if (Array.isArray(model.defaultValue)) {
                                // if its a dropdown, determine whether to add it to the array or deselect it
                                index = model.defaultValue.indexOf(
                                    selected[0].alias
                                );
                                if (index === -1) {
                                    model.defaultValue.push(selected[0].alias);
                                } else {
                                    model.defaultValue.splice(index, 1);
                                }
                            } else {
                                model.defaultValue = selected[0].alias;
                            }
                        }
                    })
                );
            }

            if (listeners.indexOf('resetGrid') > -1) {
                destroyListeners.push(
                    semossCoreService.on('reset-grid', function () {
                        scope.widgetCompiler.json = JSON.parse(
                            JSON.stringify(scope.widgetCompiler.originalJSON)
                        );
                        resetVariables();
                    })
                );
            }
        }

        /**
         * @name getHandleHTML
         * @desc get the handle to render
         * @param {object}  handle - handle object
         * @returns {string} html to render
         */
        function getHandleHTML(handle) {
            let label, description;

            if (!handle) {
                return '';
            }

            if (handle.view) {
                if (handle.view.label) {
                    label = `
                <label>
                    ${handle.view.label}
                    <!-- <span ng-show="handle.required" class="smss-color--error">*</span> -->
                </label>`;
                }

                if (handle.view.description) {
                    description = `
                <description>
                    ${handle.view.description}
                </description>`;
                }
            }

            return `
            <smss-field>
                ${label ? label : ''};
                <content>
                    ${handle.component ? handle.component : ''}
                </content>
                ${description ? description : ''};
            </smss-field>`;
        }

        /**
         * @name initialize
         * @desc initialize the directive
         * @returns {void}
         */
        function initialize() {
            semossCoreService.on('widget-compiler-execute-all', function () {
                for (
                    let queryIdx = 0,
                        queryLen = scope.widgetCompiler.json.length;
                    queryIdx < queryLen;
                    queryIdx++
                ) {
                    executeQuery(queryIdx);
                }
            });

            scope.$on('$destroy', function () {
                for (
                    let destroyIdx = 0, destroyLen = destroyListeners.length;
                    destroyIdx < destroyLen;
                    destroyIdx++
                ) {
                    destroyListeners[destroyIdx]();
                }
            });

            resetVariables();

            // register the newly create scope
            if (scope.widgetCompiler.hasOwnProperty('register')) {
                scope.widgetCompiler.register({
                    scope: scope,
                });
            }
        }

        initialize();
    }
}
