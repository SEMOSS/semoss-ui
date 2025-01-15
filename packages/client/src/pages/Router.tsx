import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { AppRouter } from './app';
import { EngineRouter } from './engine';
import { ImportRouter } from './import';
import { PromptRouter } from './prompt';
import { SettingsRouter } from './settings';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { NavigatorLayout } from './NavigatorLayout';

import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { SharePage } from './SharePage';

import { CookieNotice } from './legal/CookieNotice';
import { PrivacyNotice } from './legal/PrivacyNotice';

import { WorkspacePage } from './WorkspacePage';

import { Bricks } from '@semoss/renderer';
import { ActionMessages, SerializedState } from '@/stores';

const TESTING_STATE_REMOVE_THIS_2: SerializedState = {
    queries: {},
    blocks: {
        'page-1': {
            parent: null,
            slots: {
                content: {
                    children: [],
                    name: 'content',
                },
            },
            widget: 'page',
            data: {
                style: {
                    padding: '24px',
                    fontFamily: 'roboto',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                },
            },
            listeners: {
                onPageLoad: [],
            },
            id: 'page-1',
        },
    },
    variables: {},
    executionOrder: [],
    version: '1.0.0-alpha.3',
};
const TESTING_STATE_REMOVE_THIS: SerializedState = {
    queries: {
        'notebook-1': {
            id: 'notebook-1',
            cells: [
                {
                    id: '10840',
                    widget: 'code',
                    parameters: {
                        code: '1+1',
                        type: 'py',
                    },
                },
            ],
        },
    },
    blocks: {
        'page-1': {
            parent: null,
            slots: {
                content: {
                    children: [],
                    name: 'content',
                },
            },
            widget: 'page',
            data: {
                style: {
                    padding: '24px',
                    fontFamily: 'roboto',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                },
            },
            listeners: {
                onPageLoad: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'notebook-1',
                        },
                    },
                ],
            },
            id: 'page-1',
        },
    },
    variables: {},
    executionOrder: ['notebook-1'],
    version: '1.0.0-alpha.3',
};

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
                <Route path="*" element={<NavigatorLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="import" element={<ImportRouter />} />
                    <Route path="settings/*" element={<SettingsRouter />} />
                    <Route path="engine/*" element={<EngineRouter />} />
                    <Route path="app/*" element={<AppRouter />} />

                    {/* Test route for blocks renderer as lib */}
                    <Route
                        path="bricks"
                        element={
                            <Bricks
                                state={TESTING_STATE_REMOVE_THIS}
                                MODULE={process.env.MODULE}
                            />
                        }
                    />

                    {process.env.NODE_ENV == 'development' && (
                        <Route path="prompt/*" element={<PromptRouter />} />
                    )}
                </Route>
                <Route path="workspace/:appId" element={<WorkspacePage />} />
                <Route path="s/:appId" element={<SharePage />} />
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
