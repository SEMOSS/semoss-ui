import * as angular from 'angular';

import './pipeline-app-calculation-single.scss';

export default angular
    .module('app.pipeline.pipeline-app.calculation.single', [])
    .directive(
        'pipelineAppCalculationSingle',
        pipelineAppCalculationSingleDirective
    );

pipelineAppCalculationSingleDirective.$inject = [];

function pipelineAppCalculationSingleDirective() {
    pipelineAppCalculationSingleCtrl.$inject = [];
    pipelineAppCalculationSingleLink.$inject = [
        'scope',
        'ele',
        'attrs',
        'ctrl',
    ];

    return {
        restrict: 'E',
        template: require('./pipeline-app-calculation-single.directive.html'),
        scope: {},
        require: ['^widget'],
        controller: pipelineAppCalculationSingleCtrl,
        controllerAs: 'pipelineAppCalculationSingle',
        bindToController: {
            type: '=',
            source: '=',
            calculation: '=',
        },
        link: pipelineAppCalculationSingleLink,
    };

    function pipelineAppCalculationSingleCtrl() {}

    function pipelineAppCalculationSingleLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {}

        initialize();
    }
}
