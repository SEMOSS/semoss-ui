export default angular
    .module('docs.num-slider', [])
    .directive('numSliderSection', numSliderDirective);
function numSliderDirective() {
    sliderLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./num-slider.directive.html'),
        link: sliderLink,
    };
    function sliderLink(scope) {
        scope.numerical = {};
        scope.numerical.disabled = true;
        scope.numerical.slider1 = 0;
        scope.numerical.slider2 = 0;
        scope.numerical.slider3 = 0;
        scope.numerical.slider4 = [10, 20];
        scope.numerical.slider5 = [10, 20];
    }
}
