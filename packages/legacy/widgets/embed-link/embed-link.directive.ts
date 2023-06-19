import angular from 'angular';

import './embed-link.scss';

export default angular
    .module('app.embed-link.directive', [])
    .directive('embedLink', embedLinkDirective);

embedLinkDirective.$inject = [
    '$location',
    '$window',
    'semossCoreService',
    'ENDPOINT',
];

function embedLinkDirective($location, $window, semossCoreService, ENDPOINT) {
    embedLinkCtrl.$inject = [];
    embedLinkLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight'],
        controllerAs: 'embedLink',
        bindToController: {},
        template: require('./embed-link.directive.html'),
        controller: embedLinkCtrl,
        link: embedLinkLink,
    };

    function embedLinkCtrl() {}

    function embedLinkLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        scope.embedLink.embed = {
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

        scope.embedLink.selectedDashboard = 'URL';
        scope.embedLink.selectedJBDC = 'REST API';
        scope.embedLink.selectedState = 'Saved';

        scope.embedLink.toggleCustomEmbed = toggleCustomEmbed;
        scope.embedLink.saveCustomEmbed = saveCustomEmbed;
        scope.embedLink.copyEmbed = copyEmbed;
        scope.embedLink.updateEmbed = updateEmbed;
        scope.embedLink.copyToClipboard = copyToClipboard;
        scope.embedLink.setSelectedDashboard = setSelectedDashboard;
        scope.embedLink.setSelectedJBDC = setSelectedJBDC;
        scope.embedLink.setSelectedState = setSelectedState;
        scope.embedLink.isSavedSession = isSavedSession;

        /**
         * @param {string} tab Name of tab
         */
        function setSelectedState(tab: string): void {
            scope.embedLink.selectedState = tab;

            scope.embedLink.updateEmbed();
        }

        /**
         * @param {string} tab Name of tab
         */
        function setSelectedJBDC(tab: string): void {
            scope.embedLink.selectedJBDC = tab;
        }

        /**
         * @param {string} tab Name of tab
         */
        function setSelectedDashboard(tab: string): void {
            scope.embedLink.selectedDashboard = tab;
        }

        /**
         * @name toggleCustomEmbed
         * @desc toggles the custom
         */
        function toggleCustomEmbed(): void {
            scope.embedLink.embed.custom.path = '';
            scope.embedLink.embed.custom.valid = false;

            updateEmbedUrl();
        }

        /**
         * @name saveCustomEmbed
         * @desc save the custom
         */
        function saveCustomEmbed(): void {
            if (!scope.embedLink.embed.custom.path.match(/^[a-zA-Z0-9-_]+$/)) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Path is not a valid URL',
                });
                return;
            }

            const appId = scope.insightCtrl.getShared('insight.app_id');
            const appInsightId = scope.insightCtrl.getShared(
                'insight.app_insight_id'
            );

            scope.insightCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `badd(fancy=["${scope.embedLink.embed.custom.path}"], embed=["<encode>#!/insight?engine=${appId}&id=${appInsightId}</encode>"] )`,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
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

                    scope.embedLink.embed.custom.valid = true;

                    updateEmbedUrl();
                }
            );
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

        function isSavedSession(): boolean {
            return scope.embedLink.selectedState === 'Saved';
        }

        function updateEmbedUrl(): void {
            scope.embedLink.embed.url = $location.absUrl().split('#')[0];

            if (scope.embedLink.embed.custom.open) {
                scope.embedLink.embed.url += `#!/r/${scope.embedLink.embed.custom.path}`;
            } else {
                scope.embedLink.embed.url += `#!/insight?engine=${scope.embedLink.embed.current.projectId}&id=${scope.embedLink.embed.current.insightId}`;
            }
        }

        /** Updates */
        /**
         * @name updateEmbed
         * @desc updates the embed string
         */
        function updateEmbed(): void {
            const resizable = scope.embedLink.embed.config.resizable
                ? 'resize: both;overflow: auto;'
                : '';

            scope.embedLink.embed.appId =
                scope.insightCtrl.getShared('insight.app_id');

            scope.embedLink.embed.appInsightId = scope.insightCtrl.getShared(
                'insight.app_insight_id'
            );

            scope.embedLink.embed.insightId = scope.insightCtrl.insightID;

            scope.embedLink.embed.frameName = Object.keys(
                scope.insightCtrl.getShared('frames')
            )[0];

            scope.embedLink.embed.current = {
                insightId:
                    scope.embedLink.embed[
                        isSavedSession() ? 'appInsightId' : 'insightId'
                    ],
                projectId: isSavedSession()
                    ? scope.embedLink.embed.appId
                    : 'session',
            };

            scope.embedLink.embed.jdbcJson = `${ENDPOINT.URL}/api/project-${
                scope.embedLink.embed.current.projectId
            }/jdbc_json?insightId=${scope.embedLink.embed.current.insightId}${
                isSavedSession() ? '&open=true' : ''
            }&sql=Select * from ${scope.embedLink.embed.frameName}`;

            scope.embedLink.embed.jdbcCsv = `${ENDPOINT.URL}/api/project-${
                scope.embedLink.embed.current.projectId
            }/jdbc_csv?insightId=${scope.embedLink.embed.current.insightId}${
                isSavedSession() ? '&open=true' : ''
            }&sql=Select * from ${scope.embedLink.embed.frameName}`;

            scope.embedLink.embed.jdbc = `jdbc:smss:${ENDPOINT.HOST}:${
                ENDPOINT.PORT === '' ? '80' : ENDPOINT.PORT
            };endpoint=${
                ENDPOINT.MODULE
            };protocol=http;user=<USER>;pass=<PASS>;project=${
                scope.embedLink.embed.current.projectId
            };insight=${scope.embedLink.embed.current.insightId}`;

            updateEmbedUrl();

            scope.embedLink.embed.code = `<iframe frameborder="0" width="1000" height="600" style="border: 1px solid #ccc; ${resizable}" src="${scope.embedLink.embed.url}"></iframe>`;
        }

        /**
         * @name initialize
         * @desc initialize the directive
         * @returns {void}
         */
        function initialize() {
            // register listeners
            const savedInsightListener = scope.insightCtrl.on(
                'saved-insight',
                updateEmbed
            );

            scope.$on('$destroy', function () {
                console.log('destroying embed-link....');
                savedInsightListener();
            });

            updateEmbed();
        }

        initialize();
    }
}
