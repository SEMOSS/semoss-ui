(function () {
    'use strict';

    /**
     * @name widget
     * @desc widget directive used for containing visualization components
     */
    angular.module('app.widget.directive', [])
        .directive('widget', widget);

    widget.$inject = ['$rootScope', '_', 'dataService', 'pkqlService', 'widgetConfigService', '$timeout'];

    function widget($rootScope, _, dataService, pkqlService, widgetConfigService, $timeout) {

        widgetCtrl.$inject = ['$scope'];
        widgetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

        return {
            restrict: 'E',
            scope: {},
            controller: widgetCtrl,
            link: widgetLink,
            bindToController: {
                embed: "=?",
                settings: "=?",
                originWidgetId: "=?"
            },
            controllerAs: 'widget',
            templateUrl: 'standard/widget/widget.directive.html'
        };

        function widgetCtrl($scope) {
            var widget = this;

            //variables
            widget.contentLoading = false;
            widget.contentLoadingMessage = 'Loading...';
            widget.loadingScreenCounter = 0;
            widget.widgetMenuOpen = false;
            widget.collapsed = false;
            widget.handleSearchTerm = "";
            widget.widgetHandles = [];
            widget.activeHandleContent = "";

            //functions
            widget.updateWidget = updateWidget;
            widget.setActiveHandleContent = setActiveHandleContent;
            widget.relatedGlow = relatedGlow;
            widget.collapseWidgets = collapseWidgets;
            widget.toggleWidgetMenuButton = toggleWidgetMenuButton;
            widget.toggleUndoButton = toggleUndoButton;
            widget.widgetGroupClicked = widgetGroupClicked;
            widget.pinHandle = pinHandle;
            widget.configureWidgetHandles = configureWidgetHandles;

            /**
             * @name updateWidget
             */
            function updateWidget() {
                widget.widgetContent = widgetConfigService.getVizDirectiveElement(widget.widgetData.data.chartData.layout);

                $rootScope.$emit('chart-receive', 'change-chart-mode', {
                    mode: widget.widgetData.mode
                });
            }

            /**
             * @name setActiveHandleContent
             * @param {String} handle -active handle
             * @desc sets the content for the active widget handle
             */
            function setActiveHandleContent(handle) {
                if (!handle) {
                    widget.widgetData.selectedHandle = "";
                    widget.activeHandleContent = "";
                } else {
                    widget.widgetData.selectedHandle = handle;
                    if (!(handle === 'default' || handle === 'edit' || handle === 'comment' || handle === 'brush')) {
                        widget.activeHandleContent = widgetConfigService.getWidgetHandleContent(handle);
                        widget.widgetMenuOpen = false;
                    }
                }
            }

            /**
             * @name relatedGlow
             * @desc pulse the related insights notification
             */
            function relatedGlow() {
                widget.widgetData.relatedGlow = true;
            }

            /**
             * @name collapseWidgets
             */
            function collapseWidgets() {
                widget.collapsed = !widget.collapsed;
            }

            /**
             * @name toggleWidgetMenuButton
             * @desc controls what happens when the settings button is clicked
             */
            function toggleWidgetMenuButton() {
                widget.widgetMenuOpen = !widget.widgetMenuOpen;
            }

            /**
             * @name toggleUndoButton
             * @desc controls what happens when the undo button is clicked
             */
            function toggleUndoButton() {
                if (widget.activeHandleContent !== "") {
                    dataService.toggleWidgetHandle('');
                }
                widget.widgetMenuOpen = false;
            }

            /**
             * @name widgetGroupClicked
             * @param {String} title group title
             * @desc controls what happens when a widget group is clicked
             */
            function widgetGroupClicked(title) {
                widget.widgetHandleGroups[title].selected = !widget.widgetHandleGroups[title].selected;

                //check to see selected values
                var selectedHandles = [];
                for (var i = 0; i < widget.widgetHandles.length; i++) {
                    for (var j = 0; j < widget.widgetHandles[i].groups.length; j++) {
                        var group = widget.widgetHandles[i].groups[j];
                        if (widget.widgetHandleGroups[group] && widget.widgetHandleGroups[group].selected && selectedHandles.indexOf(widget.widgetHandles[i]) === -1) {
                            selectedHandles.push(widget.widgetHandles[i]);
                        }
                    }
                }

                if (selectedHandles.length === 0) {
                    widget.displayHandles = widget.widgetHandles;
                } else {
                    widget.displayHandles = selectedHandles;
                }

            }

            /**
             * @name pinHandle
             * @param {String} [handleName] [name of handle]
             * @desc pins a widget handle to the quick access menu
             */
            function pinHandle(handleName) {
                widgetConfigService.pinHandle(handleName);
            }

            /**
             * @name configureWidgetHandles
             * @param {String} layout
             * @desc sets the widgetHandles
             */
            function configureWidgetHandles(layout) {
                widget.widgetHandles = widgetConfigService.getWidgetsForLayout(layout);

                //set up display handles
                widget.displayHandles = [];
                for (var i = 0; i < widget.widgetHandles.length; i++) {
                    widget.displayHandles.push(widget.widgetHandles[i])
                }
            }

            /**
             * @name initialize
             * @desc draws widget on load
             * @todo 1 - refactor the widget handles piece. need to tie this to each insight
             * @todo 2 - transfer tools to widget handles
             */
            function initialize() {
                widget.widgetData = dataService.getWidgetData();
                widget.widgetHandleGroups = widgetConfigService.getWidgetHandleGroups();

                var layout = widget.widgetData.data.chartData.layout;
                widget.configureWidgetHandles(layout);

                //TODO fix this so that hasParams is set correctly...or just bring it out of widget and put in store.insights
                widget.widgetData.hasParams = (dataService.getInsightData().params && !_.isEmpty(dataService.getInsightData().params)) || widget.widgetData.hasParams;

                setActiveHandleContent(widget.widgetData.selectedHandle);
                updateWidget();
            }

            initialize();
        }

        function widgetLink(scope, ele, attrs, ctrl) {
            //listeners for each widget
            //TODO Breakout Further
            var widgetUpdateListener = $rootScope.$on('update-widget', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-widget');
                scope.widget.widgetData = dataService.getWidgetData();
                //set handles
                var layout = scope.widget.widgetData.data.chartData.layout;
                scope.widget.configureWidgetHandles(layout);
                scope.widget.setActiveHandleContent(scope.widget.widgetData.selectedHandle);
                //TODO fix this so that hasParams is set correctly...or just bring it out of widget and put in store.insights
                scope.widget.widgetData.hasParams = (dataService.getInsightData().params && !_.isEmpty(dataService.getInsightData().params)) || scope.widget.widgetData.hasParams;
                scope.widget.updateWidget();
            });

            var widgetListener = $rootScope.$on('widget-receive', function (event, message, data) {
                if (message === 'loading-screen') {
                    if (message !== 'loading-screen') {
                        console.log('%cPUBSUB:', "color:blue", message, data);
                    }

                    if (data.payload.message) {
                        scope.widget.contentLoadingMessage = data.payload.message;
                    }

                    if (data.payload.show === true) {
                        scope.widget.loadingScreenCounter++;
                    } else {
                        scope.widget.loadingScreenCounter = Math.max(--scope.widget.loadingScreenCounter, 0);//Can't have a negative counter
                    }

                    if (scope.widget.loadingScreenCounter === 0) {
                        scope.widget.contentLoading = false;
                    } else {
                        scope.widget.contentLoading = true;
                    }

                } else if (message === "on-handle-toggled") {
                    var currentWidget = dataService.getWidgetData();
                    scope.widget.setActiveHandleContent(currentWidget.selectedHandle);
                    scope.widget.widgetData.mode = currentWidget.mode;
                    if(currentWidget.defaultHandleOn) {
                        scope.widget.activeHandleContent = widgetConfigService.getWidgetHandleContent(data.handle);
                        scope.widget.widgetMenuOpen = false;
                        $rootScope.$emit("default-handle-receive", "update-inputs");
                    }

                } else if (message === "related-panel-insights-retrieved") {
                    /*if (scope.widget.widgetData.data.chartData && scope.widget.widgetData.data.chartData.layout === 'Graph') {

                     //TODO do we still want to run related insights in forcegraph or just toggle the traverse?
                     //if yes remove the return
                     return;
                     }
                     if (scope.widget.widgetData.selectedHandle !== 'widget') {
                     dataService.toggleWidgetHandle(scope.widget.sheetId, scope.widget.widgetId, 'widget');
                     }*/
                    scope.widget.widgetData.relatedInsightsCount = data.relatedInsightsNum;
                    scope.widget.relatedGlow();

                } else if (message === "update-widget-side-bar") {
                    scope.widget.widgetData.sideBarView = data.mode;
                } else if(message === 'toggle-widget-handle') {
                    dataService.toggleWidgetHandle(data);
                } else if(message === 'generate-clone-query') {
                    var currentWidget = dataService.getWidgetData();
                    if (currentWidget.panelId == '0') {
                        pkqlService.generateQueryInParent('clone');
                    }
                } else if(message === 'default-widget-click') {
                    if(data.uiOptionsUpdate) {
                        var currentWidget = dataService.getWidgetData(),
                            uiOptions = currentWidget.data.chartData.uiOptions;

                        if(data.value) {
                            uiOptions[data.label] = data.value;
                        } else {
                            uiOptions[data.label] = !uiOptions[data.label];
                        }

                        //TODO find a MUCH better way to do force lock
                        if(data.label === 'graphLockToggle') {
                            var fn = '';
                            if (currentWidget.data.chartData.uiOptions.graphLockToggle) {
                                fn = 'freezeAllNodes'
                            } else {
                                fn = 'unFreezeAllNodes'
                            }

                            var toolObjectConfig = {
                                'fn': fn,
                                'args': [],
                                'uiOptions': currentWidget.data.chartData.uiOptions
                            };
                            dataService.setUiOptions(currentWidget.data.chartData.uiOptions);
                            if (currentWidget.data.chartData.layout === 'VivaGraph') {
                                toolObjectConfig.fn = "toggleLayout";
                                toolObjectConfig.args = currentWidget.data.chartData.uiOptions.graphLockToggle;
                            }
                            dataService.runToolFunction(toolObjectConfig);
                            return;
                        }


                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, uiOptions);
                        widgetConfigService.updateDefaultWidgetPkql(data.label, toolQuery);
                        dataService.toggleWidgetHandle(data.label);
                    }
                } else if(message === 'export-to-csv') {
                    dataService.exportToCSV();
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying widget....');
                widgetUpdateListener();
                widgetListener();
            });
        }
    }
})();