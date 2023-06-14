(function () {
    "use strict";

    angular.module("app.tap.portratdashboardservice", [])
        .factory("portratdashboardService", portratdashboardService);

    portratdashboardService.$inject = [];

    function portratdashboardService() {
        var layout = "",
            overviewData = {
                info: {},
                cost: [],
                map: {},
                healthGrid: {}
            },
            consolidatedData = {
                info: {},
                map: {},
                coverage: {},
                healthGrid: {}
            },
            sustainedData = {
                info: {},
                capability: {},
                map: {},
                healthGrid: {}
            },
            systemList = [],
            dashboardInsightData = {},
            insightData = {
                engine: {},
                engineList: [],
                perspective: "",
                perspectiveList: [],
                insight: "",
                insightID: "",
                insightList: [],
                parameters: {},
                showEngine: true,
                showPerspective: false,
                showInsight: false,
                showParam: false,
                query: "",
                currentInsightInformation: {},
                toggleMode:"hidden",
                menuMode:true
            };

        return {
            setLayout: function (ps) {
                layout = ps;
            },
            getLayout: function () {
                return layout;
            },
            getInsightDataEngine: function (vizID) {
                if (dashboardInsightData[vizID]) {
                    return dashboardInsightData[vizID].engine;
                }
                return "";
            },
            setInsightDataEngine: function (eng, vizID) {
                if (dashboardInsightData[vizID]) {
                    dashboardInsightData[vizID].engine = eng;
                } else {
                    dashboardInsightData[vizID] = {};
                    JSON.parse(JSON.stringify(insightData, dashboardInsightData[vizID]));
                    dashboardInsightData[vizID].engine = eng;
                }
            },
            setOverviewData: function (data) {
                overviewData = data;
            },
            getOverviewData: function () {
                return overviewData;
            },
            setOverviewDataInfo: function (info) {
                overviewData.info = info;
            },
            getOverviewDataInfo: function () {
                return overviewData.info;
            },
            setOverviewDataCost: function (cost) {
                overviewData.cost = cost;
            },
            getOverviewDataCost: function () {
                return overviewData.cost;
            },
            setOverviewDataMap: function (map) {
                overviewData.map = map;
            },
            getOverviewDataMap: function () {
                return overviewData.map;
            },
            setOverviewDataHealthGrid: function (healthGrid) {
                overviewData.healthGrid = healthGrid;
            },
            getOverviewDataHealthGrid: function () {
                return overviewData.healthGrid;
            },
            setSustainedCapabilityData: function(data) {
                sustainedData.capability = data;
            },
            getSustainedCapabilityData: function() {
                return sustainedData.capability;
            },
            setSustainedDataInfo: function(info) {
                sustainedData.info = info;
            }, 
            getSustainedDataInfo: function() {
                return sustainedData.info;
            },
            setSustainedDataMap: function(map) {
                sustainedData.map = map;
            },
            getSustainedDataMap: function() {
                return sustainedData.map;
            },
            setSustainedDataHealthGrid: function(healthGrid) {
                sustainedData.healthGrid = healthGrid;
            },
            getSustainedDataHealthGrid: function() {
                return sustainedData.healthGrid;
            },
            setConsolidatedCoverageData: function(coverage) {
                consolidatedData.coverage = coverage;
            },
            getConsolidatedCoverageData: function() {
                return consolidatedData.coverage;
            },
            setConsolidatedDataInfo: function(info) {
                consolidatedData.info = info;
            }, 
            getConsolidatedDataInfo: function() {
                return consolidatedData.info;
            },
            setConsolidatedDataMap: function(map) {
                consolidatedData.map = map;
            },
            getConsolidatedDataMap: function() {
                return consolidatedData.map;
            },
            setConsolidatedDataHealthGrid: function(healthGrid) {
                consolidatedData.healthGrid = healthGrid;
            },
            getConsolidatedDataHealthGrid: function() {
                return consolidatedData.healthGrid;
            },
            setSystemList: function(list) {
                systemList = list;
            },
            getSystemList: function() {
                return systemList;
            }

        };

    }
})();
