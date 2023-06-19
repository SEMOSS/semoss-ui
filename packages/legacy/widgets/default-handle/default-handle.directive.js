'use strict';

import './default-handle.scss';

/**
 * @name default-handle.directive.js
 * @desc given a json from the back end, creates a widget handle
 */
export default angular
    .module('app.default-handle.directive', [])
    .directive('defaultHandle', defaultHandleDirective);

defaultHandleDirective.$inject = ['semossCoreService'];

function defaultHandleDirective(semossCoreService) {
    defaultHandleCtrl.$inject = [];
    defaultHandleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        template: require('./default-handle.directive.html'),
        controller: defaultHandleCtrl,
        link: defaultHandleLink,
        scope: {},
        bindToController: {
            handle: '@?',
            json: '@?',
        },
        controllerAs: 'defaultHandle',
    };

    function defaultHandleCtrl() {}

    function defaultHandleLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var viewUpdateListener;

        scope.defaultHandle.initialize = initialize;

        /**
         * @name previewJSONInput
         * @desc view of the json
         * @returns {void}
         */
        function previewJSONInput() {
            try {
                scope.defaultHandle.json = JSON.parse(
                    scope.defaultHandle.freeTextInput
                );

                // validate the json is in [] format
                if (!validateJSON(scope.defaultHandle.json)) {
                    scope.defaultHandle.json = [];
                    scope.widgetCtrl.alert(
                        'error',
                        'JSON format is incorrect.'
                    );
                    return;
                }

                // save to currentWidget's json so we can grab it later for use
                scope.widgetCtrl.setWidgetState(
                    scope.defaultHandle.handle,
                    'json',
                    JSON.parse(JSON.stringify(scope.defaultHandle.json))
                );
            } catch (error) {
                scope.widgetCtrl.alert('error', error.message);
                return;
            }

            scope.defaultHandle.showJSON = false;
        }

        /**
         * @name validateJSON
         * @param {Object} json the json to check to see if its valid
         * @desc validates that the json is formatted correctly
         * @returns {Boolean} whether this json is a valid json as a default-handle
         */
        function validateJSON(json) {
            // TODO build this out to be more comprehensive
            return Array.isArray(json);
        }

        /**
         * @name resetPanel
         * @desc reset the panel information
         * @returns {void}
         */
        function resetPanel() {
            // TODO all these if/else are so ugly...need to be cleaned up. it's a mess...
            // check to see if default-handle is being created with existing json
            if (
                scope.defaultHandle.handle &&
                scope.defaultHandle.handle !== 'param'
            ) {
                // grab the state it was last run
                // if (scope.widgetCtrl.getOptions('widgetOptions.' + scope.defaultHandle.handle + '.json')) {
                //     scope.defaultHandle.json = JSON.parse(angular.toJson(scope.widgetCtrl.getOptions('widgetOptions.' + scope.defaultHandle.handle + '.json'))); // angular to json so that it would strip out $$hashkey and object...
                // }

                if (
                    semossCoreService.utility.isEmpty(scope.defaultHandle.json)
                ) {
                    scope.defaultHandle.json =
                        semossCoreService.getSpecificConfig(
                            scope.defaultHandle.handle,
                            'content.json'
                        );
                }
                scope.defaultHandle.showJSON = false;
            } else if (scope.widgetCtrl.getWidget('view.param.options.json')) {
                // only used for explore an instance now...changed how we do a 'param' insight (below else/if)
                if (scope.widgetCtrl.getOptions('widgetOptions.param.json')) {
                    scope.defaultHandle.json = JSON.parse(
                        angular.toJson(
                            scope.widgetCtrl.getOptions(
                                'widgetOptions.param.json'
                            )
                        )
                    ); // angular to json so that it would strip out $$hashkey and object...
                } else {
                    scope.defaultHandle.json = scope.widgetCtrl.getWidget(
                        'view.param.options.json'
                    );
                }
                scope.defaultHandle.showJSON = false;
            } else if (
                scope.defaultHandle.handle === 'param' &&
                scope.widgetCtrl.getWidget('view.default-handle.options.json')
            ) {
                scope.defaultHandle.json = scope.widgetCtrl.getWidget(
                    'view.default-handle.options.json'
                );
                scope.defaultHandle.showJSON = false;
            } else if (
                scope.widgetCtrl.getWidget('active') === 'default-handle' &&
                scope.widgetCtrl.getWidget(
                    'view.default-handle.options.json'
                ) &&
                (scope.widgetCtrl.getHandle('selected') !== 'default-handle' ||
                    scope.widgetCtrl.getWidget(
                        'view.default-handle.options.param'
                    ))
            ) {
                // the panel view is set to default-handle and there is a json passed into it...so we will load that
                scope.defaultHandle.json = scope.widgetCtrl.getWidget(
                    'view.default-handle.options.json'
                );
                scope.defaultHandle.showJSON = false;
            } else {
                if (
                    scope.widgetCtrl.getOptions(
                        'widgetOptions.default-handle'
                    ) &&
                    scope.widgetCtrl.getOptions(
                        'widgetOptions.default-handle.json'
                    )
                ) {
                    scope.defaultHandle.json = JSON.parse(
                        angular.toJson(
                            scope.widgetCtrl.getOptions(
                                'widgetOptions.default-handle.json'
                            )
                        )
                    ); // angular to json so that it would strip out $$hashkey and object...
                }

                scope.defaultHandle.showJSON = true;
                if (
                    scope.defaultHandle.json &&
                    scope.defaultHandle.json.length > 0
                ) {
                    scope.defaultHandle.freeTextInput = JSON.stringify(
                        scope.defaultHandle.json
                    );
                    previewJSONInput();
                }
            }

            if (typeof scope.defaultHandle.json === 'string') {
                scope.defaultHandle.originalJSON = JSON.stringify(
                    scope.defaultHandle.json
                );
            } else {
                scope.defaultHandle.originalJSON =
                    semossCoreService.utility.freeze(scope.defaultHandle.json);
            }
        }

        /**
         * @name initialize
         * @desc initializing this directive
         * @returns {void}
         */
        function initialize() {
            // cleanup
            scope.$on('$destroy', function () {
                viewUpdateListener();
            });

            viewUpdateListener = scope.widgetCtrl.on('update-view', resetPanel);

            if (!scope.widgetCtrl.handle) {
                if (
                    scope.widgetCtrl.getWidget(
                        'view.default-handle.options.param'
                    )
                ) {
                    scope.widgetCtrl.handle = 'param';
                }
            }
            resetPanel();
        }

        initialize();
    }
}
