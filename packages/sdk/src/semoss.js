export class Semoss {
    _endpoint = '';
    _store = {
        /**
         * Track if the listener is standalone or embedded
         */
        mode: 'standalone',

        /**
         * Track if the listener is initalized
         */
        _isInitialized: false,

        /**
         * Track if the listener is loading
         */
        _isLoading: false,

        /**
         * Insight ID of the current instance
         */
        insightId: '',

        /**
         * Configuration information stored with the app
         */
        config: {},
    };

    _embedded = {
        /**
         * Callbacks that are stored for messages dispatched
         */
        callbacks: {},
    };

    constructor(config = {}) {
        // set the endpoint
        this._endpoint = config.endpoint;
    }

    /** Actions */
    /**
     * Initialize the insight
     */
    initialize = async () => {
        // toggle it to not be initalized
        this._store._isInitialized = false;
        this._store._isLoading = true;

        // reset the insightId
        this._store.insightId;

        // initialize the mode
        this._initializeMode();

        // start the insight
        await this._initializeInsight();

        // mark it as initialized
        this._store._isInitialized = true;
        this._store._isLoading = false;

        // return the config
        return this._store.config;
    };

    /**
     * Destroy the insight
     */
    destroy = async () => {
        // toggle it to not be initalized
        this._store._isInitialized = false;

        // destroy the mode
        this._destroyMode();
    };

    /**
     * Run a pixel and process the response
     * @param {string} pixel
     */
    run = async (pixel) => {
        // start loading
        this._store._isLoading = true;

        let response;
        if (this._store.mode === 'standalone') {
            // update the methods
            response = await this._runStandard(pixel);
        } else if (this._store.mode === 'embedded') {
            response = await this._runEmbedded(pixel);
        }

        // stop loading
        this._store._isLoading = false;

        // return the response
        return response;
    };

    /**
     * Update the config
     * @param {object} config
     */
    update = async (config) => {
        const { errors, pixelReturn } = await this.run(
            `SetAppConfig(${JSON.stringify(config)})`
        );

        // log errors if it exists
        if (errors.length) {
            console.error(errors);
            return;
        }

        // update the config
        this._store.config = pixelReturn[0].output;

        return this._store.config;
    };

    /** Listeners */

    /** Utility Methods */
    /**
     * Initialize the insight
     */
    _initializeInsight = async () => {
        // clear the config
        this._store.config = {};

        // create a new insight if one does not exist
        if (!this._store.insightId) {
            const response = await this.run('2+2;');

            if (response.insightId) {
                this._store.insightId = response.insightId;
            } else {
                console.error('Cannot create an InsightId');
            }
        } else {
            // get the config
            const response = await this.run('GetAppConfig();');

            if (response.pixelReturn && response.pixelReturn[0]) {
                this._store.config = response.pixelReturn[0];
            }
        }
    };

    /**
     * Add listeners and set methods based on the mode
     */
    _initializeMode = () => {
        // try to get the insight ID from the url
        try {
            // check if it is embedded
            const urlParams = new URLSearchParams(window.location.search);

            // get the insightId
            this._store.insightId = urlParams.get('semoss-insight-id');
        } catch (e) {
            // noop
        } finally {
            // if there is no insight ID, assume it is embedded
            if (!this._store.insightId) {
                this._store.mode = 'standalone';
            } else {
                this._store.mode = 'embedded';
            }
        }

        // add listeners based on the mode
        if (this._store.mode === 'standalone') {
            // noop
        } else if (this._store.mode === 'embedded') {
            // add the listeners
            window.addEventListener(
                'message',
                this._processEmbeddedMessage,
                false
            );
        }
    };

    /**
     * Destroy the mode
     */
    _destroyMode = () => {
        if (this._store.mode === 'standalone') {
            this.run('DropInsight();');
        } else if (this._store.mode === 'embedded') {
            // remove the listener
            window.removeEventListener(
                'message',
                this._embedded.bind._processEmbeddedMessage,
                false
            );
        }
    };

    /**
     * Process an embedded message
     * @param {object} message
     */
    _processEmbeddedMessage = (message) => {
        let messageObject;

        try {
            messageObject = JSON.parse(message.data);
        } catch (e) {
            // not a valid message we're expecting so don't process it
            return;
        }

        // ignore if it is not the correct one or the insightId is missing
        if (
            !messageObject.data ||
            messageObject.data.insightId !== this._store.insightId
        ) {
            return;
        }

        if (messageObject.message === 'semoss-run-pixel--end') {
            this._handleEmbeddedRunPixel(messageObject.data);
        }
    };

    /**
     * Handle the response of a pixel run in the parent
     * @param {object} data - data associated with the message
     */
    _handleEmbeddedRunPixel = (data) => {
        // get the key
        const key = data.key;

        // need a key and a callback
        if (!key || !this._embedded.callbacks[key]) {
            console.error('Cannot find callback for key (' + key + ') for run');
            return;
        }

        // call the callback
        this._embedded.callbacks[key](data.response);

        // delete the callback
        delete this._embedded.callbacks[key];
    };

    /**
     * Run a pixel in the parent and process the response
     * @param {string} pixel
     */
    _runEmbedded = async (pixel) => {
        return new Promise((resolve) => {
            // generate a new key
            const key = `key--${
                Math.floor(Math.random() * 1000000000000) + Date.now()
            }`;

            // register the callback
            this._embedded.callbacks[key] = (payload) => {
                resolve(payload);
            };

            // emit the message
            window.parent.postMessage(
                JSON.stringify({
                    message: 'semoss-run-pixel--start',
                    data: {
                        key: key,
                        insightId: this._store.insightId,
                        pixel: pixel,
                    },
                })
            );
        });
    };

    /**
     * Run a pixel in the parent and process the response
     * @param {string} pixel
     */
    _runStandard = async (pixel) => {
        let postData = '';

        postData += 'expression=' + encodeURIComponent(pixel);
        postData +=
            '&insightId=' + encodeURIComponent(this._store.insightId || 'new');

        const raw = await fetch(`${this._endpoint}/api/engine/runPixel`, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: postData,
        });
        const response = await raw.json();

        // collect the errors
        const errors = [];
        for (const p of response.pixelReturn) {
            const { output, operationType } = p;

            if (operationType.indexOf('ERROR') > -1) {
                errors.push(output);
            }
        }

        return {
            errors: errors,
            insightId: response.insightID,
            pixelReturn: response.pixelReturn,
        };
    };
}
