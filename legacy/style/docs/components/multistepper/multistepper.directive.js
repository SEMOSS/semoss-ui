export default angular
    .module('docs.multistepper', [])
    .directive('multistepperSection', multistepperDirective);

function multistepperDirective() {
    multistepperLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./multistepper.directive.html'),
        replace: true,
        link: multistepperLink,
    };

    function multistepperLink(scope) {
        scope.updateState = updateState;
        scope.steps = [
            {
                name: 'Step 1',
                currentState: 'completed',
                originalState: 'completed',
            },
            {
                name: 'Step 2',
                currentState: 'active',
                originalState: 'active',
            },
            {
                name: 'Step 3',
                currentState: 'optional',
                originalState: 'optional',
            },
            {
                name: 'Step 4',
                currentState: 'default',
                originalState: 'default',
            },
        ];
        scope.activeStep = scope.steps[1];

        function updateState(selectedStep) {
            scope.activeStep.currentState =
                scope.activeStep.originalState === 'completed' ||
                scope.activeStep.originalState === 'optional'
                    ? scope.activeStep.originalState
                    : 'default';
            selectedStep.currentState = 'active';
            scope.activeStep = selectedStep;
        }
    }
}
