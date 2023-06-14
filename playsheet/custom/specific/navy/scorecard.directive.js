(function () {
    "use strict";

    angular.module("app.scorecard.directive", [])
        .directive("scorecard", scorecard);

    scorecard.$inject = ['$filter', 'dataService'];

    function scorecard($filter, dataService) {
        scorecardController.$inject = ['$scope', 'monolithService'];
        scorecardLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];
        return {
            restrict: 'A',
            require: ['^chart'],
            controllerAs: 'scorecard',
            controller: scorecardController,
            link: scorecardLink,
            templateUrl: "custom/specific/navy/scorecard.directive.html",
            priority: 300
        };

        function scorecardLink(scope, ele, attrs, controllers) {
            scope.dashboardController = controllers[0];

            scope.dashboardController.dataProcessor = function (newData) {
                //set the tableData properly, this is sent to the directive
                var data = JSON.parse(JSON.stringify(newData));
                // scope.systems = singleViewService.getSingleViewInsightData().params.System;
                //data service get insight data
                var insightData = dataService.getInsightData();
                console.log(insightData);

                data.overallReadinessAssessment = $filter('shortenAndReplaceUnderscores')(data.overallReadinessAssessment);

                //filter the archtypes portion of the scorecard
                for(var i = 0; i < data.archtypes.length; i ++) {
                    data.archtypes[i].name = $filter('shortenAndReplaceUnderscores')(data.archtypes[i].name);
                    for(var j = 0; j < data.archtypes[i].riskStatus.length; j ++) {
                        data.archtypes[i].riskStatus[j].risk = $filter('shortenAndReplaceUnderscores')(data.archtypes[i].riskStatus[j].risk);
                        data.archtypes[i].riskStatus[j].details = customRemoveQuotes(data.archtypes[i].riskStatus[j].details);
                    }
                }
                //filter the unknown items portion of the scorecard
                for(var i = 0; i < data.unknownItems.length; i ++) {
                    data.unknownItems[i].details = customRemoveQuotes(data.unknownItems[i].details);
                }

                //filter the System information portion of the scorecard
                var systemInfoArray = [];
                for(var i = 0; i < data.systemInformation.length; i ++) {
                    var splitArray = data.systemInformation[i].split(" - ");
                    splitArray[0] = $filter('shortenAndReplaceUnderscores')(splitArray[0]);
                    splitArray[1] = $filter('afterFilter')($filter('shortenAndReplaceUnderscores')(splitArray[1]), '/');
                    if(splitArray[1] != "null") {
                        splitArray[0] += ": ";
                        systemInfoArray.push(splitArray);
                    }
                }
                data.systemInformation = systemInfoArray;

                //set scope data to be used by scorecard.html
                scope.data = data;
            };

            //fixes issue with dropdown disappearing when filter searchbar was clicked
            angular.element('.scorecard-dropdown').on('click', function (e) {
                var target = angular.element(e.target);
                return !(target.hasClass("keepopen") || target.parents(".keepopen").length);
            });

            function customRemoveQuotes(string) {
                var str = string;
                //remove first and last double quote
                str = str.replace(/^"(.*)""."$/, '$1');
                //replace first set of "" with a string
                str = str.split('""');
                return str;
            }
        }

        function scorecardController($scope, monolithService) {
            //select Param function will refresh the scorecard with a new system
            $scope.selectParam = function(paramValue) {
                var params = JSON.parse(JSON.stringify(singleViewService.getSingleViewInsightData().params));
                params.System.selected = paramValue;
                params.System.param.selected = paramValue;

                monolithService.getChartDataFromInsightOption({
                    "engine": singleViewService.getSingleViewInsightData().engine,
                    "insight": singleViewService.getSingleViewInsightData().label,
                    "params": params,
                    "relatedInsight": ""
                }).then(function (data) {
                    $scope.dashboardController.data = data;
                });
            };
			
			this.saveTile = function () {
                for (var i = 0; i< document.getElementsByClassName('scorecard-tile').length - 1; i++) {
                    document.getElementsByClassName('scorecard-tile')[i].style.overflow = 'hidden';
                }
                for (var i = 0; i< document.getElementsByClassName('scorecard-scroll').length - 1; i++) {
                    document.getElementsByClassName('scorecard-scroll')[i].style.overflow = 'hidden';
                }
                document.getElementsByClassName('scorecard-description-scroll')[0].style.overflow = 'hidden';

                html2canvas(document.getElementById('graph-canvas'), {
                    logging: true
                }).then(function(canvas) {
                    var img = canvas.toDataURL("image/jpg;base64");
                    download(img, "Scorecard.jpg", "image/jpg");
                });

                function download(strData, strFileName, strMimeType) {
                    var D = document,
                        A = arguments,
                        a = D.createElement("a"),
                        d = A[0],
                        n = A[1],
                        t = A[2] || "text/plain";

                    //build download link:
                    a.href = strData;


                    if (window.MSBlobBuilder) {
                        var bb = new MSBlobBuilder();
                        bb.append(strData);
                        return navigator.msSaveBlob(bb, strFileName);
                    } /* end if(window.MSBlobBuilder) */



                    if ('download' in a) {
                        a.setAttribute("download", n);
                        a.innerHTML = "downloading...";
                        D.body.appendChild(a);
                        setTimeout(function() {
                            a.click();
                            D.body.removeChild(a);
                        }, 66);
                        return true;
                    } /* end if('download' in a) */

                    //do iframe dataURL download:
                    var f = D.createElement("iframe");
                    D.body.appendChild(f);
                    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
                    setTimeout(function() {
                        D.body.removeChild(f);
                    }, 333);
                    return true;
                } /* end download() */
            };



        }
    }
})();