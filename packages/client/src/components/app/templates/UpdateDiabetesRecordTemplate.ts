import { ActionMessages } from '@semoss/renderer';

import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';

// TODO:
// 1. Clean up design
export const UpdateDiabetesRecordTemplate: Template = {
    name: 'Update Diabetes Record',
    description: 'Update a new diabetes record',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
            'update-diabetes-record': {
                id: 'update-diabetes-record',
                cells: [
                    {
                        id: '59072',
                        widget: 'query-import',
                        parameters: {
                            frameVariableName: 'FRAME_59072',
                            frameType: 'PY',
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '27239',
                        widget: 'code',
                        parameters: {
                            code: 'from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\');a = FRAME_59072.columns.to_list();a.remove("DIABETES_UNIQUE_ROW_ID");selectedID={{selected-id}};col_floating = ", ".join(a);inputValues = ["{{DRUG}}","{{LOCATION}}",float({{GLYHB}}),float({{BP_1D}}),float({{BP_2D}}),float({{WAIST}}),float({{RATIO}}),float({{HEIGHT}}),"{{FRAME}}",float({{HIP}}),float({{HDL}}),float({{BP_1S}}),float({{BP_2S}}),float({{STAB_GLU}}),"{{GENDER}}",float({{ID}}),float({{TIME_PPN}}),float({{WEIGHT}}),float({{CHOL}}),float({{AGE}})];filtered_columns = [];filtered_values = [];filtered_columns, filtered_values = zip(*[(col, f"\'{val}\'") if isinstance(val, str) and val else (col, val) for col, val in zip(a, inputValues) if val]);set_clause = ", ".join([f"{col} = {val}" for col, val in zip(filtered_columns, filtered_values)]);QS = f\'UPDATE diabetes SET {set_clause} WHERE DIABETES_UNIQUE_ROW_ID = {{selected-id}}\';',
                            type: 'py',
                        },
                    },
                    {
                        id: '72351',
                        widget: 'code',
                        parameters: {
                            code: 'databaseEngine.updateData(query =QS )',
                            type: 'py',
                        },
                    },
                ],
            },
            'on-page-load': {
                id: 'on-page-load',
                cells: [
                    {
                        id: '51891',
                        widget: 'query-import',
                        parameters: {
                            frameVariableName: 'FRAME_51891',
                            frameType: 'PY',
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '90921',
                        widget: 'code',
                        parameters: {
                            code: "unique_row_id = FRAME_51891['DIABETES_UNIQUE_ROW_ID'].to_list();",
                            type: 'py',
                        },
                    },
                    {
                        id: '71095',
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
            container: {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {
                    children: {
                        children: [
                            'description',
                            'text--2516',
                            'select--6891',
                            'input--4018',
                            'input--1200',
                            'input--1536',
                            'input--7685',
                            'input--3118',
                            'input--9538',
                            'input--1422',
                            'input--6320',
                            'input--5617',
                            'input--3855',
                            'input--4121',
                            'input--7858',
                            'input--8307',
                            'input--1154',
                            'input--8195',
                            'input--2187',
                            'input--437',
                            'input--5362',
                            'input--5206',
                            'input--2903',
                            'input--6721',
                            'submit',
                        ],
                        name: 'children',
                    },
                },
                widget: 'container',
                data: {
                    style: {
                        padding: '4px',
                        flexWrap: 'wrap',
                        flexDirection: 'column',
                        display: 'flex',
                        gap: '8px',
                    },
                },
                listeners: {},
                id: 'container',
            },
            'input--6320': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--6320',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'RATIO',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--6320',
            },
            'input--4121': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--4121',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'HIP',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--4121',
            },
            submit: {
                parent: {
                    id: 'form',
                    slot: 'children',
                },
                slots: {},
                widget: 'button',
                data: {
                    variant: 'contained',
                    style: {},
                    label: 'Update record',
                    loading: '{{db-response.isLoading}}',
                },
                listeners: {
                    onClick: [
                        {
                            payload: {
                                queryId: 'update-diabetes-record',
                            },
                            message: ActionMessages.RUN_QUERY,
                        },
                    ],
                },
                id: 'submit',
            },
            'input--7858': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--7858',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'HDL',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--7858',
            },
            description: {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '25px',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Update Diabetes Record',
                },
                listeners: {},
                id: 'description',
            },
            'input--3855': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--3855',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'FRAME',
                    type: 'text',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--3855',
            },
            'input--3118': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--3118',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'BP_1D',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--3118',
            },
            'input--8307': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--8307',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'BP_1S',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--8307',
            },
            'input--6721': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--6721',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'dtype',
                    type: 'text',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--6721',
            },
            'input--9538': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--9538',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'BP_2D',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--9538',
            },
            'input--2187': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--2187',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'GENDER',
                    type: 'text',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--2187',
            },
            'input--1154': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--1154',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'BP_2S',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--1154',
            },
            'input--2903': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--2903',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'DRUG',
                    type: 'text',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--2903',
            },
            'input--5617': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--5617',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'HEIGHT',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--5617',
            },
            'text--4905': {
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                slots: {},
                widget: 'text',
                data: {
                    route: 'text--4905',
                    variant: 'p',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                    },
                    text: ' {{db-response.output}} ',
                },
                listeners: {},
                id: 'text--4905',
            },
            'page-1': {
                parent: {
                    id: 'parent-id',
                    slot: 'parent-slot',
                },
                slots: {
                    content: {
                        children: ['container', 'text--4905'],
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
                            payload: {
                                queryId: 'on-page-load',
                            },
                            message: ActionMessages.RUN_QUERY,
                        },
                    ],
                },
                id: 'page-1',
            },
            'input--1536': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--1536',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'LOCATION',
                    type: 'text',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--1536',
            },
            'input--8195': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--8195',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'STAB_GLU',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--8195',
            },
            'input--7685': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--7685',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'GLYHB',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--7685',
            },
            'input--5362': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--5362',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'WEIGHT',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--5362',
            },
            'input--4018': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--4018',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'ID',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--4018',
            },
            'input--5206': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--5206',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'CHOL',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--5206',
            },
            'input--1422': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--1422',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'WAIST',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--1422',
            },
            'input--437': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--437',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'TIME_PPN',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--437',
            },
            'input--1200': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {
                    content: {
                        children: [],
                        name: 'content',
                    },
                },
                widget: 'input',
                data: {
                    route: 'input--1200',
                    hint: '',
                    multiline: false,
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    disabled: false,
                    label: 'AGE',
                    type: 'number',
                    rows: 1,
                    loading: false,
                    value: '',
                    required: 'true',
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--1200',
            },
            'text--2516': {
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                slots: {},
                widget: 'text',
                data: {
                    route: 'text--2516',
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '19px',
                        textOverflow: 'ellipsis',
                        fontWeight: '',
                    },
                    text: 'Select a Unique Id and update the record.',
                },
                listeners: {},
                id: 'text--2516',
            },
            'select--6891': {
                parent: {
                    id: 'container',
                    slot: 'children',
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
                    route: 'select--6891',
                    hint: '',
                    optionSublabel: '',
                    options: '{{load-unique-id.output}}',
                    style: {
                        padding: '4px',
                    },
                    disabled: false,
                    label: 'UNIQUE_ROW_ID',
                    loading: '{{page-load-query.isLoading}}',
                    value: '',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'select--6891',
            },
        },
        variables: {
            LOCATION: {
                to: 'input--1536',
                type: 'block',
            },
            DRUG: {
                to: 'input--2903',
                type: 'block',
            },
            'db-response': {
                to: 'update-diabetes-record',
                type: 'query',
            },
            GLYHB: {
                to: 'input--7685',
                type: 'block',
            },
            BP_1D: {
                to: 'input--3118',
                type: 'block',
            },
            WAIST: {
                to: 'input--1422',
                type: 'block',
            },
            RATIO: {
                to: 'input--6320',
                type: 'block',
            },
            FRAME: {
                to: 'input--3855',
                type: 'block',
            },
            HDL: {
                to: 'input--7858',
                type: 'block',
            },
            BP_1S: {
                to: 'input--8307',
                type: 'block',
            },
            STAB_GLU: {
                to: 'input--8195',
                type: 'block',
            },
            GENDER: {
                to: 'input--2187',
                type: 'block',
            },
            model: {
                isInput: true,
                isOutput: false,
                type: 'model',
                value: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
            },
            ID: {
                to: 'input--4018',
                type: 'block',
            },
            WEIGHT: {
                to: 'input--5362',
                type: 'block',
            },
            CHOL: {
                to: 'input--5206',
                type: 'block',
            },
            AGE: {
                to: 'input--1200',
                type: 'block',
            },
            BP_2D: {
                to: 'input--9538',
                type: 'block',
            },
            'load-unique-id': {
                to: 'on-page-load',
                type: 'cell',
                cellId: '71095',
            },
            dtype: {
                to: 'input--6721',
                type: 'block',
            },
            HEIGHT: {
                to: 'input--5617',
                type: 'block',
            },
            HIP: {
                to: 'input--4121',
                type: 'block',
            },
            'selected-id': {
                to: 'select--6891',
                type: 'block',
            },
            UNIQUE_ROW_ID: {
                to: 'select--6891',
                type: 'block',
            },
            BP_2S: {
                to: 'input--1154',
                type: 'block',
            },
            TIME_PPN: {
                to: 'input--437',
                type: 'block',
            },
            'page-load-query': {
                type: 'query',
                to: 'on-page-load',
            },
        },
        executionOrder: [
            'insert-diabetes-record',
            'on-page-load',
            'update-diabetes-record',
        ],
        version: '1.0.0-alpha.4',
    },
};
