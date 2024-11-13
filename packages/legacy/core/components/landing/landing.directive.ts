'use strict';

import angular from 'angular';
import './landing.scss';
import './landing-card/landing-card.directive';
import './landing-nav/landing-nav.directive';
import { CUSTOMIZATION } from '@/custom/theme';

export default angular
    .module('app.landing.directive', [
        'app.landing.landing-card',
        'app.landing.landing-nav',
    ])
    .directive('landing', landingDirective);

landingDirective.$inject = [
    '$state',
    'monolithService',
    '$transitions',
    '$timeout',
    'semossCoreService',
    'CONFIG',
];

function landingDirective(
    $state,
    monolithService,
    $transitions,
    $timeout,
    semossCoreService,
    CONFIG
) {
    landingCtrl.$inject = [];
    landingLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./landing.directive.html'),
        controller: landingCtrl,
        link: landingLink,
        scope: {},
        bindToController: {},
        controllerAs: 'landing',
    };

    function landingCtrl() {}

    function landingLink(scope, ele) {
        let insightSearchTimeout,
            insightScrollEle,
            insightScrollTimeout,
            projectSearchTimeout;

        scope.landing.view = {
            options: {
                ALL: {
                    display: 'All Insights',
                    filteredDisplay: 'Insights',
                    menuDisplay: false,
                    value: 'ALL',
                    icon: 'home',
                },
                STARRED: {
                    display: 'Starred',
                    menuDisplay: 'Starred',
                    value: 'STARRED',
                    icon: 'star',
                },
                RECENT: {
                    display: 'Last Modified',
                    menuDisplay: 'Recent',
                    value: 'RECENT',
                    icon: 'clock-o',
                },
                PROJECT: {
                    display: 'App',
                    menuDisplay: false,
                    value: 'PROJECT',
                    icon: 'folder-o',
                },
                'PROJECT-MANAGE': {
                    display: 'Management Panel',
                    menuDisplay: false,
                    value: 'PROJECT-MANAGE',
                    icon: 'cog',
                },
            },
            selected: 'ALL',
        };

        scope.landing.insights = {
            search: {
                loading: true,
                searchTerm: '',
            },
            sort: 'name',
            edit: {
                open: false,
                insight: '',
            },
            share: {
                open: false,
                insight: '',
            },
            delete: {
                open: false,
                insight: '',
            },
            limit: 20,
            offset: 0,
            results: [],
            canCollect: false,
        };

        scope.landing.projects = {
            isOpen: true,
            delete: {
                open: false,
                app: '',
            },
            create: {
                open: false,
            },
            upload: {
                open: false,
            },
            searchTerm: '',
            raw: [],
            filtered: [],
            selected: null,
        };

        scope.landing.tags = {
            selected: [],
            colors: {
                options: [
                    'blue',
                    'orange',
                    'teal',
                    'purple',
                    'yellow',
                    'pink',
                    'violet',
                    'olive',
                ],
                mapping: {},
            },
        };

        scope.landing.quickAccess = {
            STARRED: {
                title: 'Starred',
                value: 'STARRED',
                limit: 4,
                sort: 'date',
                results: [],
            },
            RECENT: {
                title: 'Last Modified',
                value: 'RECENT',
                limit: 4,
                sort: 'date',
                results: [],
            },
        };

        /** General Functions */
        scope.landing.changeView = changeView;
        scope.landing.changeMode = changeMode;

        /** App Functions */
        scope.landing.navigateToApp = navigateToApp;
        scope.landing.openAppDelete = openAppDelete;
        scope.landing.closeAppDelete = closeAppDelete;
        scope.landing.openCreateProject = openCreateProject;
        scope.landing.closeCreateProject = closeCreateProject;
        scope.landing.openUploadProject = openUploadProject;
        scope.landing.closeUploadProject = closeUploadProject;
        scope.landing.newInsight = newInsight;
        scope.landing.onAppDelete = onAppDelete;
        scope.landing.setProjectInfo = setProjectInfo;

        /** Project Functions */
        scope.landing.searchProjects = searchProjects;
        scope.landing.getProjects = getProjects;

        /** Insight Functions */
        scope.landing.searchInsights = searchInsights;
        scope.landing.openInsightEdit = openInsightEdit;
        scope.landing.openInsightShare = openInsightShare;
        scope.landing.openInsightDelete = openInsightDelete;
        scope.landing.closeInsightDelete = closeInsightDelete;
        scope.landing.onInsightDelete = onInsightDelete;
        scope.landing.updateFavorite = updateFavorite;

        /** Tag Functions */
        scope.landing.filterByTag = filterByTag;
        scope.landing.clearAllTags = clearAllTags;
        scope.landing.setTagColor = setTagColor;
        scope.landing.adminUser = false;
        scope.landing.adminOnlyProjectSetPublic =
            CONFIG['adminOnlyProjectSetPublic'];
        scope.landing.adminOnlyProjectAdd = CONFIG['adminOnlyProjectAdd'];
        scope.landing.adminOnlyInsightSetPublic =
            CONFIG['adminOnlyInsightSetPublic'];

        /** General */

        /**
         * @name changeView
         * @desc filters the insights when the user clicks on a different view from the left nav menu
         * @param view - the type of insights to display (ALL, STARRED, RECENT)
         * @param $event - the click event
         */
        function changeView(view: string, $event: any): void {
            if ($event && $event.currentTarget) {
                $event.currentTarget.blur();
            }

            if (
                view !== 'PROJECT' &&
                view !== 'PROJECT-MANAGE' &&
                scope.landing.view.selected !== view
            ) {
                scope.landing.view.selected = view;
                scope.landing.projects.selected = null;
                if (scope.landing.view.selected === 'ALL') {
                    scope.landing.insights.sort = 'name';
                } else {
                    scope.landing.insights.sort = 'date';
                }
                if ($state.current.name !== 'home.landing' && view === 'ALL') {
                    $state.go('home.landing');
                } else if (
                    $state.current.name !== 'home.landing.starred' &&
                    view === 'STARRED'
                ) {
                    $state.go('home.landing.starred');
                } else if (
                    $state.current.name !== 'home.landing.recent' &&
                    view === 'RECENT'
                ) {
                    $state.go('home.landing.recent');
                }
                getInsights(true);
            }

            if (view === 'PROJECT') {
                scope.landing.view.selected = view;
                scope.landing.insights.sort = 'date';
                getInsights(true);
            }

            if (view === 'PROJECT-MANAGE') {
                scope.landing.view.selected = view;
            }
        }

        /**
         * @name updateNavigation
         * @desc update the project id and name when the route changes
         */
        function updateNavigation(): void {
            if ($state.current.name === 'home.landing.project.manage') {
                setProjectInfo({
                    projectId: $state.params.projectId,
                    projectName: $state.params.projectName,
                });
            } else if ($state.current.name === 'home.landing.project') {
                setProjectInfo({
                    projectId: $state.params.projectId,
                    projectName: $state.params.projectName,
                });
                changeView('PROJECT', undefined);
            } else if ($state.current.name === 'home.landing.starred') {
                changeView('STARRED', undefined);
            } else if ($state.current.name === 'home.landing.recent') {
                changeView('RECENT', undefined);
            } else {
                changeView('ALL', undefined);
            }
        }

        /**
         * @name changeMode
         * @desc change the layout mode
         * @param mode - the layout mode to change to (CARD, LIST)
         */
        function changeMode(mode: string): void {
            scope.landing.mode = mode;
            window.localStorage.setItem('smss-landing-mode', mode);
        }

        /**
         * @name setWelcomeMessage
         * @desc sets the correct message based on the time of day and if the user is logged in
         */
        function setWelcomeMessage(): void {
            let message = '',
                hour: number = new Date().getHours();

            if (hour >= 0 && hour < 12) {
                message = 'Good morning';
            } else if (hour >= 12 && hour < 18) {
                message = 'Good afternoon';
            } else if (hour >= 18) {
                message = 'Good evening';
            }

            if (CONFIG.hasOwnProperty('security') && CONFIG.security) {
                let user = '';

                const credentials = semossCoreService.getInitCredentials();
                if (credentials.username) {
                    user = credentials.username;
                }

                for (const provider in CONFIG.logins) {
                    if (
                        CONFIG.logins.hasOwnProperty(provider) &&
                        provider !== 'ANONYMOUS'
                    ) {
                        if (CONFIG.logins[provider]) {
                            user = CONFIG.logins[provider];
                            break;
                        }
                    }
                }
                message += `, ${user}`;
            } else {
                message = 'Hey, ' + message;
            }

            scope.landing.view.options.ALL.display = message;
        }

        /** Tags */

        /**
         * @name filterByTag
         * @desc adds/removes the tag to filter insights
         * @param tag - name of tag
         */
        function filterByTag(tag: string): void {
            if (scope.landing.tags.selected.indexOf(tag) === -1) {
                scope.landing.tags.selected.push(tag);
            } else {
                const tags: any = [];
                for (let i = 0; i < scope.landing.tags.selected.length; i++) {
                    if (scope.landing.tags.selected[i] !== tag) {
                        tags.push(scope.landing.tags.selected[i]);
                    }
                }
                scope.landing.tags.selected = tags;
            }
            searchInsights();
        }

        /**
         * @name setTagColor
         * @desc sets the tag color pseudo-randomly
         * @param tag - name of tag
         */
        function setTagColor(tag: string): void {
            if (!scope.landing.tags.colors.mapping.hasOwnProperty(tag)) {
                // check if tag name has already been mapped to a color
                const charCode = tag
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b);
                const color = scope.landing.tags.colors.options[charCode % 8];
                scope.landing.tags.colors.mapping[tag] = color; // add to map
            }
        }

        /**
         * @name clearAllTags
         * @desc clears all tag filters
         */
        function clearAllTags(): void {
            scope.landing.tags.selected = [];
            searchInsights();
        }

        /** Projects */

        /**
         * @name getProjects
         * @desc gets the projects
         */
        function getProjects(): void {
            const message = semossCoreService.utility.random('query-pixel');
            // register message to come back to
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.landing.projects.raw = []; // reset the raw projects
                for (
                    let appIdx = 0, appLen = output.length;
                    appIdx < appLen;
                    appIdx++
                ) {
                    scope.landing.projects.raw.push(output[appIdx]);
                }
                searchProjects();
                if ($state.current.name === 'home.landing.starred') {
                    changeView('STARRED', undefined);
                } else if ($state.current.name === 'home.landing.recent') {
                    changeView('RECENT', undefined);
                } else if ($state.current.name === 'home.landing.project') {
                    const params = {
                        projectId: $state.params.projectId,
                        projectName: $state.params.projectName,
                    };
                    setProjectInfo(params);
                    changeView('PROJECT', undefined);
                } else if (
                    $state.current.name === 'home.landing.project.manage'
                ) {
                    const params = {
                        projectId: $state.params.projectId,
                        projectName: $state.params.projectName,
                    };
                    setProjectInfo(params);
                    changeView('PROJECT-MANAGE', undefined);
                } else {
                    getInsights(true);
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'myProjects',
                        components: [],
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
         * @returns {string} formatted date
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
         * @name searchProjects
         * @desc searches the list of projects
         */
        function searchProjects(): void {
            if (projectSearchTimeout) {
                $timeout.cancel(projectSearchTimeout);
            }
            // debounce
            projectSearchTimeout = $timeout(function () {
                const searchTerm = String(
                    scope.landing.projects.searchTerm || ''
                )
                    .toUpperCase()
                    .replace(/ /g, '_');

                scope.landing.projects.filtered =
                    scope.landing.projects.raw.filter((project) => {
                        if (searchTerm) {
                            const name = String(project.project_name || '')
                                .replace(/ /g, '_')
                                .toUpperCase();
                            if (name.indexOf(searchTerm) === -1) {
                                return false;
                            }
                        }

                        return true;
                    });
                $timeout.cancel(projectSearchTimeout);
            }, 300);
        }

        /** Insights */

        /**
         * @name getInsights
         * @desc called to get insights
         * @param clear - if true, will reset the search
         */
        function getInsights(clear = false): void {
            scope.landing.insights.search.loading = true;
            const message: string =
                    semossCoreService.utility.random('query-pixel'),
                app: string = scope.landing.projects.selected
                    ? scope.landing.projects.selected
                    : null;

            if (clear) {
                scope.landing.insights.offset = 0;
                scope.landing.insights.results = [];
                scope.landing.insights.canCollect = true;
            }

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                scope.landing.insights.search.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                for (let i = 0; i < output.length; i++) {
                    output[i].image = getInsightImage(
                        output[i].app_id,
                        output[i].app_insight_id
                    );
                    const d = new Date(output[i].last_modified_on);
                    output[i].last_modified_on =
                        d.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        }) +
                        ' ' +
                        d.toLocaleTimeString();
                    scope.landing.insights.results.push(output[i]);
                }
                scope.landing.insights.canCollect =
                    output.length === scope.landing.insights.limit;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getInsights',
                        components: [
                            app ? [app] : [],
                            scope.landing.insights.limit,
                            scope.landing.insights.offset,
                            scope.landing.insights.search.searchTerm,
                            scope.landing.tags.selected,
                            scope.landing.view.selected === 'STARRED',
                            scope.landing.insights.sort,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name getMoreInsights
         * @desc gets more insights on scroll
         */
        function getMoreInsights(): void {
            if (!scope.landing.insights.canCollect) {
                return;
            }
            if (insightScrollTimeout) {
                $timeout.cancel(insightScrollTimeout);
            }

            // debounce
            insightScrollTimeout = $timeout(function () {
                // check if it is at the bottom and going downwards
                if (
                    insightScrollEle.scrollTop +
                        insightScrollEle.clientHeight >=
                        insightScrollEle.scrollHeight * 0.75 &&
                    !scope.landing.insights.search.loading
                ) {
                    // increment the offset to get more
                    scope.landing.insights.offset +=
                        scope.landing.insights.limit;
                    getInsights();
                }
            }, 300);
        }

        /**
         * @name getQuickInsights
         * @desc gets insights for quick access sections
         * @param option - options for section
         */
        function getQuickInsights(options: any[]): void {
            const message: string =
                semossCoreService.utility.random('query-pixel');
            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    for (
                        let returnIdx = 0,
                            returnLen = response.pixelReturn.length;
                        returnIdx < returnLen;
                        returnIdx++
                    ) {
                        const r = response.pixelReturn[returnIdx];

                        const output = r.output,
                            type = r.operationType;

                        if (type.indexOf('ERROR') > -1) {
                            continue;
                        }

                        const results: any = [];
                        for (
                            let outputIdx = 0, outputLen = output.length;
                            outputIdx < outputLen;
                            outputIdx++
                        ) {
                            const o = output[outputIdx];

                            o.image = getInsightImage(
                                o.app_id,
                                o.app_insight_id
                            );

                            const d = new Date(o.last_modified_on);
                            o.last_modified_on =
                                d.toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                }) +
                                ' ' +
                                d.toLocaleTimeString();

                            results.push(o);
                        }

                        // set it
                        options[returnIdx].results = results;
                    }
                }
            );

            const commands: any[] = [];
            for (
                let optionIdx = 0, optionLen = options.length;
                optionIdx < optionLen;
                optionIdx++
            ) {
                const o = options[optionIdx];

                commands.push({
                    meta: true,
                    type: 'getInsights',
                    components: [
                        [],
                        o.limit,
                        0,
                        '',
                        [],
                        o.value === 'STARRED',
                        o.sort,
                    ],
                    terminal: true,
                });
            }

            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
            });
        }

        /**
         * @name searchInsights
         * @desc called to filter the insights by searchterm
         */
        function searchInsights(): void {
            if (insightSearchTimeout) {
                $timeout.cancel(insightSearchTimeout);
            }

            // debounce
            insightSearchTimeout = $timeout(function () {
                scope.landing.insights.offset = 0;
                getInsights(true);
                $timeout.cancel(insightSearchTimeout);
            }, 300);
        }

        /**
         * @name openInsightEdit
         * @desc opens the overlay to edit the insight
         * @param insight - the insight to edit
         */
        function openInsightEdit(insight: any): void {
            scope.landing.insights.edit = {
                open: true,
                insight: insight,
            };
        }

        /**
         * @name openInsightShare
         * @desc opens the overlay to share the insight
         * @param insight - the insight to share
         */
        function openInsightShare(insight: any): void {
            scope.landing.insights.share = {
                open: true,
                insight: insight,
            };
        }

        /**
         * @name openInsightDelete
         * @desc opens the overlay to delete the insight
         * @param insight - the insight to delete
         */
        function openInsightDelete(insight: any): void {
            scope.landing.insights.delete = {
                open: true,
                insight: insight,
            };
        }

        /**
         * @name closeInsightDelete
         * @desc called to reset the selected insight to delete when closing the delete overlay
         */
        function closeInsightDelete(): void {
            scope.landing.insights.delete = {
                open: false,
                insight: '',
            };
        }

        /**
         * @name onInsightDelete
         * @desc deletes the insight
         */
        function onInsightDelete(): void {
            const insightId: string =
                scope.landing.insights.delete.insight.app_insight_id;
            if (insightId && insightId.length) {
                semossCoreService.once(
                    'delete-app-insights-end',
                    function (response) {
                        if (response.success) {
                            scope.landing.insights.results =
                                scope.landing.insights.results.filter(
                                    (insight) =>
                                        insight.app_insight_id !== insightId
                                );

                            const options: any[] = [];
                            for (const optId in scope.landing.quickAccess) {
                                if (
                                    scope.landing.quickAccess.hasOwnProperty(
                                        optId
                                    )
                                ) {
                                    options.push(
                                        scope.landing.quickAccess[optId]
                                    );
                                }
                            }
                            getQuickInsights(options);

                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Insight successfully deleted',
                            });
                        }
                    }
                );
                semossCoreService.emit('delete-app-insights', {
                    appId: scope.landing.insights.delete.insight.app_id,
                    insights: [insightId],
                });
            } else {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Error deleting project.',
                });
            }
            // Reset
            scope.landing.insights.delete = {
                open: false,
                insight: '',
            };
        }

        /**
         * @name getInsightImage
         * @desc gets the image for an insight
         * @param appId - app id
         * @param insightId - insight id
         * @returns url for image
         */
        function getInsightImage(appId: string, insightId: string): string {
            const imageUpdates = semossCoreService.getOptions('imageUpdates'),
                insightImageKey = appId + insightId;

            if (imageUpdates[insightImageKey]) {
                return imageUpdates[insightImageKey];
            }

            return semossCoreService.app.generateInsightImageURL(
                appId,
                insightId
            );
        }

        /**
         * @name updateInsightImage
         * @desc updates image urls for insights
         */
        function updateInsightImage(): void {
            for (
                let insightIdx = 0;
                insightIdx < scope.landing.insights.results.length;
                insightIdx++
            ) {
                scope.landing.insights.results[insightIdx].image =
                    getInsightImage(
                        scope.landing.insights.results[insightIdx].app_id,
                        scope.landing.insights.results[insightIdx]
                            .app_insight_id
                    );
            }
            for (const key in scope.landing.quickAccess) {
                if (
                    scope.landing.quickAccess.hasOwnProperty(key) &&
                    scope.landing.quickAccess[key].results.length
                ) {
                    for (
                        let insightIdx = 0;
                        insightIdx <
                        scope.landing.quickAccess[key].results.length;
                        insightIdx++
                    ) {
                        scope.landing.quickAccess[key].results[
                            insightIdx
                        ].image = getInsightImage(
                            scope.landing.quickAccess[key].results[insightIdx]
                                .app_id,
                            scope.landing.quickAccess[key].results[insightIdx]
                                .app_insight_id
                        );
                    }
                }
            }
        }

        /**
         * @name updateFavorite
         * @desc called whenever an insight is favorited/unfavorited and updates the UI to reflect the changes
         * @param insight the insight that was updated
         */
        function updateFavorite(insight: any): void {
            if (scope.landing.view.selected !== 'ALL') {
                if (
                    scope.landing.view.selected === 'STARRED' &&
                    !insight.insight_favorite
                ) {
                    const updated: any = [];
                    // If an insight was unfavorited, remove it from the view
                    for (
                        let i = 0;
                        i < scope.landing.insights.results.length;
                        i++
                    ) {
                        if (
                            insight.app_insight_id !==
                            scope.landing.insights.results[i].app_insight_id
                        ) {
                            updated.push(scope.landing.insights.results[i]);
                        }
                    }
                    scope.landing.insights.results = updated;
                }
                // Update quick access sections
                const options: any[] = [];
                for (const optId in scope.landing.quickAccess) {
                    if (scope.landing.quickAccess.hasOwnProperty(optId)) {
                        options.push(scope.landing.quickAccess[optId]);
                    }
                }
                getQuickInsights(options);
            } else {
                getQuickInsights([scope.landing.quickAccess.STARRED]);
                // Sync with other instances of the same insight
                scope.$broadcast('landing--insight-updated', insight);
            }
        }

        /** Apps */

        /**
         * @name openAppDelete
         * @desc Opens the delete overlay and sets the app to delete
         * @param app - the app to delete
         */
        function openAppDelete(app: any): void {
            // close the popover
            app.openMenu = false;
            // open the delete overlay and set the app to delete
            scope.landing.projects.delete = {
                open: true,
                app: app,
            };
        }

        /**
         * @name closeAppDelete
         * @desc Closes the delete overlay and resets the app to delete
         */
        function closeAppDelete(): void {
            scope.landing.projects.delete = {
                open: false,
                app: '',
            };
        }

        /**
         * @name openCreateProject
         * @desc Opens the delete overlay and sets the app to delete
         */
        function openCreateProject(): void {
            // open the create overlay
            scope.landing.projects.create = {
                open: true,
            };
        }

        /**
         * @name openUploadProject
         * @desc Opens the delete overlay and sets the app to delete
         */
        function openUploadProject(): void {
            // open the create overlay
            scope.landing.projects.upload = {
                open: true,
            };
        }

        /**
         * @name closeCreateProject
         * @param successful whether project was successfully created or not
         * @param project the new project's info
         * @param projName the new project's name
         * @desc open the save
         */
        function closeCreateProject(
            successful: boolean,
            project: any,
            projName: string
        ): void {
            scope.landing.projects.create.open = false;
            if (successful) {
                scope.landing.projects.selected = project.project_id;
                scope.landing.view.options.PROJECT.display = projName;
                getProjects();
                navigateToApp();
            }
        }

        /**
         * @name closeUploadProject
         * @param successful whether project was successfully created or not
         * @param project the new project's info
         * @param projName the new project's name
         * @desc open the save
         */
        function closeUploadProject(
            successful: boolean,
            project: any,
            projName: string
        ): void {
            scope.landing.projects.create.open = false;
            if (successful) {
                scope.landing.projects.selected = project.project_id;
                scope.landing.view.options.PROJECT.display = projName;
                getProjects();
                navigateToApp();
            }
        }

        /**
         * @name newInsight
         * @desc newInsight open a new insight
         */
        function newInsight(): void {
            semossCoreService.emit('open', {
                type: 'new',
                options: {},
            });
        }

        /**
         * @name onAppDelete
         * @desc Deletes the app
         */
        function onAppDelete(): void {
            const appId: string = scope.landing.projects.delete.app.project_id;
            if (appId && appId.length) {
                semossCoreService.once('delete-app-end', (response) => {
                    if (response.success) {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully deleted project.',
                        });

                        if (appId === scope.landing.projects.selected) {
                            $state.go('home.landing');
                            getProjects();
                        }
                    }
                });
                semossCoreService.emit('delete-project', {
                    appId: appId,
                    closeApp: false,
                });
            } else {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Error deleting project.',
                });
            }
            closeAppDelete();
        }

        /**
         * @name navigateToApp
         * @desc navigates to app
         */
        function navigateToApp(): void {
            $state.go('home.landing.project', {
                projectId: scope.landing.projects.selected,
                projectName: scope.landing.view.options.PROJECT.display,
            });
        }

        /**
         * @name setProjectInfo
         * @desc sets the name and id using params from the url
         * @param params params from the url
         */
        function setProjectInfo(params: any): void {
            if (
                !angular.equals(
                    scope.landing.projects.selected,
                    params.projectId
                )
            ) {
                scope.landing.projects.selected = params.projectId;
                if (!params.projectName) {
                    for (
                        let appIdx = 0,
                            appLen = scope.landing.projects.raw.length;
                        appIdx < appLen;
                        appIdx++
                    ) {
                        if (
                            scope.landing.projects.raw[appIdx].project_id ===
                            params.projectId
                        ) {
                            params.projectName =
                                scope.landing.projects.raw[appIdx].project_name;
                            break;
                        }
                    }
                }
                scope.landing.view.options.PROJECT.display = params.projectName;
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            // console.log('here', CONFIG)
            if (
                scope.landing.adminOnlyProjectSetPublic ||
                scope.landing.adminOnlyProjectAdd ||
                scope.landing.adminOnlyInsightSetPublic
            ) {
                monolithService.isAdmin().then(function (adminUser) {
                    scope.landing.adminUser = adminUser;
                });
            }

            const insightListener = semossCoreService.on(
                    'update-insight-image',
                    updateInsightImage
                ),
                navigationListener = $transitions.onSuccess(
                    {},
                    updateNavigation
                ),
                resetInsightsListener = semossCoreService.on(
                    'reset-insights-list',
                    function () {
                        scope.landing.insights.search.searchTerm = '';
                        scope.landing.tags.selected = [];
                        getInsights(true);
                    }
                ),
                deleteProjectListener = semossCoreService.on(
                    'delete-app-end',
                    function (response) {
                        if (response.success) {
                            scope.landing.projects.filtered =
                                scope.landing.projects.filtered.filter(
                                    (app) => app.project_id !== response.appId
                                );
                        }
                    }
                );
            insightScrollEle = ele[0].querySelector(
                '#landing__insights-scroll'
            );
            insightScrollEle.addEventListener('scroll', getMoreInsights);

            if (window.localStorage.getItem('smss-landing-mode')) {
                scope.landing.mode =
                    window.localStorage.getItem('smss-landing-mode');
            } else {
                scope.landing.mode = 'CARD';
                window.localStorage.setItem('smss-landing-mode', 'CARD');
            }

            setWelcomeMessage();
            getProjects();

            const options: any[] = [];
            for (const optId in scope.landing.quickAccess) {
                if (scope.landing.quickAccess.hasOwnProperty(optId)) {
                    options.push(scope.landing.quickAccess[optId]);
                }
            }
            getQuickInsights(options);

            scope.$watch(
                function () {
                    return $state.current.name;
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        if (
                            newValue === 'home.landing' &&
                            (scope.landing.view.selected === 'PROJECT' ||
                                scope.landing.view.selected ===
                                    'PROJECT-MANAGE')
                        ) {
                            changeView('ALL', undefined);
                        }
                        if (newValue === 'home.landing.project.manage') {
                            changeView('PROJECT-MANAGE', undefined);
                        }
                    }
                }
            );
            scope.$on('$destroy', function () {
                insightListener();
                navigationListener();
                deleteProjectListener();
                resetInsightsListener();
                insightScrollEle.removeEventListener('scroll', getMoreInsights);
            });

            // dynamically set favicon and title
            const themeMap = CONFIG.theme['THEME_MAP'] ? JSON.parse(CONFIG.theme['THEME_MAP']) : {}
            document.title = themeMap.name ? themeMap.name : CUSTOMIZATION.page.title;

            // Set the favicon
            const faviconLink = themeMap.isLogoUrl
                ? themeMap.logo
                : CUSTOMIZATION.page.favicon
                ? CUSTOMIZATION.page.favicon
                : null;

            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = faviconLink;
            document.head.appendChild(link);
        }

        initialize();
    }
}
