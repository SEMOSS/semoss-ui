'use strict';

import angular from 'angular';

import './iframe-widget.scss';

import './iframe-widget-dimensions/iframe-widget-dimensions.directive.ts';

export default angular
    .module('app.iframe-widget.directive', [
        'app.iframe-widget.iframe-widget-dimensions',
    ])
    .directive('iframeWidget', iframeWidgetDirective);

iframeWidgetDirective.$inject = ['$sce', 'semossCoreService'];

export type IframeWidgetOptions = {
    url: string;
};

/**
 * Start message sent from the child iframe to execute a pixel
 */
export interface IframeRunPixelStartMessage {
    message: 'semoss-iframe-run-pixel--start';
    data: {
        key: string;
        insightID: string;
        panelId: string;
        pixel: string;
    };
}

/**
 * End message sent to the child iframe from executing a pixel
 */
export interface IframeRunPixelEndMessage {
    message: 'semoss-iframe-run-pixel--end';
    data: {
        key: string;
        insightID: string;
        panelId: string;
        payload: {
            insightID: string; //insightID that the pixel was run on
            pixelReturn: any[]; //return from the pixel
            recipe?: any[]; // steps that were run
            fromOpen?: boolean;
            direction?: string; // direction of the pixel
            insight?: any;
        };
    };
}

/**
 * Start message sent from the child iframe to run a meta pixel
 */
export interface IframeQueryPixelStartMessage {
    message: 'semoss-iframe-query-pixel--start';
    data: {
        key: string;
        insightID: string;
        panelId: string;
        pixel: string;
    };
}

/**
 * End message sent to the child iframe from running a pixel
 */
export interface IframeQueryPixelEndMessage {
    message: 'semoss-iframe-query-pixel--end';
    data: {
        key: string;
        insightID: string;
        panelId: string;
        payload: {
            insightID: string; //insightID that the pixel was run on
            pixelReturn: any[]; //return from the pixel
            recipe?: any[]; // steps that were run
            fromOpen?: boolean;
            direction?: string; // direction of the pixel
            insight?: any;
        };
    };
}

/**
 * Execute a pixel
 */
export interface IframeQueryDispatchPixelMessage {
    message: 'semoss-iframe-dispatch-pixel';
    data: {
        key: string;
        insightID: string;
        panelId: string;
        payload: {
            key: string;
            insightID: string;
            panelId: string;
            pixel: string;
        };
    };
}

/**
 * Execute a pixel
 */
export interface IframeQueryProcessPixelMessage {
    message: 'semoss-iframe-process-pixel';
    data: {
        insightID: string;
        panelId: string;
        payload: {
            insightID: string; //insightID that the pixel was run on
            pixelReturn: any[]; //return from the pixel
            recipe?: any[]; // steps that were run
            fromOpen?: boolean;
            direction?: string; // direction of the pixel
            insight?: any;
        };
    };
}

export type IframeMessage =
    | IframeRunPixelStartMessage
    | IframeRunPixelEndMessage
    | IframeQueryPixelStartMessage
    | IframeQueryPixelEndMessage
    | IframeQueryDispatchPixelMessage
    | IframeQueryProcessPixelMessage;

export const IFRAME_WIDGET_DEFAULT_OPTIONS: IframeWidgetOptions = {
    url: '',
};

