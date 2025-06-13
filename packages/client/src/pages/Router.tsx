import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import {
    AppCatalogPage,
    AppMarketplacePage,
    AppDetailPage,
    AppPage,
    NewPromptBuilderAppPage,
    CreateAppPage,
} from './app';

import { EngineRouter } from './engine';
import { PromptRouter } from './prompt';
import { SettingsRouter } from './settings';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { MainLayout } from './MainLayout';

import { LoginPage } from './LoginPage';
import { SharePage } from './SharePage';

import { CookieNotice } from './legal/CookieNotice';
import { PrivacyNotice } from './legal/PrivacyNotice';

import { WorkspacePage } from './WorkspacePage';

import { PlatformMessages } from '../components/shared';
import { LandingPage } from './LandingPage';

export const Router = observer(() => {
    const { configStore } = useRootStore();

    // don't load anything if it is pending
    if (configStore.store.status === 'INITIALIZING') {
        return <LoadingScreen.Trigger message={'Initializing'} />;
    }

    const parseThemeMapForValue = (value: string): boolean => {
        const theme = configStore.store.config.theme;
        if (theme && theme['THEME_MAP']) {
            try {
                const map = JSON.parse(theme['THEME_MAP'] as string);

                return !!map['cookiePolicyNoticePage'];
            } catch {
                console.error(
                    `Unable to parse theme for the Router for ${value}`,
                );
                return false;
            }
        } else {
            return false;
        }
    };
    const showCookieNotice = parseThemeMapForValue('cookiePolicyNoticePage');
    const showPrivacyNotice = parseThemeMapForValue('privacyNoticePage');

    return (
        <Routes>
            <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="*" element={<MainLayout />}>
                    <Route index element={<LandingPage />} />

                    <Route path="app/*">
                        <Route index element={<AppCatalogPage />} />
                        <Route path="new" element={<CreateAppPage />} />
                        <Route
                            path="new/template"
                            element={<AppMarketplacePage />}
                        />
                        <Route
                            path="new/prompt"
                            element={<NewPromptBuilderAppPage />}
                        />
                        <Route path=":appId" element={<AppDetailPage />} />
                        <Route path=":appId/view/*" element={<AppPage />} />

                        <Route
                            path=":appId/edit/*"
                            element={<WorkspacePage />}
                        />
                        <Route
                            path="*"
                            element={<Navigate to={`/`} replace />}
                        />
                    </Route>
                    <Route path="engine/*" element={<EngineRouter />} />
                    <Route path="prompt/*" element={<PromptRouter />} />
                    <Route path="settings/*" element={<SettingsRouter />} />
                </Route>

                <Route
                    path="workspace/:appId/*"
                    element={
                        <PlatformMessages>
                            <WorkspacePage />
                        </PlatformMessages>
                    }
                />
                <Route
                    path="s/:appId/*"
                    element={
                        <PlatformMessages>
                            <SharePage />
                        </PlatformMessages>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            {showCookieNotice && (
                <Route path="/cookie-notice" element={<CookieNotice />} />
            )}
            {showPrivacyNotice && (
                <Route path="/privacy-notice" element={<PrivacyNotice />} />
            )}
            <Route path="/login" element={<LoginPage />}></Route>
        </Routes>
    );
});
