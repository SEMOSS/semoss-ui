export const TEST_LIST_OF_STEPS = [
    {
        queries: {
            default: {
                id: 'default',
                cells: [
                    {
                        id: '7797',
                        widget: 'code',
                        parameters: {
                            type: 'pixel',
                            code: 'LLM(engine=["{{model-to-use}}"], command=["Here\'s a job, {{job-title}}, can you get me the skills and tools needed for this job, and most importantly can you format it into a comma seperated value with no extra text, simply a list with skillsets"]);',
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
                        children: ['text--317'],
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
                        justifyContent: 'center',
                    },
                },
                listeners: {},
                id: 'welcome-container-block',
            },
            'page-1': {
                slots: {
                    content: {
                        children: [
                            'welcome-container-block',
                            'input--3489',
                            'input--4567',
                            'input--9978',
                            'input--4846',
                            'input--4165',
                            'button--4823',
                            'text--4590',
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
            'text--317': {
                id: 'text--317',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                    },
                    text: 'Job Qualifications',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'input--3489': {
                id: 'input--3489',
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
                    value: 'Johnnathan',
                    label: 'Name',
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
            'input--4567': {
                id: 'input--4567',
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
                    value: 'Front end engineer',
                    label: 'Job Title',
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
            'button--4823': {
                id: 'button--4823',
                widget: 'button',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {},
                    label: 'Submit',
                    loading: false,
                    disabled: false,
                    variant: 'contained',
                    color: 'primary',
                },
                listeners: {
                    onClick: [
                        {
                            message: 'RUN_QUERY',
                            payload: {
                                queryId: 'default',
                            },
                        },
                    ],
                },
                slots: {},
            },
            'text--4590': {
                id: 'text--4590',
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
                    text: '{{list-of-skills.output.response}}',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'input--9978': {
                id: 'input--9978',
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
                    value: '703-221-1212',
                    label: 'Phone Number',
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
            'input--4846': {
                id: 'input--4846',
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
                    value: 'candidate@gmail.com',
                    label: 'Email',
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
            'input--4165': {
                id: 'input--4165',
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
                    value: '3211 Coast Highway',
                    label: 'Address',
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
        },
        variables: {
            name: {
                to: 'input--3489',
                type: 'block',
                isInput: true,
            },
            'job-title': {
                to: 'input--4567',
                type: 'block',
                isInput: true,
            },
            'model-to-use': {
                to: 'model--7341',
                type: 'model',
                isInput: true,
            },
            'list-of-skills': {
                to: 'default',
                type: 'cell',
                cellId: '7797',
                isOutput: true,
            },
            'phone-number': {
                to: 'input--9978',
                type: 'block',
                isInput: true,
            },
            email: {
                to: 'input--4846',
                type: 'block',
                isInput: true,
            },
            address: {
                to: 'input--4165',
                type: 'block',
                isInput: true,
            },
        },
        dependencies: {
            'model--7341': '4acbe913-df40-4ac0-b28a-daa5ad91b172',
        },
        version: '1.0.0-alpha.2',
    },
    {
        queries: {
            default: {
                id: 'default',
                cells: [
                    {
                        id: '84472',
                        widget: 'code',
                        parameters: {
                            code: 'LLM(engine=["{{model-to-use}}"], command=["Are either {{skill-1}} or {{skill-2}} in this list of skills {{list-of-skills}}.  Required answer (yes or no and cant be both.  if it has one say yes if it doesnt say no)"])',
                            type: 'pixel',
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
                        children: ['text--8010'],
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
                slots: {
                    content: {
                        children: [
                            'welcome-container-block',
                            'input--1958',
                            'input--4112',
                            'button--2129',
                            'text--4981',
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
            'text--8010': {
                id: 'text--8010',
                widget: 'text',
                parent: {
                    id: 'welcome-container-block',
                    slot: 'children',
                },
                data: {
                    style: {
                        padding: '4px',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        fontWeight: 'bold',
                    },
                    text: 'Is Qualified',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'input--1958': {
                id: 'input--1958',
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
                    value: 'Javascript',
                    label: 'Skill 1',
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
            'input--4112': {
                id: 'input--4112',
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
                    value: 'Java',
                    label: 'Skill 2',
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
            'button--2129': {
                id: 'button--2129',
                widget: 'button',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {},
                    label: 'Submit',
                    loading: false,
                    disabled: false,
                    variant: 'contained',
                    color: 'primary',
                },
                listeners: {
                    onClick: [
                        {
                            message: 'RUN_QUERY',
                            payload: {
                                queryId: 'default',
                            },
                        },
                    ],
                },
                slots: {},
            },
            'text--4981': {
                id: 'text--4981',
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
                    text: ' {{is-qualified.output.response}} ',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
        },
        variables: {
            'model-to-use': {
                to: 'model--5007',
                type: 'model',
                isInput: true,
            },
            'skill-1': {
                to: 'input--1958',
                type: 'block',
                isInput: true,
            },
            'skill-2': {
                to: 'input--4112',
                type: 'block',
                isInput: true,
            },
            'list-of-skills': {
                to: 'string--1952',
                type: 'string',
                isInput: true,
            },
            'is-qualified': {
                to: 'default',
                type: 'cell',
                cellId: '84472',
                isOutput: true,
            },
        },
        dependencies: {
            'model--5007': '001510f8-b86e-492e-a7f0-41299775e7d9',
            'string--1952':
                'HTML, CSS, JavaScript, React, Angular, Vue.js, TypeScript, SASS, LESS, Bootstrap, jQuery, Git, Webpack, Babel, ES6, RESTful APIs, GraphQL, AJAX, JSON, Responsive Design, Cross-Browser Compatibility, Accessibility Standards, Unit Testing, Integration Testing, Jest, Mocha, Responsive Design Principles, Front-end Performance Optimization, CSS Grid, Flexbox, UI/UX Principles, Figma, Sketch, Adobe XD, Visual Studio Code, npm, yarn, Agile Methodologies, Scrum',
        },
        version: '1.0.0-alpha.2',
    },
    {
        queries: {
            default: {
                id: 'default',
                cells: [
                    {
                        id: '77773',
                        widget: 'code',
                        parameters: {
                            code: 'LLM(engine=["{{model-to-use}}"], command=["This is their personal details {{name}}-{{phone-number}}}-{{address}}-{{email}} and this is my contact info {{supervisor-name}}, {{supervisor-phone}}, {{supervisor-email}}, Talent Aqusition specialist, {{company-name}} -------> Write me very nice rejection or approval letter based on the sentiment of this message on their qualifications {{is-qualified}}"]);',
                            type: 'pixel',
                        },
                    },
                ],
            },
        },
        blocks: {
            'page-1': {
                slots: {
                    content: {
                        children: [
                            'text--463',
                            'input--7542',
                            'input--9390',
                            'input--8969',
                            'input--4104',
                            'button--9639',
                            'text--5454',
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
            'input--9390': {
                id: 'input--9390',
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
                    label: 'Supervisor name',
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
            'input--8969': {
                id: 'input--8969',
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
                    value: 'john@gmail.com',
                    label: 'Supervisor Email',
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
            'input--4104': {
                id: 'input--4104',
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
                    value: '220-121-1234',
                    label: 'Supervisor phone number',
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
            'input--7542': {
                id: 'input--7542',
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
                    value: 'Deloitte',
                    label: 'Company  name',
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
            'text--463': {
                id: 'text--463',
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
                        textAlign: 'center',
                    },
                    text: 'Send out Approve Reject Letter',
                    variant: 'h1',
                },
                listeners: {},
                slots: {},
            },
            'button--9639': {
                id: 'button--9639',
                widget: 'button',
                parent: {
                    id: 'page-1',
                    slot: 'content',
                },
                data: {
                    style: {},
                    label: 'Submit',
                    loading: false,
                    disabled: false,
                    variant: 'contained',
                    color: 'primary',
                },
                listeners: {
                    onClick: [
                        {
                            message: 'RUN_QUERY',
                            payload: {
                                queryId: 'default',
                            },
                        },
                    ],
                },
                slots: {},
            },
            'text--5454': {
                id: 'text--5454',
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
                    text: '{{email-letter.output.response}}',
                    variant: 'h2',
                },
                listeners: {},
                slots: {},
            },
        },
        variables: {
            'model-to-use': {
                to: 'model--2119',
                type: 'model',
                isInput: true,
            },
            'is-qualified': {
                to: 'string--3874',
                type: 'string',
                isInput: true,
            },
            'email-letter': {
                to: 'default',
                type: 'cell',
                cellId: '77773',
                isOutput: true,
            },
            name: {
                to: 'string--1512',
                type: 'string',
                isInput: true,
            },
            'phone-number': {
                to: 'string--2864',
                type: 'string',
                isInput: true,
            },
            address: {
                to: 'string--583',
                type: 'string',
                isInput: true,
            },
            email: {
                to: 'string--379',
                type: 'string',
                isInput: true,
            },
            'company-name': {
                to: 'input--7542',
                type: 'block',
                isInput: true,
            },
            'supervisor-name': {
                to: 'input--9390',
                type: 'block',
                isInput: true,
            },
            'supervisor-phone': {
                to: 'input--4104',
                type: 'block',
                isInput: true,
            },
            'supervisor-email': {
                to: 'input--8969',
                type: 'block',
                isInput: true,
            },
        },
        dependencies: {
            'model--2119': '4acbe913-df40-4ac0-b28a-daa5ad91b172',
            'string--3874': 'Yes',
            'string--1512': 'John the Candidate',
            'string--2864': '7032211212',
            'string--583': '3124 Coast Highway',
            'string--379': 'candidate@gmail.com',
        },
        version: '1.0.0-alpha.2',
    },
];
