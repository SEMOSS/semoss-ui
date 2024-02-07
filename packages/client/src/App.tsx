import { useEffect } from 'react';
import axios from 'axios';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, Notification } from '@/component-library';

import { Env } from '@/env';
import { RootStore } from '@/stores';
import { RootStoreContext } from '@/contexts';
import { Router } from '@/pages';
import { LoadingScreen } from '@/components/ui';

// add interceptors
axios.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        if (error.status === 302 && error.headers && error.headers.redirect) {
            window.location.replace(error.headers.redirect);
        }

        // return the message
        return Promise.reject(error.response.data.errorMessage);
    },
);

// axios.interceptors.request.use((config) => {
//     return new Promise((resolve) => setTimeout(() => resolve(config), 3000));
// });

// create a new root store
const _store = new RootStore();

export const App = () => {
    useEffect(() => {
        // load the environment from the document (production)
        try {
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
            // noop
        }

        // intialize it
        _store.configStore.initialize();
    }, []);

    return (
        <RootStoreContext.Provider value={_store}>
            <ThemeProvider reset={true}>
                <Notification>
                    <LoadingScreen>
                        <HashRouter>
                            <Router />
                        </HashRouter>
                    </LoadingScreen>
                </Notification>
            </ThemeProvider>
        </RootStoreContext.Provider>
    );
};
