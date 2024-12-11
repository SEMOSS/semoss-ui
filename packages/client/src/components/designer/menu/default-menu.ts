import { BlockJSON } from '@/stores';
import { DesignerMenuItem } from './menu.types';

import BLOCK_AUDIO_PLAYER from '@/assets/img/BLOCK_AUDIO_PLAYER.png';
import BLOCK_AUDIO_INPUT from '@/assets/img/BLOCK_MIC.png';
import BLOCK_BUTTON from '@/assets/img/BLOCK_BUTTON.png';
import BLOCK_CHECKBOX from '@/assets/img/BLOCK_CHECKBOX.png';
import BLOCK_CONTAINER from '@/assets/img/BLOCK_CONTAINER.png';
import BLOCK_FILE_UPLOAD from '@/assets/img/BLOCK_FILE_UPLOAD.png';
import BLOCK_H1_STYLED from '@/assets/img/BLOCK_H1_STYLED.png';
import BLOCK_H1 from '@/assets/img/BLOCK_H1.png';
import BLOCK_H2 from '@/assets/img/BLOCK_H2.png';
import BLOCK_H3 from '@/assets/img/BLOCK_H3.png';
import BLOCK_H4 from '@/assets/img/BLOCK_H4.png';
import BLOCK_H5 from '@/assets/img/BLOCK_H5.png';
import BLOCK_H6 from '@/assets/img/BLOCK_H6.png';
import BLOCK_P from '@/assets/img/BLOCK_P.png';
import BLOCK_MERMAID from '@/assets/img/BLOCK_MERMAID.png';
import BLOCK_LOG from '@/assets/img/LOG.png';
import BLOCK_P_ITALICS from '@/assets/img/BLOCK_P_ITALICS.png';
import BLOCK_INPUT from '@/assets/img/BLOCK_INPUT.png';
import BLOCK_IFRAME from '@/assets/img/BLOCK_IFRAME.png';
import BLOCK_IMAGE from '@/assets/img/BLOCK_IMAGE.png';
import BLOCK_LINK from '@/assets/img/BLOCK_LINK.png';
import BLOCK_MARKDOWN from '@/assets/img/BLOCK_MARKDOWN.png';
import HTML_BLOCK from '@/assets/img/HTML_BLOCK_SM.png';
import BLOCK_PROGRESS_BAR from '@/assets/img/BLOCK_PROGRESS_BAR.png';
import BLOCK_SELECT from '@/assets/img/BLOCK_SELECT.png';
import BLOCK_TOGGLE_BUTTON from '@/assets/img/BLOCK_TOGGLE_BUTTON.png';
import BLOCK_PDF_VIEWER from '@/assets/img/BLOCK_PDF.png';

const SECTION_ELEMENT = 'Element';
const SECTION_INPUT = 'Input';
const SECTION_LAYOUT = 'Layout';
const SECTION_PROGRESS = 'Progress';
const SECTION_TEXT = 'Text';
const SECTION_COMPARE_LLMS = 'Compare LLMs';
const SECTION_MERMAID = 'Mermaid';

/**
 * Show the default blocks menu
 */
