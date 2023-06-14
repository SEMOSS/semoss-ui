import angular from 'angular';

import { load } from '../../cookies';

import './cookie-banner.scss';

export default angular
    .module('app.cookie-banner.directive', [])
    .directive('cookieBanner', cookieBannerDirective);

cookieBannerDirective.$inject = [
    'LEGACY_GOOGLE_ANALYTICS',
    'GOOGLE_ANALYTICS_TAG',
];

function cookieBannerDirective(LEGACY_GOOGLE_ANALYTICS, GOOGLE_ANALYTICS_TAG) {
    cookieBannerCtrl.$inject = ['$scope'];
    cookieBannerLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {},
        controller: cookieBannerCtrl,
        controllerAs: 'cookieBanner',
        bindToController: {},
        template: require('./cookie-banner.directive.html'),
        link: cookieBannerLink,
    };

    function cookieBannerCtrl() {}

    function cookieBannerLink(scope) {
        scope.cookieBanner.open = false;

        scope.cookieBanner.accept = accept;
        scope.cookieBanner.reject = reject;

        /**
         * @name checkPreference
         * @desc check preference (adding or removing cookies) or showing
         * @returns {void}
         */
        function checkPreference(): void {
            const optionalCookie = window.localStorage.getItem(
                'smss-optional-cookie'
            );

            if (optionalCookie === 'true') {
                // show the banner
                scope.cookieBanner.open = false;

                // load the cookies
                load(LEGACY_GOOGLE_ANALYTICS, GOOGLE_ANALYTICS_TAG);
            } else if (optionalCookie === 'false') {
                // hide the banner
                scope.cookieBanner.open = false;
            } else {
                scope.cookieBanner.open = true;
            }
        }

        /**
         * @name accept
         * @desc accept the optional cookies
         * @returns {void}
         */
        function accept(): void {
            window.localStorage.setItem('smss-optional-cookie', 'true');

            checkPreference();
        }

        /**
         * @name reject
         * @desc reject the optional cookies
         * @returns {void}
         */
        function reject(): void {
            window.localStorage.setItem('smss-optional-cookie', 'false');

            checkPreference();
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the cookieBanner directive
         * @returns {void}
         */
        function initialize(): void {
            // check the preference and show the bannder if nothing is set
            checkPreference();
        }

        initialize();
    }
}
