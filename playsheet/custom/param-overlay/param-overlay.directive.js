(function () {
    'use strict';

    /**
     * @name param-overlay.directive.js
     * @desc param-overlay shows available parameters for a visualization
     */
    angular.module('app.param-overlay.directive', [])
        .directive('paramOverlay', paramOverlay);

    paramOverlay.$inject = ['$rootScope', 'alertService', 'dataService', '$filter', 'pkqlService', 'monolithService'];

    function paramOverlay($rootScope, alertService, dataService, $filter, pkqlService, monolithService) {

        paramOverlayCtrl.$inject = ['$scope'];
        paramOverlayLink.$inject = ['scope', 'ele', 'attrs'];

        return {
            restrict: 'E',
            templateUrl: 'custom/param-overlay/param-overlay.directive.html',
            controller: paramOverlayCtrl,
            link: paramOverlayLink,
            scope: {},
            bindToController: {},
            controllerAs: 'paramOverlay'
        };

        function paramOverlayCtrl($scope) {
            var paramOverlay = this;

            //functions
            paramOverlay.hideParamOverlay = hideParamOverlay;
            paramOverlay.loadingWidgetScreenRun = loadingWidgetScreenRun
            paramOverlay.registerSelectedParam = registerSelectedParam;
            paramOverlay.initialize = initialize;
            paramOverlay.isSelected = isSelected;
            paramOverlay.loadMore = loadMore;
            paramOverlay.runParams = runParams;
            paramOverlay.disableRun = disableRun;
            paramOverlay.showRunBtn = showRunBtn;

            paramOverlay.paramOptions = {};

            /**
             * @name loadMore
             * @desc infinite scroll for the instances; this will push the next set of items
             */
            function loadMore() {
                //var optionsQuery = pkqlService.createParamOptionsGetter();
            }

            /**
             * @name hideParamOverlay
             * @desc toggle hiding and showing of the panel (the entire directive)
             */
            function hideParamOverlay() {
                dataService.toggleWidgetHandle(false);
            }

            function loadingWidgetScreenRun() {
                var loadingScreen = document.getElementById('param-overlay-loading-widget');

                loadingScreen.classList.add('param-overlay-loading-widget-show');
            }

            /**
             * @name isEqual
             * @param selected
             * @param instance
             * @desc checks to see if instance has been selected
             * @returns {boolean}
             */
            function isSelected(selected, instance) {
                //TODO ugh this needs to be fixed...selected values should be coming in as array
                if (Array.isArray(selected)) {
                    return JSON.stringify(selected) === JSON.stringify(instance) || _.indexOf(selected, instance) > -1;
                }

                return selected === instance; //if string
            }

            /**
             * @name registerSelectedParam
             * @params selectedOpt {object} the selected option
             * @params uri {string} the selected uri
             * @desc registers the selected parameter within the viz data service
             */
            function registerSelectedParam(selectedOpt, uri) {
                //TODO need to swap out old ways to using pkql
                if (paramOverlay.paramOptions[selectedOpt.type].param) {
                    //this is from old engine query...
                    if (selectedOpt) {
                        if (!Array.isArray(uri)) {
                            uri = [uri];
                        }

                        paramOverlay.paramOptions[selectedOpt.type].selected = uri;
                    }

                    var param = {
                        name: $filter("shortenValueFilter")(uri),
                        value: uri
                    };

                    dataService.selectParam(param, selectedOpt.type);
                } else {
                    //once we get rid of the old params, we shouldnt need this check anymore
                    if (!Array.isArray(uri)) {
                        uri = [uri];
                    }

                    //selecting and unselecting instances...
                    if (paramOverlay.paramOptions[selectedOpt.type].selected.indexOf(uri[0]) > -1) {
                        paramOverlay.paramOptions[selectedOpt.type].selected.splice(paramOverlay.paramOptions[selectedOpt.type].selected.indexOf(uri[0]), 1);
                    } else {
                        if (paramOverlay.paramOptions[selectedOpt.type].selectAmount === "1") {
                            paramOverlay.paramOptions[selectedOpt.type].selected = uri;
                        } else if (paramOverlay.paramOptions[selectedOpt.type].selectAmount === "0") {
                            paramOverlay.paramOptions[selectedOpt.type].selected = paramOverlay.paramOptions[selectedOpt.type].selected.concat(uri);
                        } else {
                            //we will remove the first instance in the list to replace with the last
                            if (paramOverlay.paramOptions[selectedOpt.type].selected.length === parseInt(paramOverlay.paramOptions[selectedOpt.type].selectAmount)) {
                                paramOverlay.paramOptions[selectedOpt.type].selected.splice(0, 1);
                            }

                            paramOverlay.paramOptions[selectedOpt.type].selected = paramOverlay.paramOptions[selectedOpt.type].selected.concat(uri);
                        }
                    }
                }
            }

            /**
             * @name runParams
             * @desc execute the pkql to set params
             */
            function runParams() {
                    var paramSelectedQuery = "", currentInsight = {}, currentWidget = {}, pkql = "";

                    for (var param in paramOverlay.paramOptions) {
                        paramSelectedQuery += pkqlService.createParamOptionsSelected(param, paramOverlay.paramOptions[param].selected);
                    }

                    if (!paramSelectedQuery) {
                        return; //none selected. need use alert?
                    }

                    //pkql += paramSelectedQuery;
                    currentInsight = dataService.getInsightData();

                    for (var pkqlIndex = 0; pkqlIndex < currentInsight.pkqlData.length; pkqlIndex++) {
                        //if the current pkql is user.input and the next one is NOT a user.input then we will insert the param pkqls in between.
                        //assuming all user.inputs are in the beginning and we insert the param pkqls right after all of the inputs
                        //TODO this means that we will need to display all of the params in the param modal at once.
                        if (currentInsight.pkqlData[pkqlIndex].command.indexOf("user.input") !== -1 && (currentInsight.pkqlData[pkqlIndex + 1] && currentInsight.pkqlData[pkqlIndex + 1].command.indexOf("user.input") === -1)) {
                            pkql += currentInsight.pkqlData[pkqlIndex].command;
                            pkql += paramSelectedQuery;
                            continue;
                        }

                        //we will not include previous param setters..we are overriding
                        //TODO assuming we will ALWAYS pass values for all parameters (when we have multiple params working)
                        var regex = /v:\s*\w+\s*=\s*'\w+'\s*/i; //[v:][any space][any letters][any space]['][any letters][any space][case insensitive]
                        if (currentInsight.pkqlData[pkqlIndex].command.match(regex)) {
                            continue; //won't add to the new recipe because we are overriding the old param setters
                        }

                        pkql += currentInsight.pkqlData[pkqlIndex].command;
                    }

                    //pkql = "v: Studio = user.input ( api: Movie_RDF . query ( [ c: Studio ] ) , 1 ) ;v:Studio='CBS';data.import ( api: Movie_RDF . query ( [ c: Title , c: Studio ] , ( [ c: Title , inner.join , c: Studio ] ) ) ) ; panel[0].viz ( Grid , [ ] ) ; ";

                    monolithService.clearPKQLQuery(currentInsight.insightId).then(function () {
                        //clear all our pkqls here...so we dont duplicate in the FE
                        dataService.clearPKQLData();
                        pkqlService.executePKQL(currentInsight.insightId, pkql)
                            .then(function (data) {
                                //set the selected value here
                                dataService.setInsightParams(paramOverlay.paramOptions);
                                hideParamOverlay();
                            });
                    });
            }

            /**
             * @name disableRun
             * @desc checks to make sure all required numbers of parameters have been selected before being able to run
             */
            function disableRun() {
                var disable = false;
                for (var param in paramOverlay.paramOptions) {
                    if (paramOverlay.paramOptions[param].selectAmount === "0") {
                        if (!(paramOverlay.paramOptions[param].selected.length > parseInt(paramOverlay.paramOptions[param].selectAmount))) {
                            disable = true;
                        }
                    }

                    if ((paramOverlay.paramOptions[param].selected.length - parseInt(paramOverlay.paramOptions[param].selectAmount) !== 0)) {
                        disable = true;
                    }
                }

                return disable;
            }

            //we need to differentiate between an old param (explore an instance) versus the new pkql param...
            /**
             * @name showRunBtn
             * @desc show/hide the button based on whether the param is coming from old way of doing params or new pkql param
             */
            function showRunBtn() {
                var show = true;
                for (var param in paramOverlay.paramOptions) {
                    if (paramOverlay.paramOptions[param].param) {
                        show = false;
                        break;
                    }
                }

                return show;
            }

            /**
             * @name initialize
             * @desc initializes the search directive. makes a call to return insights with an empty search term
             */
            function initialize() {
                var currentWidget = dataService.getWidgetData(),
                    insightData = dataService.getInsightData();

                //TODO shouldn't need this check once we move all params to insight and out of widgetdata
                if (insightData.params && !_.isEmpty(insightData.params)) {
                    paramOverlay.paramOptions = insightData.params;
                }
                else if (currentWidget.data.insightData.params && !_.isEmpty(currentWidget.data.insightData.params)) {
                    paramOverlay.paramOptions = currentWidget.data.insightData.params || {};
                    if (!_.isEmpty(paramOverlay.paramOptions)) {
                        for (var param in paramOverlay.paramOptions) {
                            paramOverlay.paramOptions[param].selectAmount = "1";
                        }
                    }
                    dataService.setInsightParams(paramOverlay.paramOptions);
                }
                else if (currentWidget.data.pkqlParams && !_.isEmpty(currentWidget.data.pkqlParams)) {
                    var paramName = '', selectAmount = 0;
                    for (var variable in currentWidget.data.pkqlParams) {
                        //TODO change name to what BE will call it
                        //TODO change options to what BE will call the instance options
                        paramName = currentWidget.data.pkqlParams[variable].varToSet;
                        selectAmount = currentWidget.data.pkqlParams[variable].selectAmount;

                        paramOverlay.paramOptions[paramName] = {
                            list: currentWidget.data.pkqlParams[variable].options,
                            selected: [],
                            isCollapsed: false,
                            type: paramName,
                            selectAmount: selectAmount
                        };
                    }
                    //now that we got the paramOptions, lets set it into the insight store
                    dataService.setInsightParams(paramOverlay.paramOptions);
                }
            }

            /*** on page load **/

            paramOverlay.initialize();
        }

        function paramOverlayLink(scope, ele, attrs) {
            var paramOverlayListener = $rootScope.$on('set-param-options', function (event, data) {
                if (data.payload.data.feData) { //coming from pkql
                    var insightId = dataService.getWidgetData().insightId, paramName = '', selectAmount = 0;
                    //FE data will include the variable we want to use to grab the options and then we can set it in this directive
                    //data.feData.data.var2define: [varToSet:"", options: "", selectAmount: "']
                    //TODO set up front-end to adjust for select amount. we're going to assume its always 1 for now...until BE can handle multiple
                    for (var variable in data.payload.data.feData.data.var2define) {
                        //TODO change name to what BE will call it
                        //TODO change options to what BE will call the instance options
                        paramName = data.payload.data.feData.data.var2define[variable].varToSet;
                        selectAmount = data.payload.data.feData.data.var2define[variable].selectAmount;
                        scope.paramOverlay.paramOptions[paramName] = {
                            list: data.payload.data.feData.data.var2define[variable].options,
                            selected: [],
                            isCollapsed: false,
                            type: paramName,
                            selectAmount: selectAmount
                        };
                    }
                    //now that we got the paramOptions, lets set it into the insight store
                    dataService.setInsightParams(scope.paramOverlay.paramOptions);
                } else { //returning from running a db query rather than pkql...we will eventually switch completely to pkql once that is fully setup/integrated
                    for (var param in data.payload.data) {
                        scope.paramOverlay.paramOptions[data.payload.data[param].name].list = data.payload.data[param].list;
                        scope.paramOverlay.paramOptions[data.payload.data[param].name].selected = [];
                        scope.paramOverlay.paramOptions[data.payload.data[param].name].isCollapsed = false;
                    }
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying related....');
                paramOverlayListener();
            });
        }
    }
})
    ();