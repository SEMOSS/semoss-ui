'use strict';

export default angular
    .module('app.database.database-collab', [])
    .directive('databaseCollab', databaseCollabDirective);

import './database-collab.scss';

databaseCollabDirective.$inject = [
    '$transitions',
    '$stateParams',
    '$timeout',
    'semossCoreService',
];

function databaseCollabDirective(
    $transitions,
    $stateParams,
    $timeout,
    semossCoreService
) {
    databaseCollabCtrl.$inject = ['$scope'];

    return {
        restrict: 'E',
        template: require('./database-collab.directive.html'),
        controller: databaseCollabCtrl,
        scope: {},
        bindToController: {},
        controllerAs: 'databaseCollab',
    };

    function databaseCollabCtrl($scope) {
        var databaseCollab = this,
            logoutListener,
            loginListener;

        // variables
        databaseCollab.accordionSettings = {
            repo: {
                height: 100,
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

        databaseCollab.engines = {
            options: [],
            selected: '',
            isGit: false,
        };

        databaseCollab.repos = {
            valid: false,
            options: [],
            selected: '',
            custom: false,
            user:
                databaseCollab.credentials &&
                databaseCollab.credentials.username
                    ? databaseCollab.credentials.username
                    : '',
            name: '',
        };

        databaseCollab.members = [];
        databaseCollab.member = {
            selected: '',
            options: [],
        };

        databaseCollab.files = {
            options: [],
            selected: [],
        };

        databaseCollab.databaseSync = false;

        databaseCollab.validation = {
            open: false,
            valid: false,
            type: '',
            name: '',
            title: '',
        };

        // functions
        databaseCollab.login = login;
        databaseCollab.toggleRepo = toggleRepo;
        databaseCollab.selectRepo = selectRepo;
        databaseCollab.validateRepo = validateRepo;
        databaseCollab.createRepo = createRepo;
        databaseCollab.deleteRepo = deleteRepo;
        databaseCollab.dropRepo = dropRepo;
        databaseCollab.getTeam = getTeam;
        databaseCollab.searchMember = searchMember;
        databaseCollab.addMember = addMember;
        databaseCollab.removeMember = removeMember;
        databaseCollab.getStatus = getStatus;
        databaseCollab.pull = pull;
        databaseCollab.syncAll = syncAll;
        databaseCollab.syncSpecific = syncSpecific;
        databaseCollab.checkValidation = checkValidation;
        databaseCollab.confirmValidation = confirmValidation;

        /**
         * @name updateNavigation
         * @desc called when a route changes
         * @returns {void}
         */
        function updateNavigation() {
            // save the appId
            databaseCollab.appId = $stateParams.database;

            if (!databaseCollab.appId) {
                return;
            }

            resetCollaboration();
        }

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
                        databaseCollab.credentials = {
                            username: response.name,
                        };
                        databaseCollab.authenticated = true;

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
            databaseCollab.authenticated = false;
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
            semossCoreService.emit('oauth-login', {
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
            var currentAppName =
                semossCoreService.app.get(
                    `available.${databaseCollab.appId}.name`
                ) || '';

            if (databaseCollab.appId) {
                databaseCollab.engines = {
                    selected: databaseCollab.appId,
                    selectedName: currentAppName,
                    isGit: false,
                };

                getGit();
            }
        }
        /**
         * @name getGit
         * @desc function gets the git status based on the selected engine
         * @returns {void}
         */
        function getGit() {
            var message = semossCoreService.utility.random('query-pixel');

            // clear
            databaseCollab.repos = {
                valid: false,
                options: [],
                selected: '',
                custom: false,
                user:
                    databaseCollab.credentials &&
                    databaseCollab.credentials.username
                        ? databaseCollab.credentials.username
                        : '',
                name: '',
            };

            databaseCollab.members = [];
            databaseCollab.member = {
                selected: '',
                options: [],
            };

            databaseCollab.files = {
                options: [],
                selected: [],
            };

            databaseCollab.databaseSync = false;

            databaseCollab.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    databaseCollab.engines.isGit = output;
                    if (databaseCollab.engines.isGit) {
                        getRepos(databaseCollab.engines.selected, false);
                    } else {
                        customRepo();
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'isGit',
                        components: [databaseCollab.engines.selected],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Repos */
        /**
         * @name toggleRepo
         * @desc toggle the mode for repo creation
         * @returns {void}
         */
        function toggleRepo() {
            databaseCollab.repos.custom = !databaseCollab.repos.custom;

            if (databaseCollab.repos.custom) {
                customRepo();
            } else {
                getRepos(
                    databaseCollab.engines.selected,
                    databaseCollab.repos.selected
                );
            }
        }

        /**
         * @name customRepo
         * @desc customRepo
         * @returns {void}
         */
        function customRepo() {
            databaseCollab.repos.custom = true;

            databaseCollab.accordionSettings = {
                repo: {
                    height: 100,
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
            var message = semossCoreService.utility.random('query-pixel');
            databaseCollab.engines.selected = engine;

            // clear
            databaseCollab.repos = {
                valid: false,
                options: [],
                selected: '',
                custom: false,
                user:
                    databaseCollab.credentials &&
                    databaseCollab.credentials.username
                        ? databaseCollab.credentials.username
                        : '',
                name: '',
            };

            databaseCollab.members = [];
            databaseCollab.member = {
                selected: '',
                options: [],
            };

            databaseCollab.files = {
                options: [],
                selected: [],
            };

            databaseCollab.databaseSync = false;

            databaseCollab.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    databaseCollab.repos.options = output;

                    if (selected) {
                        selectRepo(selected);
                    } else if (databaseCollab.repos.options.length > 0) {
                        selectRepo(databaseCollab.repos.options[0].name);
                    } else {
                        customRepo();
                    }
                }
            });

            // get remote repos
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'listAppRemotes',
                        components: [databaseCollab.engines.selected],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name selectRepo
         * @desc select a repo and get the associated information
         * @param {string} repo - location of the remote repo
         * @returns {void}
         */
        function selectRepo(repo) {
            databaseCollab.repos.selected = repo;

            getTeam();
            getStatus();

            databaseCollab.accordionSettings = {
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
                    databaseCollab.repos.user + '/' + databaseCollab.repos.name,
                i,
                len;

            if (databaseCollab.repos.user.length === 0) {
                databaseCollab.repos.valid = false;
                return;
            }

            if (databaseCollab.repos.name.length === 0) {
                databaseCollab.repos.valid = false;
                return;
            }

            for (
                i = 0, len = databaseCollab.repos.options.length;
                i < len;
                i++
            ) {
                if (databaseCollab.repos.options[i].name === newRepo) {
                    databaseCollab.repos.valid = false;
                    return;
                }
            }
            databaseCollab.repos.valid = true;
        }
        /**
         * @name createRepo
         * @desc create a new repo
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function createRepo(valid) {
            var newRepo,
                message = semossCoreService.utility.random('query-pixel');

            validateRepo();

            if (!databaseCollab.repos.valid) {
                return;
            }

            newRepo =
                databaseCollab.repos.user + '/' + databaseCollab.repos.name;

            // list remote
            if (databaseCollab.databaseSync && !valid) {
                databaseCollab.validation.type = 'createRepo';
                databaseCollab.validation.name = '';
                databaseCollab.validation.title =
                    'Enter database name (' +
                    databaseCollab.engines.selectedName +
                    ')';
                databaseCollab.validation.valid = false;
                databaseCollab.validation.open = true;
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully created ' + newRepo,
                    });
                    databaseCollab.engines.isGit = true;
                    getRepos(databaseCollab.engines.selected, newRepo);
                }
            });

            // list remote
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'initAppRepo',
                        components: [
                            databaseCollab.engines.selected,
                            newRepo,
                            valid,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name deleteRepo
         * @desc delete a repo
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function deleteRepo(valid) {
            var message = semossCoreService.utility.random('query-pixel');
            // list remote
            if (!valid) {
                databaseCollab.validation.type = 'deleteRepo';
                databaseCollab.validation.name = '';
                databaseCollab.validation.title =
                    'Enter database name (' +
                    databaseCollab.engines.selectedName +
                    ')';
                databaseCollab.validation.valid = false;
                databaseCollab.validation.open = true;
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully deleted ' +
                            databaseCollab.repos.selected,
                    });
                    getGit();
                }
            });

            // list remote
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'deleteAppRepo',
                        components: [
                            databaseCollab.engines.selected,
                            databaseCollab.repos.selected,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name dropRepo
         * @desc drop a remote repo
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function dropRepo(valid) {
            var message = semossCoreService.utility.random('query-pixel');
            // list remote
            if (!valid) {
                databaseCollab.validation.type = 'dropRepo';
                databaseCollab.validation.name = '';
                databaseCollab.validation.title =
                    'Enter database name (' +
                    databaseCollab.engines.selectedName +
                    ')';
                databaseCollab.validation.valid = false;
                databaseCollab.validation.open = true;
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully dropped ' +
                            databaseCollab.repos.selected,
                    });
                    getGit();
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'dropAppRepo',
                        components: [
                            databaseCollab.engines.selected,
                            databaseCollab.repos.selected,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Team */
        /**
         * @name getTeam
         * @desc get a team associated with a remote repo
         * @returns {void}
         */
        function getTeam() {
            var message = semossCoreService.utility.random('query-pixel');
            // clear
            databaseCollab.members = [];
            databaseCollab.member = {
                selected: '',
                options: [],
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    databaseCollab.members = output;
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'listAppCollaborators',
                        components: [databaseCollab.repos.selected],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name searchMember
         * @desc search a team member to your app
         * @param {string} search - search ter
         * @returns {void}
         */
        function searchMember(search) {
            var message = semossCoreService.utility.random('query-pixel');
            // clear
            databaseCollab.member.options = [];
            if (search) {
                databaseCollab.member.loading = true;
            } else {
                databaseCollab.member.loading = false;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                databaseCollab.member.loading = false;
                if (type.indexOf('ERROR') === -1) {
                    databaseCollab.member.options = output;
                }
            });

            // list remote
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'searchAppCollaborator',
                        components: [search],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name addMember
         * @desc add a team member to your app
         * @returns {void}
         */
        function addMember() {
            var message = semossCoreService.utility.random('query-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully invited ' +
                            databaseCollab.member.selected[0] +
                            ' to ' +
                            databaseCollab.repos.selected,
                    });
                    getTeam();
                }
            });

            // list remote
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'addAppCollaborator',
                        components: [
                            databaseCollab.repos.selected,
                            databaseCollab.member.selected[0],
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name removeMember
         * @desc removes a team member from your app
         * @param {string} removedMember - member to remove from your app
         * @returns {void}
         */
        function removeMember(removedMember) {
            var message = semossCoreService.utility.random('query-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully removed ' +
                            removedMember +
                            ' from ' +
                            databaseCollab.repos.selected,
                    });
                    getTeam();
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'removeAppCollaborator',
                        components: [
                            databaseCollab.repos.selected,
                            removedMember,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Sync Functions */
        /**
         * @name getStatus
         * @desc gets the current status of the app
         * @returns {void}
         */
        function getStatus() {
            var message = semossCoreService.utility.random('query-pixel');
            // clear
            databaseCollab.files = {
                options: [],
                selected: [],
            };

            databaseCollab.databaseSync = false;

            databaseCollab.validation = {
                open: false,
                valid: false,
                type: '',
                name: '',
                title: '',
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    databaseCollab.files = {
                        options: JSON.parse(JSON.stringify(output)),
                        selected: JSON.parse(JSON.stringify(output)),
                    };
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'gitStatus',
                        components: [databaseCollab.engines.selected],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name pull
         * @desc pull your app
         * @returns {void}
         */
        function pull() {
            var message = semossCoreService.utility.random('query-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully pulled from ' +
                            databaseCollab.repos.selected,
                    });
                    getStatus();
                }
            });

            // list remote
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'syncApp',
                        components: [
                            databaseCollab.engines.selected,
                            databaseCollab.repos.selected,
                            false,
                            databaseCollab.databaseSync,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name syncAll
         * @desc sync your app
         * @param {boolean} valid - able to proceed with irreversible actions?
         * @returns {void}
         */
        function syncAll(valid) {
            var message = semossCoreService.utility.random('query-pixel');
            // list remote
            if (databaseCollab.databaseSync && !valid) {
                databaseCollab.validation.type = 'syncAll';
                databaseCollab.validation.name = '';
                databaseCollab.validation.title =
                    'Enter Database name (' +
                    databaseCollab.engines.selected +
                    ')';
                databaseCollab.validation.valid = false;
                databaseCollab.validation.open = true;
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully synced with ' +
                            databaseCollab.repos.selected,
                    });
                    getStatus();
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'syncApp',
                        components: [
                            databaseCollab.engines.selected,
                            databaseCollab.repos.selected,
                            true,
                            valid,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
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
                message = semossCoreService.utility.random('query-pixel');

            if (databaseCollab.databaseSync && !valid) {
                databaseCollab.validation.type = 'syncSpecific';
                databaseCollab.validation.name = '';
                databaseCollab.validation.title =
                    'Enter database name ( ' +
                    databaseCollab.engines.selectedName +
                    ' )';
                databaseCollab.validation.valid = false;
                databaseCollab.validation.open = true;
                return;
            }

            for (
                i = 0, len = databaseCollab.files.selected.length;
                i < len;
                i++
            ) {
                files.push(databaseCollab.files.selected[i].fileLoc);
            }

            if (files.length === 0) {
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: output,
                    });
                    getStatus();
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'syncAppFilesO',
                        components: [
                            databaseCollab.engines.selected,
                            databaseCollab.repos.selected,
                            true,
                            files,
                            valid,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name checkValidation
         * @desc sync with a specific database
         * @returns {void}
         */
        function checkValidation() {
            var cleanedName = databaseCollab.validation.name.replace(/ /g, '_');
            databaseCollab.validation.valid =
                cleanedName ===
                databaseCollab.engines.selectedName.replace(/ /g, '_');
        }

        /**
         * @name confirmValidation
         * @desc confirm validation and trigger appropriate function
         * @returns {void}
         */
        function confirmValidation() {
            checkValidation();

            if (!databaseCollab.validation.valid) {
                return;
            }

            if (databaseCollab.validation.type === 'syncAll') {
                syncAll(true);
            } else if (databaseCollab.validation.type === 'syncSpecific') {
                syncSpecific(true);
            } else if (databaseCollab.validation.type === 'createRepo') {
                createRepo(true);
            } else if (databaseCollab.validation.type === 'dropRepo') {
                dropRepo(true);
            } else if (databaseCollab.validation.type === 'deleteRepo') {
                deleteRepo(true);
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            const navigationListener = $transitions.onSuccess(
                {},
                updateNavigation
            );

            logoutListener = semossCoreService.on(
                'oauth-logout-success',
                resetCollaboration
            );
            loginListener = semossCoreService.on(
                'oauth-login-success',
                resetCollaboration
            );

            // cleanup
            $scope.$on('$destroy', function () {
                logoutListener();
                loginListener();
                navigationListener();
            });

            updateNavigation();
        }

        initialize();
    }
}
