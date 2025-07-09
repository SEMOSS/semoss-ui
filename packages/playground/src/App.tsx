import { Env, InsightProvider } from '@semoss/sdk/react';

import { styled, ThemeProvider, Notification } from '@semoss/ui';
import { Router } from '@/pages';

if (process.env.NODE_ENV !== 'production') {
    Env.update({
        MODULE: process.env.MODULE || '',
        ACCESS_KEY: process.env.ACCESS_KEY || '',
        SECRET_KEY: process.env.SECRET_KEY || '',
        APP: process.env.APP || '',
    });
}

const StyledMain = styled('div')(({ theme }) => ({
    position: 'absolute',
    inset: 0,
    background: theme.palette.background.default,
}));

export const App = () => {
    return (
        <InsightProvider>
            <ThemeProvider>
                <Notification>
                    <StyledMain>
                        <Router />
                    </StyledMain>
                </Notification>
            </ThemeProvider>
        </InsightProvider>
    );
};
