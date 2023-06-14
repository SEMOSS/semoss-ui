'use strict';

import * as domtoimage from '@/widget-resources/js/dom-to-image/dom-to-image.min.js';

export default angular
    .module('app.export-jpeg.directive', [])
    .directive('exportJpeg', exportJpegDirective);

exportJpegDirective.$inject = ['$timeout'];

function exportJpegDirective($timeout) {
    exportJpegCtrl.$inject = [];
    exportJpegLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: exportJpegLink,
        controller: exportJpegCtrl,
        controllerAs: 'exportJpeg',
        bindToController: {},
    };

    function exportJpegCtrl() {}

    function exportJpegLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        function saveJpeg() {
            var allWidgetEles, widgetEleIdx, widgetEleLen, chartEle;

            scope.widgetCtrl.emit('start-loading', {
                id: false,
                message: 'Capturing Image',
            });

            allWidgetEles = [].slice.call(
                document.querySelectorAll(
                    '[widget-id="' + scope.widgetCtrl.widgetId + '"]'
                )
            );
            for (
                widgetEleIdx = 0, widgetEleLen = allWidgetEles.length;
                widgetEleIdx < widgetEleLen;
                widgetEleIdx++
            ) {
                if (allWidgetEles[widgetEleIdx].querySelector('widget-view')) {
                    chartEle = allWidgetEles[widgetEleIdx]
                        .querySelector('widget-view')
                        .querySelector('#chart-container');
                    if (chartEle) {
                        break;
                    }
                }
            }

            if (chartEle) {
                // TODO extend to viva graph
                domtoimage
                    .toJpeg(chartEle, {
                        quality: 0.95,
                        bgcolor: 'white',
                    })
                    .then(function (dataUrl) {
                        $timeout(function () {
                            var link = document.createElement('a');
                            link.download = 'semoss-img.jpeg';
                            link.href = dataUrl;
                            link.click();

                            scope.widgetCtrl.emit('hidden-widget-destroy');
                            scope.widgetCtrl.emit('stop-loading', {
                                id: false,
                            });
                        }, 10);
                    });
            } else {
                scope.widgetCtrl.emit('hidden-widget-destroy');
                scope.widgetCtrl.emit('stop-loading', {
                    id: false,
                });
                scope.widgetCtrl.alert(
                    'warn',
                    'Cannot Download JPEG: No Chart Found'
                );
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            saveJpeg();
        }

        initialize();
    }
}
