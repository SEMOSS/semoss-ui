'use strict';

export default angular
    .module('app.mdm-dictionary.directive', [])
    .directive('mdmDictionary', mdmDictionaryDirective)
    .filter('search', function () {
        return function (array, searchTerm) {
            var idx,
                newArray = [];

            if (array) {
                for (idx = 0; idx < array.length; idx++) {
                    if (
                        array[idx].table
                            .toLowerCase()
                            .replace(/_/g, ' ')
                            .indexOf(
                                searchTerm.toLowerCase().replace(/_/g, ' ')
                            ) > -1 ||
                        array[idx].column
                            .toLowerCase()
                            .replace(/_/g, ' ')
                            .indexOf(
                                searchTerm.toLowerCase().replace(/_/g, ' ')
                            ) > -1 ||
                        !searchTerm
                    ) {
                        newArray.push(array[idx]);
                    }
                }
            }

            return newArray;
        };
    });

import './mdm-dictionary.scss';

mdmDictionaryDirective.$inject = ['semossCoreService'];

function mdmDictionaryDirective(semossCoreService) {
    mdmDictionaryController.$inject = [];
    mdmDictionaryLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^mdm'],
        controller: mdmDictionaryController,
        bindToController: {
            type: '@',
        },
        controllerAs: 'mdmDictionary',
        link: mdmDictionaryLink,
        template: require('./mdm-dictionary.directive.html'),
    };

    function mdmDictionaryController() {}

    function mdmDictionaryLink(scope, ele, attrs, ctrl) {
        scope.mdmCtrl = ctrl[0];

        scope.mdmDictionary.resetDescription = resetDescription;
        scope.mdmDictionary.predictDescription = predictDescription;
        scope.mdmDictionary.resetLogical = resetLogical;
        scope.mdmDictionary.predictLogical = predictLogical;
        scope.mdmDictionary.addLogical = addLogical;
        scope.mdmDictionary.removeLogical = removeLogical;
        scope.mdmDictionary.showInstances = showInstances;
        scope.mdmDictionary.hideInstances = hideInstances;
        scope.mdmDictionary.highlightDefinition = highlightDefinition;

        scope.mdmDictionary.searchTerm = '';
        /** Matches */
        /**
         * @name findDefinitions
         * @desc find the definitions
         * @returns {void}
         */
        function findDefinitions() {
            var message, pixel;

            message = semossCoreService.utility.random('pixel');

            pixel = 'GetOwlDictionary(database=["' + scope.mdmCtrl.appId + '"]';
            pixel += ')';

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    outputIdx,
                    outputLen;

                scope.mdmDictionary.definitions = [];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                for (
                    outputIdx = 0, outputLen = output.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    scope.mdmDictionary.definitions.push({
                        table: output[outputIdx].table,
                        column: output[outputIdx].column,
                        isPrimKey: output[outputIdx].isPrimKey,
                        description: {
                            new: output[outputIdx].description[0] || '',
                            current: output[outputIdx].description[0] || '',
                        },
                        logical: {
                            new: JSON.parse(
                                JSON.stringify(output[outputIdx].logical)
                            ),
                            current: JSON.parse(
                                JSON.stringify(output[outputIdx].logical)
                            ),
                        },
                        dataType: output[outputIdx].dataType,
                    });
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name resetDescription
         * @desc reset the description
         * @param {object} definition - definition to reset
         * @return {void}
         */
        function resetDescription(definition) {
            definition.description.new = definition.description.current;
        }

        /**
         * @name predictDescription
         * @desc predict the description
         * @param {object} definition - definition to predict
         * @return {void}
         */
        function predictDescription(definition) {
            var pixel = '',
                message;

            if (definition.isPrimKey) {
                pixel +=
                    'PredictOwlDescription(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    definition.table +
                    '"]);';
            } else {
                pixel +=
                    'PredictOwlDescription(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    definition.table +
                    '"], column=["' +
                    definition.column +
                    '"]);';
            }

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output[0]) {
                    definition.description.new = output[0];
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name resetLogical
         * @desc reset the logical
         * @param {object} definition - definition to reset
         * @return {void}
         */
        function resetLogical(definition) {
            // reset it
            definition.logical.new = JSON.parse(
                JSON.stringify(definition.logical.current)
            );
            definition.logical.add = '';
        }

        /**
         * @name predictLogical
         * @desc predict the logical
         * @param {object} definition - definition to predict
         * @return {void}
         */
        function predictLogical(definition) {
            var pixel = '',
                message;

            if (definition.isPrimKey) {
                pixel +=
                    'PredictOwlLogicalNames(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    definition.table +
                    '"]);';
            } else {
                pixel +=
                    'PredictOwlLogicalNames(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    definition.table +
                    '"], column=["' +
                    definition.column +
                    '"]);';
            }

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                definition.logical.new = definition.logical.new.concat(output);
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name addLogical
         * @desc add a new logical
         * @param {object} definition - definition to reset
         * @returns {void}
         */
        function addLogical(definition) {
            if (validateLogical(definition, definition.logical.add)) {
                definition.logical.new.push(definition.logical.add);

                // clear
                definition.logical.add = '';
            }
        }

        /**
         * @name removeLogical
         * @desc remove a logical
         * @param {object} definition - definition to remove from
         * @param {number} idx - value's idx to remove
         * @returns {void}
         */
        function removeLogical(definition, idx) {
            definition.logical.new.splice(idx, 1);
        }

        /**
         * @name validateLogical
         * @desc validate the logical values
         * @param {object} definition - definition to validate from
         * @param {string} value - name to validate
         * @returns {boolean} is the logical valid?
         */
        function validateLogical(definition, value) {
            var i, len;

            if (!value) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Value is needed',
                });
                return false;
            }

            for (i = 0, len = definition.logical.new.length; i < len; i++) {
                if (definition.logical.new[i] === value) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Value already exists: ' + value,
                    });
                    return false;
                }
            }

            for (i = 0, len = definition.logical.current.length; i < len; i++) {
                if (definition.logical.current[i] === value) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Value already added: ' + value,
                    });
                    return false;
                }
            }

            return true;
        }

        /**
         * @name saveDefinitions
         * @desc save your matches
         * @returns {void}
         */
        function saveDefinitions() {
            var message,
                components = [],
                i,
                len;

            if (!scope.mdmCtrl.valid) {
                return;
            }

            for (
                i = 0, len = scope.mdmDictionary.definitions.length;
                i < len;
                i++
            ) {
                if (
                    scope.mdmDictionary.definitions[i].description.current !==
                    scope.mdmDictionary.definitions[i].description.new
                ) {
                    components.push({
                        type: 'editOwlDescription',
                        components: [
                            scope.mdmCtrl.appId,
                            scope.mdmDictionary.definitions[i].table,
                            scope.mdmDictionary.definitions[i].isPrimKey
                                ? false
                                : scope.mdmDictionary.definitions[i].column,
                            scope.mdmDictionary.definitions[i].description.new,
                        ],
                        meta: true,
                        terminal: true,
                    });
                }

                if (
                    JSON.stringify(
                        scope.mdmDictionary.definitions[i].logical.current
                    ) !==
                    JSON.stringify(
                        scope.mdmDictionary.definitions[i].logical.new
                    )
                ) {
                    components.push({
                        type: 'editOwlLogicalNames',
                        components: [
                            scope.mdmCtrl.appId,
                            scope.mdmDictionary.definitions[i].table,
                            scope.mdmDictionary.definitions[i].isPrimKey
                                ? false
                                : scope.mdmDictionary.definitions[i].column,
                            scope.mdmDictionary.definitions[i].logical.new,
                        ],
                        meta: true,
                        terminal: true,
                    });
                }
            }

            if (components.length === 0) {
                scope.mdmCtrl.updateStatus('complete');
                scope.mdmCtrl.navigate('next');
                return;
            }

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var outputIdx, outputLen;

                for (
                    outputIdx = 0, outputLen = response.pixelReturn.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    if (
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'ERROR'
                        ) > -1 ||
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'INVALID_SYNTAX'
                        ) > -1
                    ) {
                        return;
                    }
                }

                scope.mdmCtrl.updateStatus('complete');
                scope.mdmCtrl.navigate('next');
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: components,
                response: message,
            });
        }

        /**
         * @name showInstances
         * @desc show a deeper dive into the match
         * @param {*} column - column to select
         * @returns {void}
         */
        function showInstances(column) {
            if (!column) {
                return;
            }

            scope.mdmDictionary.instances = {
                open: true,
                concept: column.table + '__' + column.column,
            };
        }

        /**
         * @name hideInstances
         * @desc show a deeper dive into the match
         * @returns {void}
         */
        function hideInstances() {
            scope.mdmDictionary.instances = {
                open: false,
                concept: '',
            };
        }

        /**
         * @name highlightDefinition
         * @desc highlight the definition on the metamodel
         * @param {*} definition - definition to highlight
         * @returns {void}
         */
        function highlightDefinition(definition) {
            if (definition) {
                semossCoreService.emit('mdm-highlight', {
                    source: definition.table + '__' + definition.column,
                    target: false,
                });

                return;
            }

            semossCoreService.emit('mdm-highlight', {
                source: false,
                target: false,
            });
        }

        /**
         * @name validate
         * @desc validate the form based on the selected options
         * @returns {void}
         */
        function validate() {
            scope.mdmCtrl.valid = true;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            // set the override actions
            scope.mdmCtrl.next = saveDefinitions;
            scope.mdmCtrl.previous = scope.mdmCtrl.navigate.bind(
                null,
                'previous'
            );

            // update the metamodel
            scope.mdmCtrl.updateMetamodel();

            // update the status
            scope.mdmCtrl.updateStatus('inprogress');
            validate();

            findDefinitions();
        }

        initialize();
    }
}
