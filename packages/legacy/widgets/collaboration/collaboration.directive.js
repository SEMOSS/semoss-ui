'use strict';

/**
 * @name collaboration
 * @desc collaboration - accessible as the context menu widget
 */
export default angular
    .module('app.collaboration.directive', [])
    .directive('collaboration', collaborationDirective);

import './collaboration.scss';

collaborationDirective.$inject = ['ENDPOINT', '$timeout', 'semossCoreService'];

function collaborationDirective(ENDPOINT, $timeout, semossCoreService) {
    collaborationCtrl.$inject = [];
    collaborationLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget'],
        controllerAs: 'collaboration',
        bindToController: {},
        template: require('./collaboration.directive.html'),
        controller: collaborationCtrl,
        link: collaborationLink,
    };

    function collaborationCtrl() {}

    function collaborationLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var logoutListener, loginListener;

        // variables
        scope.collaboration.accordionSettings = {
            engine: {
                height: 100,
                disabled: false,
            },
            repo: {
                height: 0,
                disabled: true,
            },
            settings: {
                height: 0,
                disabled: true,
            },
            sync: {
                height: 0,
                disabled: true,
            },
        };

        scope.collaboration.engines = {
            options: [],
            selected: '',
            selectedName: '',
            isGit: false,
        };

        scope.collaboration.repos = {
            valid: false,
            options: [],
            selected: '',
            custom: false,
            user:
                scope.collaboration.credentials &&
                scope.collaboration.credentials.username
                    ? scope.collaboration.credentials.username
                    : '',
            name: '',
        };

        scope.collaboration.members = [];
        scope.collaboration.member = {
            selected: '',
            options: [],
        };

        scope.collaboration.files = {
            options: [],
            selected: [],
        };

        scope.collaboration.databaseSync = false;

        scope.collaboration.validation = {
            open: false,
            valid: false,
            type: '',
            name: '',
            title: '',
        };

        // functions
        scope.collaboration.login = login;
        scope.collaboration.getGit = getGit;
        scope.collaboration.toggleRepo = toggleRepo;
        scope.collaboration.selectRepo = selectRepo;
        scope.collaboration.validateRepo = validateRepo;
        scope.collaboration.createRepo = createRepo;
        scope.collaboration.deleteRepo = deleteRepo;
        scope.collaboration.dropRepo = dropRepo;
        scope.collaboration.getTeam = getTeam;
        scope.collaboration.searchMember = searchMember;
        scope.collaboration.addMember = addMember;
        scope.collaboration.removeMember = removeMember;
        scope.collaboration.getStatus = getStatus;
        scope.collaboration.pull = pull;
        scope.collaboration.syncAll = syncAll;
        scope.collaboration.syncSpecific = syncSpecific;
        scope.collaboration.checkValidation = checkValidation;
        scope.collaboration.confirmValidation = confirmValidation;

        /** Default */
        /**
         * @name resetCollaboration
         * @desc checks if collaboration is enabled
         * @returns {void}
         */

        function resetCollaboration() {
            semossCoreService
                .getCredentials('github')
                .then(function (response) {
                    // check if the user is logged in
                    if (!response.name) {
                        setAuth();
                        return;
                    }

                    // logged in
                    $timeout(function () {
                        scope.collaboration.credentials = {
                            username: response.name,
                        };
                        scope.collaboration.authenticated = true;

                        resetEngines();
                    });
                });
        }

        /** Auth */
        /**
         * @name setAuth
         * @desc set the accordion for an unauthenticated
         * @returns {void}
         */
        function setAuth() {
            scope.collaboration.authenticated = false;
        }

        /**
         * @name login
         * @desc function that is called to login
         * @returns {void}
         */
        function login() {
            var message = semossCoreService.utility.random('login');
            semossCoreService.once(message, function (response) {
                if (response.success) {
                    resetCollaboration();
                }
            });
            scope.widgetCtrl.emit('oauth-login', {
                provider: 'github',
                message: message,
            });
        }

        /** Engine */
        /**
         * @name resetEngines
         * @desc function gets the list of engine options (and sets the default)
         * @returns {void}
         */
        function resetEngines() {
            var callback;

            // clear
            scope.collaboration.engines = {
                options: [],
                selected: '',
                selectedName: '',
                isGit: false,
            };

            scope.collaboration.repos = {
                valid: false,
                options: [],
                selected: '',
                custom: false,
                user:
                    scope.collaboration.credentials &&
                    scope.collaboration.credentials.username
                        ? scope.collaboration.credentials.username
                        : '',
                name: '',
            };

            scope.collaboration.members = [];
            scope.collaboration.member = {
                selected: '',
                options: [],
            };

            scope.collaboration.files = {
                options: [],
                selected: [],
            };

            scope.collaboration.databaseSync = false;

            scope.collaboration.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    appId = scope.widgetCtrl.getShared('insight.app_id'),
                    recipe,
                    regEx,
                    match,
                    i,
                    len;

                if (type.indexOf('ERROR') === -1) {
                    scope.collaboration.engines.options = [];

                    for (i = 0, len = output.length; i < len; i++) {
                        scope.collaboration.engines.options.push({
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

                    // set the selected option
                    if (appId) {
                        getGit(appId);
                        return;
                    }

                    recipe = scope.widgetCtrl.getShared('steps');
                    for (i = 0, len = recipe.length; i < len; i++) {
                        // regex is looking for something between Database (  and the next ,
                        // so basically the first argument to Database
                        regEx =
                            /Database\s*\(\s*database\s*=\s*\[\s*\"([a-zA-Z0-9-]+)+\"\s*]\s*\)/g;
                        match = recipe[i].expression.match(regEx); // regEx.exec(recipe[i].expression);
                        if (match) {
                            getGit(match[0].replace(regEx, '$1'));
                            return;
                        }
                    }

                    if (scope.collaboration.engines.options.length > 0) {
                        getGit(scope.collaboration.engines.options[0].value);
                        return;
                    }

                    scope.collaboration.accordionSettings = {
                        engine: {
                            height: 100,
                            disabled: false,
                        },
                        repo: {
                            height: 0,
                            disabled: true,
                        },
                        settings: {
                            height: 0,
                            disabled: true,
                        },
                        sync: {
                            height: 0,
                            disabled: true,
                        },
                    };
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getProjectList',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getGit
         * @desc function gets the git status based on the selected engine
         * @param {string} appId - selected appId
         * @returns {void}
         */
        function getGit(appId) {
            var callback,
                appIdx,
                currentAppName = '';

            for (
                appIdx = 0;
                appIdx < scope.collaboration.engines.options.length;
                appIdx++
            ) {
                if (
                    scope.collaboration.engines.options[appIdx].value === appId
                ) {
                    currentAppName =
                        scope.collaboration.engines.options[appIdx].display;
                }
            }

            scope.collaboration.engines.selected = appId;
            scope.collaboration.engines.selectedName = currentAppName;

            // clear
            scope.collaboration.repos = {
                valid: false,
                options: [],
                selected: '',
                custom: false,
                user:
                    scope.collaboration.credentials &&
                    scope.collaboration.credentials.username
                        ? scope.collaboration.credentials.username
                        : '',
                name: '',
            };

            scope.collaboration.members = [];
            scope.collaboration.member = {
                selected: '',
                options: [],
            };

            scope.collaboration.files = {
                options: [],
                selected: [],
            };

            scope.collaboration.databaseSync = false;

            scope.collaboration.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.collaboration.engines.isGit = output;
                    if (scope.collaboration.engines.isGit) {
                        getRepos(scope.collaboration.engines.selected, false);
                    } else {
                        customRepo();
                    }
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'isGit',
                        components: [scope.collaboration.engines.selected],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Repos */
        /**
         * @name toggleRepo
         * @desc toggle the mode for repo creation
         * @returns {void}
         */
        function toggleRepo() {
            scope.collaboration.repos.custom =
                !scope.collaboration.repos.custom;

            if (scope.collaboration.repos.custom) {
                customRepo();
            } else {
                getRepos(
                    scope.collaboration.engines.selected,
                    scope.collaboration.repos.selected
                );
            }
        }

        /**
         * @name customRepo
         * @desc customRepo
         * @returns {void}
         */
        function customRepo() {
            scope.collaboration.repos.custom = true;

            scope.collaboration.accordionSettings = {
                engine: {
                    height: 20,
                    disabled: false,
                },
                repo: {
                    height: 80,
                    disabled: false,
                },
                settings: {
                    height: 0,
                    disabled: true,
                },
                sync: {
                    height: 0,
                    disabled: true,
                },
            };
        }

        /**
         * @name getRepos
         * @desc function gets the list of repos options based on the selected engine
         * @param {string} engine - selected engine
         * @param {string} selected - use a selected repo?
         * @returns {void}
         */
        function getRepos(engine, selected) {
            var callback;

            scope.collaboration.engines.selected = engine;

            // clear
            scope.collaboration.repos = {
                valid: false,
                options: [],
                selected: '',
                custom: false,
                user:
                    scope.collaboration.credentials &&
                    scope.collaboration.credentials.username
                        ? scope.collaboration.credentials.username
                        : '',
                name: '',
            };

            scope.collaboration.members = [];
            scope.collaboration.member = {
                selected: '',
                options: [],
            };

            scope.collaboration.files = {
                options: [],
                selected: [],
            };

            scope.collaboration.databaseSync = false;

            scope.collaboration.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.collaboration.repos.options = output;

                    if (selected) {
                        selectRepo(selected);
                    } else if (scope.collaboration.repos.options.length > 0) {
                        selectRepo(scope.collaboration.repos.options[0].name);
                    } else {
                        customRepo();
                    }
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            // get remote repos
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'listAppRemotes',
                        components: [scope.collaboration.engines.selected],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name selectRepo
         * @desc select a repo and get the associated information
         * @param {string} repo - location of the remote repo
         * @returns {void}
         */
        function selectRepo(repo) {
            scope.collaboration.repos.selected = repo;

            getTeam();
            getStatus();

            scope.collaboration.accordionSettings = {
                engine: {
                    height: 0,
                    disabled: false,
                },
                repo: {
                    height: 20,
                    disabled: false,
                },
                settings: {
                    height: 40,
                    disabled: false,
                },
                sync: {
                    height: 40,
                    disabled: false,
                },
            };
        }

        /**
         * @name validateRepo
         * @desc is the repo valid?
         * @returns {void}
         */
        function validateRepo() {
            var newRepo =
                    scope.collaboration.repos.user +
                    '/' +
                    scope.collaboration.repos.name,
                i,
                len;

            if (scope.collaboration.repos.user.length === 0) {
                scope.collaboration.repos.valid = false;
                return;
            }

            if (scope.collaboration.repos.name.length === 0) {
                scope.collaboration.repos.valid = false;
                return;
            }

            for (
                i = 0, len = scope.collaboration.repos.options.length;
                i < len;
                i++
            ) {
                if (scope.collaboration.repos.options[i].name === newRepo) {
                    scope.collaboration.repos.valid = false;
                    return;
                }
            }
            scope.collaboration.repos.valid = true;
        }
        /**
         * @name createRepo
         * @desc create a new repo
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function createRepo(valid) {
            var newRepo, callback;

            validateRepo();

            if (!scope.collaboration.repos.valid) {
                return;
            }

            newRepo =
                scope.collaboration.repos.user +
                '/' +
                scope.collaboration.repos.name;

            // list remote
            if (scope.collaboration.databaseSync && !valid) {
                scope.collaboration.validation.type = 'createRepo';
                scope.collaboration.validation.name = '';
                scope.collaboration.validation.title =
                    'Enter project name (' +
                    scope.collaboration.engines.selectedName +
                    ')';
                scope.collaboration.validation.valid = false;
                scope.collaboration.validation.open = true;
                return;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully created ' + newRepo
                    );
                    scope.collaboration.engines.isGit = true;
                    getRepos(scope.collaboration.engines.selected, newRepo);
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            // list remote
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'initAppRepo',
                        components: [
                            scope.collaboration.engines.selected,
                            newRepo,
                            valid,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name deleteRepo
         * @desc delete a repo
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function deleteRepo(valid) {
            var callback;

            // list remote
            if (!valid) {
                scope.collaboration.validation.type = 'deleteRepo';
                scope.collaboration.validation.name = '';
                scope.collaboration.validation.title =
                    'Enter project name (' +
                    scope.collaboration.engines.selectedName +
                    ')';
                scope.collaboration.validation.valid = false;
                scope.collaboration.validation.open = true;
                return;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully deleted ' +
                            scope.collaboration.repos.selected
                    );
                    getGit(scope.collaboration.engines.selected);
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            // list remote
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'deleteAppRepo',
                        components: [
                            scope.collaboration.engines.selected,
                            scope.collaboration.repos.selected,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name dropRepo
         * @desc drop a remote repo
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function dropRepo(valid) {
            var callback;

            // list remote
            if (!valid) {
                scope.collaboration.validation.type = 'dropRepo';
                scope.collaboration.validation.name = '';
                scope.collaboration.validation.title =
                    'Enter project name (' +
                    scope.collaboration.engines.selectedName +
                    ')';
                scope.collaboration.validation.valid = false;
                scope.collaboration.validation.open = true;
                return;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully dropped ' +
                            scope.collaboration.repos.selected
                    );
                    getGit(scope.collaboration.engines.selected);
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'dropAppRepo',
                        components: [
                            scope.collaboration.engines.selected,
                            scope.collaboration.repos.selected,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Team */
        /**
         * @name getTeam
         * @desc get a team associated with a remote repo
         * @returns {void}
         */
        function getTeam() {
            var callback;

            // clear
            scope.collaboration.members = [];
            scope.collaboration.member = {
                selected: '',
                options: [],
            };

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.collaboration.members = output;
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'listAppCollaborators',
                        components: [scope.collaboration.repos.selected],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name searchMember
         * @desc search a team member to your app
         * @param {string} search - search ter
         * @returns {void}
         */
        function searchMember(search) {
            var callback;

            // clear
            scope.collaboration.member.options = [];
            if (search) {
                scope.collaboration.member.loading = true;
            } else {
                scope.collaboration.member.loading = false;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;
                scope.collaboration.member.loading = false;

                if (type.indexOf('ERROR') === -1) {
                    scope.collaboration.member.options = output;
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            // list remote
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'searchAppCollaborator',
                        components: [search],
                        terminal: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name addMember
         * @desc add a team member to your app
         * @returns {void}
         */
        function addMember() {
            var callback;

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully invited ' +
                            scope.collaboration.member.selected[0] +
                            ' to ' +
                            scope.collaboration.repos.selected
                    );
                    getTeam();
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            // list remote
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'addAppCollaborator',
                        components: [
                            scope.collaboration.repos.selected,
                            scope.collaboration.member.selected[0],
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name removeMember
         * @desc removes a team member from your app
         * @param {string} removedMember - member to remove from your app
         * @returns {void}
         */
        function removeMember(removedMember) {
            var callback;

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully removed ' +
                            removedMember +
                            ' from ' +
                            scope.collaboration.repos.selected
                    );
                    getTeam();
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'removeAppCollaborator',
                        components: [
                            scope.collaboration.repos.selected,
                            removedMember,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Sync Functions */
        /**
         * @name getStatus
         * @desc gets the current status of the app
         * @returns {void}
         */
        function getStatus() {
            var callback;
            // clear
            scope.collaboration.files = {
                options: [],
                selected: [],
            };

            scope.collaboration.databaseSync = false;

            scope.collaboration.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.collaboration.files = {
                        options: JSON.parse(JSON.stringify(output)),
                        selected: JSON.parse(JSON.stringify(output)),
                    };
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'gitStatus',
                        components: [scope.collaboration.engines.selected],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name pull
         * @desc pull your app
         * @returns {void}
         */
        function pull() {
            var callback;

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully pulled from ' +
                            scope.collaboration.repos.selected
                    );
                    getStatus();
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'syncApp',
                        components: [
                            scope.collaboration.engines.selected,
                            scope.collaboration.repos.selected,
                            false,
                            scope.collaboration.databaseSync,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name syncAll
         * @desc sync your app
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function syncAll(valid) {
            var callback;

            // list remote
            if (scope.collaboration.databaseSync && !valid) {
                scope.collaboration.validation.type = 'syncAll';
                scope.collaboration.validation.name = '';
                scope.collaboration.validation.title =
                    'Enter project name (' +
                    scope.collaboration.engines.selectedName +
                    ')';
                scope.collaboration.validation.valid = false;
                scope.collaboration.validation.open = true;
                return;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully synced with ' +
                            scope.collaboration.repos.selected
                    );
                    getStatus();
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'syncApp',
                        components: [
                            scope.collaboration.engines.selected,
                            scope.collaboration.repos.selected,
                            true,
                            valid,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name syncSpecific
         * @desc sync specific portions of your app
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function syncSpecific(valid) {
            var files = [],
                i,
                len,
                callback;

            if (scope.collaboration.databaseSync && !valid) {
                scope.collaboration.validation.type = 'syncSpecific';
                scope.collaboration.validation.name = '';
                scope.collaboration.validation.title =
                    'Enter project name ( ' +
                    scope.collaboration.engines.selectedName +
                    ' )';
                scope.collaboration.validation.valid = false;
                scope.collaboration.validation.open = true;
                return;
            }

            for (
                i = 0, len = scope.collaboration.files.selected.length;
                i < len;
                i++
            ) {
                files.push(scope.collaboration.files.selected[i].fileLoc);
            }

            if (files.length === 0) {
                return;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    scope.widgetCtrl.alert('success', output);
                    getStatus();
                } else {
                    scope.widgetCtrl.alert('error', output);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'syncAppFilesO',
                        components: [
                            scope.collaboration.engines.selected,
                            scope.collaboration.repos.selected,
                            true,
                            files,
                            valid,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name checkValidation
         * @desc sync with a specific database
         * @returns {void}
         */
        function checkValidation() {
            var cleanedName = scope.collaboration.validation.name.replace(
                / /g,
                '_'
            );
            scope.collaboration.validation.valid =
                cleanedName === scope.collaboration.engines.selectedName;
        }

        /**
         * @name confirmValidation
         * @desc confirm validation and trigger appropriate function
         * @returns {void}
         */
        function confirmValidation() {
            checkValidation();

            if (!scope.collaboration.validation.valid) {
                return;
            }

            if (scope.collaboration.validation.type === 'syncAll') {
                syncAll(true);
            } else if (scope.collaboration.validation.type === 'syncSpecific') {
                syncSpecific(true);
            } else if (scope.collaboration.validation.type === 'createRepo') {
                createRepo(true);
            } else if (scope.collaboration.validation.type === 'dropRepo') {
                dropRepo(true);
            } else if (scope.collaboration.validation.type === 'deleteRepo') {
                deleteRepo(true);
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            logoutListener = scope.widgetCtrl.on(
                'oauth-logout-success',
                resetCollaboration
            );
            loginListener = scope.widgetCtrl.on(
                'oauth-login-success',
                resetCollaboration
            );

            // cleanup
            scope.$on('$destroy', function () {
                logoutListener();
                loginListener();
                console.log('DESTROY');
            });

            resetCollaboration();
        }

        initialize();
    }
}
