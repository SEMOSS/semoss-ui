
import { useInsight } from '@semoss/sdk/react';
import { CircularProgress, styled } from '@semoss/ui';
import {
    HashRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { DiscoverPage } from './DiscoverPage';
import { LoginPage } from './LoginPage';
import { MainLayout } from './MainLayout';
import { NewRoomPage } from './NewRoomPage';
import { RoomPage } from './RoomPage';

const StyledContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    inset: '0',
    height: '100%',
    width: '100%',
}));


export const Router = () => {
    const { isInitialized, error } = useInsight();


    // don't load anything if it is pending
    if (!isInitialized) {
        return (
            <StyledContainer>
                <CircularProgress />
            </StyledContainer>
        );
    }

    if (error) {
        return "Error";
    }

    return (
        <HashRouter >
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
        </HashRouter>
    );
};
