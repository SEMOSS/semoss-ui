'use strict';
import angular from 'angular';
import './recipe-viewer.scss';

import { Grid } from 'ag-grid-community';
import '@/widgets/grid-standard/grid-standard.scss';

export default angular
    .module('app.recipe-viewer.directive', [])
    .directive('recipeViewer', recipeViewerDirective);

recipeViewerDirective.$inject = ['semossCoreService', '$window'];

function recipeViewerDirective(semossCoreService, $window) {
    recipeViewerCtrl.$inject = [];
    recipeViewerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./recipe-viewer.directive.html'),
        controller: recipeViewerCtrl,
        link: recipeViewerLink,
        require: ['^widget'],
        scope: {},
        bindToController: {},
        controllerAs: 'recipeViewer',
        replace: true,
    };

    function recipeViewerCtrl() {}

    function recipeViewerLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        let gridEle: HTMLElement | undefined = undefined,
            resizeVizListener;
        const COLUMNS = [
            {
                rawName: 'select',
                displayName: '',
            },
            {
                rawName: 'copy',
                displayName: '',
            },
            {
                rawName: 'id',
                displayName: 'ID',
            },
            {
                rawName: 'expression',
                displayName: 'Expression',
            },
        ];

        scope.recipeViewer.grid = undefined;
        scope.recipeViewer.colDefs = [];
        scope.recipeViewer.rowData = [];
        scope.recipeViewer.selectedSteps = {};
        scope.recipeViewer.showDeleteOverlay = false;

        scope.recipeViewer.openDelete = openDelete;
        scope.recipeViewer.closeDelete = closeDelete;
        scope.recipeViewer.deleteSteps = deleteSteps;
        scope.recipeViewer.disableDelete = disableDelete;
        scope.recipeViewer.refresh = refresh;

        /**
         * @name refresh
         * @desc called to refresh the UI
         */
        function refresh(): void {
            scope.recipeViewer.selectedSteps = {};
            getRecipe();
        }

        /**
         * @name paintGrid
         * @desc creates the grid using ag-grid
         */
        function paintGrid(): void {
            if (gridEle) {
                scope.recipeViewer.grid = new Grid(gridEle, {
                    rowData: [],
                    columnDefs: [],
                    enableCellTextSelection: true,
                    suppressScrollOnNewData: true,
                });
                scope.recipeViewer.grid.gridOptions.api.addEventListener(
                    'columnResized',
                    function () {
                        scope.recipeViewer.grid.gridOptions.api.resetRowHeights();
                    }
                );
            }
        }

        /**
         * @name createColDefs
         * @desc creates column definitions needed for the grid
         */
        function createColDefs(): void {
            const colDefs: any[] = [],
                style = { 'white-space': 'normal' };
            for (let i = 0; i < COLUMNS.length; i++) {
                const def: any = {
                    headerName: COLUMNS[i].displayName,
                    field: COLUMNS[i].rawName,
                    resizable: true,
                    autoHeight: true,
                };
                if (COLUMNS[i].rawName === 'select') {
                    def.cellRenderer = function (params) {
                        const parentEle = document.createElement('div');
                        const inputEle = document.createElement('input');
                        const spanEle = document.createElement('span');
                        parentEle.className = 'smss-checkbox';
                        inputEle.type = 'checkbox';
                        inputEle.className = 'smss-checkbox__input';
                        spanEle.className = 'smss-checkbox__mark';
                        if (
                            scope.recipeViewer.selectedSteps.hasOwnProperty(
                                params.data.id
                            )
                        ) {
                            inputEle.checked = true;
                            spanEle.className =
                                'smss-checkbox__mark smss-checkbox__mark--checked';
                        }
                        parentEle.addEventListener(
                            'click',
                            select.bind(params.data)
                        );

                        parentEle.appendChild(inputEle);
                        parentEle.appendChild(spanEle);
                        return parentEle;
                    };
                    def.cellStyle = Object.assign(
                        { 'text-align': 'center' },
                        style
                    );
                    def.maxWidth = 60;
                    def.suppressMovable = true;
                    def.resizable = false;
                } else if (COLUMNS[i].rawName === 'copy') {
                    def.cellRenderer = function (params) {
                        const btnEle = document.createElement('button'),
                            iconEle = document.createElement('i');
                        btnEle.className = 'smss-btn smss-btn--icon';
                        iconEle.className = 'fa fa-copy';
                        btnEle.appendChild(iconEle);
                        btnEle.addEventListener(
                            'click',
                            copy.bind(params.data)
                        );
                        return btnEle;
                    };
                    def.cellStyle = Object.assign(
                        { 'text-overflow': 'clip' },
                        style
                    );
                    def.maxWidth = 60;
                    def.suppressMovable = true;
                    def.resizable = false;
                } else {
                    def.cellStyle = function (params) {
                        if (params.data.error) {
                            return Object.assign(
                                { 'background-color': '#f97575' },
                                style
                            );
                        } else if (params.data.warning) {
                            return Object.assign(
                                { 'background-color': '#F9A825' },
                                style
                            );
                        } else {
                            return style;
                        }
                    };
                    def.tooltip = function (params) {
                        if (params.data.error) {
                            return `ERROR: ${params.data.errorMessages}`;
                        } else if (params.data.warning) {
                            return `WARNING: ${params.data.warningMessages}`;
                        } else {
                            return null;
                        }
                    };
                    def.tooltipShowDelay = 0; // show the hover immediately instead of waiting 2 seconds
                }
                colDefs.push(def);
            }
            scope.recipeViewer.colDefs = colDefs;
        }

        /**
         * @name setData
         * @desc sets the column definitions and row data for the gridd
         */
        function setData(): void {
            scope.recipeViewer.grid.gridOptions.api.setColumnDefs(
                scope.recipeViewer.colDefs
            );
            scope.recipeViewer.grid.gridOptions.api.setRowData(
                scope.recipeViewer.rowData
            );
            scope.recipeViewer.grid.gridOptions.api.sizeColumnsToFit();
        }

        /**
         * @name getRecipe
         * @desc calls the Pixel reactor to retrieve the recipe
         */
        function getRecipe(): void {
            const callback = function (response) {
                const type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.recipeViewer.rowData = output;
                setData();
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getCurrentRecipe',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name copy
         * @desc copy the row data to the clipboard
         */
        function copy(this: any): void {
            const text = JSON.stringify(this);
            if ($window.clipboardData) {
                $window.clipboardData.setData('Text', text);

                semossCoreService.emit('alert', {
                    color: 'success',
                    text: 'Successfully copied to clipboard',
                });
            } else {
                const exportElement = angular.element(
                    "<textarea style='position:fixed;left:-1000px;top:-1000px;'>" +
                        text +
                        '</textarea>'
                );
                ele.append(exportElement);
                (exportElement as any).select();

                if (document.execCommand('copy')) {
                    exportElement.remove();

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully copied to clipboard',
                    });
                } else {
                    exportElement.remove();
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Unsuccessfully copied to clipboard',
                    });
                }
            }
        }

        /**
         * @name select
         * @desc function called when selecting/deselecting the row
         * @param data - selected row of data
         */
        function select(this: any, event: any): void {
            if (event.currentTarget) {
                const inputEle = event.currentTarget.children[0];
                const markEle = event.currentTarget.children[1];
                if (inputEle.checked) {
                    inputEle.checked = false;
                    markEle.className = 'smss-checkbox__mark';
                    delete scope.recipeViewer.selectedSteps[this.id];
                } else {
                    inputEle.checked = true;
                    markEle.className =
                        'smss-checkbox__mark smss-checkbox__mark--checked';
                    scope.recipeViewer.selectedSteps[this.id] = this;
                }
                scope.$apply();
            }
        }

        /**
         * @name openDelete
         * @desc opens the delete overlay
         */
        function openDelete(): void {
            scope.recipeViewer.showDeleteOverlay = true;
        }

        /**
         * @name closeDelete
         * @desc closes the delete overlay
         */
        function closeDelete(): void {
            scope.recipeViewer.showDeleteOverlay = false;
        }

        /**
         * @name deleteSteps
         * @desc deletes the selected steps from the recipe
         */
        function deleteSteps(): void {
            closeDelete();
            const callback = function (response) {
                const type = response.pixelReturn[0].operationType;
                scope.recipeViewer.selectedSteps = {};
                if (type.indexOf('ERROR') > -1) {
                    scope.widgetCtrl.alert(
                        'error',
                        'Deletion was unsuccessful.'
                    );
                    return;
                }
                scope.widgetCtrl.alert('success', 'Deletion was successful.');
            };

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'setInsightConfig',
                        components: [
                            semossCoreService.workspace.saveWorkspace(
                                scope.widgetCtrl.insightID
                            ),
                        ],
                        terminal: true,
                        meta: true,
                    },
                    {
                        meta: true,
                        type: 'deleteInsightRecipeStep',
                        components: [
                            Object.keys(scope.recipeViewer.selectedSteps),
                            false,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name disableDelete
         * @desc disables delete if no steps are selected
         */
        function disableDelete(): boolean {
            if (Object.keys(scope.recipeViewer.selectedSteps).length === 0) {
                return true;
            }
            return false;
        }

        /**
         * @name resizeViz
         * @desc called when the viz is resized to auto fit the columns
         */
        function resizeViz(): void {
            if (scope.recipeViewer.grid) {
                scope.recipeViewer.grid.gridOptions.api.sizeColumnsToFit();
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            gridEle = ele[0].querySelector('#recipe-viewer__grid');
            paintGrid();
            createColDefs();
            getRecipe();
            resizeVizListener = scope.widgetCtrl.on('resize-widget', resizeViz);

            scope.$on('$destroy', function () {
                console.log('destroying recipe-viewer...');
                resizeVizListener();
            });
        }

        initialize();
    }
}
