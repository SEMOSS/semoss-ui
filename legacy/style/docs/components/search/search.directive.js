export default angular
    .module('docs.search', [])
    .directive('searchSection', searchDirective);

function searchDirective() {
    searchLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./search.directive.html'),
        link: searchLink,
    };

    function searchLink(scope) {
        scope.searchValue1 = '';
        scope.searchValue2 = 'hello world';
        scope.searchValue3 = '';
        scope.searchDisabled = true;
    }
}