export const DEFAULT_MENU: DesignerMenuItem[] = [
    {
        section: SECTION_INPUT,
        image: BLOCK_AUDIO_PLAYER,
        name: 'Audio Player',
        json: {
            widget: 'audio-player',
            data: {
                label: 'Audio Player',
                autoplay: false,
                controls: true,
                loop: false,
                source: '',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_INPUT,
        image: BLOCK_BUTTON,
        name: 'Button',
        json: {
            widget: 'button',
            data: {
                style: {},
                label: 'Submit',
                loading: false,
                disabled: false,
                variant: 'contained',
                color: 'primary',
            },
            listeners: {
                onClick: [],
            },
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_INPUT,
        image: BLOCK_CHECKBOX,
        name: 'Checkbox',
        json: {
            widget: 'checkbox',
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
            slots: {} as BlockJSON['slots'],
        },
    },
    // {
    //     section: SECTION_INPUT,
    //     image: BLOCK_MODAL,
    //     name: 'Modal',
    //     json: {
    //         widget: 'modal',
    //         data: {
    //             style: {},
    //             open: true,
    //         },
    //         listeners: {
    //             onChange: [],
    //         },
    //         slots: {
    //             children: [],
    //         } as BlockJSON['slots'],
    //     },
    // },
    {
        section: SECTION_INPUT,
        image: BLOCK_INPUT,
        name: 'Input',
        json: {
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Example Input',
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
                content: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        image: BLOCK_AUDIO_INPUT,
        name: 'Audio Input',
        json: {
            widget: 'audio-input',
            data: {
                style: {
                    width: '50px',
                    height: '60px',
                },
                loading: false,
                disabled: false,
                variant: 'contained',
                color: 'primary',
                value: '',
                mode: 'transcribe',
            },
            listeners: {
                onClick: [],
            },
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_INPUT,
        image: BLOCK_SELECT,
        name: 'Select',
        json: {
            widget: 'select',
            data: {
                style: {
                    padding: '4px',
                },
                value: '',
                label: 'Example Select Input',
                hint: '',
                options: [],
                required: false,
                disabled: false,
                loading: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        image: BLOCK_FILE_UPLOAD,
        name: 'Upload',
        json: {
            widget: 'upload',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Example Input',
                hint: '',
                loading: false,
                disabled: false,
                required: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: [],
            },
        },
    },
    {
        section: SECTION_LAYOUT,
        image: BLOCK_CONTAINER,
        name: 'Container',
        json: {
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
            },
            listeners: {},
            slots: {
                children: [],
            },
        },
    },
    {
        section: SECTION_PROGRESS,
        image: BLOCK_PROGRESS_BAR,
        name: 'Progress',
        json: {
            widget: 'progress',
            data: {
                type: 'linear',
                value: 50,
                includeLabel: true,
                size: '300px',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        image: BLOCK_IFRAME,
        name: 'Iframe',
        json: {
            widget: 'iframe',
            data: {
                style: {},
                src: '',
                title: '',
                enableFrameInteractions: true,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        image: BLOCK_PDF_VIEWER,
        name: 'PDF Viewer',
        json: {
            widget: 'pdfViewer',
            data: {
                style: {
                    width: '100%',
                    height: '82%',
                    padding: '8px',
                },
                selectedPdf: null,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        image: BLOCK_IMAGE,
        name: 'Image',
        json: {
            widget: 'image',
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
                src: '',
                title: '',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_LOG,
        name: 'Logs',
        json: {
            widget: 'logs',
            data: {
                style: {},
                queryId: '',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_INPUT,
        image: BLOCK_TOGGLE_BUTTON,
        name: 'Toggle Button',
        json: {
            widget: 'toggle-button',
            data: {
                disabled: false,
                color: 'primary',
                size: 'small',
                options: [
                    {
                        display: 'on',
                        value: 'on',
                    },
                    {
                        display: 'off',
                        value: 'off',
                    },
                ],
                value: null,
                mandatory: true,
                multiple: false,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    // {
    //     section: SECTION_INPUT,
    //     image: BLOCK_TOGGLE_BUTTON,
    //     name: 'Stepper',
    //     json: {
    //         widget: 'stepper',
    //         data: {
    //             steps: [],
    //         },
    //         listeners: {},
    //         slots: {} as BlockJSON['slots'],
    //     },
    // },
    {
        section: SECTION_TEXT,
        image: BLOCK_LINK,
        name: 'Link',
        json: {
            widget: 'link',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                href: '',
                text: 'Insert text',
            },
            listeners: {},
            slots: {},
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_MARKDOWN,
        name: 'Markdown',
        json: {
            widget: 'markdown',
            data: {
                style: {
                    padding: '4px',
                },
                markdown: '**Hello world**',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        // image for html block from design team
        image: HTML_BLOCK,
        name: 'HTML',
        json: {
            widget: 'html',
            data: {
                style: {
                    padding: '4px',
                },
                // default html includes place-holder text and basic styling
                html: '<html>\r\n    <style>\r\n        html {\r\n            font-family: Roboto;\r\n            text-align: center;\r\n            overflow: hidden;\r\n        }\r\n    </style>\r\n    <body>\r\n        <h2>HTML Block</h2>\r\n    </body>\r\n</html>',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H1_STYLED,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: 'rgb(0,76,255)',
                    fontFamily: 'Times New Roman',
                },
                text: 'Hello world',
                variant: 'h1',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H1,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'h1',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H2,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'h2',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H3,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'h3',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H4,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'h4',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H5,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'h5',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_H6,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'h6',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_P,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
                variant: 'p',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        image: BLOCK_P_ITALICS,
        name: 'Text',
        json: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    fontStyle: 'italic',
                },
                text: 'Hello world',
                variant: 'p',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_COMPARE_LLMS,
        image: null,
        name: 'Compare LLMs',
        json: {
            widget: 'llmComparison',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '',
                variants: {},
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID,
        name: 'Mermaid',
        json: {
            widget: 'mermaid',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Query',
                variant: 'p',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
];
