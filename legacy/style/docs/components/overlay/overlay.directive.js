export default angular
    .module('docs.overlay', [])
    .directive('overlaySection', overlayDirective);

function overlayDirective() {
    overlayLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./overlay.directive.html'),
        replace: true,
        link: overlayLink,
    };
    function overlayLink(scope) {
        scope.overlay1 = false;
        scope.overlay2 = false;
        scope.overlay3 = false;
        scope.overlay4 = false;
        scope.overlay5 = false;
        scope.close = close;
        function close() {
            scope.overlay3 = false;
        }
    }
}
