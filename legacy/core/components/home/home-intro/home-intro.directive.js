'use strict';

export default angular
    .module('app.home.home-intro', [])
    .directive('homeIntro', homeIntroDirective);

import './home-intro.scss';

homeIntroDirective.$inject = ['$state', 'semossCoreService', 'CONFIG'];

function homeIntroDirective($state, semossCoreService, CONFIG) {
    homeIntroCtrl.$inject = [];
    homeIntroLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./home-intro.directive.html'),
        scope: {},
        controller: homeIntroCtrl,
        controllerAs: 'homeIntro',
        bindToController: {},
        link: homeIntroLink,
    };
    function homeIntroCtrl() {}

    function homeIntroLink(scope, ele) {
        scope.homeIntro.open = false;
        scope.homeIntro.name = 'SEMOSS';
        scope.homeIntro.action = action;
        scope.homeIntro.openIntro = openIntro;
        scope.homeIntro.closeIntro = closeIntro;
        scope.homeIntro.toggleShowIntro = toggleShowIntro;
        scope.homeIntro.infoCards = [];

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
            } else if (type === 'github') {
                window.open('https://github.com/SEMOSS/Demo-Data', '_blank');
            } else if (type === '101') {
                window.open(
                    'https://semoss.org/SemossDocumentation/',
                    '_blank'
                );
            } else if (type === 'uses') {
                window.open('https://semoss.org/use-cases', '_blank');
            } else if (type === 'import') {
                $state.go('home.import', {});
            } else if (type === 'insight') {
                semossCoreService.emit('open', {
                    type: 'new',
                    options: {},
                });
            }

            closeIntro();
        }

        /**
         * @name openIntro
         * @desc open the intro
         * @returns {void}
         */
        function openIntro() {
            scope.homeIntro.open = true;
        }

        /**
         * @name closeIntro
         * @desc close the intro and stop playing the videos
         * @returns {void}
         */
        function closeIntro() {
            let overlayVideoEle = ele[0].querySelector('#home-intro__howto'),
                iframeSrc;

            scope.homeIntro.open = false;

            if (overlayVideoEle) {
                iframeSrc = overlayVideoEle.src;
                overlayVideoEle.src = iframeSrc;
            }
        }

        /**
         * @name toggleShowIntro
         * @desc close the intro and stop playing the videos
         * @returns {void}
         */
        function toggleShowIntro() {
            scope.homeIntro.showIntro = !scope.homeIntro.showIntro;
            window.localStorage.setItem('SMSSIntro', scope.homeIntro.showIntro);
        }

        /**
         * @name updateTheme
         * @desc called to update the theme
         * @returns {void}
         */
        function updateTheme() {
            let theme = semossCoreService.settings.get('active.theme');
            scope.homeIntro.theme = theme;
            scope.homeIntro.name = theme.name;
            scope.homeIntro.homeIntroObj = theme.homeIntroObj;
            scope.homeIntro.infoCards = scope.homeIntro.homeIntroObj.infoCards;
            scope.homeIntro.infoCards.forEach((infoCard) => {
                infoCard.title = infoCard.title.replace(
                    /%theme.name%/g,
                    scope.homeIntro.name
                );
                infoCard.description = infoCard.description.replace(
                    /%theme.name%/g,
                    scope.homeIntro.name
                );
            });
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            const showIntro = window.localStorage.getItem('SMSSIntro');
            if (showIntro === null) {
                window.localStorage.setItem('SMSSIntro', true);
                scope.homeIntro.showIntro = true;
            } else {
                scope.homeIntro.showIntro = showIntro === 'true'; // convert string to boolean
            }

            // open if it is sent from the config and showWelcomeBanner is true
            if (
                scope.homeIntro.showIntro &&
                (!CONFIG.hasOwnProperty('showWelcomeBanner') ||
                    CONFIG.showWelcomeBanner)
            ) {
                openIntro();
            }

            scope.homeIntro.hideIntro = !scope.homeIntro.showIntro;

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
