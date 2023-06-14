'use strict';

export default angular
    .module('app.context-menu.directive', [])
    .directive('contextMenu', contextMenu);

import './context-menu.scss';

contextMenu.$inject = ['semossCoreService', '$timeout'];

function contextMenu(semossCoreService, $timeout) {
    contextMenuLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        require: [],
        scope: {
            show: '=',
            x: '=?',
            y: '=?',
            widgetId: '=?',
            visualizationType: '=?',
            eventType: '=?',
            header: '=?',
            value: '=?',
        },
        template: require('./context-menu.directive.html'),
        link: contextMenuLink,
    };

    function contextMenuLink(scope, ele) {
        var contextMenuEle, contentEle;

        // Variables
        scope.actionList = {
            individualElement: [],
            general: [],
            whiteSpace: [],
        };

        // Functions
        scope.triggerAction = triggerAction;

        /**
         * @name toggleContextMenu
         * @description toggles the loading screen on or off
         * @returns {void}
         */
        function toggleContextMenu() {
            if (scope.show) {
                getActionList();

                var contextMenuWidth = 225,
                    contextMenuHeight =
                        (scope.actionList.individualElement.length +
                            scope.actionList.general.length +
                            1) *
                            24 +
                            12 || 200;

                scope.contextMenuStyle = {
                    visibility: 'visible',
                    opacity: 1,
                };

                // Make sure context menu is contained within window
                if (scope.x + contextMenuWidth > window.innerWidth) {
                    scope.contextMenuStyle.left = scope.x - contextMenuWidth;
                } else {
                    scope.contextMenuStyle.left = scope.x;
                }

                if (scope.y + contextMenuHeight > window.innerHeight) {
                    scope.contextMenuStyle.top = scope.y - contextMenuHeight;
                } else {
                    scope.contextMenuStyle.top = scope.y;
                }
            } else {
                hideContextMenu();
            }
        }

        /**
         * @name hideContextMenu
         * @description hides the existing context menu
         * @returns {void}
         */
        function hideContextMenu() {
            if (contextMenuEle) {
                contextMenuEle.style.visibility = 'hidden';
                contextMenuEle.style.opacity = 0;
            }

            if (contentEle) {
                if (contentEle.parentNode !== null) {
                    contentEle.parentNode.removeChild(contentEle);
                }
            }

            document.removeEventListener('mousedown', onDocumentClick, true);

            // Remove brush if it exists
            if (scope.eventType === 'brush') {
                semossCoreService.emit('remove-brush', {
                    widgetId: scope.widgetId,
                });
            }
        }

        /**
         * @name destroyContextMenu
         * @description same as hide context menu without removing brush which would trigger the viz to repaint, used only for $destroy
         * @returns {void}
         */
        function destroyContextMenu() {
            if (contextMenuEle) {
                contextMenuEle.style.visibility = 'hidden';
                contextMenuEle.style.opacity = 0;
            }

            if (contentEle) {
                if (contentEle.parentNode !== null) {
                    contentEle.parentNode.removeChild(contentEle);
                }
            }

            document.removeEventListener('mousedown', onDocumentClick, true);
        }

        /**
         * @name getActionList
         * @description get a list of available actions
         * @returns {void}
         */
        function getActionList() {
            scope.actionList = {
                individualElement: [],
                general: [],
                whiteSpace: [],
            };
            if (scope.header.length > 0 && scope.value.length > 0) {
                addFilterActions();
                addStyleActions();
            } else {
                addWhiteSpaceActions();
            }
        }

        /**
         * @name addFilterActions
         * @description add include and exclude actions to action list
         * @returns {void}
         */
        function addFilterActions() {
            // TODO save and grab filter information in store... once this is in, only show 'Unfilter Data' if filter exists
            scope.actionList.individualElement.push(
                {
                    name: 'Include',
                    pixel: getFilterPixel('showOnly'),
                },
                {
                    name: 'Exclude',
                    pixel: getFilterPixel('exclude'),
                }
            );

            scope.actionList.general.push({
                name: 'Unfilter Data',
                pixel: getFilterPixel('unfilter'),
            });
        }

        /**
         * @name getFilterPixel
         * @description get the filter query dependent on viz type
         * @param {string} filterType type of filter
         * @returns {string} filter query
         */
        function getFilterPixel(filterType) {
            var insightId = semossCoreService.getWidget(
                    scope.widgetId,
                    'insightID'
                ),
                frame = semossCoreService.getWidget(scope.widgetId, 'frame'),
                frameName = semossCoreService.getShared(
                    insightId,
                    'frames.' + frame + '.name'
                ),
                filterPixel = '';

            switch (filterType) {
                case 'showOnly':
                    if (
                        scope.visualizationType === 'HeatMap' ||
                        scope.visualizationType === 'Cluster'
                    ) {
                        filterPixel = frameName + ' | ';
                        filterPixel +=
                            'SetFrameFilter((' +
                            scope.header[0] +
                            ' == ' +
                            JSON.stringify(scope.value[0]) +
                            ')';
                        if (scope.header[1] && scope.value[1]) {
                            filterPixel += ' AND ';
                            filterPixel +=
                                '(' +
                                scope.header[1] +
                                ' == ' +
                                JSON.stringify(scope.value[1]) +
                                '));';
                        } else {
                            filterPixel += ');';
                        }
                        return filterPixel;
                    }
                    return (
                        frameName +
                        ' | SetFrameFilter(' +
                        scope.header +
                        '==' +
                        JSON.stringify(scope.value[0]) +
                        ');'
                    );
                case 'exclude':
                    if (
                        scope.visualizationType === 'HeatMap' ||
                        scope.visualizationType === 'Cluster'
                    ) {
                        filterPixel = frameName + ' | ';
                        filterPixel +=
                            'AddFrameFilter((' +
                            scope.header[0] +
                            ' != ' +
                            JSON.stringify(scope.value[0]) +
                            ')';
                        if (scope.header[1] && scope.value[1]) {
                            filterPixel += ' OR ';
                            filterPixel +=
                                '(' +
                                scope.header[1] +
                                ' != ' +
                                JSON.stringify(scope.value[1]) +
                                '));';
                        } else {
                            filterPixel += ');';
                        }
                        return filterPixel;
                    }
                    return (
                        frameName +
                        ' | AddFrameFilter(' +
                        scope.header +
                        '!=' +
                        JSON.stringify(scope.value[0]) +
                        ');'
                    );
                case 'unfilter':
                    return frameName + ' | UnfilterFrame();';
                default:
                    return '';
            }
        }

        /**
         * @name addStyleActions
         * @description add highlight actions to action list
         * @returns {void}
         */
        function addStyleActions() {
            addHighlightActions();
            addLabelActions();
            // TODO add action for color (cbv)
        }

        /**
         * @name addHighlightActions
         * @description add highlight actions to action list
         * @returns {void}
         */
        function addHighlightActions() {
            if (highlightDisabled()) {
                return;
            }

            var activeHighlight = semossCoreService.getWidget(
                    scope.widgetId,
                    'view.visualization.tools.shared.highlight'
                ),
                highlightExists =
                    (activeHighlight &&
                        activeHighlight.hasOwnProperty('data') &&
                        activeHighlight.data.hasOwnProperty(scope.header[0])) ||
                    false,
                tempHighlightedValues = [];

            if (highlightExists) {
                tempHighlightedValues = activeHighlight.data[scope.header[0]];
            }

            if (highlightExists && allValuesAreStyled(tempHighlightedValues)) {
                // Remove highlight from selected values
                tempHighlightedValues = tempHighlightedValues.filter(
                    (value) => {
                        let remove = true;

                        if (
                            scope.value &&
                            scope.value[0] &&
                            Array.isArray(scope.value[0])
                        ) {
                            if (scope.value[0].indexOf(value) > -1) {
                                remove = false;
                            }
                        }

                        return remove;
                    }
                );
                scope.actionList.individualElement.push({
                    name: 'Remove Highlight',
                    pixel: getHighlightPixel('remove', tempHighlightedValues),
                });
            } else {
                // Add highlight to selected values
                tempHighlightedValues = tempHighlightedValues.concat(
                    scope.value[0]
                );
                scope.actionList.individualElement.push({
                    name: 'Add Highlight',
                    pixel: getHighlightPixel('add', tempHighlightedValues),
                });
            }
            // Reset highlight if exists
            if (
                highlightExists &&
                activeHighlight.data[scope.header[0]].length > 0
            ) {
                scope.actionList.general.push({
                    name: 'Reset Highlight',
                    pixel: getHighlightPixel('reset', tempHighlightedValues),
                });
            }
        }

        /**
         * @name allValuesAreStyled
         * @description add highlight/label actions to action list
         * @param {Array} tempValues current values that are highlighted/labeled
         * @returns {bool} whether or not all selected values are highlighted/labeled
         */
        function allValuesAreStyled(tempValues) {
            var i;

            for (i = 0; i < scope.value[0].length; i++) {
                if (tempValues.indexOf(scope.value[0][i]) < 0) {
                    return false;
                }
            }

            return true;
        }

        /**
         * @name getHighlightPixel
         * @description get the highlight query dependent on viz type
         * @param {string} highlightType type of highlight
         * @param {Array} tempHighlightedValues values to highlight
         * @returns {string} highlight query
         */
        function getHighlightPixel(highlightType, tempHighlightedValues) {
            var panelId = semossCoreService.getWidget(
                    scope.widgetId,
                    'panelId'
                ),
                highlightPixel = '';

            switch (highlightType) {
                case 'add':
                case 'remove':
                    highlightPixel += 'Panel(' + panelId + ') | ';
                    highlightPixel +=
                        'AddPanelOrnaments({"tools":{"shared":{"highlight":{"data":{"' +
                        scope.header[0] +
                        '":' +
                        JSON.stringify(tempHighlightedValues) +
                        '}}}}});';
                    highlightPixel += 'Panel(' + panelId + ') | ';
                    highlightPixel += 'RetrievePanelOrnaments();';
                    return highlightPixel;
                case 'reset':
                    highlightPixel += 'Panel(' + panelId + ') | ';
                    highlightPixel +=
                        'AddPanelOrnaments({"tools":{"shared":{"highlight":{"data":{"' +
                        scope.header[0] +
                        '":[]}}}}});';
                    highlightPixel += 'Panel(' + panelId + ') | ';
                    highlightPixel += 'RetrievePanelOrnaments();';
                    return highlightPixel;
                default:
                    return highlightPixel;
            }
        }

        /**
         * @name highlightDisabled
         * @description based on viz type, disable/enable highlight
         * @returns {bool} whether or not highlight will be shown in context menu
         */
        function highlightDisabled() {
            var disabledVisualizations = [
                'HeatMap',
                'Dendrogram',
                'Cluster',
                'Sunburst',
                'Pack',
            ];

            if (disabledVisualizations.indexOf(scope.visualizationType) > -1) {
                return true;
            }

            return false;
        }

        /**
         * @name addLabelActions
         * @description add label actions to action list
         * @returns {void}
         */
        function addLabelActions() {
            if (labelEnabled()) {
                var activeLabels = semossCoreService.getWidget(
                        scope.widgetId,
                        'view.visualization.tools.shared.label'
                    ),
                    labelsExist =
                        (activeLabels &&
                            activeLabels.hasOwnProperty(scope.header[0])) ||
                        false,
                    labeledValues = [];

                if (labelsExist) {
                    labeledValues = activeLabels[scope.header[0]];
                }

                if (labelsExist && allValuesAreStyled(labeledValues)) {
                    // Remove label from selected values
                    labeledValues = labeledValues.filter((value) => {
                        let remove = true;

                        if (
                            scope.value &&
                            scope.value[0] &&
                            Array.isArray(scope.value[0])
                        ) {
                            if (
                                scope.value &&
                                scope.value[0] &&
                                Array.isArray(scope.value[0])
                            ) {
                                if (scope.value[0].indexOf(value) > -1) {
                                    remove = false;
                                }
                            }
                        }

                        return remove;
                    });

                    scope.actionList.individualElement.push({
                        name: 'Remove Label',
                        pixel: getLabelPixel(labeledValues),
                    });
                } else {
                    // Add label to selected values
                    labeledValues = labeledValues.concat(scope.value[0]);
                    scope.actionList.individualElement.push({
                        name: 'Add Label',
                        pixel: getLabelPixel(labeledValues),
                    });
                }
            }
        }

        /**
         * @name getLabelPixel
         * @description get the label query
         * @param {Array} labeledValues values to label
         * @returns {string} highlight query
         */
        function getLabelPixel(labeledValues) {
            var panelId = semossCoreService.getWidget(
                    scope.widgetId,
                    'panelId'
                ),
                labelPixel = '';

            labelPixel += 'Panel(' + panelId + ') | ';
            labelPixel +=
                'AddPanelOrnaments({"tools":{"shared":{"label":{"' +
                scope.header[0] +
                '":' +
                JSON.stringify(labeledValues) +
                '}}}});';
            labelPixel += 'Panel(' + panelId + ') | ';
            labelPixel += 'RetrievePanelOrnaments();';

            return labelPixel;
        }

        /**
         * @name labelEnabled
         * @description based on viz type, disable/enable label
         * @returns {bool} whether or not highlight will be shown in context menu
         */
        function labelEnabled() {
            var enabledVisualizations = [
                'Column',
                'Line',
                'Area',
                'Scatter',
                'Graph',
                'MultiLine',
            ];

            if (enabledVisualizations.indexOf(scope.visualizationType) > -1) {
                return true;
            }

            return false;
        }

        /**
         * @name addWhiteSpaceActions
         * @description add include and exclude actions to action list
         * @returns {void}
         */
        function addWhiteSpaceActions() {
            // TODO save and grab filter information in store... once this is in, only show 'Unfilter Data' if filter exists
            scope.actionList.whiteSpace.push({
                name: 'Unfilter Data',
                pixel: getFilterPixel('unfilter'),
            });

            scope.actionList.whiteSpace.push({
                name: 'Save as Image',
                function: 'export-jpeg',
            });
        }

        /**
         * @name saveJpeg
         * @description save jpeg image
         * @returns {void}
         */
        function saveJpeg() {
            var allWidgetEles, widgetEleIdx, widgetEleLen, chartEle;

            allWidgetEles = [].slice.call(
                document.querySelectorAll(
                    '[widget-id="' + scope.widgetId + '"]'
                )
            );
            for (
                widgetEleIdx = 0, widgetEleLen = allWidgetEles.length;
                widgetEleIdx < widgetEleLen;
                widgetEleIdx++
            ) {
                if (allWidgetEles[widgetEleIdx].querySelector('widget-view')) {
                    chartEle = allWidgetEles[widgetEleIdx]
                        .querySelector('widget-view')
                        .querySelector('#chart-container');
                    if (chartEle) {
                        break;
                    }
                }
            }

            if (chartEle) {
                import(
                    /* webpackChunkName: "domtoimage"  */ '@/widget-resources/js/dom-to-image/dom-to-image.min.js'
                )
                    .then((module) => {
                        module
                            .toJpeg(chartEle, {
                                quality: 0.95,
                            })
                            .then(function (dataUrl) {
                                $timeout(function () {
                                    var link = document.createElement('a');
                                    link.download = 'semoss-img.jpeg';
                                    link.href = dataUrl;
                                    link.click();
                                }, 10);
                            });
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            }
        }

        /**
         * @name triggerAction
         * @description based on the selected action, trigger the respective pixel query
         * @param {string} action - selected action
         * @returns {void}
         */
        function triggerAction(action) {
            if (action.hasOwnProperty('pixel')) {
                // Execute Pixel
                var pixelComponents = [
                    {
                        type: 'Pixel',
                        components: [action.pixel],
                        terminal: true,
                    },
                ];

                semossCoreService.emit('execute-pixel', {
                    insightID: semossCoreService.getWidget(
                        scope.widgetId,
                        'insightID'
                    ),
                    commandList: pixelComponents,
                });
            } else if (action.hasOwnProperty('function')) {
                // Run Function
                switch (action.function) {
                    case 'export-jpeg':
                        saveJpeg();
                        break;
                    default:
                        break;
                }
            } else if (action.hasOwnProperty('message')) {
                // Emit Message
                semossCoreService.emit(action.message);
            }

            hideContextMenu();
        }

        /**
         * @name onDocumentClick
         * @description hide the content if the document is clicked (not on the target or content)
         * @param {event} event dom event
         * @returns {void}
         */
        function onDocumentClick(event) {
            if (
                event &&
                event.target &&
                contextMenuEle.contains(event.target)
            ) {
                return;
            }

            hideContextMenu();
        }

        /**
         * @name initialize
         * @description called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            contentEle = ele[0];
            contextMenuEle = contentEle.querySelector('#context-menu');
            $timeout(function () {
                // Add Listeners
                document.addEventListener('mousedown', onDocumentClick, true);
            });

            scope.$watch('show', toggleContextMenu);
            scope.$on('$destroy', destroyContextMenu);
        }

        initialize();
    }
}
