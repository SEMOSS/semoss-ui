import axios from 'axios';
import { HashRouter } from 'react-router-dom';
import {
    Theme as OldTheme,
    Notification as OldNotification,
} from '@semoss/components';
import { ThemeProvider, Notification } from '@semoss/ui';

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

// create a new root store
const _store = new RootStore();

export const App = () => {
    return (
        <RootStoreContext.Provider value={_store}>
            <ThemeProvider reset={true}>
                <Notification>
                    <OldTheme reset={false} theme={theme}>
                        <OldNotification>
                            <LoadingScreen delay={300}>
                                <HashRouter>
                                    <Router />
                                </HashRouter>
                            </LoadingScreen>
                        </OldNotification>
                    </OldTheme>
                </Notification>
            </ThemeProvider>
        </RootStoreContext.Provider>
    );
};
