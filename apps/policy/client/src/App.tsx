import { ThemeProvider } from '@semoss/ui';

import { InsightProvider } from '@semoss/sdk';
import { Router } from '@/pages';

export const App = () => {
    return (
        <ThemeProvider reset={true}>
            <InsightProvider>
                <Router />
            </InsightProvider>
        </ThemeProvider>
    );
};
