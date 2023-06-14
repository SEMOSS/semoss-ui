export default angular
    .module('docs.alert', [])
    .directive('alertSection', alertDirective);
alertDirective.$inject = ['$timeout'];
function alertDirective($timeout) {
    alertLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./alert.directive.html'),
        link: alertLink,
    };
    function alertLink(scope) {
        var alertTimeout;
        scope.alert1 = true;
        scope.alert2 = false;
        scope.alertColor = {
            primary: 'primary',
            error: 'error',
            warn: 'warn',
            success: 'success',
        };
        scope.showAlert = showAlert;

        function showAlert() {
            scope.alert2 = true;
            if (alertTimeout) {
                $timeout.cancel(alertTimeout);
            }
            alertTimeout = $timeout(function () {
                scope.alert2 = false;
            }, 5000);
        }
    }
}
