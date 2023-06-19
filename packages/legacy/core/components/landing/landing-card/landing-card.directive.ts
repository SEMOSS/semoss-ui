'use strict';

import angular from 'angular';

export default angular
    .module('app.landing.landing-card', [])
    .directive('landingCard', landingCardDirective);

import './landing-card.scss';

landingCardDirective.$inject = ['semossCoreService', 'monolithService'];

function landingCardDirective(semossCoreService, monolithService) {
    landingCardCtrl.$inject = [];
    landingCardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./landing-card.directive.html'),
        scope: {},
        require: ['^landing'],
        controller: landingCardCtrl,
        controllerAs: 'landingCard',
        bindToController: {
            insight: '=',
            mode: '=',
        },
        link: landingCardLink,
    };
    function landingCardCtrl() {}

    function landingCardLink(scope, ele, attrs, ctrl) {
        scope.landingCtrl = ctrl[0];
        scope.landingCard.isMenuOpen = false;

        scope.landingCard.openInsight = openInsight;
        scope.landingCard.openInsightEdit = openInsightEdit;
        scope.landingCard.openInsightShare = openInsightShare;
        scope.landingCard.openInsightDelete = openInsightDelete;
        scope.landingCard.setInsightFavorite = setInsightFavorite;

        /**
         * @name openInsight
         * @desc opens the insight
         * @param {*} $event - event object
         */
        function openInsight($event): void {
            // Do not open if the user favorited an insight via the keyboard
            if (
                $event.type === 'keypress' &&
                $event.currentTarget !== $event.target
            ) {
                return;
            }
            let newSheet = true;

            // close the popup
            scope.landingCard.isMenuOpen = false;

            if (
                $event &&
                ($event.metaKey ||
                    $event.ctrlKey ||
                    $event.keyCode === 17 ||
                    $event.keyCode === 224)
            ) {
                newSheet = false;
            }

            semossCoreService.emit('open', {
                type: 'insight',
                options: scope.landingCard.insight,
                newSheet: newSheet,
            });
        }

        /**
         * @name openInsightEdit
         * @desc opens the edit insight overlay
         */
        function openInsightEdit(): void {
            scope.landingCard.isMenuOpen = false;
            scope.landingCtrl.openInsightEdit(scope.landingCard.insight);
        }

        /**
         * @name openInsightShare
         * @desc opens the share insight overlay
         */
        function openInsightShare(): void {
            scope.landingCard.isMenuOpen = false;
            scope.landingCtrl.openInsightShare(scope.landingCard.insight);
        }

        /**
         * @name openInsight
         * @desc opens the delete insight overlay
         */
        function openInsightDelete(): void {
            scope.landingCard.isMenuOpen = false;
            scope.landingCtrl.openInsightDelete(scope.landingCard.insight);
        }

        /**
         * @name setInsightFavorite
         * @desc favorites/unfavorites an insight
         */
        function setInsightFavorite(): void {
            const appId: string = scope.landingCard.insight.app_id,
                insightId: string = scope.landingCard.insight.app_insight_id,
                isFavorite: boolean = scope.landingCard.insight.insight_favorite
                    ? !scope.landingCard.insight.insight_favorite
                    : true;

            monolithService
                .setInsightFavorite(appId, insightId, isFavorite)
                .then(
                    function () {
                        let message: string;
                        if (isFavorite) {
                            message = 'Insight has been favorited.';
                        } else {
                            message = 'Insight has been unfavorited.';
                        }
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: message,
                        });
                        scope.landingCard.insight.insight_favorite = isFavorite;
                        scope.landingCtrl.updateFavorite(
                            scope.landingCard.insight
                        );
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.$on('landing--insight-updated', function (event, insight) {
                if (
                    insight.app_insight_id ===
                    scope.landingCard.insight.app_insight_id
                ) {
                    scope.landingCard.insight.insight_favorite =
                        insight.insight_favorite;
                }
            });
        }

        initialize();
    }
}
