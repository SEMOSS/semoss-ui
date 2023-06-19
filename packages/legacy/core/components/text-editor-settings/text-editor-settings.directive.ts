'use strict';

import angular from 'angular';
import { FONT_FAMILY } from '../../constants';

import { extractUnit } from '../../utility/style';

import { nodes, marks } from './schema';
import {
    baseKeymap,
    toggleMark,
    setBlockType,
    setMark,
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    splitBlockKeepMarks,
    chainCommands,
    chainTransactions,
} from './commands';

import 'prosemirror-view/style/prosemirror.css';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import './text-editor-settings.scss';

interface attributes {
    level?: string;
    title?: string;
    href?: string;
}

interface setting {
    type: string;
    attributes: attributes;
    hasInputs?: boolean;
}

export default angular
    .module('app.text-editor-settings.directive', [])
    .directive('textEditorSettings', textEditorSettingsDirective);

textEditorSettingsDirective.$inject = ['$timeout', 'semossCoreService'];

function textEditorSettingsDirective($timeout, semossCoreService) {
    textEditorSettingsCtrl.$inject = [];
    textEditorSettingsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '^insight'],
        controllerAs: 'textEditorSettings',
        bindToController: {},
        template: require('./text-editor-settings.directive.html'),
        controller: textEditorSettingsCtrl,
        link: textEditorSettingsLink,
    };

    function textEditorSettingsCtrl() {}

    function textEditorSettingsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.insightCtrl = ctrl[1];

        scope.textEditorSettings.types = {
            list: [
                {
                    display: 'Title',
                    value: 'title',
                    icon: require('images/text-editor-h1.svg'),
                },
                {
                    display: 'Subtitle',
                    value: 'subtitle',
                    icon: require('images/text-editor-h2.svg'),
                },
                {
                    display: 'Body',
                    value: 'body',
                    icon: require('images/text-editor-body.svg'),
                },
            ],
            selected: 'title',
        };

        scope.textEditorSettings.settings = {
            bold: false,
            italic: false,
            underline: false,
            font: {
                size: 20,
                family: 'Inter',
                list: FONT_FAMILY,
            },
            align: {
                left: true,
                center: false,
                right: false,
                justify: false,
            },
            link: {
                active: false,
                href: '',
            },
            height: 1,
            spacing: 0,
            color: '#000000',
        };

        scope.textEditorSettings.modal = {
            show: false,
            type: '',
        };

        scope.textEditorSettings.updateSettings = updateSettings;
        scope.textEditorSettings.setType = setType;

        let editorEle: HTMLElement | null = null,
            view: EditorView | null = null,
            syncTimeout: ReturnType<typeof setTimeout>;

        /** Editor */
        /**
         * @name updateEditor
         * @desc update the active ele
         */
        function updateEditor(): void {
            // reset the settinsg
            resetSettings();

            // menu has to be open
            const menu = scope.insightCtrl.getWorkspace('menu');
            if (!menu.open) {
                destroyProse();
                return;
            }

            // check the terminal
            const terminal = scope.insightCtrl.getWorkspace('terminal');
            if (terminal.open && terminal.view === 'side') {
                destroyProse();
                return;
            }

            // check if it is presentation mode
            const presentation = scope.insightCtrl.getWorkspace('presentation');
            if (presentation) {
                destroyProse();
                return;
            }

            const sheetId = scope.insightCtrl.getWorkbook('worksheet');
            if (!sheetId) {
                destroyProse();
                return;
            }

            const panelId = scope.insightCtrl.getWorksheet(
                sheetId,
                'selected.panel'
            );
            if (!panelId) {
                destroyProse();
                return;
            }

            const mode = scope.insightCtrl.getWorksheet(
                sheetId,
                'selected.mode'
            );
            if (mode !== 'edit') {
                destroyProse();
                return;
            }

            $timeout(
                () => {
                    const panelEle = document.body.querySelector(
                        `#panel--${panelId}`
                    );
                    // select the active element
                    if (panelEle) {
                        editorEle = panelEle.querySelector(
                            '#editor'
                        ) as HTMLElement;
                    } else {
                        editorEle = null;
                    }

                    // set it
                    initializeProse();
                },
                0,
                false
            );
        }

        /** Settings */
        /**
         * @name resetSettings
         * @desc reset the editor
         */
        function resetSettings(): void {
            const tools =
                scope.widgetCtrl.getWidget(
                    'view.text-editor.tools.shared.text'
                ) || {};

            const options =
                scope.widgetCtrl.getWidget('view.text-editor.options') || {};
            const type = options.type || '';

            // set the type
            scope.textEditorSettings.types.selected = type;

            // get the tools based on the type
            const activeTools = tools[type] || {};

            // extract the font-size (for now we assume px)
            const extracted = extractUnit(activeTools.fontSize || '20px');
            const fontSize = extracted[0];

            scope.textEditorSettings.settings = {
                bold: false,
                italic: false,
                underline: false,
                font: {
                    size: fontSize,
                    family: activeTools.hasOwnProperty('fontFamily')
                        ? activeTools.fontFamily
                        : 'Inter',
                    list: FONT_FAMILY,
                },
                align: {
                    left: true,
                    center: false,
                    right: false,
                    justify: false,
                },
                link: {
                    active: false,
                    href: '',
                },
                height: 1,
                spacing: 0,
                color: activeTools.hasOwnProperty('fontColor')
                    ? activeTools.fontColor
                    : '#000000',
            };
        }

        /**
         * @name syncSettings
         * @desc sync the options based on the state of the editor
         */
        function syncSettings() {
            let currentMarks: any = [];

            // reset it
            resetSettings();

            // current selection
            const selection = view.state.selection;

            // get the nodes
            const currentNodes = getProseNodes(
                selection.from,
                selection.to,
                view.state
            );

            // if nothing highlighted
            if (selection.empty) {
                currentMarks = selection.$from.marks();
            } else {
                // TODO use isInSet()? to check the marks inside of the selection
                // instead of just checking the '$to' marks
                currentMarks = selection.$to.marks();
            }

            // check to marks and set the state
            for (
                let markIdx = 0, markLen = currentMarks.length;
                markIdx < markLen;
                markIdx++
            ) {
                switch (currentMarks[markIdx].type.name) {
                    case 'strong':
                        scope.textEditorSettings.settings.bold = true;
                        break;
                    case 'em':
                        scope.textEditorSettings.settings.italic = true;
                        break;
                    case 'color':
                        scope.textEditorSettings.settings.color =
                            currentMarks[markIdx].attrs.color;
                        break;
                    case 'font-size':
                        const size = parseFloat(
                            currentMarks[markIdx].attrs['font-size']
                        );
                        scope.textEditorSettings.settings.font.size = size;
                        break;
                    case 'font-family':
                        const family =
                            currentMarks[markIdx].attrs['font-family'];
                        scope.textEditorSettings.settings.font.family = family;
                        break;
                    case 'link':
                        const href = currentMarks[markIdx].attrs.href;
                        scope.textEditorSettings.settings.link.active = true;
                        scope.textEditorSettings.settings.link.href = href;
                        break;
                    case 'text-decoration':
                        const isUnderlined =
                            currentMarks[markIdx].attrs['text-decoration'] ===
                            'underline';
                        scope.textEditorSettings.settings.underline =
                            isUnderlined;
                        break;
                    default:
                        console.log(
                            'unregistered mark: ' +
                                currentMarks[markIdx].type.name
                        );
                        break;
                }
            }

            // check the nodes and set the node attribute states
            for (
                let nodeIdx = 0, nodeLen = currentNodes.length;
                nodeIdx < nodeLen;
                nodeIdx++
            ) {
                for (const attr in currentNodes[nodeIdx].node.attrs) {
                    const currentValue = currentNodes[nodeIdx].node.attrs[attr];
                    if (currentValue !== null) {
                        if (attr === 'text-align') {
                            scope.textEditorSettings.settings.align.left =
                                currentValue === 'left';
                            scope.textEditorSettings.settings.align.center =
                                currentValue === 'center';
                            scope.textEditorSettings.settings.align.right =
                                currentValue === 'right';
                            scope.textEditorSettings.settings.align.justify =
                                currentValue === 'justify';
                        } else if (attr === 'line-height') {
                            scope.textEditorSettings.settings.height =
                                currentValue;
                        } else if (attr === 'letter-spacing') {
                            scope.textEditorSettings.settings.spacing =
                                parseFloat(currentValue);
                        }
                    }
                }
            }
        }

        /**
         * @name updateSettings
         * @param type the type of change to set
         * @param value the selected value
         * @desc set the change
         */
        function updateSettings(type: string, value: any): void {
            const attributes: { [key: string]: any } = {};

            if (type === 'link') {
                if (!value && !scope.textEditorSettings.modal.show) {
                    // no value so turn on the modal and return
                    scope.textEditorSettings.modal.show = true;
                    return;
                }

                if (!value) {
                    attributes['toggle'] = true;
                }

                attributes['href'] = value;
            } else {
                if (typeof value !== 'undefined') {
                    attributes[type] = value;
                }
            }

            // dispatch the change
            const state = view.state,
                dispatch = view.dispatch,
                schema = state.schema;

            const action: any = [];

            switch (type) {
                case 'italic':
                    action.push(toggleMark(schema.marks.em));
                    break;
                case 'bold':
                    action.push(toggleMark(schema.marks.strong));
                    break;
                case 'link':
                    if (attributes && attributes.toggle) {
                        action.push(toggleMark(schema.marks.link, attributes));
                    } else {
                        action.push(setMark(schema.marks.link, attributes));
                    }
                    break;
                case 'color':
                    action.push(setMark(schema.marks.color, attributes));
                    break;
                case 'font-size':
                    action.push(setMark(schema.marks['font-size'], attributes));
                    break;
                case 'font-family':
                    action.push(
                        setMark(schema.marks['font-family'], attributes)
                    );
                    break;
                case 'text-decoration':
                    action.push(
                        toggleMark(schema.marks['text-decoration'], attributes)
                    );
                    break;
                case 'letter-spacing':
                case 'text-align':
                case 'line-height':
                    const tempList: any = [],
                        combinedAttrs: any = [];

                    const tasks = getProseNodes(
                        state.selection.from,
                        state.selection.to,
                        state
                    );

                    // loop through all & queue up tasks that need to be processed
                    for (
                        let taskIdx = 0, taskLen = tasks.length;
                        taskIdx < taskLen;
                        taskIdx++
                    ) {
                        for (const attrs in tasks[taskIdx].node.attrs) {
                            if (tasks[taskIdx].node.attrs[attrs]) {
                                combinedAttrs[attrs] =
                                    tasks[taskIdx].node.attrs[attrs];
                            }
                        }
                        Object.assign(combinedAttrs, attributes);
                        tempList.push(
                            setBlockType(tasks[taskIdx].nodeType, combinedAttrs)
                        );
                    }
                    action.push(chainTransactions(tempList));
                    break;
                default:
                    console.log('Unregistered action: ' + type);
                    break;
            }

            // dispatch all of the queued tasks
            for (let actionIdx = 0; actionIdx < action.length; actionIdx++) {
                // dispatch(action[actionIdx]);
                action[actionIdx](state, dispatch);
            }

            // hide the modal and reset
            scope.textEditorSettings.modal.show = false;
        }

        /**
         * @name setType
         * @desc set the type
         */
        function setType(type: string): void {
            // clear the timeout
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }

            // save the type
            scope.textEditorSettings.types.selected = type;

            // sync it
            syncEditor();
        }

        /** Prose */
        /**
         * @name destroyProse
         * @desc destroy the prose element
         */
        function destroyProse(): void {
            if (view) {
                // clear the timeout
                if (syncTimeout) {
                    clearTimeout(syncTimeout);
                }

                // sync it
                syncEditor();

                // destroy it
                view.destroy();
                view = null;

                // deactivate it
                scope.textEditorSettings.active = false;
            }
        }

        /**
         * @name initializeProse
         * @desc initialize the prose element
         */
        function initializeProse(): void {
            // destroy it
            destroyProse();
            console.log(
                `%c TODO: CHECK THIS `,
                `color:white; background-color:black; border: 2px solid red; padding: 8px;`
            );

            // options
            const options =
                scope.widgetCtrl.getWidget('view.text-editor.options') || {};

            // create the schema
            const schema = new Schema({
                nodes: nodes,
                marks: marks,
            });

            // get the html
            const html = options.html || '';

            // create a fake element to store the content
            const contentEle = document.createElement('div');
            contentEle.innerHTML = html || '';

            // create a new document
            const doc = DOMParser.fromSchema(schema).parse(contentEle, {
                preserveWhitespace: 'full', // Pass true to preserve whitespace, but normalize newlines to spaces, and "full" to preserve whitespace entirely.
            });

            // get the plugins
            const plugins = getPlugins();

            // create the new state
            const state = EditorState.create({
                doc: doc,
                plugins: plugins,
            });

            // create the actual view
            view = new EditorView(editorEle, {
                state: state,
                dispatchTransaction: (transaction) => {
                    // apply the transaction
                    const updated = view.state.apply(transaction);
                    view.updateState(updated);

                    // sync the settings
                    syncSettings();

                    // sync the editor
                    syncEditorDelayed();
                },
            });

            // focus on it
            view.focus();

            // sync the settings
            syncSettings();

            // activate it
            scope.textEditorSettings.active = true;
        }

        /**
         * @name syncEditor
         * @desc sync the editor
         */
        function syncEditor() {
            // get the old html
            const options =
                scope.widgetCtrl.getWidget('view.text-editor.options') || {};

            const currentHTML = options.html || '';
            const currentType = options.type || '';

            let updated = options.html;
            if (view) {
                // get the new html
                const state = view.state,
                    schema = state.schema,
                    doc = state.doc;

                const contentEle = document.createElement('div');
                const contentFragment = DOMSerializer.fromSchema(
                    schema
                ).serializeFragment(doc.content);

                contentEle.appendChild(contentFragment);

                // get the content
                updated = contentEle.innerHTML;

                // replace empty with break
                updated = updated.replace(/<p><\/p>/g, '<br>');
            }

            if (
                currentHTML !== updated ||
                currentType !== scope.textEditorSettings.types.selected
            ) {
                // this is a hack, since execute kicks off teh workflow
                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                        },
                        {
                            type: 'setPanelView',
                            components: [
                                'text-editor',
                                {
                                    html: updated,
                                    type: scope.textEditorSettings.types
                                        .selected,
                                },
                            ],
                            terminal: true,
                        },
                    ],
                    function (response: PixelReturnPayload) {
                        const output = response.pixelReturn[0].output,
                            type = response.pixelReturn[0].operationType[0];

                        if (type.indexOf('ERROR') > -1) {
                            return;
                        }

                        // set the options manually
                        const options = JSON.parse(output.options) || {};

                        semossCoreService.set(
                            'widgets.' +
                                scope.widgetCtrl.widgetId +
                                '.view.text-editor.options',
                            {
                                html: options.html || '',
                                type: options.type || '',
                            }
                        );

                        scope.widgetCtrl.emit('update-text-editor');
                    }
                );
            }
        }

        /**
         * @name syncEditorDelayed
         * @desc sync the editor after a delay
         */
        function syncEditorDelayed() {
            // clear it
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }

            syncTimeout = setTimeout(() => {
                syncEditor();
            }, 300);
        }

        /**
         * @name getProseNodes
         * @param from from position
         * @param to to position
         * @param state state of editor
         * @desc grab all nodes between the from and to positions
         */
        function getProseNodes(from: number, to: number, state) {
            const tempNodes: any = [],
                doc = state.tr.doc,
                allowedTypes = [
                    'heading',
                    'heading_title',
                    'heading_sub',
                    'paragraph',
                ];
            doc.nodesBetween(from, to, (node, pos, parentNode) => {
                const nodeType = node.type;
                if (allowedTypes.indexOf(nodeType.name) > -1) {
                    tempNodes.push({
                        node,
                        pos,
                        nodeType,
                    });
                }
                return true;
            });

            return tempNodes;
        }

        /** Plugins */
        /**
         * @name getPlugins
         * @desc returns prosemirror plugins enabled for this editor
         * @returns {array} an array of plugins to be enabled
         */
        function getPlugins(): object[] {
            const plugins: any = [];

            const onEnter = (
                state: EditorState,
                dispatch,
                view: EditorView
            ): boolean => {
                chainCommands(
                    newlineInCode,
                    createParagraphNear,
                    liftEmptyBlock,
                    splitBlockKeepMarks
                )(view.state, view.dispatch, view);

                return true;
            };

            baseKeymap.Enter = onEnter;
            // allow basic mac & pc keyboard commands (Enter, Backspace, Delete, Select All)
            plugins.push(keymap(baseKeymap));
            // allow for history to be saved in the editor so user can undo/redo
            plugins.push(history());
            // allow for undo/redo via ctrl+z & ctrl+y
            plugins.push(keymap({ 'Mod-z': undo, 'Mod-y': redo }));
            // add listener to changes in the selection state
            plugins.push(createSelectionPlugin());
            // create plugin to highlight selection. Highlight will persist when out of focus
            plugins.push(createHighlightPlugin());

            return plugins;
        }

        /**
         * @name createHighlightPlugin
         * @desc colors the background of the selection so that the selection persists when editor is out of focus
         */
        function createHighlightPlugin() {
            return new Plugin({
                props: {
                    decorations(state) {
                        const selection = state.selection;
                        const decorations: any = [];

                        if (selection.empty) {
                            return false;
                        }

                        state.doc.nodesBetween(
                            selection.from,
                            selection.to,
                            (node, position) => {
                                decorations.push(
                                    Decoration.inline(
                                        selection.from,
                                        selection.to,
                                        {
                                            class: 'text-editor-settings__selection',
                                        }
                                    )
                                );
                            }
                        );

                        return DecorationSet.create(state.doc, decorations);
                    },
                },
            });
        }

        /**
         * @name createSelectionPlugin
         * @desc create custom selection plugin for this editor
         */
        function createSelectionPlugin() {
            return new Plugin({
                view() {
                    return {
                        update: function (view, prevState) {
                            const state = view.state;

                            if (
                                prevState &&
                                prevState.doc.eq(state.doc) &&
                                prevState.selection.eq(state.selection)
                            ) {
                                return;
                            }
                        },
                    };
                },
            });
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            const selectedPanelListener = scope.insightCtrl.on(
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
                );

            scope.$on('$destroy', function () {
                // close it
                destroyProse();

                selectedPanelListener();
                updatedPresentationListener();
                changedWorkspaceMenuListener();
            });

            // update the editor
            updateEditor();
        }

        initialize();
    }
}
