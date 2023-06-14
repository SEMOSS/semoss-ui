'use strict';

import angular from 'angular';

import './view-layer.scss';

export default angular
    .module('app.view.view-layer', [])
    .directive('viewLayer', viewLayerDirective);

viewLayerDirective.$inject = [];

function viewLayerDirective() {
    viewLayerCtrl.$inject = [];
    viewLayerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^view'],
        controllerAs: 'viewLayer',
        bindToController: {},
        template: require('./view-layer.directive.html'),
        controller: viewLayerCtrl,
        link: viewLayerLink,
    };

    function viewLayerCtrl() {}

    function viewLayerLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.viewCtrl = ctrl[1];

        scope.viewLayer.images = {
            Default: '',
            Line: require('images/line.svg'),
            Column: require('images/bar.svg'),
            Area: require('images/area.svg'),
            Grid: require('images/grid.svg'),
            Map: require('images/map.svg'),
            Pie: require('images/pie.svg'),
        };

        scope.viewLayer.layer = {
            options: [],
            selected: -1,
        };

        scope.viewLayer.overlay = {
            open: false,
            layer: {},
        };

        scope.viewLayer.drag = {
            idx: -1,
            active: false,
        };

        scope.viewLayer.changeLayer = changeLayer;
        scope.viewLayer.addLayer = addLayer;
        scope.viewLayer.deleteLayer = deleteLayer;
        scope.viewLayer.openEdit = openEdit;
        scope.viewLayer.closeEdit = closeEdit;
        scope.viewLayer.editLayer = editLayer;
        scope.viewLayer.startDrag = startDrag;
        scope.viewLayer.stopDrag = stopDrag;
        scope.viewLayer.endDrag = endDrag;

        /**
         * @name resetLayer
         * @desc reset the layer
         */
        function resetLayer(): void {
            // clear it
            const old =
                scope.viewLayer.layer.options[scope.viewLayer.layer.selected];

            scope.viewLayer.layer.options = [];
            const tasks =
                scope.widgetCtrl.getWidget('view.visualization.tasks') || [];
            for (
                let taskIdx = 0, taskLen = tasks.length;
                taskIdx < taskLen;
                taskIdx++
            ) {
                // default model
                const base = {
                    addXAxis: taskIdx === 0,
                    addYAxis: taskIdx === 0,
                    z: 2,
                    new: false,
                    id: '0',
                    base: true,
                    name: 'Layer 0',
                    taskId: tasks[taskIdx].taskId,
                    taskIdx: taskIdx,
                    layout: tasks[taskIdx].layout || '',
                };

                // if defined, we will set the defined model values
                const layer = tasks[taskIdx].layer;
                if (layer) {
                    base.new = false;
                    base.id = layer.id;
                    base.addXAxis = layer.addXAxis || false;
                    base.addYAxis = layer.addYAxis || false;
                    base.z = layer.z || 2;
                    base.base = layer.base || false;
                    base.name = layer.name || 'Layer ' + layer.id;
                }

                scope.viewLayer.layer.options.push(base);
            }

            //order layers by z-index
            scope.viewLayer.layer.options.sort((a: any, b: any) => {
                if (a.z === b.z) {
                    if (+a.id < +b.id) {
                        return 1;
                    } else if (+b.id < +a.id) {
                        return -1;
                    }
                }

                if (a.z < b.z) {
                    return 1;
                }

                if (b.z < a.z) {
                    return -1;
                }

                return 0;
            });

            // check if it is there
            //clear it out
            const selectedIdx = -1;
            if (old) {
                for (
                    let layerIdx = 0,
                        layerLen = scope.viewLayer.layer.options.length;
                    layerIdx < layerLen;
                    layerIdx++
                ) {
                    if (old.id === scope.viewLayer.layer.options[layerIdx].id) {
                        scope.viewLayer.layer.selected = layerIdx;
                        break;
                    }
                }
            }

            if (selectedIdx > -1) {
                changeLayer(selectedIdx);
            } else {
                changeLayer(0);
            }
        }

        /**
         * @name resetAll
         * @desc resets the selected layer and deletes all the others. called when the frame is changed
         */
        function resetAll(): void {
            // Delete other layers
            for (let i = 0; i < scope.viewLayer.layer.options.length; i++) {
                const layer = scope.viewLayer.layer.options[i];
                if (parseInt(layer.id) !== scope.viewLayer.layer.selected) {
                    deleteLayer(layer);
                }
            }
            // Reset the selected
            resetLayer();
        }

        /**
         * @name getLayer
         * @desc get the layer information
         */
        function getLayer(): any {
            if (scope.viewLayer.layer.selected === -1) {
                return false;
            }

            return scope.viewLayer.layer.options[
                scope.viewLayer.layer.selected
            ];
        }

        /**
         * @name changeLayer
         * @param idx - selected layer idx
         * @desc set the new layout
         */
        function changeLayer(idx: number): void {
            scope.viewLayer.layer.selected = idx;

            scope.viewCtrl.updatedLayer();
        }

        /**
         * @name addLayer
         * @desc add a layer
         */
        function addLayer() {
            let counter = 0;
            for (
                let layerIdx = 0,
                    layerLen = scope.viewLayer.layer.options.length;
                layerIdx < layerLen;
                layerIdx++
            ) {
                if (counter < +scope.viewLayer.layer.options[layerIdx].id) {
                    counter = +scope.viewLayer.layer.options[layerIdx].id;
                }
            }

            // increment
            counter++;

            // convert to string
            const id = String(counter);

            const base = {
                addXAxis: false,
                addYAxis: false,
                z: 2,
                new: true,
                id: id,
                base: false,
                name: `Layer ${id}`,
                taskId: '',
                taskIdx: scope.viewLayer.layer.options.length,
                layout: '',
            };

            scope.viewLayer.layer.options.push(base);

            // select it
            changeLayer(scope.viewLayer.layer.options.length - 1);

            scope.viewCtrl.updatedActive(true, {});
        }

        /**
         * @name deleteLayer
         * @param layer - the layer to delete
         * @desc delete a layer
         */
        function deleteLayer(layer: any) {
            if (scope.viewLayer.layer.options.length <= 1) {
                scope.widgetCtrl.alert('warn', 'Cannot remove the last layer.');
                return;
            }

            // if it is new, remove it from the list
            if (layer.new) {
                let removedIdx = -1;
                for (
                    let layerIdx = scope.viewLayer.layer.options.length - 1;
                    layerIdx >= 0;
                    layerIdx--
                ) {
                    if (
                        scope.viewLayer.layer.options[layerIdx].id === layer.id
                    ) {
                        scope.viewLayer.layer.options.splice(layerIdx, 1);
                        removedIdx = layerIdx;
                        return;
                    }
                }

                // if the removed is the selected one, select a new one
                if (scope.viewLayer.layer.selected === removedIdx) {
                    changeLayer(0);
                }

                scope.widgetCtrl.alert('success', 'Successfully deleted layer');
                return;
            }

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'removeTask',
                        components: [layer.taskId],
                        meta: true,
                        terminal: true,
                    },
                    {
                        type: 'removeLayer',
                        components: [
                            scope.widgetCtrl.getWidget('panelId'),
                            layer.id || 'base',
                        ],
                        terminal: true,
                    },
                ],
                () => {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully deleted layer'
                    );
                }
            );
        }

        /**
         * @name openEdit
         * @param layer - the layer to edit
         * @desc open overlay to edit a layer
         */
        function openEdit(layer: any) {
            scope.viewLayer.overlay.open = true;
            scope.viewLayer.overlay.layer = JSON.parse(JSON.stringify(layer));
        }

        /**
         * @name closeEdit
         * @desc close the edit overlay
         */
        function closeEdit() {
            scope.viewLayer.overlay.open = false;
            scope.viewLayer.overlay.layer = {};
        }

        /**
         * @name editLayer
         * @param layer - edited layer
         * @desc save the edits
         */
        function editLayer(layer: any): void {
            // close edit
            closeEdit();

            // new layers dont need to run a pixel to update, so we will manually set the updates
            if (layer.new) {
                for (
                    let layerIdx = 0,
                        layerLen = scope.viewLayer.layer.options.length;
                    layerIdx < layerLen;
                    layerIdx++
                ) {
                    if (
                        scope.viewLayer.layer.options[layerIdx].id === layer.id
                    ) {
                        scope.viewLayer.layer.options[layerIdx] = layer;
                        break;
                    }
                }

                scope.widgetCtrl.alert('success', 'Successfully updated layer');
                return;
            }

            const layers: any[] = [];
            for (
                let layerIdx = 0,
                    layerLen = scope.viewLayer.layer.options.length;
                layerIdx < layerLen;
                layerIdx++
            ) {
                if (scope.viewLayer.layer.options[layerIdx].id === layer.id) {
                    layers[scope.viewLayer.layer.options[layerIdx].taskIdx] = {
                        layer: {
                            id: layer.id,
                            z: layer.z,
                            addXAxis: layer.addXAxis,
                            addYAxis: layer.addYAxis,
                            base: layer.base,
                            name: layer.name,
                        },
                    };

                    break;
                }
            }

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'refresh',
                        components: [scope.widgetCtrl.widgetId, layers],
                    },
                ],
                () => {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully updated layer'
                    );
                }
            );
        }

        /**
         * @name startDrag
         * @desc start drag function
         * @param idx - idx of the start drag
         */
        function startDrag(idx: number): void {
            scope.viewLayer.drag.idx = idx;
            scope.viewLayer.drag.active = true;
        }

        /**
         * @name stopDrag
         * @desc function to run when user drops the items
         * @param idx - idx of the new drag
         * @param item - dragged item
         */
        function stopDrag(idx: number, item: any): boolean {
            for (
                let layerIdx = 0,
                    layerLen = scope.viewLayer.layer.options.length;
                layerIdx < layerLen;
                layerIdx++
            ) {
                if (scope.viewLayer.layer.options[layerIdx].new) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Cannot reorder when empty layers exist.'
                    );
                    return true;
                }
            }

            // idx is new position dragged to
            if (
                scope.viewLayer.drag.idx < idx &&
                idx - scope.viewLayer.drag.idx < 2
            ) {
                // if moving from small index to big index
                return true;
            } else if (
                scope.viewLayer.drag.idx > idx &&
                scope.viewLayer.drag.idx - idx < 1
            ) {
                // if moving from big index to small index
                return true;
            } else if (scope.viewLayer.drag.idx === idx) {
                // if not moving at all
                return true;
            }

            if (scope.viewLayer.drag.active) {
                // rearrange the view array
                scope.viewLayer.layer.options.splice(
                    scope.viewLayer.drag.idx,
                    1
                );
                scope.viewLayer.layer.options.splice(idx, 0, item);

                const layers: any[] = [];

                let counter = 0;
                for (
                    let layerIdx = scope.viewLayer.layer.options.length - 1;
                    layerIdx > -1;
                    layerIdx--
                ) {
                    const layer = scope.viewLayer.layer.options[layerIdx];

                    // we are going to reset all of the z indexes in the layers
                    layers.push({
                        layer: {
                            id: layer.id,
                            z: counter + 2,
                            addXAxis: layer.addXAxis,
                            addYAxis: layer.addYAxis,
                            base: layer.base,
                            name: layer.name,
                        },
                    });

                    counter++;
                }

                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'refresh',
                            components: [scope.widgetCtrl.widgetId, layers],
                        },
                    ],
                    () => {
                        scope.widgetCtrl.alert(
                            'success',
                            'Successully updated layer rendering order.'
                        );
                    }
                );
            }

            return true;
        }

        /**
         * @name endDrag
         * @desc stops the dragging
         */
        function endDrag(): void {
            scope.viewLayer.drag.idx = -1;
            scope.viewLayer.drag.active = true;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let updateViewListener: () => void, updateTaskListener: () => void;

            // overwrite
            scope.viewCtrl.getLayer = getLayer;

            // register messages
            updateViewListener = scope.widgetCtrl.on('update-view', resetLayer);
            updateTaskListener = scope.widgetCtrl.on('update-task', resetLayer);

            scope.$watch(
                function () {
                    return ele[0].getBoundingClientRect().width;
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        scope.viewLayer.width = newValue;
                    }
                }
            );

            scope.$on('view--frame-updated', function () {
                resetAll();
            });

            scope.$on('$destroy', function () {
                updateViewListener();
                updateTaskListener();
            });

            // set initial width
            scope.viewLayer.width = ele[0].getBoundingClientRect().width;

            // update automatically rests
            resetLayer();
        }

        initialize();
    }
}
