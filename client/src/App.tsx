import axios from 'axios';
import { HashRouter } from 'react-router-dom';
import { Theme, Notification, globalCss } from '@semoss/components';

import { theme } from './theme';
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

// create the global styles
const globalStyles = globalCss({
    body: {
        backgroundColor: theme.colors.background,
    },
    a: {
        color: 'inherit',
        textDecoration: 'inherit',
    },
    form: {
        margin: '0',
    },
});

// create a new root store
const _store = new RootStore();

export const App = () => {
    // add the global styles
    globalStyles();

    return (
        <RootStoreContext.Provider value={_store}>
            <Theme reset={true} theme={theme}>
                <Notification>
                    <LoadingScreen delay={300}>
                        <HashRouter>
                            <Router />
                        </HashRouter>
                    </LoadingScreen>
                </Notification>
            </Theme>
        </RootStoreContext.Provider>
    );
};
