'use strict';

import './share-insight.scss';
import angular from 'angular';

export default angular
    .module('app.share-insight.directive', [])
    .directive('shareInsight', shareInsightDirective);

shareInsightDirective.$inject = [
    '$location',
    '$window',
    'semossCoreService',
    'ENDPOINT',
];

function shareInsightDirective(
    $location,
    $window,
    semossCoreService,
    ENDPOINT
) {
    shareInsightCtrl.$inject = [];
    shareInsightLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./share-insight.directive.html'),
        bindToController: {
            open: '=',
            insight: '=',
        },
        controller: shareInsightCtrl,
        controllerAs: 'shareInsight',
        link: shareInsightLink,
    };

    function shareInsightCtrl() {}

    function shareInsightLink(scope, ele) {
        scope.shareInsight.embed = {
            url: '',
            code: '',
            config: {
                resizable: false,
            },
            custom: {
                open: false,
                valid: false,
                path: '',
            },
        };

        scope.shareInsight.selectedJBDC = 'REST API';

        scope.shareInsight.toggleCustomEmbed = toggleCustomEmbed;
        scope.shareInsight.saveCustomEmbed = saveCustomEmbed;
        scope.shareInsight.copyEmbed = copyEmbed;
        scope.shareInsight.updateEmbed = updateEmbed;
        scope.shareInsight.copyToClipboard = copyToClipboard;
        scope.shareInsight.setSelectedJBDC = setSelectedJBDC;
        scope.shareInsight.closeOverlay = closeOverlay;

        /**
         * @param {string} tab Name of tab
         */
        function setSelectedJBDC(tab: string): void {
            scope.shareInsight.selectedJBDC = tab;
        }

        /**
         * @name toggleCustomEmbed
         * @desc toggles the custom
         */
        function toggleCustomEmbed(): void {
            scope.shareInsight.embed.custom.path = '';
            scope.shareInsight.embed.custom.valid = false;

            if (!scope.shareInsight.embed.custom.open) {
                updateEmbed();
            }
        }

        /**
         * @name saveCustomEmbed
         * @desc save the custom
         */
        function saveCustomEmbed(): void {
            if (
                !scope.shareInsight.embed.custom.path.match(/^[a-zA-Z0-9-_]+$/)
            ) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Path is not a valid URL',
                });
                return;
            }

            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: output,
                    });

                    scope.shareInsight.embed.custom.valid = true;

                    updateEmbed();
                }
            );

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [
                            `badd(fancy=["${scope.shareInsight.embed.custom.path}"], embed=["<encode>#!/insight?engine=${scope.shareInsight.insight.app_id}&id=${scope.shareInsight.insight.app_insight_id}</encode>"] )`,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        function copyToClipboard(str: string): void {
            navigator.clipboard.writeText(str);

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Successfully copied to clipboard',
            });
        }

        /**
         * @name copyEmbed
         * @param {string} content - content to copy
         */
        function copyEmbed(content: string): void {
            // For IE.
            if ($window.clipboardData) {
                $window.clipboardData.setData('Text', content);

                semossCoreService.emit('alert', {
                    color: 'success',
                    text: 'Successfully copied to clipboard',
                });
            } else {
                const exportElement = angular.element(
                    "<textarea style='position:fixed;left:-1000px;top:-1000px;'>" +
                        content +
                        '</textarea>'
                );
                ele.append(exportElement);
                (exportElement as any).select();

                if (document.execCommand('copy')) {
                    exportElement.remove();

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully copied to clipboard',
                    });
                } else {
                    exportElement.remove();
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Unsuccessfully copied to clipboard',
                    });
                }
            }
        }

        /** Updates */
        /**
         * @name updateEmbed
         * @desc updates the embed string
         */
        function updateEmbed(): void {
            if (!scope.shareInsight.open) {
                return;
            }

            const resizable = scope.shareInsight.embed.config.resizable
                ? 'resize: both;overflow: auto;'
                : '';

            scope.shareInsight.embed.appId = scope.shareInsight.insight.app_id;
            scope.shareInsight.embed.appInsightId =
                scope.shareInsight.insight.app_insight_id;

            scope.shareInsight.embed.jdbcJson = `${ENDPOINT.URL}/api/project-${scope.shareInsight.embed.appId}/jdbc_json?insightId=${scope.shareInsight.embed.appInsightId}&open=true&sql=<SQL Query>`;

            scope.shareInsight.embed.jdbc = `jdbc:smss:${ENDPOINT.HOST}:${
                ENDPOINT.PORT === '' ? '80' : ENDPOINT.PORT
            };endpoint=${
                ENDPOINT.MODULE
            };protocol=http;user=<USER>;pass=<PASS>;project=${
                scope.shareInsight.embed.appId
            };insight=${scope.shareInsight.embed.appInsightId}`;

            scope.shareInsight.embed.url = $location.absUrl().split('#')[0];

            if (scope.shareInsight.embed.custom.open) {
                scope.shareInsight.embed.url += `#!/r/${scope.shareInsight.embed.custom.path}`;
            } else {
                scope.shareInsight.embed.url += `#!/insight?engine=${scope.shareInsight.embed.appId}&id=${scope.shareInsight.embed.appInsightId}`;
            }

            scope.shareInsight.embed.code = `<iframe frameborder="0" width="1000" height="600" style="border: 1px solid #ccc; ${resizable}" src="${scope.shareInsight.embed.url}"></iframe>`;
        }

        /**
         * @name closeOverlay
         * @desc close the overlay
         */
        function closeOverlay(): void {
            scope.shareInsight.open = false;
        }

        /** Utility */
        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            updateEmbed();

            //TODO: Merge with embed-link
            //TODO: Not the best way to see changes in value
            scope.$watch(
                function () {
                    return (
                        JSON.stringify(scope.shareInsight.insight) +
                        '_' +
                        scope.shareInsight.open
                    );
                },
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        updateEmbed();
                    }
                }
            );
        }

        initialize();
    }
}
