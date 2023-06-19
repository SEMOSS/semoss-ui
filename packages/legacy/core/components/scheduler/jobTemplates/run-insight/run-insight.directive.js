'use strict';

/**
 * @name runInsight
 * @desc template for what user needs to run this job
 */
export default angular
    .module('app.scheduler.run-insight', [])
    .directive('runInsight', runInsight);

runInsight.$inject = ['semossCoreService'];

function runInsight(semossCoreService) {
    runInsightLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {
            job: '=',
        },
        link: runInsightLink,
        template: require('./run-insight.directive.html'),
    };

    function runInsightLink(scope) {
        scope.allApps = [];
        scope.job.jobTypeTemplate.paramJson = []; // json value to be sent to widget-compiler directive for parameterized insights
        scope.insights = {
            canCollect: false,
            input: '',
            offset: 0,
            limit: 50,
            results: [],
            selected: [],
        };

        scope.getInsights = getInsights;
        scope.searchInsights = searchInsights;
        scope.getMoreInsights = getMoreInsights;
        scope.selectInsight = selectInsight;
        scope.fillExistingParameters = fillExistingParameters; // function to fill existing insight parameters during edit job

        /** App */
        /**
         * @name getApp
         * @desc get the apps
         * @returns {void}
         */
        function getApp() {
            var message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;

                scope.allApps = [];

                for (let i = 0, len = output.length; i < len; i++) {
                    scope.allApps.push({
                        display: String(output[i].project_name).replace(
                            /_/g,
                            ' '
                        ),
                        value: output[i].project_id,
                        image: semossCoreService.app.generateProjectImageURL(
                            output[i].project_id
                        ),
                    });
                }

                if (scope.job.jobTypeTemplate.app) {
                    getInsights(false);
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getProjectList',
                        components: [],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Insight */
        /**
         * @name getInsights
         * @desc gets the insights for the current selected app
         * @param {boolean} clear - reset the search
         * @returns {void}
         */
        function getInsights(clear) {
            if (!scope.job.jobTypeTemplate.app) {
                return;
            }

            const message = semossCoreService.utility.random('query-pixel');

            scope.loading = true;

            if (clear) {
                scope.insights.canCollect = true;
                scope.insights.offset = 0;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                let foundInsightIdx = -1;

                if (clear) {
                    scope.insights.selected = [];
                    scope.insights.results = [];
                    scope.job.jobTypeTemplate.insight = {};
                    scope.job.jobTypeTemplate.insightParameters = {};
                    scope.job.jobTypeTemplate.paramJson = [];
                    scope.job.jobTypeTemplate.templatePixelQuery = '';
                }

                scope.insights.results = scope.insights.results.concat(output);

                if (
                    scope.job.jobTypeTemplate.insight &&
                    scope.job.jobTypeTemplate.insight.app_insight_id
                ) {
                    // lets loop through the final results list and see if the selected insight is in there
                    // if found, register where in the index it is
                    for (
                        let insightIdx = 0;
                        insightIdx < scope.insights.results.length;
                        insightIdx++
                    ) {
                        if (
                            scope.insights.results[insightIdx]
                                .app_insight_id ===
                            scope.job.jobTypeTemplate.insight.app_insight_id
                        ) {
                            // if we find ANOTHER one, it means it must have came back from the output
                            // so we need to remove the one we manually added (the first one we found)
                            if (foundInsightIdx > -1) {
                                scope.insights.results.splice(
                                    foundInsightIdx,
                                    1
                                );
                                // we don't need to process anymore because there will only be at max 2 instances of the same insight
                                break;
                            }

                            // register where we found it
                            foundInsightIdx = insightIdx;
                        }
                    }

                    // we didn't find the selected insight in the output because limit = 50 when querying...so we will add to the end of the list
                    if (foundInsightIdx === -1) {
                        let name =
                            scope.job.jobTypeTemplate.insight.insightName ||
                            scope.job.jobTypeTemplate.insight.name;
                        scope.insights.results.push({
                            app_insight_id:
                                scope.job.jobTypeTemplate.insight
                                    .app_insight_id,
                            name: name,
                        });
                    }
                }

                scope.insights.canCollect =
                    output.length === scope.insights.limit;
                scope.loading = false;

                if (
                    scope.job.jobTypeTemplate.insight &&
                    scope.job.jobTypeTemplate.insight.app_insight_id
                ) {
                    selectInsight(false);
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getInsights',
                        components: [
                            scope.job.jobTypeTemplate.app,
                            scope.insights.limit,
                            scope.insights.offset,
                            scope.insights.input,
                            [],
                        ],
                        terminal: true,
                    },
                ],
                listeners: [], // taken care of in the directive
                response: message,
            });
        }

        /**
         * @name searchInsights
         * @desc searchs the insights for the current selected app
         * @param {string} search - search string
         * @returns {void}
         */
        function searchInsights(search) {
            scope.insights.input = search;
            getInsights(true);
        }

        /**
         * @name getMoreInsights
         * @desc gets the insights for the current selected app
         * @returns {void}
         */
        function getMoreInsights() {
            if (!scope.insights.canCollect) {
                return;
            }

            // increment the offset to get more
            scope.insights.offset += scope.insights.limit;
            getInsights(false);
        }

        /**
         * @name fillExistingParameters
         * @param {string} json - json value
         * @desc to fill the insight parameters during edit job when parameterized insight is selected
         * @returns {void}
         */
        function fillExistingParameters(json) {
            if (
                Object.keys(scope.job.jobTypeTemplate.insightParameters)
                    .length > 0
            ) {
                var queryIdx, queryLen, paramIdx, paramLen;
                for (
                    queryIdx = 0, queryLen = json.length;
                    queryIdx < queryLen;
                    queryIdx++
                ) {
                    for (
                        paramIdx = 0, paramLen = json[queryIdx].params.length;
                        paramIdx < paramLen;
                        paramIdx++
                    ) {
                        if (
                            scope.job.jobTypeTemplate.insightParameters.hasOwnProperty(
                                json[queryIdx].params[paramIdx].paramName
                            )
                        ) {
                            // updating the default value with previously selected values during edit
                            json[queryIdx].params[paramIdx].model.defaultValue =
                                scope.job.jobTypeTemplate.insightParameters[
                                    json[queryIdx].params[paramIdx].paramName
                                ];
                        }
                    }
                }
            }
        }

        /**
         * @name selectInsight
         * @desc update the template pixel query when an insight is selected
         * @param {boolean} clearParams - resets the search
         * @returns {void}
         */
        function selectInsight(clearParams) {
            let insight;
            const message = semossCoreService.utility.random('query-pixel');
            if (!scope.job.jobTypeTemplate.app) {
                return;
            }
            if (
                !scope.job.jobTypeTemplate.insight ||
                !scope.job.jobTypeTemplate.insight.app_insight_id
            ) {
                return;
            }

            insight = scope.insights.results.find(
                (p) =>
                    p.app_insight_id ===
                    scope.job.jobTypeTemplate.insight.app_insight_id
            );
            scope.job.jobTypeTemplate.insight.name = insight.name;

            scope.job.jobTypeTemplate.paramJson = [];

            // DO NOT CHANGE THIS.. Talk to Neel if you want to
            scope.job.jobTypeTemplate.templatePixelQuery = `OpenInsight(app=['${scope.job.jobTypeTemplate.app}'], id=['${scope.job.jobTypeTemplate.insight.app_insight_id}']);`;

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output;
                // clears the insight parameter values
                if (clearParams) {
                    scope.job.jobTypeTemplate.insightParameters = {};
                }
                if (output.hasParameter) {
                    setParameterizedInsight(output.viewOptionsMap);
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'isInsightParameterized',
                        components: [
                            scope.job.jobTypeTemplate.app,
                            scope.job.jobTypeTemplate.insight.app_insight_id,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name setParameterizedInsight
         * @param {object} viewOptionsMap the map including the json information
         * @desc to open insight to show parameters for parameterized insights
         * @returns {void}
         */
        function setParameterizedInsight(viewOptionsMap) {
            if (viewOptionsMap.json && viewOptionsMap.json.length > 0) {
                viewOptionsMap.json[0].execute = '';
                scope.job.jobTypeTemplate.paramJson = viewOptionsMap.json;
                fillExistingParameters(scope.job.jobTypeTemplate.paramJson);
            }
        }

        /**
         * @name initialize
         * @desc initialize the directive
         * @returns {void}
         */
        function initialize() {
            // add in props on jobTypeTemplate
            if (Object.keys(scope.job.jobTypeTemplate).length === 0) {
                scope.job.jobTypeTemplate.app = '';
                scope.job.jobTypeTemplate.insightParameters = {};
            }

            // get the list of apps
            getApp();
        }

        initialize();
    }
}
