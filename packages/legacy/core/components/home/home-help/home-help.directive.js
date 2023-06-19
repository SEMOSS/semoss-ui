'use strict';

export default angular
    .module('app.home.home-help', [])
    .directive('homeHelp', homeHelpDirective);

import './home-help.scss';

homeHelpDirective.$inject = ['CONFIG', '$state', 'semossCoreService'];

function homeHelpDirective(CONFIG, $state, semossCoreService) {
    homeHelpCtrl.$inject = [];
    homeHelpLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./home-help.directive.html'),
        scope: {},
        controller: homeHelpCtrl,
        controllerAs: 'homeHelp',
        bindToController: {
            close: '&',
        },
        link: homeHelpLink,
    };

    function homeHelpCtrl() {}

    function homeHelpLink(scope) {
        scope.homeHelp.version = false;
        scope.homeHelp.action = action;
        scope.homeHelp.name = 'SEMOSS';
        scope.homeHelp.infoCards = [];

        /**
         * @name updateTheme
         * @desc called to update the theme
         * @returns {void}
         */
        function updateTheme() {
            let theme = semossCoreService.settings.get('active.theme');
            scope.homeHelp.name = theme.name;
            scope.homeHelp.helpDropdown = theme.helpDropdown;
            // dynamic description based on the name
            if (!scope.homeHelp.helpDropdown.contactUsDescription) {
                scope.homeHelp.helpDropdown.contactUsDescription = `We'd love to hear about your experience with ${scope.homeHelp.name}!`;
            }

            scope.homeHelp.infoCards = [
                // { TODO: add back in once we have content built out for this
                //     title: 'What is an Insight?',
                //     description: 'Learn how to create an insight that unfolds the stories behind the data',
                //     image: 'lightbulb-o',
                //     click: '101'
                // },
                {
                    title: `${scope.homeHelp.name} 101`,
                    description: `What ${scope.homeHelp.name} is and how to leverage it for intelligent business`,
                    image: 'logo',
                    click: '101',
                    color: 'blue',
                },
                {
                    title: 'Take a Tour',
                    description: `Walk through a step-by-step guide of ${scope.homeHelp.name}`,
                    image: 'map-signs',
                    click: 'tour',
                    color: 'orange',
                },
                // { TODO: add back in once we have content built out for this
                //     title: "What's New",
                //     description: `Stay up to date with the latest features of ${scope.homeHelp.name}`,
                //     image: 'newspaper-o',
                //     click: 'tour'
                // },
                {
                    title: 'Use Cases',
                    description: `Explore how ${scope.homeHelp.name} helps solve real-world business problems`,
                    image: 'briefcase',
                    click: 'uses',
                    color: 'purple',
                },
            ];
        }

        /**
         * @name action
         * @param {string} type - type of action to perform
         * @desc peformn an action based on the help optoins
         * @returns {void}
         */
        function action(type) {
            if (type === 'tour') {
                semossCoreService.emit('start-tour', {
                    selectedState: $state.current.name,
                    selectedApp: semossCoreService.app.get('selectedApp'),
                });
            } else if (type === '101') {
                window.open(
                    'https://semoss.org/SemossDocumentation/',
                    '_blank'
                );
            } else if (type === 'uses') {
                window.open('http://semoss.org/userguide/', '_blank');
            } else if (type === 'contact') {
                // open new webpage or open email
                if (
                    scope.homeHelp.helpDropdown &&
                    scope.homeHelp.helpDropdown.isContactUsLinkUrl
                ) {
                    window.open(
                        scope.homeHelp.helpDropdown.contactUsLink,
                        '_blank'
                    );
                    return false;
                } else {
                    let email = window.open(
                        `mailto:${scope.homeHelp.helpDropdown.contactUsLink}?subject=${scope.homeHelp.name} Help Desk`,
                        '_blank'
                    );
                    setTimeout(function () {
                        email.close();
                    }, 100);
                }
            }

            scope.homeHelp.close();
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            if (CONFIG.hasOwnProperty('version')) {
                scope.homeHelp.version = {
                    version: 'V' + CONFIG.version.version,
                    date: CONFIG.version.datetime.split(' ')[0],
                };
            }

            let themeListener = semossCoreService.on(
                'updated-theme',
                updateTheme
            );
            // remove
            scope.$on('$destroy', function () {
                themeListener();
            });
            updateTheme();
        }

        initialize();
    }
}
