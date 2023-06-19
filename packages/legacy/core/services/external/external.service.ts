import Utility from '../../utility/utility.js';
import Pixel from '../../store/pixel/pixel.js';
import angular from 'angular';

export default angular
    .module('app.external.service', [])
    .factory('externalService', externalService);

externalService.$inject = [
    '$stateParams',
    'workbookService',
    'messageService',
    'storeService',
    'CONFIG',
    '$compile',
    '$rootScope',
    '$location',
];

function externalService(
    $stateParams,
    workbookService: WorkbookService,
    messageService: MessageService,
    storeService: StoreService,
    CONFIG,
    $compile,
    $rootScope,
    $location
) {
    const /** Public */
        /** Private */
        _state = {},
        _actions = {
            'notify-parent': (postMessage: {
                message: string;
                data: {
                    [key: string]: any;
                };
            }): void => {
                const urlParams = $location.search();

                //

                const m = {
                    message: postMessage.message,
                    data: postMessage.data,
                    child: undefined,
                };

                if (urlParams.hasOwnProperty('child')) {
                    m.child = urlParams.child;
                }

                // emit it out
                window.parent.postMessage(JSON.stringify(m), '*');
            },
        };

    let externalMenuEle, externalMenuScope;

    /**
     * @name panelFilter
     * @param filters {}
     * @desc construct the pixel to filter the panel
     * @returns {void}
     */
    function panelFilter(filters: any): void {
        let finalPixelComponents: any = [],
            refreshComponent: any = [],
            panelFilterComponent: any = [],
            innerIfTrue: any = [],
            innerIfFalse: any = [],
            filter: string,
            insightId: string = $stateParams.insight,
            workbook: any = workbookService.getWorkbook(insightId),
            worksheet: any = workbookService.getWorksheet(
                insightId,
                workbook.worksheet
            ),
            panelId: string = worksheet.selected.panel,
            widgetId: string = worksheet.panels[worksheet.panel].widgetId,
            cleanedRefreshPixel: string = storeService.generate('refresh', {
                widgetIds: [widgetId],
            });

        cleanedRefreshPixel = cleanedRefreshPixel.replace(/;META\|/g, ',');

        // set up the set panel filter component
        for (filter in filters) {
            if (filters.hasOwnProperty(filter)) {
                panelFilterComponent.push({
                    type: 'panel',
                    components: [panelId],
                });
                panelFilterComponent.push({
                    type: 'setPanelFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: filter,
                                comparator: '==',
                                values: filters[filter],
                            },
                        ],
                    ],

                    terminal: true,
                });
            }
        }

        // set up the refresh component
        refreshComponent.push({
            type: 'Pixel',
            components: [cleanedRefreshPixel],
            terminal: true,
        });

        // add refresh to the panel filter component if we have panel filters to apply
        if (panelFilterComponent.length > 0) {
            panelFilterComponent =
                panelFilterComponent.concat(refreshComponent);
        }

        // set up the if statement: if there are panel filters, we will run the panel filter pixel along with the refresh
        // if there are no panel filters, we will just run a refresh
        innerIfTrue = [
            {
                type: 'if',
                components: [
                    [
                        {
                            type: 'Pixel',
                            components: [panelFilterComponent.length + ' > 0'],
                            terminal: true,
                        },
                    ], // condition
                    panelFilterComponent, // true
                    refreshComponent, //false
                ],
                terminal: true,
            },
        ];

        innerIfFalse = [
            {
                type: 'if',
                components: [
                    [
                        {
                            type: 'Pixel',
                            components: [panelFilterComponent.length + ' > 0'],
                            terminal: true,
                        },
                    ], // condition
                    panelFilterComponent, // true
                    [], //false
                ],
                terminal: true,
            },
        ];

        // finally we wrap another if condition for handling unfilter panel.
        // if the panel has been unfiltered, we run the inner if statement to check filter components and then running the refresh
        finalPixelComponents = [
            {
                type: 'if',
                components: [
                    [
                        {
                            type: 'panel',
                            components: [panelId],
                        },
                        {
                            type: 'unfilterPanel',
                            components: [],
                            terminal: true,
                        },
                    ], // condition
                    innerIfTrue, // true
                    innerIfFalse, //false
                ],
                terminal: true,
            },
        ];

        messageService.emit('execute-pixel', {
            insightID: insightId,
            commandList: finalPixelComponents,
        });
    }

    /**
     * @name executePixel
     * @param data {}
     * @desc construct the pixel to filter the panel
     * @returns {void}
     */
    function executePixel(data: { insightID: string; pixel: string }): void {
        const { insightID, pixel } = data;

        messageService.emit('execute-pixel', {
            insightID: insightID,
            commandList: [
                {
                    type: 'Pixel',
                    components: [pixel],
                    terminal: true,
                },
            ],
        });
    }

    /**
     * creates pop-up for frame create/update
     * @param payload external payload
     */
    function createExternalHTML(payload) {
        // create a new scope
        externalMenuScope = $rootScope.$new(true);

        // functions
        externalMenuScope.insightId = $stateParams.insight;
        externalMenuScope.payload = payload;
        externalMenuScope.close = destroyExternalHTML;

        const externalMenuHTML = `
                <edit-assisted-query 
                    insight-id="insightId"
                    payload="payload"
                    close="close()">
                </edit-assisted-query>
            `;

        externalMenuEle = $compile(externalMenuHTML)(externalMenuScope)[0];
        document.body.appendChild(externalMenuEle);
    }

    /**
     * destroy the pop-up for frame create/update
     */
    function destroyExternalHTML() {
        // remove the old scope
        if (externalMenuScope) {
            externalMenuScope.$destroy();
            externalMenuScope = undefined;
        }

        // remove the oldEle
        if (externalMenuEle) {
            if (externalMenuEle.parentNode !== null) {
                externalMenuEle.parentNode.removeChild(externalMenuEle);
            }
            externalMenuEle = undefined;
        }
    }

    /**
     * @name keepAlive
     * @desc keep the session alive
     * @returns {void}
     */
    function keepAlive(): void {
        messageService.emit('query-pixel', {
            insightID: storeService.get('queryInsightID'),
            commandList: [
                {
                    type: 'Pixel',
                    components: ['true'],
                    meta: true,
                    terminal: true,
                },
            ],
        });
    }

    /**
     * @name processExternalMessage
     * @desc process the message coming from external window
     * @returns {void}
     */
    function processExternalMessage(message: any): void {
        let messageObject: any;
        try {
            messageObject = JSON.parse(message.data);
        } catch (e) {
            // not a valid message we're expecting so don't process it
            return;
        }
        // TODO need to standardize to be just messageObject.data or messageObject.payload.
        // make sure we are working with an object
        if (typeof messageObject === 'object') {
            // check the message to see what we need to do
            if (messageObject.message === 'semoss-panel-filter') {
                panelFilter(messageObject.data);
            } else if (messageObject.message === 'semoss-execute-pixel') {
                executePixel(messageObject.data);
            } else if (messageObject.message === 'semoss-execute-sql') {
                // default is that the sql is sent encrypted. if sending sql without encryption, need to pass 'allow-non-secure' property
                if (!messageObject.payload['allow-non-secure']) {
                    // decrypt it first and then pass in the decrypted sql
                    const message = Utility.random('decrypt-pixel');
                    const callback = function (response) {
                        const output = response.pixelReturn[0].output;

                        messageObject.payload.sql = output;
                        // create external HTML pop-up
                        createExternalHTML(messageObject.payload);
                    };
                    const payload = {
                        insightID: '',
                        commandList: [
                            {
                                type: 'pbeDecrypt',
                                components: [
                                    messageObject.payload.sql,
                                    Array.isArray(messageObject.payload.sql),
                                ],
                                terminal: true,
                            },
                        ],
                        responseObject: {
                            response: message,
                            payload: {},
                        },
                    };
                    messageService.once(message, callback);
                    messageService.emit('query-pixel', payload);
                } else {
                    // create external HTML pop-up
                    createExternalHTML(messageObject.payload);
                }
            } else if (messageObject.message === 'semoss-keep-alive') {
                keepAlive();
            }
        }
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        const postMessage = {
            message: 'semoss-loaded',
        };
        // register the mode to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }

        window.addEventListener('message', processExternalMessage, false);

        if (window.parent) {
            // keep checking to make sure things are loaded and CONFIG has returned and is set.
            var interval = setInterval(() => {
                if (
                    document.readyState === 'complete' &&
                    Object.keys(CONFIG).length > 0
                ) {
                    window.parent.postMessage(JSON.stringify(postMessage), '*');
                    clearInterval(interval);
                }
            }, 200);
        }
    }

    return {
        initialize: initialize,
    };
}
