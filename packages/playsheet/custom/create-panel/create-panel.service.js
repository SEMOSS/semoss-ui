(function () {
    'use strict';

    angular.module('app.create-panel.service', [])
        .factory('createPanelService', createPanelService);

    createPanelService.$inject = ["$filter", "$q", "monolithService", "alertService", "utilityService"];


    function createPanelService($filter, $q, monolithService, alertService, utilityService) {
        var allMetamodel = {},
            errorReturnFn = function (err) {
                return $q.reject(err);
            };
        return {
            setAllMetamodel: function (metamodelData) {
                allMetamodel = metamodelData;
            },

            getAllMetamodel: function () {
                return allMetamodel;
            },
            
            getConnectedNodes: function (conceptualName, parentName) {
                return monolithService.getConceptLogicals(conceptualName, parentName)
                    .then(function(data){
                        if(data.length === 0) { //no logicals so just return
                            return;
                        }
                        
                        return monolithService.getConnectedNodes(data)
                            .then(function (data) {
                                return data;
                            }, errorReturnFn);
                    });
            },

            getConceptProperties: function (node) {
                /*if (engine.name === "LocalMasterDatabase") {
                    return {};
                }*/
                var conceptualName = node.conceptualName;
                return monolithService.getConceptLogicals(conceptualName)
                    .then(function(data){
                        if(data.length === 0) { //no logicals so just return
                            return;
                        }

                        return monolithService.getConceptProperties(data)
                            .then(function (data) {
                                var propList = {};
                                for (var eng in data) {
                                    var tempList = {};
                                    for (var concept = 0; concept < data[eng].length; concept++) {
                                        for(var prop = 0; prop < data[eng][concept].propSet.length; prop++) {
                                            tempList[data[eng][concept].propSet[prop]] = {
                                                name: data[eng][concept].propSet[prop],
                                                db: [{name: eng}],
                                                equivalent: data[eng][concept].conceptualName,
                                                parentName: data[eng][concept].conceptualName,
                                                conceptualName: data[eng][concept].propSet[prop],
                                                selected: false
                                            };
                                        }
                                    }
                                    propList[eng] = tempList;
                                }

                                return propList;
                            }, errorReturnFn);
                    });
            },

            getEngineMetaModel: function (engine) {
                return monolithService.getEngineMetaModel(engine)
                    .then(function (data) {
                        return {data: data, engine: engine};
                    });
            },

            clearCache: function (engine) {
                return monolithService.clearCache(engine);
            },

            getInstancesForConcept: function (insightID, pkqlQuery) {
                return monolithService.runPKQLQuery(insightID, pkqlQuery)
                    .then(function (data) {
                        return data.insights[0].pkqlData[0].returnData;
                    }, errorReturnFn);
            },

            getTable: function (insightID) {
                return monolithService.getTable(insightID)
                    .then(function (data) {
                        return data;
                    }, errorReturnFn);
            },

            loadAllFromCache: function (engine, searchTerm) {
                return monolithService.loadAllFromCache(engine, searchTerm)
                    .then(function (data) {
                        return data;
                    }, errorReturnFn);
            },


            getInsightMetamodel: function (id, query) {
                return monolithService.getInsightMetamodel(id, query)
                    .then(function (data) {
                        return data;
                    }, errorReturnFn);
            }
        };
    }
})();