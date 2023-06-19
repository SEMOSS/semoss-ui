import './editor.scss';

export default angular
    .module('docs.editor', [])
    .directive('editorSection', editorDirective);

function editorDirective() {
    editorLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./editor.directive.html'),
        link: editorLink,
    };

    function editorLink(scope) {
        scope.editorValue = '<div>Hi</div>';

        scope.log = function () {
            console.log(scope.editorValue);
        };
    }
}
