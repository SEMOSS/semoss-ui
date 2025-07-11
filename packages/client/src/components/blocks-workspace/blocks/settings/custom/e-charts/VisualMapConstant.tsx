import BarChartIcon from '@mui/icons-material/BarChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import DashboardIcon from '@mui/icons-material/Dashboard';

import RadarIcon from '../../../../../../assets/block-settings/img/RadarIcon.svg';
import GridIcon from '../../../../../../assets/block-settings/img/GridIcon.svg';
import LineIcon from '../../../../../../assets/block-settings/img/LineIcon.svg';
import AreaIcon from '../../../../../../assets/block-settings/img/AreaIcon.svg';
import GaugeIcon from '../../../../../../assets/block-settings/img/GaugeIcon.svg';
import PivotIcon from '../../../../../../assets/block-settings/img/PivotIcon.svg';
import KPIIcon from '../../../../../../assets/block-settings/img/KPIIcon.svg';
import ChoroPlethIcon from '../../../../../../assets/block-settings/img/ChroplethIcon.svg';
import MapIcon from '../../../../../../assets/block-settings/img/MapIcon.svg';
import BulletIcon from '../../../../../../assets/block-settings/img/Bullet.svg';
import RadialIcon from '../../../../../../assets/block-settings/img/Radial.svg';
import SunburstIcon from '../../../../../../assets/block-settings/img/Sun Brust.svg';
import HalfDonutIcon from '../../../../../../assets/block-settings/img/Hald Dount.svg';
import PieIcon from '../../../../../../assets/block-settings/img/Pie.svg';
import PolarBarIcon from '../../../../../../assets/block-settings/img/Polar Bar.svg';
import StackIcon from '../../../../../../assets/block-settings/img/stacked-bar.svg';
import TreemapIcon from '../../../../../../assets/block-settings/img/Treemap.svg';
import BoxIcon from '../../../../../../assets/block-settings/img/Box.svg';
import ClusterIcon from '../../../../../../assets/block-settings/img/Cluster.svg';
import HeatMapIcon from '../../../../../../assets/block-settings/img/Heatmap.svg';
import PackIcon from '../../../../../../assets/block-settings/img/Pack.svg';
import ScatterIcon from '../../../../../../assets/block-settings/img/Scatter Plot.svg';
import ScatterPlotMatrixIcon from '../../../../../../assets/block-settings/img/ScatterPlot Matrix.svg';
import ScatterPlot3DIcon from '../../../../../../assets/block-settings/img/Scatter 3D.svg';
import SignalAxisClusterIcon from '../../../../../../assets/block-settings/img/Single Axis Cluster.svg';
import ButtonIcon from '../../../../../../assets/block-settings/img/Button.svg';
import FilterIcon from '../../../../../../assets/block-settings/img/filter.svg';
import UnFilterIcon from '../../../../../../assets/block-settings/img/filter-off.svg';
import CodeIcon from '../../../../../../assets/block-settings/img/HTML.svg';
import DendrogramIcon from '../../../../../../assets/block-settings/img/dendrogram.svg';
import GraphIcon from '../../../../../../assets/block-settings/img/Graph.svg';
import ParallelCoordinatorIcon from '../../../../../../assets/block-settings/img/Parallel Cordinate.svg';
import VivaGraphIcon from '../../../../../../assets/block-settings/img/Viva Graph.svg';
import FunnelIcon from '../../../../../../assets/block-settings/img/Funnel.svg';
import GanttIcon from '../../../../../../assets/block-settings/img/GanttIcon.svg';
import SankeyIcon from '../../../../../../assets/block-settings/img/Sankey.svg';

