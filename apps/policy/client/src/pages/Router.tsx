import { useState, useLayoutEffect } from 'react';
import {
    Router as ReactRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
} from 'react-router-dom';
import { createHashHistory } from 'history';
import { useInsight } from '@semoss/sdk';
import { styled, CircularProgress } from '@semoss/ui';

import { MainLayout } from './MainLayout';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { LoginPage } from './LoginPage';
import { PolicyPage } from './PolicyPage';

const StyledContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    inset: '0',
    height: '100%',
    width: '100%',
}));

export const history = createHashHistory();

export const Router = () => {
    const { isInitialized, error } = useInsight();

    const [state, setState] = useState({
        action: history.action,
        location: history.location,
    });

    useLayoutEffect(() => history.listen(setState), [history]);

    // don't load anything if it is pending
    if (!isInitialized) {
        return (
            <StyledContainer>
                <CircularProgress />
            </StyledContainer>
        );
    }

    if (error) {
        return <>Error</>;
    }

    return (
        <ReactRouter
            location={state.location}
            navigationType={state.action}
            navigator={history}
        >
            <Routes>
                <Route element={<MainLayout />}>
                    <Route element={<AuthenticatedLayout />}>
                        <Route path="/" element={<Outlet />}>
                            <Route index element={<PolicyPage />} />
                            <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                            />
                        </Route>
                    </Route>
                    <Route path="/login" element={<LoginPage />}></Route>
                    <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                    />
                </Route>
            </Routes>
        </ReactRouter>
    );
};
