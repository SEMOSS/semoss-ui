import { BlockJSON } from '@semoss/renderer';
import { lightTheme } from '@semoss/ui';
import {
    CLASS_DIAGRAM,
    ENTITY_RELATIONSHIP_DIAGRAM,
    GANTT,
    SEQUENCE_DIAGRAM,
    STATE_DIAGRAM,
    USER_JOURNEY,
    PIE_CHART,
    QUADRANT_CHART,
    REQUIREMENT_DIAGRAM,
    GIT_DIAGRAM,
    C4_DIAGRAM,
    MINDMAP,
    TIMELINE,
    SANKEY,
    XY_Chart,
    BLOCK_DIAGRAM,
    GENERAL_MERMAID,
} from '@semoss/renderer';

import type { DesignerMenuItem } from './menu-types';
import * as BLOCK_IMAGES from '@/assets/blocks';

const SECTION_ELEMENT = 'Element';
const SECTION_INPUT = 'Input';
const SECTION_LAYOUT = 'Layout';
const SECTION_PROGRESS = 'Progress';
const SECTION_TEXT = 'Text';

const SECTION_CHARTS = 'Data Charts';
const SECTION_FLOWS = 'Mermaid Charts';
const SECTION_MISC = 'Miscellaneous';

export const SECTION_ORDER = [
    SECTION_LAYOUT,
    SECTION_TEXT,
    SECTION_INPUT,
    SECTION_PROGRESS,
    SECTION_ELEMENT,
    SECTION_MISC,
    SECTION_CHARTS,
    SECTION_FLOWS,
];

