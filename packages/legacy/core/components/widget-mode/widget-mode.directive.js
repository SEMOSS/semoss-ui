export default angular
    .module('app.widget-mode.directive', [])
    .directive('widgetMode', widgetModeDirective);

widgetModeDirective.$inject = ['semossCoreService', '$timeout'];

import './widget-mode.scss';

/**
 * @name widgetModeDirective
 * @desc serves as API for all visualizations within SEMOSS
 * @param {function} semossCoreService -
 * @param {function} $timeout -
 * @returns {void}
 */
function widgetModeDirective(semossCoreService, $timeout) {
    widgetModeCtrl.$inject = [];
    widgetModeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        bindToController: {},
        controller: widgetModeCtrl,
        link: widgetModeLink,
        controllerAs: 'widgetMode',
        template: require('./widget-mode.directive.html'),
    };

    function widgetModeCtrl() {}

    function widgetModeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var modeListener, hiddenWidgetDestroyListener;

        scope.widgetMode.availableModes = [];
        scope.widgetMode.tools = [];
        scope.widgetMode.isMenuOpen = false;
        scope.widgetMode.selectedModeConfig = {};
        scope.widgetMode.hiddenWidgetContent = '';

        // Set controller functions
        scope.widgetMode.setMode = setMode;
        scope.widgetMode.loadWidget = loadWidget;

        /**
         * @name setMode
         * @param {string} newMode - new mode to set
         * @desc sets the mode of the widget
         */

        function setMode(newMode) {
            scope.widgetCtrl.emit('change-mode', {
                mode: newMode,
            });
        }

        /**
         * @name loadWidget
         * @desc loads the selected widget
         * @param {String} widget the widget being loaded
         * @returns {void}
         */
        function loadWidget(widget) {
            var config = semossCoreService.getSpecificConfig(widget);
            if (widget === 'additional-tools') {
                scope.widgetCtrl.open('widget-tab', 'view');

                // TODO: remove the timeout
                // need to wait for handle to be open
                // this time is reliable and user can't notice .125 second
                $timeout(function () {
                    scope.widgetCtrl.emit('open-tools');
                }, 125);
            } else if (
                (config.content &&
                    config.content.json &&
                    config.content.json[0].execute === 'auto') ||
                (config.content &&
                    config.content.template &&
                    config.content.template.execute === 'auto')
            ) {
                scope.widgetMode.hiddenWidgetContent = '';
                semossCoreService
                    .loadWidget(widget, 'content')
                    .then(function (html) {
                        $timeout(function () {
                            scope.widgetMode.hiddenWidgetContent = html;
                        });
                    });
            } else {
                scope.widgetCtrl.open('handle', widget);
            }
        }

        /**
         * @name initialize
         * @desc function that is triggered when the data is loaded
         * @returns {void}
         */

        function initialize() {
            modeListener = scope.widgetCtrl.on('update-mode', function () {
                var state = scope.widgetCtrl.getMode(),
                    modes = semossCoreService.getModeConfig(),
                    active = scope.widgetCtrl.getWidget('active'),
                    layout = scope.widgetCtrl.getWidget(
                        'view.' + active + '.layout'
                    ),
                    type = scope.widgetCtrl.getWidget(
                        'view.' + active + '.options.type'
                    ),
                    viz = semossCoreService.getActiveVisualizationId(
                        layout,
                        type
                    ),
                    vizConfig = semossCoreService.getSpecificConfig(viz);

                if (layout === 'Grid') {
                    scope.widgetMode.hideMenu = true;
                } else {
                    scope.widgetMode.hideMenu = false;
                }

                scope.widgetMode.availableModes = state.available;
                if (vizConfig.widgetList && vizConfig.widgetList.quickMenu) {
                    scope.widgetMode.tools = vizConfig.widgetList.quickMenu.map(
                        function (tool) {
                            var toolConfig =
                                semossCoreService.getSpecificConfig(tool);

                            return {
                                name: toolConfig.name,
                                id: toolConfig.id,
                                icon: toolConfig.icon,
                            };
                        }
                    );
                }
                scope.widgetMode.selectedModeConfig = modes[state.selected];
            });

            hiddenWidgetDestroyListener = scope.widgetCtrl.on(
                'hidden-widget-destroy',
                function () {
                    scope.widgetMode.hiddenWidgetContent = null;
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying mode....');
                modeListener();
                hiddenWidgetDestroyListener();
            });

            // reset when called
            scope.widgetCtrl.emit('reset-mode', {
                widgetId: scope.widgetCtrl.widgetId,
            });
        }

        initialize();
    }
}
