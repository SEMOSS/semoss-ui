import { ActionMessages } from './state.actions';
import { Template } from './state.types';
import {
    ButtonBlockConfig,
    ContainerBlockConfig,
    InputBlockConfig,
    PageBlockConfig,
    TextBlockConfig,
    UploadBlockConfig,
} from '@/components/block-defaults';

import HELLOWORLD from '@/assets/img/helloworld.jpeg';
import QUERY from '@/assets/img/query.jpeg';
import CHATAI from '@/assets/img/chatai.jpeg';
import LANDINGPAGE from '@/assets/img/LandingPage.jpeg';

export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};

export const DEFAULT_TEMPLATE: Template[] = [
    {
        name: 'Hello World',
        description: 'A simple starter app',
        image: HELLOWORLD,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: [],
        state: {
            queries: {},
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: PageBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['container-1'],
                        },
                    },
                },
                'container-1': {
                    id: 'container-1',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text-1'],
                        },
                    },
                },
                'text-1': {
                    id: 'text-1',
                    widget: 'text',
                    parent: {
                        id: 'container-1',
                        slot: 'children',
                    },
                    data: {
                        style: TextBlockConfig.data.style,
                        text: 'Hello World',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
    {
        name: 'Ask LLM',
        description: 'Ask an LLM a question',
        image: CHATAI,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: ['LLM'],
        state: {
            queries: {
                ['ask-llm']: {
                    id: 'ask-llm',
                    mode: 'manual',
                    cells: [
                        {
                            id: 'cell-1',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                code: `LLM(engine=["17753d59-4536-4415-a6ac-f673b1a90a87"], command=["{{block.question.value}}"])`,
                            },
                        },
                    ],
                },
            },
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: PageBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['container'],
                        },
                    },
                },
                ['container']: {
                    id: 'container',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'title',
                                'description',
                                'form',
                                'response',
                            ],
                        },
                    },
                },
                ['title']: {
                    id: 'title',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.5rem',
                            ...TextBlockConfig.data.style,
                        },
                        text: 'Ask LLM',
                    },
                    listeners: {},
                    slots: {},
                },
                ['description']: {
                    id: 'description',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.25rem',
                            ...TextBlockConfig.data.style,
                        },
                        text: 'Ask an LLM a question',
                    },
                    listeners: {},
                    slots: {},
                },
                ['form']: {
                    id: 'form',
                    widget: 'container',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['question', 'submit'],
                        },
                    },
                },
                ['question']: {
                    id: 'question',
                    widget: 'input',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: InputBlockConfig.data.style,
                        label: 'Question',
                        rows: 3,
                        type: 'text',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['submit']: {
                    id: 'submit',
                    widget: 'button',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: ButtonBlockConfig.data.style,
                        label: 'Ask',
                        loading: '{{query.ask-llm.isLoading}}',
                        variant: 'contained',
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
                ['response']: {
                    id: 'response',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: TextBlockConfig.data.style,
                        text: '{{query.ask-llm.output.response}}',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
    {
        name: 'Ask CSV',
        description: 'Query a CSV, generate SQL, and see results',
        image: QUERY,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: ['NLP', 'SQL', 'LLM'],
        state: {
            queries: {
                ['ask-model']: {
                    id: 'ask-model',
                    mode: 'manual',
                    cells: [
                        {
                            id: 'file-read',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                code: `FileRead ( filePath = [ "{{block.file.value}}" ], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ PY ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] );`,
                            },
                        },
                        {
                            id: 'py-query-function',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                code: `NLPQuery2(engine=["17753d59-4536-4415-a6ac-f673b1a90a87"], command=["{{block.question.value}}"])`,
                            },
                        },
                    ],
                },
            },
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: PageBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['container'],
                        },
                    },
                },
                ['container']: {
                    id: 'container',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'title',
                                'description',
                                'form',
                                'response',
                            ],
                        },
                    },
                },
                ['title']: {
                    id: 'title',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.5rem',
                            ...TextBlockConfig.data.style,
                        },
                        text: 'CSV Query',
                    },
                    listeners: {},
                    slots: {},
                },
                ['description']: {
                    id: 'description',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            fontSize: '1.25rem',
                            ...TextBlockConfig.data.style,
                        },
                        text: 'Upload a csv file and ask a question',
                    },
                    listeners: {},
                    slots: {},
                },
                ['form']: {
                    id: 'form',
                    widget: 'container',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: ContainerBlockConfig.data.style,
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['file', 'question', 'submit'],
                        },
                    },
                },
                ['file']: {
                    id: 'file',
                    widget: 'upload',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: UploadBlockConfig.data.style,
                        label: 'Upload',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['question']: {
                    id: 'question',
                    widget: 'input',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: InputBlockConfig.data.style,
                        label: 'Question',
                        rows: 3,
                        type: 'text',
                        required: true,
                    },
                    listeners: {
                        onClick: [],
                    },
                    slots: {},
                },
                ['submit']: {
                    id: 'submit',
                    widget: 'button',
                    parent: {
                        id: 'form',
                        slot: 'children',
                    },
                    data: {
                        style: ButtonBlockConfig.data.style,
                        label: 'Ask',
                        loading: '{{query.ask-model.isLoading}}',
                        variant: 'contained',
                    },
                    listeners: {
                        onClick: [
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'ask-model',
                                },
                            },
                        ],
                    },
                    slots: {},
                },
                ['response']: {
                    id: 'response',
                    widget: 'text',
                    parent: {
                        id: 'container',
                        slot: 'children',
                    },
                    data: {
                        style: TextBlockConfig.data.style,
                        text: '{{query.ask-model.output.0.output.Query}}',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
    {
        name: 'Landing Page',
        description: 'A simple starter landing page with navigation cards',
        image: LANDINGPAGE,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: [],
        state: {
            queries: {},
            blocks: {
                'container--8497': {
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    slots: {
                        children: {
                            children: [
                                'link--5768',
                                'link--7352',
                                'link--9492',
                                'link--9930',
                            ],
                            name: 'children',
                        },
                    },
                    widget: 'container',
                    data: {
                        style: {
                            padding: '4px',
                            overflow: 'hidden',
                            flexWrap: 'wrap',
                            flexDirection: 'row',
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'left',
                        },
                    },
                    listeners: {},
                    id: 'container--8497',
                },
                'image--514': {
                    parent: {
                        id: 'link--9930',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'image',
                    data: {
                        src: '',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--514',
                },
                'link--9492': {
                    parent: {
                        id: 'container--8497',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: ['image--9275', 'text--3205'],
                            name: 'children',
                        },
                    },
                    widget: 'link',
                    data: {
                        src: '',
                        style: {
                            border: '1px solid #000000',
                            'border-radius': '5px',
                            padding: '4px',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '250px',
                            height: '300px',
                        },
                    },
                    listeners: {},
                    id: 'link--9492',
                },
                'text--3281': {
                    parent: {
                        id: 'link--9930',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textAlign: 'center',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Navigate to page 4',
                    },
                    listeners: {},
                    id: 'text--3281',
                },
                'text--5410': {
                    parent: {
                        id: 'link--5768',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textAlign: 'center',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Navigate to page 1',
                    },
                    listeners: {},
                    id: 'text--5410',
                },
                'image--3003': {
                    parent: {
                        id: 'link--5768',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'image',
                    data: {
                        src: '',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--3003',
                },
                'text--4835': {
                    parent: {
                        id: 'link--7352',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textAlign: 'center',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Navigate to page 2',
                    },
                    listeners: {},
                    id: 'text--4835',
                },
                'text--3205': {
                    parent: {
                        id: 'link--9492',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textAlign: 'center',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Navigate to page 3',
                    },
                    listeners: {},
                    id: 'text--3205',
                },
                'text--3116': {
                    parent: {
                        id: 'container--3613',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            fontSize: '1.875rem',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Landing Page',
                    },
                    listeners: {},
                    id: 'text--3116',
                },
                'link--7352': {
                    parent: {
                        id: 'container--8497',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: ['image--5235', 'text--4835'],
                            name: 'children',
                        },
                    },
                    widget: 'link',
                    data: {
                        src: '',
                        style: {
                            border: '1px solid #000000',
                            'border-radius': '5px',
                            padding: '4px',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '250px',
                            height: '300px',
                        },
                    },
                    listeners: {},
                    id: 'link--7352',
                },
                'page-1': {
                    slots: {
                        content: {
                            children: [
                                'container--3613',
                                'container--8497',
                                'container--3154',
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
                    parent: null,
                    listeners: {},
                    id: 'page-1',
                },
                'image--5235': {
                    parent: {
                        id: 'link--7352',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'image',
                    data: {
                        src: '',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--5235',
                },
                'link--5768': {
                    parent: {
                        id: 'container--8497',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: ['image--3003', 'text--5410'],
                            name: 'children',
                        },
                    },
                    widget: 'link',
                    data: {
                        src: '',
                        style: {
                            border: '1px solid #000000',
                            'border-radius': '5px',
                            padding: '4px',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '250px',
                            height: '300px',
                        },
                    },
                    listeners: {},
                    id: 'link--5768',
                },
                'container--3613': {
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    slots: {
                        children: {
                            children: ['text--3116'],
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
                    id: 'container--3613',
                },
                'image--9275': {
                    parent: {
                        id: 'link--9492',
                        slot: 'children',
                    },
                    slots: {
                        test: {
                            children: [],
                            name: 'test',
                        },
                    },
                    widget: 'image',
                    data: {
                        src: '',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--9275',
                },
                'link--9930': {
                    parent: {
                        id: 'container--8497',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: ['image--514', 'text--3281'],
                            name: 'children',
                        },
                    },
                    widget: 'link',
                    data: {
                        src: '',
                        style: {
                            border: '1px solid #000000',
                            'border-radius': '5px',
                            padding: '4px',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '250px',
                            height: '300px',
                        },
                    },
                    listeners: {},
                    id: 'link--9930',
                },
                'container--3154': {
                    id: 'container--3154',
                    widget: 'container',
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '8px',
                            overflow: 'hidden',
                            flexWrap: 'wrap',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--650'],
                        },
                    },
                },
                'text--650': {
                    id: 'text--650',
                    widget: 'text',
                    parent: {
                        id: 'container--3154',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Drag and drop your content here to start populating your page.  Add images, text, and links to customize your landing page and make it your own.  Whether you are setting up a portfolio, a business page, or a personal blog, this is the first step to creating something unique and engaging.  Make your vision come to life, start by dragging your content into this space.',
                    },
                    listeners: {},
                    slots: {
                        test: {
                            name: 'test',
                            children: [],
                        },
                    },
                },
            },
        },
    },
];
