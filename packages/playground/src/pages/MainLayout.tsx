import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { styled, Stack } from '@mui/material';
import { useInsight } from '@semoss/sdk/react';

import { ChatStore } from '@/stores';
import { ChatContext } from '@/contexts';
import { Sidebar } from '@/components';

const StyledMain = styled(Stack)(() => ({
    position: 'relative',
    height: '100%',
    width: '100%',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    paddingTop: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(1),
}));

const StyledInner = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    overflowX: 'hidden',
    overflowY: 'auto',
}));

export const MainLayout = () => {
    const { actions } = useInsight();

    // set up the store
    const chatStore = useMemo(() => {
        const store = new ChatStore(actions);

        // initialize it
        store.initialize();

        return store;
    }, [actions]);

    return (
        <ChatContext.Provider
            value={{
                chat: chatStore,
            }}
        >
            <StyledMain direction={'row'} overflow={'hidden'}>
                <Sidebar />
                <StyledContent>
                    <StyledInner>
                        <Outlet />
                    </StyledInner>
                </StyledContent>
            </StyledMain>
        </ChatContext.Provider>
    );
};
