import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { useRootStore } from '@/hooks/';
import { LoadingScreen } from '@/components/ui';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { NavigatorLayout } from './NavigatorLayout';

import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { SharePage } from './SharePage';

import { EngineRouter } from './engine';
import { SettingsRouter } from './settings';
import { AppRouter } from './app';
import { ImportRouter } from './import';
import { CookieNotice } from './CookieNotice';

export const Router = observer(() => {
    const { configStore } = useRootStore();
    const [showCookieNotice, setShowCookieNotice] = useState(false);
    const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

    // don't load anything if it is pending
    if (configStore.store.status === 'INITIALIZING') {
        return <LoadingScreen.Trigger message={'Initializing'} />;
    }

    // Determine if the user has access to the CookieNotice and PrivacyNotice pages.
    useEffect(() => {
        const theme = configStore.store.config.theme;
        if (theme && theme['THEME_MAP']) {
            try {
                const map = JSON.parse(theme['THEME_MAP'] as string);

                const themeCookiePolicyNoticePage = map[
                    'cookiePolicyNoticePage'
                ]
                    ? map['cookiePolicyNoticePage']
                    : '';
                setShowCookieNotice(!!themeCookiePolicyNoticePage);

                const themePrivacyNoticePage = map['privacyNoticePage']
                    ? map['privacyNoticePage']
                    : '';
                setShowPrivacyNotice(!!themePrivacyNoticePage);
            } catch {
                console.error('Unable to parse theme for the Router');
            }
        }
    }, [Object.keys(configStore.store.config).length]);

    return (
        <Routes>
            <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="app/*" element={<AppRouter />} />
                <Route path="*" element={<NavigatorLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="import" element={<ImportRouter />} />
                    <Route path="settings/*" element={<SettingsRouter />} />
                    <Route path="engine/*" element={<EngineRouter />} />
                </Route>
                <Route path="s/:appId" element={<SharePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            {showCookieNotice && (
                <Route path="/cookie-notice" element={<CookieNotice />} />
            )}
            {showPrivacyNotice && (
                <Route path="/privacy-notice" element={<CookieNotice />} />
            )}
            <Route path="/login" element={<LoginPage />}></Route>
        </Routes>
    );
});
