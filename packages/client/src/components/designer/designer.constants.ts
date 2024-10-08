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
import BLOCK_MERMAID from '@/assets/img/BLOCK_MERMAID.png';
import BLOCK_MERMAID_CLASS_DIAGRAM from '@/assets/img/BLOCK_MERMAID_CLASS_DIAGRAM.png';
import BLOCK_MERMAID_C4_DIAGRAM from '@/assets/img/BLOCK_MERMAID_C4_DIAGRAM.png';
import BLOCK_MERMAID_RELATIONSHIP_ENTITY from '@/assets/img/BLOCK_MERMAID_RELATIONSHIP_ENTITY.png';
import BLOCK_MERMAID_PIECHART from '@/assets/img/BLOCK_MERMAID_PIECHART.png';
import BLOCK_MERMAID_DIAGRAM from '@/assets/img/BLOCK_MERMAID_DIAGRAM.png';
import BLOCK_MERMAID_GANTT from '@/assets/img/BLOCK_MERMAID_GANTT.png';
import BLOCK_MERMAID_REQUIREMENT_DIAGRAM from '@/assets/img/BLOCK_MERMAID_REQUIREMENT_DIAGRAM.png';
import BLOCK_MERMAID_GIT_DIAGRAM from '@/assets/img/BLOCK_MERMAID_GIT_DIAGRAM.png';
import BLOCK_MERMAID_SANKEY from '@/assets/img/BLOCK_MERMAID_SANKEY.png';
import BLOCK_MERMAID_QUADRANT_CHART from '@/assets/img/BLOCK_MERMAID_QUADRANT_CHART.png';
import BLOCK_MERMAID_MINDMAP from '@/assets/img/BLOCK_MERMAID_MINDMAP.png';
import BLOCK_MERMAID_STATE_DIAGRAM from '@/assets/img/BLOCK_MERMAID_STATE_DIAGRAM.png';
import BLOCK_MERMAID_SEQUENCE_DIAGRAM from '@/assets/img/BLOCK_MERMAID_SEQUENCE_DIAGRAM.png';
import BLOCK_MERMAID_JOURNEY from '@/assets/img/BLOCK_MERMAID_JOURNEY.png';
import BLOCK_MERMAID_TIMELINE from '@/assets/img/BLOCK_MERMAID_TIMELINE.png';
import BLOCK_MERMAID_XY_CHART from '@/assets/img/BLOCK_MERMAID_XY_CHART.png';
import BLOCK_MODAL from '@/assets/img/BLOCK_MODAL.png';
import BLOCK_LOG from '@/assets/img/LOG.png';
import BLOCK_P_ITALICS from '@/assets/img/BLOCK_P_ITALICS.png';
import BLOCK_INPUT from '@/assets/img/BLOCK_INPUT.png';
import BLOCK_IFRAME from '@/assets/img/BLOCK_IFRAME.png';
import BLOCK_IMAGE from '@/assets/img/BLOCK_IMAGE.png';
import BLOCK_AUDIO from '@/assets/img/BLOCK_AUDIO.png';
import BLOCK_LINK from '@/assets/img/BLOCK_LINK.png';
import BLOCK_MARKDOWN from '@/assets/img/BLOCK_MARKDOWN.png';
import HTML_BLOCK from '@/assets/img/HTML_BLOCK_SM.png';
import BLOCK_PROGRESS_BAR from '@/assets/img/BLOCK_PROGRESS_BAR.png';
import BLOCK_SELECT from '@/assets/img/BLOCK_SELECT.png';
import BLOCK_TOGGLE_BUTTON from '@/assets/img/BLOCK_TOGGLE_BUTTON.png';
import BAR_CHART from '@/assets/img/BAR_CHART.png';
import GROUP_BAR_CHART from '@/assets/img/GROUP_BAR_CHART.png';
import GENERAL_CHART from '@/assets/img/GENERAL_CHART.png';
import LINE_CHART from '@/assets/img/LINE_CHART.png';
import AREA_CHART from '@/assets/img/AREA_CHART.png';
import SCATTER_PLOT from '@/assets/img/SCATTER_PLOT.png';
import PIE_CHART_IMAGE from '@/assets/img/PIE_CHART.png';
import RADIAL_CHART from '@/assets/img/RADIAL_CHART.png';
import GRADIENT_CHART from '@/assets/img/GRADIENT_CHART.png';
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
} from '../block-defaults/mermaid-block/diagrams.constants';

