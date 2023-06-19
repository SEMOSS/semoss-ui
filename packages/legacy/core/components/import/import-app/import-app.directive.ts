import angular from 'angular';
import './import-app.scss';

export default angular
    .module('app.import-app.directive', [])
    .directive('importApp', importAppDirective);

importAppDirective.$inject = ['monolithService', 'semossCoreService'];

function importAppDirective(
    monolithService: MonolithService,
    semossCoreService: SemossCoreService
) {
    importAppController.$inject = [];
    importAppLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importAppController,
        bindToController: {},
        controllerAs: 'importApp',
        link: importAppLink,
        template: require('./import-app.directive.html'),
    };

    function importAppController() {}

    function importAppLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importApp.validateFile = validateFile;
        scope.importApp.removeFile = removeFile;
        scope.importApp.uploadApp = uploadApp;

        scope.importApp.uploadedFile = {
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
            scope.importCtrl.alert('error', 'Must be a ZIP file (.zip)');
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
         * @name uploadApp
         * @desc Will upload the file, then import the app
         */
        function uploadApp(): void {
            const jobId = semossCoreService.get('queryInsightID');
            scope.importApp.loadedFile = [];

            semossCoreService.emit('start-polling', {
                id: jobId,
                listeners: [jobId],
            });

            monolithService
                .uploadFile(scope.importApp.rawFiles.files, jobId)
                .then(
                    function (data) {
                        try {
                            scope.importApp.uploadedFile.path =
                                data[0].fileLocation;
                            scope.importApp.uploadedFile.name =
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

        /**
         * @name importApp
         * @desc will use the uploaded file to import the app
         */
        function importApp(): void {
            const callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert(
                        'error',
                        'Unable to connect to ' + response.pixelReturn[0].output
                    );

                    return;
                }

                scope.importCtrl.alert('success', 'Database Uploaded');
                scope.importCtrl.exit(output);
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'uploadDatabaseRepo',
                        components: [scope.importApp.uploadedFile.name],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {}

        initialize();
    }
}
