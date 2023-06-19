(function () {
    'use strict';

    /**
     * @name monolith.service.js
     * @desc service used to interface with the Monolith REST API
     */
    angular.module('app.monolith.service', [])
        .factory('monolithService', monolithService)
        .factory('_', function () {
            return window._;
        });

    monolithService.$inject = ['ENDPOINT', '$http', 'utilityService', '$q', '_'];

    function monolithService(ENDPOINT, $http, utilityService, $q, _) {

        /**
         * @name errorReturnFn
         * @param err - the error sent back from the server
         * @desc used for callback function when there is an error received from the server
         */
        function errorReturnFn(err) {
            return $q.reject(err);
        }

        /******Common Querying******/

        /**
         * @name getAllEngines
         * @returns {object} - successful retrieval of all engines, or error message
         * @desc gets all of the engines
         */
        function getAllEngines() {
            var url = ENDPOINT + "/api/engine/all";

            return $http.get(url, {cache: false})
                .then(function (response) {
                    return response.data.engines;
                }, errorReturnFn);
        }

        /**
         * @name getEngineMetaModel
         * @returns {object} - successful retrieval of the metamodel data, or error message
         * @desc gets all of the metamodel data for the engine
         */
        function getEngineMetaModel(engine) {
            var url, engineName = engine.name || engine;
            if (engine.name) {
                url = ENDPOINT + "/api/engine/central/context/metamodel?engineName=" + engineName;
            }

            return $http.get(url, {cache: false})
                .then(function (response) {
                    return response.data;
                }, errorReturnFn);
        }

        /**
         * @name runSelectQuery
         * @param engine {string} - the specific engine to query
         * @param sparql - sparql query itself
         * @param paramBinders - binding for the parameters being sent
         * @param paramValues - parameter values being sent
         * @returns {object} - successful retrieval of query data, or error message
         * @desc runs a select sparql query against the specific engine on the server
         */
        function runSelectQuery(engine, sparql, paramBinders, paramValues) {

            var url = ENDPOINT + "/api/engine/e-" + engine + "/querys?api=" + null,
                postData = "query=" + encodeURIComponent(sparql) + "&paramBind=" + JSON.stringify(paramBinders) + "&paramValue=" + JSON.stringify(paramValues);

            return $http({
                url: url,
                method: "POST",
                cache: false,
                data: postData,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getOptionsForInsight
         * @param engine {string} - the core engine that the insight references
         * @param insightID {object} - the id of the selected insight
         * @returns {*}
         * @desc makes request to server for insight options given an engine and an insight
         */
        function getOptionsForInsight(engine, insightID) {
            var url = ENDPOINT +
                "/api/engine/e-" + engine + "/insight?insight=" + insightID + "&api=" + null;

            return $http.get(url, {cache: false})
                .then(function (response) {
                    return response.data;
                }, errorReturnFn);
        }

        /**
         * @name getChartDataFromInsightOption
         * @param config - config is an object with all the properties needed to construct the API for accessing the server and passing the right data,
         * @returns {*}
         * @desc makes request to server for chart data based on insight question and parameter
         */
        function getChartDataFromInsightOption(config) {
            // url needed to get data from an insight with no parameters
            var url = "";
            if (!_.isEmpty(config.relatedInsight)) {
                url = ENDPOINT + "/api/engine/e-" + config.engine + "/output?api=" + null;
            }
            else {
                url = ENDPOINT + "/api/engine/e-" + config.engine + "/output?api=" + null;
            }

            var postData = "";
            if (config.insight && config.params) {
                postData = "insight=" + config.insight;

                // if the params object is not empty, add the params to the url
                if (!_.isEmpty(config.params)) {
                    var paramType = "", paramObj = {}, selectedArray = [];
                    for (var key in config.params) {
                        if (config.params[key].type) {
                            paramType = config.params[key].type;
                            if (!angular.isArray(config.params[key].selected)) { //this is string when getting from the getOptionsForInsight call; other call is just the querys call which returns array of array
                                selectedArray = [config.params[key].selected];
                            } else {
                                selectedArray = config.params[key].selected;
                            }
                            paramObj[paramType] = selectedArray;
                        } else {
                            //params passed in the way we need it already
                            paramObj = config.params;
                            break;
                        }
                    }
                    postData += "&params=" + encodeURIComponent(JSON.stringify(paramObj));
                }
            } else {
                // adding sparql and playsheet for preview functionality
                postData = "sparql=" + encodeURIComponent(config.sparql) + "&layout=" + encodeURIComponent(config.layout);
            }

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
                .then(function (response) {
                    if (response.data.layout === "prerna.ui.components.playsheets.MashupPlaySheet" ||
                        response.data.layout === "prerna.ui.components.specific.tap.SysSiteOptPlaySheet" ||
                        response.data.layout === "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet" ||
                        response.data.layout === "prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet" ||
                        response.data.layout === "prerna.ui.components.specific.ousd.RoadmapCleanTablePlaySheet" ||
                        response.data.layout === "prerna.ui.components.specific.ousd.RoadmapTimelineStatsPlaySheet" || 
                        response.data.layout === "prerna.ui.components.specific.navypeo.NavyScoreboardPlaysheet") {
                            return response.data;
                    }

                    if (!_.isEmpty(response.data.data)) {
                        return response.data;
                    } else if (response.data.specificData) {
                        return response.data;
                    } else if (response.data.layout === 'Graph' || response.data.layout === 'VivaGraph') {
                        return response.data;
                    } else if (response.data.pkqlOutput && response.data.pkqlOutput.insights && response.data.pkqlOutput.insights[0] && response.data.pkqlOutput.insights[0].pkqlData && response.data.pkqlOutput.insights[0].pkqlData[0] && response.data.pkqlOutput.insights[0].pkqlData[0].status === "INPUT_NEEDED") {
                        //TODO hacky way for now...to check for params
                        return response.data;
                    } else {
                        return '';
                    }
                }, errorReturnFn);
        }

        /**
         * @name getConceptLogicals
         * @param conceptualName
         * @param parentName
         * @returns {*}
         */
        function getConceptLogicals(conceptualName, parentName) {
            var url = ENDPOINT + "/api/engine/central/context/conceptLogicals";
            if(!parentName) {
                parentName = "";
            }
            var postData = "conceptURI=" + encodeURIComponent(JSON.stringify([conceptualName]));
            postData += "&parentConcept=" + encodeURIComponent(JSON.stringify([parentName]));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getConnectedNodes
         * @param engine {object} engine the selected node is from
         * @param conceptURI uri of the selected node
         * @returns an object that contains all of the connections by dbs
         * @desc get all of the related concepts based on the conceptURI passed in
         */
        function getConnectedNodes(conceptURI) {
            var url = ENDPOINT + "/api/engine/central/context/getConnectedConcepts2";

            var postData = "conceptURI=" + encodeURIComponent(JSON.stringify(conceptURI));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getConceptProperties
         * @param engine engine the selected node is from
         * @param nodeURI uri of the selected node
         * @returns an object that contains all of the properties
         * @desc get all of the related properties based on the nodeURI passed in
         */
        function getConceptProperties(engine, nodeURI) {
            var url = ENDPOINT + "/api/engine/central/context/conceptProperties",
                postData = "conceptURI=" + encodeURIComponent(JSON.stringify(nodeURI));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getInstancesForConcept
         * @param {string} engine the engine the concept belongs to
         * @param {object} tripleObj the {subject predicate object}
         * @param {object[]} selectedNodeProps the selected node properties [prop1]
         * @param {string} existingConcept the concept in the data structure
         * @param {string} joinType type of join
         * @param {string} insightID unique id of the data structure in the backend
         * @param {string} columnHeader name of column header
         * @param {string} searchTerm the term to search for
         * @param {string} limit on the return results
         * @param {string} offset beginning of the range of results returned
         * @param {string[]} joinConcept the equivalent concept to existingConcept; most of the times it is the same until user selects a 'similar' concept
         * @returns {promise} promise of data from BE
         * @desc get the instances for a concept and get search results; it's doing two things in one call....
         */
        function getInstancesForConcept(engine, tripleObj, selectedNodeProps, existingConcept, joinType, insightID, columnHeader, searchTerm, limit, offset, joinConcept) {
            // replace spaces with underscores
            if (searchTerm == undefined) {
                searchTerm = "";
            }
            searchTerm = searchTerm.split(' ').join('_');
            // make everything URI safe
            existingConcept = encodeURIComponent(existingConcept);
            joinType = encodeURIComponent(joinType);
            insightID = encodeURIComponent(insightID);
            var columnHeaderUri = encodeURIComponent(columnHeader.uri);
            searchTerm = encodeURIComponent(searchTerm);
            limit = encodeURIComponent(limit);
            offset = encodeURIComponent(offset);

            var url = ENDPOINT + "/api/engine/e-" + engine.name
                + "/searchColumn?existingConcept=" + existingConcept + "&joinType=" + joinType + "&insightID=" + insightID + "&columnHeader=" + columnHeaderUri + "&searchTerm=" + searchTerm +
                "&limit=" + limit + "&offset=" + offset;

            if (joinConcept) {
                joinConcept = encodeURIComponent(joinConcept);
                url += "&joinConcept=" + joinConcept
            }

            /*var queryData = {};

             queryData = {
             QueryData: tripleObj,
             SelectedNodeProps: selectedNodeProps,
             SelectedEdgeProps: []
             };*/

            var selectors = {}, filters = {}, relations = {};

            if (tripleObj.relTriples[0].length === 1) {
                if (columnHeader.prop) {
                    selectors[columnHeader.prop.parent] = [columnHeader.prop.name];
                } else {
                    selectors[tripleObj.relTriples[0][0]] = ["PRIM_KEY_PLACEHOLDER"];

                    if (selectedNodeProps && selectedNodeProps.length > 0) {
                        selectors[tripleObj.relTriples[0][0]] = [];
                        for (var i = 0; i < selectedNodeProps.length; i++) {
                            selectors[tripleObj.relTriples[0][0]].push(selectedNodeProps[i].varKey); //varKey must be the physical name
                        }
                    }
                }
            } else {
                if (columnHeader.prop) {
                    if (columnHeader.physicalName === columnHeader.prop.name) {
                        selectors[columnHeader.prop.parent] = [columnHeader.prop.name];
                    } else {
                        selectors[columnHeader.physicalName] = ["PRIM_KEY_PLACEHOLDER"];
                    }

                    if (joinType === "inner") relations[columnHeader.prop.parent] = {"inner.join": [columnHeader.prop.parent + "__" + columnHeader.prop.name]};
                    else if (joinType === "partial") relations[columnHeader.prop.parent] = {"left.outer.join": [columnHeader.prop.parent + "__" + columnHeader.prop.name]};
                    else if (joinType === "outer") relations[columnHeader.prop.parent] = {"outer.join": [columnHeader.prop.parent + "__" + columnHeader.prop.name]};
                } else {
                    if (tripleObj.relTriples[0][0] === columnHeader.physicalName) {
                        selectors[tripleObj.relTriples[0][0]] = ["PRIM_KEY_PLACEHOLDER"];
                    } else {
                        selectors[tripleObj.relTriples[0][2]] = ["PRIM_KEY_PLACEHOLDER"];
                    }

                    if (joinType === "inner") relations[tripleObj.relTriples[0][0]] = {"inner.join": [tripleObj.relTriples[0][2]]};
                    else if (joinType === "partial") relations[tripleObj.relTriples[0][0]] = {"left.outer.join": [tripleObj.relTriples[0][2]]};
                    else if (joinType === "outer") relations[tripleObj.relTriples[0][0]] = {"outer.join": [tripleObj.relTriples[0][2]]};
                }
            }

            if (tripleObj.filter) {
                for (var node in tripleObj.filter) {
                    filters[node] = {"=": tripleObj.filter[node]};
                }
            }

            var queryData = {
                selectors: selectors
            };

            if (!_.isEmpty(relations)) queryData["relations"] = relations;
            if (!_.isEmpty(filters)) queryData["andfilters"] = filters;

            var postData = "QueryData=" + encodeURIComponent(JSON.stringify(queryData));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name clearCache
         * @param engine
         * @dsec
         * @returns {*}
         */
        function clearCache(engine) {
            var url = ENDPOINT + "/api/engine/e-" + engine.name
                + "/clearCache?";

            var queryData = {};

            return $http({
                url: url,
                method: "POST",
                //  data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function loadAllFromCache(engine, searchTerm) {
            var url = ENDPOINT + "/api/engine/e-" + engine.name
                + "/loadAllFromCache?searchTerm=" + searchTerm;

            return $http({
                url: url,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function getTable(insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID
                + "/getVizTable";

            return $http({
                url: url,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {

                //formatting data to create array of objects and with filteredData (passing in true creates the filteredData);
                var formattedData = utilityService.formatTableData(response.data.headers, response.data.data, true);
                //extending so we combine and override the existing data with formatted data;
                angular.extend(response.data, formattedData);


                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getTableHeaders
         * @param {string} insightID
         * @dsec gets headers from the data frame
         * @returns {*}
         */
        function getTableHeaders(insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/getTableHeaders";

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getNextTableData
         * @param {object} model
         * @param {string} insightID
         * @param {integer} startRow
         * @param {integer} endRow
         * @dsec gets a set number of rows from the data frame
         * @returns {*}
         */
        function getNextTableData(model, insightID, startRow, endRow) {
            var url = ENDPOINT + "/api/engine/i-" + insightID
                + "/getNextTableData?startRow=" + startRow + "&endRow=" + endRow;

            //remove false values
            var postData = "selectors=" + encodeURIComponent(JSON.stringify(_.compact(model.selectors))) + " &sortModel=" + encodeURIComponent(JSON.stringify(model.sortModel));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                //formatting data to create array of objects and with filteredData (passing in true creates the filteredData);
                var formattedData = utilityService.formatTableData(response.data.headers, response.data.data, true);
                //extending so we combine and override the existing data with formatted data;
                angular.extend(response.data, formattedData);


                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name getGraphData
         * @param {string} insightID
         * @dsec gets data for the graph
         * @returns {*}
         */
        function getGraphData(insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID
                + "/getGraphData";

            return $http({
                url: url,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function getPerspectivesForEngine(engine) {
            var url = ENDPOINT + "/api/engine/e-" + engine.name + "/perspectives?api=" + engine.api;

            return $http.get(url, {cache: false})
                .then(function (response) {
                    return response.data.perspectives;
                }, errorReturnFn);
        }


        /**
         * @name isDbInsight
         * @param insightID
         * @dsec determines if the insight is saved to a db or if its running off an in memory table (in memory table comes from drag
         * and drop in upload/create)
         * @returns {object}
         */
        function isDbInsight(insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/isDbInsight";

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name saveFilesInInsightAsDb
         * @param insightID
         * @param engineName
         * @dsec Creates a db before saving an insight
         * @returns {object}
         */
        function saveFilesInInsightAsDb(insightID, engineName) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/saveFilesInInsightAsDb";
            var postData = "engineName=" + encodeURIComponent(engineName);

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function addInsight(engine, insightID, perspective, order, insightName, layout,
                            paramQueryList, dataTableAlign, toolData, specificData) {
            var url = ENDPOINT + "/api/engine/dbAdmin/insight-" + engine.name + "/addFromAction",

                postData = "perspective=" + encodeURIComponent(perspective)
                    + "&insightID=" + encodeURIComponent(insightID)
                    + "&order=" + encodeURIComponent(order)
                    + "&insightName=" + encodeURIComponent(insightName)
                    + "&layout=" + encodeURIComponent(layout)
                    + "&pkqlsToAdd=" + encodeURIComponent(JSON.stringify(paramQueryList));

            if (dataTableAlign) {
                postData += "&dataTableAlign=" + JSON.stringify(dataTableAlign);
            }

            if (toolData) {
                postData += "&uiOptions=" + encodeURIComponent(JSON.stringify(toolData));
            }

            if (specificData) {
                postData += "&specificData=" + encodeURIComponent(JSON.stringify(specificData));
            }

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response;
            }, errorReturnFn);
        }

        function editInsight(engine, insightID, perspective, questionOrder, question, layout,
                             paramQueryList, dataTableAlign, toolData, specificData) {

            var url = ENDPOINT + "/api/engine/dbAdmin/insight-" + engine.name + "/editFromAction",
                postData = "insightID=" + encodeURIComponent(insightID)
                    + "&layout=" + encodeURIComponent(layout)
                    + "&pkqlsToAdd=" + encodeURIComponent(JSON.stringify(paramQueryList));

            if (perspective) {
                postData += "&perspective=" + encodeURIComponent(perspective);
            }
            if (question) {
                postData += "&insightName=" + encodeURIComponent(question);
            }
            if (questionOrder) {
                postData += "&order=" + encodeURIComponent(questionOrder);
            }
            if (dataTableAlign) {
                postData += "&dataTableAlign=" + JSON.stringify(dataTableAlign);
            }
            if (toolData) {
                postData += "&uiOptions=" + encodeURIComponent(JSON.stringify(toolData));
            }
            if (specificData) {
                postData += "&specificData=" + encodeURIComponent(JSON.stringify(specificData));
            }

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function getInsightsForPerspective(engine, perspective) {
            var url = ENDPOINT + "/api/engine/e-" + engine.name
                + "/insights?perspective=" + perspective + "&api=" + engine.api;

            return $http.get(url, {cache: false})
                .then(function (response) {
                    var data = response.data;

                    return data;
                }, errorReturnFn);
        }

        /****** Name Server Calls ******/
        function getRelatedInsights(engine, playSheetID, selectedURI, urltemp, webapptemp, filterData, limit, offset) {
            var url = ENDPOINT + "/api/engine/centralNameServer/context/insights",
                postData = "selectedURI=" + encodeURIComponent(JSON.stringify(selectedURI));

            postData += "&filterData=" + encodeURIComponent(JSON.stringify(filterData));
            postData += "&limit=" + encodeURIComponent(JSON.stringify(limit));
            postData += "&offset=" + encodeURIComponent(JSON.stringify(offset));

            if (webapptemp !== "LocalMasterDatabase") {
                url += "?centralServerUrl=" + urltemp + webapptemp;
            }

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {"Content-Type": "application/x-www-form-urlencoded"}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }


        /******Searching for and Retrieving Insights (Solr Calls)******/
        /**
         * @name getInsight
         * @param insightConcat - concat of engine and id (ex: Movie_DB_32)
         * @desc Returns solr insight object
         */
        function getInsight(insightConcat) {
            var url = ENDPOINT + "/api/engine/central/context/getInsight";
            url += "?insight=" + encodeURIComponent(insightConcat);

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         *
         * @param insightID
         * @returns {*}
         */
        function getFilterModel(insightID) {
            var url = ENDPOINT +
                "/api/engine/i-" + insightID + "/getFilterModel";

            return $http({
                url: url,
                method: "GET",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function filterData(filterValuesMap, insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID
                + "/filterData";

            var postData = "";
            if (insightID) {
                postData += "insightID=" + encodeURIComponent(insightID);
            }

            postData += "&filterValues=" + encodeURIComponent(JSON.stringify(filterValuesMap));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function getInsightMetamodel(id, query) {
            var url = ENDPOINT + "/api/engine/i-" + id + "/getInsightMetamodel";
            var postData = "";

            postData += "insightID=" + encodeURIComponent(id);
            postData += "&query=" + encodeURIComponent(query);

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response;
            }, errorReturnFn);
        }


        /****** Visual Panel Calls ******/
        /**
         * @name checkDuplicates
         * @param concepts {Array} - selected concepts to check for duplicates
         * @param insightID {object} - the id of the selected insight
         * @desc calls monolithService to return bool if values are duplicated
         */

        function checkDuplicates(concepts, insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/hasDuplicates";

            var postData = "concepts=" + encodeURIComponent(JSON.stringify(concepts));

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name applyColumnStats
         * @param mathMap {object} - mapping of selected Options
         * @param insightID {object} - the id of the selected insight
         * @desc returns new data with correct grouping
         */

        function applyColumnStats(mathMap, insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/applyColumnStats";


            var postData = "groupBy=" + encodeURIComponent(JSON.stringify(mathMap.groupBy));
            postData += "&mathMap=" + encodeURIComponent(JSON.stringify(mathMap.mathMap));

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name runAlgorithm
         * @param algorithm - which algorithm to run
         * @param params - [array] of param values
         * @param filterParamBools - [array] of booleans for the params
         * @param instanceID - ID of the instance
         * @param insightID - ID of insight
         * @returns {object} - successful retrieval of query data, or error message
         * @desc runs a specified algorithm on the server
         */
        function runAlgorithm(algorithm, insightID, params, filterParamBools, instanceID) {

            var url = ENDPOINT + "/api/engine/i-" + insightID + "/analytics/runAlgorithm";
            var postData = "algorithm=" + encodeURIComponent(algorithm) + "&insightID=" + encodeURIComponent(insightID) + "&parameters=" + encodeURIComponent(JSON.stringify(params)) + "&filterParams=" + encodeURIComponent(JSON.stringify(filterParamBools));

            if (!_.isEmpty(instanceID)) {
                postData += "&instanceID=" + encodeURIComponent(instanceID);
            }

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name determineDataTypesForFile
         * @param file the data that will be sent to the BE
         * @param delimiter delimiter of the data that will be sent to the BE
         * @returns {Object} unique file key information and table headers
         * @desc this call will send the json data to the backend to return header type information
         */
        function determineDataTypesForFile(file, delimiter) {
            var url = ENDPOINT + "/api/engine/uploadFile/determineDataTypesForFile";


            var fd = new FormData();
            fd.append('file', file);
            fd.append('delimiter', delimiter);


            return $http({
                url: url,
                method: "POST",
                data: fd,
                cache: false,
                headers: {'Content-Type': undefined}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name determineDataTypesForImportData
         * @param api the api link (import.io) that will be sent to the BE
         * @returns {Object} data headers
         * @desc this call will send the json data to the backend to return header type information
         */
        function determineDataTypesForImportData(apiParam, source) {
            var url = ENDPOINT + "/api/engine/uploadFile/determineDataTypesForFile";

            var fd = new FormData();

            if (source === 'Import.io') {
                fd.append('api', apiParam);
            } else if (source === 'Amazon Product - Search') {
                fd.append('itemSearch', apiParam);
            } else if (source === 'Amazon Product - Lookup') {
                fd.append('itemLookup', apiParam);
            }

            // fd.append('api', api);

            return $http({
                url: url,
                method: "POST",
                data: fd,
                cache: false,
                headers: {'Content-Type': undefined}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }


        /**
         * @name excelFileUpload
         * @param files the data that will be sent to the BE to upload a new database
         * @param generateMetaModelType
         * @returns success or failure message
         * @desc this call will parse uploaded csv and return its data
         */
        function excelFileUpload(files, generateMetaModelType) {
            var url = ENDPOINT + "/api/engine/uploadDatabase/excel/uploadFile";

            var fd = new FormData();
            for (var i = 0; i < files.length; i++) {
                fd.append('file', files[i].file);
                fd.append('delimiter', ',');
            }
            fd.append('generateMetaModel', generateMetaModelType);

            return $http({
                url: url,
                data: fd,
                method: "POST",
                cache: false,
                headers: {'Content-Type': undefined}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }


        /**
         * @name csvFileUpload
         * @param files the data that will be sent to the BE to upload a new database
         * @param propFiles
         * @param questionFile
         * @param generateMetaModelType
         * @param customDelimiter
         * @returns success or failure message
         * @desc this call will parse uploaded csv and return its data
         */
        function csvFileUpload(files, propFiles, questionFile, generateMetaModelType, customDelimiter) {
            var url = ENDPOINT + "/api/engine/uploadDatabase/csv/uploadFile";

            var fd = new FormData();
            for (var i = 0; i < files.length; i++) {
                fd.append('file', files[i].file);
                customDelimiter ? fd.append('delimiter', customDelimiter) : fd.append('delimiter', ',');
            }

            //add in propFile(s)
            for (var i = 0; i < propFiles.length; i++) {
                fd.append('propFile', propFiles[i].file[0])
            }

            //add in questionFile
            if (questionFile && questionFile.file) {
                fd.append('questionFile', questionFile.file[0]);
            }
            fd.append('generateMetaModel', generateMetaModelType);

            return $http({
                url: url,
                data: fd,
                method: "POST",
                cache: false,
                headers: {'Content-Type': undefined}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name csvFlatUpload
         * @param data the data that will be sent to the BE to upload a new database
         * @returns success or failure message
         * @desc this call will send upload cvs data into a database as flat table
         */
        function csvFlatUpload(data) {
            var url = ENDPOINT + "/api/engine/uploadDatabase/csv/flat";

            var postData = "";
            postData += "importMethod=" + encodeURIComponent(data.importMethod);
            postData += "&dbName=" + encodeURIComponent(data.dbName);
            postData += "&file=" + encodeURIComponent(data.file);
            //adding base uri as hard coded string for now
            postData += "&customBaseURI=" + encodeURIComponent("http://semoss.org/ontologies");
            postData += "&headerData=" + encodeURIComponent(JSON.stringify(data.headerData));
            postData += "&newHeaders=" + encodeURIComponent(JSON.stringify(data.newHeaders));

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }


        /**
         * @name excelFlatUpload
         * @param data the data that will be sent to the BE to upload a new database
         * @returns success or failure message
         * @desc this call will send upload cvs data into a database as flat table
         */
        function excelFlatUpload(data) {
            var url = ENDPOINT + "/api/engine/uploadDatabase/excel/flat";

            var postData = "";
            postData += "importMethod=" + encodeURIComponent(data.importMethod);
            postData += "&dbName=" + encodeURIComponent(data.dbName);
            postData += "&file=" + encodeURIComponent(data.file);
            //adding base uri as hard coded string for now
            postData += "&customBaseURI=" + encodeURIComponent("http://semoss.org/ontologies");
            postData += "&headerData=" + encodeURIComponent(JSON.stringify(data.headerData));
            postData += "&newHeaders=" + encodeURIComponent(JSON.stringify(data.newHeaders));

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name checkHeaders
         * @param data the data that will be sent to the BE to check the headers for flat upload
         * @returns success or failure message
         * @desc this call will check the headers of a flat upload for both excel and csv
         */
        function checkHeaders(data) {
            var url = ENDPOINT + "/api/engine/uploadDatabase/headerCheck";

            var postData = "";
            postData += "uploadType=" + encodeURIComponent(data.uploadType);
            postData += "&userHeaders=" + encodeURIComponent(JSON.stringify(data.userHeaders));

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }


        function getAllDBConcepts() {
            var url = ENDPOINT + "/api/engine/central/context/getAllConcepts",
                postData = "localMasterDbName=LocalMasterDatabase";

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        function runPlaySheetMethod(engine, insightID, toolData, playSheetFunctionToCall) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/do-" + playSheetFunctionToCall; //?api=" + engine.api;

            var postData = "data=" + encodeURIComponent(JSON.stringify(toolData));

            return $http({
                url: url,
                method: "POST",
                data: postData,
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }


        /**
         * @name runPKQLQuery
         * @returns runs pkql query and returns the new data
         * @desc this call will run the pkql query param and return the new data
         */
        function runPKQLQuery(insightID, input) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/applyCalc";
            var postData = "expression=" + encodeURIComponent(input);

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        /**
         * @name clearPKQLQuery
         * @returns clears pkql query on the insightID
         * @desc this call will run the pkql query param and return the new data
         */
        function clearPKQLQuery(insightID) {
            var url = ENDPOINT + "/api/engine/i-" + insightID + "/clear";
            var postData = "";

            return $http({
                url: url,
                data: postData,
                method: "POST",
                cache: false,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function (response) {
                return response.data;
            }, errorReturnFn);
        }

        return {
            runSelectQuery: runSelectQuery,
            getOptionsForInsight: getOptionsForInsight,
            getChartDataFromInsightOption: getChartDataFromInsightOption,
            getFilterModel: getFilterModel,
            getInsight: getInsight,
            getRelatedInsights: getRelatedInsights,
            getAllEngines: getAllEngines,
            getEngineMetaModel: getEngineMetaModel,
            filterData: filterData,
            checkDuplicates: checkDuplicates,
            applyColumnStats: applyColumnStats,
            getConnectedNodes: getConnectedNodes,
            getConceptLogicals: getConceptLogicals,
            getConceptProperties: getConceptProperties,
            runAlgorithm: runAlgorithm,
            getInstancesForConcept: getInstancesForConcept,
            clearCache: clearCache,
            getTable: getTable,
            getTableHeaders: getTableHeaders,
            getNextTableData: getNextTableData,
            loadAllFromCache: loadAllFromCache,
            getPerspectivesForEngine: getPerspectivesForEngine,
            isDbInsight: isDbInsight,
            saveFilesInInsightAsDb: saveFilesInInsightAsDb,
            addInsight: addInsight,
            editInsight: editInsight,
            getInsightsForPerspective: getInsightsForPerspective,
            getInsightMetamodel: getInsightMetamodel,
            getGraphData: getGraphData,
            determineDataTypesForFile: determineDataTypesForFile,
            determineDataTypesForImportData: determineDataTypesForImportData,
            excelFileUpload: excelFileUpload,
            csvFileUpload: csvFileUpload,
            csvFlatUpload: csvFlatUpload,
            excelFlatUpload: excelFlatUpload,
            checkHeaders: checkHeaders,
            getAllDBConcepts: getAllDBConcepts,
            runPlaySheetMethod: runPlaySheetMethod,
            runPKQLQuery: runPKQLQuery,
            clearPKQLQuery: clearPKQLQuery
        };
    }
})();