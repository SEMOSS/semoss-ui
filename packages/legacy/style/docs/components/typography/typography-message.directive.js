export default angular
    .module('docs.message', [])
    .directive('messageSection', messageDirective);

function messageDirective() {
    return {
        restrict: 'E',
        template: require('./typography-message.directive.html'),
        replace: true,
    };
}
