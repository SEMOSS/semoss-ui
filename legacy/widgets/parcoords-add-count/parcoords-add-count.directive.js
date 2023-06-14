'use strict';

export default angular
    .module('app.parcoords-add-count.directive', [])
    .directive('parcoordsAddCount', parcoordsAddCount);

parcoordsAddCount.$inject = [];

function parcoordsAddCount() {
    parcoordsAddCountCtrl.$inject = [];
    parcoordsAddCountLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'EA',
        scope: {},
        template: require('./parcoords-add-count.directive.html'),
        require: ['^widget'],
        controllerAs: 'parcoordsAddCount',
        bindToController: {},
        link: parcoordsAddCountLink,
        controller: parcoordsAddCountCtrl,
    };
    // controller for the directive
    function parcoordsAddCountCtrl() {}

    function parcoordsAddCountLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.parcoordsAddCount.removeSelected = removeSelected;
        scope.parcoordsAddCount.addCount = addCount;

        /**
         * @name removeSelected
         * @desc remove the selected value from the list
         * @param {string} selected - selected key
         * @returns {void}
         */
        function removeSelected(selected) {
            var list =
                    scope.parcoordsAddCount.overlapSelectedDropDown.list.slice(),
                index = list.indexOf(selected);
            scope.parcoordsAddCount.overlapRelatedDropDown.selected = '';
            scope.parcoordsAddCount.overlapRelatedDropDown.list = list;
            scope.parcoordsAddCount.overlapRelatedDropDown.list.splice(
                index,
                1
            );
        }

        /**
         * @name addCount
         * @desc add the count to the view
         * @param {string} from - from key
         * @param {string} to - to key
         * @param {string} uniqueCount - to is the count unique?
         * @returns {void}
         */
        function addCount(from, to, uniqueCount) {
            var active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                len,
                i,
                added = {},
                selectComponent = [],
                taskOptionsComponent = {},
                alignments = [],
                series = [],
                countName = 'Count_' + from + '_' + to;

            for (i = 0, len = keys.length; i < len; i++) {
                if (keys[i].alias === countName) {
                    continue;
                }

                if (keys[i].calculatedBy) {
                    if (!added[keys[i].alias]) {
                        selectComponent.push({
                            calculatedBy: keys[i].calculatedBy,
                            math: keys[i].math,
                            alias: keys[i].alias,
                        });

                        added[keys[i].alias] = true;
                    }
                } else if (!added[keys[i].alias]) {
                    selectComponent.push({
                        alias: keys[i].alias,
                    });

                    added[keys[i].alias] = true;
                }

                if (keys[i].model === 'dimension') {
                    alignments.push(keys[i].alias);
                } else if (keys[i].model === 'series') {
                    series.push(keys[i].alias);
                }
            }

            selectComponent.push({
                alias: countName,
            });

            alignments.push(countName);

            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                alignment: {
                    dimension: alignments,
                    series: series,
                },
            };

            scope.widgetCtrl.execute([
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                calculatedBy: from,
                                math: uniqueCount ? 'UniqueCount' : 'Count',
                                alias: countName,
                            },
                            {
                                alias: to,
                            },
                        ],
                    ],
                },
                {
                    type: 'group',
                    components: [[to]],
                },
                {
                    type: 'merge',
                    components: [
                        [
                            {
                                fromColumn: to,
                                joinType: 'inner',
                                toColumn: to,
                            },
                        ],
                        scope.widgetCtrl.getFrame('name'),
                    ],
                    terminal: true,
                },
                {
                    type: 'refresh',
                    components: [
                        scope.widgetCtrl.widgetId,
                        {
                            0: {
                                select: selectComponent,
                                taskOptions: taskOptionsComponent,
                            },
                        },
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name setData
         * @desc set the data for add count
         * @returns {void}
         */
        function setData() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                );

            scope.parcoordsAddCount.overlapSelectedDropDown = {
                list: [],
                selected: '',
            };
            scope.parcoordsAddCount.overlapRelatedDropDown = {
                list: [],
                selected: '',
            };

            keys.forEach(function (key) {
                if (
                    scope.parcoordsAddCount.overlapSelectedDropDown.list.indexOf(
                        key.alias
                    ) === -1
                ) {
                    scope.parcoordsAddCount.overlapSelectedDropDown.list.push(
                        key.alias
                    );
                }
                if (
                    scope.parcoordsAddCount.overlapRelatedDropDown.list.indexOf(
                        key.alias
                    ) === -1
                ) {
                    scope.parcoordsAddCount.overlapRelatedDropDown.list.push(
                        key.alias
                    );
                }
            });
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                setData
            );

            setData();

            scope.$on('$destroy', function () {
                updateTaskListener();
            });
        }

        initialize();
    }
}
