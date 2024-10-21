import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '@/hooks';
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

export const Router = observer(() => {
    const { configStore } = useRootStore();

    // don't load anything if it is pending
    if (configStore.store.status === 'INITIALIZING') {
        return <LoadingScreen.Trigger message={'Initializing'} />;
    }

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
            <Route path="/login" element={<LoginPage />}></Route>
        </Routes>
    );
});
