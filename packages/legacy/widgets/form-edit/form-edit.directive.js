'use strict';

export default angular
    .module('app.form-edit.directive', [])
    .directive('formEdit', formEdit);

formEdit.$inject = [];

function formEdit() {
    formEditLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: formEditLink,
    };

    function formEditLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // Set shared state variables
            const panelId = scope.widgetCtrl.getWidget('panelId'),
                json = scope.widgetCtrl.getWidget(
                    'view.form-builder.options.json'
                );

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [String(panelId)],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'builder',
                        {
                            json: json,
                        },
                    ],
                    terminal: true,
                },
            ]);

            scope.widgetCtrl.emit('hidden-widget-destroy');
        }

        initialize();
    }
}
