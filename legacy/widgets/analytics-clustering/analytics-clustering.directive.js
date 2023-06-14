'use strict';

export default angular
    .module('app.analytics-clustering.directive', [])
    .directive('analyticsClustering', analyticsClusteringDirective);

analyticsClusteringDirective.$inject = [];

function analyticsClusteringDirective() {
    analyticsClusteringCtrl.$inject = [];
    analyticsClusteringLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        controllerAs: 'analyticsClustering',
        bindToController: {},
        template: require('./analytics-clustering.directive.html'),
        controller: analyticsClusteringCtrl,
        link: analyticsClusteringLink,
        require: ['^widget'],
    };

    function analyticsClusteringCtrl() {}

    function analyticsClusteringLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var analyticsClusteringUpdateFrameListener,
            analyticsClusteringUpdateTaskListener,
            updateOrnamentsListener;

        // variables

        scope.analyticsClustering.algorithm = {};
        scope.analyticsClustering.algorithm.options = [
            'Kmeans (more sensitive to outliers)',
            'Pam (less sensitive to outliers)',
        ];
        scope.analyticsClustering.showAlgorithm = false;

        scope.analyticsClustering.instance = {};
        scope.analyticsClustering.instance.options = [];

        scope.analyticsClustering.attributes = {};
        scope.analyticsClustering.attributes.options = [];
        scope.analyticsClustering.attributes.selectedAttributes = [];

        scope.analyticsClustering.uniqInstPerRow = {
            selectedUniqInstPerRow: 'No',
        };
        scope.analyticsClustering.uniqInstPerRow.options = ['Yes', 'No'];

        // functions
        scope.analyticsClustering.resetPanel = resetPanel;
        scope.analyticsClustering.getAttributes = getAttributes;
        scope.analyticsClustering.getAlgorithm = getAlgorithm;
        scope.analyticsClustering.execute = execute;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var headers = scope.widgetCtrl.getFrame('headers') || [],
                availableHeaders = [],
                headerIdx,
                headerLen;

            for (
                headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (availableHeaders.indexOf(headers[headerIdx].alias) === -1) {
                    availableHeaders.push(headers[headerIdx].alias);
                }
            }

            scope.analyticsClustering.headers = headers;
            scope.analyticsClustering.instance.options =
                scope.analyticsClustering.attributes.options = availableHeaders;

            scope.analyticsClustering.numClusters = 5;
        }

        /**
         * @name getAttributes
         * @desc function that removes selected dimension from attribute options
         * @returns {void}
         */
        function getAttributes() {
            var header,
                availableHeaders = [];

            for (header in scope.analyticsClustering.headers) {
                if (
                    availableHeaders.indexOf(
                        scope.analyticsClustering.headers[header].alias
                    ) === -1 &&
                    scope.analyticsClustering.headers[header].alias !==
                        scope.analyticsClustering.instance.selectedInstance
                ) {
                    availableHeaders.push(
                        String(scope.analyticsClustering.headers[header].alias)
                    );
                }
            }

            scope.analyticsClustering.attributes.options = availableHeaders;
        }

        /**
         * @name getAlgorithm
         * @desc function that determines the available algorithms based off selected attributes data type
         * @param {array} attributes analyticsClustering.attributes.selectedAttributes
         * @returns {void}
         */
        function getAlgorithm(attributes) {
            var i, j;

            for (i = 0; i < attributes.length; i++) {
                for (j = 0; j < scope.analyticsClustering.headers.length; j++) {
                    if (
                        attributes[i] ===
                        scope.analyticsClustering.headers[j].alias
                    ) {
                        if (
                            scope.analyticsClustering.headers[j].dataType !==
                            'NUMBER'
                        ) {
                            scope.analyticsClustering.algorithm.selectedAlgorithm =
                                'pamGower';
                            scope.analyticsClustering.showAlgorithm = false;
                            return;
                        }
                    }
                }
            }

            scope.analyticsClustering.showAlgorithm = true;
        }

        /**
         * @name execute
         * @desc executes the groub by
         * @returns {void}
         */
        function execute() {
            var attributeString = '',
                j,
                uniqString,
                query = '',
                algorithm,
                limit = scope.widgetCtrl.getOptions('limit');

            if (
                typeof scope.analyticsClustering.instance.selectedInstance ===
                'undefined'
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select a Dimension to cluster.'
                );
                return;
            }
            if (
                scope.analyticsClustering.attributes.selectedAttributes.length <
                1
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select at least one attributes.'
                );
                return;
            }
            if (
                typeof scope.analyticsClustering.algorithm.selectedAlgorithm ===
                'undefined'
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select a Cluster Algorithm.'
                );
                return;
            }

            for (
                j = 0;
                j <
                scope.analyticsClustering.attributes.selectedAttributes.length;
                j++
            ) {
                if (j === 0) {
                    attributeString =
                        '"' +
                        scope.analyticsClustering.attributes.selectedAttributes[
                            j
                        ] +
                        '"';
                } else {
                    attributeString = attributeString.concat(
                        ', "' +
                            scope.analyticsClustering.attributes
                                .selectedAttributes[j] +
                            '"'
                    );
                }
            }

            uniqString =
                scope.analyticsClustering.uniqInstPerRow
                    .selectedUniqInstPerRow || 'No';

            if (
                scope.analyticsClustering.showAlgorithm &&
                scope.analyticsClustering.algorithm.selectedAlgorithm ===
                    'Kmeans (more sensitive to outliers)'
            ) {
                algorithm = 'kmeans';
            } else if (
                scope.analyticsClustering.showAlgorithm &&
                scope.analyticsClustering.algorithm.selectedAlgorithm ===
                    'Pam (less sensitive to outliers)'
            ) {
                algorithm = 'pam';
            } else {
                algorithm = 'pamGower';
            }

            query =
                scope.widgetCtrl.getFrame('name') +
                ' | RunClustering ( algorithm = [' +
                algorithm +
                '], multiOption = [false], instance = [' +
                scope.analyticsClustering.instance.selectedInstance +
                '] , attributes = [' +
                attributeString +
                '], numClusters = [' +
                scope.analyticsClustering.numClusters +
                '], uniqInstPerRow = [' +
                uniqString +
                '] ); Frame(' +
                scope.widgetCtrl.getFrame('name') +
                ')|QueryAll()|AutoTaskOptions(panel=[' +
                scope.widgetCtrl.panelId +
                '], layout=["Grid"])|Collect(' +
                limit +
                ')';

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [query],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // listeners
            analyticsClusteringUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            analyticsClusteringUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                analyticsClusteringUpdateFrameListener();
                analyticsClusteringUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
