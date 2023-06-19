import './smss-editor.scss';

export default angular
    .module('smss-style.editor', [])
    .directive('smssEditor', smssEditorDirective);

smssEditorDirective.$inject = ['$timeout'];

function smssEditorDirective($timeout) {
    smssEditorCtrl.$inject = [];
    smssEditorLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./smss-editor.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            disabled: '=?ngDisabled',
            change: '&?',
        },
        replace: true,
        controllerAs: 'smssEditor',
        controller: smssEditorCtrl,
        link: smssEditorLink,
    };

    function smssEditorCtrl() {}

    function smssEditorLink(scope, ele) {
        let contentEle, focusedRange;

        scope.smssEditor.execEditor = execEditor;
        scope.smssEditor.onEditorActionFocus = onEditorActionFocus;
        scope.smssEditor.onEditorActionClose = onEditorActionClose;

        scope.smssEditor.textColor = '#5c5c5c';

        /**
         * @name renderEditor
         * @desc called to render the editor
         * @returns {void}
         */
        function renderEditor() {
            if (contentEle.innerHTML !== scope.smssEditor.model) {
                contentEle.innerHTML = scope.smssEditor.model;
            }
        }

        /**
         * @name execEditor
         * @desc execute a command to update the content
         * @param {string} command - command to execute
         * @param {string} value - value to execute
         * @returns {void}
         */
        function execEditor(command, value) {
            document.execCommand(command, false, value || null);
        }

        /**
         * @name onEditorActionFocus
         * @desc keep track of the focused element
         * @returns {void}
         */
        function onEditorActionFocus() {
            let selection = document.getSelection();

            if (selection.type !== 'None') {
                focusedRange = selection.getRangeAt(0);
            } else {
                focusedRange = undefined;
            }
        }

        /**
         * @name onEditorActionClose
         * @desc  switch to the selected element and execute a command to update the content
         * @param {string} command - command to execute
         * @param {string} value - value to execute
         * @returns {void}
         */
        function onEditorActionClose(command, value) {
            let selection = document.getSelection();
            selection.removeAllRanges();
            if (focusedRange) {
                selection.addRange(focusedRange);
            } else {
                let range = document.createRange();
                range.selectNodeContents(contentEle);
                range.collapse(false);
            }

            execEditor(command, value);
        }

        /**
         * @name changeEditor
         * @desc when the value changes
         * @returns {void}
         */
        function changeEditor() {
            $timeout(function () {
                let value = contentEle.innerHTML;

                scope.smssEditor.model = value;

                if (scope.smssEditor.change) {
                    scope.smssEditor.change({
                        model: scope.smssEditor.model,
                        delta: {
                            type: 'replace',
                            value: scope.smssEditor.model,
                        },
                    });
                }
            });
        }

        /**
         * @name changeEditorState
         * @desc check to see if the command is selected
         * @returns {void}
         */
        function changeEditorState() {
            if (document.queryCommandState('bold')) {
                scope.smssEditor.state = 'bold';
            } else if (document.queryCommandState('italic')) {
                scope.smssEditor.state = 'italic';
            } else if (document.queryCommandState('underline')) {
                scope.smssEditor.state = 'underline';
            } else if (document.queryCommandState('strikethrough')) {
                scope.smssEditor.state = 'strikethrough';
            } else {
                scope.smssEditor.state = '';
            }

            $timeout();
        }

        /**
         * @name initialize
         * @desc Called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            contentEle = ele[0].querySelector('#smss-editor__content');

            contentEle.addEventListener('input', changeEditor);
            contentEle.addEventListener('keyup', changeEditorState);
            contentEle.addEventListener('mouseup', changeEditorState);
            contentEle.addEventListener('click', changeEditorState);

            //set the view and update after the digest is complete
            $timeout(function () {
                renderEditor();

                scope.$watch('smssEditor.model', function (newVal, oldVal) {
                    if (!angular.equals(newVal, oldVal)) {
                        renderEditor();
                    }
                });
            });
        }

        initialize();
    }
}
