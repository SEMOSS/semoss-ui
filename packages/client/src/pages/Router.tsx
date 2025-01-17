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
        nb: {
            id: 'nb',
            cells: [
                {
                    id: '53005',
                    widget: 'code',
                    parameters: {
                        code: '1+1',
                        type: 'py',
                    },
                },
                {
                    id: '17308',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: '4+4',
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
                    children: ['grid--4402', 'vega--9074', 'vega--8556'],
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
                        message: 'RUN_QUERY',
                        payload: {
                            queryId: 'nb',
                        },
                    },
                ],
            },
            id: 'page-1',
        },
        'vega--9074': {
            id: 'vega--9074',
            widget: 'vega',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                variation: 'area-chart',
                specJson:
                    '{\n  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",\n  "title": "Area Chart",\n  "width": 300,\n  "height": 300,\n  "data": {\n    "values": [\n      {\n        "a": "A",\n        "b": 28\n      },\n      {\n        "a": "B",\n        "b": 55\n      },\n      {\n        "a": "D",\n        "b": 91\n      },\n      {\n        "a": "E",\n        "b": 81\n      },\n      {\n        "a": "E",\n        "b": 81\n      },\n      {\n        "a": "G",\n        "b": 19\n      },\n      {\n        "a": "H",\n        "b": 87\n      }\n    ]\n  },\n  "mark": "area",\n  "encoding": {\n    "x": {\n      "field": "a"\n    },\n    "y": {\n      "aggregate": "sum",\n      "field": "b",\n      "title": "count"\n    }\n  }\n}',
            },
            listeners: {},
            slots: {},
        },
        'vega--8556': {
            id: 'vega--8556',
            widget: 'vega',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                variation: 'area-chart-with-gradient',
                specJson:
                    '{\n  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",\n  "title": "Area Chart with Gradient",\n  "width": 300,\n  "height": 300,\n  "description": "Simple area chart with gradient.",\n  "data": {\n    "values": [\n      {\n        "a": "A",\n        "b": 28\n      },\n      {\n        "a": "B",\n        "b": 55\n      },\n      {\n        "a": "D",\n        "b": 91\n      },\n      {\n        "a": "E",\n        "b": 81\n      },\n      {\n        "a": "E",\n        "b": 81\n      },\n      {\n        "a": "G",\n        "b": 19\n      },\n      {\n        "a": "H",\n        "b": 87\n      }\n    ]\n  },\n  "mark": {\n    "type": "area",\n    "line": {\n      "color": "darkgreen"\n    },\n    "color": {\n      "x1": 1,\n      "y1": 1,\n      "x2": 1,\n      "y2": 0,\n      "gradient": "linear",\n      "stops": [\n        {\n          "offset": 0,\n          "color": "white"\n        },\n        {\n          "offset": 1,\n          "color": "darkgreen"\n        }\n      ]\n    }\n  },\n  "encoding": {\n    "x": {\n      "field": "a"\n    },\n    "y": {\n      "aggregate": "sum",\n      "field": "b",\n      "title": "count"\n    }\n  }\n}',
            },
            listeners: {},
            slots: {},
        },
        'grid--4402': {
            id: 'grid--4402',
            widget: 'grid',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                frame: {
                    name: '',
                },
                columns: [],
                view: {
                    pagination: true,
                },
            },
            listeners: {},
            slots: {},
        },
    },
    variables: {},
    executionOrder: ['nb'],
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
                        path="bricks"
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
