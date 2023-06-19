'use strict';

import angular from 'angular';

export default angular
    .module('app.edit-project.directive', [])
    .directive('editProject', editProjectDirective);

import './edit-project.scss';

editProjectDirective.$inject = [
    '$q',
    'monolithService',
    'semossCoreService',
    'ENDPOINT',
    'CONFIG',
];

function editProjectDirective(
    $q: ng.IQService,
    monolithService: MonolithService,
    semossCoreService: SemossCoreService,
    ENDPOINT: EndPoint,
    CONFIG: any
) {
    editProjectCtrl.$inject = [];
    editProjectLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./edit-project.directive.html'),
        bindToController: {
            open: '=',
            project: '=',
        },
        controller: editProjectCtrl,
        controllerAs: 'editProject',
        link: editProjectLink,
    };

    function editProjectCtrl() {}

    function editProjectLink(scope) {
        scope.editProject.CONFIG = CONFIG;

        scope.editProject.name = {
            new: '',
            old: '',
        };

        scope.editProject.description = {
            new: '',
            old: '',
        };

        scope.editProject.tags = {
            new: '',
            old: '',
        };

        scope.editProject.image = {
            file: undefined,
            url: '',
        };

        // Generating Descriptions
        scope.editProject.packagesInstalled = false;
        scope.editProject.showDescriptionScreen = false;
        scope.editProject.generatedDescriptions = [];
        scope.editProject.selectedDesc = '';
        scope.editProject.numDesc = 1;
        scope.editProject.loadingDesc = false;
        scope.editProject.callbackMessage = '';

        scope.editProject.save = save;
        scope.editProject.cancel = cancel;
        scope.editProject.deleteProjectImage = deleteProjectImage;

        // Generating Descriptions - Functions
        scope.editProject.openDescriptionScreen = openDescriptionScreen;
        scope.editProject.getDescriptions = getDescriptions;
        scope.editProject.submitDescription = submitDescription;
        scope.editProject.resetDescription = resetDescription;
        scope.editProject.descriptionChanged = descriptionChanged;

        /** General */
        /**
         * @name reset
         * @desc reset everything
         */
        function reset(): void {
            if (!scope.editProject.open) {
                return;
            }

            // name
            scope.editProject.name.new = scope.editProject.project.project_name;
            scope.editProject.name.old = scope.editProject.project.project_name;

            // description
            scope.editProject.description.new =
                scope.editProject.project.description;
            scope.editProject.description.old =
                scope.editProject.project.description;

            // tags
            if (
                scope.editProject.project.tag != undefined &&
                !Array.isArray(scope.editProject.project.tag)
            ) {
                scope.editProject.tags.new = semossCoreService.utility.freeze([
                    scope.editProject.project.tag,
                ]);
            } else {
                scope.editProject.tags.new = semossCoreService.utility.freeze(
                    scope.editProject.project.tag
                );
            }

            scope.editProject.tags.old = semossCoreService.utility.freeze(
                scope.editProject.project.tag
            );

            // image
            const imageUpdates = semossCoreService.getOptions('imageUpdates');

            if (imageUpdates[scope.editProject.project.project_id]) {
                scope.editProject.image.url =
                    imageUpdates[scope.editProject.project.project_id];
            } else {
                scope.editProject.image.url =
                    semossCoreService.app.generateProjectImageURL(
                        scope.editProject.project.project_id
                    );
            }

            scope.editProject.permission = 'READ_ONLY';

            // make call to get user's permission access for this insight so 'Public' can be disabled
            monolithService.getProjects(false).then(function (response) {
                if (response && response.data) {
                    for (
                        let appIdx = 0, appLen = response.data.length;
                        appIdx < appLen;
                        appIdx++
                    ) {
                        if (
                            response.data[appIdx].project_id ===
                            scope.editProject.project.project_id
                        ) {
                            if (
                                response.data[appIdx].project_permission ===
                                'OWNER'
                            ) {
                                scope.editProject.permission = 'AUTHOR';
                            } else if (
                                response.data[appIdx].project_permission ===
                                'EDIT'
                            ) {
                                scope.editProject.permission = 'EDITOR';
                            } else {
                                scope.editProject.permission = 'READ_ONLY';
                            }

                            break;
                        }
                    }
                }
            });
            resetDescription();
        }

        /**
         * @name save
         * @desc actually save everything
         * @returns {void}
         */
        function save(): void {
            const promises: ng.IPromise<any>[] = [],
                pixelComponents: PixelCommand[] = [],
                metadata = {};

            // name
            // if (scope.editProject.name.new !== scope.editProject.name.old) {
            //     pixelComponents.push({
            //         type: 'Pixel',
            //         components: [
            //             `ChangeAppName(project=["${scope.editProject.project.project_id}"], name=["${scope.editProject.name.new}"])`
            //         ],
            //         terminal: true
            //     });
            // }

            // description
            if (
                scope.editProject.description.new !==
                scope.editProject.description.old
            ) {
                metadata['description'] = scope.editProject.description.new;
            }
            // tags
            if (
                JSON.stringify(scope.editProject.tags.new) !==
                JSON.stringify(scope.editProject.tags.old)
            ) {
                metadata['tag'] = scope.editProject.tags.new;
                scope.editProject.project.tag = scope.editProject.tags.new;
            }
            if (Object.keys(metadata).length > 0) {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [
                        `SetProjectMetadata(project=["${
                            scope.editProject.project.project_id
                        }"], meta=[${JSON.stringify(metadata)}]);`,
                    ],
                    terminal: true,
                });
            }

            // file
            const file = scope.editProject.image.file
                ? scope.editProject.image.file
                : undefined;
            if (file) {
                promises.push(
                    monolithService.uploadProjectImage(
                        scope.editProject.project.project_id,
                        file
                    )
                );
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
                            text: 'Successfully updated project.',
                        });

                        // update with the new information
                        scope.editProject.project.project_name =
                            scope.editProject.name.new;

                        // description
                        scope.editProject.project.description =
                            scope.editProject.description.new;

                        // tags
                        scope.editProject.project.tags =
                            scope.editProject.tags.new;

                        // image
                        if (file) {
                            // tag the app as updated image so we can refresh it next time we get it
                            semossCoreService.setOptions(
                                'imageUpdates',
                                scope.editProject.project.project_id,
                                semossCoreService.app.generateProjectImageURL(
                                    scope.editProject.project.project_id
                                ) +
                                    '?time=' +
                                    new Date().getTime()
                            );
                            scope.editProject.project.image = file;

                            // TODO: Fix hack.....
                            semossCoreService.emit('update-app');
                        }

                        reset();
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error || 'Error updating project.',
                        });
                    }
                );
            }

            // close the model
            scope.editProject.open = false;
        }

        /**
         * @name cancel
         * @desc do not save things
         */
        function cancel(): void {
            scope.editProject.open = false;
        }

        /** Image */

        /**
         * @name deleteProjectImage
         * @desc delete the app image
         * @returns {void}
         */
        function deleteProjectImage(): void {
            monolithService
                .deleteProjectImage(scope.editProject.project.project_id)
                .then((response) => {
                    // scope.editProject.project.last_project_image_timestamp = response.last_project_image_timestamp;
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Project image has been deleted.',
                    });
                    scope.editProject.image.file = null;
                    // tag the app as updated image so we can refresh it next time we get it
                    semossCoreService.setOptions(
                        'imageUpdates',
                        scope.editProject.project.project_id,
                        semossCoreService.app.generateProjectImageURL(
                            scope.editProject.project.project_id
                        ) +
                            '?time=' +
                            new Date().getTime()
                    );
                    scope.editProject.image.src =
                        semossCoreService.getOptions('imageUpdates')[
                            scope.editProject.project.project_id
                        ];
                    semossCoreService.emit('update-app');
                });
        }

        /**
         * @name openDescriptionScreen
         * @desc opens the screen that auto generates descriptions
         */
        function openDescriptionScreen(): void {
            scope.editProject.showDescriptionScreen = true;
        }

        /**
         * @name getDescriptions
         * @desc called to auto generate descriptions
         */
        function getDescriptions(): void {
            const message = semossCoreService.utility.random('execute-pixel');
            scope.editProject.loadingDesc = true;
            scope.editProject.callbackMessage = message;

            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;
                scope.editProject.loadingDesc = false;
                scope.editProject.callbackMessage = '';
                if (type.indexOf('ERROR') > -1) {
                    scope.editProject.generatedDescriptions = [];
                    return;
                }
                scope.editProject.generatedDescriptions = output;
                scope.editProject.selectedDesc = output[0];
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'generateDescription',
                        components: [
                            'app',
                            scope.editProject.project.project_id,
                            '',
                            scope.editProject.numDesc,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name submitDescription
         * @desc sets the description using the selected generated description;
         */
        function submitDescription(): void {
            scope.editProject.description.new = scope.editProject.selectedDesc;
            resetDescription();
        }

        /**
         * @name resetDescription
         * @desc resets the values for generating descriptions
         * @param goBack - if true, will take user to original edit app screen
         */
        function resetDescription(goBack = true): void {
            if (goBack) {
                scope.editProject.showDescriptionScreen = false;
            }
            // Reset fields and results
            scope.editProject.loadingDesc = false;
            scope.editProject.generatedDescriptions = [];
            scope.editProject.selectedDesc = '';
            scope.editProject.numDesc = 1;

            // Cancel previous callback response if in the middle of another call
            if (scope.editProject.callbackMessage.length) {
                semossCoreService.off(scope.editProject.callbackMessage);
                scope.editProject.callbackMessage = '';
            }
        }

        /**
         * @name descriptionChanged
         * @desc Called when the textarea is focused or changed.
         * Syncs the selectedDesc so that the textarea and radio button stay in sync.
         * @param desc - the description filled in the textarea
         */
        function descriptionChanged(desc: string): void {
            scope.editProject.selectedDesc = desc;
        }

        /**
         * @name checkPackages
         * @desc checks to see if the required R packages for generating descriptions are installed
         */
        function checkPackages(): void {
            const installedPackages =
                semossCoreService.getWidgetState('installedPackages');
            if (installedPackages) {
                if (installedPackages.hasOwnProperty('R')) {
                    if (installedPackages.R.indexOf('gpt2') > -1) {
                        scope.editProject.packagesInstalled = true;
                    }
                }
            }
        }

        /** Utility */
        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            reset();
            checkPackages();

            scope.$watch(
                function () {
                    return (
                        JSON.stringify(scope.editProject.project) +
                        '_' +
                        scope.editProject.open
                    );
                },
                function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        reset();
                        checkPackages();
                    }
                }
            );

            // listeners
            scope.$on('$destroy', function () {
                console.log('destroying editProject....');
            });
        }

        initialize();
    }
}
