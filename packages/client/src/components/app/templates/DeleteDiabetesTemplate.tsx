import { ActionMessages } from '@/stores';
import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';

export const DeleteDiabetesTemplate: Template = {
    name: 'Delete Diabetes Record',
    description: 'Delete a diabetes record',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
            'on-page-load': {
                id: 'on-page-load',
                cells: [
                    {
                        id: '22910',
                        widget: 'query-import',
                        parameters: {
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            frameType: 'PY',
                            frameVariableName: 'FRAME_22910',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '36923',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: "unique_row_id = FRAME_22910['DIABETES_UNIQUE_ROW_ID'].to_list();",
                        },
                    },
                    {
                        id: '3274',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'unique_row_id',
                        },
                    },
                ],
            },
            'delete-record': {
                id: 'delete-record',
                cells: [
                    {
                        id: '13836',
                        widget: 'code',
                        parameters: {
                            code: 'from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\');',
                            type: 'py',
                        },
                    },
                    {
                        id: '53370',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'databaseEngine.removeData(query = "DELETE FROM diabetes WHERE DIABETES_UNIQUE_ROW_ID={{delete_id}}")',
                        },
                    },
                ],
            },
        },
        blocks: {
            'page-1': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {
                    content: {
                        children: [
                            'text--7810',
                            'select--9490',
                            'button--601',
                            'text--2655',
                        ],
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
            'text--7810': {
                id: 'text--7810',
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
                        fontSize: '20px',
                    },
                    text: 'Delete Diabetes Record',
                    variant: 'p',
                    route: 'text--7810',
                },
                listeners: {},
                slots: {},
            },
            'select--9490': {
                id: 'select--9490',
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
                    options: '{{unique_row_id.output}}',
                    required: false,
                    disabled: false,
                    loading: '{{unique_row_id.isLoading}}',
                    route: 'select--9490',
                    optionLabel: '',
                    optionSublabel: '',
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
            'button--601': {
                id: 'button--601',
                widget: 'button',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {},
                    label: 'Delete Record',
                    loading: '{{delete-id.isLoading}}',
                    disabled: false,
                    variant: 'contained',
                    color: 'error',
                    route: 'button--601',
                },
                listeners: {
                    onClick: [
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'delete-record',
                            },
                        },
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'on-page-load',
                            },
                        },
                    ],
                },
                slots: {},
            },
            'text--2655': {
                id: 'text--2655',
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
                    text: ' {{delete-id.output}} ',
                    variant: 'p',
                    route: 'text--2655',
                },
                listeners: {},
                slots: {},
            },
        },
        variables: {
            delete_id: {
                type: 'block',
                to: 'select--9490',
            },
            unique_row_id: {
                type: 'cell',
                to: 'on-page-load',
                cellId: '3274',
            },
            'delete-id': {
                type: 'cell',
                to: 'delete-record',
                cellId: '53370',
            },
        },
        executionOrder: ['on-page-load', 'delete-record'],
        version: '1.0.0-alpha.4',
    },
};
