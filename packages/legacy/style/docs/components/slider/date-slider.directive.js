export default angular
    .module('docs.date-slider', [])
    .directive('dateSliderSection', dateSliderDirective);

function dateSliderDirective() {
    sliderLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./date-slider.directive.html'),
        link: sliderLink,
    };

    function sliderLink(scope) {
        scope.date = {
            slider1: '2019-01-01',
            slider2: ['2014-01-01', '2019-01-01'],
            options: {
                start: '2004-01-01',
                end: '2024-01-01',
            },
        };
    }
}
