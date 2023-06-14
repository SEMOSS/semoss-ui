'use strict';

import './purge.scss';

/**
 * @name purge
 * @desc Sort Values directive used to sort the directive
 */
export default angular
    .module('app.purge.directive', [])
    .directive('purge', purgeDirective);

purgeDirective.$inject = [];

function purgeDirective() {
    purgeCtrl.$inject = [];
    purgeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'purge',
        bindToController: {},
        template: require('./purge.directive.html'),
        controller: purgeCtrl,
        link: purgeLink,
    };

    function purgeCtrl() {}

    function purgeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.purge.getRenderedText = getRenderedText;
        scope.purge.setComparatorList = setComparatorList;
        scope.purge.resetModel = resetModel;
        scope.purge.getMore = getMore;
        scope.purge.getInstances = getInstances;
        scope.purge.addFilter = addFilter;
        scope.purge.deleteFilter = deleteFilter;
        scope.purge.execute = execute;
        scope.purge.cancel = cancel;

        scope.purge.PIPELINE = scope.pipelineComponentCtrl !== null;
        scope.purge.frameFilters = [];

        scope.purge.comparators = {
            list: [],
            fullList: [
                {
                    display: 'Equal To',
                    value: '==',
                    acceptableTypes: ['NUMBER', 'STRING', 'DATE'],
                },
                {
                    display: 'Not Equal To',
                    value: '!=',
                    acceptableTypes: ['NUMBER', 'STRING', 'DATE'],
                },
                {
                    display: 'Contains',
                    value: '?like',
                    acceptableTypes: ['STRING'],
                },
                {
                    display: 'Starts With',
                    value: '?begins',
                    acceptableTypes: ['STRING'],
                },
                {
                    display: 'Ends With',
                    value: '?ends',
                    acceptableTypes: ['STRING'],
                },
                {
                    display: 'Less Than',
                    value: '<',
                    acceptableTypes: ['NUMBER'],
                },
                {
                    display: 'Less Than or Equal To',
                    value: '<=',
                    acceptableTypes: ['NUMBER'],
                },
                {
                    display: 'Greater Than',
                    value: '>',
                    acceptableTypes: ['NUMBER'],
                },
                {
                    display: 'Greater Than or Equal To',
                    value: '>=',
                    acceptableTypes: ['NUMBER'],
                },
            ],
        };

        scope.purge.headers = [];

        /**
         * @name addFilter
         * @desc add a new filter
         * @returns {void}
         */
        function addFilter() {
            scope.purge.frameFilters.push({
                filterObj: {
                    filterType: 'SIMPLE',
                    comparator: '==',
                    left: {
                        display: '',
                        value: scope.purge.headers[0],
                    },
                    right: {
                        display: '',
                        value: [],
                    },
                },
            });

            setComparatorList(scope.purge.frameFilters.length - 1);
            getInstances(scope.purge.frameFilters.length - 1);
            resetModel(scope.purge.frameFilters.length - 1);
        }

        /**
         * @name deleteFilter
         * @param {*} index the index of filter to remove
         * @desc remove the filter
         * @returns {void}
         */
        function deleteFilter(index) {
            scope.purge.frameFilters.splice(index, 1);
        }

        /**
         * @name buildParams
         * @desc builds params for pipeline
         * @returns {*} the params and their values
         */
        function buildParams() {
            const params = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
                OPERATION: generateFilterString(),
            };

            return params;
        }

        /**
         * @name getRenderedText
         * @param {number} index the index of filter to get rendered text for
         * @desc get the text display of the selections for this filter
         * @returns {string} get rendered text of the selections
         */
        function getRenderedText(index) {
            let filterObj = scope.purge.frameFilters[index].filterObj;
            if (
                filterObj.right &&
                filterObj.right.value &&
                Array.isArray(filterObj.right.value)
            ) {
                return filterObj.right.value.join(', ');
            }

            return '';
        }

        /**
         * @name setComparatorList
         * @param {number} index the index to check to set the comparator list for
         * @desc check the data type and set the appropriate comparators to show to user
         * @return {void}
         */
        function setComparatorList(index) {
            if (!scope.purge.frameFilters[index].filterObj.left) {
                return;
            }
            let dataType =
                scope.purge.frameFilters[index].filterObj.left.value.dataType;
            scope.purge.comparators.list = [];
            for (
                let idx = 0;
                idx < scope.purge.comparators.fullList.length;
                idx++
            ) {
                if (
                    scope.purge.comparators.fullList[
                        idx
                    ].acceptableTypes.indexOf(dataType) > -1
                ) {
                    scope.purge.comparators.list.push(
                        scope.purge.comparators.fullList[idx]
                    );
                }
            }
        }

        /**
         * @name resetModel
         * @param {*} index the filter index to reset model for
         * @desc reset the model bound to the selection. set it to the correct type...array/string/number
         * @returns {void}
         */
        function resetModel(index) {
            let filterObj = scope.purge.frameFilters[index].filterObj;

            if (!scope.purge.frameFilters[index].filterObj.left) {
                return;
            }
            // NUMBER STRING DATE
            if (
                filterObj.comparator === '==' ||
                filterObj.comparator === '!='
            ) {
                filterObj.right.value = [];
            } else if (
                filterObj.comparator === '?like' ||
                filterObj.comparator === '?begins' ||
                filterObj.comparator === '?ends'
            ) {
                filterObj.right.value = '';
            } else {
                // this is numerical...greater than, less than, etc.
                filterObj.right.value = 0;
            }

            setFieldType(index);
        }

        /**
         * @name setFieldType
         * @param {*} index the index to set the field type for
         * @desc set the field type to show
         * @returns {void}
         */
        function setFieldType(index) {
            let filterObj = scope.purge.frameFilters[index].filterObj;
            if (filterObj.right) {
                filterObj.right.fieldType = getFieldType(index);
            }
        }

        /**
         * @name isActive
         * @param {number} index the index of filter to set field type for
         * @desc which field to show
         * @returns {string} name of field to show
         */
        function getFieldType(index) {
            const filterObj = scope.purge.frameFilters[index].filterObj;

            if (!filterObj.left) {
                return '';
            }

            // if nothing selected as the column, we will just defauly to multiselect
            if (!filterObj.left.value || !filterObj.left.value.dataType) {
                return 'multiselect';
            }

            if (
                filterObj.left.value.dataType === 'STRING' ||
                filterObj.left.value.dataType === 'DATE'
            ) {
                if (
                    filterObj.comparator === '==' ||
                    filterObj.comparator === '!='
                ) {
                    // if data type is string, date && if comparator selected is equals and not equals, we will show the multiselect
                    return 'multiselect';
                } else if (
                    filterObj.comparator === '?like' ||
                    filterObj.comparator === '?begins' ||
                    filterObj.comparator === '?ends'
                ) {
                    // if data type is string, date && if comparator selected is contains, begins, ends, we will show the smss-typeahead
                    return 'typeahead';
                }

                // if no comparator selected, we will default to multiselect
                return 'multiselect';
            }

            // if data type is number, we will show number field unless comparator is '==' or '!='
            if (filterObj.left.value.dataType === 'NUMBER') {
                if (
                    filterObj.comparator === '==' ||
                    filterObj.comparator === '!='
                ) {
                    return 'multiselect';
                }
                return 'number';
            }

            // shouldn't reach here...but if it does we will default to multiselect
            return 'multiselect';
        }

        /**
         * @name setInstances
         * @param {number} index the index to set the filter instances for
         * @param {*} output the return from the BE on the instances
         * @desc set the instances for the selected column
         * @returns {void}
         */
        function setInstances(index, output) {
            let currentRightObj =
                    scope.purge.frameFilters[index].filterObj.right,
                tempList =
                    currentRightObj.list && currentRightObj.list.length > 0
                        ? currentRightObj.list
                        : [];

            currentRightObj.taskId = output.taskId;
            currentRightObj.canCollect =
                output.numCollected === output.data.values.length;
            // we will append to the list of instances
            for (
                let dataIdx = 0;
                dataIdx < output.data.values.length;
                dataIdx++
            ) {
                tempList.push(output.data.values[dataIdx][0]);
            }

            currentRightObj.list = tempList;
            currentRightObj.loading = false;
        }

        /**
         * @name getInstances
         * @param {*} index the index of the filter to get instances for
         * @param {string} searchTerm the term to search
         * @param {string} comparator the comparator to use
         * @desc run pixel to get the instances for the selected filter
         * @returns {void}
         */
        function getInstances(index, searchTerm, comparator) {
            let frameName = scope.widgetCtrl.getFrame('name'),
                components = [];

            if (!scope.purge.frameFilters[index].filterObj.left) {
                return;
            }

            if (scope.purge.PIPELINE) {
                frameName = frameName =
                    scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    );
            }

            if (
                scope.purge.frameFilters[index].filterObj.left.value &&
                scope.purge.frameFilters[index].filterObj.left.value.alias
            ) {
                scope.purge.frameFilters[index].filterObj.right.loading = true;
                components = [
                    {
                        type: 'frame',
                        components: [frameName],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    selector:
                                        scope.purge.frameFilters[index]
                                            .filterObj.left.value.alias,
                                    alias: scope.purge.frameFilters[index]
                                        .filterObj.left.value.alias,
                                },
                            ],
                        ],
                    },
                    {
                        type: 'implicitFilterOverride',
                        components: [true],
                    },
                ];

                if (searchTerm && comparator) {
                    let searchFilter = '';
                    searchFilter += 'Filter(';
                    searchFilter +=
                        scope.purge.frameFilters[index].filterObj.left.value
                            .alias;
                    searchFilter += ' ' + comparator;
                    searchFilter += ' "' + searchTerm + '"';
                    searchFilter += ')';
                    components.push({
                        type: 'Pixel',
                        components: [searchFilter],
                    });
                }

                components.push({
                    type: 'collect',
                    components: [50],
                    terminal: true,
                });
                scope.widgetCtrl.meta(components, function (response) {
                    scope.purge.frameFilters[index].filterObj.right.list = [];
                    let output = response.pixelReturn[0].output;
                    setInstances(index, output);
                });
            }
        }

        /**
         * @name getMore
         * @param {*} index the index of filter to get more instances for
         * @desc infinite scroll to get more instances
         * @returns {void}
         */
        function getMore(index) {
            if (
                scope.purge.frameFilters[index].filterObj.right.taskId &&
                scope.purge.frameFilters[index].filterObj.right.canCollect
            ) {
                scope.purge.frameFilters[index].filterObj.right.loading = true;
                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'task',
                            components: [
                                scope.purge.frameFilters[index].filterObj.right
                                    .taskId,
                            ],
                            meta: true,
                        },
                        {
                            type: 'collect',
                            components: [50],
                            terminal: true,
                        },
                    ],
                    function (response) {
                        let output = response.pixelReturn[0].output;
                        setInstances(index, output);
                    }
                );
            }
        }

        /**
         * @name generateFilterString
         * @desc generate the proper filter string to be passed into purge
         * @returns {string} the filter str
         */
        function generateFilterString() {
            let filterStr = 'Filter(';

            for (
                let filterIdx = 0;
                filterIdx < scope.purge.frameFilters.length;
                filterIdx++
            ) {
                let currentFilter =
                    scope.purge.frameFilters[filterIdx].filterObj;

                if (currentFilter.filterType === 'SIMPLE') {
                    filterStr += '(';
                    filterStr += currentFilter.left.value.alias;
                    filterStr += ' ' + currentFilter.comparator;

                    if (
                        Array.isArray(currentFilter.right.value) ||
                        typeof currentFilter.right.value === 'string'
                    ) {
                        // if its an array or a string, we will stringify it; string needs quotes surrounding it
                        filterStr +=
                            ' ' + JSON.stringify(currentFilter.right.value);
                    } else {
                        // otherwise this is a number so we will leave as is
                        filterStr += ' ' + currentFilter.right.value;
                    }

                    filterStr += ')';
                } else if (scope.purge.frameFilters[filterIdx].filterStr) {
                    filterStr += '(';
                    filterStr +=
                        scope.purge.frameFilters[filterIdx].pixelString;
                    filterStr += ')';
                }

                // if its not the last filter, we will add a comma to separate
                if (filterIdx !== scope.purge.frameFilters.length - 1) {
                    filterStr += ', ';
                }
            }

            filterStr += ')';
            return filterStr;
        }

        /**
         * @name areFiltersValid
         * @desc validate the filters entered are valid. clean up
         * @returns {boolean} true/false
         */
        function areFiltersValid() {
            let valid = true;

            for (
                let filterIdx = 0;
                filterIdx < scope.purge.frameFilters.length;
                filterIdx++
            ) {
                let currentFilter =
                    scope.purge.frameFilters[filterIdx].filterObj;

                // complicated filters we dont need to check
                if (currentFilter.filterType !== 'SIMPLE') {
                    continue;
                }

                // if no left selected
                if (
                    !currentFilter.left.value ||
                    !currentFilter.left.value.alias
                ) {
                    valid = false;
                    break;
                }

                // if no comparator selected
                if (!currentFilter.comparator) {
                    valid = false;
                    break;
                }

                // if no right values are selected
                if (
                    Array.isArray(currentFilter.right.value) &&
                    currentFilter.right.value.length === 0
                ) {
                    valid = false;
                    break;
                }

                // if no string typed
                if (
                    typeof currentFilter.right.value === 'string' &&
                    !currentFilter.right.value
                ) {
                    valid = false;
                    break;
                }
            }

            return valid;
        }

        /**
         * @name execute
         * @desc execute the purge query to purge the filtered values
         * @returns {void}
         */
        function execute() {
            let frameName = scope.widgetCtrl.getFrame('name'),
                filterStr = generateFilterString();

            if (!filterStr) {
                // warn user they need to add a filter
                scope.widgetCtrl.alert('warn', 'Please insert a valid filter.');
                return;
            }

            if (!areFiltersValid()) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Check the filters to make sure all parts are filled in.'
                );
                return;
            }

            // Purge (Filter(Genre==[''], ));
            // {Genre: value: [], comparator: '==', isFilterString: true} // this is for complex filters
            if (scope.purge.PIPELINE) {
                frameName = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value.name'
                );
                const components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                scope.widgetCtrl.execute([
                    {
                        type: 'variable',
                        components: [frameName],
                    },
                    {
                        type: 'purge',
                        components: [filterStr],
                        terminal: true,
                    },
                ]);
            }
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         * @return {void}
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name getFilteredValues
         * @desc makes the BE call to get the filter model
         * @returns {object} all of the filtered values
         */
        function getFilteredValues() {
            let callback = function (response) {
                let output = response.pixelReturn[0].output;

                for (let i = 0; i < output.length; i++) {
                    if (output[i].filterObj.filterType !== 'SIMPLE') {
                        output[i].filterStrDisplay = output[
                            i
                        ].filterStr.replace(/_/g, ' ');
                    } else {
                        if (
                            output[i].filterObj.comparator === '==' ||
                            output[i].filterObj.comparator === '!='
                        ) {
                            if (
                                !Array.isArray(output[i].filterObj.right.value)
                            ) {
                                output[i].filterObj.right.value = [
                                    output[i].filterObj.right.value,
                                ];
                            }
                        }
                        // set the object we expect instead of just the value
                        for (
                            let headerIdx = 0;
                            headerIdx < scope.purge.headers.length;
                            headerIdx++
                        ) {
                            if (
                                scope.purge.headers[headerIdx].alias ===
                                output[i].filterObj.left.value
                            ) {
                                output[i].filterObj.left.value =
                                    scope.purge.headers[headerIdx];
                            }
                        }
                    }
                }

                scope.purge.frameFilters = output;
                // if no filters, then add an empty one for them to start
                if (scope.purge.frameFilters.length === 0) {
                    addFilter();
                }

                for (
                    let filterIdx = 0;
                    filterIdx < scope.purge.frameFilters.length;
                    filterIdx++
                ) {
                    getInstances(filterIdx);
                    setComparatorList(filterIdx);
                    setFieldType(filterIdx);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'getFrameFilters',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name setPipelineState
         * @desc set the pipeline state
         * @returns {void}
         */
        function setPipelineState() {
            scope.purge.headers = scope.pipelineComponentCtrl.getComponent(
                'parameters.SOURCE.value.headers'
            );
            if (scope.pipelineComponentCtrl.data.state === 'executed') {
                scope.purge.frameFilters = [];
                // if executed, we need to pull from what's returned from purge. see what filters were purged and populate those
                let filters = scope.pipelineComponentCtrl.getComponent(
                    'parameters.filters.value.0.value'
                );
                for (
                    let filterIdx = 0;
                    filterIdx < filters.length;
                    filterIdx++
                ) {
                    if (filters[filterIdx].filterObj.filterType !== 'SIMPLE') {
                        filters[filterIdx].filterStrDisplay = filters[
                            filterIdx
                        ].filterStr.replace(/_/g, ' ');
                        scope.purge.frameFilters.push(filters[filterIdx]);
                    } else {
                        // make sure the model is in the right data structure (string vs number vs array)
                        if (
                            filters[filterIdx].filterObj.comparator === '==' ||
                            filters[filterIdx].filterObj.comparator === '!='
                        ) {
                            if (
                                !Array.isArray(
                                    filters[filterIdx].filterObj.right.value
                                )
                            ) {
                                filters[filterIdx].filterObj.right.value = [
                                    filters[filterIdx].filterObj.right.value,
                                ];
                            }
                        }
                        // set the object we expect instead of just the value
                        for (
                            let headerIdx = 0;
                            headerIdx < scope.purge.headers.length;
                            headerIdx++
                        ) {
                            if (
                                scope.purge.headers[headerIdx].alias ===
                                filters[filterIdx].filterObj.left.value
                            ) {
                                filters[filterIdx].filterObj.left.value =
                                    scope.purge.headers[headerIdx];
                            }
                        }

                        scope.purge.frameFilters.push(filters[filterIdx]);
                        getInstances(filterIdx);
                        setComparatorList(filterIdx);
                        setFieldType(filterIdx);
                    }
                }
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                getFilteredValues
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
            });

            if (scope.purge.PIPELINE) {
                // if the state is initial, we will grab the existing filters
                if (scope.pipelineComponentCtrl.data.state === 'initial') {
                    getFilteredValues();
                }
                setPipelineState();
            } else {
                scope.purge.headers = scope.widgetCtrl.getFrame('headers');
                getFilteredValues();
            }
        }

        initialize();
    }
}
