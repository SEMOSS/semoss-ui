import angular from 'angular';

/**
 * @name embedTerminal
 * @desc embedTerminal
 */
export default angular
    .module('app.embed-terminal.directive', [])
    .directive('embedTerminal', embedTerminalDirective);

import './embed-terminal.scss';

embedTerminalDirective.$inject = ['$timeout', 'semossCoreService'];

function embedTerminalDirective($timeout, semossCoreService) {
    embedTerminalCtrl.$inject = [];
    embedTerminalLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        template: require('./embed-terminal.directive.html'),
        scope: {},
        require: [],
        controller: embedTerminalCtrl,
        controllerAs: 'embedTerminal',
        bindToController: {},

        link: embedTerminalLink,
    };

    function embedTerminalCtrl() {
        // noop
    }

    function embedTerminalLink(scope) {
        scope.embedTerminal.loading = {
            open: true,
            messages: ['Loading'],
        };

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // start loading
            scope.embedTerminal.loading.open = false;

            // open a new insight
            semossCoreService.emit('open', {
                type: 'pixel',
                options: {
                    // pixel: `
                    // AddSheet ( "0" ) ;
                    // AddPanel ( panel = [ 0 ] , sheet = [ "0" ] ) ;
                    // Panel ( 0 ) | SetPanelView ( "terminal" ) ;
                    // SetInsightConfig({"panels":{"0":{"config":{"type":"golden","backgroundColor":"#FFFFFF","opacity":100}}},"sheets":{"0":{"backgroundColor":"#FFFFFF","golden":{"content":[{"type":"row","content":[{"type":"stack","activeItemIndex":0,"width":100,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"0"}}]}]}]}}},"sheet":"0","presentation":true});
                    // `,
                    pixel: `  
                    AddSheet ( "0" ) ;
                    AddPanel ( panel = [ 0 ] , sheet = [ "0" ] ) ;
                    Panel ( 0 ) | SetPanelView ( "terminal" ) ;
                    `,
                },
            });

            // add listener
            // if there are any issues upon initialization of the insight, we will show the message in the loading bar.

            const initialLoadListener = semossCoreService.once(
                'alert',
                function (payload) {
                    scope.embedTerminal.loading.messages = [payload.text];
                }
            );

            const syncInsightListener = semossCoreService.on(
                'sync-insight',
                function (payload) {
                    const initialized = semossCoreService.getShared(
                        payload.insightID,
                        'initialized'
                    );

                    if (initialized) {
                        // set the content
                        const widgetId = `SMSSWidget${payload.insightID}___0`;
                        scope.embedTerminal.content = `<insight id="build-${payload.insightID}" insight-i-d="${payload.insightID}"><widget widget-id='${widgetId}' ><widget-view></widget-view></widget></insight>`;

                        // close loading
                        scope.embedTerminal.loading.open = false;

                        // destroy it
                        syncInsightListener();
                    }
                }
            );

            // window.onbeforeunload = function () {
            //     semossCoreService.emit('close-all');
            // };

            // window['dropInsights'] = function (callback: () => null) {
            //     semossCoreService.once('close-all-complete', callback);
            //     semossCoreService.emit('close-all');
            // };

            // // resize
            window.onresize = function () {
                $timeout(); // widget view will take care of it
            };

            // // cleanup
            scope.$on('$destroy', function () {
                if (initialLoadListener) {
                    initialLoadListener();
                }

                if (syncInsightListener) {
                    syncInsightListener();
                }
            });
        }

        initialize();
    }
}
