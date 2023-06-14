(function () {
    'use strict';

    /**
     * @name smss-embed.directive.js
     * @desc used for creating the embed container
     */
    angular.module('app.smss-embed.directive', [])
        .directive('smssEmbed', smssEmbed);

    smssEmbed.$inject = ['$rootScope', '$location', '$window', '$timeout', 'dataService', 'monolithService', 'vizdataService', '$ocLazyLoad'];

    function smssEmbed($rootScope, $location, $window, $timeout, dataService, monolithService, vizdataService, $ocLazyLoad) {
        smssEmbedCtrl.$inject = ['$scope'];
        smssEmbedLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

        return {
            restrict: 'E',
            templateUrl: 'standard/smss-embed/smss-embed.directive.html',
            controller: smssEmbedCtrl,
            link: smssEmbedLink,
            controllerAs: 'smssEmbed'
        };

        function smssEmbedCtrl($scope) {
            var smssEmbed = this;

            //variables
            smssEmbed.widgetData = {};
            smssEmbed.settingsEnabled = false;

            //functions
            smssEmbed.resizeViz = resizeViz;
            smssEmbed.initialize = initialize;
            smssEmbed.mainClickListener = mainClickListener;

            /**
             * @name resizeViz
             * @desc emits event to resize the chart
             */
            function resizeViz() {
                $rootScope.$emit('chart-receive', 'sheet-resize-viz');
            }


            /**
             * @name mainClickListener
             * @desc listens for the first click on a widget to update the selected widget properly
             */
            function mainClickListener() {
                if (!dataService.isSelectedWidget()) {
                    dataService.setSelectedWidget(true);
                    $rootScope.$emit('pub-sub-receive', 'select-widget', {});
                }
            }

            /**
             * @name initialize
             * @desc kicks off the creation of the viz to embed
             */
            function initialize() {
                var urlParams = $location.search(),
                    insight = {
                        core_engine: urlParams.engine,
                        core_engine_id: urlParams.questionId,
                        layout: urlParams.layout
                    };

                smssEmbed.originWidgetId = urlParams.widgetId;
                dataService.setOriginWidgetId(smssEmbed.originWidgetId);


                vizdataService.createViz(insight).then(function (output) {
                    if (output.state === 'noParams' || output.state === 'AllSelected') {
                        vizdataService.getChartData(insight).then(function (data) {
                            if (data) {
                                var pkqlOutput = {};
                                if (data.pkqlOutput) {
                                    pkqlOutput = JSON.parse(JSON.stringify(data.pkqlOutput));
                                    delete data.pkqlOutput;
                                }

                                for (var i = 0; i < pkqlOutput.insights.length; i++) {
                                    dataService.setData(
                                        {
                                            insightId: data.insightID,
                                            pkqlData: (pkqlOutput.insights[i] && pkqlOutput.insights[i].pkqlData) ? pkqlOutput.insights[i].pkqlData : [],
                                            pkqlStep: (pkqlOutput.insights[i] && pkqlOutput.insights[i].pkqlData) ? pkqlOutput.insights[i].pkqlData.length - 1 : -1,
                                            dataId: (pkqlOutput.insights[i] && pkqlOutput.insights[i].dataID) ? pkqlOutput.insights[i].dataID : 0,
                                            feData: (pkqlOutput.insights[i] && pkqlOutput.insights[i].feData) ? pkqlOutput.insights[i].feData : {},
                                            selected: { data: {}, traverse: {}, related: {} }
                                        }, {
                                            data: {
                                                insightData: insight,
                                                chartData: data.chartData,
                                                comments: { list: {}, maxId: 0 },
                                                panelConfig: {}
                                            },
                                            selectedHandle: ''
                                        });
                                }
                            }
                        });
                    } else if (output.state === 'notAllSelected') {
                        //faking for param
                        console.warn('open param model', insight, output);


                        dataService.setData(
                            {
                                insightId: false,
                                pkqlData: [],
                                pkqlStep: -1,
                                dataId: 0,
                                feData: {},
                                selected: { data: {}, traverse: {}, related: {} }
                            }, {
                                data: {
                                    insightData: insight,
                                    chartData: {
                                        layout: insight.layout,
                                        recipe: [],
                                        insightID: false,
                                        isPkqlRunnable: false,
                                        core_engine: {
                                            name: insight.core_engine,
                                            api: null
                                        }
                                    },
                                    comments: { list: {}, maxId: 0 },
                                    panelConfig: {}
                                },
                                selectedHandle: 'param'
                            });
                    }
                });


                //??? need to figure this out. how do we want to pass data through to the iframe?
                //should we create an empty frame and then listen to get more data and  refresh the frame?...performance issues?
                //TODO empty, and then once widget is created, we will post a message to the parent telling it to send the data through postmessage
                //TODO OR we can send the data over to iframe and have it saved in the dataservice and iframe will assume the data is in dataservice so then we just refresh the widget and grab data from service and it should be able to just draw


                //lazy load widget directive in background
                console.log('todo lazy load other things in background');
                $ocLazyLoad.load(['standard/widget/widget.directive.js', 'standard/widget/widget.css']);
            }
        }

        function smssEmbedLink(scope, ele, attrs, ctrl) {
            var addedWidgetListener = $rootScope.$on('widget-opened', function (event, data) {
                console.log('%cPUBSUBV2:', 'color:lightseagreen', 'widget-opened', data);
                var showWidgetTimeout = $timeout(function () {
                    scope.smssEmbed.showWidget = true;
                    $timeout.cancel(showWidgetTimeout);
                });
            });

            angular.element($window).bind('resize', scope.smssEmbed.resizeViz);

            scope.$on('$destroy', function () {
                console.log('destroying embed....');
                angular.element($window).unbind('resize', smssEmbed.resizeViz);
                addedWidgetListener();
            });

            scope.smssEmbed.initialize();
        }
    }
})();
