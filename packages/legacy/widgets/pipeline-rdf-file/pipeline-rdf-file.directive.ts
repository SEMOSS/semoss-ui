import angular from 'angular';
import './pipeline-rdf-file.scss';

export default angular
    .module('app.pipeline-rdf-file.directive', [])
    .directive('pipelineRdfFile', pipelineRdfFileDirective);

pipelineRdfFileDirective.$inject = [
    'CONFIG',
    'monolithService',
    'semossCoreService',
];

function pipelineRdfFileDirective(
    CONFIG,
    monolithService: MonolithService,
    semossCoreService: SemossCoreService
) {
    pipelineRdfFileCtrl.$inject = [];
    pipelineRdfFileLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-rdf-file.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineRdfFileCtrl,
        controllerAs: 'pipelineRdfFile',
        bindToController: {},
        link: pipelineRdfFileLink,
    };

    function pipelineRdfFileCtrl() {}
    function pipelineRdfFileLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.pipelineRdfFile.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };

        scope.pipelineRdfFile.path = '';
        scope.pipelineRdfFile.formats = [
            {
                display: 'RDF XML',
                value: 'RDF/XML',
            },
            {
                display: 'Turtle',
                value: 'TURTLE',
            },
            {
                display: 'Binary',
                value: 'BINARY',
            },
            {
                display: 'N3',
                value: 'N3',
            },
            {
                display: 'N-Triples',
                value: 'NTRIPLES',
            },
            {
                display: 'TriG',
                value: 'TRIG',
            },
            {
                display: 'TriX',
                value: 'TRIX',
            },
        ];
        scope.pipelineRdfFile.format = '';
        scope.pipelineRdfFile.query = '';
        scope.pipelineRdfFile.locations = [
            {
                display: 'Computer',
                value: 'COMPUTER',
            },
            {
                display: 'SEMOSS Assets',
                value: 'SEMOSS',
            },
        ];
        scope.pipelineRdfFile.locationType = 'COMPUTER';

        scope.pipelineRdfFile.preview = preview;
        scope.pipelineRdfFile.execute = execute;
        scope.pipelineRdfFile.confirmFile = confirmFile;
        scope.pipelineRdfFile.removeFile = removeFile;
        scope.pipelineRdfFile.setFile = setFile;
        scope.pipelineRdfFile.updateFrame = updateFrame;
        scope.pipelineRdfFile.validateFrameName = validateFrameName;

        /**
         * @name removeFile
         * @desc Syncs the scope when a file is removed
         */
        function removeFile(): void {
            scope.pipelineRdfFile.path = '';
            scope.pipelineRdfFile.fileName = '';
        }

        /**
         * @name setFile
         * @desc Function gets called by the asset browser when a file is selected
         * @param file - file object uploaded from asset browser
         */
        function setFile(file: any): void {
            // TO DO: will eventually have to change the file path for User and App spaces
            scope.pipelineRdfFile.path = 'INSIGHT_FOLDER\\' + file.path;
            scope.pipelineRdfFile.fileName = file.name;
            scope.pipelineRdfFile.customFrameName.name =
                scope.pipelineComponentCtrl.createFrameName(
                    scope.pipelineRdfFile.fileName
                );
            validateFrameName();
            scope.pipelineRdfFile.assetFile = file;
        }
        /**
         * @name preview
         * @desc previews frame
         */
        function preview(): void {
            if (checkValues()) {
                const parameters = buildParameters();
                scope.pipelineComponentCtrl.previewComponent(parameters, {});
            }
        }

        /**
         * @name execute
         * @param visualize - if true jump right to visual
         * @desc executes component
         */
        function execute(visualize: boolean): void {
            if (checkValues()) {
                let cb;
                const name = scope.pipelineComponentCtrl.getComponent(
                        'options.name'
                    )
                        ? scope.pipelineComponentCtrl.getComponent(
                              'options.name'
                          )
                        : scope.pipelineRdfFile.fileName,
                    parameters = buildParameters(),
                    options = {
                        name: name,
                    };
                if (visualize) {
                    cb = scope.pipelineComponentCtrl.visualizeComponent;
                }
                scope.pipelineComponentCtrl.executeComponent(
                    parameters,
                    options,
                    cb
                );
            }
        }

        /**
         * @name buildParameters
         * @desc builds the component params
         * @return parameters
         */
        function buildParameters(): {
            IMPORT_FRAME: { name: string; type: string; override: boolean };
            QUERY: string;
            RDF_FILE: { path: string; format: string };
        } {
            return {
                IMPORT_FRAME: {
                    name:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.name'
                        ) || scope.pipelineRdfFile.customFrameName.name,
                    type:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.type'
                        ) || scope.widgetCtrl.getOptions('initialFrameType'),
                    override: true,
                },
                QUERY: scope.pipelineRdfFile.query,
                RDF_FILE: {
                    path: scope.pipelineRdfFile.path,
                    format: scope.pipelineRdfFile.format,
                },
            };
        }
        /**
         * @name validateExtension
         * @desc validates that the file is a .rdf file, returns true if it is valid
         * @param file - filename
         */
        function validateExtension(file: string): boolean {
            let fileExtension: string;
            if (typeof file === 'string') {
                fileExtension = (file.split('.').pop() || '').toLowerCase();
                if (
                    fileExtension === 'rdf' ||
                    fileExtension === 'rdf/xml' ||
                    fileExtension === 'turtle' ||
                    fileExtension === 'ttl' ||
                    fileExtension === 'n3' ||
                    fileExtension === 'ntriples' ||
                    fileExtension === 'trig' ||
                    fileExtension === 'trigx'
                ) {
                    return true;
                }
            }
            return false;
        }
        /**
         * @name checkValues
         * @desc determins if all values are present
         * @return if true, all values are present
         */
        function checkValues(): boolean {
            let allClear = true;
            if (!scope.pipelineRdfFile.query) {
                scope.widgetCtrl.alert('error', 'Missing query');
                allClear = false;
            } else if (!scope.pipelineRdfFile.path) {
                scope.widgetCtrl.alert('error', 'Missing file path');
                allClear = false;
            } else if (!scope.pipelineRdfFile.format) {
                scope.widgetCtrl.alert('error', 'Missing format');
                allClear = false;
            } else if (!validateExtension(scope.pipelineRdfFile.fileName)) {
                scope.widgetCtrl.alert(
                    'error',
                    'File must be one of the following: .rdf, .rdf/xml, .turtle, .ttl, .n3, .ntriples, .trig, .trigx'
                );
                allClear = false;
            }

            return allClear;
        }

        /**
         * @name confirmFile
         * @param file - flow file
         * @desc checks file is acceptable size and then uploads
         */
        function confirmFile(file: any): void {
            if (
                acceptableSize(file.size) &&
                acceptableExt(file.getExtension().toLowerCase())
            ) {
                monolithService
                    .uploadFile([file], scope.widgetCtrl.insightID, '', '')
                    .then((data) => {
                        scope.pipelineRdfFile.path = data[0].fileLocation;
                        scope.pipelineRdfFile.fileName = data[0].fileName;
                        scope.pipelineRdfFile.customFrameName.name =
                            scope.pipelineComponentCtrl.createFrameName(
                                scope.pipelineRdfFile.fileName
                            );
                        validateFrameName();
                    });
            } else {
                scope.widgetCtrl.alert(
                    'error',
                    'File must be under ' +
                        CONFIG['file-limit'] +
                        'MB and a rdf file type'
                );
            }
        }

        /**
         * @name acceptableExt
         * @param extension file extension
         * @desc determines if rdf file
         * @return true if acceptable
         */
        function acceptableExt(extension: string): boolean {
            return (
                extension === 'rdf' ||
                extension === 'ttl' ||
                extension === 'n3' ||
                extension === 'nt' ||
                extension === 'trig' ||
                extension === 'trix' ||
                extension === 'owl'
            );
        }

        /**
         * @name acceptableSize
         * @param file - flow file
         * @desc checks file size and makes sure it doesn't exceed the limit
         * @returns true if not over size limit
         */
        function acceptableSize(size: number): boolean {
            if (
                !CONFIG['file-limit'] ||
                size / 1024 / 1024 <= CONFIG['file-limit']
            ) {
                return true;
            }

            return false;
        }

        /**
         * @name setFrameData
         * @desc set the frame type
         * @return {void}
         */
        function setFrameData() {
            scope.pipelineRdfFile.frameType =
                scope.widgetCtrl.getOptions('initialFrameType');
        }

        /**
         * @name updateFrame
         * @param {string} type - type
         * @desc update the frame type
         * @return {void}
         */
        function updateFrame(type) {
            scope.widgetCtrl.setOptions('initialFrameType', type);
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         * @returns {void}
         */
        function validateFrameName() {
            const results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineRdfFile.customFrameName.name
            );
            scope.pipelineRdfFile.customFrameName.valid = results.valid;
            scope.pipelineRdfFile.customFrameName.message = results.message;
        }

        function initialize() {
            const query = scope.pipelineComponentCtrl.getComponent(
                    'parameters.QUERY.value'
                ),
                path = scope.pipelineComponentCtrl.getComponent(
                    'parameters.RDF_FILE.value.path'
                ),
                format = scope.pipelineComponentCtrl.getComponent(
                    'parameters.RDF_FILE.value.format'
                );

            if (query) {
                scope.pipelineRdfFile.query = query;
            }
            if (path) {
                scope.pipelineRdfFile.path = path;
            }
            if (format) {
                scope.pipelineRdfFile.format = format;
            }

            if (scope.widgetCtrl.file) {
                confirmFile(scope.widgetCtrl.file);
                scope.widgetCtrl.file = null;
            }
            setFrameData();
        }

        initialize();
    }
}
