import Utility from '../../core/utility/utility.js';
import angular from 'angular';
import './pipeline-existing-insight.scss';

/**
 * @name pipeline-existing.directive.js
 * @desc federate view
 */
export default angular
    .module('app.pipeline-existing-insights.directive', [])
    .directive('pipelineExistingInsight', pipelineExistingInsightDirective);

pipelineExistingInsightDirective.$inject = [
    'ENDPOINT',
    '$timeout',
    'semossCoreService',
];

function pipelineExistingInsightDirective(
    ENDPOINT: EndPoint,
    $timeout: ng.ITimeoutService,
    semossCoreService: SemossCoreService
) {
    pipelineExistingInsightCtrl.$inject = [];
    pipelineExistingInsightLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '?^pipelineComponent'],
        template: require('./pipeline-existing-insight.directive.html'),
        controller: pipelineExistingInsightCtrl,
        link: pipelineExistingInsightLink,
        scope: {},
        bindToController: {},
        controllerAs: 'pipelineExistingInsight',
    };

    function pipelineExistingInsightCtrl() {}

    function pipelineExistingInsightLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        let contentEle: HTMLElement, scrollTimeout, searchTimeout;

        // scope.pipelineExistingInsight.app = {};// set by the app-select

        scope.pipelineExistingInsight.search = {
            canCollect: false,
            loading: false,
            input: '',
            offset: 0,
            limit: 41,
            results: [],
            tag: '',
        };

        scope.pipelineExistingInsight.tag = {
            options: [
                {
                    tag: '',
                },
            ],
            selected: '',
        };

        scope.pipelineExistingInsight.selectInsight = selectInsight;
        scope.pipelineExistingInsight.searchInsights = searchInsights;
        scope.pipelineExistingInsight.filterInsights = filterInsights;
        scope.pipelineExistingInsight.createViz = createViz;
        scope.pipelineExistingInsight.preview = preview;
        scope.pipelineExistingInsight.getNLPSuggestedInsights =
            getNLPSuggestedInsights;
        scope.pipelineExistingInsight.getInsights = getInsights;

        function selectInsight(insight) {
            scope.pipelineExistingInsight.selectedInsight = insight;
        }

        /**
         * @name getInsights
         * @desc gets the insights for the current selected app
         * @param clear - reset the search
         */
        function getInsights(clear: boolean): void {
            scope.pipelineExistingInsight.search.loading = true;

            // register message to come back to
            const callback = (response: PixelReturnPayload): void => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                scope.pipelineExistingInsight.search.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (clear) {
                    scope.pipelineExistingInsight.search.canCollect = true;
                    scope.pipelineExistingInsight.search.offset = 0;
                    scope.pipelineExistingInsight.search.results = [];
                }

                for (
                    let insightIdx = 0, insightLen = output.length;
                    insightIdx < insightLen;
                    insightIdx++
                ) {
                    output[insightIdx].image = getImage(
                        output[insightIdx].app_insight_id
                    );
                    output[insightIdx].last_modified_on = getDateFormat(
                        new Date(output[insightIdx].last_modified_on)
                    );
                    output[insightIdx].created_on = getDateFormat(
                        new Date(output[insightIdx].last_modified_on)
                    );

                    scope.pipelineExistingInsight.search.results.push(
                        output[insightIdx]
                    );
                }

                scope.pipelineExistingInsight.search.canCollect =
                    output.len === scope.pipelineExistingInsight.search.limit;
                getTags();
            };

            scope.widgetCtrl.query(
                [
                    {
                        meta: true,
                        type: 'getInsights',
                        components: [
                            scope.pipelineExistingInsight.app.value,
                            scope.pipelineExistingInsight.search.limit,
                            scope.pipelineExistingInsight.search.offset,
                            scope.pipelineExistingInsight.search.input,
                            scope.pipelineExistingInsight.search.tag
                                ? [scope.pipelineExistingInsight.search.tag]
                                : [],
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getTags
         * @desc gets the list of available tags
         */
        function getTags(): void {
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.pipelineExistingInsight.tag.options = [
                    {
                        tag: '',
                    },
                ];

                scope.pipelineExistingInsight.tag.options = Utility.sort(
                    output,
                    'tag'
                );

                if (
                    scope.pipelineExistingInsight.tag.selected &&
                    scope.pipelineExistingInsight.tag.options.indexOf(
                        scope.pipelineExistingInsight.tag.selected
                    ) === -1
                ) {
                    filterInsights('');
                }
            };

            if (scope.pipelineExistingInsight.app.value) {
                scope.widgetCtrl.query(
                    [
                        {
                            meta: true,
                            type: 'getAvailableTags',
                            components: [
                                scope.pipelineExistingInsight.app.value,
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name getMoreInsights
         * @desc gets the insights for the current selected app
         */
        function getMoreInsights(): void {
            if (!scope.pipelineExistingInsight.search.canCollect) {
                return;
            }

            if (scrollTimeout) {
                $timeout.cancel(scrollTimeout);
            }

            // debounce
            scrollTimeout = $timeout(function () {
                // check if it is at the bottom and going downwards
                if (
                    contentEle.scrollTop + contentEle.clientHeight >=
                        contentEle.scrollHeight * 0.75 &&
                    !scope.pipelineExistingInsight.search.loading
                ) {
                    // increment the offset to get more
                    scope.pipelineExistingInsight.search.offset +=
                        scope.pipelineExistingInsight.search.limit;
                    getInsights(false);
                }
            }, 300);
        }

        /**
         * @name searchInsights
         * @desc searchs the app insights
         */
        function searchInsights(): void {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }

            // debounce
            searchTimeout = $timeout(function () {
                scope.pipelineExistingInsight.search.offset = 0;
                getInsights(true);
                $timeout.cancel(searchTimeout);
            }, 300);
        }

        /**
         * @name filterInsights
         * @desc filter insight by a tag
         * @param tag - tag to filter on
         */
        function filterInsights(tag: string): void {
            if (tag !== scope.pipelineExistingInsight.search.tag) {
                scope.pipelineExistingInsight.search.tag = tag;
                scope.pipelineExistingInsight.tag.selected = tag;
                searchInsights();
            }
        }

        /**
         * @name clearInsights
         * @desc clears out the current filters and gets the app
         */
        function clearInsights(): void {
            scope.pipelineExistingInsight.search.input = '';
            scope.pipelineExistingInsight.search.tag = '';
            scope.pipelineExistingInsight.tag.selected = '';
            getInsights(true);
        }

        /**
         * @name getImage
         * @desc gets the image for the app
         * @param rdbmsId - rdbmsId of the image
         */
        function getImage(rdbmsId: string): string {
            const imageUpdates = semossCoreService.getOptions('imageUpdates'),
                insightImageKey =
                    scope.pipelineExistingInsight.app.value + rdbmsId;

            if (imageUpdates[insightImageKey]) {
                return imageUpdates[insightImageKey];
            }

            return semossCoreService.app.generateInsightImageURL(
                scope.pipelineExistingInsight.app.value,
                rdbmsId
            );
        }

        /**
         * @name getDateFormat
         * @desc format a date into the wanted format
         * @param date - date the date to format
         * @returns formatted date
         */
        function getDateFormat(date: Date): string {
            return (
                date.toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }) +
                ' ' +
                date.toLocaleTimeString()
            );
        }

        function preview(insight: {
            app_id: string;
            app_insight_id: string;
        }): void {
            scope.pipelineComponentCtrl.previewComponent(
                buildParameters(insight)
            );
        }

        /**
         * @name createViz
         * @param insight - type of widget to open
         * @param visualize - if true, load insight directly
         * @desc function that adds in a new upload panel
         */
        function createViz(
            insight: { app_id: string; app_insight_id: string },
            visualize: boolean
        ): void {
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `LoadInsight(project=["${insight.app_id}"], id=["${insight.app_insight_id}"])`,
                        ],
                        terminal: true,
                    },
                ],
                () => {
                    scope.widgetCtrl.open('widget-tab', 'view');
                }
            );
        }

        /**
         * @name buildParameters
         * @param insight insight to open data
         * @return parameters for the component
         */
        function buildParameters(insight: {
            app_id: string;
            app_insight_id: string;
        }): { SELECTED_APP: string; SELECTED_INSIGHT: string } {
            return {
                SELECTED_APP: insight.app_id,
                SELECTED_INSIGHT: insight.app_insight_id,
            };
        }

        /**
         * @name getNLPSuggestedInsights
         * @desc execute query using NaturalLanguageSearch to autocreate a visualization
         */
        function getNLPSuggestedInsights(): void {
            scope.pipelineExistingInsight.search.loading = true;

            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output[0],
                    type = response.pixelReturn[0].operationType[0];

                scope.pipelineExistingInsight.search.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output.hasOwnProperty('pixel')) {
                    createNLPSuggestedInsight(output);
                }
            };

            scope.widget.query(
                [
                    {
                        meta: true,
                        type: 'naturalLanguageSearch',
                        components: [
                            [scope.pipelineExistingInsight.app.value],
                            scope.pipelineExistingInsight.search.input,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name createNLPSuggestedInsight
         * @param insight - selected recommended insight to create
         * @desc begins the process to create a recommended insight
         */
        function createNLPSuggestedInsight(insight: { pixel: string }): void {
            scope.widgetCtrl.execute(insight.pixel);
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            let resetInsightsListener;

            const contentEle = ele[0].querySelector('#smss-scroll-scroller');
            contentEle.addEventListener('scroll', getMoreInsights);

            // get the app
            const selectedApp = semossCoreService.app.get('selectedApp');
            if (selectedApp && selectedApp !== 'NEWSEMOSSAPP') {
                scope.pipelineExistingInsight.app = selectedApp;
            }

            // add listeners
            resetInsightsListener = semossCoreService.on(
                'reset-insights-list',
                function () {
                    clearInsights();
                }
            );

            scope.$on('$destroy', function () {
                resetInsightsListener();
                contentEle.removeEventListener('scroll', getMoreInsights);
            });
        }

        initialize();
    }
}
