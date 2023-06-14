import angular from 'angular';

import './create-project.scss';

export default angular
    .module('app.create-project.directive', [])
    .directive('createProject', createProjectDirective);

createProjectDirective.$inject = ['monolithService', 'semossCoreService'];

interface FileLikeBlob extends Blob {
    name: string;
    lastModified: Date;
    lastModifiedDate: number;
}

function createProjectDirective(monolithService, semossCoreService) {
    createProjectCtrl.$inject = ['$scope'];
    createProjectLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {},
        controller: createProjectCtrl,
        controllerAs: 'createProject',
        bindToController: {
            open: '=',
            projects: '=',
            callback: '<?',
        },
        template: require('./create-project.directive.html'),
        link: createProjectLink,
    };

    function createProjectCtrl() {}

    function createProjectLink(scope) {
        scope.createProject.newProj = {
            title: '',
            error: '',
            tags: [],
            description: '',
            visibility: 'true',
            image: {
                url: '',
                name: '',
                title: '',
                file: null,
            },
        };
        scope.createProject.tempFile = null;

        scope.createProject.validateNewApp = validateNewApp;
        scope.createProject.executeSave = executeSave;
        scope.createProject.addImage = addImage;
        scope.createProject.removeImage = removeImage;
        scope.createProject.setFile = setFile;
        scope.createProject.removeFile = removeFile;
        scope.createProject.disableSubmitButton = false;

        /**Images*/

        /**
         * Make a blob look more file like
         *
         * @param {Blob} blob
         * @return {Blob}
         */
        function createFileLikeBlob(blob): FileLikeBlob {
            blob.name = scope.createProject.tempFile.name;
            blob.lastModified = Date.now();
            blob.lastModifiedDate = new Date();

            return blob;
        }

        /**
         * Adds cropped image to the UI
         *
         * @param {HTMLCanvasElement} image
         */
        function addImage(image: HTMLCanvasElement): void {
            image.toBlob((blob) => {
                scope.createProject.newProj.image.url =
                    URL.createObjectURL(blob);
                scope.createProject.newProj.image.file =
                    createFileLikeBlob(blob);

                removeFile();
            }, scope.createProject.tempFile.type);
        }

        /**
         * Remove current uploaded image
         */
        function removeImage(): void {
            scope.createProject.newProj.image = {
                url: '',
                name: '',
                title: '',
                file: null,
            };
        }

        /**
         * Set reference to currently uploaded file
         *
         * @param {File} file
         */
        function setFile(file: File): void {
            scope.createProject.tempFile = file;
        }

        /**
         * Remove current uploaded file
         */
        function removeFile(): void {
            scope.createProject.tempFile = null;
        }

        /** Actions */

        /**
         * @name validateNewApp
         * @desc check if the databasename is valid
         * @returns {void}
         */
        function validateNewApp(): void {
            const name = String(scope.createProject.newProj.title);

            scope.createProject.newProj.error = '';

            if (!name) {
                scope.createProject.newProj.error = 'required';
                return;
            }

            // return false if special characters, true otherwise
            if (name.match(/[@.*+?&^$%{}()";|[\]\\]/g)) {
                scope.createProject.newProj.error = 'special';
                return;
            }

            const cleaned = name.toUpperCase();

            if (scope.createProject.projects) {
                // see if project name exists
                for (
                    let appIdx = 0,
                        appLen = scope.createProject.projects.length;
                    appIdx < appLen;
                    appIdx++
                ) {
                    if (
                        scope.createProject.projects[
                            appIdx
                        ].project_name.toUpperCase() === cleaned
                    ) {
                        scope.createProject.newProj.error = 'exists';
                        break;
                    }
                }
            }
        }

        /**
         * @name executeSave
         * @desc saves visualization based on save type
         */
        function executeSave(): void {
            scope.createProject.disableSubmitButton = true;
            const components: any[] = [],
                projTitle = String(scope.createProject.newProj.title).replace(
                    / /g,
                    '_'
                ),
                metadata = {};

            // create the project with its name
            components.push({
                type: 'Pixel',
                components: [`projectVar = CreateProject("${projTitle}")`],
                terminal: true,
                meta: true,
            });

            if (scope.createProject.newProj.description) {
                metadata['description'] =
                    scope.createProject.newProj.description;
            }
            if (
                scope.createProject.newProj.tags &&
                scope.createProject.newProj.tags.length > 0
            ) {
                metadata['tag'] = scope.createProject.newProj.tags;
            }
            if (Object.keys(metadata).length > 0) {
                components.push({
                    type: 'Pixel',
                    components: [
                        `SetProjectMetadata(project=[projectVar], meta=[${JSON.stringify(
                            metadata
                        )}]);`,
                    ],
                    terminal: true,
                });
            }

            const callbackResponse = function (response: PixelReturnPayload) {
                scope.createProject.disableSubmitButton = false;
                const projId = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Error creating project.',
                    });
                    return;
                }

                executeSaveDetails(projId.project_id);
                // close the menu
                scope.createProject.callback(true, projId, projTitle);
            };

            execute(components, callbackResponse); // create the project
        }

        /**
         * @name executeSaveDetails
         * @desc saves description, tags, and image (if provided)
         */
        function executeSaveDetails(projId): void {
            // image
            if (scope.createProject.newProj.image.file) {
                // project image was uploaded
                monolithService
                    .uploadProjectImage(
                        projId,
                        scope.createProject.newProj.image.file
                    )
                    .then(
                        function () {
                            // replace default image with uploaded imag
                        },
                        function (error) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: error || 'Error adding project image.',
                            });
                        }
                    );
            }
        }

        /**
         * @name execute
         * @param commandList - components to run
         * @param callback - callback to trigger when done
         * @param  listeners - listeners for the execute-pixel (loading screens)
         * @desc execute a pixel
         */
        function execute(
            commandList: PixelCommand[],
            callback: (response: any) => void
        ): void {
            let payload;

            payload = {
                commandList: commandList,
            };

            if (callback) {
                const message =
                    semossCoreService.utility.random('execute-pixel');
                semossCoreService.once(message, callback);

                payload.responseObject = {
                    response: message,
                    payload: {},
                };
            }

            semossCoreService.emit('execute-pixel', payload);
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc initializes the createProject directive
         * @returns {void}
         */
        function initialize(): void {
            if (!scope.createProject.open) {
                return;
            }
            scope.$watch('createProject.open', function () {
                // wait until image url has been initialized
                if (!scope.createProject.open) {
                    return;
                }
            });
        }

        initialize();
    }
}
