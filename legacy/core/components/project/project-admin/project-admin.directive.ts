'use strict';
import angular from 'angular';

export default angular
    .module('app.project.project-admin', [])
    .directive('projectAdmin', projectAdminDirective);

import './project-admin.scss';

projectAdminDirective.$inject = ['$location', 'semossCoreService', 'CONFIG'];

function projectAdminDirective($location, semossCoreService, CONFIG) {
    projectAdminCtrl.$inject = [];
    projectAdminLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./project-admin.directive.html'),
        bindToController: {
            project: '=',
        },
        controller: projectAdminCtrl,
        controllerAs: 'projectAdmin',
        link: projectAdminLink,
    };

    function projectAdminCtrl() {}

    function projectAdminLink(scope, ele) {
        let scrollEle,
            previousScroll = 0,
            currentScroll;
        scope.projectAdmin.loading = false;
        scope.projectAdmin.insights = {
            canCollect: false,
            input: '',
            offset: 0,
            limit: 50,
            results: [],
            selected: [],
        };

        scope.projectAdmin.selectionState = {
            isAll: false,
            isPartial: false,
        };

        scope.projectAdmin.edit = {
            open: false,
            insight: undefined,
        };

        scope.projectAdmin.delete = {
            open: false,
            tempInsight: '',
        };

        scope.projectAdmin.optimized = false;

        scope.projectAdmin.CONFIG = CONFIG;

        scope.projectAdmin.getInsights = getInsights;
        scope.projectAdmin.getMoreInsights = getMoreInsights;
        scope.projectAdmin.multiSaveImg = multiSaveImg;
        scope.projectAdmin.spliceInsight = spliceInsight;
        scope.projectAdmin.deleteInsights = deleteInsights;
        scope.projectAdmin.openDelete = openDelete;
        scope.projectAdmin.closeDelete = closeDelete;
        scope.projectAdmin.openEdit = openEdit;
        scope.projectAdmin.optimize = optimize;
        scope.projectAdmin.deleteCache = deleteCache;
        scope.projectAdmin.selectInsight = selectInsight;
        scope.projectAdmin.setSelectionState = setSelectionState;
        scope.projectAdmin.selectAll = selectAll;
        scope.projectAdmin.isSelected = isSelected;

        // Default Insights
        scope.projectAdmin.getDatabaseListForDefaultInsights =
            getDatabaseListForDefaultInsights;
        scope.projectAdmin.listOfDatabasesForDefaultInsights = [];
        scope.projectAdmin.selectedDatabaseForDefaultInsights = '';
        scope.projectAdmin.addDefaultInsights = addDefaultInsights;
        scope.projectAdmin.defaultInsightOptions = [
            {
                display: 'Explore an Instance',
                value: 'explore',
            },
            {
                display: 'Grid Delta',
                value: 'grid-delta',
            },
            {
                display:
                    'What are the modifications made to specific column(s)?',
                value: 'audit-modification',
            },
            {
                display:
                    'What are the modifications made to the specific column(s) over time?',
                value: 'audit-timeline',
            },
            {
                display: 'View insight usage stats',
                value: 'insight-stats',
            },
            {
                display: 'Add default insert data form',
                value: 'insert-form',
            },
        ];
        scope.projectAdmin.selectedDefaultInsights = [];
        scope.projectAdmin.defaultOverlay = false;

        /** Insight */
        /**
         * @name getInsights
         * @desc gets the insights for the current selected app
         * @param clear - reset the search
         */
        function getInsights(clear: boolean): void {
            const message = semossCoreService.utility.random('query-pixel');

            scope.projectAdmin.loading = true;

            if (clear) {
                scope.projectAdmin.insights.canCollect = true;
                scope.projectAdmin.insights.offset = 0;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;

                if (clear) {
                    scope.projectAdmin.insights.selected = [];
                    scope.projectAdmin.insights.results = [];
                    scope.projectAdmin.selectionState = {
                        isAll: false,
                        isPartial: false,
                    };
                } else {
                    if (scope.projectAdmin.selectionState.isAll) {
                        scope.projectAdmin.selectionState = {
                            isAll: false,
                            isPartial: true,
                        };
                    }
                }

                for (let i = 0, len = output.length; i < len; i++) {
                    output[i].displayDate = getDateFormat(
                        new Date(output[i].last_modified_on)
                    );
                }

                scope.projectAdmin.insights.results =
                    scope.projectAdmin.insights.results.concat(output);
                scope.projectAdmin.insights.canCollect =
                    output.length === scope.projectAdmin.insights.limit;
                scope.projectAdmin.loading = false;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getInsights',
                        components: [
                            scope.projectAdmin.project,
                            scope.projectAdmin.insights.limit,
                            scope.projectAdmin.insights.offset,
                            scope.projectAdmin.insights.input,
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
         * @name getDatabaseListForDefaultInsights
         * @desc Get the list of databases for the user to select from when adding default insights
         */
        function getDatabaseListForDefaultInsights(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                if (
                    response.pixelReturn[0].operationType.indexOf('ERROR') ===
                    -1
                ) {
                    scope.projectAdmin.listOfDatabasesForDefaultInsights =
                        response.pixelReturn[0].output;
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name addDefaultInsights
         * @desc Adds deleted default insights to the app
         */
        function addDefaultInsights(): void {
            const message = semossCoreService.utility.random('query-pixel'),
                selectedOptions = scope.projectAdmin.selectedDefaultInsights,
                insightOptions = JSON.stringify(selectedOptions),
                projectId = JSON.stringify(scope.projectAdmin.project),
                databaseId = JSON.stringify(
                    scope.projectAdmin.selectedDatabaseForDefaultInsights
                );

            semossCoreService.once(message, function (response) {
                if (
                    response.pixelReturn[0].operationType.indexOf('ERROR') ===
                    -1
                ) {
                    // Refresh insights and close overlay
                    getInsights(true);
                    scope.projectAdmin.defaultOverlay = false;
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            'AddDefaultInsights(project = [' +
                                projectId +
                                '], database = [' +
                                databaseId +
                                '], insights = ' +
                                insightOptions +
                                ');',
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name getDateFormat
         * @desc format a date into the wanted format
         * @param {date} date - date the date to format
         * @returns formatted date
         */
        function getDateFormat(date): string {
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

        /**
         * @name getMoreInsights
         * @desc gets the insights for the current selected app
         */
        function getMoreInsights(): void {
            if (!scope.projectAdmin.insights.canCollect) {
                return;
            }

            currentScroll = scrollEle.scrollTop + scrollEle.offsetHeight;

            if (
                currentScroll > scrollEle.scrollHeight * 0.75 &&
                currentScroll > previousScroll &&
                !scope.projectAdmin.loading
            ) {
                previousScroll = currentScroll;

                // increment the offset to get more
                scope.projectAdmin.insights.offset +=
                    scope.projectAdmin.insights.limit;
                getInsights(false);
            }
        }

        /**
         * @name multiSaveImg
         * @desc Takes in the list of insights the user has checked in the insights panel and
         *       updates the images for those insights on feed. If the insight already has an image
         *       it will be replaced with the same image. This also updates the images of dashboards. Note,
         *       sometimes the images don't come back right away (assuming this is back-end sync related).
         */
        function multiSaveImg(): void {
            let i,
                len,
                loc,
                pixelArray: any[] = [],
                message = semossCoreService.utility.random('execute-pixel');

            loc = $location.absUrl().split('#!')[0];

            // Go through the list of insights
            for (
                i = 0, len = scope.projectAdmin.insights.selected.length;
                i < len;
                i++
            ) {
                pixelArray.push({
                    type: 'updateInsightImage',
                    components: [
                        scope.projectAdmin.insights.selected[i].app_id,
                        scope.projectAdmin.insights.selected[i].app_insight_id,
                        loc,
                    ],
                });
            }

            // Add in terminal statement to final pixel Object and execute
            pixelArray[pixelArray.length - 1].terminal = true;
            semossCoreService.once(message, function (response) {
                if (
                    response.pixelReturn[0].operationType.indexOf('ERROR') ===
                    -1
                ) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Insight image(s) has been created.',
                    });

                    // refresh the insight images
                    semossCoreService.emit('reset-insights-list');
                }
            });
            semossCoreService.emit('query-pixel', {
                commandList: pixelArray,
                response: message,
            });

            // Uncheck checked insights and hide buttons
            scope.projectAdmin.insights.selected = [];
            setSelectionState();
        }

        /**
         * @name spliceInsight
         * @desc remove new value
         * @param idx - value's idx to remove
         */
        function spliceInsight(idx: number): void {
            scope.projectAdmin.insights.selected.splice(idx, 1);
            setSelectionState();
        }

        /**
         * @name deleteInsights
         * @desc delete the selected insights
         */
        function deleteInsights(): void {
            const insights: any[] = [];

            if (scope.projectAdmin.delete.tempInsight) {
                insights.push(
                    scope.projectAdmin.delete.tempInsight.app_insight_id
                );
            } else {
                for (
                    let insightIdx = 0,
                        insightLen =
                            scope.projectAdmin.insights.selected.length;
                    insightIdx < insightLen;
                    insightIdx++
                ) {
                    insights.push(
                        scope.projectAdmin.insights.selected[insightIdx]
                            .app_insight_id
                    );
                }
            }

            closeDelete();

            if (insights.length > 0) {
                scope.projectAdmin.loading = true;

                semossCoreService.once(
                    'delete-app-insights-end',
                    function (data) {
                        if (!data.success) {
                            // error occured
                            // remove the loading screen
                            scope.projectAdmin.loading = false;
                        } else {
                            // deletion occured successfully
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Insights successfully deleted.',
                            });

                            scope.projectAdmin.loading = false;

                            getInsights(true);
                        }
                    }
                );

                semossCoreService.emit('delete-app-insights', {
                    appId: scope.projectAdmin.project,
                    insights: insights,
                });
            }
        }

        /**
         * @name deleteCache
         * @param insight - the insight info
         * @desc delete the cache so that it can recache once the insight runs again
         */
        function deleteCache(insight: any): void {
            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteInsightCache',
                        components: [insight.app_id, insight.app_insight_id],
                        terminal: true,
                    },
                ],
                response: message,
            });

            semossCoreService.once(message, function (response) {
                try {
                    if (response.pixelReturn[0].operationType[0] !== 'ERROR') {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully deleted insight cache',
                        });
                    }
                } catch (err) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'An error occurred.',
                    });
                }
            });
        }

        /** Generic */
        /**
         * @name openDelete
         * @desc open the overlay
         */
        function openDelete(insight?: string): void {
            scope.projectAdmin.delete.open = true;
            if (insight) {
                scope.projectAdmin.delete.tempInsight = insight;
            }
        }

        /**
         * @name closeDelete
         * @desc close the overlay
         */
        function closeDelete(): void {
            scope.projectAdmin.delete.open = false;
            scope.projectAdmin.delete.tempInsight = '';
        }

        /**
         * @name openEdit
         * @desc open the overlay
         * @param {object} insight - insight to select
         */
        function openEdit(insight: any): void {
            scope.projectAdmin.edit.open = true;
            scope.projectAdmin.edit.insight = insight;
        }

        /**
         * @name optimize
         * @description runs optimize routine
         */
        function optimize(): void {
            const message = semossCoreService.utility.random('meta');

            semossCoreService.emit('meta-pixel', {
                commandList: [
                    {
                        type: 'extractDatabaseMeta',
                        components: [scope.projectAdmin.project, true],
                        terminal: true,
                    },
                ],
                meta: true,
                response: message,
            });

            semossCoreService.once(message, function (response) {
                if (response.pixelReturn[0].operationType[0] === 'ERROR') {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Project could not be optimized',
                    });
                }
            });
        }

        /** Selection functions for checkboxes */

        /**
         * @name setSelectionState
         * @desc checks if the insights are partially selected
         */
        function setSelectionState(): void {
            const selected: number =
                    scope.projectAdmin.insights.selected.length,
                results: number = scope.projectAdmin.insights.results.length;
            if (selected > 0 && selected !== results) {
                scope.projectAdmin.selectionState.isPartial = true;
            } else {
                scope.projectAdmin.selectionState.isPartial = false;
            }
        }

        /**
         * @name selectInsight
         * @desc called when an insight's checkbox is clicked
         * @param insight insight that is being selected/deselected
         */
        function selectInsight(insight: any): void {
            if (!isSelected(insight)) {
                scope.projectAdmin.insights.selected.push(insight);
            } else {
                const newSelected: any[] = [];
                for (
                    let i = 0;
                    i < scope.projectAdmin.insights.selected.length;
                    i++
                ) {
                    if (
                        scope.projectAdmin.insights.selected[i]
                            .app_insight_id !== insight.app_insight_id
                    ) {
                        newSelected.push(
                            scope.projectAdmin.insights.selected[i]
                        );
                    }
                }
                scope.projectAdmin.insights.selected = newSelected;
            }
            setSelectionState();
        }

        /**
         * @name isSelected
         * @desc checks if an insight is selected
         * @param insight the insight to check
         * @returns true if selected
         */
        function isSelected(insight): boolean {
            // None selected
            if (scope.projectAdmin.insights.selected.length === 0) {
                return false;
            }
            // All selected
            if (
                scope.projectAdmin.insights.selected.length ===
                scope.projectAdmin.insights.results.length
            ) {
                return true;
            }

            for (
                let i = 0;
                i < scope.projectAdmin.insights.selected.length;
                i++
            ) {
                if (
                    scope.projectAdmin.insights.selected[i].app_insight_id ===
                    insight.app_insight_id
                ) {
                    return true;
                }
            }
            return false;
        }

        /**
         * @name selectAll
         * @desc called when the selectall checkbox is clicked. if in a partial state, then it will always select all
         * @param model - current state
         */
        function selectAll(model) {
            // If the partial checkbox is selected, need to sync the state of the selectall checkbox
            if (model !== scope.projectAdmin.selectionState.isAll) {
                scope.projectAdmin.selectionState.isAll = model;
            }
            if (model) {
                scope.projectAdmin.insights.selected =
                    scope.projectAdmin.insights.results;
            } else {
                scope.projectAdmin.insights.selected = [];
            }
            setSelectionState();
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            scrollEle = ele[0].querySelector('#project-admin__scroll');

            if (scrollEle) {
                scrollEle.addEventListener('scroll', getMoreInsights);
            }
            getInsights(true);

            scope.$on('$destroy', function () {
                scrollEle.removeEventListener('scroll', getMoreInsights);
            });
        }

        initialize();
    }
}
