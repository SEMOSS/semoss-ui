'use strict';

export default angular
    .module('app.mdm-instances.directive', [])
    .directive('mdmInstances', mdmInstancesDirective);

import './mdm-instances.scss';

mdmInstancesDirective.$inject = ['$timeout', 'semossCoreService'];

function mdmInstancesDirective($timeout, semossCoreService) {
    mdmInstancesCtrl.$inject = [];
    mdmInstancesLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./mdm-instances.directive.html'),
        scope: {},
        require: [],
        controllerAs: 'mdmInstances',
        bindToController: {
            appId: '=',
            concept: '=',
            insightID: '=',
        },
        controller: mdmInstancesCtrl,
        link: mdmInstancesLink,
    };

    function mdmInstancesCtrl() {}

    function mdmInstancesLink(scope, ele, attrs, ctrl) {
        var instanceTimeout;

        scope.mdmInstances.filterInstances = filterInstances;
        scope.mdmInstances.getMoreInstances = getMoreInstances;

        scope.mdmInstances.instances = {
            loading: false,
            taskId: false,
            options: [], // all values on the dom for the alias
            search: '', // search term used
            limit: 50, // how many filter values to collect
            canCollect: true,
        };

        /**
         * @name getInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function getInstances() {
            var components = [],
                filterObj = {},
                message = semossCoreService.utility.random('meta-pixel');

            scope.mdmInstances.instances.loading = true;
            scope.mdmInstances.instances.taskId = false;
            scope.mdmInstances.instances.options = [];
            scope.mdmInstances.instances.canCollect = true;

            components = components.concat([
                {
                    type: 'database',
                    components: [scope.mdmInstances.appId],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector: scope.mdmInstances.concept,
                                alias: scope.mdmInstances.concept,
                            },
                        ],
                    ],
                },
            ]);

            if (scope.mdmInstances.instances.search) {
                // search
                filterObj[scope.mdmInstances.concept] = {
                    comparator: '?like',
                    value: [scope.mdmInstances.instances.search],
                };

                components.push({
                    type: 'filter',
                    components: [filterObj],
                });
            }

            components = components.concat([
                {
                    type: 'sort',
                    components: [[scope.mdmInstances.concept]],
                },
                {
                    type: 'collect',
                    components: [scope.mdmInstances.instances.limit],
                    terminal: true,
                },
            ]);

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len,
                    temp;

                // add new ones
                for (i = 0, len = output.data.values.length; i < len; i++) {
                    temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.mdmInstances.instances.options.push(
                        output.data.values[i][0]
                    );
                }

                scope.mdmInstances.instances.taskId = output.taskId;
                scope.mdmInstances.instances.canCollect =
                    output.numCollected === output.data.values.length;
                scope.mdmInstances.instances.loading = false;
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmInstances.insightID,
                commandList: components,
                response: message,
            });
        }

        /**
         * @name getMoreInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function getMoreInstances() {
            // var message = semossCoreService.utility.random('meta-pixel');
            // if (!scope.mdmInstances.instances.canCollect) {
            //     return;
            // }
            // scope.mdmInstances.instances.loading = true;
            // // register message to come back to
            // semossCoreService.once(message, function (response) {
            //     var output = response.pixelReturn[0].output,
            //         i,
            //         len,
            //         temp;
            //     // add new ones
            //     for (i = 0, len = output.data.values.length; i < len; i++) {
            //         temp = output.data.values[i][0];
            //         if (typeof temp === 'string') {
            //             temp = temp.replace(/_/g, ' ');
            //         }
            //         scope.mdmInstances.instances.options.push(output.data.values[i][0]);
            //     }
            //     scope.mdmInstances.instances.taskId = output.taskId;
            //     scope.mdmInstances.instances.canCollect = (output.numCollected === output.data.values.length);
            //     scope.mdmInstances.instances.loading = false;
            // });
            // semossCoreService.emit('meta-pixel', {
            //     insightID: scope.mdmInstances.insightID,
            //     commandList: [
            //         {
            //             type: 'task',
            //             components: [
            //                 scope.mdmInstances.instances.taskId
            //             ]
            //         },
            //         {
            //             type: 'collect',
            //             components: [
            //                 scope.mdmInstances.instances.limit
            //             ],
            //             terminal: true
            //         }
            //     ],
            //     response: message
            // });
        }

        /**
         * @name getInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function filterInstances() {
            if (instanceTimeout) {
                $timeout.cancel(instanceTimeout);
            }

            instanceTimeout = $timeout(function () {
                getInstances();
            }, 500);
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            //  get the metamodel
            $timeout(function () {
                scope.$watch(
                    'mdmInstances.appId',
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            getInstances();
                        }
                    }
                );

                scope.$watch(
                    'mdmInstances.concept',
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            getInstances();
                        }
                    }
                );

                getInstances();
            });
        }

        initialize();
    }
}
