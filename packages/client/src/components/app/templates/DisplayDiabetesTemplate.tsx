import { ActionMessages } from '@/stores';
import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';

export const DisplayDiabetesTemplate: Template = {
    name: 'Diaplay Diabetes Record',
    description: 'Display a new diabetes record',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
            ['on-page-load']: {
                id: 'on-page-load',
                cells: [
                    {
                        id: '90193',
                        widget: 'query-import',
                        parameters: {
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            frameType: 'PY',
                            frameVariableName: 'FRAME_90193',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '18427',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: "unique_row_id = FRAME_90193['DIABETES_UNIQUE_ROW_ID'].to_list();",
                        },
                    },
                    {
                        id: '1354',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'unique_row_id',
                        },
                    },
                ],
            },
            ['get-data']: {
                id: 'get-data',
                cells: [
                    {
                        id: '18552',
                        widget: 'code',
                        parameters: {
                            code: 'from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\');a = databaseEngine.execQuery(query = "SELECT * FROM diabetes WHERE DIABETES_UNIQUE_ROW_ID ={{selected-id}}");names = list(a.keys());values = [list(v) for v in a.to_numpy()];output = " | ".join(f"[{header}] : {value}" for header,value in zip(names,values[0]));',
                            type: 'py',
                        },
                    },
                    {
                        id: '13466',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'output',
                        },
                    },
                ],
            },
        },
        blocks: {
            'page-1': {
                parent: {
                    id: 'parent-id',
                    slot: 'parent-slot',
                },
                slots: {
                    content: {
                        children: ['text--9892', 'select--9417', 'text--3468'],
                        name: 'content',
                    },
                },
                widget: 'page',
                data: {
                    route: '',
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
                                queryId: 'on-page-load',
                            },
                        },
                    ],
                },
                id: 'page-1',
            },
            'text--9892': {
                id: 'text--9892',
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
                        fontSize: '24px',
                    },
                    text: 'Read Diabetes record',
                    variant: 'p',
                    route: 'text--9892',
                },
                listeners: {},
                slots: {},
            },
            'select--9417': {
                id: 'select--9417',
                widget: 'select',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {
                        padding: '4px',
                    },
                    label: 'Select Unique ID',
                    hint: '',
                    options: '{{row-ids.output}}',
                    required: false,
                    disabled: false,
                    loading: '{{row-ids.isLoading}}',
                    route: 'select--9417',
                    optionLabel: '',
                    optionSublabel: '',
                },
                listeners: {
                    onChange: [
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'get-data',
                            },
                        },
                    ],
                },
                slots: {
                    content: {
                        name: 'content',
                        children: [],
                    },
                },
            },
            'text--3468': {
                id: 'text--3468',
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
                    text: ' {{response.output}} ',
                    variant: 'p',
                    route: 'text--3468',
                },
                listeners: {},
                slots: {},
            },
        },
        variables: {
            'row-ids': {
                type: 'cell',
                to: 'on-page-load',
                cellId: '1354',
            },
            'selected-id': {
                type: 'block',
                to: 'select--9417',
            },
            response: {
                type: 'cell',
                to: 'get-data',
                cellId: '13466',
            },
        },
        executionOrder: ['on-page-load', 'get-data'],
        version: '1.0.0-alpha.4',
    },
};
