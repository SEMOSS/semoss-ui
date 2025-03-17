import { ActionMessages } from '@/stores';
import { Template } from './templates.types';
import CHATAI from '@/assets/img/query.jpeg';
import { InputBlockConfig } from '@semoss/renderer';

export const CreateDiabetesTemplate: Template = {
    name: 'Create Diabetes Record',
    description: 'Create a new diabetes record',
    image: CHATAI,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        queries: {
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
            'insert-diabetes-record': {
                id: 'insert-diabetes-record',
                cells: [
                    {
                        id: '33516',
                        widget: 'query-import',
                        parameters: {
                            databaseId: '950eb187-e352-444d-ad6a-6476ed9390af',
                            frameType: 'PY',
                            frameVariableName: 'FRAME_33516',
                            selectQuery: 'SELECT * FROM diabetes',
                        },
                    },
                    {
                        id: '81570',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\');a = FRAME_33516.columns.to_list();a.remove("DIABETES_UNIQUE_ROW_ID");col_string = ", ".join(a);inputValues = \', \'.join([repr({{DRUG}}),repr({{LOCATION}}),str({{GLYHB}}),str({{BP_1D}}),str({{BP_2D}}),str({{WAIST}}),str({{RATIO}}),str({{HEIGHT}}),repr({{FRAME}}),str({{HIP}}),str({{HDL}}),str({{BP_1S}}),str({{BP_2S}}),str({{STAB_GLU}}),repr({{GENDER}}),str({{ID}}),str({{TIME_PPN}}),str({{WEIGHT}}),str({{CHOL}}),str({{AGE}})]);QS = f\'INSERT INTO diabetes({col_string}) VALUES ({inputValues})\';databaseEngine.insertData(query =QS )',
                        },
                    },
                    {
                        id: '67219',
                        widget: 'code',
                        parameters: {
                            type: 'py',
                            code: 'databaseEngine.insertData(query =QS )',
                        },
                    },
                ],
            },
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
                    label: 'Add record',
                    loading: '{{db-response.isLoading}}',
                },
                listeners: {
                    onClick: [
                        {
                            message: ActionMessages.RUN_QUERY,
                            payload: {
                                queryId: 'insert-diabetes-record',
                            },
                        },
                    ],
                },
                id: 'submit',
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
                    onPageLoad: [],
                },
                id: 'page-1',
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
                        fontSize: '24px',
                        textOverflow: 'ellipsis',
                    },
                    text: 'Create Diabetes Record',
                },
                listeners: {},
                id: 'description',
            },
            'input--1200': {
                id: 'input--1200',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'AGE',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: 'true',
                    loading: false,
                    route: 'input--1200',
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
            'input--2903': {
                id: 'input--2903',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '"Test_Drug"',
                    label: 'DRUG',
                    hint: '',
                    type: 'text',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--2903',
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
            'input--6721': {
                id: 'input--6721',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '"D_Type"',
                    label: 'dtype',
                    hint: '',
                    type: 'text',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--6721',
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
            'input--1536': {
                id: 'input--1536',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '""',
                    label: 'LOCATION',
                    hint: '',
                    type: 'text',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--1536',
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
            'input--7685': {
                id: 'input--7685',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'GLYHB',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--7685',
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
            'input--3118': {
                id: 'input--3118',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'BP_1D',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--3118',
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
            'input--9538': {
                id: 'input--9538',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'BP_2D',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--9538',
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
            'input--1422': {
                id: 'input--1422',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'WAIST',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--1422',
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
            'input--6320': {
                id: 'input--6320',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'RATIO',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--6320',
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
            'input--5617': {
                id: 'input--5617',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'HEIGHT',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--5617',
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
            'input--3855': {
                id: 'input--3855',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '"Test_Frame"',
                    label: 'FRAME',
                    hint: '',
                    type: 'text',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--3855',
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
            'input--4121': {
                id: 'input--4121',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'HIP',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--4121',
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
            'input--7858': {
                id: 'input--7858',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'HDL',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--7858',
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
            'input--8307': {
                id: 'input--8307',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'BP_1S',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--8307',
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
            'input--1154': {
                id: 'input--1154',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1.2',
                    label: 'BP_2S',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--1154',
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
            'input--8195': {
                id: 'input--8195',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'STAB_GLU',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--8195',
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
            'input--2187': {
                id: 'input--2187',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '"Test_Gender"',
                    label: 'GENDER',
                    hint: '',
                    type: 'text',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--2187',
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
            'input--4018': {
                id: 'input--4018',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'ID',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--4018',
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
            'input--437': {
                id: 'input--437',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'TIME_PPN',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--437',
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
            'input--5362': {
                id: 'input--5362',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'WEIGHT',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--5362',
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
            'input--5206': {
                id: 'input--5206',
                widget: 'input',
                parent: {
                    id: 'container',
                    slot: 'children',
                },
                data: {
                    style: {
                        width: '100%',
                        padding: '4px',
                    },
                    value: '1',
                    label: 'CHOL',
                    hint: '',
                    type: 'number',
                    rows: 1,
                    multiline: false,
                    disabled: false,
                    required: false,
                    loading: false,
                    route: 'input--5206',
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
            'text--4905': {
                id: 'text--4905',
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
                    text: ' {{db-response.output}} ',
                    variant: 'p',
                    route: 'text--4905',
                },
                listeners: {},
                slots: {},
            },
        },
        variables: {
            model: {
                isInput: true,
                isOutput: false,
                type: 'model',
                value: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
            },
            'display-diabetes-record': {
                isInput: false,
                isOutput: true,
                to: 'display-diabetes-record',
                type: 'query',
            },
            AGE: {
                type: 'block',
                to: 'input--1200',
            },
            LOCATION: {
                type: 'block',
                to: 'input--1536',
            },
            GLYHB: {
                type: 'block',
                to: 'input--7685',
            },
            BP_1D: {
                type: 'block',
                to: 'input--3118',
            },
            BP_2D: {
                type: 'block',
                to: 'input--9538',
            },
            WAIST: {
                type: 'block',
                to: 'input--1422',
            },
            RATIO: {
                type: 'block',
                to: 'input--6320',
            },
            HEIGHT: {
                type: 'block',
                to: 'input--5617',
            },
            FRAME: {
                type: 'block',
                to: 'input--3855',
            },
            HIP: {
                type: 'block',
                to: 'input--4121',
            },
            HDL: {
                type: 'block',
                to: 'input--7858',
            },
            BP_1S: {
                type: 'block',
                to: 'input--8307',
            },
            BP_2S: {
                type: 'block',
                to: 'input--1154',
            },
            STAB_GLU: {
                type: 'block',
                to: 'input--8195',
            },
            GENDER: {
                type: 'block',
                to: 'input--2187',
            },
            ID: {
                type: 'block',
                to: 'input--4018',
            },
            TIME_PPN: {
                type: 'block',
                to: 'input--437',
            },
            WEIGHT: {
                type: 'block',
                to: 'input--5362',
            },
            CHOL: {
                type: 'block',
                to: 'input--5206',
            },
            DRUG: {
                type: 'block',
                to: 'input--2903',
            },
            dtype: {
                type: 'block',
                to: 'input--6721',
            },
            'fields-section': {
                type: 'query',
                to: 'fields-section',
                isInput: true,
                isOutput: true,
            },
            response: {
                type: 'cell',
                to: 'insert-diabetes-record',
                cellId: '81570',
                isInput: false,
                isOutput: false,
            },
            'db-response': {
                type: 'query',
                to: 'insert-diabetes-record',
            },
        },
        executionOrder: [
            'display-diabetes-record',
            'insert-diabetes-record',
            'fields-section',
        ],
        version: '1.0.0-alpha.4',
    },
};
