(function () {
    'use strict';

    /**
     * @name data.service.js
     * @desc the data service is the central store of data across the web application.  It contains functions for retreiving and updating
     *      data for the various UI components (sheet, widget, sidebar, etc). Actions triggered within data service update necessary pieces
     *      of the app
     */
    angular.module('app.data.service', [])
        .factory('dataService', dataService);

    dataService.$inject = ['$rootScope', '$q', '$filter', 'widgetConfigService', 'utilityService', 'monolithService', 'vizdataService', 'alertService', '$timeout'];

    function dataService($rootScope, $q, $filter, widgetConfigService, utilityService, monolithService, vizdataService, alertService, $timeout) {
        /**Top Level Variables **/
        //store of data
        var store = {
            insights: {},
            widgets: {}
        };

        /*** Widget Level Variables **/
        var originWidgetId = 0, selectedWidget = false;

        /**
         * @name isSelectedWidget
         * @desc returns the selected widget boolean
         */
        function isSelectedWidget() {
            return selectedWidget;
        }

        /**
         * @name setSelectedWidget
         * @desc sets the selected widget boolean
         */
        function setSelectedWidget(bool) {
            selectedWidget = bool;
        }

        /**
         * @name setOriginWidgetId
         * @param id
         * @desc widget Id that is being kept in core
         */
        function setOriginWidgetId(id) {
            if (id || id === 0) {
                originWidgetId = id;
            }
        }

        /**
         * @name getOriginWidgetId
         * @returns {number}
         */
        function getOriginWidgetId() {
            return originWidgetId;
        }


        /**
         * @name setData
         * @param insightData
         * @desc sets insight data
         */

        function setData(insightData, widgetData) {
            //TODO RIGHT NOW THIS ONLY SETS THE DATA FROM THE PARENT. IDEALLY ALL OF THE DATA SETTING WILL GO THROUGH HERE

            var oldDataId = -1;
            if (store.insights) {
                oldDataId = store.insights.dataId;
            }

            //update insightStore -- this is a straight copy as there is one record maintained
            store.insights = insightData;

            if (widgetData) {
                var feDataToSend = false;

                if (insightData && insightData.feData) {
                    //grab original from widgets (otherwise this is a newly created widget)
                    if (store.widgets.panelId || store.widgets.panelId == 0) {
                        feDataToSend = insightData.feData[store.widgets.panelId];
                    } else {
                        feDataToSend = insightData.feData[widgetData.panelId];
                    }


                    //temp hack to pass in params
                    if (!feDataToSend && insightData.feData.data) {
                        feDataToSend = insightData.feData.data;
                    }
                }

                setWidgetData(widgetData, feDataToSend, (oldDataId !== store.insights.dataId), false);
            }
        }

        /*** Widget Data Level Functions ***/
        /**
         * @name setWidgetData
         * @param widgetData
         * @desc overrides the widgetData when we want to modify
         */
        function setWidgetData(widgetData, feData, updateTableData, repaintVisual) {
            //TODO RIGHT NOW THIS ONLY SETS THE DATA FROM THE PARENT. IDEALLY ALL OF THE DATA SETTING WILL GO THROUGH HERE


            var oldDataObj, newDataObj;

            //only grab from widgetData if necessary, otherwise use pkql feData
            if (!store.widgets.data) {
                oldDataObj = JSON.parse(JSON.stringify(widgetData.data));
                newDataObj = JSON.parse(JSON.stringify(widgetData.data));
            } else {
                oldDataObj = JSON.parse(JSON.stringify(store.widgets.data));
                newDataObj = JSON.parse(JSON.stringify(store.widgets.data));
            }


            if (feData) {
                if (feData.var2define) {
                    //this is a param so lets run the pkql
                    widgetData.selectedHandle = 'param';
                    newDataObj.pkqlParams = feData.var2define;
                }

                if (feData.chartData) {
                    if (feData.chartData.layout) {
                        newDataObj.chartData.layout = feData.chartData.layout;
                    }

                    if (!_.isEmpty(feData.chartData.dataTableKeys)) {
                        newDataObj.chartData.dataTableKeys = feData.chartData.dataTableKeys;
                        newDataObj.chartData.dataTableAlign = widgetConfigService.generateVisualOptions(feData.chartData.layout, feData.chartData.dataTableKeys);
                    }

                    if (!_.isEmpty(feData.chartData.dataTableValues)) {
                        var tempHeaders = [];
                        for (var j = 0; j < feData.chartData.dataTableKeys.length; j++) {
                            if (feData.chartData.dataTableKeys[j]) {
                                tempHeaders.push(feData.chartData.dataTableKeys[j].uri);
                            }
                        }

                        newDataObj.chartData = angular.extend(newDataObj.chartData, utilityService.formatTableData(tempHeaders, feData.chartData.dataTableValues, true));
                    }
                }

                if (feData.comments) {
                    //clean comments
                    for (var k in feData.comments) {
                        //convert comment to format used by jvComment
                        if (!feData.comments[k].closed) {
                            var newComment = {
                                commentId: feData.comments[k].commentId,
                                binding: JSON.parse(feData.comments[k].location.replace(/'/g, '"')),
                                commentText: feData.comments[k].text,
                                groupID: feData.comments[k].group,
                                type: feData.comments[k].type
                            };

                            newDataObj.comments.list[k] = newComment;
                        }

                        if (k > newDataObj.comments.maxId) {
                            newDataObj.comments.maxId = k;
                        }
                    }
                }

                if (feData.config) {
                    newDataObj.panelConfig = feData.config;
                }

                //add in look and feel
                if (feData.lookandfeel) {
                    newDataObj.lookandfeel = feData.lookandfeel;
                } else {
                    newDataObj.lookandfeel = {};
                }

                if (feData.tools && feData.tools[0] && feData.tools[0].defaultState) {
                    newDataObj.tools = feData.tools[0].defaultState;
                } else {
                    newDataObj.tools = {};
                }
            }

            if (newDataObj.chartData.headers && newDataObj.chartData.data && (typeof newDataObj.chartData.headers[0] !== 'object')) {
                newDataObj.chartData = angular.extend(newDataObj.chartData, utilityService.formatTableData(newDataObj.chartData.headers, newDataObj.chartData.data, true));
            }

            //if there is no store, it is new
            if (_.isEmpty(store.widgets)) {
                store.widgets = {
                    insightId: newDataObj.chartData.insightID,
                    data: newDataObj,
                    controlsConfig: widgetConfigService.getVizConfig(newDataObj.chartData.layout),
                    parameterOptions: createParameterList(newDataObj.insightData),
                    hasParams: !_.isEmpty(newDataObj.insightData.params),
                    widgetOverlay: false,
                    enableRelatedInsights: true,
                    includedInDashboard: false,
                    relatedDataPoint: '',
                    relatedInsightsCount: 0,
                    relatedGlow: false,
                    rowOffset: widgetData.rowOffset || {
                        start: 0,
                        end: -1
                    },
                    join: {
                        status: false,
                        list: [] //takes in objects, ex: {group: 0, siblings: [], type: ""}
                    },
                    panelId: widgetData.panelId,
                    mode: 'default',
                    selectedHandle: widgetData.selectedHandle, //TODO OPEN UP A SPECIFIC TYPE
                    activeWidgetContent: '',
                    consoleContext: 'PKQL',
                    consoleWidth: '50%'
                };

                $rootScope.$emit('widget-opened');
            } else {
                if (feData) {
                    //dataChecks
                    if (feData.chartData) {
                        if (!_.isEmpty(feData.chartData.dataTableValues)) {
                            updateTableData = false;
                            repaintVisual = true;
                        } else {
                            updateTableData = true;
                        }
                    }

                    if (feData.comments && !_.isEmpty(feData.comments)) {
                        repaintVisual = true;
                    }


                    if (feData.lookandfeel) {
                        repaintVisual = true;
                    }


                    if (feData.tools) {
                        repaintVisual = true;
                    }
                }


                //compare new and old to see if there is a need for a refresh
                //purely ment to refresh
                if (updateTableData) {
                    //TODO BAD REALLY bAD
                    var pkql = '';

                    //Add Panel Viz to The ENDcr
                    var selectedWidget = getWidgetData();
                    var panelIDVizString = 'panel[' + selectedWidget.panelId + '].viz';

                    var continueBool = true;
                    if (continueBool) {
                        var splitPKQLS = pkql.split(';');
                        for (var i = splitPKQLS.length - 1; i >= 0; i--) {
                            if (splitPKQLS[i].indexOf('panel.viz') > -1 || splitPKQLS[i].indexOf(panelIDVizString) > -1) {
                                if (splitPKQLS[i].indexOf('m:') > -1) {
                                    pkql += splitPKQLS[i];
                                }

                                continueBool = false;
                                break;
                            }
                        }
                    }

                    if (continueBool) {
                        var currentInsight = getInsightData();
                        pkqlStepLoop: for (var i = currentInsight.pkqlStep; i >= 0; i--) {
                            var splitPKQLs = [];
                            if (currentInsight.pkqlData && currentInsight.pkqlData[i] && currentInsight.pkqlData[i].command) {
                                splitPKQLs = currentInsight.pkqlData[i].command.split(';');
                            }
                            for (var j = splitPKQLs.length - 1; j >= 0; j--) {
                                if (splitPKQLs[j].indexOf('panel.viz') > -1 || splitPKQLs[j].indexOf(panelIDVizString) > -1) {
                                    pkql += splitPKQLs[j];

                                    continueBool = false;
                                    break pkqlStepLoop;
                                }
                            }
                        }
                    }

                    if (continueBool) {
                        if (selectedWidget.data.chartData && selectedWidget.data.chartData.dataTableKeys) {
                            var tempVisualQuery = panelIDVizString;
                            tempVisualQuery += '(';
                            tempVisualQuery += selectedWidget.data.chartData.layout;
                            tempVisualQuery += ',[';

                            for (var i = 0; i < selectedWidget.data.chartData.dataTableKeys.length; i++) {
                                if (selectedWidget.data.chartData.dataTableKeys[i].operation && !_.isEmpty(selectedWidget.data.chartData.dataTableKeys[i].operation)) {
                                    tempVisualQuery += selectedWidget.data.chartData.dataTableKeys[i].operation.formula + ',';
                                } else if (selectedWidget.data.chartData.dataTableKeys[i].varKey) {
                                    tempVisualQuery += 'c:' + selectedWidget.data.chartData.dataTableKeys[i].varKey + ','
                                }
                            }

                            if (tempVisualQuery[tempVisualQuery.length - 1] === ',') {
                                tempVisualQuery = tempVisualQuery.slice(0, -1);
                            }
                            tempVisualQuery += ']);';


                            pkql += tempVisualQuery;
                        }
                    }


                    pkql = pkql.trim();

                    if (pkql[pkql.length - 1] !== ';') {
                        pkql += ';';
                    }

                    //does nothing for create
                    if (selectedWidget.data.chartData.layout === 'create') {
                        setWidgetData(store.widgets, false, false, true);
                    } else if (selectedWidget.data.chartData.layout === 'Grid') {
                        var model = {
                            sortModel: {},
                            selectors: _.values(selectedWidget.data.chartData.dataTableAlign)
                        };

                        //TEMP
                        console.warn('Standardize this for every visualization');
                        //reset offset for grid + create
                        store.widgets.rowOffset = { start: 0, end: 500 };

                        monolithService.getNextTableData(model, selectedWidget.insightId, store.widgets.rowOffset.start, store.widgets.rowOffset.end).then(function (chartDataObj) {
                            //this updates the data directly  - done on purpose
                            store.widgets.data.chartData = angular.extend(store.widgets.data.chartData, chartDataObj);
                            setWidgetData(store.widgets, false, false, true);
                        });
                    } else if (selectedWidget.layout === 'Graph' || selectedWidget.layout === 'VivaGraph') {
                        monolithService.getGraphData(electedWidget.insightId).then(function (chartDataObj) {
                            store.widgets.data.chartData = angular.extend(store.widgets.data.chartData, chartDataObj);
                            setWidgetData(store.widgets, false, false, true);

                            return {};
                        }, function (err) {
                            console.log(err);

                            return {};
                        });
                    } else if (pkql) {
                        monolithService.runPKQLQuery(selectedWidget.insightId, pkql).then(function (data) {
                            var currentWidget = getWidgetData();
                            for (var i = 0; i < data.insights.length; i++) {
                                if (data.insights[i].feData[currentWidget.panelId]) {
                                    //recursion
                                    setWidgetData(currentWidget, data.insights[i].feData[currentWidget.panelId], false, false);
                                }
                            }
                        });
                    }
                } else {
                    //need to use a timeout to force a digest
                    var updateTimeout = $timeout(function () {
                        store.widgets.data = newDataObj;
                        if (repaintVisual) {
                            resetVizData(newDataObj, oldDataObj);
                        }
                        resetWidget();
                        resetData();
                        $timeout.cancel(updateTimeout);
                    });
                }
            }
        }

        /**
         * @name getWidgetData
         * @widget unique id of widget to be selected
         * @desc gets the selected widget's data
         */
        function getWidgetData() {
            return store.widgets ? JSON.parse(JSON.stringify(store.widgets)) : {};
        }


        /**
         * @name setInsightParams
         * @param params
         * @desc setting the param data at the insight level {Title: {selected: [...], list: [...]}, Studio: {selected: [...], list: [...]}}
         */
        function setInsightParams(params) {
            store.insights.params = params;
            if (!_.isEmpty(store.insights.params)) {
                store.widgets.hasParams = true;
            }
        }

        /**
         * @name getInsightData
         * @desc returns the insight data related to the widget
         */
        function getInsightData() {
            return store.insights ? JSON.parse(JSON.stringify(store.insights)) : {};
        }

        /**
         * @name clearPKQLData
         * @desc clears all the pkql data
         */
        function clearPKQLData() {
            store.insights.pkqlData = [];
        }

        /**
         * @name resetWidget
         * @desc resets widget with new data
         */
        function resetWidget() {
            $rootScope.$emit('update-widget');
        }

        /**
         * @name showWidgetLoadScreen
         * @desc shows the widget load screen when pkql is executing
         */
        function showWidgetLoadScreen(boolean, message) {
            $rootScope.$emit('widget-receive', 'loading-screen', {
                payload: { show: boolean, message: message }
            });
        }

        /**
         * @name toggleWidgetHandle
         * @param {String} handle handle to toggle
         * @desc triggered when a widget handle is selected
         */
        function toggleWidgetHandle(handle) {
            //get the current widget and select the handle
            var currentWidget = store.widgets;

            if (currentWidget.selectedHandle === handle) {
                currentWidget.selectedHandle = '';
            } else {
                currentWidget.selectedHandle = handle;
            }

            //TODO separate this logic out...
            //if the handle corresponds to a 'mode', set the mode on the current widget
            if (handle === 'default' || handle === 'edit' || handle === 'comment' || handle === 'brush') {
                //toggle buttons, if you click the button you are already on, jump to default mode
                if (currentWidget.mode === handle) {
                    currentWidget.mode = 'default';
                } else {
                    currentWidget.mode = handle;
                }
                $rootScope.$emit('chart-receive', 'change-chart-mode', {
                    mode: currentWidget.mode
                });
            }

            if (handle === 'csv') {
                exportToCSV();
            }


            //TODO this is refreshing the entire widget.widgetData...we only need to set the new widget.selectedHandle and call resetWidget as appropriate
            $rootScope.$emit('widget-receive', 'on-handle-toggled', { handle: handle });
        }

        /**
         * @name setDefaultHandle
         * @param bool
         * @desc sets the default handle to true so we create the default handle html when toggling off
         */
        function setDefaultHandle(bool) {
            store.widgets.defaultHandleOn = bool;
        }

        /*** Pure Data Level Functions **/
        /**
         * @name updateData
         * @param config
         * @desc called whenever selected data changes, used for visual type changes
         */
        function updateData(config) {
            //Check if updateData Need to Be Removed
            getData(config);
        }

        /**
         * @name updatePKQL
         * @param pkqlData
         * @param navigation
         * @desc called whenever a PKQL command executes (saves the value)
         */
        function updatePKQL(pkqlData, navigation) {
            var oldInsight = JSON.parse(JSON.stringify(store.insights));

            //update insightId
            store.insights.insightId = pkqlData.insightID;

            //update dataId
            store.insights.dataId = pkqlData.dataID;

            //update feData
            store.insights.feData = pkqlData.feData;

            //update pkqlData
            if (navigation === 'backward') {
                store.insights.pkqlStep = pkqlData.pkqlData.length - 1;
            } else if (navigation === 'forward') {
                store.insights.pkqlStep = store.insights.pkqlStep + pkqlData.pkqlData.length;
            } else {
                //remove excess pkql
                if (store.insights.pkqlStep < store.insights.pkqlData.length - 1) {
                    store.insights.pkqlData = store.insights.pkqlData.slice(0, store.insights.pkqlStep + 1);
                }

                //combine newly run pkql and check step;
                store.insights.pkqlData = store.insights.pkqlData.concat(pkqlData.pkqlData);
                var i = store.insights.pkqlData.length - 1;
                while (i >= 0) {
                    if (store.insights.pkqlData[i].status.toUpperCase() === 'SUCCESS') {
                        store.insights.pkqlStep = i;
                        break;
                    }
                    i--;
                }
            }


            //TODO REFACTOR
            //update terminal
            $rootScope.$emit('terminal-receive', 'process-response', {
                response: pkqlData.pkqlData
            });

            //clear out selection
            dataPointSelected([]);

            //update Data
            var oldDataObj = getWidgetData().data;
            if (navigation === 'backward') {
                oldDataObj = {
                    insightData: oldDataObj.insightData,
                    chartData: { layout: 'create', insightID: false },
                    comments: { list: {}, maxId: 0 },
                    panelConfig: {
                        panelstatus: 'normalized',
                        size: {
                            width: '700px',
                            height: '450px'
                        },
                        position: 'auto'
                    }
                };
            }

            //show the loading screen
            showWidgetLoadScreen(true);

            $q.when(updateDataFromPKQL(oldInsight, oldDataObj, pkqlData)).then(function () {
                showWidgetLoadScreen(false);
                //TODO TEMP FIX for Create - returning PKQL
                return pkqlData;
            });
        }

        /**
         * @name updateDataFromPKQL
         * @param oldInsight
         * @param oldDataObj
         * @param pkqlData
         * @desc called whenever a PKQL command  executes sucessfully
         */
        function updateDataFromPKQL(oldInsight, oldDataObj, pkqlData) {
            //Check if updateData Need to Be Removed
            var currentWidget = store.widgets, newDataObj, model, updateTableData = false, repaintVisual = false;

            if (!oldDataObj.filter) {
                oldDataObj.filter = {};
            }
            newDataObj = JSON.parse(JSON.stringify(oldDataObj));
            model = { sortModel: {}, selectors: _.values(newDataObj['chartData']['dataTableAlign']) };

            //update widget data
            if ((!oldInsight.dataId && oldInsight.dataId !== 0) || (oldInsight.dataId !== pkqlData.dataID)) {
                updateTableData = true;
            }

            //update insightId
            store.widgets.insightId = pkqlData.insightID;
            newDataObj['chartData']['insightID'] = pkqlData.insightID;

            if (pkqlData.feData) {
                var feData = pkqlData.feData[currentWidget.panelId];

                if (!feData && pkqlData.feData['data']) {
                    feData = pkqlData.feData['data']
                }

                if (feData) {
                    if (feData['var2define']) {
                        //this is a param so lets run the pkql
                        toggleWidgetHandle('param');
                        newDataObj.pkqlParams = feData.var2define;
                    }

                    //update layout
                    if (feData['chartData'] && !_.isEmpty(feData['chartData'])) {
                        if (feData['chartData']['layout']) {
                            newDataObj['chartData']['layout'] = feData['chartData']['layout']
                        }

                        //TODO MERGE
                        if (feData['chartData']['layout'] && feData['chartData']['dataTableKeys']) {
                            newDataObj['chartData']['dataTableAlign'] = widgetConfigService.generateVisualOptions(feData['chartData']['layout'], feData['chartData']['dataTableKeys']);
                            newDataObj['chartData']['dataTableKeys'] = feData['chartData']['dataTableKeys'];
                        }
                        //TODO so bad
                        if (!_.isEmpty(feData['chartData']['dataTableValues'])) {
                            var tempHeaders = [];
                            for (var i = 0; i < feData['chartData']['dataTableKeys'].length; i++) {
                                if (feData['chartData']['dataTableKeys'][i]) {
                                    tempHeaders.push(feData['chartData']['dataTableKeys'][i]['uri'])
                                }
                            }

                            updateTableData = false;
                            repaintVisual = true;
                            newDataObj['chartData'] = angular.extend(newDataObj['chartData'], utilityService.formatTableData(tempHeaders, feData['chartData']['dataTableValues'], true));
                        }
                        else {
                            updateTableData = true;
                            model = { sortModel: {}, selectors: _.values(newDataObj['chartData']['dataTableAlign']) };
                        }
                    }

                    //add in comments
                    if (feData['comments'] && !_.isEmpty(feData['comments'])) {
                        repaintVisual = true;
                        if (!newDataObj['comments'] || _.isEmpty(newDataObj['comments'])) {
                            newDataObj['comments'] = { list: {}, maxId: 0 };
                        }

                        //convert comment to format used by jvComment
                        for (var i in feData['comments']) {
                            if (!feData['comments'][i]['closed']) {
                                var newComment = {
                                    commentId: i,
                                    binding: JSON.parse(feData['comments'][i]['location'].replace(/'/g, '"')),
                                    commentText: feData['comments'][i]['text'],
                                    groupID: feData['comments'][i]['group'],
                                    type: feData['comments'][i]['type']
                                };

                                newDataObj['comments']['list'][i] = newComment;
                            }
                            else {
                                delete newDataObj['comments']['list'][i];
                            }

                            if (i > newDataObj['comments']['maxId']) {
                                newDataObj['comments']['maxId'] = i
                            }
                        }
                    }

                    //update config
                    if (feData['config']) {
                        //check if visual needs to resize
                        if (!_.isEqual(feData['config']['size'], oldDataObj['panelConfig']['size']) || feData['config']['panelstatus'] !== oldDataObj['panelConfig']['panelstatus']) {
                            repaintVisual = true;
                        }

                        newDataObj['panelConfig'] = angular.extend(newDataObj['panelConfig'], feData['config'])
                    }

                    //edit Mode
                    //reset first if mismatch
                    if (newDataObj['chartData']['layout'] !== oldDataObj['chartData']['layout']) {
                        newDataObj['lookandfeel'] = {};
                    }

                    if (feData['lookandfeel']) {
                        repaintVisual = true;
                        newDataObj['lookandfeel'] = angular.extend(newDataObj['lookandfeel'], feData['lookandfeel']);
                    }

                    //uiOptions
                    //reset first if mismatch
                    if (newDataObj['chartData']['layout'] !== oldDataObj['chartData']['layout']) {
                        newDataObj['tools'] = {};
                    }

                    if (feData['tools'] && feData['tools'][0] && feData['tools'][0]['defaultState']) {
                        repaintVisual = true;
                        if (_.isUndefined(newDataObj['tools'])) {
                            newDataObj['tools'] = {};
                        }
                        newDataObj['tools'] = angular.extend(newDataObj['tools'], feData['tools'][0]['defaultState']);
                    }
                }
            }

            if (updateTableData && (newDataObj['chartData']['layout'] === "Graph" || newDataObj['chartData']['layout'] === "VivaGraph" || newDataObj['chartData']['layout'] === "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet")) {
                return monolithService.getGraphData(newDataObj['chartData']['insightID']).then(function (chartDataObj) {
                    newDataObj = cleanData(angular.extend({ layout: 'Graph' }, newDataObj['chartData'], chartDataObj), newDataObj['insightData'], null, newDataObj['comments'], newDataObj['panelConfig'], newDataObj['lookandfeel'], newDataObj['tools'], newDataObj['pkqlParams']);
                    //TODO IS THIS NECESSARY?
                    $rootScope.$emit('chart-receive', 'sheet-graph-traverse', {
                        newData: newDataObj['chartData'],
                        oldData: oldDataObj['chartData'],
                        updateType: "traverse"
                    });

                    store.widgets.data = newDataObj;
                    resetVizData(newDataObj, oldDataObj);
                    resetWidget();
                    resetData();

                    $rootScope.$emit('pub-sub-receive', 'sync-data', {
                        insightData: store.insights,
                        widgetData: store.widgets,
                        dashboardObject: null,
                        pkqlData: pkqlData
                    });

                    return {};
                }, function (err) {
                    console.log(err);

                    return {};
                });
            } else if (updateTableData) {
                if (newDataObj['chartData']['layout'] === "Grid" || newDataObj['chartData']['layout'] === "create") {
                    //TEMP
                    console.warn('Standardize this for every visualization');
                    //reset offset for grid + create
                    store.widgets.rowOffset = { start: 0, end: 500 };
                }
                else {
                    store.widgets.rowOffset = { start: 0, end: -1 };
                }

                return monolithService.getNextTableData(model, newDataObj['chartData']['insightID'], store.widgets.rowOffset.start, store.widgets.rowOffset.end).then(function (chartDataObj) {
                    newDataObj = cleanData(angular.extend({ layout: 'Grid' }, newDataObj['chartData'], chartDataObj), newDataObj['insightData'], null, newDataObj['comments'], newDataObj['panelConfig'], newDataObj['lookandfeel'], newDataObj['tools'], newDataObj['pkqlParams']);
                    store.widgets.data = newDataObj;
                    resetVizData(newDataObj, oldDataObj);
                    resetWidget();
                    resetData();

                    $rootScope.$emit('pub-sub-receive', 'sync-data', {
                        insightData: store.insights,
                        widgetData: store.widgets,
                        dashboardObject: null,
                        pkqlData: pkqlData
                    });

                    return {};
                }, function (err) {
                    console.log(err);
                    return {};
                });
            }

            newDataObj = cleanData(angular.extend({ layout: 'Grid' }, newDataObj['chartData']), newDataObj['insightData'], null, newDataObj['comments'], newDataObj['panelConfig'], newDataObj['lookandfeel'], newDataObj['tools'], newDataObj['pkqlParams']);
            store.widgets.data = newDataObj;
            if (repaintVisual) {
                resetVizData(newDataObj, oldDataObj);
            }
            resetWidget();
            resetData();

            $rootScope.$emit('pub-sub-receive', 'sync-data', {
                insightData: store.insights,
                widgetData: store.widgets,
                dashboardObject: null,
                pkqlData: pkqlData
            });

            return {};

        }

        /**
         * @name loadData
         * @desc loads additional data from the backend (for infinite Viz)
         */
        function loadData() {
            //get the current offset data
            var oldWidgetData = getWidgetData(),
                model = { sortModel: {}, selectors: _.values(oldWidgetData.data.chartData.dataTableAlign) };

            if (store.widgets.rowOffset.end <= oldWidgetData.data.chartData.data.length) {
                showWidgetLoadScreen(true);

                //TEMP
                console.warn('Standardize this for every visualization');
                store.widgets.rowOffset.start += 500;
                store.widgets.rowOffset.end += 500;

                monolithService.getNextTableData(model, store.widgets.insightId, store.widgets.rowOffset.start, store.widgets.rowOffset.end)
                    .then(function (data) {
                        //merge the new data with the old data
                        store.widgets.data.chartData.data = store.widgets.data.chartData.data.concat(data.data);
                        store.widgets.data.chartData.filteredData = store.widgets.data.chartData.filteredData.concat(data.filteredData);
                        //TODO DO HEADERS CHANGE?
                        //_.unionWith(store.widgets.data.chartData.headers, data.headers, _.isEqual);

                        resetVizData(store.widgets.data, oldWidgetData.data);
                        showWidgetLoadScreen(false);
                    });
            }
        }

        /**
         * @name resetData
         * @desc event that is triggered when data is updated from BE
         */
        function resetData() {
            $rootScope.$emit('update-data');
        }

        /**
         * @name getData
         * @param config
         * @desc called to get dat actions
         */
        function getData(config) {
            if (config.type === 'analytics') {
                $q.when(config.call()).then(function (modifiedData) {
                    var currentWidget = store.widgets,
                        oldDataObj = JSON.parse(JSON.stringify(currentWidget.data));

                    if (modifiedData.actionData) {
                        var newActionData = {};
                        newActionData.data = modifiedData.actionData.data;
                        newActionData.headers = modifiedData.actionData.headers;
                        newActionData.specificData = modifiedData.actionData.specificData;
                        newActionData.dataTableAlign = modifiedData.actionData.dataTableAlign;
                        newActionData.insightID = modifiedData.insightID;
                        newActionData.stepID = modifiedData.stepID;
                        newActionData.layout = modifiedData.actionData.layout;

                        if (newActionData.data && newActionData.headers) {
                            newActionData = angular.extend(newActionData, utilityService.formatTableData(newActionData.headers, newActionData.data, true));
                        }

                        var newDataObj = cleanData(newActionData, oldDataObj.insightData, null, oldDataObj.comments, oldDataObj.panelConfig, oldDataObj.lookandfeel, oldDataObj.tools, oldDataObj.pkqlParams);
                        store.widgets.data = newDataObj;
                        resetVizData(newDataObj, oldDataObj);
                        resetWidget();
                        resetData();
                        config.callBack(modifiedData);
                    } else if (oldDataObj.chartData.layout === 'Grid') {
                        var model = { sortModel: {}, selectors: _.values(oldDataObj.chartData.dataTableAlign) };
                        //TEMP
                        console.warn('Standardize this for every visualization');
                        //reset offset for grid + create
                        store.widgets.rowOffset = { start: 0, end: 500 };

                        monolithService.getNextTableData(model, modifiedData.insightID, store.widgets.rowOffset.start, store.widgets.rowOffset.end).then(function (chartDataObj) {
                            chartDataObj['stepID'] = modifiedData.stepID;
                            newDataObj = cleanData(angular.extend({ layout: 'Grid' }, oldDataObj.chartData, chartDataObj), oldDataObj.insightData, null, oldDataObj.comments, oldDataObj.panelConfig, oldDataObj.lookandfeel, oldDataObj.tools, oldDataObj.pkqlParams);
                            store.widgets.data = newDataObj;
                            resetVizData(newDataObj, oldDataObj);
                            resetWidget();
                            resetData();
                            config.callBack(modifiedData);
                        });
                    }
                    else {
                        newDataObj = cleanData(angular.extend({ layout: 'Grid' }, oldDataObj.chartData), oldDataObj.insightData, null, oldDataObj.comments, oldDataObj.panelConfig, oldDataObj.lookandfeel, oldDataObj.tools, oldDataObj.pkqlParams);
                        store.widgets.data = newDataObj;
                        resetVizData(newDataObj, oldDataObj);
                        resetWidget();
                        resetData();
                        config.callBack(modifiedData);
                    }
                }, function (errorMessage) {
                    var data = {};
                    data.error = errorMessage;
                    config.callBack(data);
                });
            } else if (config.type === 'parameter-update') {
                $q.when(config.call()).then(function (chartDataObj) {
                    var currentWidget = store.widgets,
                        oldDataObj = JSON.parse(JSON.stringify(currentWidget.data));

                    var newDataObj = cleanData(angular.extend(oldDataObj.chartData, chartDataObj.chartData), oldDataObj.insightData, null, oldDataObj.comments, oldDataObj.panelConfig, oldDataObj.lookandfeel, oldDataObj.tools, oldDataObj.pkqlParams);
                    store.widgets.data = newDataObj;
                    resetVizData(newDataObj, oldDataObj);
                    resetWidget();
                    resetData();
                    config.callBack();
                }, function (err) {
                    config.callBack({ error: err });
                    alertService(err, 'Error', 'toast-error', 1000);
                });
            } else if (config.type === 'save') {
                var payload = config.call();
                var currentWidget = store.widgets,
                    currentDataObj = currentWidget.data;

                //update the insight in the store with the new information
                if (payload.newInsightID) {
                    currentDataObj.insightData.core_engine_id = payload.newInsightID;
                }
                if (payload.newQuestionTitle) {
                    currentDataObj.chartData.title = payload.newQuestionTitle;
                    currentDataObj.insightData.name = payload.newQuestionTitle;
                }

                //we will add user.inputs to beginning of recipe...
                if (payload.paramPKQLS.length > 0) {
                    var pkqlArray = [], index = 0;
                    for (; index < payload.paramPKQLS.length; index++) {
                        store.insights.pkqlData.splice(index, 0, {
                            command: payload.paramPKQLS[index],
                            label: 'user.input',
                            result: '',
                            status: 'SUCCESS'
                        });
                        store.insights.pkqlStep++;
                    }
                }

                //follow the usual update procedure - accounting for the new information
                resetVizData(currentDataObj, currentDataObj);
                resetWidget();
                resetData();

                config.callBack();
            }
        }

        /**
         * @name cleanData
         * @param chartData
         * @param insightData
         * @param filter
         * @param comments
         * @param panelConfig
         * @param lookandfeel
         * @param tools
         * @desc called to format data (for chart consumption)
         */
        function cleanData(chartData, insightData, filter, comments, panelConfig, lookandfeel, tools, pkqlParams) {
            //TODO WHY Do We Have This
            var copyChartData, copyInsightData, copyFilter, copyComments, copyPanelConfig, copyLookandfeel, copyTools, copyPkqlParams;

            //check if null then copy all data
            copyChartData = chartData ? JSON.parse(JSON.stringify(chartData)) : null;
            copyInsightData = insightData ? JSON.parse(JSON.stringify(insightData)) : null;
            copyFilter = filter ? JSON.parse(JSON.stringify(filter)) : null;
            copyComments = comments ? JSON.parse(JSON.stringify(comments)) : null;
            copyPanelConfig = panelConfig ? JSON.parse(JSON.stringify(panelConfig)) : null;
            copyLookandfeel = lookandfeel ? JSON.parse(JSON.stringify(lookandfeel)) : null;
            copyTools = tools ? JSON.parse(JSON.stringify(tools)) : null;
            copyPkqlParams = pkqlParams ? JSON.parse(JSON.stringify(pkqlParams)) : null;

            var newData = {
                chartData: copyChartData,
                insightData: copyInsightData,
                filter: copyFilter,
                comments: copyComments,
                panelConfig: copyPanelConfig,
                lookandfeel: copyLookandfeel,
                tools: copyTools,
                pkqlParams: copyPkqlParams
            };

            //append tool data to uiOptions inside chartData
            if (copyTools && newData.chartData) {
                //remove quotes from true false in object
                for (var key in copyTools) {
                    if (copyTools.hasOwnProperty(key)) {
                        if (copyTools[key] === 'true' || copyTools[key] === 'false') {
                            copyTools[key] = (copyTools[key] === 'true');
                        }
                    }
                }
                newData.chartData.uiOptions = copyTools;
            }

            if (!newData.chartData.filteredData) {
                if (newData.chartData.data && Array.isArray(newData.chartData.data))
                { newData.chartData.filteredData = utilityService.filterTableUriData(JSON.parse(JSON.stringify(newData.chartData.data))); }
            }

            return newData;
        }

        /**
         * @name resetVizData
         * @param newDataObject
         * @param oldDataObject
         * @desc emits data to the chart directive for updating purposes (only if data has changed but layout has not)
         */
        function resetVizData(newDataObject, oldDataObject) {
            if (oldDataObject && oldDataObject.chartData && newDataObject.chartData.layout === oldDataObject.chartData.layout) {
                $rootScope.$emit('update-visualization', {
                    chartData: newDataObject.chartData
                });
            }
        }

        /*** Panel Specific Functions ***/
        /*** Tools **/
        /**
         * @name runToolFunction
         * @config contains function & args to run on the widget
         * @desc Sends a function and arguments to chart.  Triggers that function for the selected widget. Sets
         *       the uiOptions object in the data store.
         */
        function runToolFunction(config) {
            //tell chart to run the given function
            $rootScope.$emit('chart-receive', 'run-tool-function', {
                fn: config.fn,
                args: config.args
            });
        }

        /**
         * @name setToolConfig
         * @config contains uiOptions
         * @desc Saves uiOptions to chartData
         */
        function setUiOptions(uiOptions) {
            var currentWidget = store.widgets;
            if (!currentWidget.data.chartData.uiOptions) {
                currentWidget.data.chartData.uiOptions = {};
            }

            if (uiOptions) {
                currentWidget.data.chartData.uiOptions = uiOptions;
            }
        }

        /*** Param ***/
        /**
         * @name createParameterList
         * @param insightData
         * @returns {Array} - array of objects holding parameter options and the selected option
         * @desc creates the list of parameter options for a given visualization
         */
        function createParameterList(insightData) {
            var insightParamList = [];

            for (var key in insightData.params) {
                var tempList = [];

                //put together the list options
                if (insightData.params[key].list) {
                    for (var i = 0; i < insightData.params[key].list.length; i++) {
                        var paramUri, paramName, paramObj = {};

                        if (insightData.params[key].param.depends == 'true') {
                            paramName = $filter('shortenValueFilter')(insightData.params[key].list[i][0]);
                            paramUri = insightData.params[key].list[i][0];
                        } else {
                            paramName = $filter('shortenValueFilter')(insightData.params[key].list[i]);
                            paramUri = insightData.params[key].list[i];
                        }

                        paramObj = {
                            name: paramName,
                            value: paramUri
                        };

                        tempList.push(paramObj);
                    }
                }

                //sort the list
                tempList = _.sortBy(tempList, 'name');


                var selectedParamName = '',
                    selectedIdx;

                if (!Array.isArray(insightData.params[key].selected)) {
                    selectedParamName = $filter('shortenValueFilter')(insightData.params[key].selected);
                    selectedIdx = _.findIndex(tempList, {
                        name: selectedParamName,
                        value: insightData.params[key].selected
                    });
                } else if (!_.isEmpty(insightData.params[key].selected)) { //TODO don't need this if statement once we switch to muti select
                    selectedParamName = $filter('shortenValueFilter')(insightData.params[key].selected[0]);
                    selectedIdx = _.findIndex(tempList, {
                        name: selectedParamName,
                        value: insightData.params[key].selected[0]
                    });
                }

                insightParamList.push({
                    paramGroup: key,
                    selected: tempList[selectedIdx],
                    list: tempList
                });
            }
            return insightParamList;
        }

        /**
         * @name selectParam
         * @param param
         * @param paramGroup
         * @desc takes the selected parameter and sends it to the register function but also runs all necessary functions for joined visualizations
         */
        function selectParam(param, paramGroup) {
            registerSelectedParam(param, paramGroup);
        }

        /**
         * @name registerSelectedParam
         * @param param - the value for the selected parameter
         * @param paramGroup - the group type the parameter is from
         * @desc when parameter is selected to update the visualization, we need to make
         */
        //update the selected item and check to see if all required params are selected
        function registerSelectedParam(param, paramGroup) {
            var currentWidget = store.widgets;
            currentWidget.data.insightData.params[paramGroup].selected = param.value;

            checkParam(currentWidget.data.insightData.params[paramGroup].param, currentWidget.data.insightData).then(function () {
                var allParamsSelected = true;
                //createParameterList();
                for (var key in currentWidget.data.insightData.params) {
                    if (currentWidget.data.insightData.params[key].selected === '' || currentWidget.data.insightData.params[key].selected.length === 0) {
                        allParamsSelected = false;
                        break;
                    }
                }

                if (allParamsSelected) {
                    confirmParam(currentWidget.data.insightData);
                }
            });
        }

        /**
         * @name registerSelectedParam
         * @param selectedOpt
         * @param insight
         * @returns {*}
         * @desc takes selected parameter from visualization, checks to see if any other dependent parameters exist, will retrieve the list of those dependent parameters
         */
        function checkParam(selectedOpt, insight) {
            var queriesToRun = [];
            var servicesToRun = [];
            for (var opt in insight.params) {
                if (insight.params[opt].param.depends === 'true' && _.includes(insight.params[opt].param.dependVars, selectedOpt.paramID)) {
                    var query = '';
                    var findersArr = [];
                    var valuesArr = [];
                    for (var i = 0; i < insight.params[opt].param.dependVars.length; i++) {
                        var dependVar = insight.params[opt].param.dependVars[i];
                        var selectedParam;
                        for (var param in insight.params) {
                            if (insight.params[param].param.paramID === dependVar) {
                                selectedParam = insight.params[param];
                            }
                        }
                        if (selectedParam.selected === '') {
                            break;
                        }
                        findersArr[i] = '@' + selectedParam.type + '@';
                        valuesArr[i] = selectedParam.selected[0];
                        query = insight.params[opt].param.query;
                    }
                    queriesToRun.push({
                        name: opt,
                        query: query
                    });

                    servicesToRun.push(monolithService.runSelectQuery(insight.core_engine, query, findersArr, valuesArr));
                }
            }

            return $q.all(servicesToRun).then(function (data) {
                var paramUpdateData = [];
                for (var i = 0; i < queriesToRun.length; i++) {
                    insight.params[queriesToRun[i].name].list = data[i];
                    //check to see if the selected dependent option is part of the paramOptions list
                    //if not we clear the option
                    var optSelected = insight.params[queriesToRun[i].name].selected;
                    var optionInList = _.find(data[i], function (item) {
                        return item[0] === optSelected[0];
                    });
                    if (!optionInList) {
                        insight.params[queriesToRun[i].name].selected = [];
                    }

                    paramUpdateData.push({ name: queriesToRun[i].name, list: data[i] });
                }
                $rootScope.$emit('param-overlay-receive', 'set-param-options', paramUpdateData);
            }, function (error) {
                var errMsg;
                if (error.data && error.data.Message) {
                    errMsg = error.data.Message;
                } else {
                    errMsg = 'Error running query';
                }
            });
        }

        /**
         * @name confirmParam
         * @param insightData
         * @desc confirms the selected parameter and creates the visualization
         */
        function confirmParam(insightData) {
            updateData({
                type: 'parameter-update',
                call: function () {
                    return vizdataService.getChartData(insightData);
                },
                callBack: function () {
                    toggleWidgetHandle(false);
                }
            });
        }

        /***Traverse ***/
        /**
         * @name getTraverseOptions
         * @desc gets params options for current db
         */
        function getTraverseOptions() {
            var currentInsight = store.insights;

            if (currentInsight.selected.data && currentInsight.selected.data[0] && currentInsight.selected.data[0].concept && currentInsight.selected.data[0].engine) {
                if (_.isEmpty(currentInsight.selected.traverse)) {
                    currentInsight.selected.traverse = { list: {}, selectedEngine: '', step: 0 };
                }

                if (currentInsight.selected.traverse.step === 0) {
                    monolithService.getConceptLogicals(currentInsight.selected.data[0].concept)
                        .then(function (logicalNames) {
                            monolithService.getConnectedNodes(logicalNames)
                                .then(function (data) {
                                    currentInsight.selected.traverse.list = formatTraverseOptions(data);
                                    currentInsight.selected.traverse.selectedEngine = currentInsight.selected.data[0].engine.name;
                                    currentInsight.selected.traverse.step++;

                                    //TODO fix this...embed version works but this doesnt. above data should have been set before the data-selected was emitted but that's not the case here so we need to emit again here
                                    $rootScope.$emit('data-selected');
                                }, function (error) {
                                    var etext = 'Error';
                                    if (error.data && error.data.errorMessage) {
                                        etext = error.data.errorMessage;
                                    }
                                    alertService(etext, 'Error', 'toast-error', 7000);
                                });
                        });
                }
            }
        }

        /**
         * @name formatTraverseOptions
         * @param data
         * @desc sets traverse options
         */
        function formatTraverseOptions(data) {
            var tempObj = {};

            for (var engine in data) {
                var combinedObj = [];

                for (var concept in data[engine]) {
                    for (var direction in data[engine][concept]) {
                        if (direction === 'upstream' || direction === 'downstream') {
                            for (var index = 0; index < data[engine][concept][direction].length; index++) {
                                combinedObj.push({
                                    name: data[engine][concept][direction][index],
                                    conceptualName: data[engine][concept][direction][index],
                                    direction: direction.toLowerCase(),
                                    relation: '',
                                    parentName: '',
                                    equivalent: concept,
                                    db: [{ name: engine }]
                                });
                            }
                        }
                    }
                }
                tempObj[engine] = combinedObj;
            }

            return tempObj;
        }

        /*** Join ***/
        /**
         * @name dataPointSelected
         * @param selectedData
         * @desc retrieves the related insights to the selectedData
         */
        function dataPointSelected(selectedData) {
            var currentWidget = store.widgets,
                currentInsight = store.insights,
                updateCalls = [];

            //stores in insightData (selected across for points)
            //resets if not equal
            if (!_.isEqual(currentInsight.selected.data, selectedData)) {
                currentInsight.selected = { data: selectedData, traverse: {}, related: {} };
            }

            //HIGHLIGHT
            //bad join highlight
            console.log('CHECK HIGHLIGHT JOIN');

            //only update if something is selected
            if (!_.isEmpty(currentInsight.selected.data)) {
                //update for traversal
                //open traverse if graph
                if (currentWidget.data && currentWidget.data.chartData && (currentWidget.data.chartData.layout === 'Graph' || currentWidget.data.chartData.layout === 'VivaGraph') && currentWidget.selectedHandle !== 'traverse') {
                    toggleWidgetHandle('traverse');
                }
                //call if toggled open
                if (currentWidget.selectedHandle === 'traverse') {
                    updateCalls.push(getTraverseOptions());
                }

                //get the initial set of related insights and save into the store
                monolithService.getRelatedInsights('', '', _.map(selectedData, 'uri'), '', 'LocalMasterDatabase', {}, 20, 0)
                    .then(function (data) {
                        store.insights.selected.related = data;
                        if (currentWidget.enableRelatedInsights) {
                            $rootScope.$emit('widget-receive', 'related-panel-insights-retrieved', {
                                'relatedInsightsNum': data.numFound
                            });
                            //alertService("Found " + data.numFound + " related insights for " + selectedData[0].uri, "Related Insights", 'toast-info', 5000);
                        }
                    }, function (error) {
                        // var etext = 'Related insights error';

                        // if (error.data && error.data.errorMessage) {
                        //     etext = error.data.errorMessage;
                        // }
                        // alertService(etext, 'Error', 'toast-error', 4000);

                        // Do nothing, not necessary to show the alert ^^^
                    });
            }


            //loading screen
            showWidgetLoadScreen(true);

            $q.all(updateCalls).then(function () {
                //highlight the selected item on the clones
                $rootScope.$emit('data-selected', {
                    selectedItem: selectedData
                });

                //TODO davy look at this for clones...pass up to parent and then pass back down to children
                //TODO take a look at where data-selected is doing
                showWidgetLoadScreen(false);
            });
        }

        /**
         * @name setWidgetEngine
         * @param engine
         * @desc sets the engine to the chartData level
         */
        function setWidgetEngine(engine) {
            var currentWidget = store.widgets;
            currentWidget.data.chartData.core_engine = engine;
        }

        /**
         * @name setConsoleContext
         * @param context
         * @desc sets the console context for the widget
         */
        function setConsoleContext(context) {
            var currentWidget = store.widgets;
            currentWidget.consoleContext = context;
        }

        /**
         * @name setConsoleWidth
         * @param width
         * @desc sets the console width for the widget
         */
        function setConsoleWidth(width) {
            var currentWidget = store.widgets;
            currentWidget.consoleWidth = width;
        }

        /**
         * @name exportToCSV
         * @desc exports the data backing a visualization to a csv file
         */
        function exportToCSV() {
            var tableData = store.widgets;
            if (!_.isEmpty(tableData) && !_.isEmpty(tableData.insightId)) {
                monolithService.getTable(tableData.insightId).then(function (tableData) {
                    if (tableData.filteredData) {
                        console.log(tableData.filteredData);

                        var unparsedData = '', csvData;
                        //add in headers
                        for (var i = 0; i < tableData.headers.length; i++) {
                            var header = tableData.headers[i].filteredTitle;
                            if (typeof header === 'string' && header.indexOf(',')) {
                                header = '"' + header + '"';
                            }

                            unparsedData += (header + ',');
                        }
                        unparsedData += '\r\n';


                        //add in rows
                        for (var i = 0; i < tableData.filteredData.length; i++) {
                            for (var j = 0; j < tableData.headers.length; j++) {
                                var data = tableData.filteredData[i][tableData.headers[j].filteredTitle];
                                if (typeof data === 'string' && data.indexOf(',')) {
                                    data = '"' + data + '"';
                                }
                                unparsedData += (data + ',');
                            }
                            unparsedData += '\r\n';
                        }

                        //create blob
                        csvData = new Blob([unparsedData], { type: 'text/csv;charset=utf-8;' });

                        //export for download
                        //IE11 & Edge
                        if (navigator.msSaveBlob) {
                            navigator.msSaveBlob(csvData, 'tableData.csv');
                        } else {
                            //In FF link must be added to DOM to be clicked
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(csvData);
                            link.setAttribute('download', 'tableData.csv');
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    } else {
                        alertService('No Filtered Data', 'Warning', 'toast-warning', 3000);
                    }
                }, function (error) {
                    alertService('Unable to get table data for old graph', 'Warning', 'toast-warning', 3000);
                });
            }
        }

        return {

            /*** Widget Level Functions ***/
            setWidgetEngine: setWidgetEngine,
            isSelectedWidget: isSelectedWidget,
            setSelectedWidget: setSelectedWidget,
            /***Update functions***/
            resetVizData: resetVizData,
            resetWidget: resetWidget,
            /*** Widget Data Level Functions ***/
            setWidgetData: setWidgetData,
            getWidgetData: getWidgetData,
            setInsightParams: setInsightParams,
            getInsightData: getInsightData,
            clearPKQLData: clearPKQLData,
            toggleWidgetHandle: toggleWidgetHandle,
            showWidgetLoadScreen: showWidgetLoadScreen,
            setDefaultHandle: setDefaultHandle,
            /*** Pure Data Level Functions **/
            updatePKQL: updatePKQL,
            updateDataFromPKQL: updateDataFromPKQL,
            updateData: updateData,
            loadData: loadData,
            setOriginWidgetId: setOriginWidgetId,
            getOriginWidgetId: getOriginWidgetId,
            setData: setData,
            /*** Panel Specific Functions ***/
            runToolFunction: runToolFunction,
            setUiOptions: setUiOptions,
            selectParam: selectParam,
            dataPointSelected: dataPointSelected,
            setConsoleContext: setConsoleContext,
            setConsoleWidth: setConsoleWidth,
            /**Sharing Functions **/
            exportToCSV: exportToCSV
        };
    }
})();
