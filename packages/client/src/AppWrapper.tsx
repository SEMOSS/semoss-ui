import { useMemo, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, Notification, CustomThemeOptions } from '@semoss/ui';
import { Router } from '@/pages';
import { LoadingScreen } from '@/components/ui';
import { useRootStore } from './hooks';
import { observer } from 'mobx-react-lite';
import { THEME } from '@/constants';
import { CookieWrapper } from './components/cookies';

export const AppWrapper = observer(() => {
    const { configStore } = useRootStore();

    useEffect(() => {
        const theme = configStore.store.config['theme'];

        if (theme) {
            try {
                const themeMap = theme['THEME_MAP']
                    ? JSON.parse(theme['THEME_MAP'] as string)
                    : {};
                document.title = themeMap.name ? themeMap.name : THEME.name;

                // Set the favicon
                const faviconLink = themeMap.isLogoUrl
                    ? themeMap.logo
                    : THEME.logo
                    ? THEME.logo
                    : null;

                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = faviconLink;
                document.head.appendChild(link);
            } catch {
                console.error('Unable to set title on page');
            }
        }
    }, [Object.keys(configStore.store.config).length]);

    const t: CustomThemeOptions = useMemo(() => {
        const theme = configStore.store.config['theme'];

        if (theme && theme['THEME_MAP']) {
            try {
                const themeMap = JSON.parse(theme['THEME_MAP'] as string);
                return themeMap['materialTheme']
                    ? themeMap['materialTheme']
                    : {};
            } catch {
                return {};
            }
        }

        return {};
    }, [Object.keys(configStore.store.config).length]);

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
