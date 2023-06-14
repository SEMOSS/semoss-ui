(function () {
    "use strict";

    angular.module('app.tap.network-timeline.service', [])
        .factory('networkTimelineService', networkTimelineService);

    networkTimelineService.$inject = [];

    function networkTimelineService() {
        var maxLOE = 0,
            sliderState = "Initial",
            sliderMax = 0,
            sliderValue = 0;


        function setSliderValue(val) {
            sliderValue = val;
        }

        function getSliderValue() {
            return sliderValue;
        }

        function setSliderMax(max) {
            sliderMax = max;
        }

        function getSliderMax() {
            return sliderMax;
        }

        function setMaxLOE(max) {
            maxLOE = max;
        }

        function setSliderState(newState) {
            sliderState = newState;
        }

        function getSliderState() {
            return sliderState;
        }

        function getMaxLOE() {
            return maxLOE;
        }

        function calculateMaxLOE(data) {
            maxLOE = 0;
            var tempTotal = 0;
            var edgeLength = data.edges.length;

            //check through the edges for timeHash and get maxLOE
            for (var i = 0; i < edgeLength; i++) {
                tempTotal = getTotalLOE(data.edges[i]);

                if (tempTotal > maxLOE) {
                    maxLOE = tempTotal;
                }
            }

            //check through the nodes for timeHash and get maxLOE
            for (var node in data.nodes) {
                tempTotal = getTotalLOE(data.nodes[node]);

                if (tempTotal > maxLOE) {
                    maxLOE = tempTotal;
                }
            }

            return maxLOE + 1;
        }

        //adds the loe from all items in the timeHash if item has timeHash property
        function getTotalLOE(item) {
            var total = 0;
            if (item.propHash.timeHash) {
                if (item.propHash.timeHash.Design) {
                    total += item.propHash.timeHash.Design.LOE;
                }
                if (item.propHash.timeHash.Requirements) {
                    total += item.propHash.timeHash.Requirements.LOE;
                }
                if (item.propHash.timeHash.Test) {
                    total += item.propHash.timeHash.Test.LOE;
                }
                if (item.propHash.timeHash.Develop) {
                    total += item.propHash.timeHash.Develop.LOE;
                }
                if (item.propHash.timeHash.Deploy) {
                    total += item.propHash.timeHash.Deploy.LOE;
                }
            }
            return total;
        }

        function hasTimeHash(collection) {
            for (var item in collection) {
                if (collection[item].propHash.timeHash) {
                    return true;
                }
            }
            return false;
        }

        return {
            calculateMaxLOE: calculateMaxLOE,
            getMaxLOE: getMaxLOE,
            setMaxLOE: setMaxLOE,
            setSliderState: setSliderState,
            getSliderState: getSliderState,
            getSliderMax: getSliderMax,
            setSliderMax: setSliderMax,
            getSliderValue: getSliderValue,
            setSliderValue: setSliderValue,
            hasTimeHash: hasTimeHash
        };

    }

})();