'use strict';

import angular from 'angular';
import dayjs from 'dayjs';

import './dashboard-filter.scss';

import './dashboard-filter-dimensions/dashboard-filter-dimensions.directive';

export default angular
    .module('app.dashboard-filter.directive', [
        'app.dashboard-filter.dashboard-filter-dimensions',
    ])
    .directive('dashboardFilter', dashboardFilterDirective);

dashboardFilterDirective.$inject = ['$timeout', 'semossCoreService'];

function dashboardFilterDirective(
    $timeout: ng.ITimeoutService,
    semossCoreService: SemossCoreService
) {
    dashboardFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight', '^widget'],
        controllerAs: 'dashboardFilter',
        bindToController: {},
        template: require('./dashboard-filter.directive.html'),
        controller: dashboardFilterCtrl,
        link: dashboardFilterLink,
    };

    function dashboardFilterCtrl() {
        const dashboardFilter = this;

        dashboardFilter.registerFloatFilter = registerFloatFilter;

        /**
         * @name registerFloatFilter
         * @desc register the float callbacks to the parent
         * @param {*} getFilter - get the filter from the view
         */
        function registerFloatFilter(getFilter): void {
            dashboardFilter.getFloatFilter = getFilter;
        }
    }

    function dashboardFilterLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        interface options {
            frame: string; // name of the frame that we are filtering off of
            column?: string; // name of the column that we are filtering
            type:
                | 'float'
                | 'checklist'
                | 'dropdown'
                | 'typeahead'
                | 'slider'
                | 'datepicker'
                | 'button'
                | 'multiselect'; // type of filter to render
            multiple?: boolean; // are allowing the users to select multiple options?
            applied?:
                | false
                | {
                      // special scenarios where we only apply to certain things, if false or missing, apply to all.
                      frames?: string[]; // array of frames to apply the filter
                      panels?: string[]; // array of panels to apply the filter
                  };
            auto?: boolean; // auto run the dashboard (or click),
            dynamic?: boolean; // is the filter dynamic
            optionsCache?: boolean; // cache the options?
            // specific options
            comparator?: string | string[] | undefined; // comparator the range?
            sensitivity?: undefined | number; // interval from the slder
            format?: undefined | string; // format for the slider
            rendered?: undefined | string | string[]; // use the set range values
            vertical?: boolean; // for the button
            time?: boolean; // for the date picker
        }

        const DEFAULT_OPTIONS: options = {
            frame: '',
            column: '',
            type: 'float',
            multiple: true,
            applied: false,
            auto: false,
            dynamic: false,
            optionsCache: false,
            comparator: undefined,
            sensitivity: undefined,
            format: 'YYYY-MM-DD',
            rendered: undefined,
            vertical: false,
            time: false,
        };

        let searchTimeout: ng.IPromise<void>, changeTimeout: ng.IPromise<void>;

        // all of the filter options
        scope.dashboardFilter.header = {}; // set later
        scope.dashboardFilter.options = {}; // set later
        scope.dashboardFilter.html =
            '<div class="smss-caption--center">No Filter</div>'; // html for the filter
        scope.dashboardFilter.running = false; // disable the filter while we are executing

        scope.dashboardFilter.float = {
            open: false, // track if the filter is open or close
            source: '', // frame to pull from
            text: '', // text to render in the title
            columns: {}, // columns to load into the filter,
            qs: [], // qs of the filter
        };

        scope.dashboardFilter.list = {
            search: '', // was it searched
            loading: false, // is it loading
            options: [], // options to view
            selected: [], // original selected values (checked). This can be searched or not.
            rendered: [], // rendered selected values (checked). Changed/updated model.
            renderedSelectAll: false, // what is the rendered selectAll value.
            renderedText: '', // what is the rendered text value
            offset: 0, // current location
            limit: 50, // how many more values to collect
            unrendered: 0, // count of the unrendered selected values
            total: 0, // count of the total number of options available
            canCollect: true, // flag to determine whether call should be made - infinite scroll
            delta: [], // actions performed on the values. This is the 'state'
        };

        scope.dashboardFilter.range = {
            type: 'categorical', // is it a categorical slider?
            options: [], // categorical options
            rendered: '', // rendered selected value
            comparator: '', // comparator that we will use
            operator: '', // operator that we will use
            min: undefined, // minimum value
            max: undefined, // minimum value
            sensitivity: undefined, // sensitivity
        };

        scope.dashboardFilter.changeFilter = changeFilter;
        scope.dashboardFilter.applyFilter = applyFilter;
        scope.dashboardFilter.applyFloatFilter = applyFloatFilter;
        scope.dashboardFilter.searchList = searchList;
        scope.dashboardFilter.getMoreList = getMoreList;
        scope.dashboardFilter.showPopover = showPopover;

        /** General */
        /**
         * @name resetFilter
         * @desc reset the filter to the default state
         * @return {void}
         */
        function resetFilter(): void {
            let options: options =
                scope.widgetCtrl.getWidget('view.dashboard-filter.options') ||
                {};

            // reset the executation state
            scope.dashboardFilter.executed = false;

            // merge with the defaults
            options = angular.merge({}, DEFAULT_OPTIONS, options);

            // update the options
            scope.dashboardFilter.options = options;

            if (scope.dashboardFilter.options.type === 'float') {
                initializeFloat();
                return;
            }

            // clear out
            scope.dashboardFilter.header = {};

            // check the options
            if (
                !scope.dashboardFilter.options.frame &&
                !scope.widgetCtrl.getFrame('name')
            ) {
                scope.dashboardFilter.html =
                    '<div class="smss-caption--center">No Filter</div>';
                return;
            } else if (!scope.dashboardFilter.options.frame) {
                // if no frame name passed into the dashboard filter, we will use the default frame if it exists
                scope.dashboardFilter.options.frame =
                    scope.widgetCtrl.getFrame('name');
            }

            const frame = scope.insightCtrl.getShared(
                'frames.' + scope.dashboardFilter.options.frame
            );

            if (
                typeof frame === 'undefined' ||
                !frame.hasOwnProperty('headers')
            ) {
                scope.insightCtrl.alert(
                    'error',
                    'Frame is not valid. Please select a frame to get filter values from.'
                );
                scope.dashboardFilter.html =
                    '<div class="smss-caption--center">No Filter</div>';
                return;
            }

            if (!scope.dashboardFilter.options.column) {
                scope.dashboardFilter.html =
                    '<div class="smss-caption--center">No Filter</div>';
                return;
            }

            for (
                let headerIdx = 0, headerLen = frame.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (
                    frame.headers[headerIdx].alias ===
                    scope.dashboardFilter.options.column
                ) {
                    scope.dashboardFilter.header = frame.headers[headerIdx];
                    break;
                }
            }

            if (
                !scope.dashboardFilter.header ||
                Object.keys(scope.dashboardFilter.header).length === 0
            ) {
                scope.insightCtrl.alert(
                    'error',
                    'Column is not valid. Please select a valid column to get filter values from.'
                );
                scope.dashboardFilter.html =
                    '<div class="smss-caption--center">No Filter</div>';
                return;
            }

            // reset the instances
            if (
                scope.dashboardFilter.options.type === 'checklist' ||
                scope.dashboardFilter.options.type === 'dropdown' ||
                scope.dashboardFilter.options.type === 'typeahead' ||
                scope.dashboardFilter.options.type === 'button' ||
                scope.dashboardFilter.options.type === 'multiselect'
            ) {
                resetList();
            } else if (
                scope.dashboardFilter.options.type === 'slider' ||
                scope.dashboardFilter.options.type === 'datepicker'
            ) {
                resetRange();
            }

            // generate and set the HTML for the filter
            scope.dashboardFilter.html = generateFilter();

            // set style overrides from theme
            setStyles(ele[0]);
        }

        /**
         * @name generateFilter
         * @desc generate the HTML for the filter
         * @return {void}
         */
        function generateFilter(): string {
            if (scope.dashboardFilter.options.type === 'checklist') {
                return generateChecklist();
            } else if (scope.dashboardFilter.options.type === 'dropdown') {
                return generateDropdown();
            } else if (scope.dashboardFilter.options.type === 'typeahead') {
                return generateTypeahead();
            } else if (scope.dashboardFilter.options.type === 'slider') {
                return generateSlider();
            } else if (scope.dashboardFilter.options.type === 'datepicker') {
                return generateDatepicker();
            } else if (scope.dashboardFilter.options.type === 'button') {
                return generateButton();
            } else if (scope.dashboardFilter.options.type === 'multiselect') {
                return generateMultiselect();
            } else {
                console.warn('TODO');
            }

            return '<div class="smss-caption--center">No Filter</div>';
        }

        /**
         * @name changeFilter
         * @param model - new model value
         * @param delta - delta for the change
         * @param searchTerm - search term (passed when the filter is a multiselect)
         * @desc callback for when the filter changes
         * @return {void}
         */
        function changeFilter(
            model: any,
            delta: any,
            searchTerm?: string
        ): void {
            let apply = false;

            if (
                scope.dashboardFilter.options.type === 'checklist' ||
                scope.dashboardFilter.options.type === 'dropdown' ||
                scope.dashboardFilter.options.type === 'multiselect'
            ) {
                apply = changeList(delta);
            } else if (scope.dashboardFilter.options.type === 'typeahead') {
                apply = changeTypeahead(model);
            } else if (
                scope.dashboardFilter.options.type === 'slider' ||
                scope.dashboardFilter.options.type === 'datepicker'
            ) {
                apply = changeRange();
            } else if (scope.dashboardFilter.options.type === 'button') {
                apply = changeButton(model);
            } else {
                console.error('TODO');
            }

            if (apply) {
                if (changeTimeout) {
                    $timeout.cancel(changeTimeout);
                }

                changeTimeout = $timeout(() => {
                    applyFilter(false);
                }, 300);

                // Update searchterm so the list updates correctly
                if (scope.dashboardFilter.options.type === 'multiselect') {
                    scope.dashboardFilter.list.search = searchTerm;
                }
            } else {
                updateFilter(false);
            }
        }

        /**
         * @name updateFilter
         * @desc update the state of the filter
         * @param unfilter - execute an unfilter?
         * @return {void}
         */
        function updateFilter(unfilter: boolean): void {
            let components: PixelCommand[] = [];

            if (unfilter) {
                // noop
            } else if (
                scope.dashboardFilter.options.type === 'checklist' ||
                scope.dashboardFilter.options.type === 'dropdown' ||
                scope.dashboardFilter.options.type === 'multiselect'
            ) {
                components = buildListState();
            } else if (scope.dashboardFilter.options.type === 'typeahead') {
                // noop
            } else if (
                scope.dashboardFilter.options.type === 'slider' ||
                scope.dashboardFilter.options.type === 'datepicker'
            ) {
                // noop
            } else if (scope.dashboardFilter.options.type === 'button') {
                // noop
            } else {
                console.error('TODO');
            }

            if (components.length === 0) {
                return;
            }

            const callback = function (response: PixelReturnPayload) {
                console.warn(response);

                if (unfilter) {
                    // noop
                } else if (
                    scope.dashboardFilter.options.type === 'checklist' ||
                    scope.dashboardFilter.options.type === 'dropdown' ||
                    scope.dashboardFilter.options.type === 'multiselect'
                ) {
                    // we want to keep the same position, so we recollect up to that point
                    scope.dashboardFilter.list.limit =
                        scope.dashboardFilter.list.offset < 50
                            ? 50
                            : scope.dashboardFilter.list.offset;
                    scope.dashboardFilter.list.offset = 0;

                    getList(true);
                } else if (scope.dashboardFilter.options.type === 'typeahead') {
                    // noop
                } else if (
                    scope.dashboardFilter.options.type === 'slider' ||
                    scope.dashboardFilter.options.type === 'datepicker'
                ) {
                    // noop
                } else if (scope.dashboardFilter.options.type === 'button') {
                    // noop
                } else {
                    console.error('TODO');
                }
            };

            scope.insightCtrl.execute(components, callback, []);
        }

        /**
         * @name applyFilter
         * @desc actually run the filter
         * @param unfilter - execute an unfilter?
         * @return {void}
         */
        function applyFilter(unfilter: boolean): void {
            let frames: string[] = [],
                panels: string[] = [],
                components: PixelCommand[] = [],
                refresh: string[] = [],
                widgetMapping = {},
                panelMapping = {},
                frameMapping = {};

            // all the frames by default
            const allFrames = scope.insightCtrl.getShared('frames') || {};
            for (const f in allFrames) {
                if (allFrames.hasOwnProperty(f)) {
                    frames.push(allFrames[f].name);
                }
            }

            if (scope.dashboardFilter.options.applied) {
                frames = [];
                panels = [];

                if (
                    scope.dashboardFilter.options.applied.hasOwnProperty(
                        'frames'
                    ) &&
                    Array.isArray(scope.dashboardFilter.options.applied.frames)
                ) {
                    frames = scope.dashboardFilter.options.applied.frames;
                }

                if (
                    scope.dashboardFilter.options.applied.hasOwnProperty(
                        'panels'
                    ) &&
                    Array.isArray(scope.dashboardFilter.options.applied.panels)
                ) {
                    panels = scope.dashboardFilter.options.applied.panels;
                }
            }

            // all the panels
            const allPanels = scope.insightCtrl.getShared('panels') || [];
            // get a mapping of panel to frame and frame to panel
            for (
                let panelIdx = 0, panelLen = allPanels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                const frame = semossCoreService.getWidget(
                    allPanels[panelIdx].widgetId,
                    'frame'
                );

                // save the panel to widget mapping for refresh
                widgetMapping[allPanels[panelIdx].panelId] =
                    allPanels[panelIdx].widgetId;

                // save the panel to frame mapping for later use
                panelMapping[allPanels[panelIdx].panelId] = frame;

                // create a frame to widget mapping
                if (!frameMapping.hasOwnProperty(frame)) {
                    frameMapping[frame] = [];
                }

                frameMapping[frame].push(allPanels[panelIdx].panelId);
            }

            // build the components
            for (
                let frameIdx = 0, frameLen = frames.length;
                frameIdx < frameLen;
                frameIdx++
            ) {
                // check if the frame exist
                if (!allFrames.hasOwnProperty(frames[frameIdx])) {
                    continue;
                }

                let exists = false;
                // check if the frame header is valid
                const headers = allFrames[frames[frameIdx]].headers || [];
                for (
                    let headerIdx = 0, headerLen = headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    if (
                        headers[headerIdx].alias ===
                        scope.dashboardFilter.header.alias
                    ) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    continue;
                }

                let filterComponent: PixelCommand[] = [];
                if (unfilter) {
                    filterComponent = buildUnfilterExecution(
                        frames[frameIdx],
                        true
                    );
                } else if (
                    scope.dashboardFilter.options.type === 'checklist' ||
                    scope.dashboardFilter.options.type === 'dropdown' ||
                    scope.dashboardFilter.options.type === 'multiselect'
                ) {
                    filterComponent = buildListExecution(
                        frames[frameIdx],
                        true
                    );
                } else if (scope.dashboardFilter.options.type === 'typeahead') {
                    filterComponent = buildTypeaheadExecution(
                        frames[frameIdx],
                        true
                    );
                } else if (
                    scope.dashboardFilter.options.type === 'slider' ||
                    scope.dashboardFilter.options.type === 'datepicker'
                ) {
                    filterComponent = buildRangeExecution(
                        frames[frameIdx],
                        true
                    );
                } else if (scope.dashboardFilter.options.type === 'button') {
                    filterComponent = buildButtonExecution(
                        frames[frameIdx],
                        true
                    );
                } else {
                    console.error('TODO');
                }

                if (filterComponent.length > 0) {
                    components = components.concat(filterComponent);

                    // add the refresh
                    refresh = refresh.concat(frameMapping[frames[frameIdx]]);
                }
            }

            for (
                let panelIdx = 0, panelLen = panels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                // check if the panel exists and the frame exists
                if (!panelMapping.hasOwnProperty(panels[panelIdx])) {
                    continue;
                }

                let exists = false;
                // check if the frame header is valid
                const headers =
                    allFrames[panelMapping[panels[panelIdx]]].headers || [];
                for (
                    let headerIdx = 0, headerLen = headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    if (
                        headers[headerIdx].alias ===
                        scope.dashboardFilter.header.alias
                    ) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    continue;
                }

                let filterComponent: PixelCommand[] = [];
                if (unfilter) {
                    filterComponent = buildUnfilterExecution(
                        panels[panelIdx],
                        false
                    );
                } else if (
                    scope.dashboardFilter.options.type === 'checklist' ||
                    scope.dashboardFilter.options.type === 'dropdown' ||
                    scope.dashboardFilter.options.type === 'multiselect'
                ) {
                    filterComponent = buildListExecution(
                        panels[panelIdx],
                        false
                    );
                } else if (scope.dashboardFilter.options.type === 'typeahead') {
                    filterComponent = buildTypeaheadExecution(
                        panels[panelIdx],
                        false
                    );
                } else if (
                    scope.dashboardFilter.options.type === 'slider' ||
                    scope.dashboardFilter.options.type === 'datepicker'
                ) {
                    filterComponent = buildRangeExecution(
                        panels[panelIdx],
                        false
                    );
                } else if (scope.dashboardFilter.options.type === 'button') {
                    filterComponent = buildButtonExecution(
                        panels[panelIdx],
                        false
                    );
                } else {
                    console.error('TODO');
                }

                if (filterComponent.length > 0) {
                    components = components.concat(filterComponent);

                    // add the refresh if it is not there
                    if (refresh.indexOf(panels[panelIdx]) === -1) {
                        refresh.push(panels[panelIdx]);
                    }
                }
            }

            if (components.length > 0) {
                // we will disble everything while it is running so you can't click more
                scope.dashboardFilter.running = true;

                // this is used to show that a new filter has been executed
                scope.dashboardFilter.executed = false;

                // add the refresh
                for (
                    let refreshIdx = 0, refreshLen = refresh.length;
                    refreshIdx < refreshLen;
                    refreshIdx++
                ) {
                    components.push({
                        type: 'refresh',
                        components: [widgetMapping[refresh[refreshIdx]]],
                        terminal: true,
                    });
                }

                const callback = function () {
                    // done running, regardless of success or failure
                    scope.dashboardFilter.running = false;

                    // this is used to show that a new filter has been executed
                    scope.dashboardFilter.executed = true;
                };

                scope.insightCtrl.execute(components, callback);
            }
        }

        /** Float */
        /**
         * @name initializeFloat
         * @desc build the pixel for the unfilter
         */
        function initializeFloat(): void {
            // get the frame
            const frame = scope.insightCtrl.getShared(
                'frames.' + scope.dashboardFilter.options.frame
            );

            // set the source
            scope.dashboardFilter.float.source = frame.name;
            scope.dashboardFilter.float.columns = {};

            // set the headers
            const headers = frame.headers;
            for (let hIdx = 0, hLen = headers.length; hIdx < hLen; hIdx++) {
                const h = headers[hIdx];

                // create the concept (since it is a frame aliases are unique)
                const concept = `${scope.dashboardFilter.float.source}__${h.alias}`;

                scope.dashboardFilter.float.columns[concept] = {
                    alias: h.alias,
                    concept: concept,
                    selector: h.alias,
                    type: h.dataType,
                    table: h.alias,
                    column: 'PRIM_KEY_PLACEHOLDER',
                };
            }

            // clear the qs
            scope.dashboardFilter.float.qs = [];

            // disable the button
            scope.dashboardFilter.running = true;

            // register function to come back
            const callback = function (response: PixelReturnPayload) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    // set the filter filter
                    scope.dashboardFilter.float.qs =
                        output.explicitFilters || [];

                    // not running
                    scope.dashboardFilter.running = false;
                }
            };

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'variable',
                    components: [frame.name],
                },
                {
                    type: 'getFrameFiltersQS',
                    components: [],
                    terminal: true,
                },
            ];

            // execute a meta query
            scope.widgetCtrl.meta(components, callback);

            // generate and set the HTML for the filter
            scope.dashboardFilter.html = `
                <div class="dashboard-filter__float__toggle" smss-popover>
                    <div
                        class="dashboard-filter__float__toggle__text"
                        title="{{dashboardFilter.list.renderedText}}"
                    >
                        Filter
                    </div>
                    <i class="dashboard-filter__float__toggle__icon"></i>

                    <smss-popover-content
                        class="dashboard-filter__float__popover"
                        position="['SW', 'SE', 'NW','NE']"
                        model="dashboardFilter.float.open"
                        width="auto"
                        show="dashboardFilter.showPopover(contentEle)"
                    >
                        <query-struct-filter
                            ng-if="dashboardFilter.float.open"
                            type="'frame'"
                            source="dashboardFilter.float.source"
                            columns="dashboardFilter.float.columns"
                            filter="dashboardFilter.float.qs"
                            meta="insightCtrl.meta"
                            register="dashboardFilter.registerFloatFilter(getFilter)"
                        >
                            <smss-btn ng-click="dashboardFilter.applyFloatFilter()" ng-disabled="dashboardFilter.running"> Apply </smss-btn>
                        </query-struct-filter>
                    </smss-popover-content>
                </div>
            
            `;

            // set style overrides from theme
            setStyles(ele[0]);
        }

        /**
         * @name applyFloatFilter
         * @desc takes current filter options and sends them to sheet to update visualization data
         */
        function applyFloatFilter(): void {
            const qsFilters = scope.dashboardFilter.getFloatFilter();

            // start as running
            scope.dashboardFilter.running = true;

            // build the components
            const components: PixelCommand[] = [];

            components.push(
                {
                    type: 'variable',
                    components: [scope.dashboardFilter.float.source],
                },
                {
                    type: 'unfilterFrame',
                    components: [],
                    terminal: true,
                }
            );

            if (qsFilters.length > 0) {
                components.push(
                    {
                        type: 'variable',
                        components: [scope.dashboardFilter.float.source],
                    },
                    {
                        type: 'setFrameFilter2',
                        components: [qsFilters],
                        terminal: true,
                    }
                );
            }

            const callback = function () {
                // done running, regardless of success or failure
                scope.dashboardFilter.running = false;

                // close it
                scope.dashboardFilter.float.open = false;
            };

            scope.insightCtrl.execute(components, callback);
        }

        /** Unfilter */
        /**
         * @name buildUnfilterExecution
         * @desc build the pixel for the unfilter
         * @param name - name to filter
         * @param
         */
        function buildUnfilterExecution(
            name: string,
            frame: boolean
        ): PixelCommand[] {
            const components: PixelCommand[] = [];

            const start = frame ? name : `Panel(${name})`;

            components.push(
                {
                    type: 'Pixel',
                    components: [start],
                },
                {
                    type: frame ? 'unfilterFrame' : 'unfilterPanel',
                    components: [scope.dashboardFilter.header.alias],
                    terminal: true,
                }
            );

            return components;
        }

        /** List */
        /**
         * @name resetList
         * @desc reset instances for the filter
         * @return {void}
         */
        function resetList(): void {
            // clear out delta
            scope.dashboardFilter.list.delta = [];

            // we want to keep the same position, so we recollect up to that point
            scope.dashboardFilter.list.limit =
                scope.dashboardFilter.list.offset < 50
                    ? 50
                    : scope.dashboardFilter.list.offset;
            scope.dashboardFilter.list.offset = 0;

            // if it is button get everyting
            if (scope.dashboardFilter.options.type === 'button') {
                scope.dashboardFilter.list.limit = -1;
            }

            getList(true);
        }

        /**
         * @name getList
         * @desc get instances for the filter
         * @param reset - reset the list?
         * @return {void}
         */
        function getList(reset: boolean): void {
            // get the data based on the options

            // is it loading?
            if (scope.dashboardFilter.list.loading) {
                return;
            }

            // we will disble everything while it is running so you can't click more
            scope.dashboardFilter.running = true;

            scope.dashboardFilter.list.loading = true;

            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                // done running, regardless of success or failure
                scope.dashboardFilter.running = false;

                scope.dashboardFilter.list.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // set options and selected
                if (reset) {
                    scope.dashboardFilter.list.options = output.options;
                    if (
                        scope.dashboardFilter.options.type === 'multiselect' &&
                        scope.dashboardFilter.list.search.length
                    ) {
                        // Merge the previously selected values when the list is being searched
                        let values = scope.dashboardFilter.list.selected.concat(
                            output.selectedValues
                        );
                        // Remove duplicates
                        values = values.filter((item, index) => {
                            return values.indexOf(item) === index;
                        });
                        scope.dashboardFilter.list.selected = values;
                    } else {
                        scope.dashboardFilter.list.selected =
                            output.selectedValues;
                    }
                } else {
                    scope.dashboardFilter.list.options =
                        scope.dashboardFilter.list.options.concat(
                            output.options
                        );
                    scope.dashboardFilter.list.selected =
                        scope.dashboardFilter.list.selected.concat(
                            output.selectedValues
                        );
                }

                // see if you have all of the selected
                scope.dashboardFilter.list.limit = 50; // set the limit to 50;
                scope.dashboardFilter.list.offset =
                    output.limit + output.offset; // this is the new offset
                scope.dashboardFilter.list.total = output.totalCount;
                scope.dashboardFilter.list.unrendered =
                    output.selectedCount -
                    scope.dashboardFilter.list.selected.length;

                // can you collect more
                scope.dashboardFilter.list.canCollect =
                    output.limit === output.options.length;

                renderList();
            };

            scope.insightCtrl.meta(
                [
                    {
                        type: 'variable',
                        components: [scope.dashboardFilter.options.frame],
                        meta: true,
                    },
                    {
                        type: 'filterModelState',
                        components: [
                            scope.dashboardFilter.options.frame,
                            scope.widgetCtrl.panelId,
                            scope.dashboardFilter.header.alias,
                            scope.dashboardFilter.list.search,
                            scope.dashboardFilter.list.limit,
                            scope.dashboardFilter.list.offset,
                            scope.dashboardFilter.options.dynamic,
                            scope.dashboardFilter.options.optionsCache,
                        ],
                        terminal: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name changeList
         * @desc the list has changed, update the values
         * @return boolean if the filter should be applied
         */
        function changeList(delta: {
            type: 'all' | 'none' | 'add' | 'remove' | 'replace';
            value: string[] | string;
        }): boolean {
            if (delta.type === 'replace') {
                scope.dashboardFilter.list.delta = [
                    {
                        type: 'replace',
                        search: scope.dashboardFilter.list.search,
                        added: [],
                        removed: [],
                        replaced: [delta.value],
                    },
                ];
            } else {
                let stateIdx = -1; // the state that we are adding/removing from

                // find the old state
                for (
                    let deltaIdx = scope.dashboardFilter.list.delta.length - 1;
                    deltaIdx >= 0;
                    deltaIdx--
                ) {
                    if (
                        scope.dashboardFilter.list.delta[deltaIdx].search ===
                        scope.dashboardFilter.list.search
                    ) {
                        stateIdx = deltaIdx;
                        break;
                    } else {
                        break; // state has to be the same
                    }
                }

                if (stateIdx === -1) {
                    scope.dashboardFilter.list.delta.push({
                        type: 'ignore',
                        search: scope.dashboardFilter.list.search,
                        added: [],
                        removed: [],
                        replaced: undefined,
                    });

                    stateIdx = scope.dashboardFilter.list.delta.length - 1;
                }

                if (delta.type === 'all') {
                    // update the new state
                    scope.dashboardFilter.list.delta[stateIdx].type = 'all';
                    scope.dashboardFilter.list.delta[stateIdx].added = [];
                    scope.dashboardFilter.list.delta[stateIdx].removed = [];
                    scope.dashboardFilter.list.delta[stateIdx].replaced =
                        undefined;
                } else if (delta.type === 'none') {
                    // update the new state
                    scope.dashboardFilter.list.delta[stateIdx].type = 'none';
                    scope.dashboardFilter.list.delta[stateIdx].added = [];
                    scope.dashboardFilter.list.delta[stateIdx].removed = [];
                    scope.dashboardFilter.list.delta[stateIdx].replaced =
                        undefined;
                } else if (delta.type === 'add') {
                    // has it previously been removed? If so, remove it from that array
                    const removedIdx = scope.dashboardFilter.list.delta[
                        stateIdx
                    ].removed.indexOf(delta.value);
                    if (removedIdx > -1) {
                        scope.dashboardFilter.list.delta[
                            stateIdx
                        ].removed.splice(removedIdx, 1);
                    }

                    // check if it hasn't been already added. If it hasn't, add it to the added
                    const addedIdx = scope.dashboardFilter.list.delta[
                        stateIdx
                    ].removed.indexOf(delta.value);
                    if (addedIdx === -1) {
                        scope.dashboardFilter.list.delta[stateIdx].added.push(
                            delta.value
                        );
                    }

                    scope.dashboardFilter.list.delta[stateIdx].replaced =
                        undefined;
                } else if (delta.type === 'remove') {
                    // has it previously been added? If so, added it from that array
                    const addedIdx = scope.dashboardFilter.list.delta[
                        stateIdx
                    ].added.indexOf(delta.value);
                    if (addedIdx > -1) {
                        scope.dashboardFilter.list.delta[stateIdx].added.splice(
                            addedIdx,
                            1
                        );
                    }

                    // check if it hasn't been already removed. If it hasn't, add it to the removed
                    const removedIdx = scope.dashboardFilter.list.delta[
                        stateIdx
                    ].removed.indexOf(delta.value);
                    if (removedIdx === -1) {
                        scope.dashboardFilter.list.delta[stateIdx].removed.push(
                            delta.value
                        );
                    }

                    scope.dashboardFilter.list.delta[stateIdx].replaced =
                        undefined;
                }
            }

            if (scope.dashboardFilter.options.auto) {
                return true;
            }

            renderList();

            return false;
        }

        /**
         * @name renderList
         * @desc render instances for the filter based on the delta
         * @return {void}
         */
        function renderList(): void {
            // render the state
            scope.dashboardFilter.list.rendered = JSON.parse(
                JSON.stringify(scope.dashboardFilter.list.selected)
            );

            // check the select all
            // select all is based on unsearched values
            // math is simple.
            // rendered + unrendered selected === total
            scope.dashboardFilter.list.renderedSelectAll =
                scope.dashboardFilter.list.rendered.length +
                    scope.dashboardFilter.list.unrendered ===
                scope.dashboardFilter.list.total;

            if (
                scope.dashboardFilter.options.displayValue &&
                scope.dashboardFilter.options.displayValue.length
            ) {
                let text = scope.dashboardFilter.options.displayValue.replace(
                    /<SelectedColumn>/g,
                    scope.dashboardFilter.options.column.replace(/_/g, ' ')
                );
                text = text.replace(
                    /<SelectedValues>/g,
                    scope.dashboardFilter.list.rendered.join(', ')
                );
                scope.dashboardFilter.list.renderedText = text;
            }
        }

        /**
         * @name searchList
         * @desc search instances based on the search term
         * @param search - search termlist
         */
        function searchList(search: string): void {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }
            searchTimeout = $timeout(() => {
                // is it loading?
                if (scope.dashboardFilter.list.loading) {
                    return;
                }

                //update the options
                scope.dashboardFilter.list.search = search || '';
                scope.dashboardFilter.list.offset = 0;
                scope.dashboardFilter.list.limit = 50;
                scope.dashboardFilter.list.canCollect = true;

                getList(true);

                $timeout.cancel(searchTimeout);
            }, 500);
        }

        /**
         * @name getMoreList
         * @desc get the next set of instances
         */
        function getMoreList(): void {
            // is it loading? can you collect more?
            if (
                scope.dashboardFilter.list.loading ||
                !scope.dashboardFilter.list.canCollect
            ) {
                return;
            }

            getList(false);
        }

        /**
         * @name buildListExecution
         * @desc build the pixel for the list
         * @param name - name to filter
         * @param frame - is it a frame filter?
         */
        function buildListExecution(
            name: string,
            frame: boolean
        ): PixelCommand[] {
            const components: PixelCommand[] = [];

            const start = frame ? name : `Panel(${name})`;

            for (
                let deltaIdx = 0,
                    deltaLen = scope.dashboardFilter.list.delta.length;
                deltaIdx < deltaLen;
                deltaIdx++
            ) {
                const delta = scope.dashboardFilter.list.delta[deltaIdx];

                if (delta.type === 'replace') {
                    components.push(
                        {
                            type: 'Pixel',
                            components: [start],
                        },
                        {
                            type: frame ? 'setFrameFilter' : 'setPanelFilter',
                            components: [
                                [
                                    {
                                        type: 'value',
                                        alias: scope.dashboardFilter.header
                                            .alias,
                                        comparator: '==',
                                        values: delta.replaced,
                                    },
                                ],
                            ],
                            terminal: true,
                        }
                    );
                } else {
                    if (delta.type === 'all') {
                        components.push(
                            {
                                type: 'Pixel',
                                components: [start],
                            },
                            {
                                type: frame
                                    ? 'addFrameFilter'
                                    : 'addPanelFilter',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '?like',
                                            values: delta.search,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    } else if (delta.type === 'none') {
                        components.push(
                            {
                                type: 'Pixel',
                                components: [start],
                            },
                            {
                                type: frame
                                    ? 'addFrameFilter'
                                    : 'addPanelFilter',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '?nlike',
                                            values: delta.search,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }

                    if (delta.removed.length > 0) {
                        components.push(
                            {
                                type: 'Pixel',
                                components: [start],
                            },
                            {
                                type: frame
                                    ? 'addFrameFilter'
                                    : 'addPanelFilter',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '!=',
                                            values: delta.removed,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }

                    if (delta.added.length > 0) {
                        components.push(
                            {
                                type: 'Pixel',
                                components: [start],
                            },
                            {
                                type: frame
                                    ? 'addFrameFilter'
                                    : 'addPanelFilter',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '==',
                                            values: delta.added,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }
                }
            }

            return components;
        }

        /**
         * @name buildListState
         * @desc build the pixel for the list
         * @param name - name to filter
         * @param frame - is it a frame filter?
         */
        function buildListState(): PixelCommand[] {
            const components: PixelCommand[] = [];

            for (
                let deltaIdx = 0,
                    deltaLen = scope.dashboardFilter.list.delta.length;
                deltaIdx < deltaLen;
                deltaIdx++
            ) {
                const delta = scope.dashboardFilter.list.delta[deltaIdx];

                if (delta.type === 'replace') {
                    components.push(
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                        },
                        {
                            type: 'setFilterModelState',
                            components: [
                                scope.widgetCtrl.panelId,
                                [
                                    {
                                        type: 'value',
                                        alias: scope.dashboardFilter.header
                                            .alias,
                                        comparator: '==',
                                        values: delta.replaced,
                                    },
                                ],
                            ],
                            terminal: true,
                        }
                    );
                } else {
                    if (delta.type === 'all') {
                        components.push(
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'addFilterModelState',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '?like',
                                            values: delta.search,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    } else if (delta.type === 'none') {
                        components.push(
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'addFilterModelState',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '?nlike',
                                            values: delta.search,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }

                    if (delta.removed.length > 0) {
                        components.push(
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'addFilterModelState',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '!=',
                                            values: delta.removed,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }

                    if (delta.added.length > 0) {
                        components.push(
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'addFilterModelState',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: scope.dashboardFilter.header
                                                .alias,
                                            comparator: '==',
                                            values: delta.added,
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }
                }
            }

            return components;
        }

        /** Range */
        /**
         * @name resetRange
         * @desc reset the range for the filter
         * @return {void}
         */
        function resetRange(): void {
            const components: PixelCommand[] = [];

            // this is not merged b/c I feel like it is easier to read

            // check the type based on dataType
            if (scope.dashboardFilter.header.dataType === 'DATE') {
                scope.dashboardFilter.range.type = 'date';
            } else if (scope.dashboardFilter.header.dataType === 'TIMESTAMP') {
                scope.dashboardFilter.range.type = 'date';
                scope.dashboardFilter.options.time = true;
                scope.dashboardFilter.options.format = 'YYYY-MM-DD hh:mm:ss a';
            } else if (scope.dashboardFilter.header.dataType === 'NUMBER') {
                scope.dashboardFilter.range.type = 'numerical';
            } else {
                scope.dashboardFilter.range.type = 'categorical';
            }

            // validate the comparator
            if (scope.dashboardFilter.range.type === 'categorical') {
                if (
                    scope.dashboardFilter.options.comparator === '==' ||
                    scope.dashboardFilter.options.comparator === '!='
                ) {
                    scope.dashboardFilter.range.comparator =
                        scope.dashboardFilter.options.comparator;
                } else {
                    scope.dashboardFilter.range.comparator = '==';
                }

                scope.dashboardFilter.range.operator = '';
            } else {
                if (scope.dashboardFilter.options.multiple) {
                    if (
                        Array.isArray(
                            scope.dashboardFilter.options.comparator
                        ) &&
                        scope.dashboardFilter.options.comparator.length === 2 &&
                        // validate all of the pairs
                        ((['>', '>='].indexOf(
                            scope.dashboardFilter.options.comparator[0]
                        ) > -1 &&
                            ['<', '<='].indexOf(
                                scope.dashboardFilter.options.comparator[1]
                            ) > -1) ||
                            (['<', '<='].indexOf(
                                scope.dashboardFilter.options.comparator[0]
                            ) > -1 &&
                                ['>', '>='].indexOf(
                                    scope.dashboardFilter.options.comparator[1]
                                ) > -1))
                    ) {
                        scope.dashboardFilter.range.comparator =
                            scope.dashboardFilter.options.comparator;
                    } else {
                        scope.dashboardFilter.range.comparator = ['>=', '<='];
                    }

                    // set the operator
                    if (
                        ['>', '>='].indexOf(
                            scope.dashboardFilter.range.comparator[0]
                        ) > -1 &&
                        ['<', '<='].indexOf(
                            scope.dashboardFilter.range.comparator[1]
                        ) > -1
                    ) {
                        scope.dashboardFilter.range.operator = 'AND';
                    } else {
                        scope.dashboardFilter.range.operator = 'OR';
                    }
                } else {
                    if (
                        ['>', '>=', '<', '<=', '==', '!='].indexOf(
                            scope.dashboardFilter.options.comparator
                        ) > -1
                    ) {
                        scope.dashboardFilter.range.comparator =
                            scope.dashboardFilter.options.comparator;
                    } else {
                        scope.dashboardFilter.range.comparator = '>=';
                    }

                    scope.dashboardFilter.range.operator = '';
                }
            }

            // build the pixel
            if (scope.dashboardFilter.range.type === 'categorical') {
                components.push(
                    {
                        type: 'variable',
                        components: [scope.dashboardFilter.options.frame],
                        meta: true,
                    },
                    {
                        type: 'getFrameFilterState',
                        components: [
                            scope.dashboardFilter.header.alias,
                            '',
                            -1,
                            0,
                            scope.dashboardFilter.options.dynamic,
                            scope.dashboardFilter.options.optionsCache,
                            scope.dashboardFilter.options.applied.hasOwnProperty(
                                'panels'
                            ) &&
                            Array.isArray(
                                scope.dashboardFilter.options.applied.panels
                            )
                                ? scope.dashboardFilter.options.applied.panels
                                : undefined,
                        ],
                        terminal: true,
                    }
                );
            } else {
                components.push(
                    {
                        type: 'variable',
                        components: [scope.dashboardFilter.options.frame],
                        meta: true,
                    },
                    {
                        type: 'getFrameFilterRange',
                        components: [
                            scope.dashboardFilter.header.alias,
                            scope.dashboardFilter.options.dynamic,
                            scope.dashboardFilter.options.optionsCache,
                            scope.dashboardFilter.options.applied.hasOwnProperty(
                                'panels'
                            ) &&
                            Array.isArray(
                                scope.dashboardFilter.options.applied.panels
                            )
                                ? scope.dashboardFilter.options.applied.panels
                                : undefined,
                        ],
                        terminal: true,
                    }
                );
            }

            if (components.length === 0) {
                return;
            }

            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (scope.dashboardFilter.range.type === 'categorical') {
                    scope.dashboardFilter.range.options = output.options;

                    if (scope.dashboardFilter.options.multiple) {
                        scope.dashboardFilter.range.rendered =
                            output.selectedValues || [];
                    } else {
                        scope.dashboardFilter.range.rendered =
                            output.selectedValues[0] || '';
                    }
                } else {
                    scope.dashboardFilter.range.min = output.minMax.absMin;
                    scope.dashboardFilter.range.max = output.minMax.absMax;
                    if (
                        typeof scope.dashboardFilter.options.rendered !==
                            'undefined' &&
                        typeof scope.dashboardFilter.options.rendered !==
                            undefined
                    ) {
                        scope.dashboardFilter.range.rendered =
                            scope.dashboardFilter.options.rendered;
                    } else if (scope.dashboardFilter.options.multiple) {
                        scope.dashboardFilter.range.rendered = [
                            output.minMax.min,
                            output.minMax.max,
                        ];
                    } else if (
                        scope.dashboardFilter.range.comparator === '<' ||
                        scope.dashboardFilter.range.comparator === '<='
                    ) {
                        // only use the max if it is greater than
                        scope.dashboardFilter.range.rendered = [
                            output.minMax.max,
                        ];
                    } else {
                        scope.dashboardFilter.range.rendered = [
                            output.minMax.min,
                        ];
                    }
                }
            };

            scope.insightCtrl.meta(components, callback, []);
        }

        /**
         * @name changeRange
         * @desc range has changed, update the value
         * @return boolean if the filter should be applied
         */
        function changeRange(): boolean {
            // noop
            if (scope.dashboardFilter.options.auto) {
                return true;
            }

            return false;
        }

        /**
         * @name buildRangeExecution
         * @desc build the pixel for a range
         * @param name - name to filter
         * @param
         */
        function buildRangeExecution(
            name: string,
            frame: boolean
        ): PixelCommand[] {
            const components: PixelCommand[] = [];

            const start = frame ? name : `Panel(${name})`;

            if (scope.dashboardFilter.range.type === 'categorical') {
                components.push(
                    {
                        type: 'Pixel',
                        components: [start],
                    },
                    {
                        type: frame ? 'setFrameFilter' : 'setPanelFilter',
                        components: [
                            [
                                {
                                    type: 'value',
                                    alias: scope.dashboardFilter.header.alias,
                                    comparator:
                                        scope.dashboardFilter.range.comparator,
                                    values: scope.dashboardFilter.range
                                        .rendered,
                                },
                            ],
                        ],
                        terminal: true,
                    }
                );
            } else if (scope.dashboardFilter.options.multiple) {
                let cleanStartValue, cleanEndValue;
                
                if (scope.dashboardFilter.range.rendered[0]) {
                    const startValue = scope.dashboardFilter.range.rendered[0];
                    if(scope.dashboardFilter.range.type === 'date') {
                        const parsedStartDate = dayjs(startValue);
                        cleanStartValue = dayjs(parsedStartDate).format(
                            'YYYY-MM-DD HH:mm:ss'
                        );
                    } else {
                        cleanStartValue = startValue
                    }
                }

                if (scope.dashboardFilter.range.rendered[1]) {
                    const endValue = scope.dashboardFilter.range.rendered[1];
                    if(scope.dashboardFilter.range.type === 'date') {
                        const parsedEndDate = dayjs(endValue);
                        cleanEndValue = dayjs(parsedEndDate).format(
                            'YYYY-MM-DD HH:mm:ss'
                            );
                        } else {
                        cleanEndValue = endValue
                    }
                }

                components.push(
                    {
                        type: 'Pixel',
                        components: [start],
                    },
                    {
                        type: frame ? 'setFrameFilter' : 'setPanelFilter',
                        components: [
                            [
                                {
                                    type: 'value',
                                    alias: scope.dashboardFilter.header.alias,
                                    comparator:
                                        scope.dashboardFilter.range
                                            .comparator[0],
                                    values: cleanStartValue,
                                    operator:
                                        scope.dashboardFilter.range.operator,
                                },
                                {
                                    type: 'value',
                                    alias: scope.dashboardFilter.header.alias,
                                    comparator:
                                        scope.dashboardFilter.range
                                            .comparator[1],
                                    values: cleanEndValue,
                                },
                            ],
                        ],
                        terminal: true,
                    }
                );
            } else {
                // singe date value for datepicker filter
                const dateValue = scope.dashboardFilter.range.rendered[0];

                const parsedDate = dayjs(dateValue);
                const cleanDateValue = dayjs(parsedDate).format(
                    'YYYY-MM-DD HH:mm:ss'
                );

                components.push(
                    {
                        type: 'Pixel',
                        components: [start],
                    },
                    {
                        type: frame ? 'setFrameFilter' : 'setPanelFilter',
                        components: [
                            [
                                {
                                    type: 'value',
                                    alias: scope.dashboardFilter.header.alias,
                                    comparator:
                                        scope.dashboardFilter.range.comparator,
                                    values: cleanDateValue,
                                },
                            ],
                        ],
                        terminal: true,
                    }
                );
            }

            // this is helpful so the slider does not keep shifting
            let options: options =
                scope.widgetCtrl.getWidget('view.dashboard-filter.options') ||
                {};
            options = angular.merge({}, options, {
                rendered: scope.dashboardFilter.range.rendered,
            });

            components.push(
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                    meta: true,
                },
                {
                    type: 'setPanelView',
                    components: ['dashboard-filter', options],
                    terminal: true,
                }
            );

            return components;
        }

        /** Checklist */
        /**
         * @name generateChecklist
         * @desc generate the HTML for a checklist filter
         * @return {void}
         */
        function generateChecklist(): string {
            return `
            <div class="dashboard-filter__checklist__holder">
                <smss-btn class="smss-btn--icon" title="Unfilter" ng-click="dashboardFilter.applyFilter(true); dashboardFilter.list.search = '';" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
            </div>
            <smss-checklist 
                class="dashboard-filter__checklist__list"
                model="dashboardFilter.list.rendered"
                search-term="dashboardFilter.list.search"
                options="dashboardFilter.list.options"
                loading="dashboardFilter.list.loading"
                search="dashboardFilter.searchList(search)"
                scroll="dashboardFilter.getMoreList();"
                change="dashboardFilter.changeFilter(model, delta)"
                ${scope.dashboardFilter.options.searchable ? 'searchable' : ''}
                ${scope.dashboardFilter.options.multiple ? 'multiple' : ''}
                ${scope.dashboardFilter.options.multiple ? 'quickselect' : ''}
                ${
                    scope.dashboardFilter.options.multiple
                        ? 'select-all="dashboardFilter.list.renderedSelectAll"'
                        : ''
                }
                ng-disabled="dashboardFilter.running">
            </smss-checklist>
            ${
                scope.dashboardFilter.options.auto
                    ? ''
                    : `
            <div class="smss-action">
                <smss-btn class="dashboard-filter__apply" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" title="Apply Filter" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">Apply</smss-btn>
            </div>`
            }
           `;
        }

        /** Multiselect */
        /**
         * @name generateMultiselect
         * @desc generate HTML for a multiselect component
         */
        function generateMultiselect(): string {
            return `
            <div class="dashboard-filter__container">
                <smss-btn class="smss-btn--right smss-btn--icon" title="Unfilter" ng-click="dashboardFilter.applyFilter(true)" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
                <div class="dashboard-filter__container__content">
                    <smss-multiselect 
                        model="dashboardFilter.list.rendered"
                        options="dashboardFilter.list.options"
                        loading="dashboardFilter.list.loading"
                        search="dashboardFilter.searchList(search)"
                        scroll="dashboardFilter.getMoreList();"
                        change="dashboardFilter.changeFilter(model, delta, searchTerm);"
                        quickselect
                        nowrap
                        ng-disabled="dashboardFilter.running"
                        show="dashboardFilter.showPopover(contentEle)">
                    </smss-multiselect>
                </div>
                ${
                    scope.dashboardFilter.options.auto
                        ? ''
                        : `
                <smss-btn class="smss-btn--left dashboard-filter__apply" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" title="Apply Filter" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">
                    Apply
                </smss-btn>
                `
                }
            </div>
            `;
        }

        /** Dropdown */
        /**
         * @name generateDropdown
         * @desc generate the HTML for a dropdown filter
         * @return {void}
         */
        function generateDropdown(): string {
            return `
            <div class="dashboard-filter__container">
                <smss-btn class="smss-btn--right smss-btn--icon" title="Unfilter" ng-click="dashboardFilter.applyFilter(true); dashboardFilter.list.search = '';" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
                <div class="dashboard-filter__container__content">
                    <div class="dashboard-filter__dropdown__toggle"
                        smss-popover>
                        <div class="dashboard-filter__dropdown__toggle__text" title="{{dashboardFilter.list.renderedText}}">
                            {{dashboardFilter.list.renderedText}}
                        </div>
                        <i class="dashboard-filter__dropdown__toggle__icon"></i>

                        <smss-popover-content class="dashboard-filter__dropdown__list"
                            position="['SW', 'SE', 'NW','NE']"
                            closeable="false"
                            width="auto"
                            show="dashboardFilter.showPopover(contentEle)">
                            <smss-checklist 
                                model="dashboardFilter.list.rendered"
                                options="dashboardFilter.list.options"
                                loading="dashboardFilter.list.loading"
                                search="dashboardFilter.searchList(search)"
                                scroll="dashboardFilter.getMoreList();"
                                change="dashboardFilter.changeFilter(model, delta)"
                                search-term="dashboardFilter.list.search"
                                ${
                                    scope.dashboardFilter.options.searchable
                                        ? 'searchable'
                                        : ''
                                }
                                ${
                                    scope.dashboardFilter.options.multiple
                                        ? 'multiple'
                                        : ''
                                }
                                ${
                                    scope.dashboardFilter.options.multiple
                                        ? 'quickselect'
                                        : ''
                                }
                                ${
                                    scope.dashboardFilter.options.multiple
                                        ? 'select-all="dashboardFilter.list.renderedSelectAll"'
                                        : ''
                                }
                                ng-disabled="dashboardFilter.running">
                            </smss-checklist>
                        </smss-popover-content>
                    </div>
                </div>
                ${
                    scope.dashboardFilter.options.auto
                        ? ''
                        : `
                <smss-btn class="smss-btn--left dashboard-filter__apply" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" title="Apply Filter" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">
                    Apply
                </smss-btn>
                `
                }
            </div>`;
        }

        /** Typeahead */
        /**
         * @name generateTypeahead
         * @desc generate the HTML for a typeahead filter
         * @return {void}
         */
        function generateTypeahead(): string {
            return `
            <div class="dashboard-filter__container">
                <smss-btn class="smss-btn--right smss-btn--icon" title="Unfilter" ng-click="dashboardFilter.applyFilter(true); dashboardFilter.list.search = '';" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
                <div class="dashboard-filter__container__content">
                    <smss-typeahead
                        model="dashboardFilter.list.search"
                        loading="dashboardFilter.list.loading"
                        options="dashboardFilter.list.options"
                        change="dashboardFilter.changeFilter(model)"
                        scroll="dashboardFilter.getMoreList();"
                        ng-disabled="dashboardFilter.running"
                        show-popover="dashboardFilter.showPopover(contentEle)">
                    </smss-typeahead>
                </div>
                ${
                    scope.dashboardFilter.options.auto
                        ? ''
                        : `
                <smss-btn class="smss-btn--left dashboard-filter__apply" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" title="Apply Filter" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">
                    Apply
                </smss-btn>
                `
                }
            </div>`;
        }

        /**
         * @name changeTypeahead
         * @desc typeahead has changed, update the value
         * @return boolean if the filter should be applied
         */
        function changeTypeahead(model: string): boolean {
            // apply will cause a new search
            if (scope.dashboardFilter.options.auto) {
                // set the search but do not actually search
                scope.dashboardFilter.list.search = model;

                return true;
            }

            searchList(model);

            return false;
        }

        /**
         * @name buildTypeaheadExecution
         * @desc build the pixel for the typeahead
         * @param name - name to filter
         * @param
         */
        function buildTypeaheadExecution(
            name: string,
            frame: boolean
        ): PixelCommand[] {
            const components: PixelCommand[] = [];

            const start = frame ? name : `Panel(${name})`;

            components.push(
                {
                    type: 'Pixel',
                    components: [start],
                },
                {
                    type: frame ? 'setFrameFilter' : 'setPanelFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: scope.dashboardFilter.header.alias,
                                comparator: '?like',
                                values: scope.dashboardFilter.list.search,
                            },
                        ],
                    ],
                    terminal: true,
                }
            );

            return components;
        }

        /** Slider */
        /**
         * @name generateSlider
         * @desc generate the HTML for a slider filter
         * @return {void}
         */
        function generateSlider(): string {
            let invert = false;

            // set invert based on the comparator
            if (scope.dashboardFilter.range.type === 'categorical') {
                if (scope.dashboardFilter.range.comparator === '!=') {
                    invert = true;
                } else {
                    invert = false;
                }
            } else {
                if (scope.dashboardFilter.options.multiple) {
                    if (
                        (scope.dashboardFilter.range.comparator[0] === '<' ||
                            scope.dashboardFilter.range.comparator[0] ===
                                '<=') &&
                        (scope.dashboardFilter.range.comparator[1] === '>' ||
                            scope.dashboardFilter.range.comparator[1] === '>=')
                    ) {
                        invert = true;
                    } else {
                        invert = false;
                    }
                } else {
                    if (
                        scope.dashboardFilter.range.comparator === '<' ||
                        scope.dashboardFilter.range.comparator === '<='
                    ) {
                        invert = true;
                    } else {
                        invert = false;
                    }
                }
            }

            return `
            <div class="dashboard-filter__container">
                <smss-btn class="smss-btn--right smss-btn--icon" title="Unfilter" ng-click="dashboardFilter.applyFilter(true)" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
                <div class="dashboard-filter__container__content">
                    <smss-slider
                        model="dashboardFilter.range.rendered"
                        ${
                            scope.dashboardFilter.range.type === 'categorical'
                                ? 'options="dashboardFilter.range.options"'
                                : ''
                        }
                        change="dashboardFilter.changeFilter(model)"
                        ${
                            scope.dashboardFilter.range.type === 'numerical'
                                ? `min="dashboardFilter.range.min"`
                                : ''
                        }
                        ${
                            scope.dashboardFilter.range.type === 'numerical'
                                ? `max="dashboardFilter.range.max"`
                                : ''
                        }
                        ${
                            scope.dashboardFilter.range.type === 'numerical' &&
                            typeof scope.dashboardFilter.options.sensitivity !==
                                'undefined'
                                ? `sensitivity="dashboardFilter.options.sensitivity"`
                                : ''
                        }
                        ${
                            scope.dashboardFilter.range.type === 'date'
                                ? `start="dashboardFilter.range.min"`
                                : ''
                        }
                        ${
                            scope.dashboardFilter.range.type === 'date'
                                ? `end="dashboardFilter.range.max"`
                                : ''
                        }
                        ${
                            scope.dashboardFilter.range.type === 'date' &&
                            typeof scope.dashboardFilter.options.format !==
                                'undefined'
                                ? `format="'${scope.dashboardFilter.options.format}'"`
                                : ''
                        }
                        ${
                            scope.dashboardFilter.options.multiple
                                ? 'multiple'
                                : ''
                        }
                        ${invert ? 'invert' : ''}
                        ${scope.dashboardFilter.range.type}
                        ng-disabled="dashboardFilter.running">
                    </smss-slider>
                </div>
                ${
                    scope.dashboardFilter.options.auto
                        ? ''
                        : `
                <smss-btn class="smss-btn--left dashboard-filter__apply" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" title="Apply Filter" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">
                    Apply
                </smss-btn>
                `
                }
            </div>`;
        }

        /**Datepicker */
        /**
         * @name generateDatepicker
         * @desc generate the HTML for a datepicker filter
         * @return {void}
         */
        function generateDatepicker(): string {
            let text = '';
            if (scope.dashboardFilter.options.multiple) {
                //noop
            } else {
                if (
                    scope.dashboardFilter.range.comparator === '<' ||
                    scope.dashboardFilter.range.comparator === '<='
                ) {
                    text = 'Before:';
                } else if (
                    scope.dashboardFilter.range.comparator === '>' ||
                    scope.dashboardFilter.range.comparator === '>='
                ) {
                    text = 'After:';
                } else if (scope.dashboardFilter.range.comparator === '==') {
                    text = 'On:';
                } else if (scope.dashboardFilter.range.comparator === '!=') {
                    text = 'Not on:';
                }
            }
            return `
            <div class="dashboard-filter__container">
                <smss-btn class="smss-btn--right smss-btn--icon" title="Unfilter" ng-click="dashboardFilter.applyFilter(true)" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
                <div class="smss-clear dashboard-filter__container__content dashboard-filter__datepicker">
                    ${
                        scope.dashboardFilter.options.multiple
                            ? `
                    <smss-date-picker 
                        class="smss-left dashboard-filter__datepicker__picker"
                        model="dashboardFilter.range.rendered[0]"
                        change="dashboardFilter.changeFilter(model)"
                        time="${scope.dashboardFilter.options.time}"
                        ${
                            typeof scope.dashboardFilter.options.format !==
                            'undefined'
                                ? `format="'${scope.dashboardFilter.options.format}'"`
                                : ''
                        }
                        ng-disabled="dashboardFilter.running"
                        show="dashboardFilter.showPopover(contentEle)">
                    </smss-date-picker>
                    <div class="smss-left smss-text smss-center dashboard-filter__datepicker__text">
                        <span class="smss-small"> to </span>
                    </div>
                    <smss-date-picker 
                        class="smss-left dashboard-filter__datepicker__picker"
                    model="dashboardFilter.range.rendered[1]"
                        change="dashboardFilter.changeFilter(model)"
                        time="${scope.dashboardFilter.options.time}"
                        ${
                            typeof scope.dashboardFilter.options.format !==
                            'undefined'
                                ? `format="'${scope.dashboardFilter.options.format}'"`
                                : ''
                        }
                        ng-disabled="dashboardFilter.running"
                        show="dashboardFilter.showPopover(contentEle)">
                    </smss-date-picker>
                    `
                            : `
                    <div class="smss-left smss-text dashboard-filter__datepicker__text">
                        <span class="smss-small"> ${text} </span>
                    </div>
                    <smss-date-picker 
                        class="smss-left dashboard-filter__datepicker__picker"
                        model="dashboardFilter.range.rendered[0]"
                        change="dashboardFilter.changeFilter(model)"
                        time="${scope.dashboardFilter.options.time}"
                        ${
                            typeof scope.dashboardFilter.options.format !==
                            'undefined'
                                ? `format="'${scope.dashboardFilter.options.format}'"`
                                : ''
                        }
                        ng-disabled="dashboardFilter.running"
                        show="dashboardFilter.showPopover(contentEle)">
                    </smss-date-picker>
                    `
                    }
                </div>
                ${
                    scope.dashboardFilter.options.auto
                        ? ''
                        : `
                <smss-btn class="smss-btn--left dashboard-filter__apply" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" title="Apply Filter" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">
                    Apply
                </smss-btn>
                `
                }
            </div>`;
        }

        /** Button */
        /**
         * @name generateButton
         * @desc generate the HTML for a button filter
         * @return {void}
         */
        function generateButton(): string {
            return `
            <div class="dashboard-filter__button ${
                scope.dashboardFilter.options.vertical
                    ? 'dashboard-filter__button--vertical'
                    : ''
            }">
                <smss-btn class="smss-btn--icon smss-btn--right" title="Unfilter" ng-click="dashboardFilter.applyFilter(true)" ng-disabled="dashboardFilter.running">
                    <div class="dashboard-filter__unfilter">
                        <i class="fa fa-filter"></i>
                        <i class="fa fa-times"></i>
                    </div>
                </smss-btn>
                <div class="dashboard-filter__button__scroller"> 
                    <smss-btn class="smss-btn--right dashboard-filter__button__scroller__button"
                            ng-repeat="opt in dashboardFilter.list.options track by $index" 
                            ng-click="dashboardFilter.changeFilter(opt)"
                            ng-class="{'dashboard-filter__button__scroller__button--selected': dashboardFilter.list.rendered.indexOf(opt) > -1}"
                            title="{{dashboardFilter.list.rendered.indexOf(opt) > -1 ? 'Unfilter' : 'Filter'}} by {{opt}}"
                            ng-disabled="dashboardFilter.running">
                        {{opt === null ? 'null' : opt}}
                    </smss-btn>
                </div>
            </div>
            ${
                scope.dashboardFilter.options.auto
                    ? ''
                    : `
            <div class="smss-action">
                <smss-btn class="dashboard-filter__apply" title="Apply Filter" ng-class="{'dashboard-filter__apply--active': dashboardFilter.executed}" ng-click="dashboardFilter.applyFilter(false)" ng-disabled="dashboardFilter.running">Apply</smss-btn>
            </div>`
            }
            `;
        }

        /**
         * @name changeButton
         * @desc typeahead has changed, update the value
         * @return boolean if the filter should be applied
         */
        function changeButton(model: string): boolean {
            if (scope.dashboardFilter.options.multiple) {
                const idx = scope.dashboardFilter.list.rendered.indexOf(model);

                // remove it if it is already there
                if (idx > -1) {
                    scope.dashboardFilter.list.rendered.splice(idx, 1);
                } else {
                    scope.dashboardFilter.list.rendered.push(model);
                }
            } else {
                scope.dashboardFilter.list.rendered = [model];
            }

            if (scope.dashboardFilter.options.auto) {
                return true;
            }

            return false;
        }

        /**
         * @name buildButtonExecution
         * @desc build the pixel for the button
         * @param name - name to filter
         * @param
         */
        function buildButtonExecution(
            name: string,
            frame: boolean
        ): PixelCommand[] {
            const components: PixelCommand[] = [];

            const start = frame ? name : `Panel(${name})`;

            // special scenario where nothing is selected
            if (scope.dashboardFilter.list.rendered.length === 0) {
                components.push(
                    {
                        type: 'Pixel',
                        components: [start],
                    },
                    {
                        type: frame ? 'addFrameFilter' : 'addPanelFilter',
                        components: [
                            [
                                {
                                    type: 'value',
                                    alias: scope.dashboardFilter.header.alias,
                                    comparator: '?nlike',
                                    values: '',
                                },
                            ],
                        ],
                        terminal: true,
                    }
                );
            } else {
                components.push(
                    {
                        type: 'Pixel',
                        components: [start],
                    },
                    {
                        type: frame ? 'setFrameFilter' : 'setPanelFilter',
                        components: [
                            [
                                {
                                    type: 'value',
                                    alias: scope.dashboardFilter.header.alias,
                                    comparator: '==',
                                    values: scope.dashboardFilter.list.rendered,
                                },
                            ],
                        ],
                        terminal: true,
                    }
                );
            }

            return components;
        }

        /**
         * @name setStyles
         * @desc if a theme is applied, will override the smss-component colors with the theme colors
         * @param ele the element to apply the styles to
         */
        function setStyles(ele): void {
            const theme = scope.insightCtrl.getShared('theme');

            // Override component colors with theme colors
            if (theme && theme.filter && theme.filter.component && ele) {
                for (const key in theme.filter.component) {
                    if (theme.filter.component.hasOwnProperty(key)) {
                        ele.style.setProperty(key, theme.filter.component[key]);
                    }
                }
            }

            // Override icon color for unfilter button
            if (theme && theme.color && theme.color.iconDark) {
                ele.style.setProperty(
                    '--dashboard-unfilter-icon',
                    theme.color.iconDark
                );
            }
        }

        /**
         * @name showPopover
         * @desc called when components with popovers are opened to set the style (multiselect, datepicker, dropdown, typeahead)
         * @param ele popover element to apply theme to
         */
        function showPopover(ele): void {
            if (ele) {
                ele.style.setProperty('font-family', 'var(--font-family)');
                setStyles(ele);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            // append listeners
            const updateViewListener = scope.insightCtrl.on(
                    'update-view',
                    resetFilter
                ),
                updateFrameListener = scope.insightCtrl.on(
                    'update-frame',
                    resetFilter
                ),
                updateFrameFilterListener = scope.insightCtrl.on(
                    'update-frame-filter',
                    resetFilter
                ),
                updateThemeListener = scope.insightCtrl.on(
                    'update-theme',
                    resetFilter
                );

            scope.$on('$destroy', () => {
                updateViewListener();
                updateFrameListener();
                updateFrameFilterListener();
                updateThemeListener();
            });

            resetFilter();
        }

        initialize();
    }
}
