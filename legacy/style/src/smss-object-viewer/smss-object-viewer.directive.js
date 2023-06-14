/**
 * @name smss-object-viewer.directive.js
 * @desc smss-object-viewer field
 */
export default angular
    .module('smss-style.object-viewer', [])
    .directive('smssObjectViewer', smssObjectViewer);

import './smss-object-viewer.scss';

smssObjectViewer.$inject = ['$compile'];

function smssObjectViewer($compile) {
    smssObjectViewerLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-object-viewer.directive.html'),
        scope: {
            model: '=',
        },
        replace: true,
        link: smssObjectViewerLink,
    };

    function smssObjectViewerLink(scope, ele, attrs) {
        var smssObjectViewerContentEle;

        scope.paths = {};

        /**
         * @name renderJSON
         * @desc called to render the JSON
         * @returns {void}
         */
        function renderJSON() {
            var jsonHTML, jsonEle;

            // remove all the children
            while (smssObjectViewerContentEle.firstChild) {
                smssObjectViewerContentEle.removeChild(
                    smssObjectViewerContentEle.firstChild
                );
            }

            // clear out the paths
            scope.paths = {};

            // create a new element (and make sure it is a root)
            jsonHTML = '<div>' + generateHTML(scope.model) + '</div>';
            jsonEle = $compile(jsonHTML)(scope)[0];

            // add it
            smssObjectViewerContentEle.appendChild(jsonEle);
        }

        /**
         * @name generateHTML
         * @desc called to generate the HTML
         * @param {*} current - current level to render
         * @param {number} path - path of the level that you are rendering
         * @returns {html} html to render
         */
        function generateHTML(current, path) {
            var html = '',
                isArray,
                keys,
                idx,
                len,
                newPath;

            if (!path) {
                // eslint-disable-next-line no-param-reassign
                path = 'root';
            }

            if (current === undefined || current === null) {
                html = String(current);
            } else if (typeof current === 'object') {
                isArray = Array.isArray(current);
                keys = Object.keys(current);

                // this is for the toggle
                scope.paths[path] = true;

                html = '';
                html += '<span class="smss-object-viewer__seperator">';
                html += isArray ? '[' : '{';
                html += '</span>';

                if (keys.length > 0) {
                    html +=
                        '<span class="smss-object-viewer__expand" ng-hide="paths[\'' +
                        path +
                        '\']" ng-click="paths[\'' +
                        path +
                        '\'] = true">...</span>';
                    html +=
                        '<div class="smss-object-viewer__level" ng-show="paths[\'' +
                        path +
                        '\']">';
                    html +=
                        '<div class="smss-object-viewer__level__collapse" ng-click="paths[\'' +
                        path +
                        '\'] = false"></div>';
                    for (idx = 0, len = keys.length - 1; idx <= len; idx++) {
                        newPath = path + '.' + keys[idx];

                        html +=
                            '<div class="smss-object-viewer__level__inner">';
                        html +=
                            (isArray
                                ? ''
                                : '<span class="smss-object-viewer__level__key">"' +
                                  String(keys[idx]) +
                                  '"</span> : ') +
                            generateHTML(current[keys[idx]], newPath);
                        if (idx < len) {
                            html += ',';
                        }
                        html += '</div>';
                    }
                    html += '</div>';
                } else {
                    html += ' ';
                }

                html += '<span class="smss-object-viewer__seperator">';
                html += isArray ? ']' : '}';
                html += '</span>';
            } else if (typeof current === 'string') {
                html = '"' + current + '"';
            } else {
                html = String(current);
            }
            return html;
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            smssObjectViewerContentEle = ele[0].querySelector(
                '#smss-object-viewer__content'
            );

            scope.$watch('model', function (newValue, oldValue) {
                if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                    renderJSON();
                }
            });

            renderJSON();
        }

        initialize();
    }
}
