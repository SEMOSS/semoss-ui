'use strict';

import './edit-insight.scss';
import angular from 'angular';

export default angular
    .module('app.edit-insight.directive', [])
    .directive('editInsight', editInsightDirective);

editInsightDirective.$inject = [
    '$q',
    'monolithService',
    'semossCoreService',
    'ENDPOINT',
    'CONFIG',
];

function editInsightDirective(
    $q,
    monolithService,
    semossCoreService,
    ENDPOINT,
    CONFIG
) {
    editInsightCtrl.$inject = [];
    editInsightLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./edit-insight.directive.html'),
        bindToController: {
            open: '=',
            insight: '=',
        },
        controller: editInsightCtrl,
        controllerAs: 'editInsight',
        link: editInsightLink,
    };

    function editInsightCtrl() {}

    function editInsightLink(scope) {
        const PERMISSIONS = {
            OWNER: 'Author',
            EDIT: 'Editor',
            READ_ONLY: 'Viewer',
        };
        scope.editInsight.CONFIG = CONFIG;

        scope.editInsight.name = {
            new: '',
            old: '',
        };

        scope.editInsight.description = {
            new: '',
            old: '',
        };

        scope.editInsight.tags = {
            new: [],
            old: [],
        };

        scope.editInsight.image = {
            file: undefined,
            url: '',
        };

        scope.editInsight.cache = {
            new: false,
            old: false,
        };

        scope.editInsight.cacheEncrypt = {
            new: false,
            old: false,
        };

        scope.editInsight.cacheMinutes = {
            new: 0,
            old: 0,
        };

        scope.editInsight.exp = {
            new: 'false',
            old: 'false',
        };

        scope.editInsight.minuteMapper = {
            HOUR: 60,
            DAY: 1440,
            WEEK: 10080,
            MONTH: 43800,
            YEAR: 525600,
        };

        scope.editInsight.cacheFrequency = {
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
        };

        scope.editInsight.cacheFrequencyNumber = {
            new: '',
            old: '',
            error: false,
        };

        scope.editInsight.cacheCron = {
            new: '',
            old: '',
            error: false,
        };

        scope.editInsight.public = {
            new: false,
            old: false,
        };
        scope.editInsight.access = 'PRIVATE';

        scope.editInsight.users = {
            new: [],
            old: [],
            added: {
                selection: undefined,
                permission: 'READ_ONLY',
                options: [],
                list: [],
            },
        };

        scope.editInsight.permissions = [
            { display: PERMISSIONS.OWNER, value: 'OWNER' },
            { display: PERMISSIONS.EDIT, value: 'EDIT' },
            { display: PERMISSIONS.READ_ONLY, value: 'READ_ONLY' },
        ];

        scope.editInsight.showAddMember = false;
        scope.editInsight.showAlert = false;
        scope.editInsight.noUsers = false;

        scope.editInsight.save = save;
        scope.editInsight.cancel = cancel;
        scope.editInsight.deleteInsightImage = deleteInsightImage;
        scope.editInsight.deleteCache = deleteCache;
        scope.editInsight.deleteUsers = deleteUsers;
        scope.editInsight.searchUsers = searchUsers;
        scope.editInsight.addUser = addUser;
        scope.editInsight.addAllUsers = addAllUsers;
        scope.editInsight.closeAddOverlay = closeAddOverlay;
        scope.editInsight.removeNewUser = removeNewUser;
        scope.editInsight.accessUpdated = accessUpdated;
        scope.editInsight.permissionUpdated = permissionUpdated;
        scope.editInsight.setCacheMinsOnMount = setCacheMinsOnMount;
        scope.editInsight.radioChangeCacheInterval = radioChangeCacheInterval;
        scope.editInsight.dataCacheToggle = dataCacheToggle;

        scope.editInsight.adminUser = false;
        scope.editInsight.adminOnlyInsightSetPublic =
            CONFIG['adminOnlyInsightSetPublic'];

        /** General */
        /**
         * @name reset
         * @desc  reset everything
         * @returns {void}
         */
        function reset() {
            if (!scope.editInsight.open) {
                return;
            }

            // console.log(scope.editInsight.insight, 'Insight');

            // name
            scope.editInsight.name.new = scope.editInsight.insight.name;
            scope.editInsight.name.old = scope.editInsight.insight.name;

            // description
            scope.editInsight.description.new =
                scope.editInsight.insight.description;
            scope.editInsight.description.old =
                scope.editInsight.insight.description;

            // tags
            scope.editInsight.tags.new = semossCoreService.utility.freeze(
                scope.editInsight.insight.tags
            );
            scope.editInsight.tags.old = semossCoreService.utility.freeze(
                scope.editInsight.insight.tags
            );

            // image
            const imageUpdates = semossCoreService.getOptions('imageUpdates');
            const insightImageKey =
                scope.editInsight.insight.app_id +
                scope.editInsight.insight.app_insight_id;

            if (imageUpdates[insightImageKey]) {
                scope.editInsight.image.url = imageUpdates[insightImageKey];
            } else {
                scope.editInsight.image.url =
                    semossCoreService.app.generateInsightImageURL(
                        scope.editInsight.insight.app_id,
                        scope.editInsight.insight.app_insight_id
                    );
            }

            scope.editInsight.cache.new = scope.editInsight.insight.cacheable;
            scope.editInsight.cache.old = scope.editInsight.insight.cacheable;

            scope.editInsight.cacheEncrypt.new =
                scope.editInsight.insight.cacheEncrypt;
            scope.editInsight.cacheEncrypt.old =
                scope.editInsight.insight.cacheEncrypt;

            scope.editInsight.cacheCron.new = scope.editInsight.insight
                .cacheCron
                ? scope.editInsight.insight.cacheCron
                : '';
            scope.editInsight.cacheCron.old = scope.editInsight.insight
                .cacheCron
                ? scope.editInsight.insight.cacheCron
                : '';

            scope.editInsight.cacheFrequency.error = false;
            scope.editInsight.cacheFrequencyNumber.error = false;
            scope.editInsight.cacheCron.error = false;

            if (scope.editInsight.insight.cacheMinutes > 0) {
                setCacheMinsOnMount();
            } else if (scope.editInsight.insight.cacheCron) {
                scope.editInsight.exp.new = 'true';
                scope.editInsight.exp.old = 'true';
                scope.editInsight.cacheFrequency.new = '';
                scope.editInsight.cacheFrequency.old = '';
                scope.editInsight.cacheFrequencyNumber.new = 0;
                scope.editInsight.cacheFrequencyNumber.old = 0;
            } else {
                scope.editInsight.exp.new = 'false';
                scope.editInsight.exp.old = 'false';
                scope.editInsight.cacheFrequency.new = '';
                scope.editInsight.cacheFrequency.old = '';
                scope.editInsight.cacheFrequencyNumber.new = 0;
                scope.editInsight.cacheFrequencyNumber.old = 0;
            }

            scope.editInsight.permission = 'READ_ONLY';

            // make call to get user's permission access for this insight so 'Public' can be disabled
            monolithService
                .getUserInsightPermission(
                    scope.editInsight.insight.app_id,
                    scope.editInsight.insight.app_insight_id
                )
                .then(function (response) {
                    if (response && response.data) {
                        if (response.data.permission === 'OWNER') {
                            scope.editInsight.permission = 'AUTHOR';
                        } else if (response.data.permission === 'EDIT') {
                            scope.editInsight.permission = 'EDITOR';
                        } else {
                            scope.editInsight.permission = 'READ_ONLY';
                        }
                    }
                });

            scope.editInsight.public.new =
                scope.editInsight.insight.insight_global;
            if (scope.editInsight.public.new) {
                scope.editInsight.access = 'PUBLIC';
            } else {
                scope.editInsight.access = 'PRIVATE';
            }
            scope.editInsight.public.old =
                scope.editInsight.insight.insight_global;

            scope.editInsight.users.new = {};
            scope.editInsight.users.old = [];
            monolithService
                .getInsightUsers(
                    scope.editInsight.insight.app_id,
                    scope.editInsight.insight.app_insight_id
                )
                .then(function (response) {
                    const users = response.data;
                    scope.editInsight.noUsers = users.length === 0;
                    scope.editInsight.users.old = JSON.parse(
                        JSON.stringify(users)
                    );
                    for (let i = 0; i < users.totalMembers; i++) {
                        const permission: string = PERMISSIONS[
                            users.members[i].permission
                        ]
                            ? PERMISSIONS[users.members[i].permission]
                            : users.members[i].permission;
                        if (
                            scope.editInsight.users.new.hasOwnProperty(
                                permission
                            )
                        ) {
                            scope.editInsight.users.new[permission].push(
                                users.members[i]
                            );
                        } else {
                            scope.editInsight.users.new[permission] = [
                                users.members[i],
                            ];
                        }
                    }
                });
            searchUsers('');
        }

        /**
         * @name setCacheMinsOnMount
         * @desc  sets all initial values necessary for data caching
         * @returns {void}
         */
        function setCacheMinsOnMount() {
            const passedMins = scope.editInsight.insight.cacheMinutes;
            let convertedMins = 0;
            let unitOfTime = '';

            if (passedMins % scope.editInsight.minuteMapper['YEAR'] === 0) {
                convertedMins =
                    passedMins / scope.editInsight.minuteMapper['YEAR'];
                unitOfTime = 'Year(s)';
            } else if (
                passedMins % scope.editInsight.minuteMapper['MONTH'] ===
                0
            ) {
                convertedMins =
                    passedMins / scope.editInsight.minuteMapper['MONTH'];
                unitOfTime = 'Month(s)';
            } else if (
                passedMins % scope.editInsight.minuteMapper['WEEK'] ===
                0
            ) {
                convertedMins =
                    passedMins / scope.editInsight.minuteMapper['WEEK'];
                unitOfTime = 'Week(s)';
            } else if (
                passedMins % scope.editInsight.minuteMapper['DAY'] ===
                0
            ) {
                convertedMins =
                    passedMins / scope.editInsight.minuteMapper['DAY'];
                unitOfTime = 'Day(s)';
            } else if (
                passedMins % scope.editInsight.minuteMapper['HOUR'] ===
                0
            ) {
                convertedMins =
                    passedMins / scope.editInsight.minuteMapper['HOUR'];
                unitOfTime = 'Hour(s)';
            } else {
                convertedMins = passedMins;
                unitOfTime = 'Minute(s)';
            }

            scope.editInsight.cacheMinutes.new = passedMins;
            scope.editInsight.cacheMinutes.old = passedMins;
            scope.editInsight.cacheFrequency.new = unitOfTime;
            scope.editInsight.cacheFrequency.old = unitOfTime;
            scope.editInsight.cacheFrequencyNumber.new = convertedMins;
            scope.editInsight.cacheFrequencyNumber.old = convertedMins;
            scope.editInsight.exp.new = 'true';
            scope.editInsight.exp.old = 'true';

            // console.log(scope.editInsight.insight)
            // console.log(passedMins, scope.editInsight.minuteMapper["HOUR"])
            // console.log(passedMins/scope.editInsight.minuteMapper["HOUR"])
            // console.log(unitOfTime)
            // console.log(convertedMins)
        }

        /**
         * @name getCacheMinutes
         * @desc  converts passed integer into minutes based on selected interval
         * @returns {number}
         */
        function getCacheMinutes() {
            let totalMinutes = 0;

            if (scope.editInsight.cacheFrequency.new === 'Hour(s)') {
                totalMinutes =
                    scope.editInsight.cacheFrequencyNumber.new *
                    scope.editInsight.minuteMapper['HOUR'];
            } else if (scope.editInsight.cacheFrequency.new === 'Day(s)') {
                totalMinutes =
                    scope.editInsight.cacheFrequencyNumber.new *
                    scope.editInsight.minuteMapper['DAY'];
            } else if (scope.editInsight.cacheFrequency.new === 'Week(s)') {
                totalMinutes =
                    scope.editInsight.cacheFrequencyNumber.new *
                    scope.editInsight.minuteMapper['WEEK'];
            } else if (scope.editInsight.cacheFrequency.new === 'Month(s)') {
                totalMinutes =
                    scope.editInsight.cacheFrequencyNumber.new *
                    scope.editInsight.minuteMapper['MONTH'];
            } else if (scope.editInsight.cacheFrequency.new === 'Year(s)') {
                totalMinutes =
                    scope.editInsight.cacheFrequencyNumber.new *
                    scope.editInsight.minuteMapper['YEAR'];
            } else if (scope.editInsight.cacheFrequency.new === 'Minute(s)') {
                totalMinutes = scope.editInsight.cacheFrequencyNumber.new;
            }

            scope.editInsight.cacheMinutes.new = totalMinutes;

            return totalMinutes;
        }

        /**
         * @name radioChangeCacheInterval
         * @desc  radio change on cache interval resets fields
         * @returns {void}
         */
        function radioChangeCacheInterval(expiration: boolean) {
            if (expiration === false) {
                scope.editInsight.cacheMinutes.new = 0;
                scope.editInsight.cacheFrequencyNumber.new = 0;
                scope.editInsight.cacheFrequencyNumber.old = 0;
                scope.editInsight.cacheFrequency.new = '';
                scope.editInsight.cacheFrequency.old = '';
                scope.editInsight.cacheCron.new = '';
                scope.editInsight.cacheCron.old = '';
                scope.editInsight.cacheFrequencyNumber.error = false;
                scope.editInsight.cacheFrequency.error = false;
                scope.editInsight.cacheCron.error = false;
            }
        }

        /**
         * @name dataCacheToggle
         * @desc  disable cache inputs and reset
         * @returns {void}
         */
        function dataCacheToggle() {
            if (scope.editInsight.cache.new) {
                scope.editInsight.exp.new = 'false';
                scope.editInsight.cacheEncrypt.new = false;
                scope.editInsight.cacheMinutes.new = 0;
                scope.editInsight.cacheFrequencyNumber.new = 0;
                scope.editInsight.cacheFrequencyNumber.old = 0;
                scope.editInsight.cacheFrequency.new = '';
                scope.editInsight.cacheFrequency.old = '';
                scope.editInsight.cacheCron.new = '';
                scope.editInsight.cacheCron.old = '';
            } else {
                scope.editInsight.exp.new = 'false';
                scope.editInsight.cacheEncrypt.new = false;
                scope.editInsight.cacheMinutes.new = 0;
                scope.editInsight.cacheFrequencyNumber.new = 0;
                scope.editInsight.cacheFrequency.new = '';
                scope.editInsight.cacheCron.new = '';
            }
        }

        /**
         * @name validatedCacheInterval
         * @desc  validates whether data cache fields are filled out
         * @returns {boolean}
         */
        function validatedCacheInterval(flag?: boolean) {
            let valid = true;

            if (scope.editInsight.cacheCron.new === '') {
                console.log(
                    'no cron inputted, interval validation required,  validation'
                );
                if (scope.editInsight.cacheFrequency.new === '') {
                    valid = false;
                    scope.editInsight.cacheFrequency.error = true;
                    scope.editInsight.cacheCron.error = true;
                } else {
                    scope.editInsight.cacheFrequency.error = false;
                    scope.editInsight.cacheCron.error = false;
                }

                if (scope.editInsight.cacheFrequencyNumber.new <= 0) {
                    valid = false;
                    scope.editInsight.cacheFrequencyNumber.error = true;
                    scope.editInsight.cacheCron.error = true;
                } else {
                    scope.editInsight.cacheFrequencyNumber.error = false;
                    scope.editInsight.cacheCron.error = false;
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
         * @name save
         * @desc actually save everything
         * @returns {void}
         */
        function save() {
            let promises: any = [],
                pixelComponents: any = [],
                file,
                users,
                mapped,
                added,
                edited,
                deleted;

            // name
            if (scope.editInsight.name.new !== scope.editInsight.name.old) {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [
                        `SetInsightName(project=["${scope.editInsight.insight.app_id}"], id=["${scope.editInsight.insight.app_insight_id}"], insightName=["${scope.editInsight.name.new}"])`,
                    ],
                    terminal: true,
                });
            }

            const metadata = {};
            // description
            if (
                scope.editInsight.description.new !==
                scope.editInsight.description.old
            ) {
                metadata['description'] = scope.editInsight.description.new;
            }

            // tags
            if (
                JSON.stringify(scope.editInsight.tags.new) !==
                    JSON.stringify(scope.editInsight.tags.old) ||
                scope.editInsight.description.new !==
                    scope.editInsight.description.old
            ) {
                metadata['tag'] = scope.editInsight.tags.new;
            }

            if (Object.keys(metadata).length > 0) {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [
                        `SetInsightMetadata(project=["${
                            scope.editInsight.insight.app_id
                        }"], id=["${
                            scope.editInsight.insight.app_insight_id
                        }"], 
                        meta=[${JSON.stringify(metadata)}])`,
                    ],
                    terminal: true,
                });
            }

            // file
            file = scope.editInsight.image.file
                ? scope.editInsight.image.file
                : null;
            if (file) {
                promises.push(
                    monolithService.uploadInsightImage(
                        scope.editInsight.insight.app_id,
                        scope.editInsight.insight.app_insight_id,
                        file
                    )
                );
            }

            // What it was before with just a cache
            // if (scope.editInsight.cache.new !== scope.editInsight.cache.old) {
            //     pixelComponents.push({
            //         type: 'Pixel',
            //         components: [
            //             `SetInsightCacheable(project=["${scope.editInsight.insight.app_id}"], id=["${scope.editInsight.insight.app_insight_id}"], cache=[${scope.editInsight.cache.new}])`,
            //         ],
            //         terminal: true,
            //     });
            // }

            // console.log(scope.editInsight.cacheEncrypt.new, 'encrypt')

            if (scope.editInsight.cache.new === true) {
                // cache toggle set to true
                if (scope.editInsight.exp.new === 'false') {
                    // No expiration radio checked
                    pixelComponents.push({
                        type: 'Pixel',
                        components: [
                            `SetInsightCacheable(project=["${
                                scope.editInsight.insight.app_id
                            }"], id=["${
                                scope.editInsight.insight.app_insight_id
                            }"], cache=[${true}], cacheMinutes=[${-1}], cacheEncrypt=[${
                                scope.editInsight.cacheEncrypt.new
                            }], cacheCron=["${
                                scope.editInsight.cacheCron.new
                            }"])`,
                        ],
                        terminal: true,
                    });
                } else {
                    // Set Expiration radio checked
                    if (!validatedCacheInterval(true)) {
                        // inputs are invalid and passed a flag for an alert
                        return;
                    } else {
                        if (
                            scope.editInsight.cacheFrequency.new !==
                                scope.editInsight.cacheFrequency.old ||
                            scope.editInsight.cacheFrequencyNumber.new !==
                                scope.editInsight.cacheFrequencyNumber.old
                        ) {
                            // change in interval input or dropdown
                            const totalMinutes = getCacheMinutes();
                            pixelComponents.push({
                                type: 'Pixel',
                                components: [
                                    `SetInsightCacheable(project=["${
                                        scope.editInsight.insight.app_id
                                    }"], id=["${
                                        scope.editInsight.insight.app_insight_id
                                    }"], cache=[${
                                        scope.editInsight.cache.new
                                    }], cacheMinutes=[${
                                        scope.editInsight.exp.new === 'false'
                                            ? -1
                                            : totalMinutes
                                    }], cacheEncrypt=[${
                                        scope.editInsight.cacheEncrypt.new
                                    }], cacheCron=["${
                                        scope.editInsight.cacheCron.new
                                    }"])`,
                                ],
                                terminal: true,
                            });
                        } else if (
                            scope.editInsight.cacheCron.new !==
                            scope.editInsight.cacheCron.old
                        ) {
                            console.log('cacheCron change');
                            const totalMinutes = getCacheMinutes();
                            pixelComponents.push({
                                type: 'Pixel',
                                components: [
                                    `SetInsightCacheable(project=["${
                                        scope.editInsight.insight.app_id
                                    }"], id=["${
                                        scope.editInsight.insight.app_insight_id
                                    }"], cache=[${
                                        scope.editInsight.cache.new
                                    }], cacheMinutes=[${
                                        scope.editInsight.exp.new === 'false'
                                            ? -1
                                            : totalMinutes
                                    }], cacheEncrypt=[${
                                        scope.editInsight.cacheEncrypt.new
                                    }], cacheCron=["${
                                        scope.editInsight.cacheCron.new
                                    }"])`,
                                ],
                                terminal: true,
                            });
                        } else {
                            // console.log('bobdylan')
                            if (
                                scope.editInsight.cacheEncrypt.new !=
                                scope.editInsight.cacheEncrypt.old
                            ) {
                                console.log('encrypt change');
                                const totalMinutes = getCacheMinutes();
                                pixelComponents.push({
                                    type: 'Pixel',
                                    components: [
                                        `SetInsightCacheable(project=["${
                                            scope.editInsight.insight.app_id
                                        }"], id=["${
                                            scope.editInsight.insight
                                                .app_insight_id
                                        }"], cache=[${
                                            scope.editInsight.cache.new
                                        }], cacheMinutes=[${
                                            scope.editInsight.exp.new ===
                                            'false'
                                                ? -1
                                                : totalMinutes
                                        }], cacheEncrypt=[${
                                            scope.editInsight.cacheEncrypt.new
                                        }], cacheCron=["${
                                            scope.editInsight.cacheCron.new
                                        }"])`,
                                    ],
                                    terminal: true,
                                });
                            }
                        }
                    }
                }
            } else {
                if (
                    scope.editInsight.cache.new != scope.editInsight.cache.old
                ) {
                    // if there is no cache and it changes
                    pixelComponents.push({
                        type: 'Pixel',
                        components: [
                            `SetInsightCacheable(project=["${
                                scope.editInsight.insight.app_id
                            }"], id=["${
                                scope.editInsight.insight.app_insight_id
                            }"], cache=[${false}], cacheMinutes=[${-1}], cacheEncrypt=[${false}], cacheCron=[""])`,
                        ],
                        terminal: true,
                    });
                }
            }

            // permissions
            if (scope.editInsight.public.new !== scope.editInsight.public.old) {
                promises.push(
                    monolithService.setInsightGlobal(
                        scope.editInsight.insight.app_id,
                        scope.editInsight.insight.app_insight_id,
                        scope.editInsight.public.new
                    )
                );
            }

            // users
            users = {};
            mapped = {};
            added = [];
            edited = [];
            deleted = [];

            // mapp all of the ids to the index in the array
            users = {};
            scope.editInsight.users.old.members.forEach((value, idx) => {
                users[value.id] = idx;
            });

            for (const permission in scope.editInsight.users.new) {
                if (scope.editInsight.users.new.hasOwnProperty(permission)) {
                    const newUsers = scope.editInsight.users.new[permission];
                    for (
                        let newIdx = 0, newLen = newUsers.length;
                        newIdx < newLen;
                        newIdx++
                    ) {
                        // i keep track of what was already mapped, incase there are duplicates (there shouldn't be)
                        if (mapped.hasOwnProperty(newUsers[newIdx].id)) {
                            continue;
                        }
                        // is it already added?
                        if (users.hasOwnProperty(newUsers[newIdx].id)) {
                            // check if its been edited
                            if (
                                newUsers[newIdx].permission !==
                                scope.editInsight.users.old.members[
                                    users[newUsers[newIdx].id]
                                ].permission
                            ) {
                                edited.push(newUsers[newIdx]);
                            }

                            // remove from mapping
                            delete users[newUsers[newIdx].id];
                        } else {
                            added.push(newUsers[newIdx]);
                        }

                        mapped[newUsers[newIdx].id] = true;
                    }
                }
            }

            // // these are all the removed one (leftover)
            for (const user in users) {
                if (users.hasOwnProperty(user)) {
                    deleted.push(
                        scope.editInsight.users.old.members[users[user]]
                    );
                }
            }

            if (
                added.length !== 0 ||
                edited.length !== 0 ||
                deleted.length !== 0
            ) {
                added.forEach((user) => {
                    promises.push(
                        monolithService.addInsightUserPermission(
                            scope.editInsight.insight.app_id,
                            scope.editInsight.insight.app_insight_id,
                            user.id,
                            user.permission
                        )
                    );
                });

                edited.forEach((user) => {
                    promises.push(
                        monolithService.editInsightUserPermission(
                            scope.editInsight.insight.app_id,
                            scope.editInsight.insight.app_insight_id,
                            user.id,
                            user.permission
                        )
                    );
                });

                deleted.forEach((user) => {
                    promises.push(
                        monolithService.removeInsightUserPermission(
                            scope.editInsight.insight.app_id,
                            scope.editInsight.insight.app_insight_id,
                            user.id
                        )
                    );
                });
            }

            // message pixel
            if (pixelComponents.length > 0) {
                const message =
                        semossCoreService.utility.random('execute-pixel'),
                    deffered = $q.defer();

                semossCoreService.once(message, function (response) {
                    const type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        // because it is pixel, it will resolve
                        deffered.reject();
                        return;
                    }

                    deffered.resolve();
                });

                promises.push(deffered.promise);

                semossCoreService.emit('query-pixel', {
                    commandList: pixelComponents,
                    response: message,
                });
            }

            if (promises.length === 0) {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: 'Nothing to update.',
                });
            } else {
                $q.all(promises).then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully updated insight.',
                        });

                        // update with the new information
                        scope.editInsight.insight.name =
                            scope.editInsight.name.new;

                        // description
                        scope.editInsight.insight.description =
                            scope.editInsight.description.new;

                        // tags
                        scope.editInsight.insight.tags =
                            scope.editInsight.tags.new;
                        if (
                            !angular.equals(
                                scope.editInsight.tags.old,
                                scope.editInsight.tags.new
                            )
                        ) {
                            semossCoreService.emit('update-insight-tags');
                        }

                        // image
                        if (file) {
                            // tag the insight as updated image so we can refresh it next time we get it
                            semossCoreService.setOptions(
                                'imageUpdates',
                                scope.editInsight.insight.app_id +
                                    scope.editInsight.insight.app_insight_id,
                                semossCoreService.app.generateInsightImageURL(
                                    scope.editInsight.insight.app_id,
                                    scope.editInsight.insight.app_insight_id
                                ) +
                                    '&time=' +
                                    new Date().getTime()
                            );
                            scope.editInsight.image.url =
                                semossCoreService.getOptions('imageUpdates')[
                                    scope.editInsight.insight.app_id +
                                        scope.editInsight.insight.app_insight_id
                                ];
                            semossCoreService.emit('update-insight-image');
                        }

                        // cache
                        scope.editInsight.insight.cacheable =
                            scope.editInsight.cache.new;

                        // cache encrypt
                        scope.editInsight.insight.cacheEncrypt =
                            scope.editInsight.cacheEncrypt.new;

                        // cacheFrequency
                        scope.editInsight.insight.cacheMinutes =
                            scope.editInsight.cacheMinutes.new;

                        scope.editInsight.cacheFrequencyNumber.error = false;
                        scope.editInsight.cacheFrequency.error = false;
                        scope.editInsight.cacheCron.error = false;

                        // cacheCron
                        scope.editInsight.insight.cacheCron =
                            scope.editInsight.cacheCron.new;

                        // permissions
                        scope.editInsight.insight.insight_global =
                            scope.editInsight.public.new;

                        reset();
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text:
                                error.data.errorMessage ||
                                'Error updating insight.',
                        });
                    }
                );
            }

            // close the model
            scope.editInsight.open = false;
        }

        /**
         * @name cancel
         * @desc do not save things
         * @returns {void}
         */
        function cancel() {
            scope.editInsight.open = false;
        }

        /**
         * @name accessUpdated
         * @desc called when the access selection changes and syncs with the public scope
         */
        function accessUpdated(): void {
            scope.editInsight.public.new =
                scope.editInsight.access === 'PUBLIC';
        }

        /** Image */

        /**
         * @name deleteInsightImage
         * @desc delete the app image
         * @returns {void}
         */
        function deleteInsightImage(): void {
            monolithService
                .deleteInsightImage(
                    scope.editInsight.insight.app_id,
                    scope.editInsight.insight.app_insight_id
                )
                .then((response) => {
                    // scope.editApp.app.last_app_image_timestamp = response.last_app_image_timestamp;
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Insight image has been deleted.',
                    });
                    scope.editInsight.image.file = null;
                    // tag the insight as updated image so we can refresh it next time we get it
                    semossCoreService.setOptions(
                        'imageUpdates',
                        scope.editInsight.insight.app_id +
                            scope.editInsight.insight.app_insight_id,
                        semossCoreService.app.generateInsightImageURL(
                            scope.editInsight.insight.app_id,
                            scope.editInsight.insight.app_insight_id
                        ) +
                            '&time=' +
                            new Date().getTime()
                    );
                    scope.editInsight.image.url =
                        semossCoreService.getOptions('imageUpdates')[
                            scope.editInsight.insight.app_id +
                                scope.editInsight.insight.app_insight_id
                        ];
                    semossCoreService.emit('update-insight-image');
                });
        }

        /**
         * @name deleteCache
         * @desc delete the cache so that it can recache once the insight runs again
         * @returns {void}
         */
        function deleteCache() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                semossCoreService.emit('alert', {
                    color: 'success',
                    text: 'Successfully deleted insight cache',
                });
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteInsightCache',
                        components: [
                            scope.editInsight.insight.app_id,
                            scope.editInsight.insight.app_insight_id,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Users */
        /**
         * @name deleteUsers
         * @desc delete a newly added user
         * @param {string} deletedUser - user to delete
         * @returns {void}
         */
        function deleteUsers(deletedUser: any, index) {
            const permission = PERMISSIONS[deletedUser.permission]
                ? PERMISSIONS[deletedUser.permission]
                : deletedUser.permission;
            scope.editInsight.users.new[permission].splice(index, 1);
        }

        /**
         * @name searchUsers
         * @param {string} search - search term
         * @desc search the users
         * @returns {void}
         */
        function searchUsers(search) {
            scope.editInsight.users.added.options = [];

            // get list of users that meet the search input
            monolithService.getUserInformation(search).then(function (data) {
                scope.editInsight.users.added.options = data.map((user) => {
                    user.display = user.name + ' | ' + user.email;
                    user.selection = {
                        name: user.name,
                        id: user.id,
                        email: user.email,
                    };
                    return user;
                });
            });
        }

        /**
         * @name addUser
         * @desc add the user to the list
         * @returns {void}
         */
        function addUser() {
            let exists = false,
                isAdded = false;

            // Look for duplicates in current members
            for (const permission in scope.editInsight.users.new) {
                if (exists) {
                    break;
                }
                if (scope.editInsight.users.new.hasOwnProperty(permission)) {
                    for (
                        let newIdx = 0;
                        newIdx < scope.editInsight.users.new[permission].length;
                        newIdx++
                    ) {
                        if (
                            scope.editInsight.users.new[permission][newIdx]
                                .id ===
                            scope.editInsight.users.added.selection.id
                        ) {
                            exists = true;
                            break;
                        }
                    }
                }
            }

            // Look for duplicates in members to add list
            for (
                let id = 0;
                id < scope.editInsight.users.added.list.length;
                id++
            ) {
                if (
                    scope.editInsight.users.added.list[id].id ===
                    scope.editInsight.users.added.selection.id
                ) {
                    isAdded = true;
                    break;
                }
            }

            if (!exists && !isAdded) {
                scope.editInsight.users.added.list.push({
                    permission: scope.editInsight.users.added.permission,
                    id: scope.editInsight.users.added.selection.id,
                    name: scope.editInsight.users.added.selection.name,
                });
            } else {
                scope.editInsight.showAlert = true;
            }

            // Reset
            scope.editInsight.users.added.selection = undefined;
            scope.editInsight.users.added.permission = 'READ_ONLY';
        }

        /**
         * @name addAllUsers
         * @desc adds all the members to the main screen
         */
        function addAllUsers(): void {
            for (
                let i = 0;
                i < scope.editInsight.users.added.list.length;
                i++
            ) {
                const newUser: any = scope.editInsight.users.added.list[i];
                const permission: string = PERMISSIONS[newUser.permission]
                    ? PERMISSIONS[newUser.permission]
                    : newUser.permission;
                if (scope.editInsight.users.new.hasOwnProperty(permission)) {
                    scope.editInsight.users.new[permission].push(newUser);
                } else {
                    scope.editInsight.users.new[permission] = [newUser];
                }
            }
        }

        /**
         * @name removeNewUser
         * @desc removes the user from the list of new users to add
         * @param index index of user in the list
         */
        function removeNewUser(index: number) {
            scope.editInsight.users.added.list.splice(index, 1);
        }

        /**
         * @name closeAddOverlay
         * @desc called to close the add members overlay and reset the form
         */
        function closeAddOverlay(): void {
            scope.editInsight.showAddMember = false;
            scope.editInsight.showAlert = false;
            scope.editInsight.users.added.list = [];
            scope.editInsight.users.added.selection = undefined;
            scope.editInsight.users.added.permission = 'READ_ONLY';
        }

        /**
         * @name permissionUpdated
         * @desc called when the user's permission is changed
         * @param user the user to update
         * @param index the index
         * @param oldPermission the previous permission
         */
        function permissionUpdated(user, index, oldPermission): void {
            const newPermission = PERMISSIONS[user.permission]
                ? PERMISSIONS[user.permission]
                : user.permission;
            scope.editInsight.users.new[oldPermission].splice(index, 1);
            if (!scope.editInsight.users.new[newPermission]) {
                scope.editInsight.users.new[newPermission] = [];
            }
            scope.editInsight.users.new[newPermission].push(user);
        }

        /** Utility */
        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            reset();

            if (scope.editInsight.adminOnlyInsightSetPublic) {
                monolithService.isAdmin().then(function (adminUser) {
                    scope.editInsight.adminUser = adminUser;
                });
            }

            scope.$watch(
                function () {
                    return (
                        JSON.stringify(scope.editInsight.insight) +
                        '_' +
                        scope.editInsight.open
                    );
                },
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        reset();
                    }
                }
            );

            // listeners
            scope.$on('$destroy', function () {
                console.log('destroying editInsight....');
            });
        }

        initialize();
    }
}
