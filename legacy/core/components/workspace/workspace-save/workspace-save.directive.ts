import angular from 'angular';

import './workspace-save.scss';

import './parameters/parameters.directive.ts';

export default angular
    .module('app.workspace.workspace-save', ['app.parameters.directive'])
    .directive('workspaceSave', workspaceSaveDirective);

workspaceSaveDirective.$inject = [
    '$q',
    '$timeout',
    '$location',
    '$window',
    'monolithService',
    'semossCoreService',
    'CONFIG',
];

function workspaceSaveDirective(
    $q,
    $timeout,
    $location,
    $window,
    monolithService,
    semossCoreService,
    CONFIG
) {
    workspaceSaveCtrl.$inject = ['$scope'];
    workspaceSaveLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^insight'],
        scope: {},
        controller: workspaceSaveCtrl,
        controllerAs: 'workspaceSave',
        bindToController: {
            forceNew: '=',
            close: '&?',
        },
        template: require('./workspace-save.directive.html'),
        link: workspaceSaveLink,
        replace: true,
    };

    function workspaceSaveCtrl() {}

    function workspaceSaveLink(scope, ele, attrs, ctrl) {
        let checkNameId;

        scope.insightCtrl = ctrl[0];
        // workaround due to parameters not being able to find the insight ctrl due to it being in an overlay
        scope.workspaceSave.insightCtrl = ctrl[0];

        scope.workspaceSave.apps = {
            options: [],
            insights: [],
        };
        scope.workspaceSave.newApp = {
            open: false,
            name: '',
        };

        scope.workspaceSave.question = {
            title: '',
            app: '',
            saved: false,
            error: '',
            tags: [],
            description: '',
            visibility: 'true',
            image: {
                saved: false,
                url: '',
                name: '',
                title: '',
            },
            minuteMapper: {
                HOUR: 60,
                DAY: 1440,
                WEEK: 10080,
                MONTH: 43800,
                YEAR: 525600,
            },
            cache: {
                new: false,
                old: false,
            },
            cacheMinutes: {
                new: 0,
                old: 0,
            },
            cacheEncrypt: {
                new: false,
                old: false,
            },
            expiration: {
                new: 'false',
                old: 'false',
            },
            cacheFrequency: {
                new: '',
                old: '',
                options: [
                    'Minute(s)',
                    'Hour(s)',
                    'Day(s)',
                    'Week(s)',
                    'Month(s)',
                    'Year(s)',
                ],
                error: false,
            },
            cacheFrequencyNumber: {
                new: '',
                old: '',
                error: false,
            },
            cacheCron: {
                // 0 0 4 ? * MON * {http://www.cronmaker.com/?1}
                new: '',
                old: '',
                error: false,
            },
        };

        scope.workspaceSave.parameters = {
            open: false,
            list: [],
        };

        scope.workspaceSave.overrideInsights = false;
        scope.workspaceSave.override = {
            app: '',
            insight: '',
            insightList: [],
            input: '',
            offset: 0,
            limit: 50,
            canCollect: false,
        };

        scope.workspaceSave.name = { exists: false };

        scope.workspaceSave.show = {
            alreadyExists: false,
            parameters: false,
            notification: false,
        };

        scope.workspaceSave.cache = {
            new: false,
            old: false,
        };

        scope.workspaceSave.changeApp = changeApp;
        scope.workspaceSave.changeOverrides = changeOverrides;
        scope.workspaceSave.validateNewApp = validateNewApp;
        scope.workspaceSave.validateSave = validateSave;
        scope.workspaceSave.executeSave = executeSave;
        scope.workspaceSave.getMoreInsights = getMoreInsights;
        scope.workspaceSave.searchInsights = searchInsights;
        scope.workspaceSave.checkInsightNameExists = checkInsightNameExists;
        scope.workspaceSave.radioChangeCacheInterval = radioChangeCacheInterval;
        scope.workspaceSave.setEditInterval = setEditInterval;
        scope.workspaceSave.dataCacheToggle = dataCacheToggle;

        scope.workspaceSave.adminUser = false;
        scope.workspaceSave.adminOnlyInsightSetPublic =
            CONFIG['adminOnlyInsightSetPublic'];

        /** Actions */

        /**
         * @name changeApp
         * @param list - from the app-list-dropdown
         * @desc toggle between creating a new app
         */
        function changeApp(list: any[]): void {
            let initialSet = false;

            // clear it out
            scope.workspaceSave.question.error = '';

            // set it once
            if (scope.workspaceSave.apps.options.length === 0) {
                scope.workspaceSave.apps.options = list;
                initialSet = true;
            }

            if (!scope.workspaceSave.newApp.open) {
                // first time, we want to try to guess the app
                if (initialSet) {
                    let appId = scope.insightCtrl.getShared('insight.app_id');

                    // find what database we are using
                    if (!appId) {
                        const recipe = scope.insightCtrl.getShared('steps');
                        for (let i = 0, len = recipe.length; i < len; i++) {
                            // regex is looking for something between Database (  and the next ,
                            // so basically the first argument to Database
                            const regEx =
                                /Database\s*\(\s*database\s*=\s*\[\s*\"([a-zA-Z0-9-]+)+\"\s*]\s*\)/g;
                            const match = recipe[i].expression.match(regEx); // regEx.exec(recipe[i].expression);
                            if (match) {
                                // grab only the id and remove all the rest of the text surrounding it
                                appId = match[0].replace(regEx, '$1');
                                break;
                            }
                        }
                    }

                    if (!appId) {
                        if (list.length > 0) {
                            appId = list[0].value;
                        } else {
                            scope.insightCtrl.alert(
                                'error',
                                'No projects available'
                            );
                        }
                    }

                    // validate
                    for (
                        let appIdx = 0, appLen = list.length;
                        appIdx < appLen;
                        appIdx++
                    ) {
                        if (list[appIdx].value === appId) {
                            scope.workspaceSave.question.app = list[appIdx];

                            // Set default image
                            if (scope.workspaceSave.question.image.url === '') {
                                scope.workspaceSave.question.image.url =
                                    semossCoreService.app.generateInsightImageURL(
                                        scope.workspaceSave.question.app.value
                                    );
                            }

                            break;
                        }
                    }

                    // still no app, they have to manually select
                    if (!scope.workspaceSave.question.app) {
                        return;
                    }
                }

                monolithService
                    .getSearchInsightsResults({
                        searchString: '',
                        filterData: {
                            app_id: [scope.workspaceSave.question.app.value],
                        },
                        limit: 100,
                        offset: 0,
                        sortOrdering: 'desc',
                        sortField: 'last_viewed_on',
                    })
                    .then((response) => {
                        scope.workspaceSave.apps.insights = [];

                        if (Array.isArray(response)) {
                            scope.workspaceSave.apps.insights = response.map(
                                (insight) => {
                                    return insight.name;
                                }
                            );
                        }
                    });
            }

            if (scope.workspaceSave.question.title) {
                checkInsightNameExists();
            }
        }

        /**
         * @name changeOverrides
         * @param list - from the app-list-dropdown
         * @desc will update the insight list when the selected app changes
         */
        function changeOverrides(list: any[], clear): void {
            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;

                scope.workspaceSave.apps.insights = [];

                if (clear) {
                    scope.workspaceSave.override.insightList = [];
                    scope.workspaceSave.override.offset = 0;
                }
                if (Array.isArray(output)) {
                    scope.workspaceSave.override.insightList =
                        scope.workspaceSave.override.insightList.concat(
                            output.map((insight) => {
                                return {
                                    name: insight.name,
                                    id: insight.app_insight_id,
                                };
                            })
                        );
                }
                scope.workspaceSave.override.canCollect =
                    output.length === scope.workspaceSave.override.limit;
            });
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getInsights',
                        components: [
                            scope.workspaceSave.override.app.value,
                            scope.workspaceSave.override.limit,
                            scope.workspaceSave.override.offset,
                            scope.workspaceSave.override.input,
                            [],
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        function checkInsightNameExists(): void {
            if (checkNameId) {
                $timeout.cancel(checkNameId);
            }

            checkNameId = $timeout(function () {
                const components: any = [];
                components.push({
                    type: 'checkInsightNameExists',
                    components: [
                        scope.workspaceSave.question.app.value,
                        scope.workspaceSave.question.title,
                    ],
                    meta: true,
                    terminal: true,
                });

                const callback = function (response: PixelReturnPayload) {
                    const operationType =
                        response.pixelReturn[0].operationType[0];
                    const output = response.pixelReturn[0].output;

                    if (operationType === 'OPERATION') {
                        scope.workspaceSave.name = output;

                        if (
                            scope.workspaceSave.name.userCanEdit &&
                            scope.workspaceSave.name.exists &&
                            scope.workspaceSave.question.title !==
                                scope.workspaceSave.question.previousTitle
                        ) {
                            scope.workspaceSave.show.notification = true;

                            scope.workspaceSave.name.existingName = `${scope.workspaceSave.question.app.display}/${scope.workspaceSave.question.title}`;

                            scope.workspaceSave.overrideInsights = true;

                            scope.workspaceSave.override.app =
                                scope.workspaceSave.name.projectId;
                            scope.workspaceSave.override.insight =
                                scope.workspaceSave.name.insightId;
                        } else {
                            scope.workspaceSave.show.notification = false;

                            scope.workspaceSave.name.existingName = null;

                            scope.workspaceSave.overrideInsights = false;

                            scope.workspaceSave.override.app = null;
                            scope.workspaceSave.override.insight = null;
                        }
                    } else if (operationType === 'ERROR') {
                        if (scope.workspaceSave.name.exists) {
                            scope.workspaceSave.show.notification = false;

                            scope.workspaceSave.name = {
                                existingName: null,
                                exists: false,
                            };

                            scope.workspaceSave.overrideInsights = false;

                            scope.workspaceSave.override.app = null;
                            scope.workspaceSave.override.insight = null;
                        }
                    }
                };

                if (components.length > 0) {
                    scope.insightCtrl.meta(components, callback);
                }
            }, 300);
        }

        /**
         * @name searchInsights
         * @desc searchs the insights for the current selected app
         * @param {string} search - search string
         * @returns {void}
         */
        function searchInsights(search) {
            scope.workspaceSave.override.input = search;
            changeOverrides([], true);
        }

        /**
         * @name getMoreInsights
         * @desc gets the insights for the current selected app
         * @returns {void}
         */
        function getMoreInsights() {
            if (!scope.workspaceSave.override.canCollect) {
                return;
            }
            // increment the offset to get more
            scope.workspaceSave.override.offset +=
                scope.workspaceSave.override.limit;
            changeOverrides([], false);
        }

        /**
         * @name validateNewApp
         * @desc check if the databasename is valid
         * @returns {void}
         */
        function validateNewApp(): void {
            const name = String(scope.workspaceSave.newApp.name);

            scope.workspaceSave.question.error = '';

            if (!name) {
                scope.workspaceSave.question.error = 'required';
                return;
            }

            // return false if special characters, true otherwise
            if (name.match(/[@.*+?&^$%{}()";|[\]\\]/g)) {
                scope.workspaceSave.question.error = 'special';
                return;
            }

            const cleaned = name.toUpperCase();

            if (scope.workspaceSave.apps.options) {
                // see if db name exists
                for (
                    let appIdx = 0,
                        appLen = scope.workspaceSave.apps.options.length;
                    appIdx < appLen;
                    appIdx++
                ) {
                    if (
                        scope.workspaceSave.apps.options[
                            appIdx
                        ].display.toUpperCase() === cleaned
                    ) {
                        scope.workspaceSave.question.error = 'exists';
                        break;
                    }
                }
            }
        }

        /**
         * @name validateSave
         * @param type - type of save (save - edit OR save as - new)
         * @desc check if save should be disabled
         * @returns {boolean} - should save be disabled?
         */
        function validateSave(type: string): boolean {
            if (!scope.workspaceSave.question.title) {
                return false;
            }

            if (
                !scope.workspaceSave.newApp.open &&
                !scope.workspaceSave.question.app.value
            ) {
                return false;
            }

            if (scope.workspaceSave.question.error) {
                return false;
            }

            if (scope.workspaceSave.overrideInsights) {
                if (
                    !scope.workspaceSave.override.app ||
                    !scope.workspaceSave.override.insight
                ) {
                    return false;
                }
                // Disables "Save As" button if overriding insights
                if (type === 'new') {
                    return false;
                }
            }
            return true;
        }

        /**
         * @name hasPixelsToAdd
         * @desc checks to see if there are additional pixels that need to run to be added to the recipe
         */
        function hasPixelsToAdd() {
            let hasPixels = false;

            hasPixels =
                Object.keys(scope.insightCtrl.appendToRecipe).length > 0;

            return hasPixels;
        }

        /**
         * @name getPixelsToAdd
         * @desc grab the pixes to be added to the recipe
         */
        function getPixelsToAdd() {
            const pixelsToAdd: object[] = [],
                panels = scope.insightCtrl.getShared('panels'),
                currentWidgets: string[] = [];

            // get all of the existing widgets
            for (let panelIdx = 0; panelIdx < panels.length; panelIdx++) {
                currentWidgets.push(panels[panelIdx].widgetId);
            }

            for (const widgetId in scope.insightCtrl.appendToRecipe) {
                // this widget doesn't exist anymore. the panel was probably closed. so we will ignore it
                if (currentWidgets.indexOf(widgetId) === -1) {
                    continue;
                }

                for (
                    let pixelIdx = 0;
                    pixelIdx <
                    scope.insightCtrl.appendToRecipe[widgetId].length;
                    pixelIdx++
                ) {
                    const pixel = semossCoreService.pixel.build(
                        scope.insightCtrl.appendToRecipe[widgetId][pixelIdx]
                    );
                    if (pixel) {
                        pixelsToAdd.push({
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        });
                    }
                }
            }

            return pixelsToAdd;
        }

        function getCacheMinutes() {
            let totalMinutes = 0;

            if (scope.workspaceSave.question.cacheFrequency.new === 'Hour(s)') {
                totalMinutes =
                    scope.workspaceSave.question.cacheFrequencyNumber.new *
                    scope.workspaceSave.question.minuteMapper['HOUR'];
            } else if (
                scope.workspaceSave.question.cacheFrequency.new === 'Day(s)'
            ) {
                totalMinutes =
                    scope.workspaceSave.question.cacheFrequencyNumber.new *
                    scope.workspaceSave.question.minuteMapper['DAY'];
            } else if (
                scope.workspaceSave.question.cacheFrequency.new === 'Week(s)'
            ) {
                totalMinutes =
                    scope.workspaceSave.question.cacheFrequencyNumber.new *
                    scope.workspaceSave.question.minuteMapper['WEEK'];
            } else if (
                scope.workspaceSave.question.cacheFrequency.new === 'Month(s)'
            ) {
                totalMinutes =
                    scope.workspaceSave.question.cacheFrequencyNumber.new *
                    scope.workspaceSave.question.minuteMapper['MONTH'];
            } else if (
                scope.workspaceSave.question.cacheFrequency.new === 'Year(s)'
            ) {
                totalMinutes =
                    scope.workspaceSave.question.cacheFrequencyNumber.new *
                    scope.workspaceSave.question.minuteMapper['YEAR'];
            } else if (
                scope.workspaceSave.question.cacheFrequency.new === 'Minute(s)'
            ) {
                totalMinutes =
                    scope.workspaceSave.question.cacheFrequencyNumber.new;
            }

            scope.workspaceSave.question.cacheMinutes.new = totalMinutes;
            return totalMinutes;
        }

        /**
         * @name validatedCacheInterval
         * @desc  disable and undisable edit interval fields
         */
        function validatedCacheInterval(flag?: boolean) {
            let valid = true;

            if (scope.workspaceSave.question.cacheCron.new === '') {
                if (scope.workspaceSave.question.cacheFrequency.new === '') {
                    valid = false;
                    scope.workspaceSave.question.cacheFrequency.error = true;
                    scope.workspaceSave.question.cacheCron.error = true;
                } else {
                    scope.workspaceSave.question.cacheFrequency.error = false;
                    scope.workspaceSave.question.cacheCron.error = false;
                }

                if (
                    scope.workspaceSave.question.cacheFrequencyNumber.new <= 0
                ) {
                    valid = false;
                    scope.workspaceSave.question.cacheFrequencyNumber.error =
                        true;
                    scope.workspaceSave.question.cacheCron.error = true;
                } else {
                    scope.workspaceSave.question.cacheFrequencyNumber.error =
                        false;
                    scope.workspaceSave.question.cacheCron.error = false;
                }
            } else {
                console.log(
                    'cron inputted, no interval validation req"d , validation'
                );
            }

            if (!valid && flag) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Please specify a custom interval or cron for the data caching of this insight.',
                });
            }

            return valid;
        }

        /**
         * @name clearPixelsToAdd
         * @desc remove these pixels since we've already added them to the recipe
         */
        function clearPixelsToAdd() {
            scope.insightCtrl.appendToRecipe = {};
        }

        /**
         * @name executeSave
         * @desc saves visualization based on save type
         */
        function executeSave(): void {
            let components: any[] = [],
                saveType: 'new' | 'edit' = scope.workspaceSave.question.saved
                    ? 'edit'
                    : 'new',
                projectVar = '',
                config: any,
                appId: string,
                insightId: string;

            if (scope.workspaceSave.forceNew) {
                saveType = 'new';
            }

            // console.log(saveType, 'saveType')
            if (saveType === 'new') {
                // Check if name exists
                if (
                    scope.workspaceSave.name.userCanEdit &&
                    scope.workspaceSave.name.exists
                ) {
                    // Display confirmation modal to overwrite
                    if (scope.workspaceSave.show.alreadyExists === false) {
                        scope.workspaceSave.show.alreadyExists = true;
                        return;
                    } else {
                        saveType = 'edit';

                        scope.workspaceSave.show.alreadyExists = false;
                    }
                }
                // automatically save in presentation mode if it's a new insight
                scope.insightCtrl.emit('change-presentation', {
                    presentation: true,
                });
            }

            // TODO if insight name is same as the original, we probably don't need to prompt?
            // need to run through this logic when insight name is being renamed to something that already exists
            if (saveType === 'edit' && scope.workspaceSave.show.alreadyExists) {
                scope.workspaceSave.show.alreadyExists = true;
                return;
            }

            // delete the empty keys
            config = semossCoreService.workspace.saveWorkspace(
                scope.insightCtrl.insightID
            );

            if (scope.workspaceSave.newApp.open) {
                components.push({
                    type: 'Pixel',
                    components: [
                        `projectVar = GenerateEmptyApp(${String(
                            scope.workspaceSave.newApp.name
                        ).replace(/ /g, '_')})`,
                    ],
                    terminal: true,
                    meta: true,
                });

                projectVar = 'projectVar';
            }

            appId = projectVar ? '' : scope.workspaceSave.question.app.value;
            insightId = scope.insightCtrl.getShared('insight.app_insight_id');

            // check to see if there are additional pixels that need to be run to be added to the recipe before we save
            if (hasPixelsToAdd()) {
                components = components.concat(getPixelsToAdd());
            }

            // need to run the insight config as meta before saving.
            components.push({
                type: 'setInsightConfig',
                components: [config],
                terminal: true,
                meta: true,
            });

            let cacheable = false;
            let cacheMins = -1;

            if (saveType === 'new') {
                if (scope.workspaceSave.question.cache.new === true) {
                    // cache on
                    if (
                        scope.workspaceSave.question.expiration.new === 'false'
                    ) {
                        // No Expiration
                        cacheable = true;
                        cacheMins = -1;
                    } else {
                        if (validatedCacheInterval()) {
                            const totalMinutes = getCacheMinutes();
                            cacheable = true;
                            cacheMins = totalMinutes;
                        } else {
                            validatedCacheInterval(true);
                            return;
                        }
                    }
                }
            } else {
                // console.log('edit')
                if (scope.workspaceSave.overrideInsights) {
                    appId = scope.workspaceSave.override.app;
                    insightId = scope.workspaceSave.override.insight;
                }

                if (scope.workspaceSave.question.cache.new === true) {
                    // cache on
                    if (
                        scope.workspaceSave.question.expiration.new === 'false'
                    ) {
                        // No Expiration
                        cacheable = true;
                        cacheMins = -1;
                    } else {
                        if (validatedCacheInterval()) {
                            const totalMinutes = getCacheMinutes();
                            cacheable = true;
                            cacheMins = totalMinutes;
                        } else {
                            // not validated
                            validatedCacheInterval(true);
                            return;
                        }
                    }
                }
            }

            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // close the menu
                scope.workspaceSave.close();
                clearPixelsToAdd();
            };

            updateImage(appId, insightId).then(function (uploadImageResponse) {
                if (saveType === 'new') {
                    // need to take the filename response from the upload if present
                    components.push({
                        type: 'saveInsight',
                        components: [
                            appId,
                            scope.workspaceSave.question.title,
                            scope.workspaceSave.question.visibility,
                            [],
                            '',
                            scope.workspaceSave.question.image.file &&
                            scope.workspaceSave.question.image.file.name &&
                            uploadImageResponse &&
                            uploadImageResponse[0] &&
                            uploadImageResponse[0].fileName
                                ? uploadImageResponse[0].fileName
                                : '',
                            projectVar || '',
                            scope.workspaceSave.question.tags &&
                            Array.isArray(scope.workspaceSave.question.tags)
                                ? scope.workspaceSave.question.tags.map(
                                      (item) => item.trim()
                                  )
                                : [],
                            scope.workspaceSave.question.description,
                            cacheable,
                            cacheMins,
                            scope.workspaceSave.question.cacheEncrypt.new,
                            scope.workspaceSave.question.cacheCron.new,
                        ],
                        terminal: true,
                        meta: true,
                    });
                } else {
                    components.push({
                        type: 'updateInsight',
                        components: [
                            appId,
                            scope.workspaceSave.question.title,
                            scope.workspaceSave.question.visibility,
                            [], // empty steps, to be saved on the BE
                            '',
                            scope.workspaceSave.question.image.file &&
                            scope.workspaceSave.question.image.file.name
                                ? `//${scope.workspaceSave.question.image.file.name}`
                                : '',
                            insightId,
                            projectVar || '',
                            scope.workspaceSave.question.tags &&
                            Array.isArray(scope.workspaceSave.question.tags)
                                ? scope.workspaceSave.question.tags.map(
                                      (item) => item.trim()
                                  )
                                : [],
                            scope.workspaceSave.question.description,
                            cacheable,
                            cacheMins,
                            scope.workspaceSave.question.cacheEncrypt.new,
                            scope.workspaceSave.question.cacheCron.new,
                        ],
                        terminal: true,
                        meta: true,
                    });
                }

                // now execute the save
                scope.insightCtrl.execute(components, callback);
            });
        }

        function updateImage(appId: string, insightId?: string) {
            let promise,
                deferred = $q.defer();

            if (scope.workspaceSave.question.image.file) {
                if (appId && insightId) {
                    promise = monolithService.uploadInsightImage(
                        appId,
                        insightId,
                        scope.workspaceSave.question.image.file
                    );
                } else {
                    insightId = scope.insightCtrl.insightID;
                    promise = monolithService.uploadFile(
                        scope.workspaceSave.question.image.file,
                        insightId
                    );
                }

                promise
                    .then((response) => {
                        semossCoreService.setOptions(
                            'imageUpdates',
                            appId + insightId,
                            `${semossCoreService.app.generateInsightImageURL(
                                appId,
                                insightId
                            )}&time=${new Date().getTime()}`
                        );
                        deferred.resolve(response);
                    })
                    .catch((error) => {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error || 'Error uploading image.',
                        });

                        URL.revokeObjectURL(
                            scope.workspaceSave.question.image.url
                        );
                    });
            } else if (
                scope.workspaceSave.question.image.deleted &&
                appId &&
                insightId
            ) {
                semossCoreService.setOptions(
                    'imageUpdates',
                    appId + insightId,
                    `${semossCoreService.app.generateInsightImageURL(
                        appId,
                        insightId
                    )}&time=${new Date().getTime()}`
                );
                monolithService
                    .deleteInsightImage(appId, insightId)
                    .then(function () {
                        deferred.resolve();
                    });
            } else {
                deferred.resolve();
            }

            semossCoreService.emit('update-insight-image');
            return deferred.promise;
        }

        /**
         * @name setCacheMinsOnMount
         */
        function setCacheMinsOnMount(defaultFlag?: boolean): void {
            let passedMins;
            let convertedMins = 0;
            let unitOfTime = '';

            if (defaultFlag) {
                passedMins = CONFIG.cacheInsightMinutes;
            } else {
                passedMins = scope.workspaceSave.question.cacheMinutes.new;
            }

            if (
                passedMins %
                    scope.workspaceSave.question.minuteMapper['YEAR'] ===
                0
            ) {
                convertedMins =
                    passedMins /
                    scope.workspaceSave.question.minuteMapper['YEAR'];
                unitOfTime = 'Year(s)';
            } else if (
                passedMins %
                    scope.workspaceSave.question.minuteMapper['MONTH'] ===
                0
            ) {
                convertedMins =
                    passedMins /
                    scope.workspaceSave.question.minuteMapper['MONTH'];
                unitOfTime = 'Month(s)';
            } else if (
                passedMins %
                    scope.workspaceSave.question.minuteMapper['WEEK'] ===
                0
            ) {
                convertedMins =
                    passedMins /
                    scope.workspaceSave.question.minuteMapper['WEEK'];
                unitOfTime = 'Week(s)';
            } else if (
                passedMins %
                    scope.workspaceSave.question.minuteMapper['DAY'] ===
                0
            ) {
                convertedMins =
                    passedMins /
                    scope.workspaceSave.question.minuteMapper['DAY'];
                unitOfTime = 'Day(s)';
            } else if (
                passedMins %
                    scope.workspaceSave.question.minuteMapper['HOUR'] ===
                0
            ) {
                convertedMins =
                    passedMins /
                    scope.workspaceSave.question.minuteMapper['HOUR'];
                unitOfTime = 'Hour(s)';
            } else {
                convertedMins = passedMins;
                unitOfTime = 'Minute(s)';
            }

            scope.workspaceSave.question.cacheMinutes.new = passedMins;
            scope.workspaceSave.question.cacheMinutes.old = passedMins;
            scope.workspaceSave.question.cacheFrequency.new = unitOfTime;
            scope.workspaceSave.question.cacheFrequency.old = unitOfTime;
            scope.workspaceSave.question.cacheFrequencyNumber.new =
                convertedMins;
            scope.workspaceSave.question.cacheFrequencyNumber.old =
                convertedMins;
            scope.workspaceSave.question.expiration.new = 'true';
            scope.workspaceSave.question.expiration.old = 'true';
        }

        /**
         * @name radioChangeCacheInterval
         * @desc  radio change on cache interval
         * @returns {void}
         */
        function radioChangeCacheInterval(expiration) {
            if (expiration === false) {
                scope.workspaceSave.question.cacheMinutes.new = 0;
                scope.workspaceSave.question.cacheFrequencyNumber.new = 0;
                scope.workspaceSave.question.cacheFrequencyNumber.old = 0;
                scope.workspaceSave.question.cacheFrequency.new = '';
                scope.workspaceSave.question.cacheFrequency.old = '';

                scope.workspaceSave.question.cacheCron.new = '';
                scope.workspaceSave.question.cacheCron.old = '';
                scope.workspaceSave.question.cacheFrequencyNumber.error = false;
                scope.workspaceSave.question.cacheFrequency.error = false;
                scope.workspaceSave.question.cacheCron.error = false;
            }
        }

        /**
         * @name dataCacheToggle
         * @desc  disable cache inputs and reset
         * @returns {void}
         */
        function dataCacheToggle() {
            if (scope.workspaceSave.question.cache.new) {
                scope.workspaceSave.question.expiration.new = 'false';
                scope.workspaceSave.question.cacheEncrypt.new = false;
                scope.workspaceSave.question.cacheMinutes.new = 0;
                scope.workspaceSave.question.cacheFrequencyNumber.new = 0;
                scope.workspaceSave.question.cacheFrequencyNumber.old = 0;
                scope.workspaceSave.question.cacheFrequency.new = '';
                scope.workspaceSave.question.cacheFrequency.old = '';
            } else {
                scope.workspaceSave.question.expiration.new = 'false';
                scope.workspaceSave.question.cacheEncrypt.new = false;
                scope.workspaceSave.question.cacheMinutes.new = 0;
                scope.workspaceSave.question.cacheFrequencyNumber.new = 0;
                scope.workspaceSave.question.cacheFrequency.new = '';
            }
        }

        /**
         * @name setEditInterval
         * @desc  disable and undisable edit interval fields
         * @returns {void}
         */
        function setEditInterval() {
            scope.workspaceSave.question.disableEditInterval.new = false;
        }

        /** Updates */
        /**
         * @name updateSave
         * @desc update the save options
         */
        function updateSave(): void {
            const appId = scope.insightCtrl.getShared('insight.app_id'),
                appInsightId = scope.insightCtrl.getShared(
                    'insight.app_insight_id'
                );

            scope.workspaceSave.question.saved = !!appInsightId;

            // Show the current name in the save directive
            scope.workspaceSave.question.title =
                scope.insightCtrl.getShared('insight.name');
            scope.workspaceSave.question.previousTitle =
                scope.workspaceSave.question.title;

            // clear it if it is called New Insight
            if (
                !scope.workspaceSave.question.saved &&
                scope.workspaceSave.question.title === 'New Insight'
            ) {
                scope.workspaceSave.question.title = '';
                scope.workspaceSave.question.cache.new =
                    CONFIG.cacheInsightByDefault;
                scope.workspaceSave.question.cache.old =
                    CONFIG.cacheInsightByDefault;
                scope.workspaceSave.question.cacheEncrypt.new =
                    CONFIG.cacheInsightEncrypt;
                scope.workspaceSave.question.cacheEncrypt.old =
                    CONFIG.cacheInsightEncrypt;

                // console.log(CONFIG, 'lol')
                if (CONFIG.cacheInsightMinutes === -1) {
                    console.log('default cache minutes set to -1 for new save');
                    scope.workspaceSave.question.expiration.new = 'false';
                    scope.workspaceSave.question.expiration.old = 'false';
                    scope.workspaceSave.question.cacheFrequency.new = '';
                    scope.workspaceSave.question.cacheFrequency.old = '';
                    scope.workspaceSave.question.cacheFrequencyNumber.new = 0;
                    scope.workspaceSave.question.cacheFrequencyNumber.old = 0;
                } else {
                    console.log(
                        'default cache minutes set to a number above 0 for new save'
                    );
                    setCacheMinsOnMount(true);
                }
            }

            // if saved insight, get the meta data
            if (scope.workspaceSave.question.saved) {
                const callback = function (response: PixelReturnPayload) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    // not sure why this has to be a string, doesn't work as boolean
                    scope.workspaceSave.question.visibility =
                        output.global.toString();
                    scope.workspaceSave.question.tags = output.tags;
                    scope.workspaceSave.question.description =
                        output.description;

                    scope.workspaceSave.question.cache.new = output.cacheable;
                    scope.workspaceSave.question.cache.old = output.cacheable;

                    if (output.cacheEncrypt) {
                        scope.workspaceSave.question.cacheEncrypt.new =
                            output.cacheEncrypt;
                        scope.workspaceSave.question.cacheEncrypt.old =
                            output.cacheEncrypt;
                    }

                    scope.workspaceSave.question.cacheMinutes.new =
                        output.cacheMinutes;
                    scope.workspaceSave.question.cacheMinutes.old =
                        output.cacheMinutes;

                    scope.workspaceSave.question.cacheCron.new =
                        output.cacheCron ? output.cacheCron : '';
                    scope.workspaceSave.question.cacheCron.old =
                        output.cacheCron ? output.cacheCron : '';

                    if (output.cacheMinutes > -1) {
                        if (output.cacheMinutes > 0) {
                            setCacheMinsOnMount();
                        } else {
                            scope.workspaceSave.question.cacheFrequency.new =
                                '';
                            scope.workspaceSave.question.cacheFrequency.old =
                                '';
                            scope.workspaceSave.question.cacheFrequencyNumber.new = 0;
                            scope.workspaceSave.question.cacheFrequencyNumber.old = 0;
                            scope.workspaceSave.question.expiration.new =
                                'true';
                            scope.workspaceSave.question.expiration.old =
                                'true';
                        }
                    } else {
                        scope.workspaceSave.question.expiration.new = 'false';
                        scope.workspaceSave.question.expiration.old = 'false';
                        scope.workspaceSave.question.cacheFrequency.new = '';
                        scope.workspaceSave.question.cacheFrequency.old = '';
                        scope.workspaceSave.question.cacheFrequencyNumber.new = 0;
                        scope.workspaceSave.question.cacheFrequencyNumber.old = 0;
                    }
                };

                scope.insightCtrl.query(
                    [
                        {
                            meta: true,
                            type: 'getSpecificInsightMeta',
                            components: [appId, appInsightId],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }

            if (scope.workspaceSave.question.saved) {
                const imageUpdates =
                        semossCoreService.getOptions('imageUpdates'),
                    insightImageKey = appId + appInsightId;

                if (imageUpdates[insightImageKey]) {
                    scope.workspaceSave.question.image.url =
                        imageUpdates[insightImageKey];
                } else {
                    scope.workspaceSave.question.image.url =
                        semossCoreService.app.generateInsightImageURL(
                            appId,
                            appInsightId
                        );
                }
                scope.workspaceSave.show.notification = false;
            }
        }

        /**
         * @name updatePermission
         * @desc update the permission
         */
        function updatePermission(): void {
            // check if it is is saved
            const appId = scope.insightCtrl.getShared('insight.app_id'),
                appInsightId = scope.insightCtrl.getShared(
                    'insight.app_insight_id'
                );

            if (appId && appInsightId) {
                // make call to get user's permission access for this insight so overriding the insight (Update) is disabled
                monolithService
                    .getUserInsightPermission(appId, appInsightId)
                    .then(function (response: {
                        data: { permission: string };
                    }) {
                        if (response.data.permission === 'OWNER') {
                            scope.workspaceSave.permission = 'AUTHOR';
                        } else if (response.data.permission === 'EDIT') {
                            scope.workspaceSave.permission = 'EDITOR';
                        } else {
                            scope.workspaceSave.permission = 'READ_ONLY';
                        }
                    });
            }
        }

        /**
         * @name getParams
         * @desc get the existing params for this insight
         * @returns {void}
         */
        function getParams(): void {
            const components = [
                {
                    type: 'getInsightParameters',
                    components: [],
                    meta: true,
                    terminal: true,
                },
            ];

            const callback = function (response) {
                const output = response.pixelReturn[0].output;
                const opType = response.pixelReturn[0].operationType;

                // console.log(output, 'output')

                if (opType.indexOf('ERROR') === -1) {
                    scope.workspaceSave.parameters.list = output;
                }
            };

            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name adminOnlySetPublic
         * @desc determine if only an admin has the ability to save insights as global
         * @returns {void}
         */
        function adminOnlySetPublic() {
            if (
                scope.workspaceSave.adminOnlyInsightSetPublic &&
                !scope.workspaceSave.adminUser
            ) {
                scope.workspaceSave.question.visibility = 'false';
            }
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the workspaceSave directive
         * @returns {void}
         */
        function initialize(): void {
            let savedInsightListener: () => {};
            monolithService.isAdmin().then(function (adminUser) {
                scope.workspaceSave.adminUser = adminUser;
                adminOnlySetPublic();
            });

            // register listeners
            savedInsightListener = scope.insightCtrl.on(
                'saved-insight',
                updateSave
            );

            scope.$on('$destroy', function () {
                console.log('destroying workspaceSave....');
                savedInsightListener();
            });

            updateSave();
            updatePermission();
            getParams();
        }

        initialize();
    }
}
