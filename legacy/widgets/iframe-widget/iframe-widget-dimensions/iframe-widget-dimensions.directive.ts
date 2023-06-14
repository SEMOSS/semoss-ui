'use strict';

import angular from 'angular';

import './iframe-widget-dimensions.scss';

import {
    IframeWidgetOptions,
    IFRAME_WIDGET_DEFAULT_OPTIONS,
} from '../iframe-widget.directive';

export default angular
    .module('app.iframe-widget.iframe-widget-dimensions', [])
    .directive('iframeWidgetDimensions', iframeWidgetDimensionsDirective);

iframeWidgetDimensionsDirective.$inject = [];

function iframeWidgetDimensionsDirective() {
    iframeWidgetDimensionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget', '^view'],
        controllerAs: 'iframeWidgetDimensions',
        bindToController: {},
        template: require('./iframe-widget-dimensions.directive.html'),
        controller: iframeWidgetDimensionsCtrl,
        link: iframeWidgetDimensionsLink,
    };

    function iframeWidgetDimensionsCtrl() {}

    function iframeWidgetDimensionsLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];
        scope.viewCtrl = ctrl[2];

        scope.iframeWidgetDimensions.updateOptions = updateOptions;

        /**
         * @name resetDimensions
         * @desc create the initial options
         */
        function resetOptions(): void {
            let options: IframeWidgetOptions =
                scope.widgetCtrl.getWidget('view.iframe-widget.options') || {};

            // merge with the defaults
            options = angular.merge({}, IFRAME_WIDGET_DEFAULT_OPTIONS, options);

            // update the options
            scope.iframeWidgetDimensions.options = options;
        }

        /**
         * @name updateOptions
         * @desc update the options
         */
        function updateOptions(): void {
            const components: PixelCommand[] = [];

            const options: IframeWidgetOptions = {
                url: scope.iframeWidgetDimensions.options.url,
            };

            components.push(
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: ['iframe-widget', options],
                    terminal: true,
                }
            );

            if (components.length > 1) {
                scope.insightCtrl.execute(components);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            // append listeners
            const updateViewListener = scope.insightCtrl.on(
                'update-view',
                resetOptions
            );

            scope.$on('view--active-updated', resetOptions);

            scope.$on('$destroy', () => {
                updateViewListener();
            });

            // this will auto update the view as well
            resetOptions();
        }

        initialize();
    }
}
