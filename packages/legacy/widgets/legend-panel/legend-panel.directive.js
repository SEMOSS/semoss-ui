'use strict';

import './legend-panel.scss';

export default angular
    .module('app.legendPanel.directive', [])
    .directive('legendPanel', legendPanelDirective);

legendPanelDirective.$inject = ['semossCoreService'];

function legendPanelDirective(semossCoreService) {
    legendPanelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    legendPanelCtrl.$inject = [];

    return {
        restrict: 'E',
        scope: {},
        controller: legendPanelCtrl,
        controllerAs: 'legend',
        template: require('./legend-panel.directive.html'),
        require: ['^widget'],
        link: legendPanelLink,
    };

    function legendPanelCtrl() {}

    function legendPanelLink(scope, ele, attrs, ctrl) {
        var panelOrnamentListener,
            clickTimer,
            ICONS = {
                CIRCLE: 'circle',
                SQUARE: 'square',
                STAR: 'star',
            };
        scope.widgetCtrl = ctrl[0];
        scope.legend.config = {};
        scope.legend.eventCallbacks = scope.widgetCtrl.getEventCallbacks();
        scope.legend.labels = {
            search: '',
            display: [],
            all: [],
        };
        scope.legend.numCustom = 0;
        scope.legend.alignment = 'vertical';
        scope.legend.fontSize = 14;
        scope.legend.showLegend = false;

        scope.legend.addLabel = addLabel;
        scope.legend.updateSearch = updateSearch;
        scope.legend.removeLabel = removeLabel;
        scope.legend.toggleIcon = toggleIcon;
        scope.legend.toggleBorder = toggleBorder;
        scope.legend.setLegend = setLegend;
        scope.legend.updateAll = updateAll;
        scope.legend.event = event;
        scope.legend.hideLegend = hideLegend;
        scope.legend.updateOrder = updateOrder;

        /**
         * @name updateOrder
         * @param {number} idx - original position of item moved
         * @param {object} label - label that was moved
         * @desc code to make sure dragging order is correct as dnd-list is a little quirky
         *       also sets labels.all to labels.display as dnd is disabled when there is a search (order wont mean anything)
         * @return {void}
         */
        function updateOrder(idx, label) {
            var i, temp, len;
            scope.legend.labels.display.splice(idx, 1);
            len = scope.legend.labels.display.length;
            // scenario where user grabs last item and moves it up one
            if (
                idx === len &&
                scope.legend.labels.display[len - 1].id === label.id
            ) {
                temp = scope.legend.labels.display[len - 2];
                scope.legend.labels.display[len - 2] = label;
                scope.legend.labels.display[len - 1] = temp;
            } else {
                for (i = 1; i < len - 1; i++) {
                    if (label.id === scope.legend.labels.display[i].id) {
                        // need to swap backward because dnd drop shadow is one position off
                        temp = scope.legend.labels.display[i - 1];
                        scope.legend.labels.display[i - 1] = label;
                        scope.legend.labels.display[i] = temp;

                        break;
                    }
                }
            }

            scope.legend.labels.all = semossCoreService.utility.freeze(
                scope.legend.labels.display
            );
        }

        /**
         * @name event
         * @param {string} alias - label alias
         * @desc runs single click event
         * @return {void}
         */
        function event(alias) {
            var aliasForEvent = alias.replace(/ /g, '_'),
                returnObj = {
                    data: [aliasForEvent],
                };
            if (clickTimer) {
                clearTimeout(clickTimer);
                eventCallback(returnObj, 'onDoubleClick');
            } else {
                clickTimer = setTimeout(
                    eventCallback.bind(null, returnObj, 'onClick'),
                    250
                );
            }
        }

        /**
         * @name eventCallback
         * @param {object} returnObj - event data
         * @param {string} type - event type
         * @desc runs event and clears clicktimer
         * @return {void}
         */
        function eventCallback(returnObj, type) {
            scope.legend.eventCallbacks.defaultMode[type](returnObj);
            clickTimer = null;
        }

        /**
         * @name updateAll
         * @param {object} label - legend label
         * @param {string} prop - which property to update on legend label
         * @desc since labels.display is the array for the ui, need to update the backing data on change
         * @return {void}
         */
        function updateAll(label, prop) {
            var i,
                len = scope.legend.labels.all.length,
                allLabel;

            for (i = 0; i < len; i++) {
                allLabel = scope.legend.labels.all[i];
                if (label.id === allLabel.id) {
                    allLabel[prop] = label[prop];
                }
            }
        }

        /**
         * @name toggleIcon
         * @param {object} label - label being changed
         * @desc goes to next icon in label
         * @return {void}
         */
        function toggleIcon(label) {
            var icons = Object.keys(ICONS).map(function (icon) {
                    return ICONS[icon];
                }),
                allLabel,
                iconIdx = icons.indexOf(label.icon),
                i,
                len = scope.legend.labels.all.length;
            // update display
            label.icon = icons[(iconIdx + 1) % icons.length];
            // update all
            for (i = 0; i < len; i++) {
                allLabel = scope.legend.labels.all[i];
                if (allLabel.id === label.id) {
                    allLabel.icon = label.icon;
                }
            }
        }

        /**
         * @name toggleBorder
         * @desc display a border around the icon
         * @param {object} label - label being changed
         * @returns {void}
         */
        function toggleBorder(label) {
            label.border = !label.border;
            for (let i = 0; i < scope.legend.labels.all.length; i++) {
                if (scope.legend.labels.all[i].id === label.id) {
                    scope.legend.labels.all[i].border =
                        !scope.legend.labels.all[i].border;
                }
            }
        }

        /**
         * @name addLabel
         * @desc creates a custom label
         * @return {void}
         */
        function addLabel() {
            var newLabel = ['Label ' + ++scope.legend.numCustom];
            scope.legend.labels.display = scope.legend.labels.display.concat(
                newLabel.map(makeLegendLabel)
            );
            scope.legend.labels.all = scope.legend.labels.all.concat(
                newLabel.map(makeLegendLabel)
            );
        }

        /**
         * @name removeLabel
         * @param {object} label - label being removed
         * @desc hides label so it is not in legend
         * @return {void}
         */
        function removeLabel(label) {
            var checkId = function (l) {
                return l.id !== label.id;
            };
            scope.legend.labels.all = scope.legend.labels.all.filter(checkId);
            scope.legend.labels.display =
                scope.legend.labels.display.filter(checkId);
        }

        /**
         * @name setLegend
         * @desc updates ornaments when data/task changes, so if user reopens custom legend widget data is correct
         * @return {void}
         */
        function setLegend() {
            var panelId = scope.widgetCtrl.panelId,
                commandList = [],
                legendConfig = {
                    tools: {
                        shared: {
                            customLegend: {
                                numCustom: scope.legend.numCustom,
                                alignment: scope.legend.alignment,
                                labels: scope.legend.labels,
                                fontSize: scope.legend.fontSize,
                            },
                        },
                    },
                };
            commandList = commandList.concat([
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [legendConfig],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools.shared'],
                    terminal: true,
                },
            ]);

            scope.widgetCtrl.execute(commandList);
        }

        /**
         * @name updateSearch
         * @desc updates the labels.display arrray based on user search param
         * @return {void}
         */
        function updateSearch() {
            scope.legend.labels.display = scope.legend.labels.all.filter(
                function (label) {
                    var labelAlias = String(label.alias)
                        .toLowerCase()
                        .replace(/_/g, ' ');

                    return labelAlias.match(
                        scope.legend.labels.search
                            .toLowerCase()
                            .replace(/_/g, ' ')
                    );
                }
            );
        }

        /**
         * @name makeLegendLabel
         * @param {string} item - values
         * @desc creates a legend label
         * @return {array} - array of the label objects
         */
        function makeLegendLabel(item) {
            var label,
                colors = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.color'
                );

            label = {
                icon: ICONS.SQUARE,
                alias: item,
                id: item,
                color: colors[(scope.legend.numCustom - 1) % colors.length],
                border: false,
            };

            return label;
        }

        /**
         * @name openLegend
         * @desc runs when panel ornaments update and updates the legend values, shows the compiled legend
         *       and adds event listener for double click
         * @return {void}
         */
        function openLegend() {
            var legend = scope.widgetCtrl.getWidget(
                    'view.legend-panel.tools.shared.customLegend'
                ),
                i;
            scope.legend.showLegend = true;

            for (i in legend) {
                if (legend.hasOwnProperty(i)) {
                    scope.legend[i] = legend[i];
                }
            }
        }

        /**
         * @name hideLegend
         * @desc goes back to legend builder screen and removes event listeners
         * @return {void}
         */
        function hideLegend() {
            scope.legend.showLegend = false;
        }

        function initialize() {
            var legend = scope.widgetCtrl.getWidget(
                'view.legend-panel.tools.shared.customLegend'
            );

            panelOrnamentListener = scope.widgetCtrl.on(
                'update-ornaments',
                openLegend
            );

            if (legend) {
                openLegend();
            } else {
                addLabel();
            }

            scope.legend.labels.display = semossCoreService.utility.freeze(
                scope.legend.labels.all
            );
            scope.$on('$destroy', function () {
                panelOrnamentListener();
                hideLegend();
            });
        }

        initialize();
    }
}
