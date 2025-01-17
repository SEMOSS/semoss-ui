import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

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
    queries: {
        'ask-llm': {
            id: 'ask-llm',
            cells: [
                {
                    id: '42377',
                    widget: 'code',
                    parameters: {
                        code: 'LLM(engine = "001510f8-b86e-492e-a7f0-41299775e7d9", command = "<encode>What is the average home price in {{location}} with the latest data that you have.  REQUIRED: Just respond with a number nothing else</encode>", paramValues=[{}]);',
                        type: 'pixel',
                    },
                },
                {
                    id: '99842',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "{{unformatted-resp}}['response']",
                    },
                },
            ],
        },
    },
    blocks: {
        'welcome-container-block': {
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            slots: {
                children: {
                    children: ['input--2132'],
                    name: 'children',
                },
            },
            widget: 'container',
            data: {
                style: {
                    padding: '4px',
                    overflow: 'hidden',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                },
            },
            listeners: {},
            id: 'welcome-container-block',
        },
        'page-1': {
            parent: null,
            slots: {
                content: {
                    children: [
                        'markdown--5580',
                        'welcome-container-block',
                        'button--1258',
                        'markdown--1585',
                    ],
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
        'input--2132': {
            id: 'input--2132',
            widget: 'input',
            parent: {
                id: 'welcome-container-block',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'DC',
                label: 'Location',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'markdown--5580': {
            id: 'markdown--5580',
            widget: 'markdown',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                },
                markdown:
                    '# Average Home Price Finder\n\n##### This App will use the LLM to get you the Average home price for a particular city/state',
            },
            listeners: {},
            slots: {},
        },
        'markdown--1585': {
            id: 'markdown--1585',
            widget: 'markdown',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                },
                markdown: '{{average-home-price}}',
            },
            listeners: {},
            slots: {},
        },
        'button--1258': {
            id: 'button--1258',
            widget: 'button',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {},
                label: 'Find Average Home Price',
                loading: false,
                disabled: false,
                variant: 'contained',
                color: 'primary',
            },
            listeners: {
                onClick: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'ask-llm',
                        },
                    },
                ],
            },
            slots: {},
        },
    },
    variables: {
        location: {
            type: 'block',
            to: 'input--2132',
            isInput: true,
        },
        'unformatted-resp': {
            type: 'cell',
            to: 'ask-llm',
            cellId: '42377',
        },
        'average-home-price': {
            type: 'query',
            to: 'ask-llm',
            isOutput: true,
        },
    },
    executionOrder: ['ask-llm'],
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
                {
                    id: '10841',
                    widget: 'code',
                    parameters: {
                        code: '4+4',
                        type: 'pixel',
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
                        path="test-renderer"
                        element={
                            <Bricks
                                state={TESTING_STATE_REMOVE_THIS_2}
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
