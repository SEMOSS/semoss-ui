import Utility from '../../utility/utility.js';
import angular from 'angular';

export default angular
    .module('app.alert.service', [])
    .factory('alertService', alertService);

alertService.$inject = ['messageService'];

function alertService(messageService: MessageService) {
    const _state = {},
        _actions = {
            alert: (payload: {
                color: string;
                text: string;
                insightID?: string;
            }): void => {
                const insightID =
                    payload && payload.insightID ? payload.insightID : '';

                if (!_state.hasOwnProperty(insightID)) {
                    _state[insightID] = [];
                }

                _state[insightID].push({
                    color: payload.color,
                    text: payload.text,
                });
            },
        };

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
    };
}
