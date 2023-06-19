import angular from 'angular';
import ListenerConfig from './ListenerConfig';

/**
 * @name message.service.js
 * @desc handles listener communction across SEMOSS
 */
export default angular
    .module('app.message.service', [])
    .factory('messageService', messageService);

messageService.$inject = [];

function messageService() {
    const _messageCenter: any = {};
    let _messageCounter = 0; // counter for the number of registered messages
    /**
     * @name on
     * @param  {string} message - message string
     * @param  {function} callback - function to run when message is called
     * @desc adds a listener for a given message in the application
     * @returns {function} destroy - function returned to remove listener from the center
     */
    function on(message: string, callback: (...args: any) => void): () => void {
        let newListener: ListenerConfig; // listener that will be registered

        // add in message
        if (!_messageCenter[message]) {
            _messageCenter[message] = [];
        }

        // increment the counter
        _messageCounter++;

        // instantiate the new listener
        newListener = _Listener(message, callback, _messageCounter);

        // register the new listener
        _messageCenter[message][_messageCounter] = newListener;

        // return the listener's destroy function for easy destruction
        return newListener.destroy;
    }

    /**
     * @name once
     * @param message - message string
     * @param callback - function to run when message is called
     * @desc adds a temporary listener for a given message in the application
     */
    function once(message: string, callback: (...args: any) => void): void {
        // instantiate the temporary listener
        var tempListener = on(message, function () {
            callback.apply(null, Array.from(arguments));
            tempListener();
        });
    }

    /**
     * @name off
     * @param  {string} message - message string
     * @param  {function} callback - callback to remove
     * @desc remove all of the listeners attatched to a message
     * @returns {void}
     */
    function off(message: string, callback?: (...args: any) => void): void {
        let id: string;
        // add in message
        if (!_messageCenter[message]) {
            console.error('Message does not exist ' + message);
            return;
        }

        // remove all messages
        if (!callback) {
            for (id in _messageCenter[message]) {
                if (_messageCenter[message].hasOwnProperty(id)) {
                    _messageCenter[message][id].destroy();
                }
            }

            return;
        }

        // remove specific callback from message
        for (id in _messageCenter[message]) {
            if (_messageCenter[message].hasOwnProperty(id)) {
                // this will check if they are the same function (memoray)
                if (_messageCenter[message][id].callback === callback) {
                    _messageCenter[message][id].destroy();
                }
            }
        }
    }

    /**
     * @name emit
     * @param message - message string
     * @param payload - payload to pass into the callback
     * @desc flushes the message queue
     */
    function emit(message: string, payload?: any): void {
        let currentMessage: { message: string; payload: any }, c: string;

        currentMessage = {
            message: message,
            payload: payload,
        };

        // look at the current message's target, if it matches, it is meant for this listener
        for (c in _messageCenter[currentMessage.message]) {
            if (_messageCenter[currentMessage.message].hasOwnProperty(c)) {
                _messageCenter[currentMessage.message][c].callback.apply(null, [
                    currentMessage.payload,
                ]);
            }
        }
    }

    /**
     * @name Listener
     * @param message - message string
     * @param callback - function to run when message is called
     * @param id - id of the listener
     * @desc creates an instance of a listener that can be called or removed
     */
    function _Listener(
        message: string,
        callback: (...args: any) => void,
        id: number
    ): ListenerConfig {
        let config: ListenerConfig;

        /**
         * @name destroy
         * @desc destroy the listener
         */
        const destroy = (): void => {
            delete _messageCenter[config.message][config.id];
        };

        // initialize the listener, checking if things are appropriate
        // needs to have a callbck
        if (!message) {
            console.error('Listener does not have message');
        }

        // needs to have a callbck
        if (!callback || typeof callback !== 'function') {
            console.error('Listener does not have callback: ' + message);
        }

        config = {
            id: id,
            message: message,
            callback: callback,
            destroy: destroy,
        };

        return config;
    }
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {}

    return {
        on: on,
        once: once,
        off: off,
        emit: emit,
        initialize: initialize,
    };
}
