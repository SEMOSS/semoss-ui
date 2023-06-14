export default angular
    .module('docs.title-rules', [])
    .directive('titleRules', titleRulesDirective);

function titleRulesDirective() {
    return {
        restrict: 'E',
        template:
            '<div style="border: 1px solid #e7e7e7; padding: 8px;"> <h3>Formatting</h3>' +
            '<ul><li>Use Title Case for capitalization. Use <a href="https://capitalizemytitle.com/" target="_blank">this tool</a> to help you.</li>' +
            '<li>Titles should be no longer than 4-5 words</li>' +
            '<li>Avoid using punctuation for titles (periods, commas, colons, semicolons) </li></ul>' +
            '</div>',
    };
}
