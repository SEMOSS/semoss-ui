export default angular
    .module('docs.textarea', [])
    .directive('textareaSection', textareaDirective);
function textareaDirective() {
    textareaLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./textarea.directive.html'),
        link: textareaLink,
    };
    function textareaLink(scope) {
        scope.textareaValue1 = '';
        scope.textareaValue2 = 'disabled text area';
    }
}