// TODO: Alphabetical order by name
export const DEFAULT_MENU: DesignerMenuItem[] = [
    {
        section: SECTION_LAYOUT,
        name: 'Accordion',
        activeImage: BLOCK_IMAGES['ACCORDION_ACTIVE'],
        hoverImage: BLOCK_IMAGES['ACCORDION_HOVER'],
        helperText: 'Click to expand and collapse sections for more details',
        json: {
            widget: 'accordion',
            data: {
                style: {},
            },
            listeners: {},
            slots: {
                header: [],
                content: [],
            },
        },
    },
    {
        section: SECTION_MISC,
        name: 'Theme Block',
        helperText: 'Determine the theme of your page with our Theme Block',
        activeImage: '',
        hoverImage: '',
        json: {
            widget: 'theme',
            data: {
                theme: lightTheme,
            },
            listeners: {},
            slots: {
                children: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: 'Audio Player',
        helperText: 'Play back audio responses or other files',
        activeImage: BLOCK_IMAGES['AUDIO_PLAYER_ACTIVE'],
        hoverImage: BLOCK_IMAGES['AUDIO_PLAYER_HOVER'],
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
        name: 'Button',
        helperText: 'Creates a click event',
        activeImage: BLOCK_IMAGES['BUTTON_ACTIVE'],
        hoverImage: BLOCK_IMAGES['BUTTON_HOVER'],
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
        name: 'Checkbox',
        helperText: 'Add a checkbox for user selection',
        activeImage: BLOCK_IMAGES['CHECKBOX_ACTIVE'],
        hoverImage: BLOCK_IMAGES['CHECKBOX_HOVER'],
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
        section: SECTION_INPUT,
        name: 'Radio',
        helperText: 'User select between multiple items',
        json: {
            widget: 'radio',
            data: {
                style: {
                    padding: '4px',
                },
                value: 'no_value',
                label: 'Radio Input',
                isGroup: false,
                options: [{ label: 'Default', value: 'no_value' }],
                size: 'medium',
                direction: 'column',
                color: 'primary',
                labelPlacement: 'end',
                required: false,
                disabled: false,
            },
            listeners: {
                onChange: [],
            },
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_LAYOUT,
        name: 'Modal',
        helperText: 'Overlay to show more info or action to user',
        json: {
            widget: 'modal',
            data: {
                style: {},
                title: 'Modal Title',
                open: false,
                fullWidth: true,
                maxWidth: 'sm',
                minWidth: 'sm',
                designMode: true,
            },
            listeners: {
                onSubmit: [],
            },
            slots: {
                content: [],
                footer: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: 'Input',
        helperText: 'Add an input box for typing text',
        activeImage: BLOCK_IMAGES['INPUT_ACTIVE'],
        hoverImage: BLOCK_IMAGES['INPUT_HOVER'],
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
        name: 'Audio Input',
        helperText: 'Input audio from the user',
        activeImage: BLOCK_IMAGES['AUDIO_INPUT_ACTIVE'],
        hoverImage: BLOCK_IMAGES['AUDIO_INPUT_HOVER'],
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
        name: 'Select',
        helperText: 'Choose an option from a dropdown list',
        activeImage: BLOCK_IMAGES['SELECT_ACTIVE'],
        hoverImage: BLOCK_IMAGES['SELECT_HOVER'],
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
        name: 'Upload',
        helperText: 'Upload files like documents or images',
        activeImage: BLOCK_IMAGES['UPLOAD_ACTIVE'],
        hoverImage: BLOCK_IMAGES['UPLOAD_HOVER'],
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
        name: 'Container',
        helperText: 'Create a layout element for custom design',
        activeImage: BLOCK_IMAGES['CONTAINER_ACTIVE'],
        hoverImage: BLOCK_IMAGES['CONTAINER_HOVER'],
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
        name: 'Progress',
        helperText: 'Display progress tracking or status',
        activeImage: BLOCK_IMAGES['PROGRESS_ACTIVE'],
        hoverImage: BLOCK_IMAGES['PROGRESS_HOVER'],
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
        name: 'Iframe',
        helperText: 'Embed a webpage using a source link',
        activeImage: BLOCK_IMAGES['IFRAME_ACTIVE'],
        hoverImage: BLOCK_IMAGES['IFRAME_HOVER'],
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
        name: 'PDF Viewer',
        helperText: 'Embed a PDF for viewing',
        activeImage: BLOCK_IMAGES['PDF_VIEWER_ACTIVE'],
        hoverImage: BLOCK_IMAGES['PDF_VIEWER_HOVER'],
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
        name: 'Image',
        helperText: 'Add an image to your layout',
        activeImage: BLOCK_IMAGES['IMAGE_ACTIVE'],
        hoverImage: BLOCK_IMAGES['IMAGE_HOVER'],
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
        name: 'Logs',
        helperText: 'Show logs from the notebook',
        activeImage: BLOCK_IMAGES['LOGS_ACTIVE'],
        hoverImage: BLOCK_IMAGES['LOGS_HOVER'],
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
        name: 'Toggle Button',
        helperText: 'Switch between multiple options',
        activeImage: BLOCK_IMAGES['TOGGLE_ACTIVE'],
        hoverImage: BLOCK_IMAGES['TOGGLE_HOVER'],
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
        section: SECTION_TEXT,
        name: 'Link',
        helperText: 'Access a webpage through a clickable URL',
        activeImage: BLOCK_IMAGES['LINK_ACTIVE'],
        hoverImage: BLOCK_IMAGES['LINK_HOVER'],
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
        name: 'Markdown',
        helperText: 'Show text in markdown format',
        activeImage: BLOCK_IMAGES['MARKDOWN_ACTIVE'],
        hoverImage: BLOCK_IMAGES['MARKDOWN_HOVER'],
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
        name: 'HTML',
        helperText: 'Write custom HTML manually or with AI assistance',
        activeImage: BLOCK_IMAGES['HTML_ACTIVE'],
        hoverImage: BLOCK_IMAGES['HTML_HOVER'],
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
        name: 'Text',
        helperText: 'Display Text in header 1',
        activeImage: BLOCK_IMAGES['H1_ACTIVE'],
        hoverImage: BLOCK_IMAGES['H1_HOVER'],
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
        name: 'Text',
        helperText: 'Display Text in header 2',
        activeImage: BLOCK_IMAGES['H2_ACTIVE'],
        hoverImage: BLOCK_IMAGES['H2_HOVER'],
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
        name: 'Text',
        helperText: 'Display Text in header 3',
        activeImage: BLOCK_IMAGES['H3_ACTIVE'],
        hoverImage: BLOCK_IMAGES['H3_HOVER'],
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
        name: 'Text',
        helperText: 'Display Text in header 4',
        activeImage: BLOCK_IMAGES['H4_ACTIVE'],
        hoverImage: BLOCK_IMAGES['H4_HOVER'],
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
        name: 'Text',
        helperText: 'Display Text in header 5',
        activeImage: BLOCK_IMAGES['H5_ACTIVE'],
        hoverImage: BLOCK_IMAGES['H5_HOVER'],
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
        name: 'Text',
        helperText: 'Display Text in header 6',
        activeImage: BLOCK_IMAGES['H6_ACTIVE'],
        hoverImage: BLOCK_IMAGES['H6_HOVER'],
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
        name: 'Text',
        helperText: 'Show text in a regular paragraph style',
        activeImage: BLOCK_IMAGES['PARAGRAPH_ACTIVE'],
        hoverImage: BLOCK_IMAGES['PARAGRAPH_HOVER'],
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
        section: SECTION_MISC,
        name: 'Compare LLMs',
        helperText: 'Compare large language models against the same context',
        activeImage: BLOCK_IMAGES['COMPARE_LLMS_ACTIVE'],
        hoverImage: BLOCK_IMAGES['COMPARE_LLMS_HOVER'],
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
        section: SECTION_CHARTS,
        name: 'Vega',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                specJson: '',
                variation: undefined,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Grid',
        helperText: '',
        json: {
            widget: 'grid',
            data: {
                frame: {
                    name: '',
                },
                columns: [],
                view: {
                    pagination: true,
                },
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Bar Chart',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'bar-chart',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Bar Chart',
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { a: 'A', b: 28 },
                                { a: 'B', b: 55 },
                                { a: 'C', b: 43 },
                                { a: 'D', b: 91 },
                                { a: 'E', b: 81 },
                                { a: 'F', b: 53 },
                                { a: 'G', b: 19 },
                                { a: 'H', b: 87 },
                                { a: 'I', b: 52 },
                            ],
                        },
                        mark: 'bar',
                        encoding: {
                            x: { field: 'a', type: 'ordinal' },
                            y: { field: 'b', type: 'quantitative' },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Grouped Bar Chart',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'grouped-bar-chart',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Grouped Bar Chart',
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { category: 'A', group: 'x', value: 0.1 },
                                { category: 'A', group: 'y', value: 0.6 },
                                { category: 'A', group: 'z', value: 0.9 },
                                { category: 'B', group: 'x', value: 0.7 },
                                { category: 'B', group: 'y', value: 0.2 },
                                { category: 'B', group: 'z', value: 1.1 },
                                { category: 'C', group: 'x', value: 0.6 },
                                { category: 'C', group: 'y', value: 0.1 },
                                { category: 'C', group: 'z', value: 0.2 },
                            ],
                        },
                        mark: 'bar',
                        encoding: {
                            x: { field: 'category' },
                            y: { field: 'value', type: 'quantitative' },
                            xOffset: { field: 'group' },
                            color: { field: 'group' },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Pie Chart',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'pie-chart',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Pie Chart',
                        width: 300,
                        height: 300,
                        description: 'A simple pie chart with embedded data.',
                        data: {
                            values: [
                                { category: 1, value: 4 },
                                { category: 2, value: 6 },
                                { category: 3, value: 10 },
                                { category: 4, value: 3 },
                                { category: 5, value: 7 },
                                { category: 6, value: 8 },
                            ],
                        },
                        mark: 'arc',
                        encoding: {
                            theta: { field: 'value', type: 'quantitative' },
                            color: { field: 'category', type: 'nominal' },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Radial Plot',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'radial-plot',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Radial Plot',
                        width: 300,
                        height: 300,
                        description:
                            'A simple radial chart with embedded data.',
                        data: {
                            values: [12, 23, 47, 6, 52, 19],
                        },
                        layer: [
                            {
                                mark: {
                                    type: 'arc',
                                    innerRadius: 20,
                                    stroke: '#fff',
                                },
                            },
                            {
                                mark: { type: 'text', radiusOffset: 10 },
                                encoding: {
                                    text: {
                                        field: 'data',
                                        type: 'quantitative',
                                    },
                                },
                            },
                        ],
                        encoding: {
                            theta: {
                                field: 'data',
                                type: 'quantitative',
                                stack: true,
                            },
                            radius: {
                                field: 'data',
                                scale: {
                                    type: 'sqrt',
                                    zero: true,
                                    rangeMin: 20,
                                },
                            },
                            color: {
                                field: 'data',
                                type: 'nominal',
                                legend: null,
                            },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Line Chart',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'line-chart',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Line Chart',
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { a: 'A', b: 28 },
                                { a: 'B', b: 55, predicted: false },
                                { a: 'D', b: 91, predicted: false },
                                { a: 'E', b: 81, predicted: false },
                                { a: 'E', b: 81, predicted: true },
                                { a: 'G', b: 19, predicted: true },
                                { a: 'H', b: 87, predicted: true },
                            ],
                        },
                        mark: 'line',
                        encoding: {
                            x: { field: 'a', type: 'ordinal' },
                            y: { field: 'b', type: 'quantitative' },
                            strokeDash: { field: 'predicted', type: 'nominal' },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Area Chart',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'area-chart',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Area Chart',
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { a: 'A', b: 28 },
                                { a: 'B', b: 55 },
                                { a: 'D', b: 91 },
                                { a: 'E', b: 81 },
                                { a: 'E', b: 81 },
                                { a: 'G', b: 19 },
                                { a: 'H', b: 87 },
                            ],
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
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Area Chart with Gradient',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'area-chart-with-gradient',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Area Chart with Gradient',
                        width: 300,
                        height: 300,
                        description: 'Simple area chart with gradient.',
                        data: {
                            values: [
                                { a: 'A', b: 28 },
                                { a: 'B', b: 55 },
                                { a: 'D', b: 91 },
                                { a: 'E', b: 81 },
                                { a: 'E', b: 81 },
                                { a: 'G', b: 19 },
                                { a: 'H', b: 87 },
                            ],
                        },
                        mark: {
                            type: 'area',
                            line: {
                                color: 'darkgreen',
                            },
                            color: {
                                x1: 1,
                                y1: 1,
                                x2: 1,
                                y2: 0,
                                gradient: 'linear',
                                stops: [
                                    {
                                        offset: 0,
                                        color: 'white',
                                    },
                                    {
                                        offset: 1,
                                        color: 'darkgreen',
                                    },
                                ],
                            },
                        },
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
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_CHARTS,
        name: 'Scatter Plot',
        helperText: '',
        json: {
            widget: 'vega',
            data: {
                variation: 'scatter-plot',
                specJson: JSON.stringify(
                    {
                        $schema:
                            'https://vega.github.io/schema/vega-lite/v5.json',
                        title: 'Scatter Plot',
                        width: 300,
                        height: 300,
                        description: 'A scatterplot.',
                        data: {
                            values: [
                                { a: 10, b: 28 },
                                { a: 20, b: 55 },
                                { a: 30, b: 91 },
                                { a: 40, b: 81 },
                                { a: 50, b: 81 },
                                { a: 60, b: 19 },
                                { a: 70, b: 87 },
                            ],
                        },
                        mark: 'point',
                        encoding: {
                            x: { field: 'a', type: 'quantitative' },
                            y: { field: 'b', type: 'quantitative' },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'General Mermaid',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: GENERAL_MERMAID,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Class Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: CLASS_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Sequence Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: SEQUENCE_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'State Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: STATE_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Entity Relationship Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: ENTITY_RELATIONSHIP_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'User Journey',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: USER_JOURNEY,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Gantt',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: GANTT,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Pie Chart',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: PIE_CHART,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Quadrant Chart',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: QUADRANT_CHART,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Requirement Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: REQUIREMENT_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Git Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: GIT_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: SECTION_FLOWS,
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: C4_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Mindmap',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: MINDMAP,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Timeline',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: TIMELINE,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Sankey',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: SANKEY,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'XY Chart',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: XY_Chart,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_FLOWS,
        name: 'Block Diagram',
        helperText: '',
        json: {
            widget: 'mermaid',
            data: {
                text: BLOCK_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
];
