import { useMemo, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, Notification, CustomThemeOptions } from '@semoss/ui';
import { Router } from '@/pages';
import { LoadingScreen } from '@/components/ui';
import { useRootStore } from './hooks';
import { observer } from 'mobx-react-lite';
import { CookieWrapper } from './components/cookies';

export const AppWrapper = observer(() => {
    const { configStore } = useRootStore();

    useEffect(() => {
        try {
            document.title = configStore.theme.name;

            // Set the favicon
            const faviconLink = configStore.theme.logo;

            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = faviconLink;
            document.head.appendChild(link);
        } catch {
            console.error('Unable to set title on page');
        }
    }, [configStore.theme]);

    const t: CustomThemeOptions = useMemo(() => {
        return (
            (configStore.theme.materialTheme as CustomThemeOptions) || undefined
        );
    }, [configStore.theme]);

    return (
        <ThemeProvider reset={true} theme={t}>
            <Notification>
                <LoadingScreen>
                    <CookieWrapper>
                        <HashRouter>
                            <Router />
                        </HashRouter>
                    </CookieWrapper>
                </LoadingScreen>
            </Notification>
        </ThemeProvider>
    );
});
