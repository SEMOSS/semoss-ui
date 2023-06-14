import angular from 'angular';
import Utility from '../../utility/utility.js';

export default angular
    .module('app.options.service', [])
    .factory('optionsService', optionsService);

optionsService.$inject = ['messageService', 'CONFIG'];

function optionsService(messageService: MessageService, CONFIG) {
    const _state = {},
        _actions = {
            /**
             * @name add-panel
             * @desc action that is triggered to initialize the state
             * @param payload - payload of the message
             */
            'add-panel': function (payload: { widgetId: string }): void {
                let limit = 2000;
                if (
                    _state[payload.widgetId] &&
                    _state[payload.widgetId].limit
                ) {
                    limit = _state[payload.widgetId].limit;
                }

                _state[payload.widgetId] = {
                    widgetOptions: {},
                    initialFrameType: CONFIG.defaultFrameType || 'R',
                    limit: limit,
                };
            },
            /**
             * @name close-panel
             * @desc action that is triggered to destroy the state
             * @param payload - payload of the message
             */
            'close-panel': function (payload: { widgetId: string }): void {
                // empty object to hold the information
                delete _state[payload.widgetId];
            },
        };

    /**
     * @name get
     * @param id the widget id to get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     */
    function get(id: string, accessor?: string): any {
        return _state[id] ? Utility.getter(_state[id], accessor) : false;
    }

    /**
     * @name set
     * @param id the widget id
     * @param accessor string to set the object
     * @param value the value to set the stored value
     */
    function set(id: string, accessor: string, value: any): void {
        if (!_state[id]) {
            _state[id] = {};
        }

        Utility.setter(_state[id], accessor, value);
    }

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

    return {
        initialize: initialize,
        get: get,
        set: set,
    };
}
