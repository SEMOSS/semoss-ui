'use strict';

import { SOCIAL } from '@/core/constants.js';

import './pipeline-social.scss';

export default angular
    .module('app.pipeline.pipeline-social', [])
    .directive('pipelineSocial', pipelineSocialDirective);

pipelineSocialDirective.$inject = [
    'monolithService',
    '$timeout',
    'semossCoreService',
];

function pipelineSocialDirective(monolithService, $timeout, semossCoreService) {
    pipelineSocialCtrl.$inject = [];
    pipelineSocialLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^pipelineComponent'],
        template: require('./pipeline-social.directive.html'),
        scope: {},
        bindToController: {
            provider: '@',
        },
        controllerAs: 'pipelineSocial',
        controller: pipelineSocialCtrl,
        link: pipelineSocialLink,
    };

    function pipelineSocialCtrl() {}

    function pipelineSocialLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.pipelineSocial.logOut = logOut;
        scope.pipelineSocial.previewFile = previewFile;
        scope.pipelineSocial.importFileData = importFileData;
        scope.pipelineSocial.getFileHeaders = getFileHeaders;
        scope.pipelineSocial.setFrame = setFrame;
        scope.pipelineSocial.updateFrame = updateFrame;
        scope.pipelineSocial.selectService = selectService;
        scope.pipelineSocial.validateFrameName = validateFrameName;

        scope.pipelineSocial.services = [];

        scope.pipelineSocial.selectedService = {};

        scope.pipelineSocial.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };

        /**
         * @name intializeVars
         * @desc sets the variables to use in this directie
         * @returns {void}
         */
        function initializeVars() {
            scope.pipelineSocial.userInfo = {
                name: '',
                picture: '',
            };
            scope.pipelineSocial.files = {
                list: [],
                selected: '',
            };
        }

        /**
         * @name setFrameData
         * @desc set the frame type
         * @return {void}
         */
        function setFrameData() {
            scope.pipelineSocial.frameType =
                scope.widgetCtrl.getOptions('initialFrameType');
        }

        /**
         * @name setFrame
         * @param {string} frame - frame
         * @desc set the frame type
         * @return {void}
         */
        function setFrame(frame) {
            scope.widgetCtrl.setOptions('initialFrameType', frame);
        }

        /**
         * @name updateFrame
         * @param {string} frame - frame
         * @desc update the frame type
         * @return {void}
         */
        function updateFrame(frame) {
            scope.widgetCtrl.setOptions('initialFrameType', frame);
        }

        /**
         * @name logOut
         * @desc logs out
         * @returns {void}
         */
        function logOut() {
            scope.widgetCtrl.emit('oauth-logout', {
                provider: scope.pipelineSocial.selectedService.value,
            });

            initializeVars();
        }

        /**
         * @name getFiles
         * @desc get the list of files
         * @returns {void}
         */
        function getFiles() {
            var pixelComponents = [],
                callback;

            if (scope.pipelineSocial.selectedService.value === 'google') {
                pixelComponents = [
                    {
                        meta: true,
                        type: 'googleListFiles',
                        components: [],
                        terminal: true,
                    },
                ];
            } else if (
                scope.pipelineSocial.selectedService.value === 'dropbox'
            ) {
                pixelComponents = [
                    {
                        meta: true,
                        type: 'dropBoxListFiles',
                        components: [],
                        terminal: true,
                    },
                ];
            } else if (scope.pipelineSocial.selectedService.value === 'ms') {
                pixelComponents = [
                    {
                        meta: true,
                        type: 'oneDriveListFiles',
                        components: [],
                        terminal: true,
                    },
                ];
            }

            if (pixelComponents.length === 0) {
                return;
            }

            callback = function (response) {
                scope.pipelineSocial.files.list =
                    response.pixelReturn[0].output;
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name previewFile
         * @desc toggle preview show/hide
         * @param {boolean} alert - message on errors
         * @returns {void}
         */
        function previewFile(alert) {
            var parameters = {},
                valid = true;

            if (!scope.pipelineSocial.selectedService.value) {
                if (alert) {
                    scope.widgetCtrl.alert('warn', 'Please select a provider.');
                }
                valid = false;
            }

            if (!scope.pipelineSocial.files.selected) {
                if (alert) {
                    scope.widgetCtrl.alert('warn', 'Please select a file.');
                }
                valid = false;
            }

            if (valid) {
                parameters = buildParameters();
            }

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name getFileHeaders
         * @param {*} file the selected file
         * @desc get the headers for the selected file
         * @returns {void}
         */
        function getFileHeaders(file) {
            if (file) {
                // TODO: run the pixel to get the headers from the file
            }
            scope.pipelineSocial.customFrameName.name =
                scope.pipelineComponentCtrl.createFrameName(
                    scope.pipelineSocial.files.selected.name
                );
            validateFrameName();
            previewFile(false);
        }

        /**
         * @name buildParameters
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters() {
            console.error(
                'GIVE SOCIAL ITS OWN QUERY_STRUCT TYPE AND FILL IN THE MISSING PARAMETERS'
            );

            return {
                IMPORT_FRAME: {
                    name:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.name'
                        ) || scope.pipelineSocial.customFrameName.name,
                    type:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.type'
                        ) || scope.widgetCtrl.getOptions('initialFrameType'),
                    override: true,
                },
                QUERY_STRUCT: {
                    qsType: 'SOCIAL',
                    fileName: scope.pipelineSocial.files.selected.name,
                    fileId: scope.pipelineSocial.files.selected.id,
                    fileType: scope.pipelineSocial.files.selected.type,
                    filePath: scope.pipelineSocial.files.selected.path,
                    provider: scope.pipelineSocial.selectedService.value,
                },
            };
        }

        /**
         * @name importFileData
         * @param {boolean} visualize if true visualize frame
         * @desc makes the pixel call to get the data and import it
         * @returns {void}
         */
        function importFileData(visualize) {
            let parameters, callback;

            if (!scope.pipelineSocial.selectedService.value) {
                scope.widgetCtrl.alert('warn', 'Please select a provider.');
                return;
            }

            if (!scope.pipelineSocial.files.selected) {
                scope.widgetCtrl.alert('warn', 'Please select a file.');
                return;
            }

            parameters = buildParameters();

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                {},
                callback
            );
        }

        /**
         * @name getUserInfo
         * @param {string} provider name of the provider
         * @desc grab the user info from the BE
         * @returns {void}
         */
        function getUserInfo() {
            monolithService
                .getUserInfo(scope.pipelineSocial.selectedService.value)
                .then(function (response) {
                    scope.pipelineSocial.userInfo = {
                        name: response.name,
                        picture:
                            response.picture ||
                            require('images/profilePic.png'),
                    };
                });
        }

        /**
         * @name selectService
         * @desc select options for the second step
         * @returns {void}
         */
        function selectService() {
            var message = semossCoreService.utility.random('login');

            if (
                scope.pipelineSocial.selectedService.value === 'google' ||
                scope.pipelineSocial.selectedService.value === 'dropbox' ||
                scope.pipelineSocial.selectedService.value === 'ms'
            ) {
                scope.pipelineSocial.loggedIn = false;
                scope.widgetCtrl.once(message, function (payload) {
                    if (payload.success) {
                        $timeout(function () {
                            // force digest
                            scope.pipelineSocial.dataFrameType =
                                scope.widgetCtrl.getOptions('initialFrameType');
                            scope.pipelineSocial.loggedIn = true;
                            initializeVars();
                            getUserInfo();
                            getFiles();
                        });
                    } else {
                        console.log('login failed');
                    }
                });

                scope.widgetCtrl.emit('oauth-login', {
                    provider: scope.pipelineSocial.selectedService.value,
                    message: message,
                    widgetId: scope.widgetCtrl.widgetId,
                });
            }
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         * @returns {void}
         */
        function validateFrameName() {
            let results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineSocial.customFrameName.name
            );
            scope.pipelineSocial.customFrameName.valid = results.valid;
            scope.pipelineSocial.customFrameName.message = results.message;
        }

        /**
         * @name initalize
         * @returns {void}
         */
        function initialize() {
            // set the initial service

            // TODO: customFrameName.name is not set anywhere in this directive when the frame is initialized ... is this a problem?
            var social, serviceIdx, serviceLen, service;

            // all of the options
            scope.pipelineSocial.services = [];
            for (social in SOCIAL) {
                if (SOCIAL.hasOwnProperty(social)) {
                    scope.pipelineSocial.services.push({
                        display: String(SOCIAL[social].name).replace(/_/g, ' '),
                        value: SOCIAL[social].provider,
                        image: SOCIAL[social].image,
                    });
                }
            }

            if (scope.pipelineSocial.provider) {
                for (
                    serviceIdx = 0,
                        serviceLen = scope.pipelineSocial.services.length;
                    serviceIdx < serviceLen;
                    serviceIdx++
                ) {
                    if (
                        scope.pipelineSocial.services[serviceIdx].value ===
                        scope.pipelineSocial.provider
                    ) {
                        service = scope.pipelineSocial.services[serviceIdx];
                        break;
                    }
                }
            }

            if (!service) {
                service = scope.pipelineSocial.services[0];
            }

            scope.pipelineSocial.selectedService = service;

            // set the initial service
            selectService();
            setFrameData();
        }

        initialize();
    }
}
