'use strict';

export default angular
    .module('app.export-svg.directive', [])
    .directive('exportSvg', exportSvg);

exportSvg.$inject = ['$window', '$timeout'];

function exportSvg($window, $timeout) {
    exportSvgCtrl.$inject = [];
    exportSvgLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'exportSvg',
        bindToController: {},
        controller: exportSvgCtrl,
        link: exportSvgLink,
    };

    function exportSvgCtrl() {}

    function exportSvgLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // Original Save SVG code
        var doctype =
                '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
            body = document.body,
            emptySvg,
            prefix = {
                xmlns: 'http://www.w3.org/2000/xmlns/',
                xlink: 'http://www.w3.org/1999/xlink',
                svg: 'http://www.w3.org/2000/svg',
            };

        $window.URL = $window.URL || $window.webkitURL;

        /**
         * @name getSources
         * @desc scans the canvas to get the svg to paint
         * @returns {string} svg information
         */
        function getSources() {
            var svgInfo = [],
                svgs = [],
                source,
                rect,
                allWidgetEles,
                widgetEleIdx,
                widgetEleLen,
                chartEle;

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
                        svgs = [chartEle.getElementsByTagName('svg')[0]];
                        break;
                    }
                }
            }

            if (!svgs[0]) {
                scope.widgetCtrl.emit('hidden-widget-destroy');
                scope.widgetCtrl.emit('stop-loading', {
                    id: false,
                });
                scope.widgetCtrl.alert(
                    'warn',
                    'Cannot Download SVG : No SVG Exists'
                );
                return svgInfo;
            }

            [].forEach.call(svgs, function (svg) {
                svg.setAttribute('version', '1.1');

                // removing attributes so they aren't doubled up
                svg.removeAttribute('xmlns');
                svg.removeAttribute('xlink');

                // These are needed for the svg
                if (!svg.hasAttributeNS(prefix.xmlns, 'xmlns')) {
                    svg.setAttributeNS(prefix.xmlns, 'xmlns', prefix.svg);
                }

                if (!svg.hasAttributeNS(prefix.xmlns, 'xmlns:xlink')) {
                    svg.setAttributeNS(
                        prefix.xmlns,
                        'xmlns:xlink',
                        prefix.xlink
                    );
                }

                source = new XMLSerializer().serializeToString(svg);
                rect = svg.getBoundingClientRect();

                svgInfo.push({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    class: svg.getAttribute('class'),
                    id: svg.getAttribute('id'),
                    childElementCount: svg.childElementCount,
                    source: [doctype + source],
                });
            });
            return svgInfo;
        }

        /**
         * @name download
         * @desc actually downloads the svg
         * @param {string} source - html text
         * @returns {void}
         */
        function download(source) {
            var url = $window.URL.createObjectURL(
                    new Blob(source.source, {
                        type: 'text/xml',
                    })
                ),
                a = document.createElement('a');

            body.appendChild(a);
            a.setAttribute('download', 'semoss' + '.svg');
            a.setAttribute('href', url);
            a.style.display = 'none';
            a.click();

            $timeout(function () {
                $window.URL.revokeObjectURL(url);
                scope.widgetCtrl.emit('hidden-widget-destroy');
                scope.widgetCtrl.emit('stop-loading', {
                    id: false,
                });
            }, 10);
        }

        /**
         * @name initialize
         * @desc intialize the module
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.emit('start-loading', {
                id: false,
                messageList: ['Capturing Image'],
            });

            var documents = [$window.document],
                SVGSources = [],
                iframes = document.querySelectorAll('iframe'),
                objects = document.querySelectorAll('object');

            // add empty svg element
            emptySvg = $window.document.createElementNS(prefix.svg, 'svg');
            $window.document.body.appendChild(emptySvg);

            [].forEach.call(iframes, function (el) {
                try {
                    if (el.contentDocument) {
                        documents.push(el.contentDocument);
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            [].forEach.call(objects, function (el) {
                try {
                    if (el.contentDocument) {
                        documents.push(el.contentDocument);
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            documents.forEach(function () {
                var newSources = getSources(),
                    i,
                    len;
                // because of prototype on NYT pages
                for (i = 0, len = newSources.length; i < len; i++) {
                    SVGSources.push(newSources[i]);
                }
            });
            if (SVGSources.length > 0) {
                download(SVGSources[0]);
            } else {
                scope.widgetCtrl.emit('hidden-widget-destroy');
                scope.widgetCtrl.emit('stop-loading', {
                    id: false,
                });
                scope.widgetCtrl.alert(
                    'warn',
                    'Cannot Download SVG : No SVG Found'
                );
            }
        }

        initialize();
    }
}
