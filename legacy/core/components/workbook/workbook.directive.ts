'use strict';
import angular from 'angular';

import './workbook.scss';
import { PANEL_TYPES } from '../../constants.js';

export default angular
    .module('app.workbook.directive', [])
    .directive('workbook', workbookDirective);

workbookDirective.$inject = [];

function workbookDirective() {
    workbookCtrl.$inject = [];
    workbookLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^insight'],
        template: require('./workbook.directive.html'),
        scope: {},
        controller: workbookCtrl,
        controllerAs: 'workbook',
        bindToController: {},
        link: workbookLink,
        replace: true,
    };

    function workbookCtrl() {}

    function workbookLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        scope.workbook.sheets = [];
        scope.workbook.sheetId = undefined;
        scope.workbook.settings = {
            open: false,
        };

        scope.workbook.newSheet = newSheet;
        scope.workbook.selectSheet = selectSheet;
        scope.workbook.deleteSheet = deleteSheet;
        scope.workbook.getSheetContent = getSheetContent;
        scope.workbook.updateOrder = updateOrder;
        scope.workbook.closeSettings = closeSettings;
        scope.workbook.editSheetLabel = editSheetLabel;
        scope.workbook.updateSheetLabel = updateSheetLabel;
        scope.workbook.deselectPanel = deselectPanel;

        /** Actions */
        /**
         * @name newSheet
         * @desc called when a sheet is added
         */
        function newSheet(): void {
            let counter = scope.insightCtrl.getWorkbook('worksheetCounter');

            // add one
            counter++;

            // emit
            scope.insightCtrl.execute([
                {
                    type: 'Pixel',
                    components: [`AddSheet("${counter}")`],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name selectSheet
         * @param sheetId - sheetId to select
         * @desc called when a sheet is selected
         */
        function selectSheet(sheetId: string): void {
            scope.insightCtrl.emit('select-worksheet', {
                sheetId: sheetId,
            });
        }

        /**
         * @name deleteSheet
         * @param sheetId - sheetId to delete
         * @desc called when a sheet is deleted
         */
        function deleteSheet(sheetId: string): void {
            const components: PixelCommand[] = [],
                panels = scope.insightCtrl.getWorksheet(sheetId, 'panels');

            for (const panelId in panels) {
                if (panels.hasOwnProperty(panelId)) {
                    components.push({
                        type: 'closePanel',
                        components: [panelId],
                        terminal: true,
                    });
                }
            }

            components.push({
                type: 'Pixel',
                components: [`CloseSheet("${sheetId}")`],
                terminal: true,
            });

            scope.insightCtrl.execute(components);
        }

        /**
         * Sets contenteditable to true for a sheet's label
         * @param e MouseEvent
         * @param sheet Sheet to edit label on
         */
        function editSheetLabel(e, sheet): void {
            sheet.contentEditable = true;
            // force cursor inside the content
            const el = e.currentTarget;
            const range = document.createRange();
            const sel = window.getSelection();

            range.selectNodeContents(el);
            // range.setStart(el.childNodes[0], 0);
            // range.collapse(true);

            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        /**
         * Prevents tabbing, undos changes when pressing escape, and saves sheet label when user presses enter or blurs from editing. Prevents user from entering an empty string.
         * @param e KeyboardEvent or MouseEvent
         * @param sheet Sheet to update label for
         */
        function updateSheetLabel(e, sheet): void {
            // Prevent tabbing
            if (e.which === 9) {
                e.preventDefault();
            }

            // Undo changes on esc
            if (e.which === 27) {
                e.target.textContent = sheet.sheetLabel;
                e.target.blur();
            }

            if (e.which === 13) {
                // force a blur which will call this function again because we have an ng-blur event triggering this function
                e.target.blur();
                return;
            }

            // Send update to backend on enter or blur
            if (e.type === 'blur') {
                const sheetLabel = e.target.textContent.trim();

                if (sheetLabel.length === 0) {
                    scope.insightCtrl.alert(
                        'error',
                        'Cannot leave sheet name blank.'
                    );

                    // Don't remove focus
                    if (e.type === 'blur') {
                        e.target.focus();
                    }
                } else {
                    e.target.textContent = sheetLabel;

                    sheet.sheetLabel = sheetLabel;
                    sheet.contentEditable = false;

                    scope.insightCtrl.execute([
                        {
                            type: 'Pixel',
                            components: [
                                `Sheet("${sheet.sheetId}") | SetSheetLabel(sheetLabel = ["${sheetLabel}"])`,
                            ],
                            terminal: true,
                        },
                    ]);

                    e.target.blur();
                }

                e.preventDefault();
            }
        }

        /**
         * @name updateOrder
         * @param {number} idx - original position of item moved
         * @param {object} sheet - sheet that was moved
         * @desc code to make sure dragging order is correct as dnd-list is a little quirky
         * @return {void}
         */
        function updateOrder(idx) {
            let startIdx, endIdx;
            if (
                scope.workbook.sheets[idx].sheetId ===
                scope.workbook.dragSheetId
            ) {
                // we moved right
                scope.workbook.sheets.splice(idx, 1);
                startIdx = idx;
                endIdx = getOrderIndexHelper();
            } else {
                // we have moved left and the index is wrong (weird thing in dnd lib)
                scope.workbook.sheets.splice(idx + 1, 1);
                endIdx = idx;
                startIdx = getOrderIndexHelper();
            }

            for (let j = startIdx; j <= endIdx; j++) {
                scope.insightCtrl.setWorksheetOrder(
                    scope.workbook.sheets[j].sheetId,
                    j
                );
            }
        }

        /**
         * @name getOrderIndexHelper
         * @return {number} the index
         */
        function getOrderIndexHelper() {
            for (let i = 0; i < scope.workbook.sheets.length; i++) {
                if (
                    scope.workbook.sheets[i].sheetId ===
                    scope.workbook.dragSheetId
                ) {
                    return i;
                }
            }
        }

        /**
         * @name deselectPanel
         * @param panelId to select
         * @desc select the panel
         */
        function deselectPanel(): void {
            // we allow selecting only when it isn't in presentation mode
            if (scope.workbook.presentation) {
                return;
            }

            scope.insightCtrl.emit('select-panel', {
                sheetId: scope.workbook.sheetId,
                panelId: '',
                mode: 'move',
            });
        }

        /** Settings */
        /**
         * @name closeSettings
         * @desc close the save
         */
        function closeSettings(): void {
            scope.workbook.settings.open = false;
        }

        /** Getters */

        /**
         * @name getSheetContent
         * @desc get the sheet content to paint
         * @returns html to render
         */
        function getSheetContent(): string {
            if (typeof scope.workbook.sheetId === 'undefined') {
                return `
                    <div style="position: absolute; left: 50%; top: 50%; transform:translate(-50%, -50%);">
                        <p>No Sheets. Please Add One.</p>
                        <div style="display: flex; justify-content: center; margin-top: 1em;">
                            <smss-btn ng-click="workbook.newSheet()"><i class="fa fa-plus"></i> Add Sheet</smss-btn>
                        </div>
                    </div>
                `;
            }

            return `<worksheet sheet-id="${scope.workbook.sheetId}"></worksheet>`;
        }

        /** Updates */
        /**
         * @name updateWorkbook
         * @desc called when the sheet information changes
         */
        function updateWorkbook(payload: any): void {
            const book = scope.insightCtrl.getWorkbook();
            let reorder = false;

            scope.workbook.sheets = [];
            for (const sheetId in book.worksheets) {
                if (book.worksheets.hasOwnProperty(sheetId)) {
                    if (book.worksheets[sheetId].hasOwnProperty('order')) {
                        // set the correct order of the sheet
                        reorder = true;
                    }

                    scope.workbook.sheets.push(book.worksheets[sheetId]);
                }
            }

            if (reorder) {
                // sort it based on the order property
                scope.workbook.sheets.sort(function (a, b) {
                    if (a.order > b.order) {
                        return 1;
                    } else if (a.order < b.order) {
                        return -1;
                    }

                    return 0;
                });
            } else if (payload && payload.sheetId !== undefined) {
                initializeSheetOrder();
            }

            // set the selected sheet
            scope.workbook.sheetId = book.worksheet;
        }

        /**
         * @name updateWorkbookAdded
         * @desc called when the sheet information changes
         */
        function updateWorkbookAdded(payload: any): void {
            const book = scope.insightCtrl.getWorkbook();

            scope.workbook.sheets.push(book.worksheets[payload.sheetId]);
            initializeSheetOrder();
        }

        /**
         * @name initializeSheetOrder
         * @desc sets the sheet order based on their index
         * @returns {void}
         */
        function initializeSheetOrder(): void {
            for (
                let sheetIdx = 0;
                sheetIdx < scope.workbook.sheets.length;
                sheetIdx++
            ) {
                // order already exists (being set and loaded from insight config)
                if (scope.workbook.sheets[sheetIdx].hasOwnProperty('order')) {
                    break;
                }
                scope.workbook.sheets[sheetIdx].order = sheetIdx;
                scope.insightCtrl.setWorksheetOrder(
                    scope.workbook.sheets[sheetIdx].sheetId,
                    sheetIdx
                );
            }

            // ensure that the sheets get reordered correctly
            updateWorkbook();
        }

        /**
         * @name updatedPresentation
         * @desc called when the presentation information changes
         */
        function updatedPresentation(): void {
            scope.workbook.presentation =
                scope.insightCtrl.getWorkspace('presentation');
        }

        /**
         * @name keyupListener
         * @desc called on keyup event on the document
         * @param ev - the keyup event
         */
        function keyupListener(ev): void {
            // Opens nlp-search on "alt + q"
            if (ev.keyCode === 81 && ev.altKey) {
                const components: PixelCommand[] = [],
                    sheetId = scope.insightCtrl.getWorkbook('worksheet');
                components.push(
                    {
                        type: 'addPanel',
                        components: ['nlpsearch', sheetId],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: ['nlpsearch'],
                    },
                    {
                        type: 'addPanelConfig',
                        components: [
                            {
                                type: PANEL_TYPES.FLOATING,
                            },
                        ],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: ['nlpsearch'],
                    },
                    {
                        type: 'setPanelView',
                        components: ['nlp-search'],
                        terminal: true,
                    }
                );
                scope.insightCtrl.execute(components);
            }
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the workbook directive
         * @returns {void}
         */
        function initialize(): void {
            let selectedWorksheetListener: () => {},
                updatedWorksheetListener: () => {},
                addedWorksheetListener: () => {},
                closedWorksheetListener: () => {},
                updatedPresentationListener: () => {};

            // register listeners
            selectedWorksheetListener = scope.insightCtrl.on(
                'selected-worksheet',
                updateWorkbook
            );
            updatedWorksheetListener = scope.insightCtrl.on(
                'updated-worksheet',
                updateWorkbook
            );
            addedWorksheetListener = scope.insightCtrl.on(
                'added-worksheet',
                updateWorkbookAdded
            );
            closedWorksheetListener = scope.insightCtrl.on(
                'closed-worksheet',
                updateWorkbook
            );
            updatedPresentationListener = scope.insightCtrl.on(
                'updated-presentation',
                updatedPresentation
            );
            document.addEventListener('keyup', keyupListener);

            scope.$on('$destroy', function () {
                console.log('destroying workbook....');
                selectedWorksheetListener();
                updatedWorksheetListener();
                addedWorksheetListener();
                closedWorksheetListener();
                updatedPresentationListener();
                document.removeEventListener('keyup', keyupListener);
            });

            // initialize the workbook
            updateWorkbook();
            updatedPresentation();
        }

        initialize();
    }
}
