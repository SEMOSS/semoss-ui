('use strict');

/**
 * @name app.config
 * @desc app configuration
 * @returns {void}
 */
angular
    .module('app.constants', [])
    .constant(
        'ENDPOINT',
        (function () {
            var mod = '',
                protocol = '',
                host = '',
                port = '',
                url = '',
                path = '',
                pathSplit = [],
                returnObj;

            mod = 'Monolith_Dev';
            protocol = window.location.protocol;
            host = window.location.hostname;
            port = window.location.port;
            pathSplit = window.location.pathname.split('/SemossWeb');

            if (pathSplit.length > 1 && pathSplit[0]) {
                path = pathSplit[0];
            }

            url =
                protocol +
                '//' +
                host +
                (port ? ':' + port : '') +
                (path ? path : '') +
                '/' +
                mod;

            returnObj = {
                MODULE: mod,
                PROTOCOL: protocol,
                HOST: host,
                PORT: port,
                URL: url,
            };

            // bootstrap(returnObj);

            return returnObj;
        })()
    )
    .constant('DEBUG', true)
    .constant('PLAYGROUND', false)
    .constant('RIBBON_MESSAGE', '')
    // .constant('RIBBON_MESSAGE', 'Please do not upload sensitive data.')
    .constant('LINKS', {
        MHS_EXECUTIVE_DASHBOARD: {
            display: 'Executive Dashboard',
            url: 'https://otm.insights.health.mil/OTMExecutiveView',
        },
        MHS_FORMS: {
            display: 'MHS SEMOSS Forms',
            url: 'https://otm.insights.health.mil/Surveys/MHS/app/#/login',
        },
    })
    .constant('HIDDEN_WIDGETS', [])
    .constant('WIDGETS_HIDDEN_FOR_NON_ADMIN', [])
    .constant('PLAYGROUND_WIDGETS', [
        'comment-mode',
        'google-sentiment',
        'google-latlong',
        'google-entity',
        'twitter-search',
        'tableau-connect',
        'database-profile',
        'database-query-translator',
        'save',
        'terminal',
        'grid-delta',
    ])
    .constant('WELCOME', true)
    .constant('OPTIONAL_COOKIES', true)
    .constant('LEGACY_GOOGLE_ANALYTICS', false)
    .constant('GOOGLE_ANALYTICS_TAG', 'UA-52251505-1')
    .constant('VISIBLE_ALERTS', ['error', 'primary', 'success', 'warn'])
    .constant('VIZ_COLORS', {
        // Main Theme Palette
        COLOR_SEMOSS: [
            '#40A0FF',
            '#9A74B6',
            '#FBB83A',
            '#F18630',
            '#51ACA8',
            '#187637',
            '#CD5498',
            '#364A90',
        ],

        // Pre Configured Color Palettes
        COLOR_ONE: [
            '#4E79A7',
            '#F28E2B',
            '#E15759',
            '#76B7B2',
            '#59A14E',
            '#EDC949',
            '#B07AA1',
            '#FF9DA7',
            '#9C755F',
            '#BAB0AC',
        ],
        COLOR_TWO: [
            '#CC00CC',
            '#002060',
            '#154890',
            '#660066',
            '#6699FF',
            '#B2CDF4',
            '#EB99FF',
            '#B2B2B2',
            '#808080',
            '#4D4D4D',
        ],
        COLOR_THREE: [
            '#B2CDF4',
            '#002060',
            '#808080',
            '#51692D',
            '#154890',
            '#6699FF',
            '#7CA244',
            '#637F6E',
            '#B3CF8B',
            '#ABBDB2',
        ],
        COLOR_FOUR: [
            '#184D68',
            '#7CA343',
            '#F9651B',
            '#0B264D',
            '#FB9C6C',
            '#B04700',
            '#2E95C8',
            '#4D6529',
            '#88C5E4',
            '#B3CF8B',
        ],
        COLOR_FIVE: [
            '#551813',
            '#D13D31',
            '#DEDBA7',
            '#84251E',
            '#615E25',
            '#E38881',
            '#72B095',
            '#A7A23F',
            '#49836A',
            '#144C48',
        ],
        COLOR_SIX: [
            '#FFCCCC',
            '#99CCFF',
            '#0099CC',
            '#FF7C80',
            '#405422',
            '#5F7D33',
            '#184D68',
            '#7030A0',
            '#99CC00',
            '#D792F2',
        ],
        COLOR_SEVEN: [
            '#48BFA8',
            '#E0BF39',
            '#E67E22',
            '#4FA4DE',
            '#52CF87',
            '#BA2828',
            '#bdc3c7',
            '#9b59b6',
            '#34495e',
            '#F28E8E',
        ],
        COLOR_EIGHT: [
            '#F1433F',
            '#660066',
            '#F7E967',
            '#B3CF8B',
            '#EB99FF',
            '#4D6529',
            '#B3110D',
            '#0066CC',
            '#A49508',
            '#6699FF',
        ],
        COLOR_NINE: [
            '#86BC25',
            '#000000',
            '#97999B',
            '#F0EDED',
            '#C4D600',
            '#046A38',
            '#75787B',
            '#D0D0CE',
            '#BBBCBC',
            '#2C5234',
        ],
        COLOR_TEN: [
            '#3B4D69',
            '#590D10',
            '#781216',
            '#6C82A7',
            '#BFC6D4',
            '#DCDCDC',
            '#808080',
        ],
        COLOR_ELEVEN: ['#009A44', '#86BC25', '#00A3E0', '#012169', '#0097A9'],
        COLOR_TWELVE: [
            '#053460',
            '#f6b40d',
            '#df6767',
            '#a5a5a5',
            '#0861b4',
            '#031e37',
            '#d6d6d6',
            '#ffd983',
            '#054580',
            '#ececec',
        ],
        // New Palettes
        COLOR_THIRTEEN: [
            '#40A0FF',
            '#B000FB',
            '#FF1678',
            '#1010CA',
            '#035F03',
            '#9F1853',
            '#CDA323',
            '#58B8B8',
        ],
        COLOR_FOURTEEN: [
            '#40A0FF',
            '#6929C4',
            '#005D5D',
            '#9F1853',
            '#FA4D56',
            '#570408',
            '#009D9A',
            '#B07C0C',
        ],
        COLOR_FIFTEEN: [
            '#40A0FF',
            '#79BDFF',
            '#8E8E8E',
            '#51ACA8',
            '#B2DF8A',
            '#FDBF6F',
            '#FF7F00',
            '#A7141F',
        ],

        // single color shows whenever only one color is shown (ex: one line / one bar)
        // viz's that use the single color: c3barchart.js and c3linechart.js
        COLOR_SINGLE_SEMOSS: ['#40A0FF'],
        COLOR_SINGLE_BLUE: ['#40A0FF'],
        COLOR_SINGLE_RED: ['#C62828'],
        COLOR_SINGLE_GREEN: ['#2E7D32'],

        // heatmap colors
        // heatmap does some weird things with colors so we'll kept the color structure from the original heatmap
        COLOR_HEATMAP_DEFAULT: [
            '#fbf2d2',
            '#fee7a0',
            '#ffc665',
            '#fea743',
            '#fd8c3c',
            '#fb4b29',
            '#ea241e',
            '#d60b20',
            '#b10026',
            '#620023',
        ],
        COLOR_HEATMAP_RED: [
            '#fbf2d2',
            '#fdedb5',
            '#fee7a0',
            '#ffda84',
            '#ffc665',
            '#feb44e',
            '#fea743',
            '#fd9b3f',
            '#fd8c3c',
            '#fd7735',
            '#fd602f',
            '#fb4b29',
            '#f43723',
            '#ea241e',
            '#e0161c',
            '#d60b20',
            '#c80324',
            '#b10026',
            '#870025',
            '#620023',
        ],
        COLOR_HEATMAP_BLUE: [
            '#f4f9fe',
            '#eaf2fb',
            '#deebf7',
            '#d8e6f5',
            '#d1e2f2',
            '#c1d8ed',
            '#a1c9e5',
            '#7cb7db',
            '#63aad4',
            '#54a0ce',
            '#4997c9',
            '#3d8dc4',
            '#3182be',
            '#2676b8',
            '#1b6bb1',
            '#1260aa',
            '#0a56a1',
            '#084a93',
            '#083e82',
            '#083370',
        ],
        COLOR_HEATMAP_GREEN: [
            '#f5fbf3',
            '#eef9eb',
            '#e5f5e0',
            '#dcf1d6',
            '#d0edca',
            '#c4e8bd',
            '#b7e3b0',
            '#a9dda3',
            '#9cd796',
            '#8fd28b',
            '#7fca7e',
            '#69bd6f',
            '#4ba85d',
            '#2e934c',
            '#19843e',
            '#0c7b36',
            '#03722f',
            '#006628',
            '#005622',
            '#00481c',
        ],
        COLOR_HEATMAP_TRAFFIC: [
            '#ae0e06',
            '#ae0e06',
            '#ae0e06',
            '#e92e10',
            '#e92e10',
            '#fb741e',
            '#fb741e',
            '#fdc63f',
            '#fdc63f',
            '#ffff57',
            '#ffff57',
            '#ffff57',
            '#5cba24',
            '#5cba24',
            '#1e8b1f',
            '#1e8b1f',
            '#1e8b1f',
            '#1e8b1f',
            '#1e8b1f',
            '#005715',
            '#005715',
            '#005715',
        ],
    })
    // Add new visualizations to visualization section at bottom of this arrayok
    .constant('WIDGETS', [])
    .constant('SHARED_TOOLS', {
        // NEW THEME TOOLS
        grid: {
            color: '',
            width: '',
        },
        axis: {
            borderColor: '',
            borderWidth: '',
            label: {
                fontColor: '',
                fontFamily: '',
                fontSize: '',
                fontWeight: '',
            },
            name: {
                fontColor: '',
                fontFamily: '',
                fontSize: '',
                fontWeight: '',
            },
        },
        valueLabel: {
            fontColor: '',
            fontColorAlt: '',
            fontFamily: '',
            fontSize: '',
            fontWeight: '',
        },
        legend: {
            fontColor: '',
            fontFamily: '',
            fontSize: '',
            fontWeight: '',
        },
        tooltip: {
            backgroundColor: '',
            borderStyle: '',
            borderColor: '',
            fontFamily: '',
            fontColor: '',
            fontSize: '',
        },
        dataZoom: {},
        kpi: {
            value: {
                fontColor: '',
                fontFamily: '',
                fontSize: '',
                fontWeight: '',
            },
            label: {
                fontColor: '',
                fontFamily: '',
                fontSize: '',
                fontWeight: '',
            },
        },
        treemap: {
            heading: {
                backgroundColor: '',
                fontColor: '',
                fontFamily: '',
                fontSize: '',
                fontWeight: '',
            },
            breadcrumb: {
                backgroundColor: '',
                fontColor: '',
                fontFamily: '',
                fontSize: '',
                fontWeight: '',
                borderWidth: '',
                borderStyle: '',
                borderColor: '',
            },
        },
        boxwhisker: {
            borderWidth: '',
            borderStyle: '',
            borderColor: '',
        },
        graph: {
            lineWidth: '',
            lineStyle: '',
            lineColor: '',
        },
        dendrogram: {
            lineWidth: '',
            lineColor: '',
        },
        // END OF THEME TOOLS
        chartTitle: {
            text: '',
            fontSize: '',
            fontWeight: '',
            fontColor: '',
            fontFamily: '',
            enterCustomFont: '',
            align: '',
        },
        // coloring
        axisPointer: 'shadow',
        color: '',
        colorName: '',
        buckets: 10,
        heatBuckets: 5, // TODO
        // TODO MAKE IT BASED ON THE DATA AND GENERIC
        // axis
        editXAxis: false,
        editYAxis: false,
        formatDataValues: false,
        minMax: false,
        heatRange: false,
        rotateAxis: false,
        xReversed: false,
        yReversed: false,
        lineGuide: true, // TODO
        lineStyle: {
            type: 'solid',
            width: 3,
        },
        lineStyleArea: {
            type: 'dotted',
            width: 3,
        },
        editGrid: {
            x: false,
            y: true,
            xScatter: true,
            yWaterfall: false,
        },
        animation: {
            chooseType: 'No Animation',
            animationSpeed: 1,
            animationDuration: 500,
        },
        curveType: 'Smooth',
        customizeBarLabel: {
            position: 'top',
            rotate: 0,
            align: 'center',
            fontFamily: 'sans-serif',
            fontSize: 12,
            fontWeight: 'normal',
        },
        customizeLabel: false,
        customizeGraphLabel: {},
        customTooltip: {
            show: false,
            html: '',
            asset: {},
            // GetAsset(filePath=["test2"], space=["f3f5bf5f-6a62-4682-9d51-6f10dfdb265b"]);
            // 'asset': {
            //     'space': 'f3f5bf5f-6a62-4682-9d51-6f10dfdb265b',
            //     'path': 'test2'
            // },
            // 'html': '<div>{{tooltip.Genre}}</div> <iframe style="resize:both" height="200px" width="400px" src="https://localhost/SemossWeb/dev/#!/insight?engine=f3f5bf5f-6a62-4682-9d51-6f10dfdb265b&id=0dc094d1-8f50-4bca-99be-56b1f8acc5d2"></iframe>'// '<iframe resize="both" src="https://localhost/SemossWeb/dev/#!/insight?engine=f3f5bf5f-6a62-4682-9d51-6f10dfdb265b&id=0dc094d1-8f50-4bca-99be-56b1f8acc5d2"></iframe>'
        },
        animationPie: 'None',
        regressionLine: 'None',
        barImage: false,
        changeSymbol: {
            chooseType: 'Circle',
            symbolURL: '',
            symbolSize: 12,
        },
        customizeSymbol: {
            rules: [],
        },
        targetDate: false,
        targetDateRange: false,
        markArea: false,
        markLine: false,
        highlight: {},
        label: {},
        changeSymbolDendrogram: {
            chooseType: 'Empty Circle',
            symbolURL: '',
            symbolSize: 12,
        },
        customizePieLabel: {
            position: 'Outside',
            dimension: ['Name'],
            fontSize: 15,
            dynamicView: 'No',
        },
        pieRadius: {
            innerRadius: 0,
            outerRadius: 70,
        },
        customizeFunnelLabel: {
            showLabel: 'On Hover',
            position: 'Inside',
            dimension: 'Name',
            fontSize: 15,
        },
        customizeSunburstLabel: {
            orientation: 'radial',
            fontSize: 12,
        },
        heatmapColor: [
            '#4575b4',
            '#74add1',
            '#abd9e9',
            '#e0f3f8',
            '#ffffbf',
            '#EECF96',
            '#DD9080',
            '#CE6661',
            '#C0444E',
        ],
        gaugeColor: ['#4575b4', '#74add1', '#CE6661', '#C0444E'],
        waterfallColor: ['#76B7B2', '#E15759'],
        fiscalAxis: {
            enabled: 'No',
            startMonth: 'January',
            axisColor: '#40A0FF',
        },
        editBarWidth: {
            defaultWidth: 'Yes',
            barWidth: 'null',
        },
        facetHeaders: {
            titleFontSize: 18,
            titleName: false,
            headerFontSize: 14,
            commonAxis: true,
            customLayout: false,
            numberColumns: 2,
            unitType: 'px',
            grid: {
                width: 200,
                height: 200,
            },
            spacing: {
                x: 60,
                y: 60,
            },
        },
        flipOrder: false,
        fitToView: false,
        widthFitToScreen: false,
        heightFitToScreen: false,
        clickToCollapse: true,
        changeAlignment: 'center',
        choroplethMapType: 'states',
        clusterExists: false,
        showAdjacent: false,
        groupBy: {},
        nodeRepulsion: {
            edgeLength: 100,
            gravity: 0.25,
            repulsion: 60,
        },
        showDirection: false,
        showHeat: false,
        showDate: true,
        showQuadrants: false,
        ganttGroupView: false,
        timeSeries: false,
        toggleExtremes: false,
        toggleAverage: false,
        toggleArea: false,
        collapseAll: false,
        toggleAxisPointer: true,
        toggleLegend: false,
        showTooltips: true,
        toggleShadow: false,
        toggleShape: true,
        toggleDonut: false,
        toggleLayout: false,
        toggleRadial: false,
        toggleLock: true,
        toggleAxisLabels: false,
        toggleXLabel: true,
        toggleZ: true,
        togglePolarZoom: 'No Zoom',
        toggleZoomXEnabled: null,
        toggleZoomX: false,
        toggleZoomY: false,
        saveDataZoom: {
            startX: 0,
            endX: 0,
            startY: 0,
            endY: 0,
        },
        toggleYAxis: true,
        dataZoomXstart: false,
        dataZoomXend: false,
        dataZoomYstart: false,
        dataZoomYend: false,
        toggleTrendline: 'No Trendline',
        thresholds: 'none', // TODO
        heatmapLegend: 'continuous',
        mapColorTheme: 'Light 1',
        rose: 'Default',
        colorLine: true, // TODO
        colorChart: true, // TODO
        thesholdLegend: true, // TODO
        xAxisThreshold: false, // TODO
        xMin: 'none', // TODO
        xMax: 'none', // TODO
        yMin: 'none', // TODO
        yMax: 'none', // TODO
        axisType: false,
        axisLabels: {},
        normalizeAxis: false,
        axisFit: true,
        watermark: '',
        // Kept track of in data service, but this is used to display arrows on column headers in jvGrid
        sortField: 'none', // TODO this is not used anywhere???
        sortDir: 'none', // TODO this is not used anywhere???
        sortInfo: [],
        sortSunburst: false,
        // stacking
        toggleStack: false,
        // data
        seriesFlipped: false,
        // label
        displayValues: null,
        displayGraphValues: false,
        yLabelFontSize: 'none', // TODO
        chloroType: 'State', // TODO
        mapLayer: 'openStreet',
        mapMarkerSize: 5,
        layerStyle: {
            opacity: 0.8,
            borderColor: '#e0dede',
        },
        html: '', // TODO
        varList: '', // TODO
        fontSize: '12px',
        fontColor: '#000000',
        lineCurveType: 'Linear', // TODO
        showHierarchy: false, // TODO
        showHierarchyByUpstream: false, // TODO
        showHierarchyId: 'none', // TODO
        showHierarchyName: 'none', // TODO
        showParent: true,
        mapColorMapping: {}, // TODO
        mapColorHeader: '', // TODO
        visualizationRecommendation: false, // TODO
        treeDepth: -1, // TODO
        gridStylingCols: [], // TODO
        gridColStyle: false,
        gridSpanRows: false,
        gridHeaderColor: '#40A0FF',
        gridHeaderFontColor: '#FFFFFF',
        gridPivotStyle: {
            headerColor: '#F6F6F6',
            fontColor: '#1E1E1E',
            gridFullWidth: false,
            grandTotals: true,
            grandTotalsRows: true,
            grandTotalsColumns: true,
            subTotals: true,
        },
        kpiRound: true,
        kpiAutoScale: true,
    })
    .constant('WIDGET_APPLIED_MAPPING', {
        'col-grid-style': {
            paths: ['view.visualization.tools.shared.gridColStyle'],
            defaultValues: [false],
        },
        'animation-pie': {
            paths: ['view.visualization.tools.shared.animationPie'],
            defaultValues: ['None'],
        },
        'regression-line': {
            paths: ['view.visualization.tools.shared.regressionLine'],
            defaultValues: ['None'],
        },
        'sort-values': {
            paths: ['view.visualization.tasks.0.sortInfo'],
            defaultValues: [[]],
        },
        'sort-sunburst': {
            paths: ['view.visualization.tools.shared.sortSunburst'],
            defaultValues: [false],
        },
        'toggle-stack': {
            paths: ['view.visualization.tools.shared.toggleStack'],
            defaultValues: [false],
        },
        'flip-series': {
            paths: ['view.visualization.tools.shared.seriesFlipped'],
            defaultValues: [false],
        },
        'toggle-average': {
            paths: ['view.visualization.tools.shared.toggleAverage'],
            defaultValues: [false],
        },
        'time-series': {
            paths: ['view.visualization.tools.shared.timeSeries'],
            defaultValues: [false],
        },
        'toggle-donut': {
            paths: ['view.visualization.tools.shared.toggleDonut'],
            defaultValues: [false],
        },
        'toggle-extremes': {
            paths: ['view.visualization.tools.shared.toggleExtremes'],
            defaultValues: [false],
        },
        'toggle-y-axis': {
            paths: ['view.visualization.tools.shared.toggleYAxis'],
            defaultValues: [true],
        },
        'edit-grid': {
            paths: [
                'view.visualization.tools.shared.editGrid.x',
                'view.visualization.tools.shared.editGrid.y',
                'view.visualization.tools.shared.editGrid.xScatter',
                'view.visualization.tools.shared.editGrid.yWaterfall',
            ],
            defaultValues: [false, true, true, false],
        },
        'toggle-area': {
            paths: ['view.visualization.tools.shared.toggleArea'],
            defaultValues: [false],
        },
        'collapse-all': {
            paths: ['view.visualization.tools.shared.collapseAll'],
            defaultValues: [false],
        },
        'change-alignment': {
            paths: ['view.visualization.tools.shared.changeAlignment'],
            defaultValues: ['center'],
        },
        'show-parent': {
            paths: ['view.visualization.tools.shared.showParent'],
            defaultValues: [true],
        },
        'toggle-legend': {
            paths: ['view.visualization.tools.shared.toggleLegend'],
            defaultValues: [false],
        },
        'toggle-tooltips': {
            paths: ['view.visualization.tools.shared.showTooltips'],
            defaultValues: [true],
        },
        'change-layout': {
            paths: ['view.visualization.tools.shared.toggleLayout'],
            defaultValues: [false],
        },
        'cluster-color': {
            paths: ['view.visualization.tools.shared.clusterExists'],
            defaultValues: [false],
        },
        'toggle-lock': {
            paths: ['view.visualization.tools.shared.toggleLock'],
            defaultValues: [true],
        },
        'toggle-radial': {
            paths: ['view.visualization.tools.shared.toggleRadial'],
            defaultValues: [false],
        },
        'toggle-shadow': {
            paths: ['view.visualization.tools.shared.toggleShadow'],
            defaultValues: [false],
        },
        'toggle-shape': {
            paths: ['view.visualization.tools.shared.toggleShape'],
            defaultValues: [true],
        },
        'toggle-axis-labels': {
            paths: ['view.visualization.tools.shared.toggleAxisLabels'],
            defaultValues: [false],
        },
        'edit-x-axis': {
            paths: ['view.visualization.tools.shared.editXAxis'],
            defaultValues: [false],
        },
        'edit-y-axis': {
            paths: ['view.visualization.tools.shared.editYAxis'],
            defaultValues: [false],
        },
        'edit-tree-depth': {
            paths: ['view.visualization.tools.shared.treeDepth'],
            defaultValues: [-1],
        },
        'min-max': {
            paths: ['view.visualization.tools.shared.minMax'],
            defaultValues: [false],
        },
        'heat-range': {
            paths: ['view.visualization.tools.shared.heatRange'],
            defaultValues: [false],
        },
        bucket: {
            paths: ['view.visualization.tools.shared.buckets'],
            defaultValues: [10],
        },
        'toggle-x-label': {
            paths: ['view.visualization.tools.shared.toggleXLabel'],
            defaultValues: [true],
        },
        'toggle-z': {
            paths: ['view.visualization.tools.shared.toggleZ'],
            defaultValues: [true],
        },
        'toggle-zoom-x': {
            paths: ['view.visualization.tools.shared.toggleZoomXEnabled'],
            defaultValues: [false],
        },
        'toggle-zoom-y': {
            paths: ['view.visualization.tools.shared.toggleZoomY'],
            defaultValues: [false],
        },
        'save-data-zoom': {
            paths: [
                'view.visualization.tools.shared.saveDataZoom.startX',
                'view.visualization.tools.shared.saveDataZoom.endX',
                'view.visualization.tools.shared.saveDataZoom.startY',
                'view.visualization.tools.shared.saveDataZoom.endY',
            ],
            defaultValues: [0, 0, 0, 0],
        },
        'display-values': {
            paths: ['view.visualization.tools.shared.displayValues'],
            defaultValues: [false],
        },
        'display--graph-values': {
            paths: ['view.visualization.tools.shared.displayGraphValues'],
            defaultValues: [false],
        },
        'fit-to-view': {
            paths: ['view.visualization.tools.shared.fitToView'],
            defaultValues: [false],
        },
        'click-to-collapse': {
            paths: ['view.visualization.tools.shared.clickToCollapse'],
            defaultValues: [true],
        },
        'flip-order': {
            paths: ['view.visualization.tools.shared.flipOrder'],
            defaultValues: [false],
        },
        'axis-type': {
            paths: ['view.visualization.tools.shared.axisType'],
            defaultValues: [false],
        },
        'flip-axis': {
            paths: ['view.visualization.tools.shared.rotateAxis'],
            defaultValues: [false],
        },
        'normalize-axis': {
            paths: ['view.visualization.tools.shared.normalizeAxis'],
            defaultValues: [false],
        },
        rose: {
            paths: ['view.visualization.tools.shared.rose'],
            defaultValues: ['Default'],
        },
        'curve-type': {
            paths: ['view.visualization.tools.shared.curveType'],
            defaultValues: ['Smooth'],
        },
        'reverse-y': {
            paths: ['view.visualization.tools.shared.yReversed'],
            defaultValues: [false],
        },
        'reverse-x': {
            paths: ['view.visualization.tools.shared.xReversed'],
            defaultValues: [false],
        },
        watermark: {
            paths: ['view.visualization.tools.shared.watermark'],
            defaultValues: [''],
        },
        'toggle-trendline': {
            paths: ['view.visualization.tools.shared.toggleTrendline'],
            defaultValues: ['No Trendline'],
        },
        'heatmap-legend': {
            paths: ['view.visualization.tools.shared.heatmapLegend'],
            defaultValues: ['continuous'],
        },
        'show-adjacent': {
            paths: ['view.visualization.tools.shared.showAdjacent'],
            defaultValues: [false],
        },
        'show-direction': {
            paths: ['view.visualization.tools.shared.showDirection'],
            defaultValues: [false],
        },
        'show-heat': {
            paths: ['view.visualization.tools.shared.showHeat'],
            defaultValues: [false],
        },
        'show-date': {
            paths: ['view.visualization.tools.shared.showDate'],
            defaultValues: [true],
        },
        'show-quadrants': {
            paths: ['view.visualization.tools.shared.showQuadrants'],
            defaultValues: [false],
        },
        'show-new-column': {
            paths: ['view.visualization.tools.shared.showNewColumn'],
            defaultValues: [false],
        },
        'gantt-group-view': {
            paths: ['view.visualization.tools.shared.ganttGroupView'],
            defaultValues: [false],
        },
        'axis-pointer': {
            paths: ['view.visualization.tools.shared.axisPointer'],
            defaultValues: ['shadow'],
        },
        'toggle-axis-pointer': {
            paths: ['view.visualization.tools.shared.toggleAxisPointer'],
            defaultValues: [true],
        },
        'color-panel': {
            paths: ['view.visualization.tools.shared.colorName'],
            defaultValues: ['Semoss'],
        },
        'choropleth-map-type': {
            paths: ['view.visualization.tools.shared.choroplethMapType'],
            defaultValues: ['states'],
        },
        'axis-labels': {
            paths: ['view.visualization.tools.shared.axisLabels'],
            defaultValues: [{}],
        },
        'axis-fit': {
            paths: ['view.visualization.tools.shared.axisFit'],
            defaultValues: [true],
        },
        'bar-image': {
            paths: ['view.visualization.tools.shared.barImage'],
            defaultValues: [false],
        },
        'mark-area': {
            paths: ['view.visualization.tools.shared.markArea'],
            defaultValues: [false],
        },
        'mark-line': {
            paths: ['view.visualization.tools.shared.markLine'],
            defaultValues: [false],
        },
        'customize-bar-label': {
            paths: [
                'view.visualization.tools.shared.customizeBarLabel.position',
                'view.visualization.tools.shared.customizeBarLabel.rotate',
                'view.visualization.tools.shared.customizeBarLabel.align',
                'view.visualization.tools.shared.customizeBarLabel.fontFamily',
                'view.visualization.tools.shared.customizeBarLabel.fontSize',
                'view.visualization.tools.shared.customizeBarLabel.fontWeight',
            ],
            defaultValues: ['top', '0', 'center', 'sans-serif', '12', 'normal'],
        },
        'customize-label': {
            paths: ['view.visualization.tools.shared.customizeLabel'],
            defaultValues: [false],
        },
        'customize-graph-label': {
            paths: ['view.visualization.tools.shared.customizeGraphLabel'],
            defaultValues: [{}],
        },
        'customize-pie-label': {
            paths: [
                'view.visualization.tools.shared.customizePieLabel.dimension',
                'view.visualization.tools.shared.customizePieLabel.dynamicView',
                'view.visualization.tools.shared.customizePieLabel.fontSize',
                'view.visualization.tools.shared.customizePieLabel.position',
            ],
            defaultValues: [['Name'], 'No', '15', 'Outside'],
        },
        'pie-radius': {
            paths: [
                'view.visualization.tools.shared.pieRadius.innerRadius',
                'view.visualization.tools.shared.pieRadius.outerRadius',
            ],
            defaultValues: [0, 70],
        },
        'customize-sunburst-label': {
            paths: [
                'view.visualization.tools.shared.customizeSunburstLabel.orientation',
                'view.visualization.tools.shared.customizeSunburstLabel.fontSize',
            ],
            defaultValues: ['radial', '12'],
        },
        'customize-funnel-label': {
            paths: [
                'view.visualization.tools.shared.customizeFunnelLabel.dimension',
                'view.visualization.tools.shared.customizeFunnelLabel.fontSize',
                'view.visualization.tools.shared.customizeFunnelLabel.position',
                'view.visualization.tools.shared.customizeFunnelLabel.showLabel',
            ],
            defaultValues: ['Name', '15', 'inside', 'On Hover'],
        },
        'facet-headers': {
            paths: [
                'view.visualization.tools.shared.facetHeaders.headerFontSize',
                'view.visualization.tools.shared.facetHeaders.titleName',
                'view.visualization.tools.shared.facetHeaders.titleFontSize',
                'view.visualization.tools.shared.facetHeaders.commonAxis',
                'view.visualization.tools.shared.facetHeaders.customLayout',
                'view.visualization.tools.shared.facetHeaders.numberColumns',
                'view.visualization.tools.shared.facetHeaders.unitType',
                'view.visualization.tools.shared.facetHeaders.grid',
                'view.visualization.tools.shared.facetHeaders.spacing',
            ],
            defaultValues: [
                '14',
                false,
                '18',
                true,
                false,
                2,
                'px',
                {
                    width: 200,
                    height: 200,
                },
                {
                    x: 60,
                    y: 60,
                },
            ],
        },
        'edit-bar-width': {
            paths: [
                'view.visualization.tools.shared.editBarWidth.barWidth',
                'view.visualization.tools.shared.editBarWidth.defaultWidth',
            ],
            defaultValues: ['null', 'Yes'],
        },
        'node-repulsion': {
            paths: [
                'view.visualization.tools.shared.nodeRepulsion.edgeLength',
                'view.visualization.tools.shared.nodeRepulsion.gravity',
                'view.visualization.tools.shared.nodeRepulsion.repulsion',
            ],
            defaultValues: ['100', '0.25', '60'],
        },
        'toggle-polar-zoom': {
            paths: ['view.visualization.tools.shared.togglePolarZoom'],
            defaultValues: ['No Zoom'],
        },
        'line-style': {
            paths: [
                'view.visualization.tools.shared.lineStyle.type',
                'view.visualization.tools.shared.lineStyle.width',
            ],
            defaultValues: ['solid', '3'],
        },
        'line-style-area': {
            paths: [
                'view.visualization.tools.shared.lineStyleArea.type',
                'view.visualization.tools.shared.lineStyleArea.width',
            ],
            defaultValues: ['dotted', '3'],
        },
        'change-symbol': {
            paths: [
                'view.visualization.tools.shared.changeSymbol.chooseType',
                'view.visualization.tools.shared.changeSymbol.symbolSize',
                'view.visualization.tools.shared.changeSymbol.symbolURL',
            ],
            defaultValues: ['Circle', '12', ''],
        },
        'change-symbol-dendrogram': {
            paths: [
                'view.visualization.tools.shared.changeSymbolDendrogram.chooseType',
                'view.visualization.tools.shared.changeSymbolDendrogram.symbolSize',
                'view.visualization.tools.shared.changeSymbolDendrogram.symbolURL',
            ],
            defaultValues: ['Empty Circle', '12', ''],
        },
        'customize-symbol': {
            paths: ['view.visualization.tools.shared.customizeSymbol.rules'],
            defaultValues: [[]],
        },
        'target-date': {
            paths: ['view.visualization.tools.shared.targetDate'],
            defaultValues: [false],
        },
        'target-date-range': {
            paths: ['view.visualization.tools.shared.targetDateRange'],
            defaultValues: [false],
        },
        'fiscal-axis': {
            paths: [
                'view.visualization.tools.shared.fiscalAxis.enabled',
                'view.visualization.tools.shared.fiscalAxis.startMonth',
                'view.visualization.tools.shared.fiscalAxis.axisColor',
            ],
            defaultValues: ['No', 'January', '#40A0FF'],
        },
        'map-color-theme': {
            paths: ['view.visualization.tools.shared.mapColorTheme'],
            defaultValues: ['Light 1'],
        },
        'map-layer': {
            paths: ['view.visualization.tools.shared.mapLayer'],
            defaultValues: ['openStreet'],
        },
        'layer-style': {
            paths: [
                'view.visualization.tools.shared.layerStyle.opacity',
                'view.visualization.tools.shared.layerStyle.borderColor',
            ],
            defaultValues: [0.8, '#e0dede'],
        },
        'parcoords-smooth-line': {
            paths: [
                'view.visualization.tools.individual.parallel-coordinates-echarts.smoothLine',
            ],
            defaultValues: [false],
        },
        'fit-horizontal': {
            paths: ['view.visualization.tools.shared.widthFitToScreen'],
            defaultValues: [false],
        },
        'fit-vertical': {
            paths: ['view.visualization.tools.shared.heightFitToScreen'],
            defaultValues: [false],
        },
        'parcoords-add-count': {
            paths: [
                'view.visualization.tools.individual.parallel-coordinates-echarts.count',
            ],
            defaultValues: [false],
        },
        'heatmap-square-size': {
            paths: [
                'view.visualization.tools.individual.heatmap-echarts.squareWidth',
                'view.visualization.tools.individual.heatmap-echarts.squareHeight',
            ],
            defaultValues: [25, 25],
        },
        'heatmap-size': {
            paths: [
                'view.visualization.tools.individual.heatmap-echarts.heatmapWidth',
                'view.visualization.tools.individual.heatmap-echarts.heatmapHeight',
            ],
            defaultValues: [false, false],
        },
        heatmapColor: {
            paths: ['view.visualization.tools.shared.heatmapColor'],
            defaultValues: [
                '#4575b4',
                '#74add1',
                '#abd9e9',
                '#e0f3f8',
                '#ffffbf',
                '#EECF96',
                '#DD9080',
                '#CE6661',
                '#C0444E',
            ],
        },
        gaugeColor: {
            paths: ['view.visualization.tools.shared.gaugeColor'],
            defaultValues: ['#4575b4', '#74add1', '#CE6661', '#C0444E'],
        },
        waterfallColor: {
            paths: ['view.visualization.tools.shared.waterfallColor'],
            defaultValues: ['#76B7B2', '#E15759'],
        },
        'format-data-values': {
            paths: ['view.visualization.tools.shared.formatDataValues'],
            defaultValues: [false],
        },
        'font-settings': {
            paths: [
                'view.visualization.tools.shared.fontSize',
                'view.visualization.tools.shared.fontColor',
            ],
            defaultValues: ['12px', '#000000'],
        },
        'grid-span-rows': {
            paths: ['view.visualization.tools.shared.gridSpanRows'],
            defaultValues: [false],
        },
        'grid-col-style': {
            paths: ['view.visualization.tools.shared.gridStylingCols'],
            defaultValues: [[]],
        },
        'grid-pivot-style': {
            paths: [
                'view.visualization.tools.shared.gridPivotStyle.headerColor',
                'view.visualization.tools.shared.gridPivotStyle.fontColor',
                'view.visualization.tools.shared.gridPivotStyle.gridFullWidth',
                'view.visualization.tools.shared.gridPivotStyle.grandTotals',
                'view.visualization.tools.shared.gridPivotStyle.grandTotalsRows',
                'view.visualization.tools.shared.gridPivotStyle.grandTotalsColumns',
                'view.visualization.tools.shared.gridPivotStyle.subTotals',
            ],
            defaultValues: [
                '#F6F6F6',
                '#1E1EEE',
                false,
                true,
                true,
                true,
                true,
            ],
        },
        events: {
            paths: ['events'],
            defaultValues: [{}],
        },
        'custom-tooltip': {
            paths: [
                'view.visualization.tools.shared.customTooltip.html',
                'view.visualization.tools.shared.customTooltip.asset',
            ],
            defaultValues: ['', {}],
        },
        'chart-title': {
            paths: ['view.visualization.tools.shared.chartTitle.text'],
            defaultValues: [''],
        },
    })
    .constant('SEMOSS_VIDEOS', {
        overview: 'https://www.youtube-nocookie.com/embed/gj6kQhIdfVk?rel=0',
        dashboard: 'https://www.youtube-nocookie.com/embed/AA72vgwhKjI?rel=0',
        r: 'https://www.youtube-nocookie.com/embed/P2PDYAt7n_o?rel=0',
        python: 'https://www.youtube-nocookie.com/embed/CH21i-oTrh4?rel=0',
        tableau: 'https://www.youtube-nocookie.com/embed/aGRuIAHkcAY?rel=0',
        git: 'https://www.youtube-nocookie.com/embed/LpNLuipHcss?rel=0',
    })
    .constant('RDBMS_TYPES', [
        'ASTER_DB',
        'ATHENA',
        'BIG_QUERY',
        'CASSANDRA',
        'CLICKHOUSE',
        'DATABRICKS',
        'DB2',
        'DERBY',
        'ELASTIC_SEARCH',
        'H2_DB',
        'HIVE',
        'IMPALA',
        'REDSHIFT',
        'MARIA_DB',
        'MYSQL',
        'OPEN_SEARCH',
        'ORACLE',
        'PHOENIX',
        'POSTGRES',
        'SAP_HANA',
        'SPARK',
        'SQLITE',
        'SNOWFLAKE',
        'SQL_SERVER',
        'TERADATA',
        'TIBCO',
        'TRINO',
    ])
    .value('CONFIG', {}); // initialize to be filled later in app.config
