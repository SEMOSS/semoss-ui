import * as angular from 'angular';

import './formula-stem.scss';

export default angular
    .module('app.formula.formula-stem', [])
    .directive('formulaStem', formulaStemDirective);

formulaStemDirective.$inject = [];

function formulaStemDirective() {
    formulaStemLink.$inject = ['scope', 'ele', 'attrs', 'ctrl', 'transclude'];

    return {
        restrict: 'E',
        template: require('./formula-stem.directive.html'),
        scope: {
            path: '@',
            stem: '=',
        },
        require: ['^formula'],
        replace: true,
        link: formulaStemLink,
    };

    function formulaStemLink(scope, ele, attrs, ctrl, transclude) {
        scope.formulaCtrl = ctrl[0];

        scope.close = close;

        /**
         * @name close
         * @desc close the stem
         * @param path - path to close
         */
        function close(path: string): void {
            scope.formulaCtrl.closeStem(path);
        }

        /**
         * @name updateData
         * @desc update the data based on the stem
         */
        function updateData(): void {
            // update the data
            if (!scope.stem || !scope.stem.leaf) {
                scope.data = null;
                return;
            }

            // bind the data if possible
            scope.data = scope.formulaCtrl.data[scope.stem.leaf.id];
        }

        /** Utility */
        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            // update the stem data
            updateData();

            // watch changes in the id, this will effect how we bind the data
            scope.$watch(
                function () {
                    if (!scope.stem || !scope.stem.leaf) {
                        return null;
                    }

                    return scope.stem.leaf.id;
                },
                function () {
                    updateData();
                }
            );
        }

        initialize();
    }
}
