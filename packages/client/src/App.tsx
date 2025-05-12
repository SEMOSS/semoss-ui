import { useEffect } from 'react';
import axios, { isAxiosError } from 'axios';

import { Env } from '@semoss/sdk/react';

import { RootStore } from '@/stores';
import { RootStoreContext } from '@/contexts';
import { AppWrapper } from './AppWrapper';

// use the environment variable to set the module if in development
if (process.env.NODE_ENV === 'development') {
    Env.update({
        MODULE: process.env.MODULE || '',
    });
}

const CSRF = {
    isEnabled: false,
    token: '',
};

/**
 * Get the CSRF Token
 * @returns token
 */
async function getToken(): Promise<string> {
    try {
        const response = await axios.get(`${Env.MODULE}/api/config/fetchCsrf`, {
            headers: {
                'X-CSRF-Token': 'fetch',
            },
        });

        // not sure why the server is sending it as lowercase, preserving headers doesn't fix it
        const token =
            response.headers['X-CSRF-Token'] ||
            response.headers['x-csrf-token'] ||
            '';

        return token;
    } catch (error) {
        return '';
    }
}

// add interceptors
axios.interceptors.request.use(
    async (config) => {
        // Check if the request is a GET request
        if (config.method === 'get' && config.params) {
            config.paramsSerializer = (params) => {
                return Object.keys(params)
                    .map((key) => {
                        if (params[key] === undefined) {
                            return '';
                        }

                        return `${encodeURIComponent(key)}=${encodeURIComponent(
                            params[key],
                        )}`;
                    })
                    .filter((p) => {
                        if (p) {
                            return true;
                        }

                        return false;
                    })
                    .join('&');
            };
        }

        // Check if CSRF is enabled and add the token
        if (CSRF.isEnabled) {
            if (config.method === 'post') {
                if (!CSRF.token) {
                    CSRF.token = await getToken();
                }

                config.headers['X-CSRF-Token'] = CSRF.token;
            }
        }
        return config;
    },
    (error) => {
        // Handle request error
        return Promise.reject(error);
    },
);

axios.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        getError(error);
    },
);

// create a new root store
const _store = new RootStore();

//get error from request or response
function getError(error) {
    if (error.status === 302 && error.headers && error.headers.redirect) {
        window.location.replace(error.headers.redirect);
    }

    if (isAxiosError(error)) {
        const { response } = error;
        if (
            response.status === 302 &&
            response.headers &&
            response.headers.redirect
        ) {
            window.location.replace(response.headers.redirect);
        }
    }

    const apiMessage = error.response?.data?.errorMessage;
    if (apiMessage && typeof apiMessage === 'string') {
        // Exception for returning the errorMessage provided via the API if available.
        return Promise.reject(apiMessage);
    } else if (error.message) {
        // return the message if it exists
        return Promise.reject(error.message);
    } else {
        // reject with generic error
        return Promise.reject('Error');
    }
}

export const App = () => {
    useEffect(() => {
        // load the environment from the document in (production)
        try {
            if (!document) {
                return;
            }

            const env = JSON.parse(
                document.getElementById('semoss-env')?.textContent || '',
            ) as {
                MODULE: string;
            };

            // update the enviornment variables with the module
            if (env) {
                Env.update({
                    MODULE: env.MODULE,
                });
            }
        } catch (e) {
            console.error(e);
        }

        // intialize it
        _store.configStore.initialize().then(() => {
            // set as enabled
            CSRF.isEnabled = _store.configStore.store.config.csrf;
        });
    }, []);

    //  NCRT ASK - (https://play.semoss.org/ncrt/SemossWeb/packages/client/dist/#!/)
    if (window.location.href.includes('client/dist/#!/')) {
        window.location.href = window.location.href.replace(
            /(client\/dist\/)#!/,
            '$1#',
        );
    }

    return (
        <RootStoreContext.Provider value={_store}>
            <AppWrapper />
        </RootStoreContext.Provider>
    );
};
