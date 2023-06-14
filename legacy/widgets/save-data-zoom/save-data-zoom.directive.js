'use strict';
export default angular
    .module('app.save-data-zoom.directive', [])
    .directive('saveDataZoom', saveDataZoomDirective);

saveDataZoomDirective.$inject = ['optionsService'];

function saveDataZoomDirective(optionsService) {
    saveDataZoomCtrl.$inject = [];
    saveDataZoomLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'saveDataZoom',
        bindToController: {},
        controller: saveDataZoomCtrl,
        link: saveDataZoomLink,
    };

    function saveDataZoomCtrl() {}

    function saveDataZoomLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let pixel = '';
            const saveDataZoom = optionsService.get(
                scope.widgetCtrl.widgetId,
                'saveDataZoom'
            );
            if (saveDataZoom) {
                pixel +=
                    'Panel(' +
                    scope.widgetCtrl.panelId +
                    ')|AddPanelOrnaments({"tools":{"shared":{"saveDataZoom":' +
                    JSON.stringify(saveDataZoom) +
                    '}}});Panel(' +
                    scope.widgetCtrl.panelId +
                    ')|RetrievePanelOrnaments("tools.shared.saveDataZoom");';
            }
            if (pixel) {
                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        },
                    ],
                    (response) => {
                        const type = response.pixelReturn[0].operationType;
                        if (type.indexOf('ERROR') !== -1) {
                            scope.widgetCtrl.alert(
                                'error',
                                'Failed to save data zoom'
                            );
                        } else {
                            scope.widgetCtrl.alert(
                                'success',
                                'Successfully saved data zoom.'
                            );
                        }
                    }
                );
            } else {
                scope.widgetCtrl.alert(
                    'error',
                    'Data Zoom has not been changed.'
                );
            }
        }
        initialize();
    }
}
