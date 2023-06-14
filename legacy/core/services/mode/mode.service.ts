import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.mode.service', [])
    .factory('modeService', modeService);

modeService.$inject = ['messageService', 'storeService', 'widgetService'];

function modeService(
    messageService: MessageService,
    storeService: StoreService,
    widgetService: WidgetService
) {
    const /** Public */
        /** Private */
        _state = {},
        _actions = {
            /**
             * @name add-panel
             * @desc action that is triggered to initialize the mode
             * @param payload - payload of the message
             */
            'add-panel': (payload: { widgetId: string }): void => {
                _state[payload.widgetId] = {
                    selected: 'default-mode',
                    available: [],
                    initializedMode: {},
                };

                // reset on start
                messageService.emit('reset-mode', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name close-panel
             * @desc action that is triggered to destroy the mode
             * @param payload - payload of the message
             */
            'close-panel': (payload: { widgetId: string }): void => {
                // empty object to hold the information
                delete _state[payload.widgetId];
            },
            /**
             * @name reset-mode
             * @desc action that is triggered when to change the mode
             * @param payload - payload of the message
             */
            'reset-mode': (payload: { widgetId: string }): void => {
                let active: string = storeService.getWidget(
                        payload.widgetId,
                        'active'
                    ),
                    selectedLayout: string = storeService.getWidget(
                        payload.widgetId,
                        'view.' + active + '.layout'
                    ),
                    selectedType: string = storeService.getWidget(
                        payload.widgetId,
                        'view.' + active + '.options.type'
                    ),
                    modeConfig: any = widgetService.getModeConfig(),
                    widget: string =
                        widgetService.getActiveVisualizationId(
                            selectedLayout,
                            selectedType
                        ) || '',
                    visualizationConfig: any =
                        widgetService.getSpecificConfig(
                            widget,
                            'visualization'
                        ) || {},
                    visibleModes: string[] =
                        visualizationConfig.visibleModes || [],
                    keepSelectedMode = false;

                // available modes
                _state[payload.widgetId].available = [];
                for (const i in modeConfig) {
                    if (visibleModes.indexOf(i) > -1) {
                        _state[payload.widgetId].available.push(modeConfig[i]);
                        if (
                            modeConfig[i].id ===
                            _state[payload.widgetId].selected
                        ) {
                            keepSelectedMode = true;
                        }
                    }
                }

                if (!keepSelectedMode) {
                    _state[payload.widgetId].selected = 'default-mode';
                }

                if (active === 'visualization') {
                    if (
                        !_state[payload.widgetId].initializedMode[
                            selectedLayout
                        ]
                    ) {
                        _state[payload.widgetId].initializedMode = {};
                        if (visualizationConfig.initialMode) {
                            _state[payload.widgetId].initializedMode[
                                selectedLayout
                            ] = visualizationConfig.initialMode;
                            _state[payload.widgetId].selected =
                                visualizationConfig.initialMode;
                        }
                    }
                }

                messageService.emit('update-mode', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name change-mode
             * @desc action that is triggered to reset the mode
             * @param payload - payload of the message
             */
            'change-mode': (payload: {
                widgetId: string;
                mode: string;
            }): void => {
                if (payload.mode !== _state[payload.widgetId].selected) {
                    _state[payload.widgetId].selected = payload.mode;
                    messageService.emit('update-mode', {
                        widgetId: payload.widgetId,
                    });
                }
            },
            /**
             * @name update-task
             * @desc action that is triggered to reset the mode
             * @param payload - payload of the message
             */
            'update-task': (payload: { widgetId: string }): void => {
                messageService.emit('reset-mode', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name update-view
             * @desc action that is triggered to reset the mode
             * @param payload - payload of the message
             */
            'update-view': (payload: { widgetId: string }): void => {
                messageService.emit('reset-mode', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name added-data
             * @desc action that is triggered to reset the mode
             * @param payload - payload of the message
             */
            'added-data': (payload: { widgetId: string }): void => {
                messageService.emit('reset-mode', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name update-tool
             * @desc action that is triggered to reset the mode
             * @param payload - payload of the message
             */
            'update-tool': (payload: { widgetId: string }): void => {
                messageService.emit('reset-mode', {
                    widgetId: payload.widgetId,
                });
            },
        };

    /** Public */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // register the mode to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name get
     * @param widgetId - the widget id to grab
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(widgetId: string, accessor?: string): any {
        return Utility.getter(_state[widgetId], accessor);
    }

    return {
        initialize: initialize,
        get: get,
    };
}
