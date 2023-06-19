import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.selected.service', [])
    .factory('selectedService', selectedService);

selectedService.$inject = ['messageService'];

function selectedService(messageService: MessageService) {
    const /** Public */
        /** Private */
        _state = {},
        _actions = {
            /**
             * @name add-panel
             * @desc action that is triggered to initialize the selected
             * @param payload - payload of the message
             */
            'add-panel': (payload: { widgetId: string }): void => {
                if (!_state[payload.widgetId]) {
                    _state[payload.widgetId] = {};
                }

                messageService.emit('update-selected', {
                    widgetId: payload.widgetId,
                });
            },
            /**
             * @name change-selected
             * @desc action that is triggered to reset the selected
             * @param payload - payload of the message
             */
            'change-selected': (payload: {
                widgetId: string;
                row: string;
                concept: string;
                selected: string;
            }): void => {
                if (!_state[payload.widgetId]) {
                    _state[payload.widgetId] = {};
                }
                _state[payload.widgetId].selected = payload.selected;
                _state[payload.widgetId].row = payload.row;
                _state[payload.widgetId].concept = payload.concept;
                messageService.emit('update-selected', {
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
        // register the selected to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name get
     * @param widgetId - the widget to grab from
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(widgetId: string, accessor?: string): any {
        return Utility.getter(_state[widgetId], accessor);
    }

    /** Private */

    return {
        initialize: initialize,
        get: get,
    };
}
