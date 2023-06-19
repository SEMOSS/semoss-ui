'use strict';

import {
    AspectRatio,
    CircleDatum,
    CircleGroupDatum,
    ClusterData,
    ClusterStandardState,
    DataTableAlign,
    Group,
    Size,
} from '.';

import { ForceX, ForceY, SimulationNodeDatum } from 'd3-force';

import * as d3 from 'd3';

import d3tip from '@/widget-resources/js/d3_v4-tip/index';
import style from './style';
import '@/widget-resources/css/d3-charts.css';
import angular from 'angular';

/**
 * @name cluster
 * @desc Cluster directive for creating and visualizing a cluster diagram
 */
export default angular
    .module('app.cluster-standard.directive', [])
    .directive('clusterStandard', clusterStandard);

clusterStandard.$inject = ['semossCoreService'];

/**
 * @name clusterStandard
 * @param semossCoreService Shared application AngualarJS service module
 * @return Cluster standard AngularJS directive config
 */
function clusterStandard(semossCoreService) {
    clusterStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        link: clusterStandardLink,
    };

    function clusterStandardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** **************Get Chart Div *************************/

        scope.chartDiv = d3.select(ele[0].firstElementChild);

        /** ************** Global variables *************************/

        let aspectRatio,
            brush,
            callbacks,
            clusterData,
            columns,
            dataTableAlign,
            filteredGroups,
            forceX,
            forceY,
            groupCategories,
            groupingCategory,
            groups,
            groupSqrt,
            listeners,
            maxClusterSize,
            maxGroupLength,
            rows,
            size,
            spaceMultiplier,
            svg,
            tip,
            transform;

        // Constants
        const fill = d3.scaleOrdinal(getColorPalette()),
            zoom = getD3Zoom(),
            thresholdGroupLength = 9;

        initialize();

        /** ************** Functions *************************/

        /**
         * @name addActualPositions
         * @description Sets actual x and y coordinates for each circle datum
         * @param {CircleGroupDatum} group Circle group datum
         */
        function addActualPositions(group: CircleGroupDatum): void {
            group.data.forEach(function (d) {
                d.actualX = group.x + d.x;
                d.actualY = group.y + d.y;
            });
        }

        /**
         * @name addCircles
         * @param {SVGGElement} circleGroup <g> container to add circles to.
         * @param {array} group Data of groups that contain each group's circle data.
         * @description Binds data to each circle and add circles to each group.
         * Styles and adds mouse event handlers for each circle. Removes
         * unneeded circles.
         */
        function addCircles(circleGroup: SVGGElement, group: Group): void {
            const circles = d3
                .select(circleGroup)
                .selectAll('circle')
                .data(group.data, get('index'));

            circles
                .enter()
                .append('circle')
                .attr('r', style.circle.r)
                .attr('cx', get('x'))
                .attr('cy', get('y'))
                .attr('stroke', style.circle.stroke)
                .attr('stroke-width', style.circle['stroke-width'])
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .merge(circles)
                .style('fill', function () {
                    return fill(
                        groupCategories.indexOf(group[groupingCategory])
                    );
                });

            circles.exit().on('mouseover', null).on('mouseout', null).remove();
        }

        /**
         * @name brushend
         * @description If brushed selection exists, run simulation on brushed
         * selection data. Else, remove brushed class from all circle groups.
         */
        function brushend(): void {
            if (d3.event.selection === null) {
                svg.selectAll('.brushed').attr('class', null);
            } else {
                const cluster = clusterData.dataTableAlign.cluster,
                    label = clusterData.dataTableAlign.label,
                    brushed = d3.selectAll('circle.brushed'),
                    data = brushed.data(),
                    brushedGroupsData = d3
                        .selectAll('g.brushed')
                        .data()
                        .map(function (
                            group: CircleGroupDatum
                        ): CircleGroupDatum {
                            group.data = data.filter(function (
                                d: CircleDatum
                            ): boolean {
                                return (
                                    d[groupingCategory] ===
                                    group[groupingCategory]
                                );
                            });

                            return group;
                        });

                setFilteredGroups(brushedGroupsData);

                // runPixel with filtered data
                callbacks.onBrush({
                    data: {
                        [cluster]: data.map(function (d) {
                            return d[cluster];
                        }),
                        [label]: data.map(function (d) {
                            return d[label];
                        }),
                    },
                });

                brushed.attr('class', null);

                // Remove brushed selection
                d3.select(this).call(brush.move, null);
            }
        }

        /**
         * @name brushmove
         * @description Add brushed class and apply style to brushed selection.
         */
        function brushmove(): void {
            const selection = d3.event.selection;

            if (selection !== null) {
                svg.selectAll('#groups > g').attr('class', null);

                svg.selectAll('#groups circle')
                    .attr('class', null)
                    .filter(isCircleBrushed(selection))
                    .attr('class', 'brushed')
                    .each(function () {
                        d3.select(this.parentNode).attr('class', 'brushed');
                    });
            }
        }

        /**
         * @name calculatePosition
         * @description Calculates a cluster's position based off the max cluster
         * size of all clusters and adds three times the diameter of a cluster
         * point as space.
         * @param {number} positionIndex Cluster position on visualization
         * @return {number} Cluster coordinate position
         */
        function calculatePosition(positionIndex: number): number {
            const clusterPosition = maxClusterSize * positionIndex,
                diameter = style.circle.r * 2,
                spaceSize = diameter * 3,
                clusterPositionSpace = spaceSize * positionIndex;

            return clusterPosition + clusterPositionSpace;
        }

        /**
         * @name calculateXPosition
         * @description Create a factory function that calculates the x position
         * for a given cluster group
         * @param {number} columns Number of columns based off aspect ratio of
         * container
         * @return {function} Factory function to calculate cluster group x
         * position
         */
        function calculateXPosition(columns: number): (d: Group) => number {
            return function (d: Group): number {
                return calculatePosition(Math.floor(d.i % columns));
            };
        }

        /**
         * @name calculateYPosition
         * @description Create a factory function that calculates the y position
         * for a given cluster group
         * @param {number} columns Number of columns based off aspect ratio of
         * container
         * @return {function} Factory function to calculate cluster group y
         * position
         */
        function calculateYPosition(columns: number): (d: Group) => number {
            return function (d: Group): number {
                return calculatePosition(Math.floor(d.i / columns));
            };
        }

        /**
         * @name createBrush
         * @description Instantiates and appends brush element to SVG. Adds brush
         * mouse event handlers.
         */
        function createBrush(): void {
            if (svg.selectAll('.brush').size() === 0) {
                brush = d3.brush().on('brush', brushmove).on('end', brushend);

                svg.append('g').attr('class', 'brush').call(brush);
            }
        }

        /**
         * @name createState
         * @description Creates current state of visualization
         * @param  clusterData Contains data used to derive state
         * @return {ClusterStandardState} Current state of visualization
         */
        function createState(
            newClusterData: ClusterData
        ): ClusterStandardState {
            const state = {} as ClusterStandardState;

            state.clusterData = newClusterData;
            state.groupingCategory = state.clusterData.dataTableAlign.cluster;
            state.groups = getGroups(
                state.clusterData.viewData,
                state.groupingCategory
            );
            state.groupCategories = getGroupCategories(
                state.groups,
                state.groupingCategory
            );

            if (
                clusterData === undefined ||
                isFiltered(newClusterData, clusterData) === false
            ) {
                state.maxGroupLength = d3.max(state.groups, function (group) {
                    return group.data.length;
                });
                state.maxClusterSize =
                    style.circle.r *
                        2 *
                        Math.ceil(Math.sqrt(state.maxGroupLength)) +
                    state.maxGroupLength / 2;
            } else {
                // state.groups = filterGroups(state.groups, dataTableAlign)
                state.maxGroupLength = maxGroupLength;
                state.maxClusterSize = maxClusterSize;
            }

            if (angular.equals(state.groupingCategory, groupingCategory)) {
                state.groupCategories = updateGroupCategories(
                    state.groupCategories
                );
            }

            state.groupSqrt = Math.sqrt(state.groupCategories.length);
            state.columns = getColumns(aspectRatio.horizontal, state.groupSqrt);
            state.rows = getRows(aspectRatio.vertical, state.groupSqrt);

            state.groups.forEach(function (group) {
                group.i = state.groupCategories.indexOf(
                    group[state.groupingCategory]
                );
            });

            state.forceX = getD3ForceX(state.columns);
            state.forceY = getD3ForceY(state.columns);

            return state;
        }

        /**
         * @name get
         * @description A helper function created to retrieve the value of a given property in a D3 chart
         * @param {string} propName Property name that you want to retrieve
         * @return Factory function for retrieving the object property
         */
        function get(propName: string): (d: object) => any {
            return function (d) {
                return d[propName];
            };
        }

        /**
         * @name getAspectRatio
         * @param {object} size Object containing height and width in pixels.
         * @return {object} Object containing horizontal and vertical aspect ratios.
         */
        function getAspectRatio(size: Size): AspectRatio {
            return {
                horizontal: size.width / size.height,
                vertical: size.height / size.width,
            };
        }

        /**
         * @name getCallbacks
         * @description Returns event callback functions for the selected mode
         * @return {object} An object containing event callback functions for the selected mode
         */
        function getCallbacks(): object {
            return scope.widgetCtrl.getEventCallbacks();
        }

        /**
         * @name getChartData
         * @description Retrieves data to graph
         * @return Array of data objects based off selected chart options
         */
        function getChartData(): object[] {
            const layerIndex = 0,
                data = getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                );
            return semossCoreService.visualization.getTableData(
                data.headers,
                data.values,
                data.rawHeaders
            );
        }

        /**
         * @name getClusterData
         * @description Merges data with layout and table configuration used to render the graph
         * @return {object} Configuration object for rendering the graph
         */
        function getClusterData(): ClusterData | undefined {
            const clusterData = JSON.parse(JSON.stringify(getChartData()));

            // return and alert the user if no data exists
            if (!clusterData.viewData) {
                console.log('No data returned from the backend');
                return;
            }

            clusterData.uiOptions = getUIOptions();
            clusterData.dataTableAlign = getDataTableAlign();

            return clusterData;
        }

        /**
         * @name getColorPalette
         * @return {array} Array of the color hex values
         */
        function getColorPalette(): string[] {
            const sharedTools = getWidget('view.visualization.tools.shared');

            return sharedTools.color;
        }

        /**
         * @name getColumns
         * @param {number} horizontalAspectRatio Horizontal aspect ratio of chart container node
         * @param {number} groupSqrt Square root of number of cluster groups
         * @return {number} Number of columns to render
         */
        function getColumns(
            horizontalAspectRatio: number,
            groupSqrt: number
        ): number {
            return horizontalAspectRatio * groupSqrt;
        }

        /**
         * @name getD3ForceX
         * @param {number} columns Number of columns to render
         * @return {object} Force that calculates a cluster group's x-axis positioning
         */
        function getD3ForceX(columns: number): ForceX<SimulationNodeDatum> {
            return d3.forceX().x(calculateXPosition(columns));
        }

        /**
         * @name getD3ForceY
         * @param {number} columns Number of columns to render
         * @return {object} Force that calculates a cluster group's y-axis positioning
         */
        function getD3ForceY(columns: number): ForceY<SimulationNodeDatum> {
            return d3.forceY().y(calculateYPosition(columns));
        }

        /**
         * @name getD3Tip
         * @param {string[]} viewHeaders Headers of all cluster data points.
         * @return Returns configured D3 tooltip.
         */
        function getD3Tip(viewHeaders: string[]) {
            const uiOptions: any = getUIOptions(),
                tooltipStyle: any = uiOptions.tooltip || {};
            return d3tip()
                .attr('class', 'd3-tip')
                .attr('id', 'cluster-d3-tip')
                .style('z-index', '10000')
                .html(function (d) {
                    let tooltipText = '<div>';

                    viewHeaders.forEach(function (header) {
                        if (d[header]) {
                            tooltipText +=
                                '    <span>' +
                                header +
                                ': ' +
                                d[header] +
                                '</span><br/>';
                        }
                    });

                    tooltipText += '</div>';

                    return tooltipText;
                })
                .style(
                    'background-color',
                    tooltipStyle.backgroundColor || '#FFFFFF'
                )
                .style('border-width', tooltipStyle.borderWidth || '0px')
                .style('border-color', tooltipStyle.borderColor || '')
                .style('border-style', 'solid')
                .style('font-size', parseFloat(tooltipStyle.fontSize) || 12)
                .style('font-family', tooltipStyle.fontFamily || 'Inter')
                .style('color', tooltipStyle.fontColor || '#000000');
        }

        /**
         * @name getD3Zoom
         * @return {ZoomBehavior} An instance of D3 ZoomBehavior with
         * the scaleExtent set and zoom event attached.
         */
        function getD3Zoom() {
            return d3
                .zoom()
                .scaleExtent([0.1, 10])
                .on('zoom', function () {
                    // Capture tranform in case its needed when determining
                    // if a cluster has been brushed
                    transform = d3.event.transform;

                    svg.select('#groups').attr('transform', transform);
                });
        }

        /**
         * @name getDataTableAlign
         * @return {object}
         */
        function getDataTableAlign(): DataTableAlign {
            const keys = getWidget('view.visualization.keys.Cluster');

            return semossCoreService.visualization.getDataTableAlign(keys);
        }

        /**
         * @name getGroupCategories
         * @description Creates an array of values of a given property name
         * @param {array} data Array of group data
         * @param {string} groupBy Property to map group data
         * @return {array} Array of data mapped by the given groupBy property
         */
        function getGroupCategories(data: any[], groupBy: string): any[] {
            return data.map(function (d) {
                return d[groupBy];
            });
        }

        /**
         * @name getGroups
         * @description Creates an array of cluster group objects based off a given property name
         * @param {array} data Array of data based of the selected chart options
         * @param {string} groupBy Chart option to cluster
         * @return {array} Array of cluster group objects
         */
        function getGroups(data: any[], groupBy: string): any[] {
            const groupMap = data.reduce(function (obj, d, i) {
                let group = obj[d[groupBy]];

                if (group === undefined) {
                    group = [];
                    obj[d[groupBy]] = group;
                }

                d.i = d.i !== undefined ? d.i : i;

                group.push(d);

                return obj;
            }, {});

            function createGroup(d) {
                const group = {} as Group;

                group[groupBy] = d[0];
                group.data = d[1];

                return group;
            }

            return Object.entries(groupMap).map(createGroup);
        }

        /**
         * @name getMaxGroupLength
         * @description Gets max data length from array of cluster groups
         * @param {array} groups Array of cluster groups
         * @return {number}
         */
        function getMaxGroupLength(groups: CircleGroupDatum[]): number {
            return d3.max(groups, function (group) {
                return group.data.length;
            });
        }

        /**
         * @name getMode
         * @description Gets mode for a given accessor
         * @param {string} accessor Value to filter by
         * @return {string} String of mode for a given accessor
         */
        function getMode(accessor?: string): string {
            return semossCoreService.getMode(
                scope.widgetCtrl.widgetId,
                accessor
            );
        }

        /**
         * @name getRows
         * @param {number} verticalAspectRatio Vertical aspect ratio of chart container node
         * @param {number} groupSqrt Square root of number of cluster groups
         * @return {number} Number of rows to render
         */
        function getRows(
            verticalAspectRatio: number,
            groupSqrt: number
        ): number {
            return verticalAspectRatio * groupSqrt;
        }

        /**
         * @name getSize
         * @param {Element} node
         * @return {object} Returns height and width in pixels of element.
         */
        function getSize(el: Element): Size {
            const dimensions = el.getBoundingClientRect();

            return {
                height: dimensions.height,
                width: dimensions.width,
            };
        }

        /**
         * @name getUIOptions
         * @description Returns UI options for the cluster visualization
         * @return {object} Object of UI options
         */
        function getUIOptions(): object {
            const individualTools =
                    getWidget('view.visualization.tools.individual.Cluster') ||
                    {},
                sharedTools = getWidget('view.visualization.tools.shared'),
                colorBy = getWidget('view.visualization.colorByValue'),
                uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;
            return uiOptions;
        }

        /**
         * @name getWidget
         * @description Retrieves widget data for a given accessor
         * @param {string} accessor Path to widget data
         * @return {object} Object of data for given accessor
         */
        function getWidget(accessor?: string): any {
            return semossCoreService.getWidget(
                scope.widgetCtrl.widgetId,
                accessor
            );
        }

        /**
         * @name initialize
         * @description Renders initial SVG simulation. Sets up tooltip rendering.
         * zoom.
         */
        function initialize(): void {
            console.clear();
            // DOM calculations
            size = getSize(scope.chartDiv.node());
            aspectRatio = getAspectRatio(size);

            const state = createState(getClusterData());

            // Setup DOM elements
            svg = scope.chartDiv.append('svg');
            tip = getD3Tip(state.clusterData.viewHeaders);

            // Set state
            setState(state);

            // Add application listeners
            listeners = [
                scope.widgetCtrl.on('added-data', update),
                scope.widgetCtrl.on('resize-widget', updateViz),
                scope.widgetCtrl.on('update-mode', toggleSelectedMode),
                scope.widgetCtrl.on('update-task', update),
                scope.widgetCtrl.on('update-ornaments', update),
            ];

            // Remove listeners when scope is destroyed
            scope.$on('$destroy', function () {
                listeners.forEach(function (removeListener) {
                    removeListener();
                });

                svg.node().removeEventListener('contextmenu', openContextMenu);

                tip.destroy();

                scope.chartDiv.node().innerHTML = '';
            });
            svg.node().addEventListener('contextmenu', openContextMenu);

            svg.append('g').attr('id', 'groups');

            svg.call(tip);
            svg.call(zoom);
            // svg.call(zoom.transform, transform);

            if (state.clusterData) {
                updateSVG(size);

                runGroupingSimulation(groups);
                updateCircleGroups(groups);
                updateCircles(groups);
                updateCircleListeners(groups);

                resetZoomTransform();
            } else {
                // TODO: Let user know no data exists.
            }
        }
        /**
         * @name initializeEvents
         * @description intializes events, updates callbacks
         * @param {number} eventType type of event
         * @param {object} data -- data for node clicked
         */
        function updateCircleListeners(groups: CircleGroupDatum[]) {
            let timeout: ReturnType<typeof setTimeout>;
            svg.select('#groups')
                .selectAll('g')
                .data(groups, get('i'))
                .on('click', function (d) {
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        initializeEvents('click', d.data[0]);
                    }, 500);
                })
                .on('dblclick', function (d) {
                    clearTimeout(timeout);
                    initializeEvents('dblclick', d.data[0]);
                });
        }
        /**
         * @name initializeEvents
         * @description intializes events, updates callbacks
         * @param {number} eventType type of event
         * @param {object} data -- data for node clicked
         */
        function initializeEvents(eventType: string, data: any) {
            let callbacks = scope.widgetCtrl.getEventCallbacks(),
                currentMode =
                    scope.widgetCtrl.getMode('selected') || 'default-mode',
                actionData;
            if (currentMode === 'default-mode') {
                switch (eventType) {
                    case 'click':
                        actionData = getDataForEvents(data);
                        callbacks.defaultMode.onClick(actionData);
                        break;
                    case 'dblclick':
                        actionData = getDataForEvents(data);
                        callbacks.defaultMode.onDoubleClick(actionData);
                        break;
                    default:
                        return;
                }
            }
        }

        /**
         * @name getDataForEvents
         * @desc format data for event service
         * @param {obj} data - selected data
         * @returns {obj} selected data formatted for event service
         */
        function getDataForEvents(data) {
            const labelClass = getDataTableAlign().label;
            const actionData = {
                data: {},
            };
            actionData.data[labelClass] = [data[labelClass]];
            return actionData;
        }

        /**
         * @name isCircleBrushed
         * @description Determines if element is being brushed.
         * @param {array} selection D3 event selection coordinates
         * @return {function} Return factory function to determine if current datum is inside brushed selection.
         */
        function isCircleBrushed(selection: any): (d: CircleDatum) => boolean {
            return function (d: CircleDatum) {
                return (
                    (d.actualX + style.circle.r) * transform.k + transform.x >=
                        selection[0][0] &&
                    (d.actualX - style.circle.r) * transform.k + transform.x <=
                        selection[1][0] &&
                    (d.actualY + style.circle.r) * transform.k + transform.y >=
                        selection[0][1] &&
                    (d.actualY - style.circle.r) * transform.k + transform.y <=
                        selection[1][1]
                );
            };
        }

        /**
         * @name isFiltered
         * @description Used to determime if data filter parameters have changed
         * @param {ClusterStandardState} clusterData Latest data
         * @param {ClusterStandardState} prevClusterData Current directive state data
         * @return {boolean} Checks if cluster and label are equal
         */
        function isFiltered(
            clusterData: ClusterData,
            prevClusterData: ClusterData
        ): boolean {
            return angular.equals(
                clusterData.dataTableAlign,
                prevClusterData.dataTableAlign
            );
        }

        /**
         * @name mouseout
         * @param {object} d Data of mouseout element
         * @description Hide tooltip
         */
        function mouseout(d: any): void {
            tip.hide(d);
        }

        /**
         * @name mouseover
         * @param {object} d Data of mouseover element
         * @description Display tooltip
         */
        function mouseover(d: any): void {
            if (clusterData.uiOptions.showTooltips) {
                tip.show(d);
            }
        }

        /**
         * @openContextMenu
         * @param {Event} e Event emitted from contextmenu event listener
         * @description Opens a context menu on SVG
         */
        function openContextMenu(e: Event): void {
            scope.visualizationCtrl.openContextMenu(e);
        }

        /**
         * @name removeBrush
         * @description Remove brush element and events from SVG.
         */
        function removeBrush(): void {
            svg.selectAll('.brush')
                .on('mousedown', null)
                .on('.brush', null)
                .remove();
        }

        /**
         * @name removeCircles
         * @description Currently used when filtering down circles by brushing. Removes circles that aren't part of filtered groups
         * @param {CircleGroupDatum[]} filteredGroups Selected, brushed groups
         */
        function removeCircles(filteredGroups: CircleGroupDatum[]): void {
            const circleGroups = svg
                .select('#groups')
                .selectAll('g')
                .data(filteredGroups, get('i'));

            circleGroups.each(function (group: CircleGroupDatum): void {
                const circles = d3
                    .select(this)
                    .selectAll('circle')
                    .data(group.data, get('i'));

                circles
                    .exit()
                    .on('mouseover', null)
                    .on('mouseout', null)
                    .remove();
            });

            circleGroups.exit().remove();
        }

        /**
         * @name resetZoomIdentity
         * @description Resets zoom to visualization defaults
         */
        function resetZoomTransform(): void {
            const endPositionIndex = Math.floor(columns),
                lastPointPositionIndex = endPositionIndex - 1,
                maxXPosition = calculatePosition(Math.floor(columns)),
                layoutPadding = d3.max(Object.values(style.layout.padding)),
                padding =
                    maxClusterSize > layoutPadding
                        ? maxClusterSize
                        : layoutPadding,
                visualizationWidth = maxXPosition,
                graphWidth = size.width - padding * 2,
                scale = graphWidth / visualizationWidth,
                zoomIdentity = d3.zoomIdentity
                    .translate(padding, padding)
                    .scale(scale > 1 ? 1 : scale);

            svg.call(zoom.transform, zoomIdentity);
        }

        /**
         * @name runClusterSimulation
         * @param {array} group Data of group containing circle data.
         * @description Runs a cluster simulation on the group's data.
         */
        function runClusterSimulation(group: CircleGroupDatum): void {
            const simulation = d3
                .forceSimulation(group.data)
                .force('charge', d3.forceManyBody().distanceMax(10))
                .force('collision', d3.forceCollide().radius(style.circle.r))
                .stop();

            for (let i = 0; i < 300; i += 1) {
                simulation.tick();
            }
        }

        /**
         * @name runGroupingSimulation
         * @param {array} groups Array of group data objects
         * @description Runs simulation over the array to space groups by aspect
         * ratio and user defined space settings.
         */
        function runGroupingSimulation(groups: CircleGroupDatum[]): void {
            const groupsSimulation = d3
                .forceSimulation(groups)
                .force('x', forceX)
                .force('y', forceY)
                .stop();

            for (let i = 0; i < 300; i += 1) {
                groupsSimulation.tick();
            }
        }

        /**
         * @name setFilteredGroups
         * @description Sets filtered groups state
         * @param {CircleGroupDatum[]|null} groups Array of cluster group data
         */
        function setFilteredGroups(groups: CircleGroupDatum[] | null): void {
            filteredGroups = groups;
        }

        /**
         * @name setState
         * @description Updates visualization state
         * @param {ClusterStandardState} state Object containing updated state data
         */
        function setState(state: ClusterStandardState): void {
            clusterData = state.clusterData;
            columns = state.columns;
            dataTableAlign = state.clusterData.dataTableAlign;
            forceX = state.forceX;
            forceY = state.forceY;
            groupCategories = state.groupCategories;
            groupingCategory = state.groupingCategory;
            groups = state.groups;
            groupSqrt = state.groupSqrt;
            maxClusterSize = state.maxClusterSize;
            maxGroupLength = state.maxGroupLength;
            rows = state.rows;
            spaceMultiplier = state.spaceMultiplier;
        }

        /**
         * @name toggleSelectedMode
         * @description Toggles between default and brush mode
         */
        function toggleSelectedMode(): void {
            const selectedMode = getMode('selected');
            switch (selectedMode) {
                case 'brush-mode':
                    createBrush();
                    updateCallbacks('brushMode');
                    break;
                case 'default-mode':
                    removeBrush();
                    updateCallbacks('defaultMode');
                    break;
                default:
                    break;
            }
        }

        /**
         * @name unfilter
         * @description Used for SVG click event to unfilter data back to start
         */
        function unfilter(): void {
            unfilterFrame();
            setFilteredGroups(null);
        }

        /**
         * @name unfilterFrame
         * @description Executes pixel to unfilter back to the start
         */
        function unfilterFrame(): void {
            const components: PixelCommand[] = [
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'unfilterFrame',
                        components: [],
                        terminal: true,
                    },
                ],
                panels = scope.widgetCtrl.getShared('panels');

            // refresh
            for (let i = 0, len = panels.length; i < len; i++) {
                components.push({
                    type: 'refresh',
                    components: [panels[i].widgetId],
                    terminal: true,
                });
            }

            scope.widgetCtrl.execute(components);
        }

        /**
         * @name update
         * @description If filtering data, only do a partial update by updating the visualization. Otherwise, do a full update.
         */
        function update(): void {
            const state = createState(getClusterData()),
                filtered = isFiltered(state.clusterData, clusterData);

            setState(state);
            updateD3Tip(clusterData.viewHeaders);

            if (!filtered) {
                resetZoomTransform();
            }

            if (filteredGroups) {
                removeCircles(filteredGroups);
            } else {
                runGroupingSimulation(groups);
                updateCircleGroups(groups);
                updateCircles(groups);
            }

            setFilteredGroups(null);
        }

        /**
         * @name updateCallbacks
         * @param {string} selectedMode Currently selected interaction mode from the quick menu
         * @description Returns the callbacks for the selected mode
         */
        function updateCallbacks(selectedMode: string): void {
            callbacks = getCallbacks()[selectedMode];
        }

        /**
         * @name updateCircleGroups
         * @param {array} groups Array of group data objects
         * @description Add and position group containers
         */
        function updateCircleGroups(groups: CircleGroupDatum[]): void {
            const circleGroups = svg
                .select('#groups')
                .selectAll('g')
                .data(groups, get('i'));

            circleGroups
                .enter()
                .append('g')
                .merge(circleGroups)
                .attr('transform', function (d) {
                    return `translate(${d.x}, ${d.y})`;
                });

            circleGroups.exit().remove();
        }

        /**
         * @name updateCircles
         * @param {array} groups Array of group data objects
         * @description Binds data to each group's container and add
         * circles to each group.
         */
        function updateCircles(groups: CircleGroupDatum[]): void {
            const circleGroups = svg
                .select('#groups')
                .selectAll('g')
                .data(groups, get('i'));
            circleGroups
                .enter()
                .append('g')
                .merge(circleGroups)
                .each(function (group: CircleGroupDatum): void {
                    runClusterSimulation(group);
                    addActualPositions(group);
                    addCircles(this, group);
                });

            circleGroups.exit().remove();
        }

        /**
         * @name updateD3Tip
         * @description Updates an existing D3 tip instance's tooltip text
         * @param tip D3 tooltip instance
         * @param {array} viewHeaders Array of header strings to display
         * @return D3 tooltip instance with updated tooltip html
         */
        function updateD3Tip(viewHeaders: string[]) {
            tip.html(function (d) {
                let tooltipText = '<div>';

                viewHeaders.forEach(function (header) {
                    if (d[header]) {
                        tooltipText +=
                            '    <span>' +
                            header +
                            ': ' +
                            d[header] +
                            '</span><br/>';
                    }
                });

                tooltipText += '</div>';

                return tooltipText;
            });
        }

        /**
         * @name updateGroupCategories
         * @description Creates a copy of the previous group categories and adds any and all new group categories passed in.
         * @param {string[]} newGroupCategories Previous array of group category strings
         * @return {string[]} Updated array of group category strings
         */
        function updateGroupCategories(newGroupCategories: string[]): string[] {
            const prevGroupCategories = groupCategories.slice(0);

            newGroupCategories.forEach(function (d) {
                if (prevGroupCategories.indexOf(d) === -1) {
                    prevGroupCategories.push(d);
                }
            });

            return prevGroupCategories;
        }

        /**
         * @name updateSVG
         * @param {Size} size Object containing height and width in pixels to set SVG to.
         * @description Sets SVG attributes height and width.
         */
        function updateSVG(size: Size): void {
            svg.attr('width', size.width).attr('height', size.height);
        }

        /**
         * @name updateViz
         * @description Updates SVG size
         */
        function updateViz(): void {
            size = getSize(scope.chartDiv.node());

            updateSVG(size);
        }
    }
}
