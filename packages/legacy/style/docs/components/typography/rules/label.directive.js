export default angular
    .module('docs.label-rules', [])
    .directive('labelRules', labelRulesDirective);

function labelRulesDirective() {
    return {
        restrict: 'E',
        template:
            '<div style="border: 1px solid #e7e7e7; padding: 8px;"> <h3>Formatting</h3>' +
            '<ul><li>Use Title Case for capitalization. Use <a href="https://capitalizemytitle.com/" target="_blank">this tool</a> to help you.</li>' +
            '<li>Always include a colon (:) at the end of a label</li>' +
            '</div>',
    };
}
