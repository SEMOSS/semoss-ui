import { ThemeProvider } from '@semoss/ui';

import { InsightProvider } from '@semoss/sdk';

import { APP } from './constants';
import { Router } from '@/pages';

export const App = () => {
    return (
        <ThemeProvider reset={true}>
            <InsightProvider appId={APP}>
                <Router />
            </InsightProvider>
        </ThemeProvider>
    );
};
