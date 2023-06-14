import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.app.service', [])
    .factory('appService', appService);

appService.$inject = [
    'ENDPOINT',
    '$transitions',
    '$state',
    'monolithService',
    'messageService',
    'optionsService',
];

function appService(
    ENDPOINT: EndPoint,
    $transitions,
    $state,
    monolithService: MonolithService,
    messageService: MessageService,
    optionsService: OptionsService
) {
    const /** Public */
        /** Private */
        _state = {
            newAppId: 'NEWSEMOSSAPP',
            selectedApp: 'NEWSEMOSSAPP',
            available: {},
        },
        _actions = {
            /**
             * @name open-app
             * @desc action that is triggered to open and load an app (on the backend)
             * @param payload - payload of the message
             */
            'open-app': (payload: { appId: string; message: string }): void => {
                const message: string = Utility.random('open-app');
                _state.selectedApp = payload.appId;
                // check if it alraedy has been loaded
                if (_state.available.hasOwnProperty(payload.appId)) {
                    messageService.emit(payload.message, {
                        type: 'success',
                        message: `${
                            _state.available[payload.appId].name
                        } is already opened`,
                    });
                    return;
                }

                messageService.once(
                    message,
                    (response: PixelReturnPayload): void => {
                        const output = response.pixelReturn[0].output,
                            type = response.pixelReturn[0].operationType;

                        if (type.indexOf('ERROR') > -1) {
                            messageService.emit(payload.message, {
                                type: 'error',
                                message: output,
                            });

                            return;
                        }

                        _state.available[output.database_id] = {
                            app_id: output.database_id,
                            name: String(output.database_name).replace(
                                /_/g,
                                ' '
                            ),
                            image: generateDatabaseImageURL(output.database_id),
                            type: output.database_type,
                        };

                        messageService.emit(payload.message, {
                            type: 'success',
                            message: `Successfully opened ${output.database_name}`,
                        });

                        messageService.emit('opened-app', {
                            appId: output.database_id,
                        });
                    }
                );

                messageService.emit('query-pixel', {
                    commandList: [
                        {
                            type: 'openDatabase',
                            components: [payload.appId],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
            },
            /**
             * @name close-app
             * @desc action that is triggered to close an app
             * @param payload - payload of the message
             */
            'close-app': (payload: { appId: string }): void => {
                // remove the app
                if (_state.available[payload.appId]) {
                    delete _state.available[payload.appId];
                }

                // if the selected app is closed, we will default to the new app
                if (_state.selectedApp === payload.appId) {
                    _state.selectedApp = _state.newAppId;
                }

                // remove the historical record
                $state.go('home.catalog');
            },
            /**
             * @name close-all-apps
             * @desc close all of the opened apps
             */
            'close-all-apps': (): void => {
                _state.selectedApp = _state.newAppId;
                for (const appId in _state.available) {
                    if (_state.available.hasOwnProperty(appId)) {
                        messageService.emit('close-app', {
                            appId: appId,
                        });
                    }
                }
            },
            /**
             * @name delete-app
             * @desc action that is triggered to delete an app
             * @param {object} payload - payload of the message
             * @return {void}
             */
            'delete-project': (payload: {
                appId: string;
                closeApp: boolean;
            }): void => {
                const message = Utility.random('delete-app-start');

                // register message to come back to
                messageService.once(
                    message,
                    (response: PixelReturnPayload): void => {
                        const output = response.pixelReturn[0].output;

                        if (output) {
                            messageService.emit('delete-app-end', {
                                appId: payload.appId,
                                success:
                                    response.pixelReturn[0].operationType[0] ===
                                    'ERROR'
                                        ? false
                                        : true,
                            });

                            if (payload.closeApp) {
                                messageService.emit('close-app', {
                                    appId: payload.appId,
                                });
                            }
                        }
                    }
                );

                messageService.emit('query-pixel', {
                    commandList: [
                        {
                            meta: true,
                            type: 'deleteProject',
                            components: [[payload.appId]],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
            },
            /**
             * @name delete-app
             * @desc action that is triggered to delete an app
             * @param {object} payload - payload of the message
             * @return {void}
             */
            'delete-database': (payload: {
                appId: string;
                closeApp: boolean;
            }): void => {
                const message = Utility.random('delete-app-start');

                // register message to come back to
                messageService.once(
                    message,
                    (response: PixelReturnPayload): void => {
                        const output = response.pixelReturn[0].output;

                        if (output) {
                            messageService.emit('delete-app-end', {
                                appId: payload.appId,
                                success:
                                    response.pixelReturn[0].operationType[0] ===
                                    'ERROR'
                                        ? false
                                        : true,
                            });

                            if (payload.closeApp) {
                                messageService.emit('close-app', {
                                    appId: payload.appId,
                                });
                            }
                        }
                    }
                );

                messageService.emit('query-pixel', {
                    commandList: [
                        {
                            meta: true,
                            type: 'deleteDatabase',
                            components: [[payload.appId]],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
            },
            'change-app-image': (payload: {
                appId: string;
                file: File;
            }): void => {
                monolithService
                    .uploadProjectImage(payload.appId, payload.file)
                    .then(
                        (response: any): void => {
                            if (response) {
                                messageService.emit('alert', {
                                    color: 'success',
                                    text: response.message,
                                });
                            }

                            _state.available[payload.appId].image =
                                generateProjectImageURL(payload.appId);
                            // store the change in image so we can reload in landing page
                            optionsService.set(
                                'imageUpdates',
                                payload.appId,
                                _state.available[payload.appId].image
                            );

                            messageService.emit('update-app');
                        },
                        (error: { message: string }): void => {
                            messageService.emit('alert', {
                                color: 'error',
                                text: error.message,
                            });
                        }
                    );
            },
            /**
             * @name delete-app-insights
             * @desc action that is triggered to dete an app's insights
             * @param {object} payload - payload of the message
             * @return {void}
             */
            'delete-app-insights': (payload: {
                appId: string;
                insights: any[];
            }): void => {
                const message = Utility.random('delete-app-insights-start');

                // register message to come back to
                messageService.once(
                    message,
                    (response: PixelReturnPayload): void => {
                        if (
                            response.pixelReturn[0].operationType[0] === 'ERROR'
                        ) {
                            messageService.emit('delete-app-insights-end', {
                                appId: payload.appId,
                                deletedInsights: payload.insights,
                                success: false,
                            });
                        } else {
                            const output = response.pixelReturn[0].output;
                            if (output) {
                                messageService.emit('delete-app-insights-end', {
                                    appId: payload.appId,
                                    deletedInsights: payload.insights,
                                    success: true,
                                });
                            }
                        }
                    }
                );

                messageService.emit('query-pixel', {
                    commandList: [
                        {
                            meta: true,
                            type: 'deleteInsight',
                            components: [payload.appId, payload.insights],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
            },
        };

    /** Public */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // register the selected to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }

        $transitions.onSuccess({}, (): void => {
            const current: string = $state.current.name;

            if (current.lastIndexOf('home.database') === 0) {
                _state.selectedApp = $state.params.app;

                messageService.emit('update-app');
            } else if (current.lastIndexOf('home.build') === 0) {
                // _state.selectedApp = _state.newAppId;

                messageService.emit('update-app');
            } else {
                // if user navigates away from the app, we will reset it to the new app
                _state.selectedApp = _state.newAppId;
            }
        });
    }

    /**
     * @name get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    /**
     * @name getApp
     * @param appId - id of the the app to grab information for
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function getApp(appId: string, accessor?: string): any {
        if (!_state.available[appId]) {
            return false;
        }

        return Utility.getter(_state.available[appId], accessor);
    }

    /**
     * @name generateProjectImageURL
     * @desc generates the imageURL
     * @param appId - id to generate for
     * @returns image url
     */
    function generateProjectImageURL(appId: string): string {
        return (
            ENDPOINT.URL + '/api/project-' + appId + '/projectImage/download'
        );
    }

    /**
     * @name generateDatabaseImageURL
     * @desc generates the imageURL
     * @param appId - id to generate for
     * @returns image url
     */
    function generateDatabaseImageURL(appId: string): string {
        return ENDPOINT.URL + '/api/app-' + appId + '/appImage/download';
    }

    /**
     * @name generateInsightImageURL
     * @desc generate the url for insight url
     * @returns insight url
     */
    function generateInsightImageURL(
        projectId: string,
        insightId?: string
    ): string {
        let url =
            ENDPOINT.URL +
            '/api/project-' +
            projectId +
            '/insightImage/download';

        if (insightId) {
            url += '?rdbmsId=' + insightId;
        }

        return url;
    }

    return {
        initialize: initialize,
        get: get,
        getApp: getApp,
        generateProjectImageURL: generateProjectImageURL,
        generateDatabaseImageURL: generateDatabaseImageURL,
        generateInsightImageURL: generateInsightImageURL,
    };
}
