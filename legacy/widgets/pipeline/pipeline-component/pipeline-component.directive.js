'use strict';

export default angular
    .module('app.pipeline.component', [])
    .directive('pipelineComponent', pipelineComponentDirective);

pipelineComponentDirective.$inject = ['$compile', 'semossCoreService'];

function pipelineComponentDirective($compile, semossCoreService) {
    pipelineComponentCtrl.$inject = [];
    pipelineComponentLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^pipeline'],
        controller: pipelineComponentCtrl,
        link: pipelineComponentLink,
        template: require('./pipeline-component.directive.html'),
        scope: {},
        bindToController: {
            key: '@',
        },
        controllerAs: 'pipelineComponent',
        replace: true,
    };

    function pipelineComponentCtrl() {}

    function pipelineComponentLink(scope, ele, attrs, ctrl) {
        var widgetCtrl = ctrl[0],
            pipelineCtrl = ctrl[1],
            childScope;

        /**
         * @name updateComponent
         * @desc update the component
         * @returns {void}
         */
        function updateComponent() {
            var content = semossCoreService.getSpecificConfig(
                scope.pipelineComponent.data.id,
                'content'
            );

            if (!content) {
                console.error(
                    'Cannnot find widget for ' + scope.pipelineComponent.data.id
                );
                scope.pipelineComponentCtrl.closeComponent();
                return;
            }

            if (content.hasOwnProperty('json')) {
                renderComponent('<pipeline-compiler></pipeline-compiler>');
                return;
            }

            widgetCtrl.emit('start-loading', {
                id: widgetCtrl.widgetId,
                message: 'Loading Component',
            });

            semossCoreService
                .loadWidget(scope.pipelineComponent.data.id, 'content')
                .then(function (html) {
                    renderComponent(html);

                    widgetCtrl.emit('stop-loading', {
                        id: widgetCtrl.widgetId,
                    });
                });
        }

        /**
         * @name renderComponent
         * @desc called to render the component
         * @param {string} content - content (html) to render
         * @returns {void}
         */
        function renderComponent(content) {
            // bootstrap the content b/c angular's digest messes things up
            if (childScope) {
                childScope.$destroy();
            }

            ele.html(content);

            childScope = scope.$new();

            $compile(ele.contents())(childScope);
        }

        /**
         * @name validateFrameName
         * @desc validates that the frame name doesn't already exist or contains special characters. Note: names are case insensitive
         * @param {string} name - the name entered by the user
         * @returns {*} {valid: valid, message: message} - returns if it is valid and the error message
         */
        function validateFrameName(name) {
            let message = '';

            if (!message) {
                if (!name) {
                    message = 'Frame name is required.';
                }
            }

            if (!message) {
                const frames = widgetCtrl.getShared('frames');
                if (frames) {
                    for (let frameName in frames) {
                        if (frameName.toUpperCase() === name.toUpperCase()) {
                            message = 'Frame name is not unique.';
                        }
                    }
                }
            }

            if (!message) {
                if (name.match(/[-\/\\^$*+?.()|[\]{}]/g)) {
                    message = 'Frame name must not contain special characters';
                }
            }

            return {
                valid: !message,
                message: message,
            };
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            scope.pipelineComponent.data =
                pipelineCtrl.data[scope.pipelineComponent.key];

            scope.pipelineComponent.getComponent =
                pipelineCtrl.getComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.getOtherComponent =
                pipelineCtrl.getComponent;
            scope.pipelineComponent.removeComponent =
                pipelineCtrl.removeComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.showComponent =
                pipelineCtrl.showComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.closeComponent =
                pipelineCtrl.closeComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.validateComponent =
                pipelineCtrl.validateComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.buildComponent =
                pipelineCtrl.buildComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.previewComponent =
                pipelineCtrl.previewComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.expandPreviewComponent =
                pipelineCtrl.expandPreviewComponent;
            scope.pipelineComponent.executeComponent =
                pipelineCtrl.executeComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.viewComponent =
                pipelineCtrl.viewComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.visualizeComponent =
                pipelineCtrl.visualizeComponent.bind(
                    null,
                    scope.pipelineComponent.key
                );
            scope.pipelineComponent.createFrameName =
                pipelineCtrl.createFrameName;
            scope.pipelineComponent.validateFrameName = validateFrameName;
            updateComponent();
        }

        initialize();
    }
}
