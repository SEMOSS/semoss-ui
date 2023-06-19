import angular from 'angular';

/**
 * @name viewer
 * @desc viewer
 */
export default angular
    .module('app.viewer.directive', [])
    .directive('viewer', viewerDirective);

import './viewer.scss';

viewerDirective.$inject = [
    'ENDPOINT',
    '$location',
    '$timeout',
    'semossCoreService',
    '$cookies',
    'monolithService',
];

function viewerDirective(
    ENDPOINT,
    $location,
    $timeout,
    semossCoreService,
    $cookies,
    monolithService
) {
    viewerCtrl.$inject = [];
    viewerLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        template: require('./viewer.directive.html'),
        scope: {},
        require: [],
        controller: viewerCtrl,
        controllerAs: 'viewer',
        bindToController: {},

        link: viewerLink,
    };

    function viewerCtrl() {}

    function viewerLink(scope) {
        scope.viewer.loading = {
            open: true,
            messages: ['Loading'],
        };
        scope.viewer.logo = true;

        scope.viewer.getLogo = getLogo;

        /**
         * @name getLogo
         * @desc get the logo to display
         */
        function getLogo(): string {
            if (!scope.viewer.appId) {
                return '';
            }
            return `${ENDPOINT.URL}/api/app-${scope.viewer.appId}/embedLogo`;
        }

        /**
         * @name render
         * @desc function that is called on directive load
         * @param insightID - insight id
         */
        function render(insightID: string): void {
            let html = '';

            if (typeof scope.viewer.panelId !== 'undefined') {
                const widgetId = `SMSSWidget${insightID}___${scope.viewer.panelId}`;
                html = `<insight id="build-${insightID}" insight-i-d="${insightID}"><widget widget-id='${widgetId}' ><widget-view></widget-view></widget></insight>`;
            } else if (typeof scope.viewer.sheetId !== 'undefined') {
                const widgetId = `SMSSWidget${insightID}___${scope.viewer.panelId}`;
                html = `<widget widget-id='${widgetId}' ><widget-view></widget-view></widget>`;
                html = `<insight id="build-${insightID}" insight-i-d="${insightID}"><worksheet sheet-id="${scope.viewer.sheetId}"></worksheet></insight>`;
            } else {
                html = `<insight id="build-${insightID}" insight-i-d="${insightID}"><workbook></workbook></insight>`;
            }

            scope.viewer.loading.open = false;

            scope.viewer.content = html;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let urlParams = $location.search(),
                insightURL = $location.absUrl(),
                postQuery = '',
                initialLoadListener: () => {},
                syncInsightListener: () => {},
                syncCoreListener: () => {};

            scope.viewer.appId = urlParams.engine;
            scope.viewer.appInsightId = urlParams.id;
            scope.viewer.panelId = urlParams.panel;
            scope.viewer.sheetId = urlParams.sheet;
            scope.viewer.forceStandard = urlParams.forceStandard;
            scope.viewer.drop = urlParams.drop;
            scope.viewer.parameters = urlParams.parameters;
            scope.viewer.cookieParams = urlParams.cookieParams;
            scope.viewer.insightId = urlParams.insightId;
            scope.viewer.useExistingInsight = urlParams.useExistingInsight;

            if (scope.viewer.cookieParams) {
                const cookieParams = JSON.parse(
                    decodeURIComponent(urlParams.cookieParams)
                );

                for (const cookieParam in cookieParams) {
                    if (cookieParams.hasOwnProperty(cookieParam)) {
                        $cookies.put(cookieParam, cookieParams[cookieParam], {
                            path: '/' + ENDPOINT.MODULE,
                            secure: true,
                        });
                    }
                }
            }

            semossCoreService.setOptions('options', 'insightURL', insightURL);
            // semossCoreService.getBEConfig().then(function (config) {
            //     if (config.security) {
            //         // look to see if user is signed in. if not, we need to store the insight url so we can route to it when user signs in.
            //         semossCoreService.getActiveLogins().then(function () {
            //             semossCoreService.setOptions('options', 'insightURL', insightURL);
            //         });
            //     }
            // });

            if (urlParams.restParams) {
                semossCoreService.setOptions(
                    'options',
                    'restParams',
                    JSON.parse(decodeURIComponent(urlParams.restParams))
                );
            }

            if (urlParams.animation === 'false') {
                semossCoreService.setWidgetState('animation', false);
            }

            if (
                (!scope.viewer.appId || !scope.viewer.appInsightId) &&
                !scope.viewer.insightId
            ) {
                scope.viewer.loading.messages = ['Insight Url is incorrect'];
                return;
            }

            if (typeof scope.viewer.panelId !== 'undefined') {
                if (scope.viewer.forceStandard) {
                    postQuery +=
                        'Panel(' +
                        scope.viewer.panelId +
                        ')|SetPanelView(\\"visualization\\", \\"<encode>{"type":"standard"}</encode>\\");';
                }
            }

            if (scope.viewer.insightId === 'new') {
                semossCoreService.emit('open', {
                    type: 'new',
                    options: {},
                });
            }

            // add listener
            // if there are any issues upon initialization of the insight, we will show the message in the loading bar.
            initialLoadListener = semossCoreService.once(
                'alert',
                function (payload) {
                    scope.viewer.loading.messages = [payload.text];
                }
            );

            syncInsightListener = semossCoreService.on(
                'sync-insight',
                function (payload) {
                    const initialized = semossCoreService.getShared(
                        payload.insightID,
                        'initialized'
                    );
                    if (initialized) {
                        render(payload.insightID);
                        syncInsightListener();

                        if (urlParams.hasOwnProperty('status')) {
                            // if status is in the url, we will setup the listener to check when the data has finished loading,
                            // if so we will add an empty div with 'viz-loaded- as id for the BE to check that we have finished loading.
                            const element = document.createElement('div');
                            element.id = 'viz-loaded';

                            window.document.body.appendChild(element);
                            window.visualLoaded = true;

                            semossCoreService.emit('notify-parent', {
                                message: 'insight-loaded',
                                data: {
                                    insightID: payload.insightID,
                                },
                            });
                        }
                    }
                }
            );

            if (!scope.viewer.insightId) {
                // off load event
                window.onbeforeunload = function () {
                    // only drop if useExistingInsight is false. otherwise we want to keep the insight active so we can bring it back
                    if (!urlParams.useExistingInsight) {
                        semossCoreService.emit('close-all');
                    }
                };

                // drop via a function
                window['dropInsights'] = function (callback: () => {}) {
                    semossCoreService.once('close-all-complete', callback);
                    semossCoreService.emit('close-all');
                };

                // resize
                window.onresize = function () {
                    $timeout(); // widget view will take care of it
                };

                // drop via timer or close
                if (scope.viewer.drop) {
                    syncCoreListener = semossCoreService.on(
                        'sync-insight',
                        function (payload: { insightID: string }) {
                            $timeout(
                                function (insightID: string) {
                                    semossCoreService.emit('execute-pixel', {
                                        insightID: insightID,
                                        commandList: [
                                            {
                                                type: 'dropInsight',
                                                components: [],
                                                terminal: true,
                                            },
                                        ],
                                    });
                                }.bind(null, payload.insightID),
                                scope.viewer.drop
                            );
                        }
                    );
                }
            }

            // cleanup
            scope.$on('$destroy', function () {
                if (initialLoadListener) {
                    initialLoadListener();
                }

                if (syncInsightListener) {
                    syncInsightListener();
                }

                if (syncCoreListener) {
                    syncCoreListener();
                }
            });

            if (scope.viewer.insightId) {
                monolithService
                    .getInsightState(scope.viewer.insightId)
                    .then(function (response: any) {
                        semossCoreService.emit('update-pixel', {
                            pixelReturn: response.pixelReturn,
                            insightID: scope.viewer.insightId,
                        });
                    });
            } else {
                semossCoreService.emit('open', {
                    type: 'insight',
                    options: {
                        app_name: scope.viewer.appId,
                        app_id: scope.viewer.appId, // for playsheet....
                        app_insight_id: scope.viewer.appInsightId,
                        postQuery: postQuery,
                        parameters: scope.viewer.parameters,
                        useExistingInsight: scope.viewer.useExistingInsight,
                    },
                    newSheet: true,
                });
            }
        }

        initialize();
    }
}