export const VisualMapConstant = {
    Comparison: [
        {
            icon: <BarChartIcon style={{ color: '#0471F0' }} />,
            name: 'bar',
            label: 'Bar Chart',
            title: 'echart-bar-graph',
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
        },
        {
            icon: <BubbleChartIcon style={{ color: '#0471F0' }} />,
            name: 'bubble',
            label: 'Bubble',
        },
        {
            icon: <img src={String(GridIcon)} alt="Grid Icon" />,
            name: 'grid',
            label: 'Grid',
        },
        {
            icon: <img src={String(RadarIcon)} alt="Radar Icon" />,
            name: 'radar',
            label: 'Radar',
        },
    ],
    Trends: [
        {
            icon: <img src={String(AreaIcon)} alt="Area Icon" />,
            name: 'area',
            label: 'Area',
        },
        {
            icon: <img src={String(LineIcon)} alt="Line Icon" />,
            name: 'line',
            label: 'Line',
            title: 'echart-line-graph',
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
        },
        {
            icon: <BarChartIcon style={{ color: '#0471F0' }} />,
            name: 'multiLine',
            label: 'Multi Line',
        },
    ],
    Metrics: [
        {
            icon: <img src={String(GaugeIcon)} alt="Gauge Icon" />,
            name: 'gauge',
            label: 'Gauge',
        },
        {
            icon: <img src={String(PivotIcon)} alt="Pivot Icon" />,
            name: 'pivotTable',
            label: 'Pivot Table',
        },
        {
            icon: <img src={String(KPIIcon)} alt="KPI Icon" />,
            name: 'kpi',
            label: 'KPI',
        },
    ],
    Map: [
        {
            icon: <img src={String(ChoroPlethIcon)} alt="Choropleth Icon" />,
            name: 'choropleth',
            label: 'Choropleth',
        },
        {
            icon: <img src={String(MapIcon)} alt="Map Icon" />,
            name: 'map',
            label: 'Map',
            title: 'echart-world-map-chart',
            option: {
                series: [
                    {
                        data: [],
                        name: '',
                        label: {
                            show: false,
                            rotate: 0,
                            name: '',
                            position: 'top',
                            fontFamily: 'sans-serif',
                            fontSize: 12,
                            color: '#000000',
                        },
                        symbolSize: 15,
                        symbol: 'circle',
                    },
                ],
                symbolSize: 15,
                tooltip: {
                    show: true,
                    trigger: 'item',
                    position: 'bottom',
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
                legend: {
                    show: true,
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
                title: {
                    text: 'Map Graph',
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
        },
    ],
    'Part To Whoel': [
        {
            icon: <img src={String(BulletIcon)} alt="Bullet Icon" />,
            name: 'bullet',
            label: 'Bullet',
        },
        {
            icon: <img src={String(HalfDonutIcon)} alt="Half Donut Icon" />,
            name: 'halfDonut',
            label: 'Half Donut',
        },
        {
            icon: <img src={String(PieIcon)} alt="Pie Icon" />,
            name: 'pie',
            label: 'Pie',
            title: 'echart-pie-chart',
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
        },
        {
            icon: <img src={String(PolarBarIcon)} alt="Polar Bar Icon" />,
            name: 'polarBar',
            label: 'PolarBar',
        },
        {
            icon: <img src={String(RadialIcon)} alt="Radial Icon" />,
            name: 'radial',
            label: 'Radial',
        },
        {
            icon: <img src={String(SunburstIcon)} alt="SunBurst Icon" />,
            name: 'sunburst',
            label: 'Sunburst',
        },
        {
            icon: <img src={String(StackIcon)} alt="Stack Icon" />,
            name: 'stack',
            label: 'Stack',
            title: 'echart-stack-chart',
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
        },
        {
            icon: <img src={String(TreemapIcon)} alt="TreeMap Icon" />,
            name: 'treemap',
            label: 'TreeMap',
        },
    ],
    Distribution: [
        {
            icon: <img src={String(BoxIcon)} alt="Box Icon" />,
            name: 'box',
            label: 'Box',
        },
        {
            icon: <img src={String(ClusterIcon)} alt="Cluster Icon" />,
            name: 'cluster',
            label: 'Cluster',
        },
        {
            icon: <img src={String(HeatMapIcon)} alt="HeatMap Icon" />,
            name: 'heatMap',
            label: 'Heat Map',
        },
        {
            icon: <img src={String(PackIcon)} alt="Pack Icon" />,
            name: 'pack',
            label: 'Pack',
        },
        {
            icon: <img src={String(ScatterIcon)} alt="Scatter Icon" />,
            name: 'scatter',
            label: 'Scatter',
            title: 'echart-scatter-plots',
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
        },
        {
            icon: (
                <img
                    src={String(ScatterPlotMatrixIcon)}
                    alt="ScatterPlotMatrix Icon"
                />
            ),
            name: 'scatterPlotMatrix',
            label: 'ScatterPlot Matrix',
        },
        {
            icon: (
                <img src={String(ScatterPlot3DIcon)} alt="ScatterPlot3D Icon" />
            ),
            name: 'scatterPlot3D',
            label: 'ScatterPlot 3D',
        },
        {
            icon: (
                <img
                    src={String(SignalAxisClusterIcon)}
                    alt="Signal Axis Cluster Icon"
                />
            ),
            name: 'signalAxisCluster',
            label: 'Signal Axis Cluster',
        },
    ],
    'Report Widgets': [
        {
            icon: <DashboardIcon style={{ color: '#808080' }} />,
            name: 'dashboard',
            label: 'Dashboard',
        },
        {
            icon: <img src={String(ButtonIcon)} alt="Button Icon" />,
            name: 'button',
            label: 'Button',
        },
        {
            icon: <img src={String(FilterIcon)} alt="Filter Icon" />,
            name: 'filter',
            label: 'Filter',
        },
        {
            icon: <img src={String(UnFilterIcon)} alt="UnFilter Icon" />,
            name: 'unFilter',
            label: 'Unfilter',
        },
        {
            icon: <img src={String(CodeIcon)} alt="HTML Icon" />,
            name: 'html',
            label: 'HTML',
        },
        {
            icon: <img src={String(CodeIcon)} alt="Iframe Icon" />,
            name: 'iFrame',
            label: 'Iframe',
        },
    ],
    Connections: [
        {
            icon: <img src={String(DendrogramIcon)} alt="Dendrogram Icon" />,
            name: 'dendrogram',
            label: 'Dendrogram',
            title: 'echart-dendrogram-chart',
            option: {
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove',
                },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: {
                            show: true,
                        },
                    },
                    brush: {
                        toolbox: ['rect', 'polygon'],
                    },
                },
                series: [
                    {
                        type: 'tree',
                        data: [
                            {
                                name: 'Root',
                                children: [
                                    {
                                        name: 'Child A',
                                        children: [
                                            { name: 'Leaf A1' },
                                            { name: 'Leaf A2' },
                                        ],
                                    },
                                    {
                                        name: 'Child B',
                                        children: [
                                            { name: 'Leaf B1' },
                                            { name: 'Leaf B2' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        top: '5%',
                        left: '10%',
                        bottom: '5%',
                        right: '10%',
                        symbolSize: 10,
                        label: {
                            position: 'left',
                            verticalAlign: 'middle',
                            align: 'right',
                            color: '#000000',
                            fontSize: '12',
                            show: true,
                            formatter: '{c}',
                        },
                        leaves: {
                            label: {
                                position: 'right',
                                verticalAlign: 'middle',
                                align: 'left',
                            },
                        },
                        expandAndCollapse: true,
                        animationDuration: 750,
                        animationDurationUpdate: 750,
                        initialTreeDepth: -1,
                    },
                ],
                ['_state']: {
                    dimensions: [],
                    facet: [],
                },
            },
            facet: {
                facetSelected: [],
                facetList: [],
            },
        },
        {
            icon: <img src={String(GraphIcon)} alt="Graph Icon" />,
            name: 'graph',
            label: 'Graph',
        },
        {
            icon: <img src={String(GraphIcon)} alt="GraphGL Icon" />,
            name: 'graphGl',
            label: 'GraphGL',
        },
        {
            icon: (
                <img
                    src={String(ParallelCoordinatorIcon)}
                    alt="Parallel Coordinates Icon"
                />
            ),
            name: 'parallelCoordinates',
            label: 'Parallel Coordinates',
        },
        {
            icon: <img src={String(VivaGraphIcon)} alt="VivaGraph Icon" />,
            name: 'vivaGraph',
            label: 'VivaGraph',
        },
    ],
    Pipeline: [
        {
            icon: <img src={String(FunnelIcon)} alt="Funnel Icon" />,
            name: 'funnel',
            label: 'Funnel',
        },
        {
            icon: <img src={String(GanttIcon)} alt="Gantt Icon" />,
            name: 'gantt',
            label: 'Gantt',
            title: 'echart-gantt-chart',
            option: {
                tooltip: {
                    show: true,
                },
                xAxis: {
                    type: 'time',
                    splitLine: {
                        show: false,
                    },
                },
                yAxis: {
                    type: 'category',
                    data: ['Task A', 'Task B', 'Task C'],
                },
                series: [
                    {
                        type: 'custom',

                        data: [
                            {
                                task: 'Task A',
                                start: '2024-02-01',
                                end: '2024-02-05',
                                resource: 'A',
                            },
                            {
                                task: 'Task B',
                                start: '2024-02-03',
                                end: '2024-02-08',
                                resource: 'B',
                            },
                            {
                                task: 'Task C',
                                start: '2024-02-06',
                                end: '2024-02-12',
                                resource: 'C',
                            },
                            {
                                task: 'Task D',
                                start: '2024-02-02',
                                end: '2024-02-11',
                                resource: 'B',
                            },
                            {
                                task: 'Task E',
                                start: '2024-02-03',
                                end: '2024-02-10',
                                resource: 'A',
                            },
                            {
                                task: 'Task F',
                                start: '2024-02-07',
                                end: '2024-02-11',
                                resource: 'C',
                            },
                        ],
                    },
                ],
                customSettings: {
                    columnDetails: {},
                },
            },
        },
        {
            icon: <img src={String(SankeyIcon)} alt="Sankey Icon" />,
            name: 'sankey',
            label: 'Sankey',
        },
    ],
};
