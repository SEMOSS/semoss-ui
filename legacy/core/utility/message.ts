class Message {
    private dynamic = true;
    private listeners: {
        [key: string]: {
            [number: string]: (...args: any) => void;
        };
    } = {};
    private counter = 0;

    constructor(config: { dynamic?: boolean; messages?: string[] }) {
        // allow messages to be added
        if (typeof config.dynamic !== 'undefined') {
            this.dynamic = config.dynamic;
        }

        // register these messages
        if (typeof config.messages !== 'undefined') {
            const messageLen = config.messages.length;
            for (let messageIdx = 0; messageIdx < messageLen; messageIdx++) {
                this.listeners[config.messages[messageIdx]] = {};
            }
        }
    }

    /**
     * @name on
     * @param  message - message string
     * @param  callback - function to run when message is called
     * @desc adds a listener for a given message in the application
     */
    on(message: string, callback: (...args: any) => void): () => void {
        // add in message
        if (!this.listeners.hasOwnProperty(message)) {
            if (this.dynamic) {
                this.listeners[message] = {};
            } else {
                console.error(`${message} is not registered`);
                return () => {};
            }
        }

        // increment the counter
        this.counter++;

        // this is the new id
        const id = this.counter;

        // register the new listener
        this.listeners[message][id] = callback;

        // return a function to destroy the listener
        const destroy = () => {
            delete this.listeners[message][id];
        };

        return destroy;
    }

    /**
     * @name once
     * @param message - message string
     * @param callback - function to run when message is called
     * @desc adds a temporary listener for a given message in the application
     */
    once(message: string, callback: (...args: any) => void): void {
        // instantiate the temporary listener
        const tempListener = this.on(message, () => {
            callback.apply(null, Array.from(arguments));
            tempListener();
        });
    }

    /**
     * @name off
     * @param message - message string
     * @param  callback - callback to remove
     * @desc remove all of the listeners attatched to a message
     */
    off(message: string, callback?: (...args: any) => void): void {
        // add in message
        if (!this.listeners[message]) {
            console.error(`Message does not exist ${message}`);
            return;
        }

        // remove specific callback from message (if there)
        for (const id in this.listeners[message]) {
            if (this.listeners[message].hasOwnProperty(id)) {
                if (!callback || this.listeners[message][id] === callback) {
                    delete this.listeners[message][id];
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
    emit(message: string, payload?: any): void {
        if (!this.listeners.hasOwnProperty(message)) {
            console.error(`${message} is not registered`);
            return;
        }

        // look at the current message's target, if it matches, it is meant for this listener
        for (const id in this.listeners[message]) {
            if (this.listeners[message].hasOwnProperty(id)) {
                this.listeners[message][id].apply(null, [payload]);
            }
        }
    }
}

export default Message;
