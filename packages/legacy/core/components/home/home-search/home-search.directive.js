'use strict';

import './home-search.scss';
import { PANEL_TYPES } from '../../../constants';

export default angular
    .module('app.home.home-search', [])
    .directive('homeSearch', searchDirective);

searchDirective.$inject = ['$timeout', 'semossCoreService'];

function searchDirective($timeout, semossCoreService) {
    searchCtrl.$inject = ['$scope'];
    searchLink.$inject = ['scope', 'ele'];
    return {
        restrict: 'E',
        template: require('./home-search.directive.html'),
        controller: searchCtrl,
        link: searchLink,
        scope: {},
        bindToController: {
            target: '@',
            open: '=',
        },
        controllerAs: 'homeSearch',
        transclude: true,
    };

    function searchCtrl() {}

    function searchLink(scope, ele) {
        var targetEle, appendEle, searchContentEle, resultsEle, searchTimeout;

        /** Initializing Vars ***/
        scope.homeSearch.options = {
            canCollect: false,
            loading: false,
            input: '',
            offset: 0,
            limit: 20,
            results: [],
        };

        scope.homeSearch.apps = {
            show: false,
            raw: [],
            selected: [],
        };

        scope.homeSearch.disableNlpSearch = true;

        // functions
        scope.homeSearch.changeSearch = changeSearch;
        scope.homeSearch.toggleApps = toggleApps;
        scope.homeSearch.createViz = createViz;
        scope.homeSearch.getVizSvg = getVizSvg;
        scope.homeSearch.openNlpSearch = openNlpSearch;

        /**
         * @name setSearch
         * @desc set the search data
         * @returns {void}
         */
        function setSearch() {
            let message = semossCoreService.utility.random('meta');

            scope.homeSearch.options.loading = true;

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                scope.homeSearch.options.loading = false;

                changeSearch();

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.homeSearch.apps.raw = JSON.parse(JSON.stringify(output));
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'myProjects',
                        components: [],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name updateSearch
         * @desc update when the search is open or closed
         * @returns {void}
         */
        function updateSearch() {
            document.removeEventListener('click', onDocumentClick, true);

            appendEle.style.visibility = 'hidden';
            appendEle.style.opacity = '0';

            if (appendEle) {
                if (appendEle.parentNode !== null) {
                    appendEle.parentNode.removeChild(appendEle);
                }
            }

            if (scope.homeSearch.open) {
                let searchEle = appendEle.querySelector(
                    '#home-search__bar__input'
                );

                setSearch();

                // append the element
                document.body.appendChild(appendEle);

                // position the element
                const targetRect = targetEle.getBoundingClientRect();
                appendEle.style.top =
                    window.pageYOffset + targetRect.top + 'px';
                appendEle.style.left =
                    window.pageXOffset + targetRect.left + 'px';

                // make it visible
                appendEle.style.visibility = 'visible';
                appendEle.style.opacity = '1';

                // focus on it
                $timeout(function () {
                    if (searchEle) {
                        const inputEle = searchEle.querySelector('input');
                        if (inputEle) {
                            inputEle.focus();
                        }
                    }
                });

                document.addEventListener('click', onDocumentClick, true);
            }
        }

        /**
         * @name changeSearch
         * @desc called when something is searched
         * @returns {void}
         */
        function changeSearch() {
            getInsights(true);
        }

        /**
         * @name onDocumentClick
         * @desc hide active if the document is clicked
         * @param {event} event dom event
         * @returns {void}
         */
        function onDocumentClick(event) {
            if (
                event &&
                event.target &&
                searchContentEle.contains(event.target)
            ) {
                return;
            }

            $timeout(function () {
                scope.homeSearch.open = false;
            });
        }

        /**
         * @name toggleApps
         * @desc called when the apps update
         * @returns {void}
         */
        function toggleApps() {
            getInsights(true);
        }

        /**
         * @name getInsights
         * @desc gets the insights for the current selected app
         * @param {boolean} clear - reset the search
         * @returns {void}
         */
        function getInsights(clear) {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            scope.homeSearch.options.loading = true;

            searchTimeout = $timeout(
                function (boundClear) {
                    var message,
                        filteredApps = [],
                        appIdx,
                        appLen;

                    if (boundClear) {
                        scope.homeSearch.options.canCollect = true;
                        scope.homeSearch.options.offset = 0;
                    }

                    filteredApps = [];
                    for (
                        appIdx = 0,
                            appLen = scope.homeSearch.apps.selected.length;
                        appIdx < appLen;
                        appIdx++
                    ) {
                        filteredApps.push(
                            scope.homeSearch.apps.selected[appIdx].project_id
                        );
                    }

                    message = semossCoreService.utility.random('query-pixel');

                    // register message to come back to
                    semossCoreService.once(message, function (response) {
                        var output = response.pixelReturn[0].output,
                            type = response.pixelReturn[0].operationType[0],
                            insightIdx = 0,
                            insightLen;

                        if (type.indexOf('ERROR') > -1) {
                            return;
                        }

                        insightLen = output.length;

                        scope.homeSearch.options.loading = false;
                        if (boundClear) {
                            scope.homeSearch.options.results = [];
                        }

                        for (; insightIdx < insightLen; insightIdx++) {
                            scope.homeSearch.options.results.push(
                                output[insightIdx]
                            );
                        }
                        scope.homeSearch.options.canCollect =
                            insightLen === scope.homeSearch.options.limit;
                    });

                    semossCoreService.emit('query-pixel', {
                        commandList: [
                            {
                                meta: true,
                                type: 'getInsights',
                                components: [
                                    filteredApps,
                                    scope.homeSearch.options.limit,
                                    scope.homeSearch.options.offset,
                                    scope.homeSearch.options.input,
                                    [],
                                ],
                                terminal: true,
                            },
                        ],
                        listeners: [],
                        response: message,
                    });
                }.bind(null, clear),
                300
            );
        }

        /**
         * @name getMoreInsights
         * @desc gets the insights for the current selected app
         * @returns {void}
         */
        function getMoreInsights() {
            if (!scope.homeSearch.options.canCollect) {
                return;
            }

            // check if it is at the bottom and going downwards
            if (
                resultsEle.scrollTop + resultsEle.clientHeight >=
                    resultsEle.scrollHeight * 0.75 &&
                !scope.homeSearch.options.loading
            ) {
                // increment the offset to get more
                scope.homeSearch.options.offset +=
                    scope.homeSearch.options.limit;
                getInsights();
            }
        }

        /**
         * @name createViz
         * @param {event} $event - DOM event
         * @param {object} insight - the selected insight to create - selected by the user from the insight list
         * @desc begins the process to create a visualization
         * @returns {void}
         */
        function createViz($event, insight) {
            var newSheet = true;

            if (
                $event &&
                ($event.metaKey ||
                    $event.ctrlKey ||
                    $event.keyCode === 17 ||
                    $event.keyCode === 224)
            ) {
                newSheet = false;
            }

            semossCoreService.emit('open', {
                type: 'insight',
                options: insight,
                newSheet: newSheet,
            });

            scope.homeSearch.open = false;
        }

        /** * Utility Functions ***/
        /**
         * @name getVizSvg
         * @desc gets the svg path from visualization service
         * @param {string} layout - layout of selected viz
         * @returns {string} svg path
         */
        function getVizSvg(layout) {
            var visualizations = {
                TreeMap: {
                    title: 'TreeMap',
                    svgSrc: require('images/treemap.svg'),
                    layout: 'TreeMap',
                },
                Radial: {
                    title: 'Radial',
                    svgSrc: require('images/radial.svg'),
                    layout: 'Radial',
                },
                Grid: {
                    title: 'Grid',
                    svgSrc: require('images/grid.svg'),
                    layout: 'Grid',
                },
                Graph: {
                    title: 'Graph',
                    svgSrc: require('images/graph.svg'),
                    layout: 'Graph',
                },
                VivaGraph: {
                    title: 'VivaGraph',
                    svgSrc: require('images/vivagraph.svg'),
                    layout: 'VivaGraph',
                },
                Column: {
                    title: 'Bar',
                    svgSrc: require('images/bar.svg'),
                    layout: 'Column',
                },
                Map: {
                    title: 'Map',
                    svgSrc: require('images/map.svg'),
                    layout: 'Map',
                },
                Choropleth: {
                    title: 'Choropleth',
                    svgSrc: require('images/choropleth.svg'),
                    layout: 'Choropleth',
                },
                HeatMap: {
                    title: 'Heat Map',
                    svgSrc: require('images/heatmap.svg'),
                    layout: 'HeatMap',
                },
                Line: {
                    title: 'Line',
                    svgSrc: require('images/line.svg'),
                    layout: 'Line',
                },
                Pie: {
                    title: 'Pie',
                    svgSrc: require('images/pie.svg'),
                    layout: 'Pie',
                },
                Scatter: {
                    title: 'Scatter',
                    svgSrc: require('images/scatterplot.svg'),
                    layout: 'Scatter',
                },
                ParallelCoordinates: {
                    title: 'Parallel Coordinates',
                    svgSrc: require('images/parallelcoordinate.svg'),
                    layout: 'ParallelCoordinates',
                },
                SingleAxisCluster: {
                    title: 'Single Axis Cluster',
                    svgSrc: require('images/singleaxiscluster.svg'),
                    layout: 'SingleAxisCluster',
                },
                Cluster: {
                    title: 'Cluster',
                    svgSrc: require('images/cluster.svg'),
                    layout: 'Cluster',
                },
                Dendrogram: {
                    title: 'Dendrogram',
                    svgSrc: require('images/dendrogram.svg'),
                    layout: 'Dendrogram',
                },
                ScatterplotMatrix: {
                    title: 'Scatter Matrix',
                    svgSrc: require('images/scatterplotmatrix.svg'),
                    layout: 'ScatterplotMatrix',
                },
                Sunburst: {
                    title: 'Sunburst',
                    svgSrc: require('images/sunburst.svg'),
                    layout: 'Sunburst',
                },
                Gantt: {
                    title: 'Gantt',
                    svgSrc: require('images/gantt.svg'),
                    layout: 'Gantt',
                },
                Sankey: {
                    title: 'Sankey',
                    svgSrc: require('images/sankey.svg'),
                    layout: 'Sankey',
                },
                dashboard: {
                    title: 'Dashboard',
                    svgSrc: require('images/dashboard-svg-icon.svg'),
                    layout: 'dashboard',
                },
                panel: {
                    title: 'Panel',
                    svgSrc: require('images/dashboard-svg-icon.svg'),
                    layout: 'panel',
                },
                'text-widget': {
                    title: 'Text Widget',
                    svgSrc: require('images/text-widget-icon.svg'),
                    layout: 'TextWidget',
                },
                'text-editor': {
                    title: 'Text Editor',
                    svgSrc: require('images/text-widget-icon.svg'),
                    layout: 'TextEditor',
                },
                'html-widget': {
                    title: 'HTML',
                    svgSrc: require('images/htmlwidget.svg'),
                    layout: 'HtmlWidget',
                },
                Pack: {
                    title: 'Circle Pack',
                    svgSrc: require('images/pack.svg'),
                    layout: 'Pack',
                },
                Cloud: {
                    title: 'Word Cloud',
                    svgSrc: require('images/word-cloud.svg'),
                    layout: 'Cloud',
                },
                Clustergram: {
                    title: 'Cluster',
                    svgSrc: require('images/clustergram-standard.svg'),
                    layout: 'Clustergram',
                },
                Area: {
                    title: 'Area Chart',
                    svgSrc: require('images/area.svg'),
                    layout: 'Area',
                },
                kClusters: {
                    title: 'K Means Clustering',
                    svgSrc: require('images/k-clusters.svg'),
                    layout: 'kClusters',
                },
                CircleView: {
                    title: 'Circle View',
                    svgSrc: require('images/circle-view.svg'),
                    layout: 'circleView',
                },
                BoxWhisker: {
                    title: 'Box and Whisker',
                    svgSrc: require('images/box.svg'),
                    layout: 'boxwhisker',
                },
                DualAxis: {
                    title: 'Dual Axis',
                    svgSrc: require('images/dual-axis.svg'),
                    layout: 'DualAxis',
                },
                Bubble: {
                    title: 'Bubble',
                    svgSrc: require('images/bubble.svg'),
                    layout: 'Bubble',
                },
                DashboardParam: {
                    title: 'DashboardParam',
                    svgSrc: require('images/param.svg'),
                    layout: 'DashboardParam',
                },
                DashboardFilter: {
                    title: 'DashboardFilter',
                    svgSrc: require('images/dashboardfilter.svg'),
                    layout: 'DashboardFilter',
                },
                /** * SPECIFIC **/
                'prerna.ui.components.playsheets.MashupPlaySheet': {
                    title: 'Mashup',
                    svgSrc: require('images/dashboard-svg-icon.svg'),
                    layout: 'Mashup',
                },
                'prerna.ui.components.playsheets.SankeyPlaySheet': {
                    title: 'Sankey',
                    svgSrc: require('images/sankey-svg-icon.svg'),
                    layout: 'prerna.ui.components.playsheets.SankeyPlaySheet',
                },
                'prerna.ui.components.specific.tap.MHSDashboardDrillPlaysheet':
                    {
                        title: 'statusDashboard',
                        svgSrc: require('images/blue-logo.svg'),
                        layout: 'statusDashboard',
                    },
                'prerna.ui.components.specific.anthem.AnthemPainpointsPlaysheet':
                    {
                        title: 'statusDashboard',
                        svgSrc: require('images/blue-logo.svg'),
                        layout: 'statusDashboard',
                    },
                'prerna.ui.components.specific.anthem.AnthemInitiativePlaysheet':
                    {
                        title: 'statusDashboard',
                        svgSrc: require('images/blue-logo.svg'),
                        layout: 'statusDashboard',
                    },
                /** TAP Specific Visualizations **/
                // TODO: Improve extensiblity
                SystemSimilarity: {
                    title: 'System Similarity Heat Map',
                    svgSrc: require('images/-svg-icon.svg'),
                    layout: 'SystemSimilarity',
                },
                'prerna.ui.components.specific.tap.InterfaceGraphPlaySheet': {
                    title: 'Data Network Graph',
                    svgSrc: require('images/force-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.tap.InterfaceGraphPlaySheet',
                },
                'prerna.ui.components.specific.tap.SysSiteOptPlaySheet': {
                    title: 'Portfolio Rationalization Dashboard',
                    svgSrc: require('images/-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.tap.SysSiteOptPlaySheet',
                },
                'prerna.ui.components.specific.tap.SysCoverageSheetPortRat': {
                    title: 'System Coverage',
                    svgSrc: require('images/-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.tap.SysCoverageSheetPortRat',
                },
                'prerna.ui.components.specific.tap.HealthGridSheetPortRat': {
                    title: 'Health Grid',
                    svg: require('images/scatter-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.tap.HealthGridSheet',
                },
                'prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet':
                    {
                        title: 'MHS Genesis Deployment Map',
                        svgSrc: require('images/-svg-icon.svg'),
                        layout: 'prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet',
                    },
                'prerna.ui.components.specific.tap.HealthGridSheet': {
                    title: 'Health Grid',
                    svgSrc: require('images/scatter-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.tap.HealthGridSheet',
                },
                'prerna.ui.components.specific.tap.GraphTimePlaySheet': {
                    title: 'Network Timeline',
                    svgSrc: require('images/networktime-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.tap.GraphTimePlaySheet',
                },
                /** End TAP Specific Visualizations **/
                /** OUSD **/
                /** TODO BAD**/
                'prerna.ui.components.specific.ousd.SequencingDecommissioningPlaySheet':
                    {
                        title: 'Grid',
                        svgSrc: require('images/grid.svg'),
                        layout: 'prerna.ui.components.specific.ousd.SequencingDecommissioningPlaySheet',
                    },
                'prerna.ui.components.specific.ousd.RoadmapCleanTablePlaySheet':
                    {
                        title: 'Grid',
                        svgSrc: require('images/grid.svg'),
                        layout: 'prerna.ui.components.specific.ousd.SequencingDecommissioningPlaySheet',
                    },
                'prerna.ui.components.specific.ousd.RoadmapTimelineStatsPlaySheet':
                    {
                        title: 'Gantt',
                        svgSrc: require('images/chart-gantt.svg'),
                        layout: 'prerna.ui.components.specific.ousd.RoadmapTimelineStatsPlaySheet',
                    },
                'prerna.ui.components.specific.iatdd.AOAQueuingDashboard': {
                    title: 'AoA Queuing Dashboard',
                    svgSrc: require('images/dashboard-svg-icon.svg'),
                    layout: 'prerna.ui.components.specific.iatdd.AOAQueuingDashboard',
                },
                /** NAVY PEO **/
                'prerna.ui.components.specific.navypeo.NavyScoreboardPlaysheet':
                    {
                        title: 'Scorecard',
                        svgSrc: require('images/-svg-icon.svg'),
                        layout: 'prerna.ui.components.specific.navypeo.NavyScoreboardPlaysheet',
                    },
            };

            if (visualizations[layout]) {
                return visualizations[layout].svgSrc;
            }
            return require('images/-svg-icon.svg');
        }

        /**
         * @name openNlpSearch
         * @desc creates a new insight with nlp search opened
         * @returns {void}
         */
        function openNlpSearch() {
            let recipe = semossCoreService.pixel.build([
                {
                    type: 'addPanel',
                    components: [0, '0'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [0],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: PANEL_TYPES.GOLDEN,
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [0],
                },
                {
                    type: 'addPanelEvents',
                    components: [
                        {
                            onSingleClick: {
                                Unfilter: [
                                    {
                                        panel: '',
                                        query: '<encode>(<Frame> | UnfilterFrame(<SelectedColumn>));</encode>',
                                        options: {},
                                        refresh: false,
                                        default: true,
                                        disabledVisuals: ['Grid', 'Sunburst'],
                                        disabled: false,
                                    },
                                ],
                            },
                            onBrush: {
                                Filter: [
                                    {
                                        panel: '',
                                        query: '<encode>if((IsEmpty(<SelectedValues>)),(<Frame> | UnfilterFrame(<SelectedColumn>)), (<Frame> | SetFrameFilter(<SelectedColumn>==<SelectedValues>)));</encode>',
                                        options: {},
                                        refresh: false,
                                        default: true,
                                        disabled: false,
                                    },
                                ],
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [0],
                },
                {
                    type: 'retrievePanelEvents',
                    components: [],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [0],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'visualization',
                        {
                            type: 'echarts',
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [0],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'nlp-search',
                        {
                            type: 'GLOBAL',
                        },
                    ],
                    terminal: true,
                },
            ]);
            if (recipe.length) {
                semossCoreService.emit('open', {
                    type: 'pixel',
                    options: {
                        pixel: recipe,
                    },
                });
            }

            scope.homeSearch.open = false;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            targetEle = ele[0].querySelector(scope.homeSearch.target);
            appendEle = ele[0].querySelector('#home-search__append');

            searchContentEle = appendEle.querySelector('#home-search__content');
            resultsEle = appendEle.querySelector(
                '#home-search__list__insights--results'
            );
            resultsEle.addEventListener('scroll', getMoreInsights);

            scope.$watch('homeSearch.open', updateSearch);

            scope.$on('destroy', function () {});
        }

        initialize();
    }
}
