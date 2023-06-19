'use strict';

export default angular
    .module('app.metamodel.metamodel-column', [])
    .directive('metamodelColumn', metamodelColumnDirective);

metamodelColumnDirective.$inject = ['$timeout', 'semossCoreService'];

import './metamodel-column.scss';

function metamodelColumnDirective($timeout, semossCoreService) {
    metamodelColumnCtrl.$inject = [];
    metamodelColumnLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./metamodel-column.directive.html'),
        scope: {},
        require: [],
        bindToController: {
            appId: '=?',
            open: '=',
            column: '=',
            change: '&?',
            type: '=',
        },
        controllerAs: 'metamodelColumn',
        controller: metamodelColumnCtrl,
        link: metamodelColumnLink,
    };

    function metamodelColumnCtrl() {}

    function metamodelColumnLink(scope, ele, attrs, ctrl) {
        var instanceTimeout,
            defaultOptions =
                semossCoreService.visualization.getDefaultOptions();

        scope.metamodelColumn.setColumnGroup = setColumnGroup;
        scope.metamodelColumn.saveColumn = saveColumn;
        scope.metamodelColumn.closeColumn = closeColumn;
        scope.metamodelColumn.selectFormat = selectFormat;
        scope.metamodelColumn.selectFormatType = selectFormatType;
        scope.metamodelColumn.predictDescription = predictDescription;
        scope.metamodelColumn.addLogical = addLogical;
        scope.metamodelColumn.removeLogical = removeLogical;
        scope.metamodelColumn.predictLogical = predictLogical;
        scope.metamodelColumn.filterInstances = filterInstances;
        scope.metamodelColumn.getMoreInstances = getMoreInstances;
        scope.metamodelColumn.setSelectedFormat = setSelectedFormat;
        scope.metamodelColumn.setFormatOptions = setFormatOptions;

        scope.metamodelColumn.group = 'Settings';
        scope.metamodelColumn.format = {};
        scope.metamodelColumn.format.options = defaultOptions;
        scope.metamodelColumn.format.custom = '';
        scope.metamodelColumn.format.selectedOption = null;

        scope.metamodelColumn.formatOptions = {
            dimension: '',
            dimensionType: '',
            model: '',
            type: 'Default',
            delimiter: 'Default',
            prepend: '',
            append: '',
            round: 2,
            appliedString: '',
            layout: '',
            date: 'Default',
        };
        scope.metamodelColumn.customOptions =
            semossCoreService.visualization.getCustomOptions();

        function getSelectedFormat(typeFormat) {
            let tempFormat = typeFormat,
                selectedFormat;
            // when saved custom formats returned as JSON string
            if (
                typeof typeFormat === 'string' &&
                typeFormat !== '' &&
                isJson(typeFormat)
            ) {
                scope.metamodelColumn.formatOptions = JSON.parse(typeFormat);
                scope.metamodelColumn.updatedColumn.typeFormat = 'Custom';
                tempFormat = 'Custom';
            } else if (typeof typeFormat === 'object') {
                // custom formats haven't be saved yet still stored as obj
                scope.metamodelColumn.formatOptions = typeFormat;
                scope.metamodelColumn.updatedColumn.typeFormat = 'Custom';
                tempFormat = 'Custom';
            }
            selectedFormat =
                scope.metamodelColumn.format.selectedOption.formats.find(
                    function (format) {
                        return format.value === tempFormat;
                    }
                );
            if (selectedFormat && selectedFormat.value === 'Custom') {
                selectedFormat.options = scope.metamodelColumn.formatOptions;
            }
            // for DOUBLE if additional data type is not yet specified do not show a format selection since no format rules have been applied
            if (
                !selectedFormat &&
                scope.metamodelColumn.updatedColumn.type === 'DOUBLE'
            ) {
                selectedFormat = {
                    display: '',
                    value: '',
                };
            }
            // for all other types besides DOUBLE (INT, DATE, etc.) a default format is applied so well pull in the default as selected
            return selectedFormat || getDefaultFormat();
        }

        /**
         * @name isJson
         * @param {string} str typeFormat of column
         * @desc checks if typeformat is a json obj of custom format rules
         * @returns {boolean} true or false
         */
        function isJson(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        /**
         * @name getSelectedOption
         * @description Finds option for a given type
         * @param  {string} type Type to match
         * @return {object|null} Matched option if there is one
         */
        function getSelectedOption(type) {
            return scope.metamodelColumn.format.options.find(function (option) {
                return option.value === type;
            });
        }

        /**
         * @name setFormatOptions
         * @description Set format options from the selected type option
         * @return {void}
         */
        function setFormatOptions() {
            scope.metamodelColumn.formatOptions =
                scope.metamodelColumn.format.selectedOption.selectedFormat
                    .options || {};
            scope.metamodelColumn.formatOptions.dimension =
                scope.metamodelColumn.updatedColumn.alias;
            scope.metamodelColumn.formatOptions.dimensionType =
                scope.metamodelColumn.updatedColumn.type;
        }

        /**
         * @name openColumn
         * @desc sets the header to be formatted
         * @return {void}
         */
        function openColumn() {
            scope.metamodelColumn.updatedColumn = JSON.parse(
                JSON.stringify(scope.metamodelColumn.column)
            );
            // console.log('openColumn', scope.metamodelColumn.updatedColumn)
            scope.metamodelColumn.format.selectedOption = getSelectedOption(
                scope.metamodelColumn.updatedColumn.type
            );
            scope.metamodelColumn.format.selectedOption.selectedFormat =
                getSelectedFormat(
                    scope.metamodelColumn.updatedColumn.typeFormat
                );
            scope.metamodelColumn.format.custom = '';
            scope.metamodelColumn.newLogical = '';
            scope.metamodelColumn.instances = {
                loading: false,
                taskId: false,
                options: [], // all values on the dom for the alias
                search: '', // search term used
                limit: 50, // how many filter values to collect
                canCollect: true,
            };

            setFormatOptions();
            setColumnGroup('Settings');
        }

        /**
         * @name setColumnGroup
         * @desc set the column group
         * @param {string} group - group to view
         * @return {void}
         */
        function setColumnGroup(group) {
            scope.metamodelColumn.group = group;

            if (scope.metamodelColumn.group === 'Sample Instances') {
                getInstances();
            }
        }

        /**
         * @name saveColumn
         * @desc updates header to changes user has made
         * @return {void}
         */
        function saveColumn() {
            var format, option, type, typeFormat;

            option = scope.metamodelColumn.format.selectedOption;

            // set the type
            // type = scope.metamodelColumn.updatedColumn.type;
            type = option.value;
            format = option.selectedFormat;

            typeFormat = format.value;

            // set the format
            if (scope.metamodelColumn.format.custom) {
                typeFormat = scope.metamodelColumn.format.custom;
            } else if (typeFormat === 'Custom') {
                typeFormat = format.options;
            } else if (type === 'DATE' && typeFormat === null) {
                typeFormat = 'yyyy-MM-dd';
            }
            // else {
            //     typeFormat = scope.metamodelColumn.updatedColumn.typeFormat;
            // }

            if (scope.metamodelColumn.change) {
                scope.metamodelColumn.change({
                    type: type,
                    typeFormat: typeFormat,
                    alias: scope.metamodelColumn.updatedColumn.alias,
                    description:
                        scope.metamodelColumn.updatedColumn.description,
                    logical: scope.metamodelColumn.updatedColumn.logical,
                });
            }

            // Reset
            closeColumn();
        }

        /**
         * @name closeColumn
         * @desc cancel formatting
         * @return {void}
         */
        function closeColumn() {
            scope.metamodelColumn.open = false;
            scope.metamodelColumn.updatedColumn = {};
        }

        /** Format Functions */

        /**
         * @name getDefaultFormat
         * @description Returns the default format if a format is flagged with isDefault
         * @return {object} Default format of the selected type option
         */
        function getDefaultFormat() {
            const defaultFormat =
                scope.metamodelColumn.format.selectedOption.formats.find(
                    function (format) {
                        return format.isDefault;
                    }
                );

            return (
                defaultFormat || {
                    value: '',
                }
            );
        }

        /**
         * @name setSelectedFormat
         * @description Sets selected format option of the selected type option
         * @returns {void}
         */
        function setSelectedFormat() {
            scope.metamodelColumn.format.selectedOption.selectedFormat =
                getSelectedFormat(
                    scope.metamodelColumn.updatedColumn.typeFormat
                );
        }

        /**
         * @name selectFormat
         * @param {object} type the type selected
         * @desc select the type and custom formatting
         * @return {void}
         */
        function selectFormat() {
            // scope.metamodelColumn.updatedColumn.type = type.value;
            // scope.metamodelColumn.updatedColumn.typeFormat = '';
            // scope.metamodelColumn.format.custom = '';
        }

        /**
         * @name selectFormatType
         * @param {object} format the format selected
         * @desc select the format and custom formatting
         * @return {void}
         */
        function selectFormatType(format) {
            scope.metamodelColumn.updatedColumn.typeFormat = format.value;
            scope.metamodelColumn.format.custom = '';
        }

        /** Description Functions */
        /**
         * @name predictDescription
         * @desc predict the description
         * @return {void}
         */
        function predictDescription() {
            var message = semossCoreService.utility.random('predict');

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output[0]) {
                    scope.metamodelColumn.updatedColumn.description = output[0];
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'predictOwlDescription',
                        components: [
                            scope.metamodelColumn.appId,
                            scope.metamodelColumn.updatedColumn.column,
                            scope.metamodelColumn.updatedColumn.table,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Logical Functions */
        /**
         * @name addLogical
         * @desc add a logical name
         * @return {void}
         */
        function addLogical() {
            if (
                scope.metamodelColumn.newLogical &&
                scope.metamodelColumn.updatedColumn.logical.indexOf(
                    scope.metamodelColumn.newLogical
                ) === -1
            ) {
                scope.metamodelColumn.updatedColumn.logical.push(
                    scope.metamodelColumn.newLogical
                );
            }

            scope.metamodelColumn.newLogical = '';
        }

        /**
         * @name removeLogical
         * @param {number} index - the index to remove the logical from
         * @desc remove a logical name
         * @return {void}
         */
        function removeLogical(index) {
            scope.metamodelColumn.updatedColumn.logical.splice(index, 1);
        }

        /**
         * @name predictLogical
         * @desc predict the logical names
         * @return {void}
         */
        function predictLogical() {
            var message = semossCoreService.utility.random('predict');

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output) {
                    scope.metamodelColumn.updatedColumn.logical =
                        scope.metamodelColumn.updatedColumn.logical.concat(
                            output
                        );
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'predictOwlLogicalNames',
                        components: [
                            scope.metamodelColumn.appId,
                            scope.metamodelColumn.updatedColumn.table,
                            scope.metamodelColumn.updatedColumn.column,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Instances */

        /**
         * @name getInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function getInstances() {
            var components = [],
                filterObj = {},
                message = semossCoreService.utility.random('meta-pixel');

            scope.metamodelColumn.instances.loading = true;
            scope.metamodelColumn.instances.taskId = false;
            scope.metamodelColumn.instances.options = [];
            scope.metamodelColumn.instances.canCollect = true;

            let selector = '';
            if (
                scope.metamodelColumn.type === 'GRAPH' &&
                scope.metamodelColumn.updatedColumn.isPrimKey
            ) {
                selector = `${scope.metamodelColumn.updatedColumn.column}`;
            } else {
                selector = `${scope.metamodelColumn.updatedColumn.table}__${scope.metamodelColumn.updatedColumn.column}`;
            }

            components.push(
                {
                    type: 'database',
                    components: [scope.metamodelColumn.appId],
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector: selector,
                                alias: scope.metamodelColumn.updatedColumn
                                    .column,
                            },
                        ],
                    ],
                }
            );

            if (scope.metamodelColumn.instances.search) {
                // search
                filterObj[selector] = {
                    comparator: '?like',
                    value: [scope.metamodelColumn.instances.search],
                };

                components.push({
                    type: 'filter',
                    components: [filterObj],
                });
            }

            components.push(
                {
                    type: 'sort',
                    components: [[selector]],
                },
                {
                    type: 'collect',
                    components: [scope.metamodelColumn.instances.limit],
                    terminal: true,
                }
            );

            // register message to come back to
            semossCoreService.once(message, function (response) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // add new ones
                for (let i = 0, len = output.data.values.length; i < len; i++) {
                    let temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.metamodelColumn.instances.options.push(temp);
                }

                scope.metamodelColumn.instances.taskId = output.taskId;
                scope.metamodelColumn.instances.canCollect =
                    output.numCollected === output.data.values.length;
                scope.metamodelColumn.instances.loading = false;
            });

            semossCoreService.emit('query-pixel', {
                commandList: components,
                response: message,
            });
        }

        /**
         * @name filterInstances
         * @desc filter instances for the selected column
         * @return {void}
         */
        function filterInstances() {
            if (instanceTimeout) {
                $timeout.cancel(instanceTimeout);
            }

            instanceTimeout = $timeout(function () {
                getInstances();
            }, 500);
        }

        /**
         * @name getMoreInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function getMoreInstances() {
            var message = semossCoreService.utility.random('meta-pixel');

            if (!scope.metamodelColumn.instances.canCollect) {
                return;
            }

            scope.metamodelColumn.instances.loading = true;

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len,
                    temp;

                // add new ones
                for (i = 0, len = output.data.values.length; i < len; i++) {
                    temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.metamodelColumn.instances.options.push(
                        output.data.values[i][0]
                    );
                }

                scope.metamodelColumn.instances.taskId = output.taskId;
                scope.metamodelColumn.instances.canCollect =
                    output.numCollected === output.data.values.length;
                scope.metamodelColumn.instances.loading = false;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'task',
                        components: [scope.metamodelColumn.instances.taskId],
                    },
                    {
                        type: 'collect',
                        components: [scope.metamodelColumn.instances.limit],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Helpers */

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @return {void}
         */
        function initialize() {
            $timeout(function () {
                scope.$watch(
                    function () {
                        return scope.metamodelColumn.open;
                    },
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            if (open) {
                                openColumn();
                            }
                        }
                    }
                );

                if (open) {
                    openColumn();
                }
            });
        }

        initialize();
    }
}
