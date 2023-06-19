import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.handle.service', [])
    .factory('handleService', handleService);

handleService.$inject = ['messageService', 'storeService', 'widgetService'];

function handleService(
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
             * @desc action that is triggered to initialize the handle
             * @param payload - payload of the message
             */
            'add-panel': (payload: { widgetId: string }): void => {
                let widgetConfig: any[];

                _state[payload.widgetId] = {
                    available: {},
                    selected: false,
                };

                // get the initial widgetConfig
                widgetConfig = widgetService.get('widgets');

                // clear out old options
                _state[payload.widgetId].available = {};
                // only add if it had a widgetList and it can be shown
                for (const i in widgetConfig) {
                    if (
                        widgetConfig[i].widgetList &&
                        widgetConfig[i].widgetList.showOn &&
                        widgetConfig[i].widgetList.showOn !== 'none'
                    ) {
                        _state[payload.widgetId].available[i] = widgetConfig[i];
                    }
                }

                messageService.emit('reset-handle-list', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name close-panel
             * @desc action that is triggered to destroy the handle
             * @param payload - payload of the message
             */
            'close-panel': (payload: { widgetId: string }): void => {
                // empty object to hold the information
                delete _state[payload.widgetId];
            },
            /**
             * @name reset-handle-list
             * @desc action that is triggered to reset the handle list
             * @param payload - payload of the message
             */
            'reset-handle-list': (payload: { widgetId: string }): void => {
                let active: string = storeService.getWidget(
                        payload.widgetId,
                        'active'
                    ),
                    selectedType: string,
                    selectedLayout: string,
                    activeWidget: string;

                // TODO: Break Out;
                if (active === 'visualization') {
                    selectedType = storeService.getWidget(
                        payload.widgetId,
                        'view.' + active + '.options.type'
                    );
                    selectedLayout = storeService.getWidget(
                        payload.widgetId,
                        'view.' + active + '.layout'
                    );
                    activeWidget = widgetService.getActiveVisualizationId(
                        selectedLayout,
                        selectedType
                    );
                } else {
                    activeWidget = active;
                }

                for (const i in _state[payload.widgetId].available) {
                    if (_state[payload.widgetId].available.hasOwnProperty(i)) {
                        _state[payload.widgetId].available[
                            i
                        ].widgetList.hidden = _hideHandle(
                            _state[payload.widgetId].available[i],
                            widgetService.getSpecificConfig(activeWidget)
                        );
                    }
                }

                messageService.emit('update-handle-list', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name change-handle
             * @desc action that is triggered to change the handle
             * @param payload - payload of the message
             */
            'change-handle': (payload: {
                widgetId: string;
                handle: string;
            }): void => {
                // change view for handles displayed as a panel
                let selectedHandleConfig: any,
                    panelId: number,
                    active: string = storeService.getWidget(
                        payload.widgetId,
                        'active'
                    ),
                    viewComponents: PixelCommand[];

                _state[payload.widgetId].selected = payload.handle;

                // need to get the config with the selectedHandle
                selectedHandleConfig = widgetService.getSpecificConfig(
                    _state[payload.widgetId].selected
                );

                // if there's a view for this widget and it's not already loaded as the view, then we will update and load the view defined in the config
                if (
                    _state[payload.widgetId].selected &&
                    active !== _state[payload.widgetId].selected &&
                    selectedHandleConfig.hasOwnProperty('view') &&
                    selectedHandleConfig.view
                ) {
                    panelId = storeService.getWidget(
                        payload.widgetId,
                        'panelId'
                    );
                    viewComponents = [
                        {
                            type: 'panel',
                            components: [panelId],
                            meta:
                                _state[payload.widgetId].selected === 'source',
                        },
                        {
                            type: 'setPanelView',
                            components: [_state[payload.widgetId].selected],
                            terminal: true,
                        },
                    ];

                    messageService.emit('execute-pixel', {
                        insightID: storeService.getWidget(
                            payload.widgetId,
                            'insightID'
                        ),
                        commandList: viewComponents,
                    });
                }

                messageService.emit('update-handle', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name update-task
             * @desc action that is called in response to the task changing
             * @param payload - payload of the message
             */
            'update-task': (payload: { widgetId: string }): void => {
                messageService.emit('reset-handle-list', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name update-view
             * @desc action that is called in response to the view changing
             * @param payload - payload of the message
             */
            'update-view': (payload: { widgetId: string }): void => {
                messageService.emit('reset-handle-list', {
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
        // register the actions
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name get
     * @param id - the widget id to grab
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     */
    function get(id: string, accessor?: string): any {
        return Utility.getter(_state[id], accessor);
    }

    /** Private */
    /**
     * @name _hideHandle
     * @desc returns a bool for if a handle should be shown or hidden
     * @param currentWidgetConfig -
     * @param layoutConfig -
     * @returns show or hide of the handle
     */
    function _hideHandle(currentWidgetConfig: any, layoutConfig: any): boolean {
        // it is hidden if it doesn't appear
        if (currentWidgetConfig.widgetList === undefined) {
            return false;
        }
        if (currentWidgetConfig.widgetList.showOn === 'none') {
            return true;
        }

        // always on except when it is hidden on the layout
        if (currentWidgetConfig.widgetList.showOn === 'all') {
            if (
                layoutConfig.widgetList &&
                layoutConfig.widgetList.hideHandles
            ) {
                if (
                    layoutConfig.widgetList.hideHandles.indexOf(
                        currentWidgetConfig.id
                    ) > -1
                ) {
                    return true;
                }
            }

            return false;
        }

        // check the tags it is available on
        if (layoutConfig.widgetList && layoutConfig.widgetList.tags) {
            // go thorough each tag in the layout and check if it is in the selectedConfig
            for (let i = 0; i < layoutConfig.widgetList.tags.length; i++) {
                // need to check if we want to hide the specific handle
                if (
                    layoutConfig.widgetList &&
                    layoutConfig.widgetList.hideHandles
                ) {
                    if (
                        layoutConfig.widgetList.hideHandles.indexOf(
                            currentWidgetConfig.id
                        ) > -1
                    ) {
                        return true;
                    }
                }

                if (
                    currentWidgetConfig.widgetList.showOn.indexOf(
                        layoutConfig.widgetList.tags[i]
                    ) > -1
                ) {
                    return false; // tag is there so it is visible
                }
            }
        }

        return true;
    }

    return {
        initialize: initialize,
        get: get,
    };
}
