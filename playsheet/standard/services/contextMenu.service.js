(function () {
    "use strict";

    angular.module("app.context-menu.service", [])
        .factory("contextMenuService", contextMenuService);

    contextMenuService.$inject = ["$http", 'ENDPOINT', "_", 'alertService'];

    function contextMenuService($http, ENDPOINT, _, alertService) {

        var menu = {
            tabs: [{ label: "default", iconClass: "fa fa-home" }, { label: "Settings", iconClass: "fa fa-gears" }],
            activeTab: "default",
            relatedInsights: []
        };

        var exploreMenu = {
            tabs: [{ label: "Select a Database", iconClass: "fa fa-home" }, {
                label: "Recommended Databases",
                iconClass: "fa fa-database"
            }],
            activeTab: "Select a Database"
        };

        var url = window.location.origin;
        if (!url) {
            url = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }
        url += '/';

        var nameServer = [{ url: "", webapp: "LocalMasterDatabase", isconsumed: true }, {
            url: url,
            webapp: "NameServer",
            isconsumed: false
        }];
        return {
            getTabs: function () {
                return menu.tabs;
            },

            changeActiveTab: function (tabName) {
                menu.activeTab = tabName;
            },

            getActiveTab: function () {
                return menu.activeTab;
            },

            getContextMenu: function () {
                return menu;
            },
            getExploreMenu: function () {
                return exploreMenu;
            },
            getRelatedInsights: function () {
                return menu.relatedInsights;
            },

            setRelatedInsights: function (insights) {
                menu.relatedInsights = insights;
            },

            registerEngineToNameServer: function (centralServerUrl, contextPath, databases) {
                var url = "",
                    postData = "dbName=" + JSON.stringify(databases);

                if (contextPath === "LocalMasterDatabase") {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/registerEngine";
                } else {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/registerEngine?centralServerUrl=" + centralServerUrl + contextPath;
                }

                return $http({
                    url: url,
                    method: "POST",
                    data: postData,
                    cache: false,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }).then(function (response) {
                    var data = "";
                    if (typeof response.data === "string") {
                        data = jQuery.parseJSON(response.data);
                    } else {
                        data = response.data;
                    }
                    return data;
                }, function (error) {
                    var etext = "Error";
                    if (error.data && error.data.errorMessage) {
                        etext = error.data.errorMessage;
                    }
                    alertService(etext, 'Error', 'toast-error', 7000);
                    return error;
                });
            },

            unregisterEngineToNameServer: function (centralServerUrl, contextPath, databases) {
                var url = "",
                    postData = "dbName=" + JSON.stringify(databases);
                if (contextPath === "LocalMasterDatabase") {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/unregisterEngine";
                } else {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/unregisterEngine?centralServerUrl=" + centralServerUrl + contextPath;
                }

                return $http({
                    url: url,
                    method: "POST",
                    data: postData,
                    cache: false,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }).then(function (response) {
                    var data = "";
                    if (typeof response.data === "string") {
                        data = jQuery.parseJSON(response.data);
                    } else {
                        data = response.data;
                    }
                    return data;
                }, function (error) {
                    var etext = "Error";
                    if (error.data && error.data.errorMessage) {
                        etext = error.data.errorMessage;
                    }
                    alertService(etext, 'Error', 'toast-error', 7000);
                    return error;
                });
            },

            retrieveRelatedDBs: function (pathData, urltemp, webapptemp) {
                // Stuff is the same thing you send (path) after you hit the next button
                var url = "",
                    postData = "QueryData=" + JSON.stringify(pathData);
                if (webapptemp === "LocalMasterDatabase") {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/databases";
                } else {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/databases?centralServerUrl=" + urltemp + webapptemp;
                }

                return $http({
                    url: url,
                    method: "POST",
                    data: postData,
                    cache: false,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }).then(function (response) {

                    //if there is no data that gets returned, then return an empty array
                    if (!response.data) {
                        return [];
                    }
                    var data,
                        formattedData = [],
                        i = 0,
                        newObj = {},
                        percent = 0;

                    if (typeof response.data === "string") {
                        data = jQuery.parseJSON(response.data);
                    } else {
                        data = response.data;
                    }

                    //set the engines up the same way we have other engines set up (name, api)
                    for (i = 0; i < data.length; i++) {
                        percent = data[i].similarityScore * 100;
                        newObj = {
                            percent: percent,
                            syle: "",
                            name: data[i].database,
                            api: data[i].engineURI,
                            similarityScore: data[i].similarityScore
                        };

                        newObj.style = {
                            "background": "-webkit-gradient(linear, left top, right top, color-stop(" + percent + "%,#eee), color-stop(0%,#FFF));" + "\n" +
                            "-moz-linear-gradient(left center, #eee " + percent + "%, #FFF 0%);" + "\n" +
                            "-o-linear-gradient(left, #eee " + percent + "%, #FFF 0%);" + "\n" +
                            "linear-gradient(to right, #eee " + percent + "%, #FFF 0%);"
                        };

                        formattedData.push(newObj);
                    }

                    return formattedData;
                }, function (error) {
                    var etext = "Error";
                    if (error.data && error.data.errorMessage) {
                        etext = error.data.errorMessage;
                    }
                    alertService(etext, 'Error', 'toast-error', 7000);
                    console.log(error.status);
                });
            },

            retrieveSelectedURIContextInsights: function (engine, playSheetID, selectedURI, urltemp, webapptemp, filterData, limit, offset) {
                var url,
                    postData = "selectedURI=" + encodeURIComponent(JSON.stringify(selectedURI));

                postData += "&filterData=" + encodeURIComponent(JSON.stringify(filterData));
                postData += "&limit=" + encodeURIComponent(JSON.stringify(limit));
                postData += "&offset=" + encodeURIComponent(JSON.stringify(offset));

                if (webapptemp === "LocalMasterDatabase") {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/insights";
                } else {
                    url = ENDPOINT + "/api/engine/centralNameServer/context/insights?centralServerUrl=" + urltemp + webapptemp;
                }

                return $http({
                    url: url,
                    method: "POST",
                    data: postData,
                    cache: false,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }).then(function (response) {
                    var data;
                    if (typeof response.data === "string") {
                        console.log("Data came in as " + response.data);
                        data = jQuery.parseJSON(response.data);
                    } else {
                        data = response.data;
                    }

                    /*for (var i = 0; i < data.length; i++) {
                     var percent = data[i].similarityScore / 1 * 100;
                     data[i].percent = percent;
                     data[i].style = {
                     "background": "-webkit-gradient(linear, left top, right top, color-stop(" + percent + "%,#eee), color-stop(0%,#FFF));" + "\n" +
                     "-moz-linear-gradient(left center, #eee " + percent + "%, #FFF 0%);" + "\n" +
                     "-o-linear-gradient(left, #eee " + percent + "%, #FFF 0%);" + "\n" +
                     "linear-gradient(to right, #eee " + percent + "%, #FFF 0%);"
                     };
                     }*/

                    for (var i = 0; i < data.results.length; i++) {
                        var engineObj = {
                            "name": data.results[i]["core_engine"],
                            "api": undefined
                        }
                        data.results[i]["engine"] = engineObj;
                    }

                    /*alertService(data.length + " related insights found for " +
                     $filter("shortenAndReplaceUnderscores")(JSON.parse(decodeURIComponent(response.config.data.split("selectedURI=")[1]))),
                     'Success', 'toast-success', 5000);*/

                    return data;
                }, function (error) {
                    var etext = "Related insights error";
                    if (error.data && error.data.errorMessage) {
                        etext = error.data.errorMessage;
                    }
                    alertService(etext, 'Error', 'toast-error', 5000);
                    //backend needs to pass a warning message when non-URIs are passed to them
                    //alertService(error, 'Notification', 'toast-warning', 3000);

                    console.log(error.status);
                });
            },

            getRegisteredDBs: function (nameServerURL) {
                var url = ENDPOINT + "/api/engine/e-MasterDatabase/querys?api=" + nameServerURL + "/api/engine";

                var postData = "query=" + encodeURIComponent("SELECT DISTINCT ?Engine WHERE { {?Engine <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://semoss.org/ontologies/Concept/Engine>}}");

                return $http({
                    url: url,
                    method: "POST",
                    data: postData,
                    cache: false,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }).then(function (response) {
                    var data = _.flatten(response.data);
                    return data;
                }, function (error) {
                    var etext = "Error";
                    if (error.data && error.data.errorMessage) {
                        etext = error.data.errorMessage;
                    }
                    alertService(etext, 'Error', 'toast-error', 7000);
                    console.log(error.status);
                });
            },

            getLocalMasterDB: function () {
                var url = ENDPOINT + "/api/engine/e-LocalMasterDatabase/querys";

                var postData = "query=" + encodeURIComponent("SELECT DISTINCT ?Engine WHERE { {?Engine <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://semoss.org/ontologies/Concept/Engine>}}");

                return $http({
                    url: url,
                    method: "POST",
                    data: postData,
                    cache: false,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }).then(function (response) {
                    var data = _.flatten(response.data);
                    return data;
                }, function (error) {
                    var etext = "Error";
                    if (error.data && error.data.errorMessage) {
                        etext = error.data.errorMessage;
                    }
                    alertService(etext, 'Error', 'toast-error', 7000);
                    console.log("error status: " + error.status);
                });
            },

            getNameServerInfo: function () {
                return nameServer;
            },

            setNameServerInfo: function (newUrl, newWebapp) {
                nameServer.url = newUrl;
                nameServer.webapp = newWebapp;
            },

            addNameServer: function (newwebapp, newurl, newisconsumed) {
                nameServer.push({ url: newurl, webapp: newwebapp, isconsumed: newisconsumed })
            }
        };
    }
})();
