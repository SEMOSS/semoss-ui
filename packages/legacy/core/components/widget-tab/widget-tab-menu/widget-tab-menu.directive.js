'use strict';

angular
    .module('app.widget-tab.widget-tab-menu', [])
    .directive('widgetTabMenu', widgetTabMenuDirective);

widgetTabMenuDirective.$inject = [];

function widgetTabMenuDirective() {
    widgetTabMenuCtrl.$inject = [];
    widgetTabMenuLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', 'widgetTab'],
        controller: widgetTabMenuCtrl,
        link: widgetTabMenuLink,
        bindToController: {},
        controllerAs: 'widgetTabMenu',
    };

    function widgetTabMenuCtrl() {}

    function widgetTabMenuLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.widgetTabCtrl = ctrl[1];

        scope.widgetTabMenu.widgets = [];
        /**
         * @name updateHandleList
         * @desc function called to update the displayed handles
         * @returns {void}
         */
        function updateHandleList() {
            let available = scope.widgetCtrl.getHandle('available'),
                visible = [],
                menu;

            for (let handle in available) {
                if (available.hasOwnProperty(handle)) {
                    if (available[handle].widgetList.hidden) {
                        continue;
                    }

                    visible.push(handle);
                }
            }

            if (
                scope.widgetTabMenu.widgets.length === 0 ||
                differentWidgets(visible)
            ) {
                scope.widgetTabMenu.widgets = visible;

                menu = [
                    {
                        name: 'Other Widgets',
                        widgets: visible,
                        height: 100,
                    },
                ];

                scope.widgetTabCtrl.setContent(menu);
            }
        }

        /**
         * @name differentWidgets
         * @param {array} widgets - the widgets
         * @desc determines id current visible widgets different than menu widgets
         * @return {boolean} true if different
         */
        function differentWidgets(widgets) {
            for (let i = 0; i < scope.widgetTabMenu.widgets.length; i++) {
                const widget = scope.widgetTabMenu.widgets[i];

                if (widgets[i] !== widget) {
                    return true;
                }
            }

            return false;
        }

        /**
         * @name updateHandle
         * @desc sets the selected handle
         * @returns {void}
         */
        function updateHandle() {
            let selectedHandle = scope.widgetCtrl.getHandle('selected');

            if (selectedHandle) {
                scope.widgetTabCtrl.addContent(0, selectedHandle);
            }
        }

        /**
         * @name initialize
         * @desc function called when the widgetMenu is initialized.
         * @returns {void}
         */
        function initialize() {
            let updateHandleListListener, updateHandleListener;

            updateHandleListListener = scope.widgetCtrl.on(
                'update-handle-list',
                updateHandleList
            );
            updateHandleListener = scope.widgetCtrl.on(
                'update-handle',
                updateHandle
            );

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying widgetTabMenu....');
                updateHandleListListener();
                updateHandleListener();
            });

            // update handles
            updateHandleList();
            updateHandle();
        }

        initialize();
    }
}