function iframeWidgetDirective(
    $sce: ng.ISCEService,
    semossCoreService: SemossCoreService
) {
    iframeWidgetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget'],
        controllerAs: 'iframeWidget',
        bindToController: {},
        template: require('./iframe-widget.directive.html'),
        controller: iframeWidgetCtrl,
        link: iframeWidgetLink,
    };

    function iframeWidgetCtrl() {}

    function iframeWidgetLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        let iframeEle: HTMLIFrameElement; // store the iframe element

        /** General */
        /**
         * @name resetFilter
         * @desc reset the filter to the default state
         * @return {void}
         */
        function resetIframe(): void {
            let options: IframeWidgetOptions =
                scope.widgetCtrl.getWidget('view.iframe-widget.options') || {};

            // reset the executation state
            scope.iframeWidget.executed = false;

            // merge with the defaults
            options = angular.merge({}, IFRAME_WIDGET_DEFAULT_OPTIONS, options);

            // update the options
            scope.iframeWidget.options = options;

            // add parameters to the url

            const url = new URL(scope.iframeWidget.options.url);

            // add the new params
            url.searchParams.append(
                'semoss-iframe-insight-id',
                scope.widgetCtrl.insightID
            );
            url.searchParams.append(
                'semoss-iframe-panel-id',
                scope.widgetCtrl.panelId
            );

            console.log(url.toString());

            // update the url
            scope.iframeWidget.url = $sce.trustAsResourceUrl(url.toString());
        }

        /**
         * Dispatch Messages from the IframeWidget to the child
         * @param message
         */
        function dispatchIframeMessage(message: IframeMessage) {
            if (iframeEle && iframeEle.contentWindow) {
                iframeEle.contentWindow.postMessage(JSON.stringify(message));
            }
        }

        /**
         * Dispatch Messages from the IframeWidget to the child
         * @param message
         */
        function processIframeMessage(message) {
            let messageObject: any;

            try {
                messageObject = JSON.parse(message.data) as IframeMessage;
            } catch (e) {
                // not a valid message we're expecting so don't process it
                return;
            }

            if (typeof messageObject !== 'object') {
                return;
            }

            if (messageObject.message === 'semoss-iframe-run-pixel--start') {
                const { panelId, insightID, pixel, key } = messageObject.data;

                // needs to be the correct one
                if (
                    scope.widgetCtrl.insightID !== insightID ||
                    scope.widgetCtrl.panelId !== panelId
                ) {
                    return;
                }

                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        },
                    ],
                    (payload: {
                        insightID: string; //insightID that the pixel was run on
                        pixelReturn: any[]; //return from the pixel
                        recipe?: any[]; // steps that were run
                        fromOpen?: boolean;
                        direction?: string; // direction of the pixel
                        insight?: any; //meta data to add to the insiht
                    }) => {
                        dispatchIframeMessage({
                            message: 'semoss-iframe-run-pixel--end',
                            data: {
                                key: key,
                                insightID: scope.widgetCtrl.insightID,
                                panelId: scope.widgetCtrl.panelId,
                                payload: payload,
                            },
                        });
                    }
                );
            } else if (
                messageObject.message === 'semoss-iframe-query-pixel--start'
            ) {
                const { panelId, insightID, pixel, key } = messageObject.data;

                // needs to be the correct one
                if (
                    scope.widgetCtrl.insightID !== insightID ||
                    scope.widgetCtrl.panelId !== panelId
                ) {
                    return;
                }

                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        },
                    ],
                    (payload: {
                        insightID: string; //insightID that the pixel was run on
                        pixelReturn: any[]; //return from the pixel
                        recipe?: any[]; // steps that were run
                        fromOpen?: boolean;
                        direction?: string; // direction of the pixel
                        insight?: any; //meta data to add to the insiht
                    }) => {
                        dispatchIframeMessage({
                            message: 'semoss-iframe-query-pixel--end',
                            data: {
                                key: key,
                                insightID: scope.widgetCtrl.insightID,
                                panelId: scope.widgetCtrl.panelId,
                                payload: payload,
                            },
                        });
                    }
                );
            } else if (
                messageObject.message === 'semoss-iframe-dispatch-pixel'
            ) {
                const { panelId, insightID, pixel } = messageObject.data;

                // needs to be the correct one
                if (
                    scope.widgetCtrl.insightID !== insightID ||
                    scope.widgetCtrl.panelId !== panelId
                ) {
                    return;
                }

                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ]);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            // append listeners
            const updateViewListener = scope.insightCtrl.on(
                'update-view',
                resetIframe
            );

            // get the iframe element
            iframeEle = ele[0].querySelector('#iframe-widget');

            const iframeListener = scope.insightCtrl.on(
                'update-pixel',
                (payload: {
                    insightID: string; //insightID that the pixel was run on
                    pixelReturn: any[]; //return from the pixel
                    recipe?: any[]; // steps that were run
                    fromOpen?: boolean;
                    direction?: string; // direction of the pixel
                    insight?: any; //meta data to add to the insiht
                }) => {
                    dispatchIframeMessage({
                        message: 'semoss-iframe-process-pixel',
                        data: {
                            insightID: scope.widgetCtrl.insightID,
                            panelId: scope.widgetCtrl.panelId,
                            payload: payload,
                        },
                    });
                }
            );

            // listen to events
            window.addEventListener('message', processIframeMessage, false);

            scope.$on('$destroy', () => {
                updateViewListener();
                iframeListener();

                // remove the events
                window.removeEventListener(
                    'message',
                    processIframeMessage,
                    false
                );
            });

            resetIframe();
        }

        initialize();
    }
}
