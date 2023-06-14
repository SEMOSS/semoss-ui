(function () {
    "use strict";

    /**
     * @name utility.service.js
     * @desc holds custom utility functions used throughout the application.
     */
    angular.module("app.utility.service", [])
        .factory("utilityService", utilityService);

    utilityService.$inject = ["$filter", "_"];

    function utilityService($filter, _) {
        /**
         * @name createDataFilterModel
         * @param data
         * @param headers
         * @returns {object}
         * @desc Creates the filter model needed for visualization filter options and selections
         */
        function createDataFilterModel(data, headers) {
            var filterOptions = {};

            for (var i = 0; i < headers.length; i++) {
                //set up the list with the option value and if its selected or not
                var completeList = _.uniqBy(_.map(data, function (item) {
                    return {
                        value: item[headers[i].title],
                        selected: true
                    }
                }), "value");

                filterOptions[headers[i].title] = {
                    list: completeList,
                    selectAll: true,
                    //selected: JSON.parse(JSON.stringify(completeList)),
                    inputSearch: "",
                    isFiltered: false,
                    isCollapsed: true,
                    isDisabled: false
                };

                //if nothing is tempSelected, then this will disable the list - this is because we remove
                if (filterOptions[headers[i].title].list.length === 0) {
                    filterOptions[headers[i].title].isDisabled = true;
                }
            }

            return filterOptions;
        }

        function filterDataWithFilterOptions(data, filters) {

            var newData = JSON.parse(JSON.stringify(data));

            for (var key in filters) {
                //if not all the options are selected then start filtering
                if (!filters[key].selectAll) {
                    var keepItems = _.filter(filters[key].list, {selected: true});

                    if (keepItems.length > 0) {
                        var keepValues = _.map(keepItems, 'value');

                        for (var i = 0; i < newData.length; i++) {
                            if (!_.isUndefined(newData[i][key]) && !_.isNull(newData[i][key]) && !_.includes(keepValues, newData[i][key])) {
                                newData.splice(i, 1);
                                i--;
                            }
                        }
                    } else if (keepItems.length === 0) {
                        for (var i = 0; i < newData.length; i++) {
                            newData[i] = _.omit(newData[i], key);
                        }
                    }
                }
            }

            return newData;
        }


        /**
         *
         * @param headers
         * @param data
         * @param removeUri
         * @returns {{headers: Array, data: Array}}
         * @desc formats table data, also sets up a filtered data object that removes underscores and uris from keys/values and headers/data
         */
        function formatTableData(headers, data, removeUri) {
            var formattedData = {
                    headers: [],
                    data: []
                },
                filteredData = [];


            //create array of objects from the scope.data.data array using the headers
            data.forEach(function (item) {
                var newObjUri = {},
                    newObjNoUri = {};

                for (var i = 0; i < item.length; i++) {
                    /*if (_.isObject(item[i])) {
                     newObjUri[headers[i]] = item[i].uriString;
                     newObjNoUri[$filter("replaceUnderscores")(headers[i])] = $filter("shortenAndReplaceUnderscores")(item[i].uriString);

                     } else {*/
                    //if it's number dont do anything with the values; we want to keep it as number instead of converting to string
                    if (headers[i]) {
                        if (typeof item[i] === "number") {
                            newObjUri[headers[i]] = item[i];
                            newObjNoUri[$filter("replaceUnderscores")(headers[i])] = item[i];
                        } else {
                            //if the value is a uri (has http://) then don't replaceUnderscores
                            newObjUri[headers[i]] = String(item[i]).indexOf('http://') !== -1 ? item[i] : $filter("replaceUnderscores")(item[i]);
                            newObjNoUri[$filter("replaceUnderscores")(headers[i])] = $filter("shortenAndReplaceUnderscores")(item[i]);
                        }
                    }
                    // }
                }
                if (removeUri) {
                    filteredData.push(newObjNoUri);
                }

                formattedData.data.push(newObjUri);
            });

            //add the headers as objects
            headers.forEach(function (header) {
                if (header) {
                    var newObj = {title: header, filteredTitle: $filter("replaceUnderscores")(header), filter: {}};
                    newObj.filter[header] = "";
                    formattedData.headers.push(newObj);
                }
            });

            //only want to return the filteredData if they asked for it
            if (removeUri) {
                formattedData.filteredData = filteredData;
            }

            return formattedData;
        }

        /**
         * @name generateHeaders
         * @param headerArray
         * @returns [Object]
         * @desc takes in table format headers (array of string) and generates correct headers
         */
        function generateHeaders(headers) {
            var headerArr = [];

            headers.forEach(function (header) {
                var newObj = {title: header, filteredTitle: $filter("replaceUnderscores")(header), filter: {}};
                headerArr.push(newObj);
            });

            return headerArr;
        }

        /**
         * @param uriData
         * @returns [Object]
         * @desc takes in table format data (array of object) and removes the underscores and uris from the headers and instance values
         */
        function filterTableUriData(uriData) {
            var filteredData = [],
                headerKeys = _.keys(uriData[0]);

            uriData.forEach(function (item) {
                var newObj = {};

                for (var i = 0; i < headerKeys.length; i++) {
                    newObj[$filter("replaceUnderscores")(headerKeys[i])] = $filter("shortenAndReplaceUnderscores")(item[headerKeys[i]]);
                }

                filteredData.push(newObj);
            });

            return filteredData;
        }

        function addUnderscoresToTableData(data) {
            var formattedData = [];
            for (var i = 0; i < data.length; i++) {
                var newObj = {};
                for (var key in data[i]) {
                    newObj[$filter("replaceSpaces")(key)] = $filter("replaceSpaces")(data[i][key]);
                }
                formattedData.push(newObj);
            }

            return formattedData;
        }

        /**
         * @name removeDuplicateData
         * @param data
         * @desc takes in table format data (array of object) and removes the underscores and uris from the headers and instance values
         * @returns [Object] cleaned data
         */
        function removeDuplicateData(data) {
            //if no dataTableAlign, we don't want to try and make the values unique
            if (!data.dataTableAlign) {
                return data.data;
            }
            var label = data.dataTableAlign.label || data.dataTableAlign['dim 0'];

            return _.uniqBy(data.data, label);
        }

        return {
            createDataFilterModel: createDataFilterModel,
            filterDataWithFilterOptions: filterDataWithFilterOptions,
            generateHeaders: generateHeaders,
            filterTableUriData: filterTableUriData,
            formatTableData: formatTableData,
            removeDuplicateData: removeDuplicateData,
            addUnderscoresToTableData: addUnderscoresToTableData
        };
    }
})();