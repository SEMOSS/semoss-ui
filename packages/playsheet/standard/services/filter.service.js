(function () {
    "use strict";

    angular.module("app.filter.service", [])
        .factory("filterService", filterService);

    filterService.$inject = ["monolithService", "_", 'utilityService', '$q'];

    function filterService(monolithService, _, utilityService, $q) {

        function createFilterOptions(data) {
            var returnFilters = {};

            if (data.insightID) {
                return monolithService.getFilterModel(data.insightID).then(function (filterData) {

                    //if getFilterModel returns no data, use the current visualization data to get the filterOptions
                    if (!_.isObject(filterData) && !filterData.unfilteredValues && !filterData.filteredValues) {
                        console.log('CHECK FILTER')
                    } else {
                        returnFilters = {};
                        // first add the unfiltered values
                        for (var header in filterData.unfilteredValues) {

                            var list = _.map(filterData.unfilteredValues[header], function (item) {
                                return {
                                    value: item,
                                    selected: true
                                }
                            });

                            // need to check if there are any filtered values and add to the list
                            var isFiltered = false;
                            for (var item in filterData.filteredValues[header]) {
                                isFiltered = true;
                                list.push(
                                    {
                                        value: filterData.filteredValues[header][item],
                                        selected: false
                                    }
                                );
                            }

                            var range = [];
                            if (!_.isEmpty(filterData.minMax[header])) {
                                range = [filterData.minMax[header].min, filterData.minMax[header].max]
                            }

                            //set up the model
                            returnFilters[header] = {
                                list: _.sortBy(list, 'value'),
                                selectAll: (filterData.filteredValues[header].length === 0),
                                inputSearch: "",
                                isFiltered: isFiltered,
                                isCollapsed: true,
                                isDisabled: false,
                                minMax: filterData.minMax[header],
                                useSlider: false,
                                selectedRange: range
                            };
                        }
                    }

                    return {filters: returnFilters};
                }, function (err) {
                    console.log('CHECK FILTER')

                });
            } else if (data.layout !== "create") {
                console.log('CHECK FILTER')
            } else {
                console.log('CHECK FILTER')
            }
        }

        return {
            createFilterOptions: createFilterOptions
        };
    }
})();