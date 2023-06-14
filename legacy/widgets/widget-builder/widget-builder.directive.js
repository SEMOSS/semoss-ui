'use strict';

import './widget-builder.scss';

export default angular
    .module('app.widget-builder.directive', [])
    .directive('widgetBuilder', widgetBuilderDirective);

widgetBuilderDirective.$inject = ['semossCoreService'];

function widgetBuilderDirective(semossCoreService) {
    widgetBuilderCtrl.$inject = [];
    widgetBuilderLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        template: require('./widget-builder.directive.html'),
        controller: widgetBuilderCtrl,
        link: widgetBuilderLink,
        scope: {},
        bindToController: {
            handle: '@?',
            json: '@?',
        },
        controllerAs: 'widgetBuilder',
        replace: true,
    };

    function widgetBuilderCtrl() {}

    function widgetBuilderLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var viewUpdateListener;

        /* TODO lets go through and clean this a little bit...things like widgetBuilder.originalJSON might not even be needed. Take a look at the logic for getting checked values from currentWidget.json as well...*/
        // ===========FUNCTIONS=======================
        scope.widgetBuilder.previewJSONInput = previewJSONInput;
        scope.widgetBuilder.addJSON = addJSON;
        scope.widgetBuilder.editJSON = editJSON;
        scope.widgetBuilder.initialize = initialize;

        scope.widgetBuilder.showJSON = true;
        scope.widgetBuilder.freeTextInput = '';

        /**
         * @name previewJSONInput
         * @desc view of the json
         * @returns {void}
         */
        function previewJSONInput() {
            try {
                scope.widgetBuilder.json = JSON.parse(
                    scope.widgetBuilder.freeTextInput
                );
                // validate the json is in [] format
                if (!validateJSON(scope.widgetBuilder.json)) {
                    scope.widgetBuilder.json = [];
                    scope.widgetCtrl.alert(
                        'error',
                        'JSON format is incorrect.'
                    );
                    return;
                }

                // save to currentWidget's json so we can grab it later for use
                scope.widgetCtrl.setWidgetState(
                    scope.widgetBuilder.handle,
                    'json',
                    JSON.parse(JSON.stringify(scope.widgetBuilder.json))
                );
            } catch (error) {
                scope.widgetCtrl.alert('error', error.message);
                return;
            }

            scope.widgetBuilder.showJSON = false;
        }

        /**
         * @name addJSON
         * @desc add the json to the current panel
         * @returns {void}
         */
        function addJSON() {
            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        `Panel(${scope.widgetCtrl.panelId}) | SetPanelView("widget-builder", "<encode>{ "param": true, "json":${scope.widgetBuilder.freeTextInput}}</encode>");`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name editJSON
         * @desc modify the JSON
         * @returns {void}
         */
        function editJSON() {
            scope.widgetBuilder.showJSON = true;
            if (scope.widgetBuilder.json) {
                scope.widgetBuilder.freeTextInput = JSON.stringify(
                    scope.widgetBuilder.json,
                    null,
                    4
                );
            }
        }

        /**
         * @name validateJSON
         * @param {Object} json the json to check to see if its valid
         * @desc validates that the json is formatted correctly
         * @returns {Boolean} whether this json is a valid json as a widget-builder
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
            // check to see if widget-builder is being created with existing json
            if (
                scope.widgetBuilder.handle &&
                scope.widgetBuilder.handle !== 'param'
            ) {
                // grab the state it was last run
                // if (scope.widgetCtrl.getOptions('widgetOptions.' + scope.widgetBuilder.handle + '.json')) {
                //     scope.widgetBuilder.json = JSON.parse(angular.toJson(scope.widgetCtrl.getOptions('widgetOptions.' + scope.widgetBuilder.handle + '.json'))); // angular to json so that it would strip out $$hashkey and object...
                // }

                if (
                    semossCoreService.utility.isEmpty(scope.widgetBuilder.json)
                ) {
                    scope.widgetBuilder.json =
                        semossCoreService.getSpecificConfig(
                            scope.widgetBuilder.handle,
                            'content.json'
                        );
                }
                scope.widgetBuilder.showJSON = false;
            } else if (scope.widgetCtrl.getWidget('view.param.options.json')) {
                // only used for explore an instance now...changed how we do a 'param' insight (below else/if)
                if (scope.widgetCtrl.getOptions('widgetOptions.param.json')) {
                    scope.widgetBuilder.json = JSON.parse(
                        angular.toJson(
                            scope.widgetCtrl.getOptions(
                                'widgetOptions.param.json'
                            )
                        )
                    ); // angular to json so that it would strip out $$hashkey and object...
                } else {
                    scope.widgetBuilder.json = scope.widgetCtrl.getWidget(
                        'view.param.options.json'
                    );
                }
                scope.widgetBuilder.showJSON = false;
            } else if (
                scope.widgetBuilder.handle === 'param' &&
                scope.widgetCtrl.getWidget('view.widget-builder.options.json')
            ) {
                scope.widgetBuilder.json = scope.widgetCtrl.getWidget(
                    'view.widget-builder.options.json'
                );
                scope.widgetBuilder.showJSON = false;
            } else if (
                scope.widgetCtrl.getWidget('active') === 'widget-builder' &&
                scope.widgetCtrl.getWidget(
                    'view.widget-builder.options.json'
                ) &&
                (scope.widgetCtrl.getHandle('selected') !== 'widget-builder' ||
                    scope.widgetCtrl.getWidget(
                        'view.widget-builder.options.param'
                    ))
            ) {
                // the panel view is set to widget-builder and there is a json passed into it...so we will load that
                scope.widgetBuilder.json = scope.widgetCtrl.getWidget(
                    'view.widget-builder.options.json'
                );
                scope.widgetBuilder.showJSON = false;
            } else {
                if (
                    scope.widgetCtrl.getOptions(
                        'widgetOptions.widget-builder'
                    ) &&
                    scope.widgetCtrl.getOptions(
                        'widgetOptions.widget-builder.json'
                    )
                ) {
                    scope.widgetBuilder.json = JSON.parse(
                        angular.toJson(
                            scope.widgetCtrl.getOptions(
                                'widgetOptions.widget-builder.json'
                            )
                        )
                    ); // angular to json so that it would strip out $$hashkey and object...
                }

                scope.widgetBuilder.showJSON = true;
                if (
                    scope.widgetBuilder.json &&
                    scope.widgetBuilder.json.length > 0
                ) {
                    scope.widgetBuilder.freeTextInput = JSON.stringify(
                        scope.widgetBuilder.json
                    );
                    previewJSONInput();
                }
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
                        'view.widget-builder.options.param'
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
