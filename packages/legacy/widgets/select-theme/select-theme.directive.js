'use strict';

import './select-theme.scss';

export default angular
    .module('app.select-theme.directive', [])
    .directive('selectTheme', selectThemeDirective);

selectThemeDirective.$inject = ['semossCoreService'];

function selectThemeDirective(semossCoreService) {
    selectThemeCtrl.$inject = [];
    selectThemeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight'],
        controllerAs: 'selectTheme',
        bindToController: {},
        template: require('./select-theme.directive.html'),
        controller: selectThemeCtrl,
        link: selectThemeLink,
    };

    function selectThemeCtrl() {}

    function selectThemeLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        scope.selectTheme.themes = [
            {
                name: 'Cream',
                json: require('./themes/Cream.json'),
                image: require('./themes/Cream.png'),
            },
            {
                name: 'Vibrant',
                json: require('./themes/Vibrant.json'),
                image: require('./themes/Vibrant.png'),
            },
            {
                name: 'Constellation',
                json: require('./themes/Constellation.json'),
                image: require('./themes/Constellation.png'),
            },
            {
                name: 'Tokyo',
                json: require('./themes/Tokyo.json'),
                image: require('./themes/Tokyo.png'),
            },
        ];
        scope.selectTheme.selected = '';

        scope.selectTheme.selectTheme = selectTheme;
        scope.selectTheme.reset = reset;

        /**
         * @name reset
         * @desc resets the theme to the default semoss theme
         * @returns {void}
         */
        function reset() {
            scope.selectTheme.selected = '';

            const config = semossCoreService.workspace.saveWorkspace(
                    scope.insightCtrl.insightID
                ),
                callback = function (response) {
                    const type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    scope.insightCtrl.alert(
                        'success',
                        'Theme was reset to the default.'
                    );
                };

            if (config && Object.keys(config).length !== 0) {
                scope.insightCtrl.execute(
                    [
                        {
                            type: 'Pixel',
                            components: [
                                `META | SetInsightConfig(${JSON.stringify(
                                    config
                                )});`,
                            ],
                            terminal: true,
                        },
                    ],
                    function () {
                        scope.insightCtrl.execute(
                            [
                                {
                                    type: 'Pixel',
                                    components: ['META | SetInsightTheme({});'],
                                    terminal: true,
                                },
                            ],
                            callback
                        );
                    }
                );
            }
        }

        /**
         * @name selectTheme
         * @desc updates the selected theme
         * @param {object} theme the selected theme to set
         * @returns {void}
         */
        function selectTheme(theme) {
            if (theme && theme.json) {
                scope.selectTheme.selected = theme.name;

                const config = semossCoreService.workspace.saveWorkspace(
                        scope.insightCtrl.insightID
                    ),
                    callback = function (response) {
                        const type = response.pixelReturn[0].operationType;
                        if (type.indexOf('ERROR') > -1) {
                            scope.insightCtrl.alert(
                                'error',
                                'There was an error when setting the theme. Please try again.'
                            );
                            return;
                        }
                        scope.insightCtrl.alert(
                            'success',
                            'Successfully set theme.'
                        );
                    };

                if (config && Object.keys(config).length !== 0) {
                    scope.insightCtrl.execute(
                        [
                            {
                                type: 'Pixel',
                                components: [
                                    `META | SetInsightConfig(${JSON.stringify(
                                        config
                                    )});`,
                                ],
                                terminal: true,
                            },
                        ],
                        function () {
                            scope.insightCtrl.execute(
                                [
                                    {
                                        type: 'Pixel',
                                        components: [
                                            `META | SetInsightTheme(${JSON.stringify(
                                                theme.json
                                            )})`,
                                        ],
                                        terminal: true,
                                    },
                                ],
                                callback
                            );
                        }
                    );
                } else {
                    scope.insightCtrl.alert(
                        'error',
                        'There was an error when setting the theme. Please try again.'
                    );
                }
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            let theme = scope.insightCtrl.getShared('theme');
            if (theme && theme.themeName) {
                scope.selectTheme.selected =
                    theme.themeName === 'Default' ? '' : theme.themeName;
            }
        }

        initialize();
    }
}
