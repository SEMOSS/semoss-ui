'use strict';

import './pipeline-compiler.scss';

export default angular
    .module('app.pipeline.compiler', [])
    .directive('pipelineCompiler', pipelineCompilerDirective);

pipelineCompilerDirective.$inject = ['semossCoreService'];

function pipelineCompilerDirective(semossCoreService) {
    pipelineCompilerCtrl.$inject = [];
    pipelineCompilerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineCompilerCtrl,
        link: pipelineCompilerLink,
        template: require('./pipeline-compiler.directive.html'),
        scope: {},
        bindToController: {},
        controllerAs: 'pipelineCompiler',
    };

    function pipelineCompilerCtrl() {}

    function pipelineCompilerLink(scope, ele, attrs, ctrl) {
        var compilerScope;

        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.pipelineCompiler.registerCompiler = registerCompiler;
        scope.pipelineCompiler.previewCompiler = previewCompiler;
        scope.pipelineCompiler.executeCompiler = executeCompiler;

        /**
         * @name setCompiler
         * @desc update the source headers
         * @returns {void}
         */
        function setCompiler() {
            var updated,
                input,
                parameter,
                parameters,
                queryIdx,
                queryLen,
                paramIdx,
                paramLen;

            // get a copy of the parameters, we will be updating this for pipeline
            input = scope.pipelineComponentCtrl.getComponent('input');
            parameters = scope.pipelineComponentCtrl.getComponent('parameters');

            // validate that all of the inputs are open
            for (parameter in parameters) {
                if (parameters.hasOwnProperty(parameter)) {
                    if (parameters[parameter].type === 'CREATE_FRAME') {
                        scope.pipelineCompiler.visualize = true;
                    }
                    if (
                        input.indexOf(parameter) > -1 &&
                        typeof parameters[parameter].value === 'undefined'
                    ) {
                        scope.pipelineComponentCtrl.closeComponent();

                        return;
                    }
                }
            }

            // copy over the values
            updated = scope.pipelineComponentCtrl.getComponent('options.json');
            for (
                queryIdx = 0, queryLen = updated.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                for (
                    paramIdx = 0, paramLen = updated[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    // all the params have to be in the pipeline
                    // does the paramter value exist?
                    if (
                        parameters.hasOwnProperty(
                            updated[queryIdx].params[paramIdx].paramName
                        )
                    ) {
                        if (
                            !updated[queryIdx].params[paramIdx].hasOwnProperty(
                                'model'
                            )
                        ) {
                            updated[queryIdx].params[paramIdx].model = {};
                        }

                        updated[queryIdx].params[paramIdx].model.defaultValue =
                            parameters[
                                updated[queryIdx].params[paramIdx].paramName
                            ].value;

                        if (
                            updated[queryIdx].params[paramIdx].model
                                .validateHeaders
                        ) {
                            const defaultValue =
                                    updated[queryIdx].params[paramIdx].model
                                        .defaultValue,
                                defaultOptions =
                                    updated[queryIdx].params[paramIdx].model
                                        .defaultOptions;
                            // if its an array, we will loop through and check to see if the defaultValue selections exist in defaultOptions
                            if (
                                Array.isArray(
                                    updated[queryIdx].params[paramIdx].model
                                        .defaultValue
                                )
                            ) {
                                // we will validate that the default value is in defaultOptions. if not, we will remove the instance
                                let tempValues =
                                    semossCoreService.utility.freeze(
                                        defaultValue
                                    );

                                for (
                                    let valueIdx = 0;
                                    valueIdx < defaultValue.length;
                                    valueIdx++
                                ) {
                                    let validValue = false;
                                    for (
                                        let optionIdx = 0;
                                        optionIdx < defaultOptions.length;
                                        optionIdx++
                                    ) {
                                        if (
                                            defaultOptions[optionIdx].alias ===
                                            defaultValue[valueIdx]
                                        ) {
                                            validValue = true;
                                            break;
                                        }
                                    }

                                    if (!validValue) {
                                        tempValues.splice(
                                            tempValues.indexOf(
                                                defaultValue[valueIdx]
                                            ),
                                            1
                                        );
                                    }
                                }

                                updated[queryIdx].params[
                                    paramIdx
                                ].model.defaultValue = tempValues;
                            } else {
                                let validValue = false;
                                // otherwise we will just loop through defaultOptions and see if the single value in defaultValue exists in defaultOptions
                                for (
                                    let optionIdx = 0;
                                    optionIdx < defaultOptions.length;
                                    optionIdx++
                                ) {
                                    if (
                                        defaultOptions[optionIdx].alias ===
                                        defaultValue
                                    ) {
                                        validValue = true;
                                        break;
                                    }
                                }
                                if (!validValue) {
                                    updated[queryIdx].params[
                                        paramIdx
                                    ].model.defaultValue = '';
                                }
                            }
                        }
                    }
                }
            }

            scope.pipelineCompiler.json = {
                updated: updated,
                valid: true,
            };
        }

        /**
         * @name registerCompiler
         * @desc register the compiler to the parent scope
         * @param {*} childScope - the compiler's scope
         * @returns {void}
         */
        function registerCompiler(childScope) {
            compilerScope = childScope;

            // preview once done registering
            previewCompiler(false);
        }

        /**
         * @name validateCompiler
         * @desc validate the compiler
         * @param {boolean} alert - message on errors
         * @returns {boolean} is the query valid?
         */
        function validateCompiler(alert) {
            var valid = true,
                updated,
                queryIdx,
                queryLen;

            updated = JSON.parse(
                JSON.stringify(scope.pipelineCompiler.json.updated)
            );
            for (
                queryIdx = 0, queryLen = updated.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                valid = compilerScope.widgetCompiler.validateQuery(
                    queryIdx,
                    updated
                );

                if (!valid) {
                    if (alert) {
                        // alert the user
                        scope.widgetCtrl.alert(
                            'warn',
                            scope.pipelineComponentCtrl.getComponent('name') +
                                ' options are not valid. Please fix errors before continuing'
                        );
                    }

                    break;
                }
            }

            return valid;
        }

        /**
         * @name previewCompiler
         * @desc preview the compiler
         * @param {boolean} alert - message on errors
         * @returns {void}
         */
        function previewCompiler(alert) {
            var parameters = {};

            if (validateCompiler(alert)) {
                parameters = buildParameters();
            }

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name executeCompiler
         * @param {boolean} visualize if true visualize frame
         * @desc execute the compiler
         * @returns {void}
         */
        function executeCompiler(visualize) {
            let parameters = {},
                callback;

            if (!validateCompiler(true)) {
                return;
            }

            parameters = buildParameters();

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                {},
                callback
            );
        }

        /**
         * @name buildParameters
         * @desc builds the params
         * @returns {object} parameters for the pixel
         */
        function buildParameters() {
            var built = {},
                updated,
                queryIdx,
                queryLen,
                paramIdx,
                paramLen;

            updated = JSON.parse(
                JSON.stringify(scope.pipelineCompiler.json.updated)
            );
            for (
                queryIdx = 0, queryLen = updated.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                for (
                    paramIdx = 0, paramLen = updated[queryIdx].params.length;
                    paramIdx < paramLen;
                    paramIdx++
                ) {
                    built[updated[queryIdx].params[paramIdx].paramName] =
                        compilerScope.widgetCompiler.generateValues(
                            '',
                            updated[queryIdx].params[paramIdx]
                        );
                }
            }

            return built;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            setCompiler();
        }

        initialize();
    }
}
