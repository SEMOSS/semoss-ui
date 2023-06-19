import angular from 'angular';

import './lookup-generate.scss';

export default angular
    .module('app.lookup-generate.directive', [])
    .directive('lookupGenerate', lookupGenerate);

lookupGenerate.$inject = [];

function lookupGenerate() {
    lookupGenerateLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    lookupGenerateCtrl.$inject = [];

    return {
        restrict: 'E',
        template: require('./lookup-generate.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        bindToController: {},
        controllerAs: 'lookupGenerate',
        controller: lookupGenerateCtrl,
        link: lookupGenerateLink,
    };

    function lookupGenerateCtrl() {}

    function lookupGenerateLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.lookupGenerate.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.lookupGenerate.cancel = cancel;
        scope.lookupGenerate.execute = execute;

        /**
         * @name getFrameName
         * @param accessor - how do we want to access the frame?
         * @returns frame options
         */
        function getFrame(accessor?: string): any {
            if (scope.lookupGenerate.PIPELINE) {
                return scope.pipelineComponentCtrl.getComponent(
                    accessor
                        ? 'parameters.FRAME.value.' + accessor
                        : 'parameters.FRAME.value'
                );
            }

            return scope.widgetCtrl.getFrame(accessor);
        }

        /**
         * @name resetPanel
         * @desc updates the initial panel options
         */
        function resetPanel(): void {
            let keepSelected = false;

            scope.lookupGenerate.headers = getFrame('headers') || [];

            if (scope.lookupGenerate.selected) {
                for (
                    let headerIdx = 0,
                        headerLen = scope.lookupGenerate.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    if (
                        scope.lookupGenerate.headers[headerIdx].alias ===
                        scope.lookupGenerate.selected
                    ) {
                        keepSelected = true;
                        return;
                    }
                }
            }

            if (!keepSelected && scope.lookupGenerate.headers.length > 0) {
                scope.lookupGenerate.selected =
                    scope.lookupGenerate.headers[0].alias;
            }
        }

        /**
         * @name buildParameters
         * @desc builds params for pipeline
         * @param previewBoolean - is this preview only?
         * @return the params and their values
         */
        function buildParameters(previewBoolean: boolean): any {
            const parameters: {
                FRAME: any;
                COLUMN?: any;
                FILE?: any;
            } = {
                FRAME: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.FRAME.value.name'
                    ),
                },
            };

            if (!previewBoolean) {
                parameters.COLUMN = scope.lookupGenerate.selected;

                if (scope.lookupGenerate.file) {
                    parameters.FILE = {
                        path: scope.lookupGenerate.file.path,
                        space: scope.lookupGenerate.file.space,
                    };
                }
            }

            return parameters;
        }

        /**
         * @name execute
         * @desc runs the query using all the defined values
         */
        function execute(): void {
            const parameters = buildParameters(false);
            if (scope.lookupGenerate.PIPELINE) {
                scope.pipelineComponentCtrl.executeComponent(parameters, {
                    name: `Generated Lookup: ${parameters.FILE.path}`,
                });
                return;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        `${parameters.FRAME.name} | LookupGenerate(column=["${parameters.COLUMN}"], fileName=["${parameters.FILE.path}"], space=["${parameters.FILE.space}"]);`,
                    ],
                    meta: true,
                    terminal: true,
                },
            ]);
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         */
        function cancel(): void {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name preview
         * @desc loads preview
         */
        function preview(): void {
            const parameters = buildParameters(true);

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let updateFrameListener;

            // register listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                function () {
                    resetPanel();
                }
            );

            scope.$on('$destroy', function () {
                updateFrameListener();
            });

            if (scope.lookupGenerate.PIPELINE) {
                const frameComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.FRAME.value'
                );
                if (!frameComponent) {
                    scope.pipelineComponentCtrl.closeComponent();
                    return;
                }

                preview();
            }

            resetPanel();
        }

        initialize();
    }
}
