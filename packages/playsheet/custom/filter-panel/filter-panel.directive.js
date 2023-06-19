(function () {
    'use strict';

    /**
     * @name filter-panel
     * @desc filters tabular data - accessible through the left panel
     */
    angular.module('app.filter-panel.directive', [])
        .directive('filterPanel', filterPanel);

    filterPanel.$inject = ['$rootScope', 'filterService', 'dataService', 'pkqlService'];

    function filterPanel($rootScope, filterService, dataService, pkqlService) {

        filterPanelCtrl.$inject = ["$rootScope", "_"];
        filterPanelLink.$inject = ["scope", "ele", "attrs", "controllers"];

        return {
            restrict: 'EA',
            scope: {},
            require: [],
            controllerAs: 'filterPanel',
            bindToController: {
            },
            templateUrl: 'custom/filter-panel/filter-panel.directive.html',
            controller: filterPanelCtrl,
            link: filterPanelLink
        };

        function filterPanelCtrl(_) {
            var filterPanel = this,
                backendFilter = false;

            //functions
            filterPanel.updateFilter = updateFilter;
            filterPanel.applyFilter = applyFilter;
            filterPanel.toggleOption = toggleOption;
            filterPanel.filterItemSelect = filterItemSelect;
            filterPanel.selectAll = selectAll;
            filterPanel.toggleSlider = toggleSlider;

            function updateFilter() {
                if (filterPanel.selectedGroupedData.chartData.insightID) {
                    if (!filterPanel.selectedGroupedData.filter) {
                        filterService.createFilterOptions(filterPanel.selectedGroupedData.chartData).then(function (newFilter) {


                            filterPanel.selectedGroupedData.filter = {
                                options: newFilter.filters,
                            };

                            filterPanel.filter = JSON.parse(JSON.stringify(filterPanel.selectedGroupedData.filter.options));


                            //TODO: save filter in sheet?

                        })
                    }
                    else {
                        filterPanel.filter = JSON.parse(JSON.stringify(filterPanel.selectedGroupedData.filter.options));
                    }
                }
            }

            /**
             * @name applyFilter
             * @desc takes current filter options and sends them to sheet to update visualization data
             */
            function applyFilter(header) {
                var filterPKQL = pkqlService.generateFilterQuery(filterPanel.filter, header);
                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, filterPKQL);
            }

            /**
             * @name toggleOption
             * @param key
             * @param opt
             * @desc toggles the filter dropdowns for each column header
             */
            function toggleOption(key, opt) {
                opt.isCollapsed = !opt.isCollapsed;

                //close all other panels
                for (var column in filterPanel.filter) {
                    if (column !== key) {
                        //filterPanel.selectedGroupedData.filter.options[key].isCollapsed = true;
                        filterPanel.filter[column].isCollapsed = true;
                    }
                }
            }

            /**
             * @name filterItemSelect
             * @param key
             * @param opt
             * @desc when an item is selected, it will set its value to the opposite of the current value and then correctly set if selectAll is true or false
             */
            function filterItemSelect(key, opt) {
                opt.selected = !opt.selected;

                //correctly set selectAll boolean
                var selectAll = true;
                for (var i = 0; i < filterPanel.filter[key].list.length; i++) {
                    if (!filterPanel.filter[key].list[i].selected) {
                        selectAll = false;
                        break
                    }
                }


                filterPanel.filter[key].selectAll = selectAll;
            }

            /**
             * @name selectAll
             * @param key
             * @desc Updates the boolean value for selectAll, updates the rest of the list items accordingly
             */
            function selectAll(key) {
                filterPanel.filter[key].selectAll = !filterPanel.filter[key].selectAll;

                var listLength = filterPanel.filter[key].list.length;
                for (var i = 0; i < listLength; i++) {
                    filterPanel.filter[key].list[i].selected = filterPanel.filter[key].selectAll
                }
            }

            function toggleSlider(header) {
                filterPanel.filter[header].useSlider = !filterPanel.filter[header].useSlider;
                // if(filterPanel.filter[header].useSlider) {
                //     filterPanel.filter[header].selectAll = false;
                // }
            }
        }

        function filterPanelLink(scope, ele, attrs, ctrl) {
            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                // scope.filterPanel.selectedGroupedData = scope.filterPanel.widgetGroupedData;
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.filterPanel.currentWidgetData = currentWidget;
                    scope.filterPanel.selectedGroupedData = currentWidget.data;
                }

                if (scope.filterPanel.selectedGroupedData) {
                    scope.filterPanel.updateFilter();
                }
            }

            initialize();


            //listeners
            var filterPanelUpdateListener = $rootScope.$on('update-data', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-data');
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.filterPanel.currentWidgetData = currentWidget;
                    scope.filterPanel.selectedGroupedData = currentWidget.data;
                }

                if (scope.filterPanel.selectedGroupedData) {
                    scope.filterPanel.updateFilter();
                }
                
            });
            
            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying filterPanel...');
                filterPanelUpdateListener();
            });
        }

    }
})();
