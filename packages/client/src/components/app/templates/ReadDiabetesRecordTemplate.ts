import { ActionMessages } from '@/stores';
import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';

// TODO:
// 1. Better menu options
// 2. Better view for record
// 3. Better load states
export const ReadDiabetesRecordTemplate: Template = {
    name: 'Read Diabetes Record',
    description: 'Read a diabetes record',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
            'get-data': {
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
                            code: 'output',
                            type: 'py',
                        },
                    },
                ],
            },
            'on-page-load': {
                id: 'on-page-load',
                cells: [
                    {
                        id: '90193',
                        widget: 'query-import',
                        parameters: {
                            frameVariableName: 'FRAME_90193',
                            frameType: 'PY',
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '18427',
                        widget: 'code',
                        parameters: {
                            code: "unique_row_id = FRAME_90193['DIABETES_UNIQUE_ROW_ID'].to_list();",
                            type: 'py',
                        },
                    },
                    {
                        id: '1354',
                        widget: 'code',
                        parameters: {
                            code: 'unique_row_id',
                            type: 'py',
                        },
                    },
                ],
            },
        },
        blocks: {
            'text--9892': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {},
                widget: 'text',
                data: {
                    route: 'text--9892',
                    variant: 'p',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '24px',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Read Diabetes record',
                },
                listeners: {},
                id: 'text--9892',
            },
            'text--3468': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {},
                widget: 'text',
                data: {
                    route: 'text--3468',
                    variant: 'p',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: ' {{response.output}} ',
                },
                listeners: {},
                id: 'text--3468',
            },
            'select--9417': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'select',
                data: {
                    optionLabel: '',
                    route: 'select--9417',
                    hint: '',
                    optionSublabel: '',
                    options: '{{row-ids.output}}',
                    style: {
                        padding: '4px',
                    },
                    disabled: false,
                    label: 'Select Unique ID',
                    loading: '{{page-load-query.isLoading}}',
                    required: false,
                },
                listeners: {
                    onChange: [
                        {
                            payload: {
                                queryId: 'get-data',
                            },
                            message: ActionMessages.RUN_QUERY,
                        },
                    ],
                },
                id: 'select--9417',
            },
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
                    loading: '{{response-sheet.isLoading}}',
                },
                listeners: {
                    onPageLoad: [
                        {
                            payload: {
                                queryId: 'on-page-load',
                            },
                            message: ActionMessages.RUN_QUERY,
                        },
                    ],
                },
                id: 'page-1',
            },
        },
        variables: {
            'row-ids': {
                to: 'on-page-load',
                type: 'cell',
                cellId: '1354',
            },
            response: {
                to: 'get-data',
                type: 'cell',
                cellId: '13466',
            },
            'selected-id': {
                to: 'select--9417',
                type: 'block',
            },
            'page-load-query': {
                type: 'query',
                to: 'on-page-load',
            },
            'response-sheet': {
                type: 'query',
                to: 'get-data',
            },
        },
        executionOrder: ['on-page-load', 'get-data'],
        version: '1.0.0-alpha.4',
    },
};
