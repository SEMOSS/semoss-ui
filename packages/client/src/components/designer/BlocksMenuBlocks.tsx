import { BlockJSON } from '@/stores';
import {
    Addchart,
    BarChart,
    BlurLinear,
    CheckBox,
    FileCopyOutlined,
    FormatListBulleted,
    FormatShapes,
    HighlightAlt,
    Insights,
    Link,
    PanoramaOutlined,
    PieChart,
    SmartButton,
    TextFields,
    Upload,
    ViewList,
    Widgets,
} from '@mui/icons-material';

export interface BlocksMenuItem {
    key: string;
    display: string;
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
        blockJson: {
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
        key: 'button',
        display: 'Button',
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
        blockJson: {
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
        key: 'grouped-bar-chart',
        display: 'Grouped Bar Chart',
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
        blockJson: {
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
        key: 'link',
        display: 'Link',
        blockJson: {
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
        key: 'markdown',
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
        blockJson: {
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
        key: 'progress',
        display: 'Progress',
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
        blockJson: {
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
        key: 'text',
        display: 'Text',
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

export const getIconForMenuItemByKey = (key: string) => {
    switch (key) {
        case 'bar-chart':
            return BarChart;
        case 'button':
        case 'toggle-button':
            return SmartButton;
        case 'checkbox':
            return CheckBox;
        case 'container':
            return HighlightAlt;
        case 'grouped-bar-chart':
            return Addchart;
        case 'image':
            return PanoramaOutlined;
        case 'input':
            return FormatShapes;
        case 'link':
            return Link;
        case 'markdown':
            return FormatListBulleted;
        case 'page':
            return FileCopyOutlined;
        case 'pie-chart':
            return PieChart;
        case 'progress':
            return BlurLinear;
        case 'query':
            return HighlightAlt;
        case 'select':
            return ViewList;
        case 'text':
            return TextFields;
        case 'upload':
            return Upload;
        case 'vega':
            return Insights;
        default:
            return Widgets;
    }
};
