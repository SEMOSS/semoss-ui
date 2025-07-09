import { useState, useLayoutEffect } from 'react';
import {
    Router as ReactRouter,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { createHashHistory } from 'history';
import { useInsight } from '@semoss/sdk/react';
import { styled, CircularProgress } from '@semoss/ui';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { LoginPage } from './LoginPage';
import { MainLayout } from './MainLayout';
import { NewRoomPage } from './NewRoomPage';
import { RoomPage } from './RoomPage';
import { DiscoverPage } from './DiscoverPage';

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
                <Route element={<AuthenticatedLayout />}>
                    <Route element={<MainLayout />}>
                        <Route path="new" element={<NewRoomPage />} />
                        <Route path="room/:roomId" element={<RoomPage />} />
                        <Route path="agents" element={<DiscoverPage />} />
                        <Route
                            path="*"
                            element={<Navigate to="new" replace />}
                        />
                    </Route>
                </Route>
                <Route path="/login" element={<LoginPage />}></Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </ReactRouter>
    );
};
