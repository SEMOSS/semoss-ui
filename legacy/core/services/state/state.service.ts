import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.state.service', [])
    .factory('stateService', stateService);

stateService.$inject = ['messageService', 'widgetService'];

function stateService(
    messageService: MessageService,
    widgetService: WidgetService
) {
    const _state = {}, // not initially set
        _actions = {
            /**
             * @name add-panel
             * @desc action that is triggered to initialize the state
             * @param payload - payload of the message
             */
            'add-panel': (payload: { widgetId: string }): void => {
                const config = widgetService.get('widgets');

                // empty object to hold the information
                _state[payload.widgetId] = {};

                // TODO: there may be an information mismatch based on when the widgets are loaded in
                for (const widget in config) {
                    if (config.hasOwnProperty(widget)) {
                        _state[payload.widgetId][widget] = Utility.freeze(
                            config[widget].state
                        );
                    }
                }
            },
            /**
             * @name close-panel
             * @desc action that is triggered to destroy the event
             * @param payload - payload of the message
             */
            'close-panel': (payload: { widgetId: string }): void => {
                // empty object to hold the information
                delete _state[payload.widgetId];
            },
        };

    /**
     * @name initialize
     * @desc called when the module is loaded
     * @return {void}
     */
    function initialize(): void {
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name set
     * @desc sets the state
     * @param id the widget id to set to
     * @param accessor - accessor to add to
     * @param content - content to set
     */
    function set(id: string, accessor: string, content: any): void {
        if (accessor) {
            Utility.setter(_state[id], accessor, Utility.freeze(content));
        }

        Utility.setter(_state[id], accessor, Utility.freeze(content));
    }

    /**
     * @name get
     * @param id the widget id to set to
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the state
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
        set: set,
    };
}
