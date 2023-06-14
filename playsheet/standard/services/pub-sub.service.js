(function () {
    "use strict";

    angular.module('app.pub-sub.service', [])
        .factory('pubSubService', pubSubService);

    pubSubService.$inject = ['dataService', 'pkqlService', '$rootScope', 'ENDPOINT'];

    function pubSubService(dataService, pkqlService, $rootScope, ENDPOINT) {
        var trustedOrigin = "https://localhost", //change this to the domain semoss will be deployed to
            events = {
                publishers: [//messages SENT
                    "request-data-from-core", //send request for data from core
                    "generate-query-from-embed",  //requests query from parent
                    "add-new-widget", // adds a new widget in the app with data from embed
                    "select-widget", // selects the widget
                    "create-viz",

                    // updated
                    "smss-sync-data" //send data out
                ],
                subscribers: [//messages RECEIVED
                    "update-widget-with-panel-viz", //updates data with a panel.viz instead of get next table - used in dashboard and clone
                    "execute-pkql-from-core", //execute pkql from core
                    "un-select-widget",// listen for message to unselect widget (when another widget is clicked)

                    // updated
                    "smss-sync-data",//receive data messages (if by current widget we block),
                    "initialize-data-in-embed"
                ]
            };

        /* Publishers */
        /**
         * @name getData
         * @desc grab the widget data from parent
         */
        function getData() {
            var originWidgetId = dataService.getOriginWidgetId();
            if(originWidgetId === 'preview') {
                window.top.postMessage(JSON.stringify({
                    message: "request-preview-data-from-core",
                    src: originWidgetId
                }), ENDPOINT);
            } else {
                window.top.postMessage(JSON.stringify({
                    message: "request-data-from-core",
                    src: originWidgetId
                }), ENDPOINT);
            }
        }


        /**
         * @name selectWidget
         * @desc tells core to update the selcted widget
         */
        function selectWidget() {
            var originWidgetId = dataService.getOriginWidgetId();
            window.top.postMessage(JSON.stringify({
                message: "select-widget", src: originWidgetId, target: 'core', widgetId: originWidgetId
            }), ENDPOINT);
        }

        /**
         * @name addNewWidget
         * @param widgetData
         * @param insightData
         * @desc adds a new widget and insight data
         */
        function addNewWidget(insightData) {
            var originWidgetId = dataService.getOriginWidgetId();
            window.top.postMessage(JSON.stringify({
                message: "add-new-widget", widgetId: originWidgetId,
                data: {
                    insightData: insightData
                }
            }), ENDPOINT);
        }

        /**
         * @name syncData
         * @param widgetData
         * @desc saves the data we need to recreate the panel; also checks for joined widgets to see if they need to be updated
         */
        function syncData(widgetData, dashboard, insightData, pkqlData) {
            var originWidgetId = dataService.getOriginWidgetId();
            window.top.postMessage(JSON.stringify({
                message: "smss-sync-data",
                src: originWidgetId,
                target: false,
                data: {
                    widgetData: widgetData,
                    dashboardObject: dashboard,
                    insightData: insightData,
                    pkqlData: pkqlData
                }
            }), ENDPOINT);
        }

        /**
         * @name generateQuery
         * @param type
         * @desc requests a query to be generate in the parent
         */
        function generateQuery(type) {
            var originWidgetId = dataService.getOriginWidgetId();
            window.top.postMessage(JSON.stringify({
                message: "generate-query-from-embed",
                widgetId: originWidgetId,
                data: {
                    type: type
                }
            }), ENDPOINT);
        }

        /**
         * @name createViz
         * @param insight
         * @desc will tell core to create the selected insight in a new widget--this will route through search's createViz function for now...
         */
        function createViz(insight) {
            window.top.postMessage(JSON.stringify({
                message: "create-viz",
                data: {
                    insight: insight
                }
            }), ENDPOINT);
        }


        /* Subscribers */
        /**
         * @name redirectCall
         * @param event
         * @desc check message and redirect to specific function
         */
        function redirectCall(event) {
            var origin = event.origin || event.originalEvent.origin,
                data = {},
                message,
                target,
                src,
                eventData;
            if (event.data) {
                eventData = JSON.parse(event.data);
            }
            if (eventData.data) {
                data = eventData.data;
            }
            message = eventData.message;
            src = eventData.src;
            target = eventData.target;

            //TODO security: trustedOrigin needs to be set to the url link semoss is deployed to and we need to do a equals check rather than contains check
            /*if (origin !== trustedOrigin) {
             return;
             }*/

            var originWidgetId = dataService.getOriginWidgetId();
            //same src so it shouldn't update
            if (src == originWidgetId) {
                return;
            }
            if (eventData.widgetId && eventData.widgetId !== originWidgetId) { //if its not intended for this iframe/widget then we ignore
                if (message === 'select-widget') {
                    dataService.setSelectedWidget(false);
                }
                return;
            }

            if (_.indexOf(events.subscribers, eventData.message) === -1) { //check to see if the message is registered to our list of subscribers
                return;
            }

            console.log('%cWINDOW-EMBED:', "color:green", eventData.message, "src:", src, "target:", originWidgetId);

            if (message === "smss-sync-data") {
                var insightData = data.insightData, widgetData = data.widgetData, currentWidget = dataService.getWidgetData();

                //only sync if necessary (it is target or clone)
                //sync since its targeted
                if (insightData && (target == originWidgetId || insightData.insightId == currentWidget.insightId)) {
                    dataService.setData(insightData, widgetData)
                }
            }
            else if (message === "initialize-data-in-embed") {
                var insightData = data.insightData, widgetData = data.widgetData, currentWidget = dataService.getWidgetData();

                //only sync if necessary (it is target or clone)
                //sync since its targeted
                if (insightData && (target == originWidgetId || insightData.insightId == currentWidget.insightId) || originWidgetId === 'preview') {
                    dataService.setData(insightData, widgetData)
                }
            }
            else if (message === "execute-pkql-from-core") {
                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, data.pkql, data.navigation);
            }
            else if (message === 'update-widget-with-panel-viz') {
                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, "", null, true);
            }

            //event.source.postMessage({}, event.origin); //this is to reply
        }

        /* Window listener */
        window.top.addEventListener("message", redirectCall);

        /* listener */
        var pubSubListener = $rootScope.$on('pub-sub-receive', function (event, message, data) {
            if (message === 'select-widget') {
                selectWidget()
            } else if (message === 'get-data') {
                getData()
            } else if (message === 'sync-data') {
                //updateWidgets used for join and clone...tells us whether we need to update joined panels
                syncData(data.widgetData, data.dashboardObject, data.insightData, data.pkqlData);
            } else if (message === 'generate-query') {
                generateQuery(data.type)
            } else if (message === 'add-new-widget') {
                addNewWidget(data.insightData);
            } else if (message === 'create-viz') {
                createViz(data.insight);
            }
        });

        //cleanup
        $rootScope.$on('$destroy', function () {
            pubSubListener();
        });

        return {};
    }
})();