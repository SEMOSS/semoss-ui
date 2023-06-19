import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.widget-tab.service', [])
    .factory('widgetTabService', widgetTabService);

widgetTabService.$inject = ['messageService'];

function widgetTabService(messageService: MessageService) {
    const /** Public */
        /** Private */
        _state: any = {},
        _actions = {
            /**
             * @name add-panel
             * @desc action that is triggered to initialize the widget-tab
             * @param payload - payload of the message
             */
            'add-panel': (payload: {
                widgetId: string;
                view?: string;
            }): void => {
                _state[payload.widgetId] = {
                    selected: 'view',
                };

                if (payload.view === 'pipeline') {
                    _state[payload.widgetId] = {
                        selected: 'enrich',
                    };
                }

                messageService.emit('update-widget-tab', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name close-panel
             * @desc action that is triggered to destroy the widget-tab
             * @param payload - payload of the message
             */
            'close-panel': (payload: { widgetId: string }): void => {
                // empty object to hold the information
                delete _state[payload.widgetId];
            },
            /**
             * @name change-widget-tab
             * @desc action that is triggered to change the widget-tab
             * @param payload - payload of the message
             */
            'change-widget-tab': (payload: {
                widgetId: string;
                tab: string;
            }): void => {
                // only send a message if they are not equal... otherwise no need to do anything
                if (_state[payload.widgetId].selected !== payload.tab) {
                    _state[payload.widgetId].selected = payload.tab;

                    messageService.emit('update-widget-tab', {
                        widgetId: payload.widgetId,
                    });
                }
            },
            /**
             * @name update-handle
             * @desc action that is triggered to change the handle changes
             * @param payload - payload of the message
             */
            'update-handle': (payload: { widgetId: string }): void => {
                if (payload.widgetId) {
                    if (_state[payload.widgetId].selected !== 'menu') {
                        messageService.emit('change-widget-tab', {
                            tab: 'menu',
                            widgetId: payload.widgetId,
                        });
                    }
                }
            },
        };

    /** Public */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
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
     * @returns value of the requested object
     */
    function get(id: string, accessor?: string): any {
        if (!_state[id]) {
            return false;
        }

        return Utility.getter(_state[id], accessor);
    }

    return {
        initialize: initialize,
        get: get,
    };
}
