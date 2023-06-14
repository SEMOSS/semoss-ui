'use strict';

import { CONNECTORS, PREVIEW_LIMIT } from '@/core/constants.js';

import './pipeline-external.scss';

export default angular
    .module('app.pipeline.pipeline-external', [])
    .directive('pipelineExternal', pipelineExternalDirective);

pipelineExternalDirective.$inject = [];

function pipelineExternalDirective() {
    pipelineExternalCtrl.$inject = [];
    pipelineExternalLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-external.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineExternalCtrl,
        controllerAs: 'pipelineExternal',
        bindToController: {
            driver: '@',
        },
        link: pipelineExternalLink,
    };

    function pipelineExternalCtrl() {}

    function pipelineExternalLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.pipelineExternal.frameType = undefined;
        scope.pipelineExternal.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };

        scope.pipelineExternal.drivers = [];
        scope.pipelineExternal.inputs = [];
        scope.pipelineExternal.connection = {
            name: '',
            img: '',
            driver: '',
            type: '',
            url: '',
            direct: false,
            string: '',
            query: '',
        };

        scope.pipelineExternal.updateFrame = updateFrame;
        scope.pipelineExternal.updateExternal = updateExternal;
        scope.pipelineExternal.buildExternal = buildExternal;
        scope.pipelineExternal.previewExternal = previewExternal;
        scope.pipelineExternal.importExternal = importExternal;
        scope.pipelineExternal.validateFrameName = validateFrameName;

        /**
         * @name setFrameData
         * @desc set the frame type
         * @return {void}
         */
        function setFrameData() {
            scope.pipelineExternal.frameType =
                scope.widgetCtrl.getOptions('initialFrameType');
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
         * @name setExternal
         * @desc set the initial data
         * @returns {void}
         */
        function setExternal() {
            // all of the options
            scope.pipelineExternal.drivers = [];
            for (let connector in CONNECTORS) {
                if (CONNECTORS.hasOwnProperty(connector)) {
                    scope.pipelineExternal.drivers.push({
                        display: String(CONNECTORS[connector].name).replace(
                            /_/g,
                            ' '
                        ),
                        value: CONNECTORS[connector].driver,
                        image: CONNECTORS[connector].image,
                    });
                }
            }

            // if there is a qsComponent and it is valid, we will use that
            const qsComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.QUERY_STRUCT.value'
            );

            if (qsComponent && qsComponent.config) {
                const config = qsComponent.config;

                // set the driver
                if (config && config.hasOwnProperty('dbDriver')) {
                    scope.pipelineExternal.driver = config.dbDriver;
                }
            }

            // validate that the driver is possible
            if (!CONNECTORS.hasOwnProperty(scope.pipelineExternal.driver)) {
                scope.pipelineExternal.driver = false;
            }

            // select one if there is nothing selected
            if (!scope.pipelineExternal.driver) {
                scope.pipelineExternal.driver =
                    scope.pipelineExternal.drivers[0].value;
            }

            // set the input + options
            updateExternal();

            // use the qs to set the inputs
            if (qsComponent && qsComponent.query) {
                scope.pipelineExternal.connection.query = qsComponent.query;
            }

            if (qsComponent && qsComponent.config) {
                const config = qsComponent.config;

                if (config.hasOwnProperty('CONNECTION_URL')) {
                    scope.pipelineExternal.connection.direct = true;
                    scope.pipelineExternal.connection.string =
                        config.CONNECTION_URL;
                } else {
                    // set the inputs
                    for (
                        let inputIdx = 0,
                            inputLen = scope.pipelineExternal.inputs.length;
                        inputIdx < inputLen;
                        inputIdx++
                    ) {
                        const input = scope.pipelineExternal.inputs[inputIdx];

                        // set the value based on the input
                        if (config.hasOwnProperty(input.alias)) {
                            input.value = config[input.alias];
                        }
                    }
                }
            }
        }

        /**
         * @name updateExternal
         * @desc update the external data
         * @return {void}
         */
        function updateExternal() {
            const connector = CONNECTORS[scope.pipelineExternal.driver];

            scope.pipelineExternal.connection.name = connector.name;
            scope.pipelineExternal.connection.image = connector.image;
            scope.pipelineExternal.connection.driver = connector.driver;
            scope.pipelineExternal.connection.type = connector.type;
            scope.pipelineExternal.connection.url = connector.url;

            // set the inputs
            scope.pipelineExternal.inputs = [];

            if (CONNECTORS[scope.pipelineExternal.driver].inputs) {
                for (
                    let inputIdx = 0,
                        inputLen =
                            CONNECTORS[scope.pipelineExternal.driver].inputs
                                .length;
                    inputIdx < inputLen;
                    inputIdx++
                ) {
                    const input =
                        CONNECTORS[scope.pipelineExternal.driver].inputs[
                            inputIdx
                        ];

                    scope.pipelineExternal.inputs.push({
                        display: input.display,
                        visible: true,
                        value: input.defaultValue,
                        required: input.required,
                        description: input.description,
                        secret: input.secret || false,
                        alias: input.alias,
                    });
                }
            }

            // set the frame
            scope.pipelineExternal.customFrameName.name =
                scope.pipelineComponentCtrl.createFrameName(
                    scope.pipelineExternal.connection.driver
                );
            validateFrameName();

            // build the string
            buildExternal();
        }

        /**
         * @name buildExternal
         * @desc build the external connection string
         * @returns {void}
         */
        function buildExternal() {
            let connectionString = scope.pipelineExternal.connection.url;

            // loop through all of the inputs required for this connector
            for (
                let inputIdx = 0,
                    inputLen = scope.pipelineExternal.inputs.length;
                inputIdx < inputLen;
                inputIdx++
            ) {
                const input = scope.pipelineExternal.inputs[inputIdx];

                if (input.value) {
                    connectionString = connectionString.replace(
                        '<' + input.alias + '>',
                        input.value
                    );
                }
            }

            scope.pipelineExternal.connection.string = connectionString;
        }

        /**
         * @name validateExternal
         * @desc validate the connection form is valid
         * @return {boolean} is the connection valid or not?
         */
        function validateExternal() {
            if (!scope.pipelineExternal.connection.direct) {
                for (
                    let inputIdx = 0,
                        inputLen = scope.pipelineExternal.inputs.length;
                    inputIdx < inputLen;
                    inputIdx++
                ) {
                    const input = scope.pipelineExternal.inputs[inputIdx];

                    if (input.required && !input.value) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Missing ' +
                                input.display +
                                '. Please enter a value.'
                        );
                        return false;
                    }
                }
            } else if (!scope.pipelineExternal.connection.string) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Missing Connection String. Please enter a value.'
                );
                return false;
            }

            if (!scope.pipelineExternal.connection.query) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Missing Query. Please enter a value.'
                );
                return false;
            }

            return true;
        }

        /**
         * @name previewExternal
         * @desc preview the external
         * @returns {void}
         */
        function previewExternal() {
            let parameters = {},
                valid = true;

            if (!validateExternal()) {
                valid = false;
            }

            if (valid) {
                parameters = buildParameters(true);
            }
            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name importExternal
         * @param {boolean} visualize 0 if true visualize frame
         * @desc import the query
         * @returns {void}
         */
        function importExternal(visualize) {
            let parameters, callback;

            if (!validateExternal()) {
                return;
            }

            parameters = buildParameters();

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                {
                    name: scope.pipelineExternal.connection.name,
                    icon: scope.pipelineExternal.connection.image,
                },
                callback
            );
        }

        /**
         * @name buildParameters
         * @param {boolean} preview - true if coming from preview
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(preview) {
            const config = {
                dbDriver: scope.pipelineExternal.connection.driver,
            };

            if (scope.pipelineExternal.connection.direct) {
                config.CONNECTION_URL =
                    scope.pipelineExternal.connection.string;
            } else {
                // see if there is a username of password field. if so, we will need to pass into the pixel component
                for (
                    let inputIdx = 0,
                        inputLen = scope.pipelineExternal.inputs.length;
                    inputIdx < inputLen;
                    inputIdx++
                ) {
                    const input = scope.pipelineExternal.inputs[inputIdx];

                    // add the input
                    config[input.alias] = input.value;
                }
            }

            return {
                IMPORT_FRAME: {
                    name:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.name'
                        ) || scope.pipelineExternal.customFrameName.name,
                    type:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.type'
                        ) || scope.widgetCtrl.getOptions('initialFrameType'),
                    override: true,
                },
                QUERY_STRUCT: {
                    qsType: 'RAW_JDBC_ENGINE_QUERY',
                    limit: preview ? PREVIEW_LIMIT : -1,
                    config: config,
                    query: scope.pipelineExternal.connection.query,
                },
            };
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         * @returns {void}
         */
        function validateFrameName() {
            const results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineExternal.customFrameName.name
            );

            scope.pipelineExternal.customFrameName.valid = results.valid;
            scope.pipelineExternal.customFrameName.message = results.message;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            setFrameData();
            setExternal();

            scope.$on('$destroy', function () {});

            scope.pipelineExternal.customFrameName.name =
                scope.pipelineComponentCtrl.createFrameName(
                    scope.pipelineExternal.connection.driver
                );
            validateFrameName();
        }

        initialize();
    }
}
