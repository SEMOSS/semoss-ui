'use strict';

/**
 * @name createTemplate
 * @desc Create a new template
 */
export default angular
    .module('app.create-template.directive', [])
    .directive('createTemplate', createTemplateDirective);

import './create-template.scss';

createTemplateDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$timeout',
];

function createTemplateDirective(monolithService, semossCoreService) {
    createTemplateDirectiveCtrl.$inject = [];
    createTemplateDirectiveLink.$inject = ['scope'];

    return {
        restrict: 'E',
        controller: createTemplateDirectiveCtrl,
        link: createTemplateDirectiveLink,
        template: require('./create-template.directive.html'),
        bindToController: {
            appId: '=',
            loadingId: '=',
            activeTemplate: '=',
            templatesList: '=',
            onClose: '&?',
            onHide: '&?',
            open: '=',
        },
        controllerAs: 'createTemplate',
    };

    function createTemplateDirectiveCtrl() {}

    function createTemplateDirectiveLink(scope) {
        scope.createTemplate.current = {
            new: true,
            name: '',
        };

        scope.createTemplate.isTemplateInvalid = isTemplateInvalid;
        scope.createTemplate.cancelTemplate = cancelTemplate;
        scope.createTemplate.saveTemplate = saveTemplate;
        scope.createTemplate.removeFile = removeFile;
        scope.createTemplate.checkFileExtension = checkFileExtension;
        /**
         * @name updateTemplate
         * @desc update the template
         * @returns {void}
         */
        function updateTemplate() {
            scope.createTemplate.current = {
                new: scope.createTemplate.activeTemplate ? false : true,
                name:
                    scope.createTemplate.activeTemplate &&
                    scope.createTemplate.activeTemplate.templateName
                        ? scope.createTemplate.activeTemplate.templateName
                        : '',
            };

            // clear the files if possible
            if (scope.createTemplate.fileData) {
                scope.createTemplate.fileData.files = [];
            }
        }

        /**
         * @name isTemplateInvalid
         * @desc determines if template is missing information so submit button can be deactivated
         * @return {boolean} true if template is invalid
         */
        function isTemplateInvalid() {
            if (
                !scope.createTemplate.current.name ||
                !scope.createTemplate.fileData ||
                scope.createTemplate.fileData.files.length === 0
            ) {
                return true;
            }

            return false;
        }

        /**
         * @name cancelTemplate
         * @desc cancel the create template panel
         * @return {void}
         */
        function cancelTemplate() {
            if (scope.createTemplate.onClose) {
                scope.createTemplate.onClose({
                    isCreated: false,
                });
            }
        }

        /**
         * @name saveTemplate
         * @desc save the template panel
         * @return {void}
         */
        function saveTemplate() {
            if (isTemplateInvalid()) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Please provide template name and upload the file',
                });

                return;
            }

            const loadingId =
                    scope.createTemplate.loadingId ||
                    semossCoreService.get('queryInsightID'),
                path = 'version/assets/template';  

            // start the file upload
            semossCoreService.emit('start-polling', {
                id: loadingId,
                listeners: [loadingId],
            });

            monolithService
                .uploadFile(
                    scope.createTemplate.fileData.files,
                    loadingId,
                    scope.createTemplate.appId,
                    path
                )
                .then(
                    function (data) {
                        try {
                            // Upload file service returns the file location which then is passed to create/edit template
                            const location = data[0].fileLocation;

                            if (location) {
                                const message =
                                    semossCoreService.utility.random(
                                        'query-pixel'
                                    );
                                semossCoreService.once(
                                    message,
                                    function (response) {
                                        const type =
                                                response.pixelReturn[0]
                                                    .operationType[0],
                                            output =
                                                response.pixelReturn[0].output;

                                        if (type.indexOf('ERROR') > -1) {
                                            semossCoreService.emit('alert', {
                                                color: 'error',
                                                text: output,
                                            });
                                            return;
                                        }

                                        if (scope.createTemplate.onClose) {
                                            scope.createTemplate.onClose({
                                                isCreated: true,
                                                templateName:
                                                    scope.createTemplate.current
                                                        .name,
                                            });
                                        }
                                    }
                                );
                                // Runs pixel query to add or edit a template based on scope.createTemplate.current.new flag
                                semossCoreService.emit('query-pixel', {
                                    commandList: [
                                        {
                                            type: scope.createTemplate.current
                                                .new
                                                ? 'addTemplate'
                                                : 'updateTemplate',
                                            components: [
                                                scope.createTemplate.appId,
                                                scope.createTemplate.current
                                                    .name,
                                                location,
                                            ],
                                            meta: true,
                                            terminal: true,
                                        },
                                    ],
                                    listeners: [],
                                    response: message,
                                });
                            }
                        } catch (error) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: 'An error occurred.',
                            });
                        } finally {
                            semossCoreService.emit('stop-polling', {
                                id: loadingId,
                                listeners: [loadingId],
                            });
                        }
                    },
                    function () {
                        semossCoreService.emit('stop-polling', {
                            id: loadingId,
                            listeners: [loadingId],
                        });
                    }
                );
        }

        /**
         * @name removeFile
         * @desc set the fileType data
         * @param {any} file the file to remove
         * @return {void}
         */
        function removeFile(file) {
            if (file.hasOwnProperty('placeholder')) {
                scope.createTemplate.fileData.files = [];
                scope.createTemplate.qsComponent = false;
            } else {
                file.cancel();
            }
        }

        /**
         * @name checkFileExtension
         * @param {file} file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns {boolean} - checks wether it is an acceptable file
         */
        function checkFileExtension(file) {
            let fileExtension = getFileExtension(file);

            if (fileExtension) {
                return true;
            }
            semossCoreService.emit('alert', {
                color: 'error',
                text: 'File must be .xlsx or .csv',
            });

            return false;
        }

        /**
         * @name getFileExtension
         * @param {file|string} file - flow file
         * @desc gets the file extension type
         * @returns {*} - gets the file type from the extension
         */
        function getFileExtension(file) {
            var fileExtension;

            if (!file) {
                return 'not a file';
            }
            if (typeof file === 'string') {
                fileExtension = file.substr(file.lastIndexOf('.') + 1);
            } else {
                fileExtension = file.getExtension();
            }

            if (fileExtension === 'xlsx') {
                return 'excel';
            } else if (fileExtension === 'csv') {
                return 'csv';
            }

            return false;
        }

        /**
         * @name initialize
         * @desc intialize function
         * @returns {void}
         */
        function initialize() {
            scope.$watch(
                'createTemplate.activeTemplate',
                function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        updateTemplate();
                    }
                }
            );

            // update the template when it opens
            updateTemplate();
        }

        initialize();
    }
}
