'use strict';

import angular from 'angular';

export default angular
    .module('app.landing.landing-nav', [])
    .directive('landingNav', landingNavDirective);

import './landing-nav.scss';
import Utility from '../../../utility/utility.js';

landingNavDirective.$inject = ['$q', '$state', 'semossCoreService'];

function landingNavDirective($q, $state, semossCoreService) {
    landingNavCtrl.$inject = [];
    landingNavLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./landing-nav.directive.html'),
        scope: {},
        require: ['^landing'],
        controller: landingNavCtrl,
        controllerAs: 'landingNav',
        bindToController: {},
        link: landingNavLink,
        transclude: true,
    };
    function landingNavCtrl() {}

    function landingNavLink(scope, ele, attrs, ctrl) {
        scope.landingCtrl = ctrl[0];

        scope.landingNav.tags = {
            searchTerm: '',
            isOpen: true,
            raw: [],
            filtered: [],
        };

        scope.landingNav.searchTags = searchTags;
        scope.landingNav.navigate = navigate;

        /**
         * @name navigate
         * @desc navigates to a different page
         * @param state - the name of the state
         * @param params - params for the state
         */
        function navigate(state, params) {
            $state.go(state, params);
        }

        /**
         * @name searchTags
         * @desc filters the tags by the searchterm
         * @param searchTerm the input
         */
        function searchTags(searchTerm: string): void {
            if (searchTerm) {
                scope.landingNav.tags.filtered =
                    scope.landingNav.tags.raw.filter(function (tag) {
                        if (tag.indexOf(searchTerm) === -1) {
                            return false;
                        }
                        return true;
                    });
            } else {
                scope.landingNav.tags.filtered = scope.landingNav.tags.raw;
            }
        }

        /**
         * @name getTags
         * @desc gets the list of available tags
         * @param clearSelected - if true, will clear selected
         */
        function getTags(clearSelected = false): ng.IPromise<void> {
            const deferred = $q.defer();

            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0],
                    tags: any = [];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                for (let i = 0; i < output.length; i++) {
                    tags.push(output[i].tag);
                    scope.landingCtrl.setTagColor(output[i].tag);
                }
                Utility.sort(tags);
                scope.landingNav.tags.raw = tags;

                if (clearSelected) {
                    scope.landingCtrl.tags.selected = [];
                }
                searchTags(scope.landingNav.tags.searchTerm);

                // resolve the promise
                deferred.resolve();
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getAvailableTags',
                        components: [],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });

            return deferred.promise;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // reset the tags
            getTags(true).then(() => {
                if ($state.current.name === 'home.landing.tag') {
                    scope.landingCtrl.tags.selected.push($state.params.tag);
                    scope.landingCtrl.searchInsights();
                }
            });

            const insightTagListener = semossCoreService.on(
                'update-insight-tags',
                function () {
                    getTags();
                }
            );

            scope.$on('$destroy', function () {
                insightTagListener();
            });
        }

        initialize();
    }
}