const SECTION_ELEMENT = 'Element';
const SECTION_INPUT = 'Input';
const SECTION_LAYOUT = 'Layout';
const SECTION_PROGRESS = 'Progress';
const SECTION_TEXT = 'Text';
const SECTION_COMPARE_LLMS = 'Compare LLMs';
const SECTION_MERMAID = 'Mermaid';
const SECTION_AREA_CHART = 'Area Chart';
const SECTION_BAR_CHART = 'Bar Chart';
const SECTION_GENERAL_VISUALIZATION = 'General';
const SECTION_LINE_CHART = 'Line Chart';
const SECTION_PIE_CHART = 'Pie Chart';
const SECTION_SCATTER_PLOTS = 'Scatter Plot';

export interface AddBlocksMenuItem {
    /** Section that the item belongs to */
    section:
        | 'Element'
        | 'Query'
        | 'Input'
        | 'Layout'
        | 'Progress'
        | 'Text'
        | 'Compare LLMs'
        | 'Mermaid'
        | 'Area Chart'
        | 'Bar Chart'
        | 'General'
        | 'Line Chart'
        | 'Pie Chart'
        | 'Scatter Plot';

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
        section: SECTION_ELEMENT,
        image: BLOCK_AUDIO,
        name: 'Audio',
        json: {
            widget: 'audio',
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

/**
 * Show the visualizations in the menu
 */
export const VISUALIZATION_MENU: AddBlocksMenuItem[] = [
    {
        section: SECTION_BAR_CHART,
        name: 'Bar Chart',
        image: BAR_CHART,
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
        section: SECTION_BAR_CHART,
        name: 'Grouped Bar Chart',
        image: GROUP_BAR_CHART,
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
        section: SECTION_PIE_CHART,
        name: 'Pie Chart',
        image: PIE_CHART_IMAGE,
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
        section: SECTION_PIE_CHART,
        name: 'Radial Plot',
        image: RADIAL_CHART,
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
        section: SECTION_GENERAL_VISUALIZATION,
        name: 'Vega',
        image: GENERAL_CHART,
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
        section: SECTION_LINE_CHART,
        name: 'Line Chart',
        image: LINE_CHART,
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
        section: SECTION_AREA_CHART,
        name: 'Area Chart',
        image: AREA_CHART,
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
        section: SECTION_AREA_CHART,
        name: 'Area Chart with Gradient',
        image: GRADIENT_CHART,
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
        section: SECTION_SCATTER_PLOTS,
        name: 'Scatter Plot',
        image: SCATTER_PLOT,
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID,
        name: 'General Mermaid',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_CLASS_DIAGRAM,
        name: 'Class Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_SEQUENCE_DIAGRAM,
        name: 'Sequence Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_STATE_DIAGRAM,
        name: 'State Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_RELATIONSHIP_ENTITY,
        name: 'Entity Relationship Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_JOURNEY,
        name: 'User Journey',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_GANTT,
        name: 'Gantt',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_PIECHART,
        name: 'Pie Chart',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_QUADRANT_CHART,
        name: 'Quadrant Chart',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_REQUIREMENT_DIAGRAM,
        name: 'Requirement Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_GIT_DIAGRAM,
        name: 'Git Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_C4_DIAGRAM,
        name: 'C4 Diagram',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_MINDMAP,
        name: 'Mindmap',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_TIMELINE,
        name: 'Timeline',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_SANKEY,
        name: 'Sankey',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_XY_CHART,
        name: 'XY Chart',
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
        section: SECTION_MERMAID,
        image: BLOCK_MERMAID_DIAGRAM,
        name: 'Block Diagram',
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

export const getImageForWidget = (widget) => {
    const combinedMenu = [...DEFAULT_MENU, ...VISUALIZATION_MENU];

    // Find the menu item that matches the widget id
    const menuItem = combinedMenu.find((item) => item.json.widget === widget);

    // Return the image if the menu item is found, undefined otherwise
    return menuItem ? menuItem.image : undefined;
};
