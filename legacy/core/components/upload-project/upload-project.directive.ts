import angular from 'angular';
import './upload-project.scss';

export default angular
    .module('app.upload-project.directive', [])
    .directive('uploadProject', uploadProjectDirective);

uploadProjectDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$state',
];

function uploadProjectDirective(monolithService, semossCoreService, $state) {
    uploadProjectCtrl.$inject = ['$scope'];
    uploadProjectLink.$inject = ['scope'];

    uploadProjectLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        controller: uploadProjectCtrl,
        controllerAs: 'uploadProject',
        bindToController: {
            open: '=',
            projects: '=',
            callback: '<?',
        },
        template: require('./upload-project.directive.html'),
        link: uploadProjectLink,
    };

    function uploadProjectCtrl() {}

    function uploadProjectLink(scope, ele, attrs, ctrl) {
        scope.uploadProjectCtrl = ctrl[0];
        scope.appId = attrs.appId;
        scope.uploadProject.validateFile = validateFile;
        scope.uploadProject.removeFile = removeFile;
        scope.uploadProject.uploadApp = uploadApp;

        scope.uploadProject.uploadedFile = {
            path: '',
            name: '',
        };

        /**
         * @name validateFile
         * @desc Validates the file extension when the file is drag and dropped
         * @param file - file object
         */
        function validateFile(file: any): boolean {
            if (!file) {
                return false;
            }

            const fileExtension = file.getExtension();

            if (fileExtension === 'zip') {
                return true;
            }

            semossCoreService.emit('alert', {
                color: 'error',
                text: 'Must be a ZIP file (.zip)',
            });

            return false;
        }

        /**
         * @name removeFile
         * @desc Removes a file that was uploaded
         * @param file file to remove
         */
        function removeFile(file): void {
            if (file) {
                file.cancel();
            }
        }

        /**
         * @name importApp
         * @desc will use the uploaded file to import the app
         */
        function importApp(): void {
            const message = semossCoreService.utility.random('query-pixel');
            const commandList = [
                {
                    type: 'uploadProjectRepo',
                    components: [scope.uploadProject.uploadedFile.name],
                    terminal: true,
                },
            ];

            semossCoreService.once(message, function (response) {
                console.log(response);
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: response.pixelReturn[0].output,
                    });

                    return;
                }

                scope.uploadProject.open = false;

                semossCoreService.emit('alert', {
                    color: 'success',
                    text: 'Project Uploaded',
                });

                $state.go('home.landing.project', {
                    projectId: output.project_id,
                });
            });

            semossCoreService.emit('query-pixel', {
                commandList: commandList,
                response: message,
            });
        }

        /**
         * @name uploadApp
         * @desc Will upload the file, then import the app
         */
        function uploadApp(): void {
            const jobId = semossCoreService.get('queryInsightID');
            scope.uploadProject.loadedFile = [];

            semossCoreService.emit('start-polling', {
                id: jobId,
                listeners: [jobId],
            });

            monolithService
                .uploadFile(scope.uploadProject.rawFiles.files, jobId)
                .then(
                    function (data) {
                        try {
                            scope.uploadProject.uploadedFile.path =
                                data[0].fileLocation;
                            scope.uploadProject.uploadedFile.name =
                                data[0].fileName;
                        } finally {
                            semossCoreService.emit('stop-polling', {
                                id: jobId,
                                listeners: [jobId],
                            });
                            importApp();
                        }
                    },
                    function () {
                        semossCoreService.emit('stop-polling', {
                            id: jobId,
                            listeners: [jobId],
                        });
                    }
                );
        }

        function initialize(): void {
            if (!scope.uploadProject.open) {
                return;
            }

            scope.$watch('uploadProject.open', function () {
                // wait until image url has been initialized
                if (!scope.uploadProject.open) {
                    return;
                }
            });
        }

        initialize();
    }
}
