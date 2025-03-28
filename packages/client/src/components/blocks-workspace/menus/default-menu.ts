import { BlockJSON } from '@semoss/renderer';
import { lightTheme } from '@semoss/ui';

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

// Development Environment Blocks
const DEV_BLOCKS = [];

if (process.env.NODE_ENV === 'development') {
    DEV_BLOCKS.push({
        section: SECTION_CHARTS,
        name: 'Pie Chart',
        helperText: 'Show proportions of a whole',
        activeImage: BLOCK_IMAGES['PIE_CHART_ACTIVE'],
        hoverImage: BLOCK_IMAGES['PIE_CHART_HOVER'],
        json: {
            widget: 'e-chart',
            data: {
                variation: 'echart-pie-chart',
                frame: {
                    name: '',
                },
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '450px',
                    height: '350px',
                },
                option: {
                    dataset: {
                        source: [
                            { name: 'a', value: 85 },
                            { name: 'b', value: 79 },
                        ],
                    },
                    // color: ['#40A0FF','#9A74B6','#FBB83A','#F18630','#51ACA8','#187687','#CD5498','#364A90'],
                    color: [
                        '#ff6f61',
                        '#6b5b95',
                        '#88b04b',
                        '#f7cac9',
                        '#92a8d1',
                        '#034f84',
                        '#f7786b',
                        '#deeaee',
                    ],
                    title: {
                        text: '',
                        left: 'center',
                        show: true,
                        textStyle: {
                            fontSize: 18,
                            color: '#ff6f61',
                            fontWeight: 'normal',
                        },
                    },
                    tooltip: {
                        trigger: 'item',
                        show: false,
                    },
                    legend: {
                        show: false,
                        orient: 'vertical',
                        left: 'left',
                        top: 'top',
                        textStyle: {
                            fontSize: 10,
                            color: '#000000',
                        },
                    },
                    series: [
                        {
                            name: 'Access From',
                            type: 'pie',
                            radius: '50%',
                            label: {
                                show: true,
                                position: 'outside',
                                fontSize: 10,
                                color: '#000000',
                                backgroundColor: '',
                                rotate: 0,
                            },
                            labelLine: {
                                length: 30,
                            },
                            data: [
                                { value: 1048, name: 'Search Engine' },
                                { value: 735, name: 'Direct' },
                                { value: 580, name: 'Email' },
                                { value: 484, name: 'Union Ads' },
                                { value: 300, name: 'Video Ads' },
                            ],
                            emphasis: {
                                itemStyle: {
                                    shadowBlur: 10,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0.5, 0, 0, 0.5)',
                                },
                            },
                        },
                    ],
                    reset: {
                        radius: '50%',
                        title: {
                            text: '',
                            left: 'center',
                            show: true,
                            textStyle: {
                                fontSize: 18,
                                color: '#ff6f61',
                                fontWeight: 'normal',
                                fontFamily: '',
                            },
                        },
                        label: {
                            show: true,
                            position: 'outside',
                            fontSize: 10,
                            color: '#000000',
                            backgroundColor: '',
                            rotate: 0,
                            fontFamily: '',
                        },
                        labelLine: {
                            length: 30,
                        },
                    },
                },

                specJson: JSON.stringify(
                    {
                        $schema: '',
                        title: 'E Pie Chart',
                        width: 300,
                        height: 200,
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
                        mark: 'pie',
                        encoding: {
                            x: { field: 'a', type: 'ordinal' },
                            y: { field: 'b', type: 'quantitative' },
                        },
                    },
                    null,
                    2,
                ),
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    });
    DEV_BLOCKS.push({
        section: SECTION_CHARTS,
        name: 'Bar Chart',
        helperText:
            'Compare cumulative totals and individual segments across categories',
        activeImage: BLOCK_IMAGES['BAR_CHART_ACTIVE'],
        hoverImage: BLOCK_IMAGES['BAR_CHART_HOVER'],
        json: {
            widget: 'e-chart',
            data: {
                variation: 'echart-bar-graph',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '450px',
                    height: '350px',
                },
                frame: {
                    name: '',
                },
                option: {
                    xAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    },
                    yAxis: {
                        type: 'value',
                    },
                    color: [
                        '#5470c6',
                        '#91cc75',
                        '#fac858',
                        '#ee6666',
                        '#73c0de',
                        '#3ba272',
                        '#fc8452',
                        '#9a60b4',
                        '#ea7ccc',
                    ],
                    series: [
                        {
                            name: 'Category',
                            data: [
                                {
                                    value: 120,
                                },
                                200,
                                150,
                                80,
                                70,
                                110,
                                130,
                            ],
                            type: 'bar',
                            labelLine: {
                                show: true,
                            },
                            label: {
                                color: '#000000',
                            },
                            itemStyle: {
                                color: '#5470c6',
                            },
                        },
                    ],
                    tooltip: {
                        show: true,
                        trigger: 'axis',
                    },
                    dataZoom: [
                        {
                            show: true,
                            start: 0,
                            end: 100,
                            yAxisIndex: 0,
                        },
                    ],
                    brush: {
                        toolbox: ['rect', 'polygon'],
                    },
                    toolbox: {
                        show: true,
                        feature: {
                            dataZoom: {
                                show: true,
                            },
                        },
                    },
                    title: {
                        text: 'Bar Graph',
                        show: true,
                        left: 'left',
                        textStyle: {
                            color: '#000000',
                            fontWeight: 'bold',
                            fontFamily: 'Arial Narrow',
                            fontSize: 12,
                        },
                    },
                },
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    });
    DEV_BLOCKS.push({
        section: SECTION_CHARTS,
        name: 'Scatter Plot',
        helperText: 'Show relationships between two variables',
        activeImage: BLOCK_IMAGES['SCATTER_PLOT_ACTIVE'],
        hoverImage: BLOCK_IMAGES['SCATTER_PLOT_HOVER'],
        json: {
            widget: 'e-chart',
            data: {
                variation: 'echart-scatter-plots',
                style: {
                    height: 500,
                    width: 400,
                },
                option: {
                    title: {
                        text: '',
                        left: 'center',
                        top: 'top',
                    },
                    tooltip: {
                        show: true,
                        trigger: 'item',
                        position: 'bottom',
                    },
                    xAxis: {
                        name: '',
                        pixelName: '',
                        nameLocation: 'middle',
                        show: true,
                        type: 'value',
                        axisLine: {
                            show: true,
                        },
                        axisTick: {
                            show: true,
                            alignWithLabel: true,
                        },
                        nameTextStyle: {
                            fontSize: 12,
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,
                            fontSize: 11,
                            color: '#000000',
                        },
                    },
                    yAxis: {
                        name: '',
                        pixelName: '',
                        type: 'value',
                        show: true,
                        axisLine: {
                            show: true,
                        },
                        axisTick: {
                            show: true,
                            alignWithLabel: true,
                        },
                        nameTextStyle: {
                            fontSize: 12,
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,
                            fontSize: 12,
                            color: '#000000',
                        },
                    },
                    series: [
                        {
                            data: [],
                            label: {
                                show: true,
                                rotate: 0,
                                name: '',
                                position: 'top',
                                fontFamily: 'sans-serif',
                                fontSize: 12,
                                color: '#000000',
                            },
                            symbolSize: 15,
                            symbol: 'circle',
                            type: 'scatter',
                        },
                    ],
                    color: [
                        '#5470c6',
                        '#91cc75',
                        '#fac858',
                        '#ee6666',
                        '#73c0de',
                        '#3ba272',
                        '#fc8452',
                        '#9a60b4',
                        '#ea7ccc',
                    ],
                    toolbox: {
                        feature: {
                            brush: {
                                type: ['rect'],
                            },
                        },
                    },
                    brush: {
                        // Brush configuration
                        brushType: 'rect', // You can also use 'polygon', 'lineX', or 'lineY'
                        throttleType: 'debounce', // Throttle brush events
                        throttleDelay: 300, // Delay for throttle (in ms)
                        inBrush: {
                            color: 'rgba(255, 0, 0, 0.3)', // Highlight color for the brushed region
                        },
                        outBrush: {
                            color: 'rgba(0, 0, 0, 0.1)', // Color for points outside the brushed region
                        },
                    },
                    reset: {
                        axis: {
                            xaxis: {
                                show: true,
                                axisLine: {
                                    show: true,
                                },
                                axisTick: {
                                    show: true,
                                    alignWithLabel: true,
                                },
                                nameTextStyle: {
                                    fontSize: 12,
                                },
                                axisLabel: {
                                    show: true,
                                    rotate: 0,
                                    fontSize: 11,
                                    color: '#000000',
                                },
                            },
                            yaxis: {
                                show: true,
                                axisLine: {
                                    show: true,
                                },
                                axisTick: {
                                    show: true,
                                    alignWithLabel: true,
                                },
                                nameTextStyle: {
                                    fontSize: 12,
                                },
                                axisLabel: {
                                    show: true,
                                    rotate: 0,
                                    fontSize: 12,
                                    color: '#000000',
                                },
                            },
                        },
                        label: {
                            show: true,
                            rotate: 0,
                            name: '',
                            position: 'top',
                            fontFamily: 'sans-serif',
                            fontSize: 12,
                            color: '#000000',
                        },
                    },
                },
                frame: {
                    name: '',
                },
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    });
    DEV_BLOCKS.push({
        section: SECTION_CHARTS,
        name: 'Line Chart',
        helperText: 'Show relationships between two variables',
        activeImage: BLOCK_IMAGES['LINE_CHART_ACTIVE'],
        hoverImage: BLOCK_IMAGES['LINE_CHART_HOVER'],
        json: {
            widget: 'e-chart',
            data: {
                variation: 'echart-line-graph',
                style: {
                    height: 500,
                    width: 400,
                },
                option: {
                    title: {
                        text: 'ECharts Line Chart',
                        left: 'center',
                        top: 20,
                        textStyle: {
                            fontSize: 18,
                            fontWeight: 'normal',
                            color: '#000000',
                        },
                    },
                    tooltip: {
                        trigger: 'axis',
                        show: true,
                    },
                    legend: {
                        show: true,
                    },
                    xAxis: {
                        type: 'category',
                        name: 'a',
                        nameLocation: 'middle',
                        nameGap: 30,
                        axisTick: {
                            show: true,
                        },
                        axisLabel: {
                            rotate: 0,
                        },
                        nameTextStyle: {
                            fontSize: 10,
                        },
                        data: ['A', 'B', 'C', 'D', 'E'],
                        show: true,
                    },
                    axisTick: {
                        show: true,
                    },
                    yAxis: {
                        type: 'value',
                        name: 'b',
                        nameLocation: 'middle',
                        nameGap: 40,
                        axisLabel: {
                            rotate: 0,
                        },
                        axisLine: {
                            show: true,
                        },
                        axisTick: {
                            show: true,
                        },
                        legend: {
                            show: true,
                        },
                        tooltip: {
                            show: true,
                        },
                        nameTextStyle: {
                            fontSize: 10,
                        },
                        show: true,
                    },
                    color: [
                        '#ff6f61',
                        '#6b5b95',
                        '#88b04b',
                        '#f7cac9',
                        '#92a8d1',
                        '#034f84',
                        '#f7786b',
                        '#deeaee',
                    ],
                    series: [
                        {
                            name: 'a',
                            type: 'line',
                            data: [28, 30, 22, 35, 30],
                            lineStyle: {
                                type: 'solid',
                                width: 1,
                            },
                            label: {
                                show: true,
                                position: 'top',
                                rotate: 0,
                                fontSize: 12,
                                color: '#000000',
                            },
                        },
                    ],
                    reset: {
                        title: {
                            text: '',
                            left: 'center',
                            show: true,
                            textStyle: {
                                fontSize: 18,
                                color: '#ff6f61',
                                fontWeight: 'normal',
                                fontFamily: '',
                            },
                        },
                        xAxis: {
                            name: '',
                            updatedName: null,
                            axisTick: true,
                            axisLabelFont: 10,
                        },
                        yAxis: {
                            name: '',
                            updatedName: null,
                            axisTick: true,
                            axisLabelFont: 10,
                        },
                        label: {
                            show: true,
                            position: 'top',
                            fontSize: 10,
                            color: '#000000',
                            backgroundColor: '',
                            rotate: 0,
                            fontFamily: '',
                        },
                    },
                    toolbox: {
                        feature: {
                            brush: {
                                type: [
                                    'rect',
                                    'polygon',
                                    'lineX',
                                    'lineY',
                                    'clear',
                                ],
                                brushType: 'rect',
                                xAxisIndex: 'all',
                                yAxisIndex: 'all',
                                brushMode: 'single',
                                brushLink: 'all',
                            },
                        },
                    },
                    brush: {
                        // Brush configuration
                        brushType: 'rect', // You can also use 'polygon', 'lineX', or 'lineY'
                        throttleType: 'debounce', // Throttle brush events
                        throttleDelay: 300, // Delay for throttle (in ms)
                        inBrush: {
                            color: 'rgba(255, 0, 0, 0.3)', // Highlight color for the brushed region
                        },
                        outBrush: {
                            color: 'rgba(0, 0, 0, 0.1)', // Color for points outside the brushed region
                        },
                        xAxisIndex: 'all', // Apply brush on x-axis
                        brushMode: 'single',
                        brushLink: 'all',
                    },
                },
                frame: {
                    name: '',
                },
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    });
    DEV_BLOCKS.push({
        section: SECTION_CHARTS,
        name: 'Bar Chart - Stacked',
        helperText:
            'Compare cumulative totals and individual segments across categories',
        activeImage: BLOCK_IMAGES['STACK_CHART_ACTIVE'],
        hoverImage: BLOCK_IMAGES['STACK_CHART_HOVER'],
        json: {
            widget: 'e-chart',
            data: {
                variation: 'echart-stack-chart',
                style: {
                    height: 500,
                    width: 400,
                },
                option: {
                    title: {
                        text: '',
                        left: 'center',
                        top: 'top',
                    },
                    tooltip: {
                        show: false,
                        trigger: 'axis',
                        position: 'bottom',
                        axisPointer: {
                            type: 'line',
                        },
                    },
                    xAxis: {
                        name: '',
                        pixelName: '',
                        flipAxisName: '',
                        axisName: '',
                        nameLocation: 'middle',
                        show: true,
                        data: [],
                        type: 'category',
                        axisLine: {
                            show: true,
                        },
                        axisTick: {
                            show: true,
                            alignWithLabel: true,
                        },
                        nameTextStyle: {
                            fontSize: 12,
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,
                            fontSize: 11,
                            color: '#000000',
                        },
                        nameGap: 25,
                    },
                    yAxis: {
                        name: '',
                        pixelName: '',
                        axisName: '',
                        flipAxisName: '',
                        type: 'value',
                        data: [],
                        show: true,
                        axisLine: {
                            show: true,
                        },
                        axisTick: {
                            show: true,
                            alignWithLabel: true,
                        },
                        nameTextStyle: {
                            fontSize: 12,
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,
                            fontSize: 12,
                            color: '#000000',
                        },
                        axisPointer: {
                            show: false,
                        },
                        splitLine: {
                            show: true,
                        },
                    },
                    legend: {
                        show: false,
                        data: [],
                        selectedMode: 'multiple',
                        orient: 'horizontal',
                        bottom: 'bottom',
                        textStyle: {
                            fontSize: 10,
                        },
                        type: 'scroll',
                        pageButtonItemGap: 5,
                        pageTextSize: {
                            color: '#000000',
                            fontSize: 10,
                        },
                        left: 'center',
                        top: 'bottom',
                        itemWidth: 15,
                        itemHeight: 10,
                    },
                    series: [],
                    label: {
                        show: true,
                        rotate: 0,
                        name: '',
                        position: 'top',
                        fontFamily: 'sans-serif',
                        fontSize: 12,
                        color: '#000000',
                    },
                    barWidth: 10,
                    flipAxis: false,
                    color: [
                        '#5470c6',
                        '#91cc75',
                        '#fac858',
                        '#ee6666',
                        '#73c0de',
                        '#3ba272',
                        '#fc8452',
                        '#9a60b4',
                        '#ea7ccc',
                    ],
                    toolbox: {
                        feature: {
                            brush: {
                                type: ['rect', 'clear'],
                            },
                        },
                    },
                    brush: {
                        // Brush configuration
                        brushType: 'rect', // You can also use 'polygon', 'lineX', or 'lineY'
                        throttleType: 'debounce', // Throttle brush events
                        xAxisIndex: '0', // Apply brushing to all x-axis
                        throttleDelay: 300, // Delay for throttle (in ms)
                        brushMode: 'single',
                        inBrush: {
                            color: 'rgba(255, 0, 0, 0.3)', // Highlight color for the brushed region
                        },
                        outBrush: {
                            color: 'rgba(0, 0, 0, 0.1)', // Color for points outside the brushed region
                        },
                    },
                    reset: {
                        axis: {
                            xaxis: {
                                show: true,
                                axisLine: {
                                    show: true,
                                },
                                axisTick: {
                                    show: true,
                                    alignWithLabel: true,
                                },
                                nameTextStyle: {
                                    fontSize: 12,
                                },
                                axisLabel: {
                                    show: true,
                                    rotate: 0,
                                    fontSize: 11,
                                    color: '#000000',
                                },
                            },
                            yaxis: {
                                show: true,
                                axisLine: {
                                    show: true,
                                },
                                axisTick: {
                                    show: true,
                                    alignWithLabel: true,
                                },
                                nameTextStyle: {
                                    fontSize: 12,
                                },
                                axisLabel: {
                                    show: true,
                                    rotate: 0,
                                    fontSize: 12,
                                    color: '#000000',
                                },
                            },
                        },
                        label: {
                            show: true,
                            rotate: 0,
                            name: '',
                            position: 'top',
                            fontFamily: 'sans-serif',
                            fontSize: 12,
                            color: '#000000',
                        },
                        barWidth: 10,
                    },
                },
                frame: {
                    name: '',
                },
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    });
}

// TODO: Alphabetical order by name
export const DEFAULT_MENU: DesignerMenuItem[] = [
    // -------------------------------------------------------------
    // BLOCKS START
    // ----------------------------------------------------------
    ...DEV_BLOCKS,
    {
        section: SECTION_LAYOUT,
        name: 'Accordion',
        activeImage: BLOCK_IMAGES['ACCORDION_ACTIVE'],
        hoverImage: BLOCK_IMAGES['ACCORDION_HOVER'],
        helperText: 'Click to expand and collapse sections for more details',
        json: {
            widget: 'accordion',
            data: {
                style: {
                    padding: '20px',
                },
                triggerBgColor: '',
                contentBgColor: '',
                showExpandIcon: false,
                show: 'true',
                // -------------------------------------------
                // TODO:
                // John B:
                // We may need to track styles differently.
                // Can handle this in a migration function
                // accordionStyles:
                // accordionHeaderStyles:
                // accordionContentStyles:
                // -------------------------------------------
            },
            listeners: {},
            slots: {
                header: [],
                content: [],
            },
        },
    },

    {
        section: SECTION_LAYOUT,
        name: 'Popover',
        activeImage: BLOCK_IMAGES['POPOVER_ACTIVE'],
        hoverImage: BLOCK_IMAGES['POPOVER_HOVER'],
        helperText: 'Click or Hover to show the popover',
        json: {
            widget: 'popover',
            data: {
                style: {},
                open: false,
                designMode: true,
                openTrigger: 'click',
                contentBgColor: '',
            },
            listeners: {
                onClick: [],
            },
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
        activeImage: BLOCK_IMAGES['THEME_ACTIVE'],
        hoverImage: BLOCK_IMAGES['THEME_HOVER'],
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: 'Divider',
        helperText: 'Separate content with a horizontal line',
        activeImage: BLOCK_IMAGES['DIVIDER_ACTIVE'],
        hoverImage: BLOCK_IMAGES['DIVIDER_HOVER'],
        json: {
            widget: 'divider',
            data: {
                style: {
                    padding: '0px',
                    width: '100%',
                },
                variant: 'fullWidth',
                orientation: 'horizontal',
                textAlign: 'center',
                flexItem: false,
                light: false,
                text: '',
                showText: false,
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: 'Ratings ',
        helperText: 'Rate on a scale',
        json: {
            widget: 'ratings',
            data: {
                style: {},
                size: 'small',
                type: 'star',
                value: 2,
                max: 5,
            },
            listeners: {
                onChange: [],
            },
            slots: {
                children: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: 'Switch',
        helperText: 'Toggle between two states',
        json: {
            widget: 'switch',
            data: {
                style: {
                    width: 'fit-content',
                    padding: '4px',
                },
                label: 'Toggle Switch',
                value: false,
                disabled: false,
                color: 'primary',
                size: 'medium',
                helperText: '',
                required: false,
                labelPlacement: 'end',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_INPUT,
        name: 'Time Picker',
        helperText: 'Select a time from a time picker',
        json: {
            widget: 'timepicker',
            data: {
                style: {
                    width: '25%',
                    padding: '4px',
                },
                label: 'Select Time',
                value: '',
                variant: 'picker',
                ampm: true,
                format: 'hh:mm a',
                disabled: false,
                required: false,
                fullWidth: false,
                placeholder: '',
                clearable: true,
                size: 'small',
                views: ['hours', 'minutes'],
            },
            listeners: {
                onChange: [],
            },
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
                show: true,
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
                show: 'true',
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
        activeImage: BLOCK_IMAGES['RADIO_BUTTON_ACTIVE'],
        hoverImage: BLOCK_IMAGES['RADIO_BUTTON_HOVER'],
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
                show: 'true',
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
        activeImage: BLOCK_IMAGES['MODAL_ACTIVE'],
        hoverImage: BLOCK_IMAGES['MODAL_HOVER'],
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_ELEMENT,
        name: 'Icon',
        helperText: 'Add an icon to your layout',
        activeImage: BLOCK_IMAGES['ICON_ACTIVE'],
        hoverImage: BLOCK_IMAGES['ICON_HOVER'],
        json: {
            widget: 'icon',
            data: {
                style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '50px',
                    height: '50px',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                    show: 'true',
                },
                src: '',
                title: '',
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        name: 'Text (h1)',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        name: 'Text (h2)',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        name: 'Text (h3)',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        name: 'Text (h4)',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        name: 'Text (h5)',
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
                show: 'true',
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_TEXT,
        name: 'Text (h6)',
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
                show: 'true',
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
                show: 'true',
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
    // -------------------------------------------------------------
    // BLOCK END
    // ----------------------------------------------------------
    // -------------------------------------------------------------
    // CHART START
    // ----------------------------------------------------------
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
        name: 'Data Grid',
        helperText: 'Organize and display data in a tabular format',
        activeImage: BLOCK_IMAGES['DATA_GRID_ACTIVE'],
        hoverImage: BLOCK_IMAGES['DATA_GRID_HOVER'],
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
        name: 'Grouped Bar Chart',
        helperText:
            'Compare individual values across multiple categories side by side',
        activeImage: BLOCK_IMAGES['BAR_CHART_GROUPED_ACTIVE'],
        hoverImage: BLOCK_IMAGES['BAR_CHART_GROUPED_HOVER'],
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
        name: 'Radial Plot',
        helperText: 'Compare multiple variables relative to a central point',
        activeImage: BLOCK_IMAGES['RADIAL_PLOT_ACTIVE'],
        hoverImage: BLOCK_IMAGES['RADIAL_PLOT_HOVER'],
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
        name: 'Area Chart',
        helperText: 'Show trends over time with cumulative data',
        activeImage: BLOCK_IMAGES['AREA_CHART_ACTIVE'],
        hoverImage: BLOCK_IMAGES['AREA_CHART_HOVER'],
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
        activeImage: BLOCK_IMAGES['AREA_CHART_GRADIENT_ACTIVE'],
        hoverImage: BLOCK_IMAGES['AREA_CHART_GRADIENT_HOVER'],
        helperText:
            'Show trends over time with cumulative data in a different style',
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
    // {
    //     section: SECTION_CHARTS,
    //     name: 'Scatter Plot',
    //     helperText: 'Show relationships between two variables',
    //     activeImage: BLOCK_IMAGES['SCATTER_PLOT_ACTIVE'],
    //     hoverImage: BLOCK_IMAGES['SCATTER_PLOT_HOVER'],
    //     json: {
    //         widget: 'vega',
    //         data: {
    //             variation: 'scatter-plot',
    //             specJson: JSON.stringify(
    //                 {
    //                     $schema:
    //                         'https://vega.github.io/schema/vega-lite/v5.json',
    //                     title: 'Scatter Plot',
    //                     width: 300,
    //                     height: 300,
    //                     description: 'A scatterplot.',
    //                     data: {
    //                         values: [
    //                             { a: 10, b: 28 },
    //                             { a: 20, b: 55 },
    //                             { a: 30, b: 91 },
    //                             { a: 40, b: 81 },
    //                             { a: 50, b: 81 },
    //                             { a: 60, b: 19 },
    //                             { a: 70, b: 87 },
    //                         ],
    //                     },
    //                     mark: 'point',
    //                     encoding: {
    //                         x: { field: 'a', type: 'quantitative' },
    //                         y: { field: 'b', type: 'quantitative' },
    //                     },
    //                 },
    //                 null,
    //                 2,
    //             ),
    //         },
    //         listeners: {},
    //         slots: {} as BlockJSON['slots'],
    //     },
    // },
    // {
    //     section: SECTION_CHARTS,
    //     name: 'Bar Chart',
    //     helperText:
    //         'Compare cumulative totals and individual segments across categories',
    //     activeImage: BLOCK_IMAGES['BAR_CHART_ACTIVE'],
    //     hoverImage: BLOCK_IMAGES['BAR_CHART_HOVER'],
    //     json: {
    //         widget: 'vega',
    //         data: {
    //             variation: 'bar-chart',
    //             specJson: JSON.stringify(
    //                 {
    //                     $schema:
    //                         'https://vega.github.io/schema/vega-lite/v5.json',
    //                     title: 'Bar Chart',
    //                     width: 300,
    //                     height: 300,
    //                     data: {
    //                         values: [
    //                             { a: 'A', b: 28 },
    //                             { a: 'B', b: 55 },
    //                             { a: 'C', b: 43 },
    //                             { a: 'D', b: 91 },
    //                             { a: 'E', b: 81 },
    //                             { a: 'F', b: 53 },
    //                             { a: 'G', b: 19 },
    //                             { a: 'H', b: 87 },
    //                             { a: 'I', b: 52 },
    //                         ],
    //                     },
    //                     mark: 'bar',
    //                     encoding: {
    //                         x: { field: 'a', type: 'ordinal' },
    //                         y: { field: 'b', type: 'quantitative' },
    //                     },
    //                 },
    //                 null,
    //                 2,
    //             ),
    //         },
    //         listeners: {},
    //         slots: {} as BlockJSON['slots'],
    //     },
    // },
    // {
    //     section: SECTION_CHARTS,
    //     name: 'Pie Chart',
    //     helperText: 'Show proportions of a whole',
    //     activeImage: BLOCK_IMAGES['PIE_CHART_ACTIVE'],
    //     hoverImage: BLOCK_IMAGES['PIE_CHART_HOVER'],
    //     json: {
    //         widget: 'vega',
    //         data: {
    //             variation: 'pie-chart',
    //             specJson: JSON.stringify(
    //                 {
    //                     $schema:
    //                         'https://vega.github.io/schema/vega-lite/v5.json',
    //                     title: 'Pie Chart',
    //                     width: 300,
    //                     height: 300,
    //                     description: 'A simple pie chart with embedded data.',
    //                     data: {
    //                         values: [
    //                             { category: 1, value: 4 },
    //                             { category: 2, value: 6 },
    //                             { category: 3, value: 10 },
    //                             { category: 4, value: 3 },
    //                             { category: 5, value: 7 },
    //                             { category: 6, value: 8 },
    //                         ],
    //                     },
    //                     mark: 'arc',
    //                     encoding: {
    //                         theta: { field: 'value', type: 'quantitative' },
    //                         color: { field: 'category', type: 'nominal' },
    //                     },
    //                 },
    //                 null,
    //                 2,
    //             ),
    //         },
    //         listeners: {},
    //         slots: {} as BlockJSON['slots'],
    //     },
    // },
    // -------------------------------------------------------------
    // CHARTS END
    // ----------------------------------------------------------
    // -------------------------------------------------------------
    // MERMAID START
    // ----------------------------------------------------------
    {
        section: SECTION_FLOWS,
        name: 'General Mermaid',
        activeImage: BLOCK_IMAGES['MERMAIDJS_ACTIVE'],
        hoverImage: BLOCK_IMAGES['MERMAIDJS_HOVER'],
        helperText: 'Customize and display MermaidJS diagrams',
        json: {
            widget: 'mermaid',
            data: {
                text: `graph TD;
                        A-->B;
                        A-->C;
                        B-->D;
                        C-->D;
                    `,
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
                text: `---
title: Alien example
---
classDiagram
    note "From Duck till Zebra"
    Animal <|-- Duck
    note for Duck "can fly\ncan swim\ncan dive\ncan help in debugging"
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
`,
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
                text: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hi Bob
    Bob->>Alice: Hi Alice
`,
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
                text: `---
title: Simple sample
---
stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]

`,
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
                text: `---
title: Order example
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
`,
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
                text: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me

`,
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
                text: `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task          :a1, 2014-01-01, 30d
        Another task    :after a1, 20d
    section Another
        Task in Another :2014-01-12, 12d
        another task    :24d
`,
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
                text: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
`,
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
                text: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]

`,
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
                text: `requirementDiagram

requirement test_req {
id: 1
text: the test text.
risk: high
verifymethod: test
}

element test_entity {
type: simulation
}

test_entity - satisfies -> test_req

`,
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
                text: `---
title: Example Git diagram
---
gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit
   commit
`,
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
                text: `C4Context
  title System Context diagram for Internet Banking System
  Enterprise_Boundary(b0, "BankBoundary0") {
    Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
    Person(customerB, "Banking Customer B")
    Person_Ext(customerC, "Banking Customer C", "desc")

    Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

    System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

    Enterprise_Boundary(b1, "BankBoundary") {

        SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

        System_Boundary(b2, "BankBoundary2") {
          System(SystemA, "Banking System A")
          System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")
        }

        System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
        SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

        Boundary(b3, "BankBoundary3", "boundary") {
          SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")
          SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
        }
    }
}

      BiRel(customerA, SystemAA, "Uses")
      BiRel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")

      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
      UpdateRelStyle(SystemAA, SystemE, $textColor="blue", $lineColor="blue", $offsetY="-10")
      UpdateRelStyle(SystemAA, SystemC, $textColor="blue", $lineColor="blue", $offsetY="-40", $offsetX="-50")
      UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")

      UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")



`,
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
                text: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
`,
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
                text: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : Youtube
    2006 : Twitter
`,
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
                text: `---
config:
  sankey:
    showValues: false
---
sankey-beta

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,Ngas,40.719
Gas reserves,Ngas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
Ngas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
`,
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
                text: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
`,
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
                text: `block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
`,
            },
            listeners: {},
            slots: {} as BlockJSON['slots'],
        },
    },
    {
        section: SECTION_LAYOUT,
        name: 'Sidebar-Menu',
        activeImage: BLOCK_IMAGES['SIDEBAR_MENU_ACTIVE'],
        hoverImage: BLOCK_IMAGES['SIDEBAR_MENU_HOVER'],
        helperText:
            'Use the sidebar to navigate between the tools and components',
        json: {
            widget: 'sidebar',
            data: {
                style: {
                    width: '240px',
                    height: '100%',
                },
                open: false,
                anchor: 'left',
                designMode: true,
            },
            listeners: {},
            slots: {
                content: [],
            },
        },
    },
    {
        section: SECTION_INPUT,
        name: 'Slider',
        helperText: 'Allows user to select a value from a specified range',
        activeImage: BLOCK_IMAGES['SLIDER_ACTIVE'],
        hoverImage: BLOCK_IMAGES['SLIDER_HOVER'],
        json: {
            widget: 'slider',
            data: {
                type: 'continuous',
                style: {
                    color: 'primary',
                },
                marks: [],
                steps: 1,
                value: 0,
                min: 0,
                max: 100,
                size: '300px',
            },
            listeners: {
                onChange: [],
            },
            slots: {} as BlockJSON['slots'],
        },
    },
];
