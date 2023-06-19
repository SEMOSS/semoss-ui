export default angular
    .module('docs.checkboxRules', [])
    .directive('checkboxRules', rulesDirective);

function rulesDirective() {
    return {
        restrict: 'E',
        template:
            '<div class="smss-border--default" style="padding: 8px"><h3>Left vs Right</h3>' +
            '<p>For most cases, use  for checkboxes. Only use direction="right" when the items are in a list.</p></div>',
    };
}
