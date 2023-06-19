'use strict';
import angular from 'angular';

import './text-editor.scss';

export default angular
    .module('app.text-editor.directive', [])
    .directive('textEditor', textEditor);

textEditor.$inject = [];

function textEditor() {
    textEditorLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '^insight'],
        controllerAs: 'textEditor',
        bindToController: {},
        template: require('./text-editor.directive.html'),
        controller: textEditorCtlr,
        link: textEditorLink,
        replace: true,
    };

    function textEditorLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.insightCtrl = ctrl[1];

        // clear it out
        scope.textEditor.styles = {};

        /**
         * @name updateEditor
         * @desc update the editor's view
         */
        function updateEditor(): void {
            const options =
                scope.widgetCtrl.getWidget('view.text-editor.options') || {};
            const tools =
                scope.widgetCtrl.getWidget(
                    'view.text-editor.tools.shared.text'
                ) || {};

            // get the tools based on the type
            const type = options.type || '';

            const activeTools = tools[type] || {};

            // set the active styles
            scope.textEditor.styles = {
                color: activeTools.hasOwnProperty('fontColor')
                    ? activeTools.fontColor
                    : undefined,
                fontFamily: activeTools.hasOwnProperty('fontFamily')
                    ? activeTools.fontFamily
                    : undefined,
                fontSize: activeTools.hasOwnProperty('fontSize')
                    ? activeTools.fontSize
                    : undefined,
            };

            // set the content
            scope.textEditor.html = options.html || '';

            // is it editable
            updateEditable();
        }

        /**
         * @name updateEditable
         * @desc toggle contenteditable and styles
         * @returns {void}
         */
        function updateEditable(): void {
            let editable = true;

            // check if the sheet is selected
            if (editable) {
                const sheetId = scope.insightCtrl.getWorkbook('worksheet');
                const panelId = scope.insightCtrl.getWorksheet(
                    sheetId,
                    'selected.panel'
                );
                if (panelId !== scope.widgetCtrl.panelId) {
                    editable = false;
                }
            }

            // check is the menu open
            if (editable) {
                const menu = scope.insightCtrl.getWorkspace('menu');
                if (!menu.open) {
                    editable = false;
                }
            }

            // check if it is presentation mode
            if (editable) {
                const presentation =
                    scope.insightCtrl.getWorkspace('presentation');
                if (presentation) {
                    editable = false;
                }
            }

            if (editable) {
                const sheetId = scope.insightCtrl.getWorkbook('worksheet');
                const mode = scope.insightCtrl.getWorksheet(
                    sheetId,
                    'selected.mode'
                );
                if (mode !== 'edit') {
                    editable = false;
                }
            }

            if (editable) {
                const tab = scope.widgetCtrl.getWidgetTab('selected');
                if (tab !== 'view') {
                    editable = false;
                }
            }

            if (editable) {
                const terminal = scope.insightCtrl.getWorkspace('terminal');
                if (terminal.open && terminal.view === 'side') {
                    editable = false;
                }
            }

            // store it
            scope.textEditor.editable = editable;
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            const updateViewListener = scope.widgetCtrl.on(
                    'update-view',
                    updateEditor
                ),
                updateThemeListener = scope.insightCtrl.on(
                    'update-theme',
                    updateEditor
                ),
                selectedPanelListener = scope.insightCtrl.on(
                    'selected-panel',
                    updateEditor
                ),
                updatedPresentationListener = scope.insightCtrl.on(
                    'updated-presentation',
                    updateEditor
                ),
                changedWorkspaceMenuListener = scope.insightCtrl.on(
                    'changed-workspace-menu',
                    updateEditor
                ),
                updateTabListener = scope.widgetCtrl.on(
                    'update-widget-tab',
                    updateEditor
                ),
                updatedWorkspaceTerminalListener = scope.insightCtrl.on(
                    'updated-workspace-terminal',
                    updateEditor
                ),
                updateTextEditorListener = scope.widgetCtrl.on(
                    'update-text-editor',
                    updateEditor
                );

            // update the editor
            updateEditor();

            scope.$on('$destroy', function () {
                updateViewListener();
                updateThemeListener();
                selectedPanelListener();
                updatedPresentationListener();
                changedWorkspaceMenuListener();
                updateTabListener();
                updatedWorkspaceTerminalListener();
                updateTextEditorListener();
            });
        }

        initialize();
    }

    function textEditorCtlr() {}
}
