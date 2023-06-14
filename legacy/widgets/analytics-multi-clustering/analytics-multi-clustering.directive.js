'use strict';

export default angular
    .module('app.analytics-multi-clustering.directive', [])
    .directive('analyticsMultiClustering', analyticsMultiClusteringDirective);

analyticsMultiClusteringDirective.$inject = [];

function analyticsMultiClusteringDirective() {
    analyticsMultiClusteringCtrl.$inject = [];
    analyticsMultiClusteringLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        controllerAs: 'analyticsMultiClustering',
        bindToController: {},
        template: require('./analytics-multi-clustering.directive.html'),
        controller: analyticsMultiClusteringCtrl,
        link: analyticsMultiClusteringLink,
        require: ['^widget'],
    };

    function analyticsMultiClusteringCtrl() {}

    function analyticsMultiClusteringLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var analyticsMultiClusteringUpdateFrameListener,
            analyticsMultiClusteringUpdateTaskListener,
            updateOrnamentsListener;
        // variables

        scope.analyticsMultiClustering.algorithm = {};
        scope.analyticsMultiClustering.algorithm.options = [
            'Kmeans (more sensitive to outliers)',
            'Pam (less sensitive to outliers)',
        ];
        scope.analyticsMultiClustering.showAlgorithm = false;

        scope.analyticsMultiClustering.instance = {};
        scope.analyticsMultiClustering.instance.options = [];

        scope.analyticsMultiClustering.attributes = {};
        scope.analyticsMultiClustering.attributes.options = [];
        scope.analyticsMultiClustering.attributes.selectedAttributes = [];

        scope.analyticsMultiClustering.uniqInstPerRow = {
            uniqInstPerRow: 'No',
        };
        scope.analyticsMultiClustering.uniqInstPerRow.options = ['Yes', 'No'];

        // functions
        scope.analyticsMultiClustering.getAttributes = getAttributes;
        scope.analyticsMultiClustering.getAlgorithm = getAlgorithm;
        scope.analyticsMultiClustering.updateRange = updateRange;
        scope.analyticsMultiClustering.execute = execute;

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

            scope.analyticsMultiClustering.headers = headers;
            scope.analyticsMultiClustering.instance.options =
                scope.analyticsMultiClustering.attributes.options =
                    availableHeaders;

            scope.analyticsMultiClustering.minNumClusters = 2;
            scope.analyticsMultiClustering.maxNumClusters = 20;

            scope.analyticsMultiClustering.selectedRange = [
                scope.analyticsMultiClustering.minNumClusters,
                scope.analyticsMultiClustering.maxNumClusters,
            ];
        }

        /**
         * @name updateRange
         * @desc function that is sets the range of the min and max clusters
         * @returns {void}
         */
        function updateRange() {
            scope.analyticsMultiClustering.minNumClusters =
                scope.analyticsMultiClustering.selectedRange[0];
            scope.analyticsMultiClustering.maxNumClusters =
                scope.analyticsMultiClustering.selectedRange[1];
        }

        /**
         * @name getAttributes
         * @desc function that removes selected dimension from attribute options
         * @returns {void}
         */
        function getAttributes() {
            var header,
                availableHeaders = [];

            for (header in scope.analyticsMultiClustering.headers) {
                if (
                    availableHeaders.indexOf(
                        scope.analyticsMultiClustering.headers[header].alias
                    ) === -1 &&
                    scope.analyticsMultiClustering.headers[header].alias !==
                        scope.analyticsMultiClustering.instance.selectedInstance
                ) {
                    availableHeaders.push(
                        String(
                            scope.analyticsMultiClustering.headers[header].alias
                        )
                    );
                }
            }

            scope.analyticsMultiClustering.attributes.options =
                availableHeaders;
        }

        /**
         * @name getAlgorithm
         * @desc function that determines the available algorithms based off selected attributes data type
         * @param {array} attributes scope.analyticsMultiClustering.attributes.selectedAttributes
         * @returns {void}
         */
        function getAlgorithm(attributes) {
            var i, j;

            for (i = 0; i < attributes.length; i++) {
                for (
                    j = 0;
                    j < scope.analyticsMultiClustering.headers.length;
                    j++
                ) {
                    if (
                        attributes[i] ===
                        scope.analyticsMultiClustering.headers[j].alias
                    ) {
                        if (
                            scope.analyticsMultiClustering.headers[j]
                                .dataType !== 'NUMBER'
                        ) {
                            scope.analyticsMultiClustering.algorithm.selectedAlgorithm =
                                'pamGower';
                            scope.analyticsMultiClustering.showAlgorithm = false;
                            return;
                        }
                    }
                }
            }

            scope.analyticsMultiClustering.showAlgorithm = true;
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
                typeof scope.analyticsMultiClustering.instance
                    .selectedInstance === 'undefined'
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select a Dimension to cluster.'
                );
                return;
            }
            if (
                scope.analyticsMultiClustering.attributes.selectedAttributes
                    .length < 1
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select at least one attributes.'
                );
                return;
            }
            if (
                typeof scope.analyticsMultiClustering.algorithm
                    .selectedAlgorithm === 'undefined'
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
                scope.analyticsMultiClustering.attributes.selectedAttributes
                    .length;
                j++
            ) {
                if (j === 0) {
                    attributeString =
                        '"' +
                        scope.analyticsMultiClustering.attributes
                            .selectedAttributes[j] +
                        '"';
                } else {
                    attributeString = attributeString.concat(
                        ', "' +
                            scope.analyticsMultiClustering.attributes
                                .selectedAttributes[j] +
                            '"'
                    );
                }
            }

            uniqString =
                scope.analyticsMultiClustering.uniqInstPerRow
                    .selectedUniqInstPerRow || 'No';

            if (
                scope.analyticsMultiClustering.showAlgorithm &&
                scope.analyticsMultiClustering.algorithm.selectedAlgorithm ===
                    'Kmeans (more sensitive to outliers)'
            ) {
                algorithm = 'kmeans';
            } else if (
                scope.analyticsMultiClustering.showAlgorithm &&
                scope.analyticsMultiClustering.algorithm.selectedAlgorithm ===
                    'Pam (less sensitive to outliers)'
            ) {
                algorithm = 'pam';
            } else {
                algorithm = 'pamGower';
            }

            query =
                'RunClustering ( algorithm = [' +
                algorithm +
                '], multiOption = [true], instance = [' +
                scope.analyticsMultiClustering.instance.selectedInstance +
                '] , attributes = [' +
                attributeString +
                '], minNumClusters = [' +
                scope.analyticsMultiClustering.minNumClusters +
                '], maxNumClusters = [' +
                scope.analyticsMultiClustering.maxNumClusters +
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
            resetPanel();

            // listeners
            analyticsMultiClusteringUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            analyticsMultiClusteringUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            analyticsMultiClusteringUpdateFrameListener();
            analyticsMultiClusteringUpdateTaskListener();
            updateOrnamentsListener();
        });
    }
}
