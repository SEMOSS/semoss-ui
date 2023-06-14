import angular from 'angular';
import './parameters.scss';
import './param-tree/param-tree.directive.ts';

export default angular
    .module('app.parameters.directive', ['app.param-tree.directive'])
    .directive('parameters', parametersDirective);

parametersDirective.$inject = ['semossCoreService', '$timeout'];

function parametersDirective(semossCoreService, $timeout) {
    parametersCtrl.$inject = [];
    parametersLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^workspaceSave'],
        scope: {},
        controller: parametersCtrl,
        controllerAs: 'parameters',
        bindToController: {},
        template: require('./parameters.directive.html'),
        link: parametersLink,
        replace: true,
    };

    function parametersCtrl() {}

    function parametersLink(scope, ele, attrs, ctrl) {
        scope.workspaceSaveCtrl = ctrl[0];
        scope.insightCtrl = scope.workspaceSaveCtrl.insightCtrl;

        scope.parameters.paramNameMessage = '';
        scope.parameters.paramOptions = [];
        scope.parameters.currentParams = [];
        scope.parameters.selectedParam = {};
        scope.parameters.displayTypes = [
            {
                display: 'Checklist',
                value: 'checklist',
            },
            {
                display: 'Dropdown',
                value: 'dropdown',
            },
            {
                display: 'Number',
                value: 'number',
            },
            {
                display: 'Type Ahead',
                value: 'typeahead',
            },
            {
                display: 'Text Input',
                value: 'freetext',
            },
            // check-box, color-picker, date-picker, multiselect, radio, slider, text-area
        ];
        scope.parameters.modelDisplayTypes = [
            'checklist',
            'dropdown',
            'typeahead',
        ];
        scope.parameters.selectionTypeOptions = [];

        scope.parameters.selectParam = selectParam;
        scope.parameters.createParam = createParam;
        scope.parameters.updateParam = updateParam;
        scope.parameters.deleteParam = deleteParam;
        scope.parameters.unbindParam = unbindParam;
        scope.parameters.getParams = getParams;
        scope.parameters.hideModal = hideModal;

        scope.parameters.isValidated = isValidated;
        scope.parameters.showRemove = showRemove;
        scope.parameters.updateExistingParamInfo = updateExistingParamInfo;
        scope.parameters.updateDefaultValueType = updateDefaultValueType;

        function hideModal() {
            scope.workspaceSaveCtrl.show.parameters = false;
        }

        /**
         * @name updateDefaultValueType
         * @param {string} type the type of the display selected
         * @returns {void}
         */
        function updateDefaultValueType(type: string): void {
            if (
                type === 'checklist' &&
                typeof scope.parameters.selectedParam.defaultValue !== 'object'
            ) {
                scope.parameters.selectedParam.defaultValue = [];
            } else if (
                type === 'number' &&
                typeof scope.parameters.selectedParam.defaultValue !== 'number'
            ) {
                scope.parameters.selectedParam.defaultValue = 0;
            } else if (
                (type === 'typeahead' ||
                    type === 'dropdown' ||
                    type === 'freetext') &&
                typeof scope.parameters.selectedParam.defaultValue !== 'string'
            ) {
                if (
                    typeof scope.parameters.selectedParam.defaultValue ===
                        'object' &&
                    scope.parameters.selectedParam.defaultValue.length > 0
                ) {
                    scope.parameters.selectedParam.defaultValue =
                        scope.parameters.selectedParam.defaultValue[0];
                } else {
                    scope.parameters.selectedParam.defaultValue = '';
                }
            }
        }
        /**
         * @name updateExistingParamInfo
         * @desc upate the operator information to show
         * @returns {void}
         */
        function updateExistingParamInfo(): void {
            if (!scope.parameters.selectedParam.existingParam) {
                return;
            }

            const detailsList =
                scope.parameters.selectedParam.existingParam.detailsList;
            scope.parameters.selectedParam._existingInfo = {
                new: [],
                existing: [],
            };

            // loop through the paramoptions and grab the existing filters that's been already set up
            for (
                let optionIdx = 0;
                optionIdx < scope.parameters.paramOptions.length;
                optionIdx++
            ) {
                const tempOption = semossCoreService.utility.freeze(
                    scope.parameters.paramOptions[optionIdx]
                );
                for (
                    let detailIdx = 0;
                    detailIdx < detailsList.length;
                    detailIdx++
                ) {
                    if (tempOption.pixelId === detailsList[detailIdx].pixelId) {
                        const columnLevel =
                            tempOption.params[
                                detailsList[detailIdx].columnName
                            ];
                        const tableLevel = columnLevel
                            ? columnLevel[detailsList[detailIdx].tableName]
                            : undefined;
                        const operatorLevel = tableLevel
                            ? tableLevel[detailsList[detailIdx].operator]
                            : undefined;
                        // cannot use tempOption because we are adding a key-value into an array...so the utility.freeze removes the invalid properties in the array when copying
                        const uOperatorLevel = operatorLevel
                            ? scope.parameters.paramOptions[optionIdx].params[
                                  detailsList[detailIdx].columnName
                              ][detailsList[detailIdx].tableName][
                                  detailsList[detailIdx].operator
                              ][detailsList[detailIdx].uOperator]
                            : undefined;
                        if (detailsList[detailIdx].level === 'COLUMN') {
                            scope.parameters.selectedParam._existingInfo.existing =
                                scope.parameters.selectedParam._existingInfo.existing.concat(
                                    columnLevel._details._currentFilters
                                );
                        } else if (detailsList[detailIdx].level === 'TABLE') {
                            scope.parameters.selectedParam._existingInfo.existing =
                                scope.parameters.selectedParam._existingInfo.existing.concat(
                                    tableLevel._details._currentFilters
                                );
                        } else if (
                            detailsList[detailIdx].level === 'OPERATOR'
                        ) {
                            scope.parameters.selectedParam._existingInfo.existing =
                                scope.parameters.selectedParam._existingInfo.existing.concat(
                                    operatorLevel._details._currentFilters
                                );
                        } else if (
                            detailsList[detailIdx].level === 'OPERATORU'
                        ) {
                            scope.parameters.selectedParam._existingInfo.existing =
                                scope.parameters.selectedParam._existingInfo.existing.concat(
                                    uOperatorLevel._details._currentFilters
                                );
                        }
                    }
                }

                // create the new filter/s for this new parameter that's about to be added
                if (
                    tempOption.pixelId ===
                    scope.parameters.selectedParam.pixelId
                ) {
                    const columnLevel =
                        tempOption.params[
                            scope.parameters.selectedParam.columnName
                        ];
                    const tableLevel = columnLevel
                        ? columnLevel[scope.parameters.selectedParam.tableName]
                        : undefined;
                    const operatorLevel = tableLevel
                        ? tableLevel[scope.parameters.selectedParam.operator]
                        : undefined;
                    // cannot use tempOption because we are adding a key-value into an array...so the utility.freeze removes the invalid properties in the array when copying
                    const uOperatorLevel = operatorLevel
                        ? scope.parameters.paramOptions[optionIdx].params[
                              scope.parameters.selectedParam.columnName
                          ][scope.parameters.selectedParam.tableName][
                              scope.parameters.selectedParam.operator
                          ][scope.parameters.selectedParam.uOperator]
                        : undefined;
                    if (scope.parameters.selectedParam.level === 'COLUMN') {
                        scope.parameters.selectedParam._existingInfo.new =
                            columnLevel._details._currentFilters;
                    } else if (
                        scope.parameters.selectedParam.level === 'TABLE'
                    ) {
                        scope.parameters.selectedParam._existingInfo.new =
                            tableLevel._details._currentFilters;
                    } else if (
                        scope.parameters.selectedParam.level === 'OPERATOR'
                    ) {
                        scope.parameters.selectedParam._existingInfo.new =
                            operatorLevel._details._currentFilters;
                    } else if (
                        scope.parameters.selectedParam.level === 'OPERATORU'
                    ) {
                        scope.parameters.selectedParam._existingInfo.new =
                            uOperatorLevel._details._currentFilters;
                    }
                }
            }
        }

        /**
         * @name showRemove
         * @param param the param to check
         * @desc check to see if we need to show the remove icon
         * @returns {boolean}
         */
        function showRemove(param: any): boolean {
            return param._edit && typeof param._boundIndex !== 'undefined';
        }
        /**
         * @name isValidName
         * @param param the param to check name for
         * @desc checks to see if this is a valid name. not valid if it already exists
         * @returns {boolean} true/false
         */
        function isValidName(param: any): boolean {
            let valid = true;

            if (param._edit || param.paramType === 'Existing') {
                return true;
            }

            for (
                let paramIdx = 0;
                paramIdx < scope.parameters.currentParams.length;
                paramIdx++
            ) {
                const currentParam = scope.parameters.currentParams[paramIdx];

                if (currentParam.paramName === param.paramName) {
                    valid = false;
                    break;
                }
            }

            // not unique name so set the message
            if (!valid) {
                scope.parameters.paramNameMessage =
                    'The parameter name must be unique.';
            } else {
                scope.parameters.paramNameMessage = '';
                if (!param.paramName.match(/^[\w.]*$/)) {
                    scope.parameters.paramNameMessage =
                        'Special characters and spaces are not allowed.';
                    valid = false;
                } else {
                    scope.parameters.paramNameMessage = '';
                }
            }

            $timeout();

            return valid;
        }

        /**
         * @name isValidated
         * @param
         */
        function isValidated(param) {
            let valid = true;

            if (
                (param.paramType === 'New' && !param.paramName) ||
                (param.paramType === 'Existing' && !param.existingParam) ||
                (param.paramType === 'New' &&
                    scope.parameters.modelDisplayTypes.indexOf(
                        param.modelDisplay
                    ) > -1 &&
                    param.optionsType === 'MANUAL' &&
                    param.manualOptions.length === 0) ||
                (param.paramType === 'New' &&
                    scope.parameters.modelDisplayTypes.indexOf(
                        param.modelDisplay
                    ) > -1 &&
                    param.optionsType === 'QUERY' &&
                    !param.optionsQuery)
            ) {
                valid = false;
            }

            // need to always run this function when validating to set the message correctly.
            if (!isValidName(param)) {
                valid = false;
            }

            return valid;
        }

        /**
         * @name generateParamPayload
         * @param param the data to go through to generate the correct payload
         * @desc generate the payload required to send into the reactors
         * @returns {*} the generated payload
         */
        function generateParamPayload(param: any): any {
            // Convert the default values array to a number array if the type of column is a number for a checklist
            const type = param.type || param.detailsList[0].type;
            if (
                (type === 'CONST_DECIMAL' || type === 'CONST_INT') &&
                param.modelDisplay === 'checklist' &&
                Array.isArray(param.defaultValue)
            ) {
                param.defaultValue = param.defaultValue.map((value) => +value);
            }
            const payload = {
                detailsList: [
                    {
                        columnName: param.columnName,
                        tableName: param.tableName,
                        operator: param.operator,
                        uOperator: param.uOperator,
                        currentValue: param.currentValue,
                        pixelId: param.pixelId,
                        pixelString: param.pixelString,
                        quote: param.quote,
                        type: param.type,
                        level: param.level,
                        appId: param.appId,
                        baseQsType: param.baseQsType,
                    },
                ],
                defaultValue: param.defaultValue,
                fillType: param.optionsType,
                manualChoices:
                    param.optionsType === 'MANUAL' &&
                    scope.parameters.modelDisplayTypes.indexOf(
                        param.modelDisplay
                    ) > -1
                        ? param.manualOptions
                        : [],
                modelDisplay: param.modelDisplay,
                modelLabel: param.modelLabel,
                modelQuery: '',
                multiple:
                    param.modelDisplay !== 'checklist'
                        ? false
                        : param.selectionType === 'Multiple',
                paramName: param.paramName,
                required: param.required,
                searchable: param.searchable,
                appId: param.appId || param.detailsList[0].appId,
            };

            // set the modelQuery correctly based on modelDisplay and optionsType
            if (
                scope.parameters.modelDisplayTypes.indexOf(param.modelDisplay) >
                -1
            ) {
                if (param.optionsType === 'QUERY') {
                    payload.modelQuery = param.optionsQuery;
                } else if (param.optionsType === 'PIXEL') {
                    payload.modelQuery = param.optionsPixel;
                }
            }

            // translate to how BE expects it
            if (param.optionsType === 'DEFAULT') {
                // if fill type is PIXEL and modelQuery is empty, BE will auto generate
                payload.modelQuery = '';
                payload.fillType = 'PIXEL';
            }

            return payload;
        }

        /**
         * @name generateFEParamPayload
         * @param param the BE param payload to convert to FE
         */
        function generateFEParamPayload(param): any {
            let payload: any = [],
                levels: any = [];
            for (let paramIdx = 0; paramIdx < param.length; paramIdx++) {
                levels = [];
                const tempParam = {
                    _display: '',
                    paramType: 'New',
                    paramName: param[paramIdx].paramName,
                    modelDisplay: param[paramIdx].modelDisplay || 'checklist',
                    modelLabel: param[paramIdx].modelLabel || '',
                    existingParam: scope.parameters.currentParams[0],
                    selectionType: param[paramIdx].multiple
                        ? 'Multiple'
                        : 'Single',
                    optionsType: param[paramIdx].fillType,
                    optionsPixel:
                        param[paramIdx].fillType === 'PIXEL'
                            ? param[paramIdx].modelQuery
                            : '',
                    optionsQuery:
                        param[paramIdx].fillType === 'QUERY'
                            ? param[paramIdx].modelQuery
                            : '',
                    manualOptions: param[paramIdx].manualChoices,
                    defaultValue: param[paramIdx].defaultValue,
                    searchable: param[paramIdx].searchable,
                    required: param[paramIdx].required,
                    detailsList: param[paramIdx].detailsList,
                    levels: '',
                };

                // set all the levels this param has been bound to
                for (
                    let levelIdx = 0;
                    levelIdx < tempParam.detailsList.length;
                    levelIdx++
                ) {
                    if (tempParam.levels) {
                        tempParam.levels += ', ';
                    }

                    tempParam.levels +=
                        tempParam.detailsList[levelIdx].columnName +
                        '(' +
                        tempParam.detailsList[levelIdx].level.toLowerCase() +
                        ' level)';
                }

                // need to take a look at fillType
                // if PIXEL, check to see if it's using Query(...); we should parse out the raw query and set optionsType = 'QUERY'
                // if PIXEL, and optionsPixel is empty, we will set optionsType = 'DEFAULT'
                if (tempParam.optionsType === 'PIXEL') {
                    if (tempParam.optionsPixel === '') {
                        tempParam.optionsType = 'DEFAULT';
                    } else if (
                        tempParam.optionsPixel.indexOf('Query("<encode>') > -1
                    ) {
                        const match = tempParam.optionsPixel.match(
                            '<encode>s*(.*)s*</encode>'
                        );
                        tempParam.optionsType = 'QUERY';

                        if (match) {
                            tempParam.optionsQuery = match[1].trim();
                        } else {
                            // fall back to the pixel if we cant find anything within <encode>
                            tempParam.optionsQuery = '';
                            tempParam.optionsType = 'PIXEL';
                            tempParam.optionsPixel = tempParam.optionsPixel;
                        }
                    }
                }

                payload.push(tempParam);
            }

            return payload;
        }

        /**
         * @name selectParam
         * @param level which level of the tree is selected
         * @param type type of operation. add/edit
         * @param param the param to select
         * @param boundIndex when its an edit, which index of detailsList is selected
         * @desc set the selected param to create
         * @returns {void}
         */
        function selectParam(
            level: string,
            type: string,
            param: any,
            boundIndex: number
        ): void {
            function _getDisplay(): string {
                let displayName = '';
                if (level === 'COLUMN') {
                    displayName = param.detailsList[0].columnName;
                } else if (level === 'TABLE') {
                    displayName = param.detailsList[0].tableName;
                } else if (level === 'OPERATOR') {
                    displayName = param.detailsList[0].operator;
                } else if (level === 'OPERATORU') {
                    displayName = param.detailsList[0].uOperator;
                }

                return displayName;
            }

            scope.parameters.paramNameMessage = '';
            scope.parameters.selectionTypeOptions = ['Single'];

            if (type === 'add') {
                if (param._details) {
                    param = semossCoreService.utility.freeze(param._details);
                }

                const details = param.detailsList[0];
                scope.parameters.selectedParam = {
                    _display: _getDisplay(),
                    paramType: 'New',
                    paramName: details.columnName + '_Param',
                    existingParam: scope.parameters.currentParams[0],
                    selectionType: 'Single',
                    optionsType:
                        details.baseQsType === 'SQS' ? 'DEFAULT' : 'MANUAL',
                    optionsPixel: '',
                    optionsQuery: '',
                    manualOptions: [],
                    defaultValue: '',
                    columnName: details.columnName,
                    tableName: details.tableName,
                    operator: details.operator,
                    uOperator: level === 'OPERATORU' ? details.uOperator : '',
                    appId: details.appId,
                    pixelId: details.pixelId,
                    pixelString: details.pixelString,
                    type: details.type,
                    quote: details.quote,
                    currentValue: details.currentValue || '',
                    baseQsType: details.baseQsType,
                    searchable: param.searchable,
                    required: param.required,
                    level: level,
                    modelDisplay: 'checklist',
                    modelLabel: 'Enter ' + details.columnName + ':',
                    _operatorDisplay: param._operatorDisplay,
                };
                // cannot be multiple when the operator contains < or >
                if (
                    param._operatorDisplay.indexOf('<') === -1 &&
                    param._operatorDisplay.indexOf('>') === -1
                ) {
                    scope.parameters.selectionTypeOptions.push('Multiple');
                }
            } else if (type === 'edit') {
                const tempParam = param;
                if (param._boundParam) {
                    param = semossCoreService.utility.freeze(param._boundParam);
                }
                scope.parameters.selectedParam =
                    semossCoreService.utility.freeze(param);
                scope.parameters.selectedParam._edit = true;
                scope.parameters.selectedParam._display =
                    scope.parameters.selectedParam.paramName;
                scope.parameters.selectedParam._boundIndex = boundIndex;
                if (tempParam._details) {
                    scope.parameters.selectedParam._operatorDisplay =
                        tempParam._details._operatorDisplay;
                }

                // only need to check first one
                // cannot be multiple when the operator contains < or >
                if (
                    param.detailsList[0].operator.indexOf('<') === -1 &&
                    param.detailsList[0].operator.indexOf('>') === -1
                ) {
                    scope.parameters.selectionTypeOptions.push('Multiple');
                }
            }
        }

        /**
         * @name createParam
         * @param param {*} the param to create
         * @desc create user defined param
         * @returns {void}
         */
        function createParam(param: any): void {
            // this is setting an existing parameter to a specific level. so we need to go through an update instead
            if (param.paramType === 'Existing') {
                // we need to update the level here
                const tempParam = semossCoreService.utility.freeze(
                    param.existingParam
                );
                const detailsObj = {
                    columnName: param.columnName,
                    tableName: param.tableName,
                    operator: param.operator,
                    uOperator: param.uOperator,
                    currentValue: param.currentValue,
                    pixelId: param.pixelId,
                    pixelString: param.pixelString,
                    quote: param.quote,
                    type: param.type,
                    level: param.level,
                    appId: param.appId,
                    baseQsType: param.baseQsType,
                };

                tempParam.detailsList.push(detailsObj);

                updateParam(tempParam);
                return;
            }
            const components = [
                {
                    type: 'addInsightParameter',
                    components: [generateParamPayload(param)],
                    meta: true,
                    terminal: true,
                },
            ];
            const callback = function (response: any) {
                const opType = response.pixelReturn[0].operationType;

                if (opType.indexOf('ERROR') === -1) {
                    scope.parameters.selectedParam = {};
                    scope.insightCtrl.alert(
                        'success',
                        param.paramName + ' has been successfully added.'
                    );
                }
                getParams();
            };
            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name updateParam
         * @param param {*} the param to update
         * @desc update an existing param
         * @returns {void}
         */
        function updateParam(param: any): void {
            let payload = JSON.parse(angular.toJson(param));
            // we convert the payload to what BE expects
            payload = generateParamPayload(payload);
            // then we need to set the detailsList that denotes the levels this param is applied to
            payload.detailsList = param.detailsList;

            const components = [
                {
                    type: 'updateInsightParameter',
                    components: [payload],
                    meta: true,
                    terminal: true,
                },
            ];
            const callback = function (response: any) {
                const opType = response.pixelReturn[0].operationType;

                if (opType.indexOf('ERROR') === -1) {
                    scope.parameters.selectedParam = {};
                    scope.insightCtrl.alert(
                        'success',
                        param.paramName + ' has been successfully added.'
                    );
                }
                getParams();
            };
            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name deleteParam
         * @param param {*} the param to delete
         * @desc delete an existing param
         * @returns {void}
         */
        function deleteParam(param: any): void {
            const components = [
                {
                    type: 'deleteInsightParameter',
                    components: [param.paramName],
                    meta: true,
                    terminal: true,
                },
            ];
            const callback = function (response) {
                const opType = response.pixelReturn[0].operationType;

                if (opType.indexOf('ERROR') === -1) {
                    scope.insightCtrl.alert(
                        'success',
                        param.paramName + ' has been successfully deleted.'
                    );
                }
                scope.parameters.selectedParam = {};
                getParams();
            };
            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name getParams
         * @desc get the existing params for this insight
         * @returns {void}
         */
        function getParams(): void {
            const components = [
                {
                    type: 'getInsightParameters',
                    components: [],
                    meta: true,
                    terminal: true,
                },
            ];
            const callback = function (response) {
                const output = response.pixelReturn[0].output;
                const opType = response.pixelReturn[0].operationType;

                if (opType.indexOf('ERROR') === -1) {
                    scope.parameters.currentParams =
                        generateFEParamPayload(output);
                    scope.parameters.currentParams = bindParams(
                        scope.parameters.currentParams
                    );
                    // bind to workspaceSave to display
                    scope.workspaceSaveCtrl.parameters.list =
                        scope.parameters.currentParams;
                }
            };
            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name bindParams
         * @param params the params to loop through so we can bind to the proper levels in paramOptions
         */
        function bindParams(params: any) {
            for (
                let optionIdx = 0;
                optionIdx < scope.parameters.paramOptions.length;
                optionIdx++
            ) {
                const param = scope.parameters.paramOptions[optionIdx];

                // loop through and wipe the existing _boundParam key to start fresh
                for (const column in param.params) {
                    delete param.params[column]._boundParam;
                    for (const table in param.params[column]) {
                        delete param.params[column][table]._boundParam;
                        for (const operator in param.params[column][table]) {
                            delete param.params[column][table][operator]
                                ._boundParam;
                            for (const operatorU in param.params[column][table][
                                operator
                            ]) {
                                delete param.params[column][table][operator][
                                    operatorU
                                ]._boundParam;
                            }
                        }
                    }
                }

                // then re-bind the _boundParam based on the params passed in
                for (let paramIdx = 0; paramIdx < params.length; paramIdx++) {
                    const detailsList = params[paramIdx].detailsList;
                    for (
                        let detailsIdx = 0;
                        detailsIdx < detailsList.length;
                        detailsIdx++
                    ) {
                        if (param.pixelId === detailsList[detailsIdx].pixelId) {
                            const columnName =
                                detailsList[detailsIdx].columnName;
                            const tableName = detailsList[detailsIdx].tableName;
                            const operatorName =
                                detailsList[detailsIdx].operator;
                            const operatorUName =
                                detailsList[detailsIdx].uOperator;
                            let columnParam: any = {},
                                tableParam: any = {},
                                operatorParam: any = {},
                                operatorUParam: any = {};

                            if (columnName) {
                                columnParam = param.params[columnName];
                            }

                            if (tableName) {
                                tableParam = columnParam[tableName];
                            }

                            if (operatorName) {
                                operatorParam = tableParam[operatorName];
                            }

                            if (operatorUName) {
                                operatorUParam = operatorParam[operatorUName];
                            }

                            if (detailsList[detailsIdx].level === 'COLUMN') {
                                columnParam._boundParam = params[paramIdx];
                                columnParam._boundIndex = detailsIdx;
                            } else if (
                                detailsList[detailsIdx].level === 'TABLE'
                            ) {
                                tableParam._boundParam = params[paramIdx];
                                tableParam._boundIndex = detailsIdx;
                            } else if (
                                detailsList[detailsIdx].level === 'OPERATOR'
                            ) {
                                operatorParam._boundParam = params[paramIdx];
                                operatorParam._boundIndex = detailsIdx;
                            } else if (
                                detailsList[detailsIdx].level === 'OPERATORU'
                            ) {
                                operatorUParam._boundParam = params[paramIdx];
                                operatorUParam._boundIndex = detailsIdx;
                            }
                        }
                    }
                }
            }

            return params;
        }

        /**
         * @name unbindParam
         * @param param the parameter to unbind
         * @desc unbind a parameter from a level
         * @returns {void}
         */
        function unbindParam(param: any): void {
            // if detailsList has more than 1 item, we will updateParam. if it has just one item, we will deleteParam
            if (param.detailsList.length === 1) {
                scope.parameters.selectedParam = {};
                deleteParam(param);
                return;
            }

            // look at _boundIndex and remove this index from detailsList, then update
            param.detailsList.splice(param._boundIndex, 1);
            updateParam(param);
        }

        /**
         * @name initialize
         * @desc run on load
         * @returns {void}
         */
        function initialize(): void {
            const components = [
                {
                    type: 'importParamOptions',
                    components: [],
                    terminal: true,
                    meta: true,
                },
            ];
            const callback = function (response: any) {
                const output = response.pixelReturn[0].output;

                if (Object.keys(output).length > 0) {
                    const tempOptions =
                        semossCoreService.utility.freeze(output);
                    // assigning the details to each level so we can easily access them when setting the selected param
                    for (
                        let outputIdx = 0;
                        outputIdx < output.length;
                        outputIdx++
                    ) {
                        for (const column in output[outputIdx].params) {
                            let details: any = {},
                                operatorDisplay = '',
                                columnCurrentValue = '',
                                columnCurrentValueArr: string[] = [];
                            for (const table in output[outputIdx].params[
                                column
                            ]) {
                                let tableCurrentValue = '';
                                let tableCurrentValueArr: string[] = [];
                                for (const operator in output[outputIdx].params[
                                    column
                                ][table]) {
                                    let operatorCurrentValue = '';
                                    let operatorCurrentValueArr: string[] = [];
                                    if (operatorDisplay) {
                                        operatorDisplay += ', ';
                                    }

                                    operatorDisplay += operator;
                                    for (const uOperator in output[outputIdx]
                                        .params[column][table][operator]) {
                                        const operatorArr =
                                            output[outputIdx].params[column][
                                                table
                                            ][operator][uOperator];
                                        details = operatorArr[0];
                                        details.pixelId =
                                            output[outputIdx].pixelId;
                                        details.pixelString =
                                            output[outputIdx].pixelString;
                                        details._operatorDisplay =
                                            operatorDisplay;
                                        let tempCurrentValue = '';
                                        const tempCurrentValueArr: string[] =
                                            [];
                                        // loop through all of the operator information and set up the display
                                        for (
                                            let operatorIdx = 0;
                                            operatorIdx < operatorArr.length;
                                            operatorIdx++
                                        ) {
                                            tempCurrentValue +=
                                                '\n ⁃ ' +
                                                operatorArr[operatorIdx]
                                                    .detailsList[0].columnName +
                                                ' ' +
                                                operatorArr[operatorIdx]
                                                    .detailsList[0].operator +
                                                ' ';

                                            if (
                                                operatorArr[operatorIdx]
                                                    .detailsList[0]
                                                    .currentValue ||
                                                typeof operatorArr[operatorIdx]
                                                    .detailsList[0]
                                                    .currentValue === 'number'
                                            ) {
                                                tempCurrentValue +=
                                                    operatorArr[operatorIdx]
                                                        .detailsList[0]
                                                        .currentValue;
                                            } else {
                                                tempCurrentValue +=
                                                    'None Assigned';
                                            }

                                            tempCurrentValueArr.push(
                                                tempCurrentValue.replace(
                                                    '\n ⁃ ',
                                                    ''
                                                )
                                            );
                                        }
                                        columnCurrentValue += tempCurrentValue;
                                        tableCurrentValue += tempCurrentValue;
                                        operatorCurrentValue +=
                                            tempCurrentValue;

                                        columnCurrentValueArr =
                                            columnCurrentValueArr.concat(
                                                tempCurrentValueArr
                                            );
                                        tableCurrentValueArr =
                                            tableCurrentValueArr.concat(
                                                tempCurrentValueArr
                                            );
                                        operatorCurrentValueArr =
                                            operatorCurrentValueArr.concat(
                                                tempCurrentValueArr
                                            );

                                        tempOptions[outputIdx].params[column][
                                            table
                                        ][operator][uOperator]._details =
                                            semossCoreService.utility.freeze(
                                                details
                                            );
                                        // override cuz this is at uoperator level so only display this operator
                                        tempOptions[outputIdx].params[column][
                                            table
                                        ][operator][
                                            uOperator
                                        ]._details._operatorDisplay = operator;
                                        tempOptions[outputIdx].params[column][
                                            table
                                        ][operator][
                                            uOperator
                                        ]._details._tooltip =
                                            'Current Values:' +
                                            tempCurrentValue;
                                        tempOptions[outputIdx].params[column][
                                            table
                                        ][operator][
                                            uOperator
                                        ]._details._currentFilters = tempCurrentValueArr;
                                    }
                                    tempOptions[outputIdx].params[column][
                                        table
                                    ][operator]._details =
                                        semossCoreService.utility.freeze(
                                            details
                                        );
                                    // override cuz this is at operator level so only display this operator
                                    tempOptions[outputIdx].params[column][
                                        table
                                    ][operator]._details._operatorDisplay =
                                        operator;
                                    tempOptions[outputIdx].params[column][
                                        table
                                    ][operator]._details._tooltip =
                                        'Current Values:' +
                                        operatorCurrentValue;
                                    tempOptions[outputIdx].params[column][
                                        table
                                    ][operator]._details._currentFilters =
                                        operatorCurrentValueArr;
                                }
                                tempOptions[outputIdx].params[column][
                                    table
                                ]._details =
                                    semossCoreService.utility.freeze(details);
                                tempOptions[outputIdx].params[column][
                                    table
                                ]._details._tooltip =
                                    'Current Values:' + tableCurrentValue;
                                tempOptions[outputIdx].params[column][
                                    table
                                ]._details._currentFilters = tableCurrentValueArr;
                            }
                            tempOptions[outputIdx].params[column]._details =
                                semossCoreService.utility.freeze(details);
                            tempOptions[outputIdx].params[
                                column
                            ]._details._tooltip =
                                'Current Values:' + columnCurrentValue;
                            tempOptions[outputIdx].params[
                                column
                            ]._details._currentFilters = columnCurrentValueArr;
                        }
                    }
                    scope.parameters.paramOptions = tempOptions;
                } else {
                    scope.parameters.paramOptions = [];
                }
                getParams();
            };
            scope.insightCtrl.meta(components, callback);
        }

        initialize();
    }
}
