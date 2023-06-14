'use strict';

import './settings-social.scss';

export default angular
    .module('app.settings.settings-social', [])
    .directive('settingsSocial', settingsSocialDirective);

settingsSocialDirective.$inject = ['monolithService', 'semossCoreService'];

function settingsSocialDirective(monolithService, semossCoreService) {
    settingsSocialCtrl.$inject = [];
    settingsSocialLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./settings-social.directive.html'),
        controller: settingsSocialCtrl,
        link: settingsSocialLink,
        scope: {},
        bindToController: {},
        controllerAs: 'settingsSocial',
    };

    function settingsSocialCtrl() {}

    function settingsSocialLink(scope) {
        scope.settingsSocial.properties = {};

        scope.settingsSocial.saveProperties = saveProperties;
        scope.settingsSocial.resetProperties = resetProperties;

        /**
         * @name getProperties
         * @desc get the current properties
         * @returns {void}
         */
        function getProperties() {
            monolithService.loginProperties().then(
                function (response) {
                    if (!response) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'Unable to fetch properties',
                        });

                        return;
                    }

                    // we do this to save the previous state
                    let updated = {};
                    for (let r in response) {
                        if (response.hasOwnProperty(r)) {
                            updated[r] = {
                                provider: r,
                                original: response[r],
                                updated:
                                    scope.settingsSocial.properties[r] &&
                                    scope.settingsSocial.properties[
                                        r
                                    ].hasOwnProperty('updated')
                                        ? scope.settingsSocial.properties[r]
                                              .updated
                                        : response[r],
                                open:
                                    scope.settingsSocial.properties[r] &&
                                    scope.settingsSocial.properties[
                                        r
                                    ].hasOwnProperty('open')
                                        ? scope.settingsSocial.properties[r]
                                              .open
                                        : false,
                                changed: false,
                            };

                            updated[r].changed =
                                JSON.stringify(updated[r].original) !==
                                JSON.stringify(updated[r].updated);
                        }
                    }

                    scope.settingsSocial.properties = updated;
                },
                function (error) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: error,
                    });
                }
            );
        }

        /**
         * @name saveProperties
         * @desc save the edited login properties
         * @param {string} provider that was edited
         * @returns {void}
         */
        function saveProperties(provider) {
            monolithService
                .modifyLoginProperties(
                    provider,
                    scope.settingsSocial.properties[provider].updated
                )
                .then(
                    function (response) {
                        if (!response) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: 'Unable to save properties',
                            });

                            return;
                        }

                        // remove the old ones
                        delete scope.settingsSocial.properties[provider]
                            .updated;

                        // refresh
                        getProperties();
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error,
                        });
                    }
                );
        }

        /**
         * @name resetProperties
         * @desc save the edited login properties
         * @param {string} provider that was edited
         * @returns {void}
         */
        function resetProperties(provider) {
            scope.settingsSocial.properties[provider].updated = JSON.parse(
                JSON.stringify(
                    scope.settingsSocial.properties[provider].original
                )
            );
            scope.settingsSocial.properties[provider].changed = false;
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying settingsSocial...');
            });

            getProperties();
        }

        initialize();
    }
}
