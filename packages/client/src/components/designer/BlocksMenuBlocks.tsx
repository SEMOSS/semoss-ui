import { BlockJSON } from '@/stores';

export interface BlocksMenuItem {
    key: string;
    display: string;
    icon: string;
    blockJson: BlockJSON;
}

/**
 * Blocks that appear on the menu
 * Can be different implementations of the same block with different configs
 */
export const MenuBlocks: BlocksMenuItem[] = [
    {
        key: 'bar-chart',
        display: 'Bar Chart',
        icon: 'bar_chart',
        blockJson: {
            widget: 'vega',
            data: {
                variation: 'Bar Chart',
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
        key: 'button',
        display: 'Button',
        icon: 'smart_button',
        blockJson: {
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
        key: 'checkbox',
        display: 'Checkbox',
        icon: 'check_box',
        blockJson: {
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
        key: 'container',
        display: 'Container',
        icon: 'highlight_alt',
        blockJson: {
            widget: 'container',
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
                children: [],
            },
        },
    },
    {
        key: 'grouped-bar-chart',
        display: 'Grouped Bar Chart',
        icon: 'addchart',
        blockJson: {
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
        key: 'image',
        display: 'Image',
        icon: 'panorama_outlined',
        blockJson: {
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
        key: 'input',
        display: 'Input',
        icon: 'format_shapes',
        blockJson: {
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
        key: 'link',
        display: 'Link',
        icon: 'link',
        blockJson: {
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    width: '100%',
                    height: '100%',
                },
                src: '',
            },
            listeners: {},
            slots: {
                children: [],
            },
        },
    },
    {
        key: 'markdown',
        icon: 'format_list_bulleted',
        display: 'Markdown',
        blockJson: {
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
        key: 'page',
        display: 'Page',
        icon: 'file_copy_outlined',
        blockJson: {
            widget: 'page',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                    gap: '8px',
                    fontFamily: 'roboto',
                },
            },
            listeners: {},
            slots: {
                content: [],
            },
        },
    },
    {
        key: 'pie-chart',
        display: 'Pie Chart',
        icon: 'pie_chart',
        blockJson: {
            widget: 'vega',
            data: {
                variation: 'Pie Chart',
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
        key: 'progress',
        display: 'Progress',
        icon: 'blur_linear',
        blockJson: {
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
        key: 'query',
        display: 'Query',
        icon: 'highlight_alt',
        blockJson: {
            widget: 'query',
            data: {
                style: {},
                queryId: '',
                cellId: '',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        key: 'select',
        display: 'Select',
        icon: 'view_list',
        blockJson: {
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
        key: 'text',
        display: 'Text',
        icon: 'text_fields',
        blockJson: {
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Hello world',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        key: 'toggle-button',
        display: 'Toggle Button',
        icon: 'smart_button',
        blockJson: {
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
        key: 'upload',
        display: 'Upload',
        icon: 'upload',
        blockJson: {
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
        key: 'vega',
        display: 'Vega',
        icon: 'insights',
        blockJson: {
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
