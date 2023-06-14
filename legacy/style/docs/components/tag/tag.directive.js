export default angular
    .module('docs.tag', [])
    .directive('tagSection', tagDirective);

function tagDirective() {
    tagLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./tag.directive.html'),
        link: tagLink,
    };

    function tagLink(scope) {
        scope.tagValue1 = 'Default';
        scope.tagValue2 = 'Compact';
        scope.tagValue3 = 'Disabled';
        scope.tagValue4 = 'Close Icon';
        scope.tagDisabled = true;
        scope.tagColors = [
            'teal',
            'orange',
            'purple',
            'blue',
            'yellow',
            'pink',
            'violet',
            'olive',
        ];
    }
}
