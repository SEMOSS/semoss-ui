import { BlockJSON } from '@/stores';

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
import BLOCK_P_ITALICS from '@/assets/img/BLOCK_P_ITALICS.png';
import BLOCK_INPUT from '@/assets/img/BLOCK_INPUT.png';
import BLOCK_IMAGE from '@/assets/img/BLOCK_IMAGE.png';
import BLOCK_LINK from '@/assets/img/BLOCK_LINK.png';
import BLOCK_MARKDOWN from '@/assets/img/BLOCK_MARKDOWN.png';
import BLOCK_PROGRESS_BAR from '@/assets/img/BLOCK_PROGRESS_BAR.png';
import BLOCK_SELECT from '@/assets/img/BLOCK_SELECT.png';
import BLOCK_TOGGLE_BUTTON from '@/assets/img/BLOCK_TOGGLE_BUTTON.png';

export interface AddBlocksMenuItem {
    /** Section that the item belongs to */
    section: string;

    /** Name of the item to show in the tooltip */
    name: string;

    /** Image of the item */
    image: string;

    /** JSON of the block */
    json: BlockJSON;
}

/**
 * Show the default blocks menu
 */
export const DEFAULT_MENU: AddBlocksMenuItem[] = [
    {
        section: 'Input',
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
        section: 'Input',
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
    {
        section: 'Input',
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
        section: 'Input',
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
        section: 'Input',
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
        section: 'Layout',
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
        section: 'Element',
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
        section: 'Element',
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
        section: 'Progress',
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
    {
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
        section: 'Text',
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
];

/**
 * Show the visualizations in the menu
 */
export const VISUALIZATION_MENU: AddBlocksMenuItem[] = [
    {
        section: 'Bar Chart',
        name: 'Bar Chart',
        image: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'bar-chart',
                specJson: {
                    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
                    title: undefined,
                    width: 200,
                    height: 200,
                    padding: 5,
                    data: {
                        values: undefined,
                    },
                    mark: 'bar',
                    encoding: {
                        x: {
                            field: undefined,
                            title: undefined,
                            type: 'nominal',
                            axis: { labelAngle: 0 },
                        },
                        y: {
                            field: undefined,
                            title: undefined,
                            type: 'quantitative',
                        },
                    },
                },
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: 'Bar Chart',
        name: 'Grouped Bar Chart',
        image: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'grouped-bar-chart',
                specJson: {
                    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
                    title: undefined,
                    width: 200,
                    height: 200,
                    padding: 5,
                    data: {
                        values: undefined,
                    },
                    mark: 'bar',
                    encoding: {
                        x: {
                            field: undefined,
                            title: undefined,
                            type: 'nominal',
                            axis: { labelAngle: 0 },
                        },
                        y: {
                            field: undefined,
                            title: undefined,
                            type: 'quantitative',
                        },
                        xOffset: {
                            field: undefined,
                        },
                        color: {
                            field: undefined,
                        },
                    },
                },
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: 'Pie Chart',
        name: 'Pie Chart',
        image: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'pie-chart',
                specJson: {
                    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
                    title: undefined,
                    width: 200,
                    height: 200,
                    padding: 5,
                    data: {
                        values: undefined,
                    },
                    mark: 'arc',
                    encoding: {
                        theta: {
                            field: undefined,
                            type: 'quantitative',
                            stack: 'normalize',
                        },
                        color: {
                            field: undefined,
                            title: undefined,
                            type: 'nominal',
                        },
                    },
                },
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: 'General',
        name: 'Vega',
        image: '',
        json: {
            widget: 'vega',
            data: {
                specJson: undefined,
                variation: undefined,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
];
