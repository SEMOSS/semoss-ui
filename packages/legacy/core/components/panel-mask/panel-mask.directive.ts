import angular from 'angular';

import Movable from '../../utility/movable';
import Resizable from '../../utility/resizable';
import Guideline from '../../utility/guideline';

import { extractUnit, convertUnit } from '../../utility/style';

import { PANEL_TYPES } from '../../constants';

import './panel-mask.scss';

export default angular
    .module('app.panel-mask.directive', [])
    .directive('panelMask', panelMaskDirective);

panelMaskDirective.$inject = ['$timeout'];

function panelMaskDirective($timeout: ng.ITimeoutService) {
    panelMaskCtrl.$inject = [];
    panelMaskLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./panel-mask.directive.html'),
        scope: {},
        controller: panelMaskCtrl,
        controllerAs: 'panelMask',
        require: ['^insight', '^worksheet'],
        bindToController: {
            sheetId: '=',
        },
        replace: true,
        link: panelMaskLink,
    };

    function panelMaskCtrl() {}

    function panelMaskLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.worksheetCtrl = ctrl[1];

        const BASE_UNIT = 'px';

        scope.panelMask.openPanelFilter = openPanelFilter;
        scope.panelMask.selectPanel = selectPanel;
        scope.panelMask.clonePanel = clonePanel;
        scope.panelMask.closePanel = closePanel;
        scope.panelMask.changePanelStatus = changePanelStatus;

        scope.panelMask.maximized = false;

        let guideline: Guideline,
            movable: Movable,
            resizable: Resizable,
            activePanelId = '',
            maskEle: HTMLElement,
            activeEle: HTMLElement | null = null,
            containerEle: HTMLElement,
            resizeTimer: ng.IPromise<void>;

        /** Panel */
        /**
         * @name resetPanel
         * @desc reset the panel
         */
        function resetPanel(): void {
            guideline = new Guideline({
                active: maskEle,
                container: containerEle as HTMLElement,
                line: {
                    class: 'panel-mask__line',
                },
            });

            // set the initial objects
            movable = new Movable(maskEle, {
                container: containerEle,
                handle: maskEle.querySelector(
                    '#panel-mask__inner'
                ) as HTMLElement,
                unit: BASE_UNIT,
                snap: '1px',
                start: function () {
                    if (!activeEle) {
                        return;
                    }

                    // start rendering the guideline
                    guideline.startRender({
                        items: Array.from(
                            containerEle.querySelectorAll<HTMLElement>('.panel')
                        ).filter((e) => {
                            return e !== activeEle;
                        }),
                    });

                    // trigger digest
                    $timeout();
                },
                on: function () {
                    if (!activeEle) {
                        return;
                    }

                    // render the guideline
                    guideline.runRender();

                    // force mask to match
                    activeEle.style.top = maskEle.offsetTop + BASE_UNIT;
                    activeEle.style.left = maskEle.offsetLeft + BASE_UNIT;
                },
                stop: function () {
                    if (!activeEle) {
                        return;
                    }

                    // remove the guideline
                    guideline.stopRender();

                    // converting to the panel units
                    const converted = convertPanel({
                        top: maskEle.offsetTop,
                        left: maskEle.offsetLeft,
                    });

                    // set the size
                    if (typeof converted.top !== 'undefined') {
                        activeEle.style.top = converted.top;
                    }

                    if (typeof converted.left !== 'undefined') {
                        activeEle.style.left = converted.left;
                    }

                    // cache if possible
                    cachePanel(converted);

                    // trigger digest
                    $timeout();
                },
            });

            resizable = new Resizable(maskEle, {
                container: containerEle,
                handles: {
                    NE: maskEle.querySelector(
                        '#panel-mask__handle--NE'
                    ) as HTMLElement,
                    SE: maskEle.querySelector(
                        '#panel-mask__handle--SE'
                    ) as HTMLElement,
                    SW: maskEle.querySelector(
                        '#panel-mask__handle--SW'
                    ) as HTMLElement,
                    NW: maskEle.querySelector(
                        '#panel-mask__handle--NW'
                    ) as HTMLElement,
                },
                unit: BASE_UNIT,
                constrain: {
                    minimumHeight: '28px',
                    minimumWidth: '36px',
                },
                snap: '1px',
                start: function (options) {
                    if (!activeEle) {
                        return;
                    }

                    let lock: any[] = [];
                    if (options) {
                        const direction = options.direction;

                        if (direction === 'NE') {
                            lock = ['S', 'W'];
                        } else if (direction === 'SE') {
                            lock = ['W', 'N'];
                        } else if (direction === 'SW') {
                            lock = ['N', 'E'];
                        } else if (direction === 'NW') {
                            lock = ['E', 'S'];
                        }
                    }

                    // start rendering the guideline
                    guideline.startRender({
                        lock: lock,
                        items: Array.from(
                            containerEle.querySelectorAll<HTMLElement>('.panel')
                        ).filter((e) => {
                            return e !== activeEle;
                        }),
                    });
                },
                on: function () {
                    if (!activeEle) {
                        return;
                    }

                    // render the guideline
                    guideline.runRender();

                    // this is temp
                    activeEle.style.top = maskEle.offsetTop + BASE_UNIT;
                    activeEle.style.left = maskEle.offsetLeft + BASE_UNIT;
                    activeEle.style.height = maskEle.offsetHeight + BASE_UNIT;
                    activeEle.style.width = maskEle.offsetWidth + BASE_UNIT;

                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    resizeTimer = $timeout(function () {
                        $timeout.cancel(resizeTimer);
                    }, 500);
                },
                stop: function () {
                    if (!activeEle) {
                        return;
                    }

                    // remove the guideline
                    guideline.stopRender();

                    if (resizeTimer) {
                        $timeout.cancel(resizeTimer);
                    }

                    // converting to the panel units
                    const converted = convertPanel({
                        top: maskEle.offsetTop,
                        left: maskEle.offsetLeft,
                        height: maskEle.offsetHeight,
                        width: maskEle.offsetWidth,
                    });

                    // set the size
                    if (typeof converted.top !== 'undefined') {
                        activeEle.style.top = converted.top;
                    }

                    if (typeof converted.left !== 'undefined') {
                        activeEle.style.left = converted.left;
                    }

                    if (typeof converted.height !== 'undefined') {
                        activeEle.style.height = converted.height;
                    }

                    if (typeof converted.width !== 'undefined') {
                        activeEle.style.width = converted.width;
                    }

                    // cache if possible
                    cachePanel(converted);

                    // trigger digest
                    $timeout();
                },
            });

            // update the active mask
            updateActive();
        }

        /**
         * @name shiftPanel
         * @desc shift the panel up or down by a pixel
         * @param direction - direction to move
         */
        function shiftPanel(direction: 'Up' | 'Right' | 'Down' | 'Left'): void {
            if (!activeEle) {
                return;
            }

            const updated: { top?: number; left?: number } = {};

            if (direction === 'Up') {
                updated.top = maskEle.offsetTop - 1;
            } else if (direction === 'Right') {
                updated.top = maskEle.offsetLeft + 1;
            } else if (direction === 'Down') {
                updated.top = maskEle.offsetTop + 1;
            } else if (direction === 'Left') {
                updated.top = maskEle.offsetLeft - 1;
            }

            const converted = convertPanel(updated);

            // set the size
            if (typeof converted.top !== 'undefined') {
                activeEle.style.top = converted.top;
            }

            if (typeof converted.left !== 'undefined') {
                activeEle.style.left = converted.left;
            }

            // cache if possible
            cachePanel(converted);
        }

        /**
         * @name convertPanel
         * @desc convert the temp positions (BASE_UNIT) to the actual units
         * @param position - updated position information
         */
        function convertPanel(position: {
            top?: number;
            left?: number;
            height?: number;
            width?: number;
        }): { top?: string; left?: string; height?: string; width?: string } {
            const config = scope.insightCtrl.getPanel(
                scope.panelMask.sheetId,
                activePanelId,
                'config'
            );

            let extracted: [number, string], unit: string;

            const converted: {
                top?: string;
                left?: string;
                height?: string;
                width?: string;
            } = {};

            // first we have to convert the position to the appropriate unit (based on the ending of the unit in the)
            // check the top
            if (typeof position.top !== 'undefined') {
                extracted = extractUnit(config.top);
                unit = extracted[1] || 'px';
                converted.top =
                    convertUnit(
                        position.top,
                        BASE_UNIT,
                        unit,
                        'height',
                        containerEle
                    ) + unit;
            }
            // check the left
            if (typeof position.left !== 'undefined') {
                extracted = extractUnit(config.left);
                unit = extracted[1] || 'px';
                converted.left =
                    convertUnit(
                        position.left,
                        BASE_UNIT,
                        unit,
                        'width',
                        containerEle
                    ) + unit;
            }

            // check the height
            if (typeof position.height !== 'undefined') {
                extracted = extractUnit(config.height);
                unit = extracted[1] || 'px';
                converted.height =
                    convertUnit(
                        position.height,
                        BASE_UNIT,
                        unit,
                        'height',
                        containerEle
                    ) + unit;
            }

            // check the width
            if (typeof position.width !== 'undefined') {
                extracted = extractUnit(config.width);
                unit = extracted[1] || 'px';
                converted.width =
                    convertUnit(
                        position.width,
                        BASE_UNIT,
                        unit,
                        'width',
                        containerEle
                    ) + unit;
            }

            return converted;
        }

        /**
         * @name cachePanel
         * @desc cache the panel information
         * @param position - updated position information
         */
        function cachePanel(converted: {
            top?: string;
            left?: string;
            height?: string;
            width?: string;
        }): void {
            const config = scope.insightCtrl.getPanel(
                scope.panelMask.sheetId,
                activePanelId,
                'config'
            );

            const changes: {
                top?: string;
                left?: string;
                height?: string;
                width?: string;
            } = {};

            if (
                typeof converted.top !== 'undefined' &&
                config.top !== converted.top
            ) {
                changes.top = converted.top;
            }

            if (
                typeof converted.left !== 'undefined' &&
                config.left !== converted.left
            ) {
                changes.left = converted.left;
            }

            if (
                typeof converted.height !== 'undefined' &&
                config.height !== converted.height
            ) {
                changes.height = converted.height;
            }

            if (
                typeof converted.width !== 'undefined' &&
                config.width !== converted.width
            ) {
                changes.width = converted.width;
            }

            if (Object.keys(changes).length > 0) {
                scope.worksheetCtrl.onChange(activePanelId, changes);
            }
        }

        /**
         * @name openPanelFilter
         * @desc open the filter for the panel
         */
        function openPanelFilter(): void {
            if (!activePanelId) {
                return;
            }

            scope.worksheetCtrl.openPanelFilter(activePanelId);
        }

        /**
         * @name selectPanel
         * @desc select the panel and make it editable
         */
        function selectPanel(): void {
            if (!activePanelId) {
                return;
            }

            scope.worksheetCtrl.selectPanel(activePanelId, 'edit');
        }

        /**
         * @name clonePanel
         * @desc close the active panel
         * @param {event} - event that was called
         */
        function clonePanel(event: Event): void {
            if (!activePanelId) {
                return;
            }

            scope.worksheetCtrl.clonePanel(event, activePanelId, true);
        }

        /**
         * @name changePanelStatus
         * @desc change the active panel's status
         */
        function changePanelStatus(updated: string): void {
            if (!activePanelId) {
                return;
            }

            scope.worksheetCtrl.toggleMaximize(activePanelId, updated);
        }

        /**
         * @name closePanel
         * @desc close the active panel
         */
        function closePanel(): void {
            if (!activePanelId) {
                return;
            }

            scope.worksheetCtrl.closePanel(activePanelId);
        }

        /** Active */
        /**
         * @name updateActive
         * @desc update the active ele
         */
        function updateActive(): void {
            const panelId = scope.insightCtrl.getWorksheet(
                scope.panelMask.sheetId,
                'selected.panel'
            );

            if (!panelId) {
                clearActive();
                return;
            }
            // disable when editing
            scope.panelMask.mode = scope.insightCtrl.getWorksheet(
                scope.panelMask.sheetId,
                'selected.mode'
            );
            if (scope.panelMask.mode === 'edit') {
                movable.disable();
            } else {
                movable.enable();
            }

            // set the panel status
            scope.panelMask.maximized =
                scope.insightCtrl.getPanel(
                    scope.panelMask.sheetId,
                    panelId,
                    'config.panelstatus'
                ) === 'maximized';

            // get the panel's type
            const type = scope.insightCtrl.getPanel(
                scope.panelMask.sheetId,
                panelId,
                'config.type'
            );

            // it has to be floating for it to be good
            if (type === PANEL_TYPES.GOLDEN) {
                clearActive();
                return;
            }

            $timeout(
                () => {
                    // select the active element
                    activePanelId = panelId;
                    activeEle = containerEle.querySelector(
                        `#panel--${panelId}`
                    ) as HTMLElement;

                    // resize it
                    resizeActive();
                },
                0,
                false
            );
        }

        /**
         * @name clearActive
         * @desc clear the active ele
         */
        function clearActive(): void {
            activePanelId = '';
            activeEle = null;

            // resize it
            resizeActive();
        }

        /**
         * @name resizeActive
         * @desc resize the active ele to fit
         */
        function resizeActive(): void {
            if (!activeEle) {
                maskEle.style.display = '';
                maskEle.style.top = '';
                maskEle.style.left = '';
                maskEle.style.height = '';
                maskEle.style.width = '';
                return;
            }

            maskEle.style.display = 'block';
            maskEle.style.top =
                convertUnit(
                    activeEle.offsetTop,
                    'px',
                    BASE_UNIT,
                    'height',
                    containerEle
                ) + BASE_UNIT;
            maskEle.style.left =
                convertUnit(
                    activeEle.offsetLeft,
                    'px',
                    BASE_UNIT,
                    'width',
                    containerEle
                ) + BASE_UNIT;
            maskEle.style.height =
                convertUnit(
                    activeEle.offsetHeight,
                    'px',
                    BASE_UNIT,
                    'height',
                    containerEle
                ) + BASE_UNIT;
            maskEle.style.width =
                convertUnit(
                    activeEle.offsetWidth,
                    'px',
                    BASE_UNIT,
                    'width',
                    containerEle
                ) + BASE_UNIT;
        }

        /**
         * @name panelMaskKeydown
         * @desc makes the panel contents interactive on doubleclick
         * @param even - whether the panel is interactive or not
         */
        function panelMaskKeydown(event: KeyboardEvent): void {
            if (event.key === 'ArrowUp') {
                shiftPanel('Up');
            } else if (event.key === 'ArrowRight') {
                shiftPanel('Right');
            } else if (event.key === 'ArrowDown') {
                shiftPanel('Down');
            } else if (event.key === 'ArrowLeft') {
                shiftPanel('Left');
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize(): void {
            // get the eles
            maskEle = ele[0];
            containerEle = maskEle.parentElement as HTMLElement;

            // add the listeners
            const selectedPanelListener = scope.insightCtrl.on(
                    'selected-panel',
                    updateActive
                ),
                updatedPanelListener = scope.insightCtrl.on(
                    'updated-panel',
                    updateActive
                ),
                cachePanelListener = scope.insightCtrl.on(
                    'cache-panel',
                    updateActive
                ),
                resetPanelListener = scope.insightCtrl.on(
                    'reset-panel',
                    updateActive
                );

            scope.$watch(
                function () {
                    return (
                        containerEle.offsetHeight +
                        '-' +
                        containerEle.offsetWidth
                    );
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        resizeActive();
                    }
                }
            );

            scope.$on('$destroy', function () {
                if (guideline) {
                    guideline.destroy();
                }

                if (movable) {
                    movable.destroy();
                }

                if (resizable) {
                    resizable.destroy();
                }

                selectedPanelListener();
                updatedPanelListener();
                cachePanelListener();
                resetPanelListener();
            });

            // reset the mask
            resetPanel();
        }

        initialize();
    }
}
