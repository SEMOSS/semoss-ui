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

export const VARIABLE_TYPES = [
    'block',
    'cell',
    'query',
    'string',
    'number',
    'database',
    'model',
    'vector',
    'storage',
    'function',
];
export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};

export const DEFAULT_TEMPLATE: Template[] = [
    // {
    //     name: 'Hello World',
    //     description: 'A simple starter app',
    //     image: HELLOWORLD,
    //     author: 'SYSTEM',
    //     lastUpdatedDate: new Date().toISOString(),
    //     tags: [],
    //     state: {
    //         queries: {},
    //         blocks: {
    //             'page-1': {
    //                 id: 'page-1',
    //                 widget: 'page',
    //                 parent: null,
    //                 data: {
    //                     style: PageBlockConfig.data.style,
    //                 },
    //                 listeners: {},
    //                 slots: {
    //                     content: {
    //                         name: 'content',
    //                         children: ['container-1'],
    //                     },
    //                 },
    //             },
    //             'container-1': {
    //                 id: 'container-1',
    //                 widget: 'container',
    //                 parent: {
    //                     id: 'page-1',
    //                     slot: 'content',
    //                 },
    //                 data: {
    //                     style: ContainerBlockConfig.data.style,
    //                 },
    //                 listeners: {},
    //                 slots: {
    //                     children: {
    //                         name: 'children',
    //                         children: ['text-1'],
    //                     },
    //                 },
    //             },
    //             'text-1': {
    //                 id: 'text-1',
    //                 widget: 'text',
    //                 parent: {
    //                     id: 'container-1',
    //                     slot: 'children',
    //                 },
    //                 data: {
    //                     style: TextBlockConfig.data.style,
    //                     text: 'Hello World',
    //                 },
    //                 listeners: {},
    //                 slots: {},
    //             },
    //         },
    //     },
    // },
    {
        name: 'Landing Page',
        description: 'A simple starter landing page with navigation cards',
        image: LANDINGPAGE,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: [],
        state: {
            dependencies: {},
            tokens: {},
            queries: {},
            blocks: {
                'text--584': {
                    parent: {
                        id: 'container--7869',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
                    },
                    listeners: {},
                    id: 'text--584',
                },
                'text--5552': {
                    parent: {
                        id: 'container--2367',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            fontSize: '2.125rem',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Landing Page Title',
                    },
                    listeners: {},
                    id: 'text--5552',
                },
                'container--651': {
                    parent: {
                        id: 'container--8339',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: [
                                'image--3397',
                                'text--6236',
                                'text--8225',
                                'link--5585',
                            ],
                            name: 'children',
                        },
                    },
                    widget: 'container',
                    data: {
                        style: {
                            border: '1px solid #f2f2f2',
                            'border-radius': '8px',
                            padding: '16px',
                            flexWrap: 'wrap',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '280px',
                        },
                    },
                    listeners: {},
                    id: 'container--651',
                },
                'text--8225': {
                    parent: {
                        id: 'container--651',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
                    },
                    listeners: {},
                    id: 'text--8225',
                },
                'link--5585': {
                    parent: {
                        id: 'container--651',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'link',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Navigate',
                    },
                    listeners: {},
                    id: 'link--5585',
                },
                'image--8616': {
                    parent: {
                        id: 'container--7869',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'image',
                    data: {
                        src: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--8616',
                },
                'container--2367': {
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    slots: {
                        children: {
                            children: [
                                'text--5552',
                                'text--6096',
                                'link--1766',
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
                            width: '872px',
                        },
                    },
                    listeners: {},
                    id: 'container--2367',
                },
                'page-1': {
                    slots: {
                        content: {
                            children: ['container--2367', 'container--2846'],
                            name: 'content',
                        },
                    },
                    widget: 'page',
                    data: {
                        style: {
                            padding: '80px',
                            fontFamily: 'roboto',
                            alignItems: 'center',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '40px',
                        },
                    },
                    listeners: {
                        onPageLoad: [],
                    },
                    parent: null,
                    id: 'page-1',
                },
                'text--2926': {
                    parent: {
                        id: 'container--2406',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
                    },
                    listeners: {},
                    id: 'text--2926',
                },
                'link--5302': {
                    parent: {
                        id: 'container--9691',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'link',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Navigate',
                    },
                    listeners: {},
                    id: 'link--5302',
                },
                'link--3046': {
                    parent: {
                        id: 'container--7869',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'link',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Navigate',
                    },
                    listeners: {},
                    id: 'link--3046',
                },
                'container--2846': {
                    parent: {
                        id: 'page-1',
                        slot: 'content',
                    },
                    slots: {
                        children: {
                            children: [
                                'text--9344',
                                'text--3906',
                                'container--8339',
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
                            width: '872px',
                        },
                    },
                    listeners: {},
                    id: 'container--2846',
                },
                'container--2406': {
                    parent: {
                        id: 'container--8339',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: [
                                'image--4342',
                                'text--6031',
                                'text--2926',
                                'link--4120',
                            ],
                            name: 'children',
                        },
                    },
                    widget: 'container',
                    data: {
                        style: {
                            border: '1px solid #f2f2f2',
                            'border-radius': '8px',
                            padding: '16px',
                            flexWrap: 'wrap',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '280px',
                        },
                    },
                    listeners: {},
                    id: 'container--2406',
                },
                'text--6096': {
                    parent: {
                        id: 'container--2367',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Drag and drop your content below to start populating your page.  Add images, text, and links to customize your landing page and make it your own.  Whether you are setting up a portfolio, a business page, or a personal blog, this is the first step to creating something unique and engaging.  Make your vision come to life!',
                    },
                    listeners: {},
                    id: 'text--6096',
                },
                'text--6031': {
                    parent: {
                        id: 'container--2406',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resource 1',
                    },
                    listeners: {},
                    id: 'text--6031',
                },
                'text--9344': {
                    parent: {
                        id: 'container--2846',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            fontSize: '1.875rem',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resources',
                    },
                    listeners: {},
                    id: 'text--9344',
                },
                'link--1766': {
                    parent: {
                        id: 'container--2367',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'link',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Explore',
                    },
                    listeners: {},
                    id: 'link--1766',
                },
                'text--6236': {
                    parent: {
                        id: 'container--651',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resource 3',
                    },
                    listeners: {},
                    id: 'text--6236',
                },
                'text--6474': {
                    parent: {
                        id: 'container--7869',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resource 4',
                    },
                    listeners: {},
                    id: 'text--6474',
                },
                'container--9691': {
                    parent: {
                        id: 'container--8339',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: [
                                'image--3010',
                                'text--2539',
                                'text--6477',
                                'link--5302',
                            ],
                            name: 'children',
                        },
                    },
                    widget: 'container',
                    data: {
                        style: {
                            border: '1px solid #f2f2f2',
                            'border-radius': '8px',
                            padding: '16px',
                            flexWrap: 'wrap',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '280px',
                        },
                    },
                    listeners: {},
                    id: 'container--9691',
                },
                'text--6477': {
                    parent: {
                        id: 'container--9691',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
                    },
                    listeners: {},
                    id: 'text--6477',
                },
                'link--4120': {
                    parent: {
                        id: 'container--2406',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'link',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Navigate',
                    },
                    listeners: {},
                    id: 'link--4120',
                },
                'image--3397': {
                    parent: {
                        id: 'container--651',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'image',
                    data: {
                        src: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--3397',
                },
                'image--4342': {
                    parent: {
                        id: 'container--2406',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'image',
                    data: {
                        src: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--4342',
                },
                'text--2539': {
                    parent: {
                        id: 'container--9691',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resource 2',
                    },
                    listeners: {},
                    id: 'text--2539',
                },
                'container--8339': {
                    parent: {
                        id: 'container--2846',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: [
                                'container--2406',
                                'container--9691',
                                'container--651',
                                'container--7869',
                                'container--6803',
                                'container--6798',
                            ],
                            name: 'children',
                        },
                    },
                    widget: 'container',
                    data: {
                        style: {
                            padding: '4px',
                            flexWrap: 'wrap',
                            flexDirection: 'row',
                            display: 'flex',
                            gap: '8px',
                        },
                    },
                    listeners: {},
                    id: 'container--8339',
                },
                'text--3906': {
                    parent: {
                        id: 'container--2846',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'text',
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.',
                    },
                    listeners: {},
                    id: 'text--3906',
                },
                'image--3010': {
                    parent: {
                        id: 'container--9691',
                        slot: 'children',
                    },
                    slots: {},
                    widget: 'image',
                    data: {
                        src: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
                        style: {
                            alignItems: 'center',
                            display: 'flex',
                            width: '100%',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            justifyContent: 'center',
                            height: '200px',
                        },
                        title: '',
                    },
                    listeners: {},
                    id: 'image--3010',
                },
                'container--7869': {
                    parent: {
                        id: 'container--8339',
                        slot: 'children',
                    },
                    slots: {
                        children: {
                            children: [
                                'image--8616',
                                'text--6474',
                                'text--584',
                                'link--3046',
                            ],
                            name: 'children',
                        },
                    },
                    widget: 'container',
                    data: {
                        style: {
                            border: '1px solid #f2f2f2',
                            'border-radius': '8px',
                            padding: '16px',
                            flexWrap: 'wrap',
                            flexDirection: 'column',
                            display: 'flex',
                            gap: '8px',
                            width: '280px',
                        },
                    },
                    listeners: {},
                    id: 'container--7869',
                },
                'container--6803': {
                    id: 'container--6803',
                    widget: 'container',
                    parent: {
                        id: 'container--8339',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '16px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            width: '280px',
                            border: '1px solid #f2f2f2',
                            'border-radius': '8px',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'image--2421',
                                'text--2158',
                                'text--1255',
                                'link--5550',
                            ],
                        },
                    },
                },
                'container--6798': {
                    id: 'container--6798',
                    widget: 'container',
                    parent: {
                        id: 'container--8339',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '16px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            width: '280px',
                            border: '1px solid #f2f2f2',
                            'border-radius': '8px',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'image--1722',
                                'text--2234',
                                'text--4050',
                                'link--6225',
                            ],
                        },
                    },
                },
                'image--2421': {
                    id: 'image--2421',
                    widget: 'image',
                    parent: {
                        id: 'container--6803',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '200px',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                        },
                        src: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
                        title: '',
                    },
                    listeners: {},
                    slots: {},
                },
                'image--1722': {
                    id: 'image--1722',
                    widget: 'image',
                    parent: {
                        id: 'container--6798',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '200px',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                        },
                        src: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
                        title: '',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2158': {
                    id: 'text--2158',
                    widget: 'text',
                    parent: {
                        id: 'container--6803',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resource 5',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2234': {
                    id: 'text--2234',
                    widget: 'text',
                    parent: {
                        id: 'container--6798',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontWeight: 'bold',
                        },
                        text: 'Resource 6',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--1255': {
                    id: 'text--1255',
                    widget: 'text',
                    parent: {
                        id: 'container--6803',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--4050': {
                    id: 'text--4050',
                    widget: 'text',
                    parent: {
                        id: 'container--6798',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
                    },
                    listeners: {},
                    slots: {},
                },
                'link--5550': {
                    id: 'link--5550',
                    widget: 'link',
                    parent: {
                        id: 'container--6803',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Navigate',
                    },
                    listeners: {},
                    slots: {},
                },
                'link--6225': {
                    id: 'link--6225',
                    widget: 'link',
                    parent: {
                        id: 'container--6798',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: '',
                        text: 'Navigate',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
    {
        name: 'Blocks Guide',
        description:
            'A help guide on the Blocks within our drag and drop app builder',
        image: LANDINGPAGE,
        author: 'SYSTEM',
        lastUpdatedDate: new Date().toISOString(),
        tags: [],
        state: {
            tokens: {},
            dependencies: {},
            queries: {
                MyProjects: {
                    id: 'MyProjects',
                    cells: [
                        {
                            id: '93890',
                            widget: 'code',
                            parameters: {
                                code: 'MyProjects();',
                                type: 'pixel',
                            },
                        },
                    ],
                },
                SampleText: {
                    id: 'SampleText',
                    cells: [
                        {
                            id: '45163',
                            widget: 'code',
                            parameters: {
                                code: [
                                    'x = "This is sample query output text"',
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                Checkbox: {
                    id: 'Checkbox',
                    cells: [
                        {
                            id: '13565',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x = 'The box is checked' if ('{{block.checkbox--5820.value}}' == 'true') else 'The box is unchecked'",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                LuckyNumber: {
                    id: 'LuckyNumber',
                    cells: [
                        {
                            id: '72111',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x = 'My lucky number is: ' + '{{block.input--6319.value}}'",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                Birthday: {
                    id: 'Birthday',
                    cells: [
                        {
                            id: '9250',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x = 'My birthday is: ' + '{{block.input--2303.value}}'",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                Plants: {
                    id: 'Plants',
                    cells: [
                        {
                            id: '84356',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x = ['Bird of Paradise', 'Monstera', 'Palm', 'Pothos', 'Snake Plant', 'Spider Plant']",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                UploadFile: {
                    id: 'UploadFile',
                    cells: [
                        {
                            id: '62511',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x =  'Uploaded file: ' + '{{block.upload--6197.value}}'",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                ToggleButton: {
                    id: 'ToggleButton',
                    cells: [
                        {
                            id: '73684',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x = 'The toggle value is: ' + '{{block.toggle-button--5325.value}}'",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                VegaGraph: {
                    id: 'VegaGraph',
                    cells: [
                        {
                            id: '76950',
                            widget: 'code',
                            parameters: {
                                code: [
                                    'x = {',
                                    '   "$schema": "https://vega.github.io/schema/vega-lite/v5.json",',
                                    '   "title": "Scatter Plot",',
                                    '   "width": 300,',
                                    '   "height": 300,',
                                    '   "description": "A scatterplot.",',
                                    '   "mark": "point",',
                                    '   "encoding": {',
                                    '       "x": {',
                                    '               "field": "a",',
                                    '               "type": "quantitative",',
                                    '       },',
                                    '       "y": {',
                                    '               "field": "b",',
                                    '               "type": "quantitative",',
                                    '       },',
                                    '   },',
                                    '   "data": {',
                                    '       "values": [',
                                    '                   {',
                                    '                   "a": 10,',
                                    '                   "b": 28,',
                                    '                   },',
                                    '                   {',
                                    '                   "a": 20,',
                                    '                   "b": 55,',
                                    '                   },',
                                    '                   {',
                                    '                   "a": 30,',
                                    '                   "b": 91,',
                                    '                   },',
                                    '                   {',
                                    '                   "a": 40,',
                                    '                   "b": 81,',
                                    '                   },',
                                    '                   {',
                                    '                   "a": 50,',
                                    '                   "b": 81,',
                                    '                   },',
                                    '                   {',
                                    '                   "a": 60,',
                                    '                   "b": 19,',
                                    '                   },',
                                    '                   {',
                                    '                   "a": 70,',
                                    '                   "b": 87,',
                                    '                   },',
                                    '       ]',
                                    '   },',
                                    '}',
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                FavoriteAnimal: {
                    id: 'FavoriteAnimal',
                    cells: [
                        {
                            id: '87071',
                            widget: 'code',
                            parameters: {
                                code: [
                                    "x = 'My favorite animal is: ' + '{{block.input--431.value}}'",
                                    'x',
                                ],
                                type: 'py',
                            },
                        },
                    ],
                },
                AreaChart: {
                    id: 'AreaChart',
                    cells: [
                        {
                            id: '80775',
                            widget: 'code',
                            parameters: {
                                code: [
                                    'a = [',
                                    '   {',
                                    '   "a": "A",',
                                    '   "b": 28',
                                    '   },',
                                    '   {',
                                    '   "a": "B",',
                                    '   "b": 55',
                                    '   },',
                                    '   {',
                                    '   "a": "C",',
                                    '   "b": 91',
                                    '   },',
                                    '   {',
                                    '   "a": "A",',
                                    '   "b": 28',
                                    '   },',
                                    '   {',
                                    '   "a": "D",',
                                    '   "b": 81',
                                    '   },',
                                    '   {',
                                    '   "a": "E",',
                                    '   "b": 81',
                                    '   },',
                                    '   {',
                                    '   "a": "G",',
                                    '   "b": 19',
                                    '   },',
                                    '   {',
                                    '   "a": "H",',
                                    '   "b": 87',
                                    '   },',
                                    ']',
                                    'a',
                                ],
                                type: 'py',
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
                                'text--6392',
                                'text--3020',
                                'container--1666',
                                'container--1831',
                                'container--555',
                                'container--7745',
                                'container--5582',
                                'container--6325',
                                'container--3837',
                                'container--9816',
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
                        onPageLoad: [
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'AreaChart',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'Birthday',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'Checkbox',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'FavoriteAnimal',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'LuckyNumber',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'MyProjects',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'Plants',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'SampleText',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'ToggleButton',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'UploadFile',
                                },
                            },
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'VegaGraph',
                                },
                            },
                        ],
                    },
                    id: 'page-1',
                },
                'text--3020': {
                    id: 'text--3020',
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
                        text: 'Blocks Guide',
                        variant: 'h1',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--1831': {
                    id: 'container--1831',
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
                            flexWrap: 'wrap',
                            width: '%',
                            height: '%',
                            border: '1px solid ',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['container--5188'],
                        },
                    },
                },
                'text--41': {
                    id: 'text--41',
                    widget: 'text',
                    parent: {
                        id: 'container--5188',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Layout Blocks',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--5188': {
                    id: 'container--5188',
                    widget: 'container',
                    parent: {
                        id: 'container--1831',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '2px',
                            flexWrap: 'wrap',
                            width: '100%',
                            height: '100%',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--41',
                                'text--6609',
                                'text--2616',
                                'container--2370',
                            ],
                        },
                    },
                },
                'text--6609': {
                    id: 'text--6609',
                    widget: 'text',
                    parent: {
                        id: 'container--5188',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Container',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2616': {
                    id: 'text--2616',
                    widget: 'text',
                    parent: {
                        id: 'container--5188',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Holds other components',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--8855': {
                    id: 'container--8855',
                    widget: 'container',
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            width: '100%',
                            height: '100%',
                        },
                    },
                    listeners: {},
                    parent: {
                        id: 'container--555',
                        slot: 'content',
                    },
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--3224',
                                'text--5153',
                                'text--142',
                                'container--1897',
                            ],
                        },
                    },
                },
                'container--555': {
                    id: 'container--555',
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
                            flexWrap: 'wrap',
                            width: '%',
                            height: '%',
                            border: '2px solid ',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['container--8855'],
                        },
                    },
                },
                'container--7745': {
                    id: 'container--7745',
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
                            gap: '2px',
                            flexWrap: 'wrap',
                            border: '1px solid ',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--9082',
                                'text--30',
                                'text--6606',
                                'text--5481',
                                'text--5245',
                                'text--4117',
                                'text--2114',
                                'text--8202',
                                'text--9539',
                                'text--2952',
                                'text--6053',
                                'container--8959',
                                'text--6394',
                                'text--209',
                                'text--128',
                                'link--1017',
                                'text--8954',
                                'text--2858',
                                'markdown--8409',
                            ],
                        },
                    },
                },
                'text--9082': {
                    id: 'text--9082',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Text Blocks',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--30': {
                    id: 'text--30',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'HTML Header Tag',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--6606': {
                    id: 'text--6606',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Displays text at varying levels of importance/emphasis using HTML header tags',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5245': {
                    id: 'text--5245',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <h1> text',
                        variant: 'h1',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5481': {
                    id: 'text--5481',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            color: 'rgb(0,76,255)',
                            fontFamily: 'Times New Roman',
                        },
                        text: 'This is <h1> text',
                        variant: 'h1',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2114': {
                    id: 'text--2114',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <h3> text',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--8202': {
                    id: 'text--8202',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <h4> text',
                        variant: 'h4',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--9539': {
                    id: 'text--9539',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <h5> text',
                        variant: 'h5',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2952': {
                    id: 'text--2952',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <h6> text',
                        variant: 'h6',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--6053': {
                    id: 'text--6053',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <p> text',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--6394': {
                    id: 'text--6394',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            fontStyle: 'italic',
                        },
                        text: 'This is italicized <p> text',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--209': {
                    id: 'text--209',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Link',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--128': {
                    id: 'text--128',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Navigates to an external URL when clicked',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'link--1017': {
                    id: 'link--1017',
                    widget: 'link',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: 'https://workshop.cfg.deloitte.com/docs/Get%20Started/Overview',
                        text: 'Link to CFG AI Docs',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--8954': {
                    id: 'text--8954',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Markdown',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2858': {
                    id: 'text--2858',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Renders custom text using markdown syntax',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'markdown--8409': {
                    id: 'markdown--8409',
                    widget: 'markdown',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                        },
                        markdown:
                            '#### This is a markdown example\n\n- Bulleted lists are easy\n- Just use a hyphen',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--5582': {
                    id: 'container--5582',
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
                            gap: '6px',
                            flexWrap: 'wrap',
                            border: '1px solid #000000',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--390',
                                'text--5377',
                                'text--9087',
                                'text--3944',
                                'container--4577',
                                'text--7255',
                                'text--9133',
                                'text--3514',
                                'container--6560',
                                'toggle-button--5325',
                                'text--9185',
                                'text--2618',
                                'text--3798',
                                'container--5572',
                                'checkbox--5820',
                                'text--5300',
                                'text--5549',
                                'container--235',
                                'input--431',
                                'container--6051',
                                'input--6319',
                                'container--1243',
                                'input--2303',
                                'text--7706',
                                'text--3786',
                                'text--6800',
                                'container--6075',
                                'text--7714',
                                'text--8542',
                                'container--5252',
                                'upload--6197',
                            ],
                        },
                    },
                },
                'text--390': {
                    id: 'text--390',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Input Blocks',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5377': {
                    id: 'text--5377',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Button',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--9087': {
                    id: 'text--9087',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Takes an action, such as executing a query',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'button--8845': {
                    id: 'button--8845',
                    widget: 'button',
                    parent: {
                        id: 'container--4577',
                        slot: 'children',
                    },
                    data: {
                        style: {},
                        label: 'Retrieve Projects',
                        loading: '{{query.MyProjects.isLoading}}',
                        disabled: false,
                        variant: 'contained',
                        color: 'primary',
                    },
                    listeners: {
                        onClick: [
                            {
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: 'MyProjects',
                                },
                            },
                        ],
                    },
                    slots: {},
                },
                'text--3944': {
                    id: 'text--3944',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'When the button is clicked, the "MyProjects" query will be executed. The button will appear in a loading state while the query is executing.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--9185': {
                    id: 'text--9185',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Checkbox',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--1048': {
                    id: 'text--1048',
                    widget: 'text',
                    parent: {
                        id: 'container--8959',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.SampleText.output}}',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2618': {
                    id: 'text--2618',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Represents a user selection',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'checkbox--5820': {
                    id: 'checkbox--5820',
                    widget: 'checkbox',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: 'none',
                        },
                        label: 'Example Checkbox',
                        required: false,
                        disabled: false,
                        value: false,
                    },
                    listeners: {
                        onChange: [],
                    },
                    slots: {},
                },
                'text--9911': {
                    id: 'text--9911',
                    widget: 'text',
                    parent: {
                        id: 'container--5572',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.Checkbox.output}}',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--3798': {
                    id: 'text--3798',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: '"Checkbox" query output:',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5300': {
                    id: 'text--5300',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Input',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5549': {
                    id: 'text--5549',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Accepts text, number, or date user-input',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'input--431': {
                    id: 'input--431',
                    widget: 'input',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            width: '100%',
                            padding: '4px',
                        },
                        value: 'Dog',
                        label: 'Animal',
                        hint: '',
                        type: 'text',
                        rows: 1,
                        multiline: false,
                        disabled: false,
                        required: false,
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
                'text--1087': {
                    id: 'text--1087',
                    widget: 'text',
                    parent: {
                        id: 'container--235',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.FavoriteAnimal.output}} ',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--7196': {
                    id: 'text--7196',
                    widget: 'text',
                    parent: {
                        id: 'container--6051',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.LuckyNumber.output}} ',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'input--6319': {
                    id: 'input--6319',
                    widget: 'input',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            width: '100%',
                            padding: '4px',
                        },
                        value: '9',
                        label: 'Number',
                        hint: '',
                        type: 'number',
                        rows: 1,
                        multiline: false,
                        disabled: false,
                        required: false,
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
                'text--8060': {
                    id: 'text--8060',
                    widget: 'text',
                    parent: {
                        id: 'container--1243',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.Birthday.output}} ',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'input--2303': {
                    id: 'input--2303',
                    widget: 'input',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            width: '100%',
                            padding: '4px',
                        },
                        value: '',
                        label: '',
                        hint: '',
                        type: 'date',
                        rows: 1,
                        multiline: false,
                        disabled: false,
                        required: false,
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
                'text--7706': {
                    id: 'text--7706',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Select',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--3786': {
                    id: 'text--3786',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Allows user selection from a set list of items (only simple lists of strings are supported, ie no complex objects)',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--6800': {
                    id: 'text--6800',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'The below select has options generated by the "Plants" query. It will appear in a loading state when the "Plants" query is executing.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'select--7762': {
                    id: 'select--7762',
                    widget: 'select',
                    parent: {
                        id: 'container--6075',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                        },
                        value: '',
                        label: 'House Plants',
                        hint: '',
                        options: '{{query.Plants.output}}',
                        required: false,
                        disabled: false,
                        loading: '{{query.Plants.isLoading}}',
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
                'text--7714': {
                    id: 'text--7714',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'File Upload',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--8542': {
                    id: 'text--8542',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Allows user upload of a file',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'upload--6197': {
                    id: 'upload--6197',
                    widget: 'upload',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            width: '100%',
                            padding: '4px',
                        },
                        value: '/Screenshot (99).png',
                        label: 'Upload File',
                        hint: '',
                        loading: false,
                        disabled: false,
                        required: false,
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
                'text--3253': {
                    id: 'text--3253',
                    widget: 'text',
                    parent: {
                        id: 'container--5252',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.UploadFile.output}} ',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--7255': {
                    id: 'text--7255',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Toggle Button',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--9133': {
                    id: 'text--9133',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Allows user selection from a set of options (ideally two, but no more than three)',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'toggle-button--5325': {
                    id: 'toggle-button--5325',
                    widget: 'toggle-button',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        disabled: false,
                        color: 'primary',
                        size: 'small',
                        options: [
                            {
                                display: 'Yes',
                                value: 'true',
                            },
                            {
                                display: 'No',
                                value: 'false',
                            },
                        ],
                        mandatory: true,
                        multiple: false,
                    },
                    listeners: {},
                    slots: {},
                },
                'text--6014': {
                    id: 'text--6014',
                    widget: 'text',
                    parent: {
                        id: 'container--6560',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: ' {{query.ToggleButton.output}} ',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--3514': {
                    id: 'text--3514',
                    widget: 'text',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'The below toggle button has the "mandatory" flag turned on, so once an option is selected it cannot be deselected, ensuring that an options is set. The "multiple" flag is turned off, so only one option may be selected at a time.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--3837': {
                    id: 'container--3837',
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
                            gap: '2px',
                            flexWrap: 'wrap',
                            border: '1px solid ',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--7517',
                                'text--4376',
                                'text--9919',
                                'image--3997',
                                'text--5182',
                                'text--3979',
                                'text--5581',
                                'text--1188',
                                'iframe--7817',
                                'text--1396',
                                'text--8780',
                                'html--3430',
                            ],
                        },
                    },
                },
                'text--7517': {
                    id: 'text--7517',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'HTML Element Blocks',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'iframe--7817': {
                    id: 'iframe--7817',
                    widget: 'iframe',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {},
                        src: 'https://workshop.cfg.deloitte.com/docs/Get%20Started/Overview',
                        title: 'CFG AI Docs',
                        enableFrameInteractions: true,
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5182': {
                    id: 'text--5182',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Iframe',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--3979': {
                    id: 'text--3979',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Renders an <iframe> element that displays an external URL',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5581': {
                    id: 'text--5581',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'The iframe below has the "frame interaction" flag enabled, so users can click within the frame.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--1188': {
                    id: 'text--1188',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            color: '#d10000',
                            fontStyle: 'italic',
                        },
                        text: 'Note: frame interactions are always disabled in design mode',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--2370': {
                    id: 'container--2370',
                    widget: 'container',
                    parent: {
                        id: 'container--5188',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            border: '4px solid #ff0000',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--7156'],
                        },
                    },
                },
                'text--7156': {
                    id: 'text--7156',
                    widget: 'text',
                    parent: {
                        id: 'container--2370',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is text in a container',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--4117': {
                    id: 'text--4117',
                    widget: 'text',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'This is <h2> text',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--6325': {
                    id: 'container--6325',
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
                            gap: '2px',
                            flexWrap: 'wrap',
                            border: '1px solid ',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--1143',
                                'text--8894',
                                'container--5794',
                            ],
                        },
                    },
                },
                'progress--5855': {
                    id: 'progress--5855',
                    widget: 'progress',
                    parent: {
                        id: 'container--5794',
                        slot: 'children',
                    },
                    data: {
                        type: 'linear',
                        value: '68',
                        includeLabel: true,
                        size: '300px',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--1143': {
                    id: 'text--1143',
                    widget: 'text',
                    parent: {
                        id: 'container--6325',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Progress Blocks',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--5794': {
                    id: 'container--5794',
                    widget: 'container',
                    parent: {
                        id: 'container--6325',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '12px',
                            gap: '8px',
                            flexWrap: 'wrap',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['progress--5855'],
                        },
                    },
                },
                'text--8894': {
                    id: 'text--8894',
                    widget: 'text',
                    parent: {
                        id: 'container--6325',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Displays a static linear bar visualization of some value out of 100',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--1396': {
                    id: 'text--1396',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'HTML Tag',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--4376': {
                    id: 'text--4376',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Image',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--9919': {
                    id: 'text--9919',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Displays an external image in an <image> tag',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'image--3997': {
                    id: 'image--3997',
                    widget: 'image',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '200px',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                        },
                        src: 'https://t3.ftcdn.net/jpg/05/48/63/18/240_F_548631876_pX3pcK7lupzm6ZrXquBdMylRrgoMvap5.jpg',
                        title: 'Cat on rocket ship',
                    },
                    listeners: {},
                    slots: {},
                },
                'html--3430': {
                    id: 'html--3430',
                    widget: 'html',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                        },
                        html: `<html><body><div style="padding:0px 16px;"><p>I am normal</p><p style="color:red;">I am red</p><p style="color:blue;">I am blue</p><p style="font-size:50px;">I am big</p></div></body></html>`,
                    },
                    listeners: {},
                    slots: {},
                },
                'text--8780': {
                    id: 'text--8780',
                    widget: 'text',
                    parent: {
                        id: 'container--3837',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Renders custom HTML',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--9816': {
                    id: 'container--9816',
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
                            gap: '2px',
                            flexWrap: 'wrap',
                            border: '1px solid #000000',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--6469',
                                'text--6534',
                                'text--8211',
                                'link--1061',
                                'link--1785',
                                'text--5008',
                                'vega--7109',
                                'text--805',
                                'container--6005',
                                'text--4017',
                                'container--7650',
                            ],
                        },
                    },
                },
                'text--6469': {
                    id: 'text--6469',
                    widget: 'text',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Visualization Blocks',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--6534': {
                    id: 'text--6534',
                    widget: 'text',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Vega',
                        variant: 'h3',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--8211': {
                    id: 'text--8211',
                    widget: 'text',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Vega is a visualization grammar, a declarative language for creating, saving, and sharing interactive visualization designs. With Vega, you can describe the visual appearance and interactive behavior of a visualization in a JSON format, and generate web-based views using Canvas or SVG. Two different versions of Vega are supported:',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'link--1061': {
                    id: 'link--1061',
                    widget: 'link',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: 'https://vega.github.io/vega/',
                        text: 'Vega',
                    },
                    listeners: {},
                    slots: {},
                },
                'link--1785': {
                    id: 'link--1785',
                    widget: 'link',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        href: 'https://vega.github.io/vega-lite/',
                        text: 'Vega Lite',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--5008': {
                    id: 'text--5008',
                    widget: 'text',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'CFG AI provides blocks with sample graphs to provide you with a starting point.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'vega--4877': {
                    id: 'vega--4877',
                    widget: 'vega',
                    parent: {
                        id: 'container--7650',
                        slot: 'children',
                    },
                    data: {
                        specJson: '{{query.VegaGraph.output}}',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--4017': {
                    id: 'text--4017',
                    widget: 'text',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Below is a scatter plot whose JSON is initialized entirely by a query.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--1666': {
                    id: 'container--1666',
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
                            flexWrap: 'wrap',
                            border: '1px solid ',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: [
                                'text--7980',
                                'text--9687',
                                'text--8317',
                                'text--2101',
                                'text--7225',
                                'text--4270',
                            ],
                        },
                    },
                },
                'text--7980': {
                    id: 'text--7980',
                    widget: 'text',
                    parent: {
                        id: 'container--1666',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Bracket Syntax',
                        variant: 'h2',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--9687': {
                    id: 'text--9687',
                    widget: 'text',
                    parent: {
                        id: 'container--1666',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Bracket syntax can be used to refer to block or query values and properties. For example:',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--8317': {
                    id: 'text--8317',
                    widget: 'text',
                    parent: {
                        id: 'container--1666',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: '{{query.[Query Name].output}}',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--2101': {
                    id: 'text--2101',
                    widget: 'text',
                    parent: {
                        id: 'container--1666',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: '{{block.[Block ID].value}}',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--7225': {
                    id: 'text--7225',
                    widget: 'text',
                    parent: {
                        id: 'container--1666',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'As of right now, bracket syntax cannot be combined with regular text. If you need to combine bracket syntax values with other text, you must define a query to handle the interpolation.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--4270': {
                    id: 'text--4270',
                    widget: 'text',
                    parent: {
                        id: 'container--1666',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                            color: '#2b00ff',
                        },
                        text: 'This guide contains examples of how to utilize bracket syntax with blocks and queries. Such examples are outlined in blue.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--8959': {
                    id: 'container--8959',
                    widget: 'container',
                    parent: {
                        id: 'container--7745',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--1048'],
                        },
                    },
                },
                'container--4577': {
                    id: 'container--4577',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['button--8845'],
                        },
                    },
                },
                'container--6560': {
                    id: 'container--6560',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--6014'],
                        },
                    },
                },
                'container--5572': {
                    id: 'container--5572',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--9911'],
                        },
                    },
                },
                'container--235': {
                    id: 'container--235',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--1087'],
                        },
                    },
                },
                'container--6051': {
                    id: 'container--6051',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--7196'],
                        },
                    },
                },
                'container--1243': {
                    id: 'container--1243',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--8060'],
                        },
                    },
                },
                'container--6075': {
                    id: 'container--6075',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['select--7762'],
                        },
                    },
                },
                'container--5252': {
                    id: 'container--5252',
                    widget: 'container',
                    parent: {
                        id: 'container--5582',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '0px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                            margin: '0px',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['text--3253'],
                        },
                    },
                },
                'container--7650': {
                    id: 'container--7650',
                    widget: 'container',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['vega--4877'],
                        },
                    },
                },
                'vega--964': {
                    id: 'vega--964',
                    widget: 'vega',
                    parent: {
                        id: 'container--6005',
                        slot: 'children',
                    },
                    data: {
                        variation: 'area-chart',
                        specJson: {
                            $schema:
                                'https://vega.github.io/schema/vega-lite/v5.json',
                            title: 'Area Chart',
                            width: 300,
                            height: 300,
                            data: {
                                values: '{{query.AreaChart.output}}',
                            },
                            mark: 'area',
                            encoding: {
                                x: {
                                    field: 'a',
                                },
                                y: {
                                    aggregate: 'sum',
                                    field: 'b',
                                    title: 'count',
                                },
                            },
                        },
                    },
                    listeners: {},
                    slots: {},
                },
                'vega--7109': {
                    id: 'vega--7109',
                    widget: 'vega',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        variation: 'radial-plot',
                        specJson:
                            '{\n  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",\n  "title": "Radial Plot",\n  "width": 300,\n  "height": 300,\n  "description": "A simple radial chart with embedded data.",\n  "data": {\n    "values": [\n      12,\n      23,\n      47,\n      6,\n      52,\n      19\n    ]\n  },\n  "layer": [\n    {\n      "mark": {\n        "type": "arc",\n        "innerRadius": 20,\n        "stroke": "#fff"\n      }\n    },\n    {\n      "mark": {\n        "type": "text",\n        "radiusOffset": 10\n      },\n      "encoding": {\n        "text": {\n          "field": "data",\n          "type": "quantitative"\n        }\n      }\n    }\n  ],\n  "encoding": {\n    "theta": {\n      "field": "data",\n      "type": "quantitative",\n      "stack": true\n    },\n    "radius": {\n      "field": "data",\n      "scale": {\n        "type": "sqrt",\n        "zero": true,\n        "rangeMin": 20\n      }\n    },\n    "color": {\n      "field": "data",\n      "type": "nominal",\n      "legend": null\n    }\n  }\n}',
                    },
                    listeners: {},
                    slots: {},
                },
                'text--805': {
                    id: 'text--805',
                    widget: 'text',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            padding: '4px',
                            whiteSpace: 'pre-line',
                            textOverflow: 'ellipsis',
                        },
                        text: 'Below is an area chart with the chart values defined by a query.',
                        variant: 'p',
                    },
                    listeners: {},
                    slots: {},
                },
                'container--6005': {
                    id: 'container--6005',
                    widget: 'container',
                    parent: {
                        id: 'container--9816',
                        slot: 'children',
                    },
                    data: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px',
                            gap: '8px',
                            flexWrap: 'wrap',
                            border: '2px solid #2b00ff',
                        },
                    },
                    listeners: {},
                    slots: {
                        children: {
                            name: 'children',
                            children: ['vega--964'],
                        },
                    },
                },
                'text--6392': {
                    id: 'text--6392',
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
                        text: ' {{query.test.output}} ',
                        variant: 'h1',
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
            tokens: {},
            dependencies: {},
            queries: {
                ['ask-llm']: {
                    id: 'ask-llm',
                    cells: [
                        {
                            id: 'cell-1',
                            widget: 'code',
                            parameters: {
                                type: 'pixel',
                                // Do we want to replace hardcoded LLM to a user default
                                code: `LLM(engine=["17753d59-4536-4415-a6ac-f673b1a90a87"], command=["{{block.question.value}}"]);`,
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
                    listeners: {
                        onPageLoad: [],
                    },
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
            dependencies: {},
            tokens: {},
            queries: {
                ['ask-model']: {
                    id: 'ask-model',
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
                                // Do we want to replace hardcoded LLM to a user default
                                code: `NLPQuery2(engine=["17753d59-4536-4415-a6ac-f673b1a90a87"], command=["{{block.question.value}}"]);`,
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
                    listeners: {
                        onPageLoad: [],
                    },
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
                        text: '{{query.ask-model.output.value.0.Query}}',
                    },
                    listeners: {},
                    slots: {},
                },
            },
        },
    },
];
