'use strict';

export default angular
    .module('app.grid-delta-search.directive', [])
    .directive('gridDeltaSearch', gridDeltaSearchDirective);

gridDeltaSearchDirective.$inject = ['$timeout'];

function gridDeltaSearchDirective($timeout) {
    gridDeltaSearchLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {
            localChartData: '=',
            getGrid: '=',
        },
        link: gridDeltaSearchLink,
        template: require('./grid-delta-search.directive.html'),
    };

    function gridDeltaSearchLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        var searchTimeout, dataChangeListener;

        scope.searchMap = {}; // key is value in grid, value is array of array of coords
        scope.searchResults = { total: 0, current: -1, matchPositions: [] };

        scope.search = search;
        scope.prev = prev;
        scope.next = next;
        scope.nextIfEnter = nextIfEnter;
        scope.clear = clear;

        function search() {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            searchTimeout = $timeout(function () {
                if (scope.query && scope.query.length > 0) {
                    var matchKeys = Object.keys(scope.searchMap).filter(
                        _isMatch
                    );

                    scope.searchResults.matchPositions = [];
                    matchKeys.forEach(_getMatchPositions);
                    scope.searchResults.total = matchKeys.reduce(_getTotal, 0);
                    scope.searchResults.current = -1;
                }
            }, 250);
        }

        function _isMatch(key) {
            return key.indexOf(scope.query.toLowerCase()) > -1;
        }

        function _getTotal(accum, matchKey) {
            return accum + scope.searchMap[matchKey].length;
        }

        function _getMatchPositions(match) {
            scope.searchResults.matchPositions =
                scope.searchResults.matchPositions.concat(
                    scope.searchMap[match]
                );
        }

        function prev() {
            if (scope.searchResults.current > 0) {
                scope.searchResults.current--;
            } else {
                scope.searchResults.current = scope.searchResults.total - 1;
            }

            _goToCurrent();
        }

        function next() {
            if (scope.searchResults.current + 1 === scope.searchResults.total) {
                scope.searchResults.current = 0;
            } else {
                scope.searchResults.current++;
            }

            _goToCurrent();
        }

        function nextIfEnter(e) {
            if (e.keyCode === 13) {
                next();
            }
        }

        function clear() {
            scope.query = '';
            scope.searchResults.current = 0;
            scope.searchResults.total = 0;
            scope.searchResults.keysThatMatch = [];
        }

        function _goToCurrent() {
            var grid = scope.getGrid(),
                currentValCoords =
                    scope.searchResults.matchPositions[
                        scope.searchResults.current
                    ];
            if (currentValCoords) {
                grid.gridOptions.api.clearFocusedCell();
                grid.gridOptions.api.ensureIndexVisible(currentValCoords[0]);
                grid.gridOptions.api.ensureColumnVisible(currentValCoords[1]);
                grid.gridOptions.api.setFocusedCell(
                    currentValCoords[0],
                    currentValCoords[1],
                    'top'
                );
                const cell = grid.gridOptions.api.getFocusedCell();
                if (cell) {
                    grid.gridOptions.api.setFocusedCell(
                        cell.rowIndex,
                        cell.column
                    );
                }
            }
        }

        function _initialize() {
            scope.widgetCtrl.on('update-search-map', _setSearchMap);
            scope.widgetCtrl.on('update-search-map', search);
            _setSearchMap();
        }

        function _setSearchMap() {
            scope.searchMap = {};
            let columns = scope.localChartData.keys.map((col) => col.alias);
            scope.localChartData.values.forEach(function (row, rowIdx) {
                row.forEach(function (value, colIdx) {
                    var valueAsKey = String(value)
                            .toLowerCase()
                            .replace(/_/g, ' '),
                        columnName = columns[colIdx];
                    if (!scope.searchMap.hasOwnProperty(valueAsKey)) {
                        // all searches get lower cased for case
                        // insensitive searching
                        scope.searchMap[valueAsKey] = [];
                    }
                    scope.searchMap[valueAsKey].push([rowIdx, columnName]);
                });
            });
        }

        scope.$on('$destroy', function () {
            // dataChangeListener();
        });

        _initialize();
    }
}
