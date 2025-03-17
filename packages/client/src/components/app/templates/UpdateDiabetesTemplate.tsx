import { ActionMessages } from '@/stores';
import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';
import { InputBlockConfig } from '@semoss/renderer';

export const UpdateDiabetesTemplate: Template = {
    name: 'Update Diabetes Record',
    description: 'Update a new diabetes record',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
            'fields-section': {
                id: 'fields-section',
                cells: [
                    {
                        id: '40951',
                        widget: 'code',
                        parameters: {
                            code: 'print({{AGE}});',
                            type: 'py',
                        },
                    },
                    {
                        id: '97758',
                        widget: 'code',
                        parameters: {
                            code: 'print({{BP_1D}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '71076',
                        widget: 'code',
                        parameters: {
                            code: 'print({{BP_1S}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '94699',
                        widget: 'code',
                        parameters: {
                            code: 'print({{BP_2D}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '80038',
                        widget: 'code',
                        parameters: {
                            code: 'print({{BP_2S}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '83731',
                        widget: 'code',
                        parameters: {
                            code: 'print({{CHOL}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '40151',
                        widget: 'code',
                        parameters: {
                            code: 'print({{DRUG}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '15753',
                        widget: 'code',
                        parameters: {
                            code: 'print({{dtype}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '18939',
                        widget: 'code',
                        parameters: {
                            code: 'print({{FRAME}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '4153',
                        widget: 'code',
                        parameters: {
                            code: 'print({{GENDER}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '9557',
                        widget: 'code',
                        parameters: {
                            code: 'print({{GLYHB}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '73933',
                        widget: 'code',
                        parameters: {
                            code: 'print({{HDL}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '39058',
                        widget: 'code',
                        parameters: {
                            code: 'print({{HEIGHT}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '73233',
                        widget: 'code',
                        parameters: {
                            code: 'print({{HIP}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '19503',
                        widget: 'code',
                        parameters: {
                            code: 'print({{ID}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '18583',
                        widget: 'code',
                        parameters: {
                            code: 'a= {{LOCATION}};print(a);print(type(a));if not a:;    print("empty");else:;    print("true")',
                            type: 'py',
                        },
                    },
                    {
                        id: '10176',
                        widget: 'code',
                        parameters: {
                            code: 'print({{RATIO}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '85800',
                        widget: 'code',
                        parameters: {
                            code: 'print({{STAB_GLU}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '3983',
                        widget: 'code',
                        parameters: {
                            code: 'print({{TIME_PPN}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '38835',
                        widget: 'code',
                        parameters: {
                            code: 'print({{WAIST}})',
                            type: 'py',
                        },
                    },
                    {
                        id: '88882',
                        widget: 'code',
                        parameters: {
                            code: 'print({{WEIGHT}})',
                            type: 'py',
                        },
                    },
                ],
            },
            'display-diabetes-record': {
                id: 'display-diabetes-record',
                cells: [
                    {
                        id: 'cell-1',
                        widget: 'code',
                        parameters: {
                            code: 'from gaas_gpt_database import DatabaseEngine',
                            type: 'py',
                        },
                    },
                    {
                        id: 'cell-2',
                        widget: 'code',
                        parameters: {
                            code: 'databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\')',
                            type: 'py',
                        },
                    },
                    {
                        id: 'cell-3',
                        widget: 'code',
                        parameters: {
                            code: 'databaseEngine.execQuery(query = "SELECT DIABETES_UNIQUE_ROW_ID FROM diabetes where DRUG=\'Test_Drug\'")',
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
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            frameType: 'PY',
                            frameVariableName: 'FRAME_51891',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '90921',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: "unique_row_id = FRAME_51891['DIABETES_UNIQUE_ROW_ID'].to_list();",
                        },
                    },
                    {
                        id: '71095',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'unique_row_id',
                        },
                    },
                ],
            },
            'update-diabetes-record': {
                id: 'update-diabetes-record',
                cells: [
                    {
                        id: '59072',
                        widget: 'query-import',
                        parameters: {
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            frameType: 'PY',
                            frameVariableName: 'FRAME_59072',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '27239',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\');a = FRAME_59072.columns.to_list();a.remove("DIABETES_UNIQUE_ROW_ID");selectedID={{selected-id}};col_string = ", ".join(a);inputValues = [repr({{DRUG}}),repr({{LOCATION}}),str({{GLYHB}}),str({{BP_1D}}),str({{BP_2D}}),str({{WAIST}}),str({{RATIO}}),str({{HEIGHT}}),repr({{FRAME}}),str({{HIP}}),str({{HDL}}),str({{BP_1S}}),str({{BP_2S}}),str({{STAB_GLU}}),repr({{GENDER}}),str({{ID}}),str({{TIME_PPN}}),str({{WEIGHT}}),str({{CHOL}}),str({{AGE}})];set_clause = ", ".join([f"{col} = {val}" for col, val in zip(a, inputValues)]);QS = f\'UPDATE diabetes SET {set_clause} WHERE DIABETES_UNIQUE_ROW_ID = {{selected-id}}\';',
                        },
                    },
                    {
                        id: '72351',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'databaseEngine.updateData(query =QS )',
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
                    value: '1',
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
                    value: '1',
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
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'update-diabetes-record',
                            },
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
                    value: '1',
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
                    value: '"Test_Frame444"',
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
                    value: '1',
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
                    value: '1',
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
                    value: '"D_Type"',
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
                    value: '1',
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
                    value: '"Test_Gender"',
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
                    value: '1.2',
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
                    value: '"Test_Drug44"',
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
                    value: '1',
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
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'on-page-load',
                            },
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
                    value: '""',
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
                    value: '1',
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
                    value: '1',
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
                    value: '1',
                    required: false,
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--5362',
            },
            question: {
                parent: {
                    id: 'form',
                    slot: 'children',
                },
                slots: {},
                widget: 'input',
                data: {
                    style: {
                        padding: '4px',
                        width: '100%',
                    },
                    label: 'Question',
                    rows: 3,
                    type: 'text',
                    value: '',
                    required: true,
                },
                listeners: {
                    onClick: [],
                },
                id: 'question',
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
                    value: '1',
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
                    value: '1',
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
                    value: '1',
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
                    value: '1',
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
                    value: '1',
                    required: 'true',
                },
                listeners: {
                    onChange: [],
                },
                id: 'input--1200',
            },
            'select--6891': {
                id: 'select--6891',
                widget: 'select',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                    },
                    value: '444',
                    label: 'UNIQUE_ROW_ID',
                    hint: '',
                    options: '{{load-unique-id.output}}',
                    required: false,
                    disabled: false,
                    loading: '{{load-unique-id.isLoading}}',
                    route: 'select--6891',
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
            'text--2516': {
                id: 'text--2516',
                widget: 'text',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '19px',
                        textOverflow: 'ellipsis',
                        fontWeight: '',
                    },
                    text: 'Select a Unique Id and update the record.',
                    route: 'text--2516',
                },
                listeners: {},
                slots: {},
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
            'display-diabetes-record': {
                isInput: false,
                isOutput: true,
                to: 'display-diabetes-record',
                type: 'query',
            },
            AGE: {
                to: 'input--1200',
                type: 'block',
            },
            BP_2D: {
                to: 'input--9538',
                type: 'block',
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
            'fields-section': {
                isInput: true,
                isOutput: true,
                to: 'fields-section',
                type: 'query',
            },
            BP_2S: {
                to: 'input--1154',
                type: 'block',
            },
            response: {
                isInput: false,
                isOutput: false,
                to: 'update-diabetes-record',
                type: 'cell',
                cellId: '81570',
            },
            TIME_PPN: {
                to: 'input--437',
                type: 'block',
            },
            UNIQUE_ROW_ID: {
                type: 'block',
                to: 'select--6891',
            },
            'load-unique-id': {
                type: 'cell',
                to: 'on-page-load',
                cellId: '71095',
            },
            'selected-id': {
                type: 'block',
                to: 'select--6891',
            },
        },
        executionOrder: [
            'display-diabetes-record',
            'insert-diabetes-record',
            'fields-section',
            'on-page-load',
            'update-diabetes-record',
        ],
        version: '1.0.0-alpha.4',
    },
};
