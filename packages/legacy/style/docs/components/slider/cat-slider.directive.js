export default angular
    .module('docs.cat-slider', [])
    .directive('catSliderSection', catSliderDirective);
function catSliderDirective() {
    sliderLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./cat-slider.directive.html'),
        link: sliderLink,
    };
    function sliderLink(scope) {
        scope.categorical = {};
        scope.categorical.slider1 = 0;
        scope.categorical.slider2 = ['ipsum', 'amet'];
        scope.categorical.options1 = [
            {
                display: 'Lorem',
                value: 0,
            },
            {
                display: 'ipsum',
                value: 1,
            },
            {
                display: 'dolor',
                value: 2,
            },
            {
                display: 'sit',
                value: 3,
            },
            {
                display: 'amet',
                value: 4,
            },
        ];
        scope.categorical.options2 = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
    }
}
