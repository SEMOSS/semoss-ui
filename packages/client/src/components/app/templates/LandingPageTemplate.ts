import LANDINGPAGE from '@/assets/img/LandingPage.jpeg';

import { Template } from './templates.types';

export const LandingPageTemplate: Template = {
    name: 'Landing Page',
    description: 'A simple starter landing page with navigation cards',
    image: LANDINGPAGE,
    author: 'SYSTEM',
    lastUpdatedDate: new Date().toISOString(),
    tags: [],
    state: {
        version: '1.0.0-alpha.1',
        dependencies: {},
        variables: {},
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
                        children: ['text--5552', 'text--6096', 'link--1766'],
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
};
