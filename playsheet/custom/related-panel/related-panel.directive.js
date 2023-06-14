(function () {
    'use strict';

    /**
     * @name related-panel.directive.js
     * @desc related-panel shows the related insights list for a given data point
     */
    angular.module('app.related-panel.directive', [])
        .directive('relatedPanel', relatedPanel);

    relatedPanel.$inject = ['$rootScope', '$q', '$filter', 'alertService', 'vizdataService', 'nameServerService', 'permissionsService', 'dataService', 'widgetConfigService'];

    function relatedPanel($rootScope, $q, $filter, alertService, vizdataService, nameServerService, permissionsService, dataService, widgetConfigService) {

        relatedPanelCtrl.$inject = ['_'];
        relatedPanelLink.$inject = ['scope', 'ele', 'attrs'];

        return {
            restrict: 'E',
            templateUrl: 'custom/related-panel/related-panel.directive.html',
            controller: relatedPanelCtrl,
            link: relatedPanelLink,
            scope: {},
            bindToController: {
            },
            controllerAs: 'related'
        };

        function relatedPanelCtrl(_) {
            var related = this;
            var DEFAULT_SEARCH_STRING = "*:*"; //solr select all
            var resultsNumFound = 0;

            related.selectedData = null;//data of the selected viz

            related.insightResults = [];
            related.groupedInsightData = {};
            related.facetOptions = {};
            related.selectedInsight = {};
            related.vizFacetLimit = 11;
            related.setNumInsights = 5;
            related.filterInput = "";
            related.showFacets = false;
            related.showSearch = false;
            related.selectedItem = [];

            //main configuration object for the search back-end call
            related.filterData = {};

            //limit and offset for infinite scroll
            related.relatedLimit = 20;
            related.relatedOffset = 0;

            //list of visualizations to filter by
            related.vizFacetList = [
                {label: "Grid", selected: false, enabled: true},
                {label: "Graph", selected: false, enabled: true},
                {label: "Column", selected: false, enabled: true},
                {label: "HeatMap", selected: false, enabled: true},
                {label: "Scatter", selected: false, enabled: true},
                {label: "ParallelCoordinates", selected: false, enabled: true},
                {label: "Pie", selected: false, enabled: true},
                {label: "WorldMap", selected: false, enabled: true},
                {label: "Line", selected: false, enabled: true},
                {label: "Dendrogram", selected: false, enabled: true},
                {label: "Other", selected: false, enabled: true}
            ];

            //Functions
            related.hideRelated = hideRelated;
            related.showFacetPane = showFacetPane;
            related.getRelatedInsights = getRelatedInsights;
            related.getMoreRelatedInsights = getMoreRelatedInsights;
            related.facetSelected = facetSelected;
            related.vizLayoutFacetSelected = vizLayoutFacetSelected;
            related.clearSelectedFacets = clearSelectedFacets;
            related.createViz = createViz;
            related.getVizSvg = getVizSvg;
            related.getVizDisabledStatus = getVizDisabledStatus;
            related.updateSecurity = updateSecurity;
            related.checkEnginePermission = checkEnginePermission;
            related.addEngineAccessRequest = addEngineAccessRequest;
            related.disableRequest = disableRequest;

            /**
             * @name hideRelated
             * @desc toggle hiding and showing of the panel (the entire directive)
             */
            function hideRelated() {
                dataService.toggleWidgetHandle(false);
            }

            /**
             * @name showFacetPane
             * @desc toggles the search bar's facet pane open or closed
             */
            function showFacetPane() {
                related.showFacets = !related.showFacets;
            }

            /**
             * @name getRelatedInsights
             * @desc gets related insights list for the selected item
             */
            function getRelatedInsights() {
                var currentWidget = dataService.getWidgetData(),
                    currentInsight = dataService.getInsightData();

                var selectedItem = currentInsight.selected.data,
                    data = currentInsight.selected.related;

                var uriArray = _.map(selectedItem, 'uri');
                related.filterData = {}; //clear the facet information
                resetInfScroll();
                related.selectedItem = uriArray;
                related.selectedConcept = $filter('shortenAndReplaceUnderscores')(uriArray[0]);

                var facetData = data.facet;
                var relatedInsightData = data.results;
                resultsNumFound = data.numFound;

                if (!_.isEmpty(relatedInsightData)) {
                    related.insightResults = relatedInsightData;
                    related.enableRelatedInsights = true;
                } else {
                    alertService('No related insights', 'Alert', 'toast-info', 5000);
                    //disable the related pane
                    related.enableRelatedInsights = false;
                }

                related.facetOptions = {};
                //create facetOptions Object
                for (var key in facetData) {
                    //need to convert solr speak here "core_engine ==> Database"
                    var displayName = "";
                    if (key === "core_engine") {
                        displayName = "Databases";
                    } else if (key === "layout") {
                        displayName = "Layouts";
                    } else if (key === "params") {
                        displayName = "Parameters";
                    } else if (key === "tags") {
                        displayName = "Tags";
                    } else if (key === "algorithms") {
                        displayName = "Algorithms";
                    }
                    related.facetOptions[key] = {
                        "list": [],
                        //"displayName": displayName,
                        "showLimit": related.facetShowLimit,
                        "showMore": true
                    };
                    if (key !== "layout") {
                        for (var facet in facetData[key]) {
                            var facetModel = {
                                "label": facet,
                                "count": facetData[key][facet],
                                "selected": false
                            };
                            related.facetOptions[key].list.push(facetModel);
                        }
                    } else {
                        var otherFacetModel = {
                            "label": [],
                            "count": 0,
                            "selected": false
                        };
                        for (var facet in facetData[key]) {
                            var facetModel = {
                                "label": facet,
                                "count": facetData[key][facet],
                                "selected": false
                            };
                            if (related.getVizSvg(facet) === "resources/img/svg/-svg-icon.svg") {
                                otherFacetModel.label.push(facet);
                                otherFacetModel.count += facetData[key][facet];
                            } else {
                                related.facetOptions[key].list.push(facetModel);
                            }
                        }
                        related.facetOptions[key].list.push(otherFacetModel);
                    }
                }
            }

            /**
             * @name resetInfScroll
             * @desc reset the limit & offset for scroll as a new list is being generated here
             */
            function resetInfScroll() {
                related.relatedLimit = 20;
                related.relatedOffset = 0;
            }

            /**
             * @name getMoreInsights
             * @desc Activated when a facet is selected, creates an appropriate config and returns insights from the backend (based on the selections)
             */
            function getMoreRelatedInsights() {
                if (related.relatedOffset > resultsNumFound) {
                    return;
                }
                related.resultsPaneLoadingScreen = true;
                related.relatedOffset = related.relatedOffset + related.relatedLimit;
                var nameServerArray = nameServerService.getNameServerInfo();
                var arrayServices = [];
                for (var i = 0; i < nameServerArray.length; i++) {
                    if (nameServerArray[i].isconsumed) {
                        arrayServices.push(nameServerService.retrieveSelectedURIContextInsights(related.selectedData.data.insightData.core_engine,
                            related.selectedData.data.insightData.layout, related.selectedItem, nameServerArray[i].url, nameServerArray[i].webapp,
                            related.filterData, related.relatedLimit, related.relatedOffset));
                    }
                }
                $q.all(arrayServices).then(function (data) {
                    if (data[0].status === 500) {
                        var error = data[0];
                        var etext = "Related insights error";
                        if (error.data && error.data.errorMessage) {
                            etext = error.data.errorMessage;
                        }
                        alertService(etext, 'Error', 'toast-error', 5000);
                        return;
                    }
                    //reset and repopulate the related insights list
                    var relatedInsightData = data[0].results;
                    resultsNumFound = data[0].numFound;

                    for (var i = 0; i < relatedInsightData.length; i++) {
                        related.insightResults.push(relatedInsightData[i]);
                    }
                    related.insightResults = _.uniq(related.insightResults);
                    related.resultsPaneLoadingScreen = false;
                }, function (error) {
                    related.resultsPaneLoadingScreen = false;
                    alertService('Issue retrieving related insights results', 'Error', 'toast-error', 3000);
                });
            }

            /**
             * @name facetSelected
             * @desc Activated when a facet is selected, creates an appropriate config and returns insights from the backend (based on the selections)
             */
            function facetSelected() {
                resetInfScroll();
                //set the search config appropriately based on the selected facets
                _.forEach(related.facetOptions, function (values, categoryKey) {
                    if (categoryKey !== "layout") {
                        if (values.list.length > 0 && _.includes(_.map(values.list, "selected"), true)) {
                            var category = categoryKey;
                            //initialize the category list as an empty array
                            related.filterData[category] = [];
                            _(values.list).forEach(function (facetObject) {
                                //first check if the option is already in the list & the selected indidcator is false...if so remove the option
                                if (_.includes(related.filterData[category], facetObject.label) && !facetObject.selected) {
                                    related.filterData[category] = _.without(related.filterData[category], facetObject.label);
                                } else if (facetObject.selected) {
                                    //add the selected option to the search config object
                                    if (_.isArray(facetObject.label)) {
                                        related.filterData[category] = related.filterData[category].concat(facetObject.label);
                                    } else {
                                        related.filterData[category].push(facetObject.label);
                                    }
                                }
                            });
                        } else { //if none of the values are selected, remove the key from the filterData object
                            related.filterData = _.omit(related.filterData, categoryKey);
                        }
                    }
                });
                //make a service call to get the filtered list of insights
                var nameServerArray = nameServerService.getNameServerInfo();
                var arrayServices = [];
                for (var i = 0; i < nameServerArray.length; i++) {
                    if (nameServerArray[i].isconsumed) {
                        arrayServices.push(nameServerService.retrieveSelectedURIContextInsights(related.selectedData.data.insightData.core_engine,
                            related.selectedData.data.insightData.layout, related.selectedItem, nameServerArray[i].url, nameServerArray[i].webapp,
                            related.filterData, related.relatedLimit, related.relatedOffset));
                    }
                }
                $q.all(arrayServices).then(function (data) {
                    if (data[0].status === 500) {
                        var error = data[0];
                        var etext = "Related insights error";
                        if (error.data && error.data.errorMessage) {
                            etext = error.data.errorMessage;
                        }
                        alertService(etext, 'Error', 'toast-error', 5000);
                        return;
                    }
                    //reset and repopulate the related insights list
                    var relatedInsightData = data[0].results;
                    resultsNumFound = data[0].numFound;

                    related.insightResults = relatedInsightData;
                    related.contentLoadingScreen = false;
                }, function (error) {
                    related.contentLoadingScreen = false;
                    alertService('Issue retrieving related insights results', 'Error', 'toast-error', 3000);
                });
            }

            /**
             * @name vizLayoutFacetSelected
             * @desc Activated when a facet is selected from the side menu, creates an appropriate config and returns insights from the backend (based on the selections)
             */
            function vizLayoutFacetSelected() {
                resetInfScroll();
                related.contentLoadingScreen = true;
                var category = "layout";
                //initialize the category list as an empty array
                if (_.includes(_.map(related.vizFacetList, "selected"), true)) {
                    related.filterData["layout"] = [];
                    _.forEach(related.vizFacetList, function (facetObject) {
                        if (_.includes(related.filterData["layout"], facetObject.label) && !facetObject.selected) {
                            related.filterData["layout"] = _.without(related.filterData["layout"], facetObject.label);
                        } else if (facetObject.selected) {
                            //add the selected option to the search config object
                            var otherOptionArray = _.filter(related.facetOptions["layout"].list, function (opt) {
                                return Array.isArray(opt.label);
                            });
                            if (facetObject.label === "Other" && !_.isEmpty(otherOptionArray[0].label)) {
                                related.filterData["layout"] = related.filterData["layout"].concat(otherOptionArray[0].label);
                            } else {
                                related.filterData["layout"].push(facetObject.label);
                            }
                        }
                    });
                } else { //if none of the values are selected, remove the key from the filterData object
                    related.filterData = _.omit(related.filterData, "layout");
                }
                //make a service call to get the filtered list of insights
                var nameServerArray = nameServerService.getNameServerInfo();
                var arrayServices = [];
                for (var i = 0; i < nameServerArray.length; i++) {
                    if (nameServerArray[i].isconsumed) {
                        arrayServices.push(nameServerService.retrieveSelectedURIContextInsights(related.selectedData.data.insightData.core_engine,
                            related.selectedData.data.insightData.layout, related.selectedItem, nameServerArray[i].url, nameServerArray[i].webapp,
                            related.filterData, related.relatedLimit, related.relatedOffset));
                    }
                }
                $q.all(arrayServices).then(function (data) {
                    if (data[0].status === 500) {
                        var error = data[0];
                        var etext = "Related insights error";
                        if (error.data && error.data.errorMessage) {
                            etext = error.data.errorMessage;
                        }
                        alertService(etext, 'Error', 'toast-error', 5000);
                        return;
                    }
                    //reset and repopulate the related insights list
                    var relatedInsightData = data[0].results;
                    resultsNumFound = data[0].numFound;

                    related.insightResults = relatedInsightData;
                    related.contentLoadingScreen = false;
                }, function (error) {
                    related.contentLoadingScreen = false;
                    alertService('Issue retrieving related insights results', 'Error', 'toast-error', 3000);
                });
            }

            /**
             * @name clearSelectedFacets
             * @params category
             * @desc clears facet selections for a given category
             */
            function clearSelectedFacets(category) {
                //set all the checkboxes to false
                _.forEach(related.facetOptions[category].list, function (facetObject) {
                    facetObject.selected = false;
                });
                //clear the category from the filterData
                related.filterData = _.omit(related.filterData, category);
                //make a service call to get the filtered list of insights
                var nameServerArray = nameServerService.getNameServerInfo();
                var arrayServices = [];
                for (var i = 0; i < nameServerArray.length; i++) {
                    if (nameServerArray[i].isconsumed) {
                        arrayServices.push(nameServerService.retrieveSelectedURIContextInsights(related.selectedData.data.insightData.core_engine,
                            related.selectedData.data.insightData.layout, related.selectedItem, nameServerArray[i].url, nameServerArray[i].webapp,
                            related.filterData, related.relatedLimit, related.relatedOffset));
                    }
                }
                $q.all(arrayServices).then(function (data) {
                    if (data[0].status === 500) {
                        var error = data[0];
                        var etext = "Related insights error";
                        if (error.data && error.data.errorMessage) {
                            etext = error.data.errorMessage;
                        }
                        alertService(etext, 'Error', 'toast-error', 5000);
                        return;
                    }
                    //reset and repopulate the related insights list
                    var relatedInsightData = data[0].results;
                    resultsNumFound = data[0].numFound;

                    related.insightResults = relatedInsightData;
                    related.contentLoadingScreen = false;
                }, function (error) {
                    related.contentLoadingScreen = false;
                    alertService('Issue retrieving search results', 'Error', 'toast-error', 3000);
                });
            }

            /**
             * @name createViz
             * @params insight {object} the selected insight to create - selected by the user from the insight list
             * @desc send to core to handle creation of viz--through search for now until we break out to higher level for viz creation
             */
            function createViz(insight) {
                related.selectedInsight = insight;
                vizdataService.createViz(related.selectedInsight).then(function (output) {
                    if (output.state === "noParams") {
                        related.selectedInsight.params = {};
                        $rootScope.$emit('pub-sub-receive', 'add-new-widget', {
                            insightData: insight
                        });
                    }
                    else if (output.state === "notAllSelected") {
                        //param modal needs to show up
                        $rootScope.$emit('pub-sub-receive', 'create-viz', {
                            insight: insight
                        });
                    }
                    else if (output.state === "AllSelected") {
                        $rootScope.$emit('pub-sub-receive', 'add-new-widget', {
                            insightData: insight
                        });
                    }
                }, function (errMsg) {
                    related.mainLoadingScreen = false;
                    alertService(errMsg, "Error", "toast-error", 3000);
                });
            }

            /**
             * @name autoFillParam
             * @desc if the param chosen for related insights is included within the insight, select it
             */
            function autoFillParam() {
                for (var param in related.selectedInsight.params) {
                    for (var item in related.selectedItem) {
                        if (_.includes(related.selectedInsight.params[param].list, related.selectedItem[item])) {
                            related.selectedInsight.params[param].isCollapsed = true;
                            related.selectedInsight.params[param].selected = related.selectedItem[item];
                            vizdataService.registerSelectedParam(related.selectedInsight.params[param], related.selectedItem[item]);
                        }
                    }
                }
            }

            /**
             * @name getVizSvg
             * @desc gets the svg path from visualization service
             * @params layout {string} layout of selected viz
             * @returns {string} svg path
             */
            function getVizSvg(layout) {
                return widgetConfigService.getVizSvg(layout);
            }

            /**
             * @name getVizDisabledStatus
             * @desc returns if the viz is disabled
             * @params layout {string} layout of selected viz
             * @returns {Boolean}
             */
            function getVizDisabledStatus(layout) {
                return widgetConfigService.getVizDisabledStatus(layout)
            }


            /*** Security Functions **/
            function updateSecurity() {
                var securitySettings = permissionsService.getSecuritySettings();
                related.backendSecurity = securitySettings.backendSecurity;
                related.isAuthenticated = securitySettings.isAuthenticated;
                related.userData = securitySettings.userData;
                related.permissionsRequests = securitySettings.permissionsRequests;
                related.availableEngines = securitySettings.availableEngines;
                related.userPermissionRequests = securitySettings.userPermissionRequests;
            }

            function checkEnginePermission(databaseName) {
                if (!related.backendSecurity) {
                    return true; //all engines should be available if security is turned off
                }

                var availableEngine = false;
                for (var eng in related.availableEngines) {
                    if (related.availableEngines[eng].name === databaseName) {
                        availableEngine = true;
                        break;
                    }
                }

                return availableEngine;
            }

            function addEngineAccessRequest(engine) {
                permissionsService.addEngineAccessRequest(engine.name);
            }

            function disableRequest(databaseName) {
                if (!related.isAuthenticated || !related.backendSecurity) {
                    return true;
                }
                for (var i = 0; i < related.userPermissionRequests.length; i++) {
                    if (databaseName === related.userPermissionRequests[i]) {
                        return true;
                    }
                }
            }
        }

        function relatedPanelLink(scope, ele, attrs) {
            /**
             * @name initialize
             * @desc called on directive load to pull the widget data from dataService
             */
            function initialize() {
                var currentWidget = dataService.getWidgetData(),
                    currentInsight = dataService.getInsightData();
                if (currentWidget && currentWidget.data) {
                    scope.related.selectedData = currentWidget;
                }

                //if we have insights in getRelatedInsights
                if(!_.isEmpty(currentInsight.selected.related)) {
                    scope.related.getRelatedInsights();
                }

                scope.related.updateSecurity();
            }

            /*** on page load **/
            initialize();

            //listeners
            var relatedListener = $rootScope.$on('related-panel-receive', function (event, message, data) {
                if (message === 'update-security') {
                    console.log('%cPUBSUB:', "color:blue", message, data);
                    scope.related.updateSecurity();
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying related....');
                relatedListener();
            });
        }
    }
})();