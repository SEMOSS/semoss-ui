import angular from 'angular';
import { marked } from 'marked';

function markedProvider() {
    const self = this;

    /**
     * @ngdoc method
     * @name markedProvider#setRenderer
     * @methodOf hc.marked.service:markedProvider
     *
     * @param {object} opts Default renderer options for [marked](https://github.com/chjj/marked#overriding-renderer-methods).
     */

    self.setRenderer = function (opts) {
        this.renderer = opts;
    };

    /**
     * @ngdoc method
     * @name markedProvider#setOptions
     * @methodOf hc.marked.service:markedProvider
     *
     * @param {object} opts Default options for [marked](https://github.com/chjj/marked#options-1).
     */

    self.setOptions = function (opts) {
        // Store options for later
        this.defaults = opts;
    };

    self.$get = [
        '$log',
        '$window',
        function ($log, $window) {
            let m;

            try {
                m = require('marked');
            } catch (err) {
                m = $window.marked || marked;
            }

            if (angular.isUndefined(m)) {
                $log.error(
                    'angular-marked Error: marked not loaded.  See installation instructions.'
                );
                return;
            }

            const r = new m.Renderer();

            // override rendered markdown html
            // with custom definitions if defined
            if (self.renderer) {
                const o = Object.keys(self.renderer);
                let l = o.length;

                while (l--) {
                    r[o[l]] = self.renderer[o[l]];
                }
            }

            // Customize code and codespan rendering to wrap default or overriden output in a ng-non-bindable span
            function wrapNonBindable(string) {
                return '<span ng-non-bindable>' + string + '</span>';
            }

            const renderCode = r.code.bind(r);
            r.code = function (code, lang, escaped) {
                return wrapNonBindable(renderCode(code, lang, escaped));
            };
            const renderCodespan = r.codespan.bind(r);
            r.codespan = function (code) {
                return wrapNonBindable(renderCodespan(code));
            };

            // add the new renderer to the options if need be
            self.defaults = self.defaults || {};
            self.defaults.renderer = r;

            m.setOptions(self.defaults);

            return m;
        },
    ];
}

export default angular
    .module('app.markdown.directive', [])
    .directive('marked', markedDirective)
    .provider('marked', markedProvider).name;

markedDirective.$inject = ['marked', '$templateRequest', '$compile'];
function markedDirective(marked, $templateRequest, $compile) {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            opts: '=',
            marked: '=',
            compile: '@',
            src: '=',
        },
        link: function (scope, element, attrs) {
            if (attrs.marked) {
                set(scope.marked);
                scope.$watch('marked', set);
            } else if (attrs.src) {
                scope.$watch('src', function (src) {
                    $templateRequest(src, true).then(
                        function (response) {
                            set(response);
                        },
                        function () {
                            set('');
                            scope.$emit('$markedIncludeError', attrs.src);
                        }
                    );
                });
            } else {
                set(element.text());
            }

            function unindent(text) {
                if (!text) {
                    return text;
                }

                const lines = text.replace(/\t/g, '  ').split(/\r?\n/);

                let min = null;
                const len = lines.length;
                let i;

                for (i = 0; i < len; i++) {
                    const line = lines[i];
                    const l = line.match(/^(\s*)/)[0].length;
                    if (l === line.length) {
                        continue;
                    }
                    min = l < min || min === null ? l : min;
                }

                if (min !== null && min > 0) {
                    for (i = 0; i < len; i++) {
                        lines[i] = lines[i].substr(min);
                    }
                }
                return lines.join('\n');
            }

            function set(text) {
                text = unindent(String(text || ''));
                element.html(marked.marked(text, scope.opts || null));
                if (scope.$eval(attrs.compile)) {
                    $compile(element.contents())(scope.$parent);
                }
            }
        },
    };
}
