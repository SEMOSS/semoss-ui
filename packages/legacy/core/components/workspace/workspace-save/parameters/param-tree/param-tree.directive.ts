import angular from 'angular';
import './param-tree.scss';

export default angular
    .module('app.param-tree.directive', [])
    .directive('paramTree', paramTreeDirective);

paramTreeDirective.$inject = [];

function paramTreeDirective() {
    paramTreeCtrl.$inject = [];
    paramTreeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^parameters'],
        scope: {},
        controller: paramTreeCtrl,
        controllerAs: 'paramTree',
        bindToController: {},
        template: require('./param-tree.directive.html'),
        link: paramTreeLink,
        replace: true,
    };

    function paramTreeCtrl() {}

    function paramTreeLink(scope, ele, attrs, ctrl) {
        scope.parametersCtrl = ctrl[0];
        scope.paramTree.showUOperator = showUOperator;
        scope.paramTree.isDisabled = isDisabled;
        /**
         * @name isDisabled
         * @param level the level that is selected
         * @param columnName the column that is selected
         * @param levelName the name of level selected
         * @param pixelId pixel id it belongs to
         * @desc disable if selectedParam exists
         * @returns {boolean} true/false
         */
        function isDisabled(
            level: string,
            columnName: string,
            levelName: string,
            pixelId: string
        ): boolean {
            let disabled = false;

            function _getLevelName(param): string {
                let levelName = '';
                if (level === 'COLUMN') {
                    levelName = param.columnName;
                } else if (level === 'TABLE') {
                    levelName = param.tableName;
                } else if (level === 'OPERATOR') {
                    levelName = param.operator;
                } else if (level === 'OPERATORU') {
                    levelName = param.uOperator;
                }

                return levelName;
            }

            // if there is a selectedParam
            if (scope.parametersCtrl.selectedParam._display) {
                if (scope.parametersCtrl.selectedParam._edit) {
                    let details: any = {};
                    // find the correct details to check
                    for (
                        let detailsIdx = 0;
                        detailsIdx <
                        scope.parametersCtrl.selectedParam.detailsList.length;
                        detailsIdx++
                    ) {
                        if (
                            scope.parametersCtrl.selectedParam.detailsList[
                                detailsIdx
                            ].columnName === columnName &&
                            scope.parametersCtrl.selectedParam.detailsList[
                                detailsIdx
                            ].level === level &&
                            scope.parametersCtrl.selectedParam.detailsList[
                                detailsIdx
                            ].pixelId === pixelId &&
                            _getLevelName(
                                scope.parametersCtrl.selectedParam.detailsList[
                                    detailsIdx
                                ]
                            ) === levelName
                        ) {
                            details =
                                scope.parametersCtrl.selectedParam.detailsList[
                                    detailsIdx
                                ];
                            break;
                        }
                    }

                    disabled =
                        level !== details.level ||
                        columnName !== details.columnName ||
                        pixelId !== details.pixelId ||
                        levelName !== _getLevelName(details);
                } else {
                    disabled =
                        level !== scope.parametersCtrl.selectedParam.level ||
                        columnName !==
                            scope.parametersCtrl.selectedParam.columnName ||
                        pixelId !==
                            scope.parametersCtrl.selectedParam.pixelId ||
                        levelName !==
                            _getLevelName(scope.parametersCtrl.selectedParam);
                }
            }

            return disabled;
        }

        /**
         * @name showUOperator
         * @param operatorObj the object to check to see whether we need to show the additiona level
         * @desc checks to see if the uOperator level needs to be shown. If only one operator, we dont need to.
         */
        function showUOperator(operatorObj: any): boolean {
            let show = true,
                count = 0;

            for (const uOperator in operatorObj) {
                if (
                    operatorObj.hasOwnProperty(uOperator) &&
                    !uOperator.startsWith('_')
                ) {
                    count++;
                }
            }
            show = count > 1;

            return show;
        }

        scope.paramTree.paramOptions = scope.parametersCtrl.paramOptions;
    }
}
