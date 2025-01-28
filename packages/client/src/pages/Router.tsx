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

import { Renderer, ActionMessages, SerializedState } from '@semoss/renderer';
import { Env, InsightProvider } from '@semoss/sdk';

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

const TEST_REMOVE_2: SerializedState = {
    queries: {
        'job-desc': {
            id: 'job-desc',
            cells: [
                {
                    id: '32629',
                    widget: 'code',
                    parameters: {
                        code: "r'''### Responsibilities\r\n- Develop and implement marketing strategies.\r\n- Oversee marketing campaigns across various channels.\r\n- Lead and mentor a marketing team.\r\n- Conduct market research and analyze trends.\r\n- Collaborate with clients to meet their marketing objectives.\r\n- Monitor and report on campaign performance.\r\n- Manage budgets and resources effectively.\r\n\r\n### Qualifications\r\n- Bachelor?s degree in Marketing, Business, or related field.\r\n- 5+ years of marketing experience, focusing on digital marketing.\r\n- Proven success in marketing campaigns.\r\n- Strong leadership and project management skills.\r\n- Proficiency in marketing tools (e.g., Google Analytics, SEO tools).\r\n- Excellent communication and analytical skills.'''",
                        type: 'py',
                    },
                },
            ],
        },
        comparison: {
            id: 'comparison',
            cells: [
                {
                    id: '24179',
                    widget: 'code',
                    parameters: {
                        code: 'question = r"""I have a job description represented as CONTEXT\r\n\r\nCONTEXT: {{job-desc}}\r\n\r\nI have candidate 1 represented as {{name-1}} with {{skills-1}}\r\n\r\nI also have candidate 2 represented as {{name-2}} with {{skills-2}}\r\n\r\nWho is the best match for the job and why? Please give me a direct answer one or the other"""\r\n\r\nquestion',
                        type: 'py',
                    },
                },
                {
                    id: '33842',
                    widget: 'llm',
                    parameters: {
                        command: '{{question}}',
                        variants: {
                            default: {
                                id: 'default',
                                sortWeight: 0,
                                model: {
                                    id: '001510f8-b86e-492e-a7f0-41299775e7d9',
                                    name: 'AIC-GPT-4 Conversation',
                                    topP: 0.3,
                                    temperature: 0.6,
                                    length: 881,
                                },
                            },
                            a: {
                                id: 'a',
                                sortWeight: 0,
                                model: {
                                    id: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
                                    name: 'GPT-4o',
                                    topP: 0.8,
                                    temperature: 0.6,
                                    length: 973,
                                },
                            },
                        },
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
                    children: [
                        'text--2021',
                        'markdown--7947',
                        'text--801',
                        'input--3614',
                        'input--702',
                        'text--7607',
                        'input--5077',
                        'input--3057',
                        'button--155',
                        'llmComparison--9471',
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
                route: '',
            },
            listeners: {
                onPageLoad: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'job-desc',
                        },
                    },
                ],
            },
            id: 'page-1',
        },
        'text--2021': {
            id: 'text--2021',
            widget: 'text',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Model Comparison',
                variant: 'h1',
            },
            listeners: {},
            slots: {},
        },
        'input--5077': {
            id: 'input--5077',
            widget: 'input',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'John',
                label: 'Candidate 2',
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
        'input--3614': {
            id: 'input--3614',
            widget: 'input',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'Devin',
                label: 'Candidate 1',
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
        'input--3057': {
            id: 'input--3057',
            widget: 'input',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'Digital Marketing: Expert in developing and executing comprehensive digital marketing strategies.\nSocial Media Management: Advanced experience in managing social media campaigns on platforms like Facebook, Twitter, LinkedIn, Instagram, and TikTok.\nContent Creation: Highly skilled in creating engaging and high-quality content for blogs, social media, email campaigns, and video marketing.\nSEO/SEM: Advanced knowledge and proven track record in search engine optimization and search engine marketing.\nProject Management: Strong project management skills with experience in leading large-scale marketing projects.\nData Analysis: Expert in using Google Analytics, Tableau, and other advanced tools to analyze and optimize marketing performance.\nTeam Leadership: Proven leadership experience in managing and mentoring larger marketing teams.\nClient Collaboration: Highly adept at working with high-profile clients to understand their needs and deliver customized marketing solutions.\nEmail Marketing: Advanced proficiency in creating, managing, and optimizing email marketing campaigns.\nBudget Management: Extensive experience in managing large marketing budgets and maximizing ROI.\nBrand Strategy: Strong background in developing and implementing brand strategies.\nMarket Research: Advanced skills in conducting market research and competitive analysis.',
                label: 'Candidate skills',
                hint: '',
                type: 'text',
                rows: '3',
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
        'text--7607': {
            id: 'text--7607',
            widget: 'text',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Candidate 2',
                variant: 'h3',
            },
            listeners: {},
            slots: {},
        },
        'text--801': {
            id: 'text--801',
            widget: 'text',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Candidate 1',
                variant: 'h3',
            },
            listeners: {},
            slots: {},
        },
        'markdown--7947': {
            id: 'markdown--7947',
            widget: 'markdown',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                },
                markdown: '{{job-desc}} ',
            },
            listeners: {},
            slots: {},
        },
        'input--702': {
            id: 'input--702',
            widget: 'input',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'Digital Marketing: Proficient in developing and executing digital marketing strategies.\nSocial Media Management: Experienced in managing social media campaigns on platforms like Facebook, Twitter, and LinkedIn.\nContent Creation: Skilled in creating engaging content for blogs, social media, and email campaigns.\nSEO/SEM: Knowledgeable in search engine optimization and search engine marketing.\nProject Management: Capable of managing multiple marketing projects simultaneously.\nData Analysis: Familiar with using Google Analytics and other tools to analyze marketing performance.\nTeam Leadership: Experience leading small marketing teams.\nClient Collaboration: Adept at working with clients to understand their needs and deliver effective marketing solutions.\nEmail Marketing: Proficient in creating and managing email marketing campaigns.\nBudget Management: Experience in managing marketing budgets and optimizing spend.',
                label: 'Candidate skills',
                hint: '',
                type: 'text',
                rows: '3',
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
        'button--155': {
            id: 'button--155',
            widget: 'button',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {},
                label: 'Submit',
                loading: '{{compare.isLoading}}',
                disabled: false,
                variant: 'contained',
                color: 'primary',
            },
            listeners: {
                onClick: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'comparison',
                        },
                    },
                ],
            },
            slots: {},
        },
        'llmComparison--9471': {
            id: 'llmComparison--9471',
            widget: 'llmComparison',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '',
                variants: {},
                queryId: 'comparison',
                cellId: '33842',
            },
            listeners: {},
            slots: {},
        },
    },
    variables: {
        compare: {
            type: 'query',
            to: 'comparison',
            isOutput: true,
        },
        'job-desc': {
            type: 'cell',
            to: 'job-desc',
            cellId: '32629',
        },
        'name-1': {
            type: 'block',
            to: 'input--3614',
        },
        'name-2': {
            type: 'block',
            to: 'input--5077',
        },
        'skills-1': {
            type: 'block',
            to: 'input--702',
        },
        'skills-2': {
            type: 'block',
            to: 'input--3057',
        },
        question: {
            type: 'cell',
            to: 'comparison',
            cellId: '24179',
        },
    },
    executionOrder: ['job-desc', 'comparison'],
    version: '1.0.0-alpha.4',
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

    Env.update({
        MODULE: process.env.MODULE || '',
    });

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
                            <InsightProvider>
                                <Renderer state={TEST_REMOVE_2} />
                            </InsightProvider>
                        }
                    />

                    <Route path="prompt/*" element={<PromptRouter />} />
                </Route>
                <Route path="workspace/:appId/*" element={<WorkspacePage />} />
                <Route path="s/:appId/*" element={<SharePage />} />
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
