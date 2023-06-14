import angular from 'angular';

import './export-external.scss';

export default angular
    .module('app.export-external.directive', [])
    .directive('exportExternal', exportExternalDirective);

exportExternalDirective.$inject = ['semossCoreService'];

function exportExternalDirective(semossCoreService) {
    exportExternalCtrl.$inject = [];
    exportExternalLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        template: require('./export-external.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'exportExternal',
        bindToController: {},
        controller: exportExternalCtrl,
        link: exportExternalLink,
    };

    function exportExternalCtrl() {}

    function exportExternalLink(scope, ele, attrs, ctrl) {
        let compilerScope;

        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.exportExternal.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.exportExternal.jsons = {};
        scope.exportExternal.types = {
            selected: 'S3',
            list: ['S3', 'S3-Custom'],
        };

        scope.exportExternal.registerCompiler = registerCompiler;
        scope.exportExternal.closeExport = closeExport;
        scope.exportExternal.runExport = runExport;

        /**
         * @name registerCompiler
         * @desc register the compiler to the parent scope
         * @param childScope - the compiler's scope
         */
        function registerCompiler(childScope: any): void {
            compilerScope = childScope;
        }

        /**
         * @name validateCompiler
         * @desc validate the compiler
         * @param alert - message on errors
         * @returns is the query valid?
         */
        function validateCompiler(alert: boolean): boolean {
            let valid = true,
                updated;

            updated = JSON.parse(
                JSON.stringify(
                    scope.exportExternal.jsons[
                        scope.exportExternal.types.selected
                    ]
                )
            );
            for (
                let queryIdx = 0, queryLen = updated.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                const valid = compilerScope.widgetCompiler.validateQuery(
                    queryIdx,
                    updated
                );

                if (!valid) {
                    if (alert) {
                        // alert the user
                        scope.widgetCtrl.alert(
                            'warn',
                            'Options are not valid. Please fix errors before continuing'
                        );
                    }

                    break;
                }
            }

            return valid;
        }

        /**
         * @name getFrameName
         * @param accessor - how do we want to access the frame?
         * @returns {*} frame options
         */
        function getFrame(accessor?: string): any {
            if (scope.exportExternal.PIPELINE) {
                return scope.pipelineComponentCtrl.getComponent(
                    accessor
                        ? 'parameters.FRAME.value.' + accessor
                        : 'parameters.FRAME.value'
                );
            }

            return scope.widgetCtrl.getFrame(accessor);
        }

        /**
         * @name setFrame
         */
        function setFrame(): void {
            if (!getFrame('name')) {
                closeExport();
                return;
            }
        }

        /**
         * @name setExports
         * @desc build export options
         */
        function setExports(): void {
            const regions = [
                {
                    value: 'us-gov-west-1',
                    display: 'AWS GovCloud (US)',
                },
                {
                    value: 'us-gov-east-1',
                    display: 'AWS GovCloud (US-East)',
                },
                {
                    value: 'us-east-1',
                    display: 'US East (N. Virginia)',
                },
                {
                    value: 'us-east-2',
                    display: 'US East (Ohio)',
                },
                {
                    value: 'us-west-1',
                    display: 'US West (N. California)',
                },
                {
                    value: 'us-west-2',
                    display: 'US West (Oregon)',
                },
                {
                    value: 'eu-west-1',
                    display: 'EU (Ireland)',
                },
                {
                    value: 'eu-west-2',
                    display: 'EU (London)',
                },
                {
                    value: 'eu-west-3',
                    display: 'EU (Paris)',
                },
                {
                    value: 'eu-central-1',
                    display: 'EU (Frankfurt)',
                },
                {
                    value: 'eu-north-1',
                    display: 'EU (Stockholm)',
                },
                {
                    value: 'ap-east-1',
                    display: 'Asia Pacific (Hong Kong)',
                },
                {
                    value: 'ap-south-1',
                    display: 'Asia Pacific (Mumbai)',
                },
                {
                    value: 'ap-southeast-1',
                    display: 'Asia Pacific (Singapore)',
                },
                {
                    value: 'ap-southeast-2',
                    display: 'Asia Pacific (Sydney)',
                },
                {
                    value: 'ap-northeast-1',
                    display: 'Asia Pacific (Tokyo)',
                },
                {
                    value: 'ap-northeast-2',
                    display: 'Asia Pacific (Seoul)',
                },
                {
                    value: 'sa-east-1',
                    display: 'South America (Sao Paulo)',
                },
                {
                    value: 'cn-north-1',
                    display: 'China (Beijing)',
                },
                {
                    value: 'cn-northwest-1',
                    display: 'China (Ningxia)',
                },
                {
                    value: 'ca-central-1',
                    display: 'Canada (Central)',
                },
                {
                    value: 'me-south-1',
                    display: 'Middle East (Bahrain)',
                },
            ];

            scope.exportExternal.jsons['S3'] = [
                {
                    query: 'S3Uploader(fileName=["<name>"], bucket=["<bucket>"], region=["<region>"]);',
                    params: [
                        {
                            paramName: 'region',
                            required: true,
                            view: {
                                displayType: 'dropdown',
                                label: 'Select a Region:',
                                attributes: {
                                    display: 'display',
                                    value: 'value',
                                },
                            },
                            model: {
                                defaultOptions: regions,
                                defaultValue: 'us-east-1',
                            },
                        },
                        {
                            paramName: 'bucket',
                            required: true,
                            view: {
                                displayType: 'dropdown',
                                label: 'Select a Bucket:',
                                attributes: {
                                    display: 'name',
                                    value: 'name',
                                },
                            },
                            model: {
                                dependsOn: ['region'],
                                query: 'S3ListBuckets(region=["<region>"]);',
                                autoSelect: true,
                            },
                        },

                        {
                            paramName: 'name',
                            required: true,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Save Name:',
                            },
                            model: {
                                defaultValue: getFrame('name'),
                            },
                        },
                    ],
                },
            ];

            scope.exportExternal.jsons['S3-Custom'] = [
                {
                    query: 'S3Uploader(fileName=["<name>"], bucket=["<bucket>"], region=["<region>"], endpoint=["<endpoint>"], profile=["<profileName>"], accessKey=["<accessKey>"], secret=["<secret>"]);',
                    params: [
                        {
                            paramName: 'region',
                            required: true,
                            view: {
                                displayType: 'dropdown',
                                label: 'Select a Region:',
                                attributes: {
                                    display: 'display',
                                    value: 'value',
                                },
                            },
                            model: {
                                defaultOptions: regions,
                                defaultValue: 'us-east-1',
                            },
                        },

                        {
                            paramName: 'endpoint',
                            required: false,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Endpoint URL:',
                                attributes: {
                                    placeholder: '(default)',
                                },
                            },
                        },

                        {
                            paramName: 'profileName',
                            required: false,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Profile Name:',
                                attributes: {
                                    placeholder: '(default)',
                                },
                            },
                        },

                        {
                            paramName: 'accessKey',
                            required: false,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Access Key:',
                                attributes: {
                                    placeholder: '(default)',
                                },
                            },
                        },

                        {
                            paramName: 'secret',
                            required: false,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Secret:',
                                attributes: {
                                    placeholder: '(default)',
                                },
                            },
                        },

                        {
                            paramName: 'bucket',
                            required: true,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Bucket:',
                                attributes: {
                                    placeholder: '(default)',
                                },
                            },
                        },

                        {
                            paramName: 'name',
                            required: true,
                            view: {
                                displayType: 'freetext',
                                label: 'Enter Save Name:',
                            },
                            model: {
                                defaultValue: getFrame('name'),
                            },
                        },
                    ],
                },
            ];
        }

        /**
         * @name closeExport
         * @desc close the exportExternal when the pipeline is closed
         */
        function closeExport(): void {
            if (scope.exportExternal.PIPELINE) {
                scope.pipelineComponentCtrl.closeComponent();
            }
        }

        /**
         * @name runExport
         * @desc export to the selected file type
         */
        function runExport(): void {
            let active: string,
                layout: string,
                keys: Key[],
                parameters: {
                    FRAME: { name: string; type: string; override: boolean };
                    OPERATION: string;
                },
                pixel = '';

            if (!validateCompiler(true)) {
                return;
            }

            parameters = buildParameters();

            if (scope.exportExternal.PIPELINE) {
                scope.pipelineComponentCtrl.executeComponent(parameters, {
                    name: `Export ${scope.exportExternal.types.selected}`,
                });
                return;
            }

            active = scope.widgetCtrl.getWidget('active');
            layout = scope.widgetCtrl.getWidget('view.' + active + '.layout');
            keys = scope.widgetCtrl.getWidget(
                'view.' + active + '.keys.' + layout
            );

            if (keys && keys.length > 0) {
                let layerIndex = 0,
                    sortOptions = scope.widgetCtrl.getWidget(
                        'view.' + active + '.tasks.' + layerIndex + '.sortInfo'
                    ),
                    selectComponent: {
                        alias: string;
                        math?: string;
                        calculatedBy?: string;
                        selector?: string;
                    }[] = [],
                    groupComponent: string[] = [];

                for (
                    let keyIdx = 0, keyLen = keys.length;
                    keyIdx < keyLen;
                    keyIdx++
                ) {
                    if (keys[keyIdx].math) {
                        // add in the group component
                        if (groupComponent.length === 0) {
                            groupComponent = keys[keyIdx].groupBy;
                        }
                    }

                    // add in the select component
                    if (keys[keyIdx].calculatedBy) {
                        selectComponent.push({
                            calculatedBy: keys[keyIdx].calculatedBy,
                            math: keys[keyIdx].math,
                            alias: keys[keyIdx].alias,
                        });
                    } else {
                        selectComponent.push({
                            alias: keys[keyIdx].alias,
                            selector: keys[keyIdx].header,
                        });
                    }
                }

                pixel = `Frame( frame = [ ${parameters.FRAME.name} ] ) | `;
                pixel += semossCoreService.pixel.build([
                    {
                        type: 'select2',
                        components: [selectComponent],
                    },
                    {
                        type: 'group',
                        components: [groupComponent],
                    },
                    {
                        type: 'sortOptions',
                        components: [sortOptions],
                    },
                ]);

                pixel = pixel.substring(0, pixel.length - 1); // remove last semi-colon since we're not done building pixel yet.
            } else {
                pixel = `Frame( frame = [ ${parameters.FRAME.name} ] ) | QueryAll () | `;
            }

            pixel += `${parameters.OPERATION};`;

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        meta: true,
                        terminal: true,
                    },
                ],
                function (response) {
                    let success = true;
                    for (
                        let returnIdx = 0,
                            returnLen = response.pixelReturn.length;
                        returnIdx < returnLen;
                        returnIdx++
                    ) {
                        const type =
                            response.pixelReturn[returnIdx].operationType;
                        if (type.indexOf('ERROR') > -1) {
                            success = false;
                            break;
                        }
                    }
                    if (success) {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Export executed successfully.',
                            insightID: compilerScope.widgetCompiler.widgetId
                                ? getWidget('insightID')
                                : undefined,
                        });
                    }
                }
            );
        }

        /**
         * @name buildParameters
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(): {
            FRAME: { name: string; type: string; override: boolean };
            OPERATION: string;
        } {
            let operation = '';
            const updated = JSON.parse(
                JSON.stringify(
                    scope.exportExternal.jsons[
                        scope.exportExternal.types.selected
                    ]
                )
            );
            for (
                let queryIdx = 0, queryLen = updated.length;
                queryIdx < queryLen;
                queryIdx++
            ) {
                const built = compilerScope.widgetCompiler.buildQuery(
                    queryIdx,
                    updated
                );

                if (built.query) {
                    operation += built.query;
                }
            }

            console.warn(operation);

            return {
                FRAME: getFrame(),
                OPERATION: operation,
            };
        }

        /**
         * @name getWidget
         * @param {string} accessor the traversal of the data to pull
         * @desc gets the widget information
         * @returns {object} the widget data
         */
        function getWidget(accessor) {
            // we are in core
            return semossCoreService.getWidget(
                compilerScope.widgetCompiler.widgetId,
                accessor
            );
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize() {
            setFrame();

            setExports();
        }

        initialize();
    }
}
