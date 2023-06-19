import angular from 'angular';
import Poller from './Poller';
import Loader from './Loader';

/**
 * @name loading.service.js
 * @desc loading screen for polling
 * @returns {object} api
 */
export default angular
    .module('app.loading.service', [])
    .factory('loadingService', loadingService);

loadingService.$inject = ['monolithService', 'messageService', '$timeout'];

function loadingService(
    monolithService: MonolithService,
    messageService: MessageService,
    $timeout: ng.ITimeoutService
) {
    /** * Private */
    const /** Public */
        /** Private */
        _state = {
            pollingCenter: {},
            loadingCenter: {},
        },
        _actions = {
            /**
             * @name start-polling
             * @desc action that is triggered to start polling
             * @param {object} payload - payload of the message
             * @return {void}
             */
            'start-polling': function (payload: {
                id: number;
                listeners: string[];
            }): void {
                // require an id for polling
                if (!payload.id) {
                    return;
                }

                // create a new one if it doesn't exsist (other wise we will use the existing one.....)
                if (!_state.pollingCenter[payload.id]) {
                    // instantiate the new Poller
                    const newPoller = _Poller(payload.id);

                    // register the new poller
                    _state.pollingCenter[payload.id] = newPoller;
                }

                // keep track of how many have been added
                for (
                    let listenerIdx = 0, listenerLen = payload.listeners.length;
                    listenerIdx < listenerLen;
                    listenerIdx++
                ) {
                    messageService.emit('start-loading', {
                        id: payload.listeners[listenerIdx],
                    });

                    _state.pollingCenter[payload.id].register(
                        _state.loadingCenter[payload.listeners[listenerIdx]]
                    );
                }

                // keep track of how many have been added
                _state.pollingCenter[payload.id].add();
            },
            /**
             * @name stop-polling
             * @desc action that is triggered to stop polling
             * @param payload - payload of the message
             */
            'stop-polling': (payload: {
                id: number;
                listeners: string[];
            }): void => {
                // stop a false id from going through
                if (!payload.id) {
                    return;
                }

                if (!_state.pollingCenter[payload.id]) {
                    console.error('Polling Id does not exist ' + payload.id);
                    return;
                }

                // stop the loading
                for (
                    let listenerIdx = 0, listenerLen = payload.listeners.length;
                    listenerIdx < listenerLen;
                    listenerIdx++
                ) {
                    messageService.emit('stop-loading', {
                        id: payload.listeners[listenerIdx],
                    });
                }

                _state.pollingCenter[payload.id].remove();
            },
            /**
             * @name start-loading
             * @desc action that is triggered to start the loading screen
             * @param payload - payload of the message
             */
            'start-loading': (payload: {
                id: number;
                message: string;
            }): void => {
                // create a new one if it doesn't exit (other wise we will use the existing one.....)
                if (!_state.loadingCenter[payload.id]) {
                    // instantiate the new Poller
                    const newLoader = _Loader(payload.id);

                    // register the new poller
                    _state.loadingCenter[payload.id] = newLoader;
                }

                // keep track of how many have been added
                _state.loadingCenter[payload.id].add(payload.message);
            },
            /**
             * @name stop-loading
             * @desc action that is triggered to stop the loading screen
             * @param payload - payload of the message
             */
            'stop-loading': (payload: { id: number }): void => {
                if (!_state.loadingCenter[payload.id]) {
                    console.error('Loading Id does not exist ' + payload.id);
                    return;
                }

                _state.loadingCenter[payload.id].remove();
            },
            /**
             * @name clear-loading
             * @desc action that is triggered to stop all of the loading screen
             */
            'clear-loading': (): void => {
                for (const id in _state.pollingCenter) {
                    if (_state.pollingCenter.hasOwnProperty(id)) {
                        _state.pollingCenter[id].destroy();
                    }
                }

                for (const id in _state.loadingCenter) {
                    if (_state.loadingCenter.hasOwnProperty(id)) {
                        _state.loadingCenter[id].destroy();
                    }
                }

                // trigger the digest
                $timeout();
            },
        };

    /** Public */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // register the loading to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /** Private */
    /**
     * @name _Loader
     * @param {number} id - id of the loader
     * @desc creates an instance of a loader
     * @returns {object} Loader API
     */
    function _Loader(id: number): Loader {
        /** Public */
        const config: {
            id: number;
            counter: number;
            messageList: string[];
            active: boolean;
            loadingTimeout: ReturnType<typeof setTimeout> | null;
            removeTimeout: ReturnType<typeof setTimeout> | null;
        } = {
            id: id,
            counter: 0,
            messageList: [],
            active: true,
            loadingTimeout: null,
            removeTimeout: null,
        };

        /** Private */
        /** Public */
        /**
         * @name add
         * @desc add to the counter
         * @param message - message to add
         */
        function add(message: string): void {
            // increment the counter
            config.counter++;

            if (message) {
                config.messageList.push(message);
            }
        }

        /**
         * @name update
         * @desc update the loader
         * @param messageList - arry of messages
         */
        function update(messageList: string[]): void {
            // remove the timeout (this is the first message that hasn't kicked off yet. We are sending a new one)
            if (config.loadingTimeout !== null) {
                clearTimeout(config.loadingTimeout);
            }

            // update the message
            config.messageList = config.messageList.concat(messageList);

            // message out
            if (messageList.length !== 0) {
                _dispatch();
            }
        }

        /**
         * @name remove
         * @desc remove the counter
         */
        function remove(): void {
            // decrement the counter
            config.counter--;

            // check if we need to remove at the end
            if (config.removeTimeout !== null) {
                clearTimeout(config.removeTimeout);
            }

            config.removeTimeout = setTimeout(() => {
                if (config.counter <= 0) {
                    destroy();
                }
            }, 0);
        }

        /**
         * @name destroy
         * @desc destroy the listener
         */
        function destroy(): void {
            // remove the timeout (this is the first message that hasn't kicked off yet. We are sending a new one in the destroy)
            if (config.loadingTimeout !== null) {
                clearTimeout(config.loadingTimeout);
            }

            // make it inactive
            config.active = false;
            config.messageList = [];

            _dispatch();

            // remove it
            delete _state.loadingCenter[config.id];
        }

        /** Private */
        /**
         * @name _dispatch
         * @desc send a message
         */
        function _dispatch(): void {
            messageService.emit('update-loading', {
                id: config.id,
                active: config.active,
                messageList: config.messageList,
            });

            // trigger the digest
            $timeout();
        }

        if (config.counter === 0) {
            config.loadingTimeout = setTimeout(() => {
                _dispatch();
            }, 1000);
        }

        return {
            add: add,
            remove: remove,
            update: update,
            destroy: destroy,
        };
    }

    /**
     * @name _Poller
     * @param id - id of the poller
     * @desc creates an instance of a poller
     * @returns {object} Poller API
     */
    function _Poller(id: number): Poller {
        /** Public */
        const config: {
            id: number;
            counter: number;
            listeners: Loader[];
            delay: number;
            pollTimeout: ReturnType<typeof setTimeout> | null;
            removeTimeout: ReturnType<typeof setTimeout> | null;
        } = {
            id: id,
            counter: 0,
            listeners: [],
            delay: 1500,
            pollTimeout: null,
            removeTimeout: null,
        };

        /** Public */
        /**
         * @name register
         * @desc register listeners to the poller
         * @param listener - listener to update
         */
        function register(listener: Loader): void {
            config.listeners.push(listener);
        }

        /**
         * @name add
         * @desc add to the counter
         */
        function add(): void {
            // increment the counter
            config.counter++;
        }

        /**
         * @name remove
         * @desc remove the counter
         */
        function remove(): void {
            // decrement the counter
            config.counter--;

            // check if we need to remove at the end
            if (config.removeTimeout !== null) {
                clearTimeout(config.removeTimeout);
            }

            config.removeTimeout = setTimeout(() => {
                if (config.counter <= 0) {
                    destroy();
                }
            }, 0);
        }

        /**
         * @name destroy
         * @desc destroy the poller
         */
        function destroy(): void {
            // remove the timeout
            if (config.pollTimeout !== null) {
                clearTimeout(config.pollTimeout);
            }

            // delete it
            delete _state.pollingCenter[config.id];
        }

        /** Private */
        /**
         * @name _updateMessage
         * @desc update the poller message (and dispatch if necessary)
         * @param messageList - dispatch a message?
         */
        function _updateLoader(messageList: string[]): void {
            for (
                let listenerIdx = 0, listenerLen = config.listeners.length;
                listenerIdx < listenerLen;
                listenerIdx++
            ) {
                config.listeners[listenerIdx].update(messageList);
            }
        }

        /**
         * @name _tick
         * @desc poll for the next loading message
         * @param delay - delay to use for the _tick
         */
        function _tick(delay: number): void {
            if (config.pollTimeout !== null) {
                clearTimeout(config.pollTimeout);
            }

            config.pollTimeout = setTimeout(() => {
                // TODO if config.id is false...don't run it?
                monolithService.console(String(config.id)).then(
                    (response: any): void => {
                        if (response.message.length === 0) {
                            // lengthen for empty response
                            if (config.delay < 10000) {
                                config.delay += 1500;
                            }
                        } else {
                            config.delay = 1500; // reset
                        }

                        _updateLoader(response.message);

                        // WARNING: There are issues with UnknownJob / Complete messing with polling / turning off the loading screen

                        // // this is indicating we're done. so stop all loading for this insight
                        // if (
                        //   response.status === "UnknownJob" ||
                        //   response.status === "Complete"
                        // ) {
                        //   messageService.emit("clear-loading");
                        //   return;
                        // }

                        // if poller has not been removed, we will continue to tick
                        if (_state.pollingCenter[config.id]) {
                            _tick(config.delay);
                        }
                    },
                    (error: any): void => {
                        // lengthen for errors
                        if (config.delay < 10000) {
                            config.delay += 1500;
                        }

                        // update the loader
                        if (error.statusText) {
                            _updateLoader([error.statusText]);
                        } else if (typeof error === 'string') {
                            _updateLoader([error]);
                        } else {
                            _updateLoader(['ERROR']);
                        }

                        // if poller has not been removed, we will continue to tick
                        if (_state.pollingCenter[config.id]) {
                            _tick(config.delay);
                        }
                    }
                );
            }, delay);
        }

        if (config.counter === 0) {
            _tick(1000);
        }

        return {
            register: register,
            add: add,
            remove: remove,
            destroy: destroy,
        };
    }

    return {
        initialize: initialize,
    };
}
