import angular from 'angular';

/**
 * @name viewerTerminal
 * @desc viewerTerminal
 */
export default angular
    .module('app.viewer-terminal.directive', [])
    .directive('viewerTerminal', viewerTerminalDirective);

import './viewer-terminal.scss';

viewerTerminalDirective.$inject = [
    'ENDPOINT',
    '$location',
    '$timeout',
    'semossCoreService',
    '$cookies',
];

function viewerTerminalDirective(
    ENDPOINT,
    $location,
    $timeout,
    semossCoreService,
    $cookies
) {
    viewerTerminalCtrl.$inject = [];
    viewerTerminalLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        template: require('./viewer-terminal.directive.html'),
        scope: {},
        require: [],
        controller: viewerTerminalCtrl,
        controllerAs: 'viewerTerminal',
        bindToController: {},

        link: viewerTerminalLink,
    };

    function viewerTerminalCtrl() {}

    function viewerTerminalLink(scope) {
        scope.viewerTerminal.loading = {
            open: true,
            messages: ['Loading'],
        };

        /**
         * @name render
         * @desc actually render the view
         */
        function render() {
            // initial get
            const postMessage = {
                message: 'semoss-terminal-child',
                data: {
                    message: 'sync-insight',
                    payload: {
                        insightID: scope.viewerTerminal.insightID,
                    },
                },
            };

            // let opener window know insight has been loaded
            window.postMessage(JSON.stringify(postMessage), ENDPOINT.URL);

            // render the view
            scope.viewerTerminal.content = `<insight id="build-${scope.viewerTerminal.insightID}" insight-i-d="${scope.viewerTerminal.insightID}"><terminal location="popup"></terminal></insight>`;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            const urlParams = $location.search();

            scope.viewerTerminal.insightID = urlParams.insightID;

            if (!scope.viewerTerminal.insightID) {
                scope.viewerTerminal.loading.messages = [
                    'InsightID is incorrect',
                ];
                return;
            }

            // turn off listeners, we will intercepte it
            semossCoreService.off('execute-pixel');
            semossCoreService.off('change-workspace-terminal-options');
            semossCoreService.off('close-workspace-terminal');

            // hijack and send to the main one
            semossCoreService.on('execute-pixel', (payload: PixelPayload) => {
                // on while we wait for a response
                scope.viewerTerminal.loading.open = true;

                const postMessage = {
                    message: 'semoss-terminal-child',
                    data: {
                        message: 'execute-pixel',
                        payload: payload,
                    },
                };

                // let opener window know insight has been loaded
                window.postMessage(JSON.stringify(postMessage), ENDPOINT.URL);
            });

            semossCoreService.on(
                'change-workspace-terminal-options',
                (payload: any) => {
                    const postMessage = {
                        message: 'semoss-terminal-child',
                        data: {
                            message: 'change-workspace-terminal-options',
                            payload: payload,
                        },
                    };

                    // let opener window know insight has been loaded
                    window.postMessage(
                        JSON.stringify(postMessage),
                        ENDPOINT.URL
                    );
                }
            );

            semossCoreService.on('close-workspace-terminal', (payload: any) => {
                const postMessage = {
                    message: 'semoss-terminal-child',
                    data: {
                        message: 'close-workspace-terminal',
                        payload: payload,
                    },
                };

                // let opener window know insight has been loaded
                window.postMessage(JSON.stringify(postMessage), ENDPOINT.URL);
            });

            // listener for the shared
            window.addEventListener('message', (message: any) => {
                let messageObject: any;

                if (message.origin !== window.location.origin) {
                    return;
                }

                try {
                    messageObject = JSON.parse(message.data);
                } catch (e) {
                    // not a valid message we're expecting so don't process it
                    return;
                }

                // make sure we are working with an object
                if (typeof messageObject === 'object') {
                    // check the message to see what we need to do
                    if (messageObject.message === 'semoss-terminal-parent') {
                        // set the data
                        semossCoreService.emit(
                            messageObject.data.message,
                            messageObject.data.payload
                        );

                        scope.viewerTerminal.loading.open = false;
                    }
                }
            });

            render();
        }

        initialize();
    }
}
