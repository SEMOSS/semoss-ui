import angular from 'angular';
import jsPlumb from 'jsplumb';
import { CONNECTORS, PREVIEW_LIMIT } from '../../core/constants';
import Movable from '../../core/utility/movable-old';
import Resizable from '../../core/utility/resizable-old';
import PixelASTLeaf from './PixelASTLeaf';

import './pipeline.scss';

import './pipeline-component/pipeline-component.directive';
import './pipeline-compiler/pipeline-compiler.directive';
import './pipeline-landing/pipeline-landing.directive';
import '../federate/federate.directive';
import { frameHeaders } from '../../core/store/pixel/reactors/index';

export default angular
    .module('app.pipeline.directive', [
        'app.pipeline.component',
        'app.pipeline.compiler',
        'app.pipeline.landing',
        'app.federate.directive',
    ])
    .directive('pipeline', pipelineDirective);

pipelineDirective.$inject = [
    '$compile',
    '$timeout',
    'ENDPOINT',
    'semossCoreService',
    'monolithService',
    'CONFIG',
    '$q',
];

// Test
/**
 * @name pipelineDirective
 * @desc This directive is responsible for connecting components in the pipeline, pipeline playback,
 * and reconstructing the pipeline based on pixel steps.
 *
 * 1. Connecting Components
 * Pipeline components are all stored in pipeline.data. This is an object where the keys are the
 * component ID with a value of component meta data (this such as input, output, pixel created by component, etc...)
 * The meta data comes from a combination of the widget's config.js as well as data added to the component
 * as pipeline processes it. When the user adds a component, addComponent is the starting point.
 *
 * 2. Pipeline Playback
 * Pipeline has a secondary state to determine if it is rerunning itself. pipeline.paused is a boolean which determines
 * that. When the pipeline is paused it can be stepped through, or reran automatically. togglePause() is how
 * the user changes states via the ui. Users will have to rerun the pipeline if they go back and edit
 * a component.
 *
 * 3. Pipeline Reconstruction
 * pipeline.data is persisted even when user leaves the pipeline in order to load it instantly from
 * memory. When the user leaves pipeline and interacts with Semoss, the pipeline will reconstruct
 * itself based on the persisted pipeline.data as well as building components based on the return from
 * monolithService.getPipeline. The kick off to recreate the pipeline is the renderPipeline function
 */
function pipelineDirective(
    $compile: ng.ICompileService,
    $timeout: ng.ITimeoutService,
    ENDPOINT: EndPoint,
    semossCoreService: SemossCoreService,
    monolithService: MonolithService,
    CONFIG: any,
    $q: any
) {
    pipelineCtrl.$inject = [];
    pipelineLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline.directive.html'),
        scope: {},
        require: ['^widget'],
        controller: pipelineCtrl,
        controllerAs: 'pipeline',
        bindToController: {},
        replace: true,
        link: pipelineLink,
    };

    function pipelineCtrl() {}

    function pipelineLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        let pipelineEle: HTMLElement,
            pipelineLeftEle: HTMLElement,
            pipelineContentEle: HTMLElement,
            pipelineWorkspaceContentEle: HTMLElement,
            pipelinePreviewEle: HTMLElement,
            plumbing,
            timeout,
            counter = 0;

        const COMPONENT_STYLES = {
                // TODO: convert to em instead of pixel
                gutter: 24,
                endpoint: 24,
                height: 144,
                width: 172,
                offset_left: 144, // .pipeline__component__side WIDTH (32) + .pipeline__component__box WIDTH (108) + .pipeline__component__side__btn MARGIN (4)
                offset_top: 42, // (.pipeline__component__side HEIGHT (108) / 2) - (.pipeline__component__side__btn HEIGHT (12) / 2)
            },
            DUMMY = 'DUMMY',
            REPLAY_TIMER = 750;

        // Each type has a very specific value. THIS IS IMPORTANT TO KEEP IF YOU WANT TO CASCADE
        // QUERY_STRUCT -  {qsType, engineName, isDistinct, limit, offset, relations, ordes, selectors, explicitFilters, havingFilters, query}
        // FRAME  - {name, type, create}
        // JOINS - {from, join, to}

        scope.pipeline.positionPipeline = positionPipeline;
        scope.pipeline.searchMenu = searchMenu;
        scope.pipeline.addComponent = addComponent;
        scope.pipeline.getComponent = getComponent;
        scope.pipeline.removeComponent = removeComponent;
        scope.pipeline.showComponent = showComponent;
        scope.pipeline.closeComponent = closeComponent;
        scope.pipeline.validateComponent = validateComponent;
        scope.pipeline.buildComponent = buildComponent;
        scope.pipeline.previewComponent = previewComponent;
        scope.pipeline.expandPreviewComponent = expandPreviewComponent;
        scope.pipeline.executeComponent = executeComponent;
        scope.pipeline.viewComponent = viewComponent;
        scope.pipeline.visualizeComponent = visualizeComponent;
        scope.pipeline.openPreview = openPreview;
        scope.pipeline.closePreview = closePreview;
        scope.pipeline.exportCSV = exportCSV;
        scope.pipeline.showFederate = showFederate;
        scope.pipeline.createFrameName = createFrameName;
        scope.pipeline.initializePipeline = initializePipeline;
        scope.pipeline.finishPipelineRender = finishPipelineRender;
        scope.pipeline.confirmDelete = confirmDelete;

        scope.pipeline.lastFrame = {};
        scope.pipeline.hasFrameHeadersChange = false;
        scope.pipeline.previewLimit = PREVIEW_LIMIT;
        scope.pipeline.landing = {
            open: false,
        };

        scope.pipeline.menu = {
            searched: '',
            accordion: [
                {
                    name: 'Source',
                    height: 50,
                    items: [],
                },
                {
                    name: 'Transform',
                    height: 50,
                    items: [],
                },
            ],
        };

        scope.pipeline.numComponents = 0;
        scope.pipeline.data = {};
        scope.pipeline.eles = {};
        scope.pipeline.movable = {};
        scope.pipeline.preview = {
            open: false,
            selected: undefined,
        };

        scope.pipeline.STATE = {
            INITIAL: 'initial',
            EXECUTED: 'executed',
        };

        scope.pipeline.edit = {
            open: false,
            selected: undefined,
            height: 100,
            preview: 0,
        };

        scope.pipeline.delete = {
            open: false,
            key: '',
        };

        scope.pipeline.federate = {
            open: false,
            selectedFrame: '',
        };

        /**
         * @name checkErrors
         * @param response pixel response
         * @desc checks for errors in pixel response
         * @return true if has errors, false otherwise
         */
        function checkErrors(response: PixelReturnPayload) {
            for (
                let outputIdx = 0, outputLen = response.pixelReturn.length;
                outputIdx < outputLen;
                outputIdx++
            ) {
                if (
                    response.pixelReturn[outputIdx].operationType.indexOf(
                        'ERROR'
                    ) > -1 ||
                    response.pixelReturn[outputIdx].operationType.indexOf(
                        'INVALID_SYNTAX'
                    ) > -1
                ) {
                    scope.widgetCtrl.alert(
                        'error',
                        response.pixelReturn[outputIdx].output
                    );
                    return true;
                }
            }

            return false;
        }

        /**
         * @name initializePipeline
         * @desc initialize the pipeline
         */
        function initializePipeline(): void {
            const components = semossCoreService.getWidgetState('all');

            // get all of the pipeline widgets
            scope.pipeline.components = [];

            for (
                let componentIdx = 0, componentLen = components.length;
                componentIdx < componentLen;
                componentIdx++
            ) {
                if (components[componentIdx].hasOwnProperty('pipeline')) {
                    const component = semossCoreService.utility.freeze(
                        components[componentIdx]
                    );
                    const message = checkRequirements(component);

                    component.title = component.description;
                    // if there is a message, that means this component didn't meet one of the requirements (R/Py packages)
                    if (message) {
                        component.disabled = true;
                        component.title = message;
                    }

                    scope.pipeline.components.push(component);
                }
            }

            // render the pipeline
            renderPipeline();

            // render the menu
            searchMenu();
        }

        /**
         * @name processRendering
         * @param response the response from the runPixel
         * @desc process the rendering of the pipeline when BE comes back from runPixel
         * @returns {void}
         */
        function processRendering(response): void {
            // here we check to see if we need to try to render. if it's just a panel view change, there's no need
            let ignoreOpTypes = ['TASK_DATA', 'PANEL_VIEW', 'ERROR'],
                opTypeList = [],
                validRender = true;

            // preventing repainting of pipeline twice...
            if (response.suppressPipeline) {
                return;
            }

            // lets gather all the op types that are coming back
            for (let idx = 0; idx < response.pixelReturn.length; idx++) {
                opTypeList = opTypeList.concat(
                    response.pixelReturn[idx].operationType
                );
            }

            // if there are operation types that are not in the ignoreOpTypes array, this means they reactors that could potentially update the pipeline blocks
            for (
                let opTypeIdx = 0;
                opTypeIdx < opTypeList.length;
                opTypeIdx++
            ) {
                if (ignoreOpTypes.indexOf(opTypeList[opTypeIdx]) > -1) {
                    validRender = false;
                    break;
                }
            }

            if (!validRender) {
                return;
            }

            renderPipeline();
        }

        /**
         * @name renderPipeline
         * @desc construct a pipeline from the json
         */
        function renderPipeline(): void {
            // after any json components have rendered check for user interaction outside of pipeline
            monolithService
                .getPipeline(scope.widgetCtrl.insightID)
                .then((response) => {
                    const start = 0;

                    // mapping of last updated FRAME to Key
                    const last = {};
                    const nodes: PixelASTLeaf[][] = response.pixelParsing;
                    const idMapping = response.idMapping;

                    // we are rendering the whole pipeline again, so lets remove all the existing blocks.
                    for (const key in scope.pipeline.data) {
                        if (scope.pipeline.data.hasOwnProperty(key)) {
                            deleteComponent(key);
                        }
                    }
                    // pipelineWorkspaceContentEle.innerHTML = '';
                    // scope.pipeline.data = {};
                    // plumbing = jsPlumb.jsPlumb.getInstance({
                    //     Container: pipelineWorkspaceContentEle
                    // });

                    // and make sure to reset the counter too for creating unique pipeline keys
                    counter = 0;

                    // start to construct the data
                    for (
                        let nodeIdx = start, nodeLen = nodes.length;
                        nodeIdx < nodeLen;
                        nodeIdx++
                    ) {
                        const node = nodes[nodeIdx];

                        if (node.length === 0) {
                            console.warn(
                                'You have an empty node. Check your Pixel.'
                            );
                            continue;
                        }

                        const options = translatePipeline(
                            node,
                            idMapping[nodeIdx]
                        );

                        if (!options) {
                            continue;
                        }

                        // add the component in
                        const key = addComponent(
                            options.id,
                            false,
                            options.config,
                            true
                        );

                        // update the linking of the component
                        const component = scope.pipeline.data[key];

                        // This works beacuse things are linear
                        // link the current input to the last output
                        for (
                            let inputIdx = 0, inputLen = component.input.length;
                            inputIdx < inputLen;
                            inputIdx++
                        ) {
                            const input = component.input[inputIdx];

                            if (component.parameters.hasOwnProperty(input)) {
                                const parameter = component.parameters[input];
                                if (parameter.frame) {
                                    // is it stored? If so, link it
                                    if (
                                        parameter.value &&
                                        last.hasOwnProperty(
                                            parameter.value.name
                                        )
                                    ) {
                                        const link = last[parameter.value.name];

                                        // link the upstream parameter
                                        parameter.upstream = {
                                            key: link.key,
                                            output: link.output,
                                        };

                                        // link the downstream
                                        scope.pipeline.data[link.key].output[
                                            link.output
                                        ].downstream = {
                                            key: component.key,
                                            parameter: parameter.parameter,
                                        };
                                    }
                                }
                            }
                        }

                        // save the last output
                        for (
                            let outputIdx = 0,
                                outputLen = component.output.length;
                            outputIdx < outputLen;
                            outputIdx++
                        ) {
                            const output = component.output[outputIdx];

                            if (output.frame) {
                                last[output.value.name] = {
                                    key: component.key,
                                    output: output.output,
                                };

                                // keep track of the last frame that was touched to be used in a generic codeblock so we know what to connect it to
                                scope.pipeline.lastFrame = output.value;
                            }
                        }

                        // set as executed
                        component.state = scope.pipeline.STATE.EXECUTED;

                        // render the options
                        renderComponentOptions(key);

                        // render the output fields
                        renderComponentOutput(key);

                        // set position to auto if there are no top or left values
                        if (
                            !component.position.top &&
                            !component.position.left
                        ) {
                            component.position.auto = true;
                        }
                    }

                    // render the connections
                    finishPipelineRender();
                });
        }

        /**
         * @name translatePipeline
         * @desc translate a node in the pipeline
         */
        function translatePipeline(
            node: any[],
            idMapping: any
        ): { id: string; config: any } | false {
            // this is the last leaf in the node, we base everything off of this
            const leaf = node[node.length - 1];

            let id = '',
                config: {
                    uniqueKey: string;
                    position: any;
                    message: string;
                    warningReturned: boolean;
                    errorReturned: boolean;
                    pipeline: {
                        output: any[];
                        parameters: {
                            [key: string]: any;
                        };
                        state: string;
                        usePixel: boolean;
                    };
                } = {
                    uniqueKey: idMapping.id,
                    position: idMapping.positionMap,
                    message:
                        idMapping.errorMessages[0] ||
                        idMapping.warningMessages[0],
                    warningReturned: idMapping.warningReturned,
                    errorReturned: idMapping.errorReturned,
                    pipeline: {
                        usePixel: false,
                        output: [],
                        parameters: {},
                        state: 'executed', // all these components are executed already
                    },
                };

            /**
             * @name _setCodeblock
             * @param config the config to modify
             * @param leaf the leaf of the pixel
             * @desc this is the fallback for widgets we have not converted over
             * @returns {object} the modified if and config to pass back
             */
            function _setCodeblock(config, node) {
                // in each unprocessed widgets, use the following line inside
                // return _setCodeblock(config, node);
                const leaf = node[node.length - 1];
                const id = 'pipeline-codeblock';
                const frameName =
                    semossCoreService.utility.getter(
                        leaf,
                        'nounInputs.frame.0.value.alias'
                    ) || scope.pipeline.lastFrame.name;
                const frameType =
                    semossCoreService.utility.getter(
                        leaf,
                        'nounInputs.frame.0.value.frameType'
                    ) || scope.pipeline.lastFrame.type;

                let pixel = '';

                for (let nodeIdx = 0; nodeIdx < node.length; nodeIdx++) {
                    if (nodeIdx !== 0) {
                        pixel += ' | ';
                    }
                    pixel += node[nodeIdx].opString;
                }

                if (pixel) {
                    pixel += ';';
                }

                config.pipeline.parameters = {
                    CODE: {
                        value: pixel,
                    },
                    FILES: {
                        value: {},
                    },
                    LANGUAGE: {
                        value: 'pixel',
                    },
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                    },
                });

                return {
                    id: id,
                    config: config,
                };
            }

            if (leaf.opName === 'Import') {
                const nounInputs = leaf.nounInputs;
                const qs = nounInputs.qs[0].value;
                const frameDetails = nounInputs.frame[0].value;
                const frameName = frameDetails.alias;
                const frameType = frameDetails.frameType;

                // set the id based on the qsTime
                if (qs.qsType === 'ENGINE') {
                    id = 'pipeline-app';

                    // update the config
                    config.pipeline.parameters = {
                        QUERY_STRUCT: {
                            value: qs,
                        },
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                    };
                } else if (qs.qsType === 'FRAME') {
                    id = 'pipeline-telescopic';

                    // update the config
                    config.pipeline.parameters = {
                        SOURCE: {
                            value: {
                                name: qs.frameName,
                            },
                        },
                        QUERY_STRUCT: {
                            value: qs,
                        },
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                    };
                } else if (qs.qsType === 'RAW_JDBC_ENGINE_QUERY') {
                    id = 'pipeline-external';

                    // update the config
                    config.pipeline.parameters = {
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                        QUERY_STRUCT: {
                            value: qs,
                        },
                    };
                } else if (qs.qsType === 'RAW_ENGINE_QUERY') {
                    id = 'pipeline-query';

                    // update the config
                    config.pipeline.parameters = {
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                        QUERY_STRUCT: {
                            value: qs,
                        },
                        SELECTED_APP: {
                            value: {
                                value: qs.engineName,
                            },
                        },
                    };
                } else if (qs.qsType === 'CSV_FILE') {
                    id = 'pipeline-file$CSV';

                    // update the config
                    config.pipeline.parameters = {
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                        QUERY_STRUCT: {
                            value: qs,
                        },
                    };
                } else if (qs.qsType === 'EXCEL_FILE') {
                    // TODO pipeline-file$Paste, pipeline-file$TSV
                    id = 'pipeline-file$Excel';

                    // update the config
                    config.pipeline.parameters = {
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                        QUERY_STRUCT: {
                            value: qs,
                        },
                    };
                } else if (qs.qsType === 'DIRECT_API_QUERY') {
                    id = 'pipeline-api';
                    // update the config
                    config.pipeline.parameters = {
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                        QUERY_STRUCT: {
                            value: qs,
                        },
                    };
                } else if (qs.qsType === 'RAW_RDF_FILE_ENGINE_QUERY') {
                    id = 'pipeline-rdf-file';
                    // update the config
                    config.pipeline.parameters = {
                        IMPORT_FRAME: {
                            value: {
                                name: frameName,
                                type: frameType,
                                override: true,
                            },
                        },
                        RDF_FILE: {
                            value: {
                                path: qs.config.filePath,
                                format: qs.config.rdfType,
                            },
                        },
                        QUERY: {
                            value: qs.query,
                        },
                    };
                } else {
                    console.warn('NOT SET', qs.qsType);
                }

                // add the output
                // TODO: Determine if we are missing stuff from here. How will it work with editing in the middle?
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Union') {
                id = 'pipeline-union';

                const nounInputs = leaf.nounInputs;

                const frame1 = nounInputs.frame1[0].value.alias;
                const frame1Type = nounInputs.frame1[0].value.frameType;
                const frame2 = nounInputs.frame2[0].value.alias;
                const frame2Type = nounInputs.frame1[0].value.frameType;

                // update the config
                config.pipeline.parameters = {
                    FRAME1: {
                        value: {
                            name: frame1,
                            type: frame1Type,
                        },
                    },
                    FRAME2: {
                        value: {
                            name: frame2,
                            type: frame2Type,
                        },
                    },
                };

                // add the output
                // TODO: Determine if we are missing stuff from here. How will it work with editing in the middle?
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frame1,
                        type: frame1Type,
                    },
                });
            } else if (leaf.opName === 'Merge') {
                id = 'pipeline-merge';

                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // get the joins
                const joins: any[] = [];
                for (
                    let joinIdx = 0, joinLen = nounInputs.joins.length;
                    joinIdx < joinLen;
                    joinIdx++
                ) {
                    if (nounInputs.joins[joinIdx].type === 'joins') {
                        joins.push({
                            from: nounInputs.joins[joinIdx].value.lColumn,
                            join: nounInputs.joins[joinIdx].value.joinType,
                            to: nounInputs.joins[joinIdx].value.rColumn,
                            joinComparator:
                                nounInputs.joins[joinIdx].value.comparator, // included comparator to handle the between functionality
                        });
                    }
                }

                // get the QS
                const qs = nounInputs.qs[0].value;

                const srcFrame = qs.frameName;
                const destFrame = frameName;

                const srcHeaders =
                    idMapping.startingFrameHeaders[qs.frameName].headerInfo
                        .headers;
                const destHeaders =
                    idMapping.startingFrameHeaders[frameName].headerInfo
                        .headers;

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: srcFrame,
                            type: '',
                            headers: srcHeaders,
                            joins: [],
                        },
                    },
                    DESTINATION: {
                        value: {
                            name: destFrame,
                            type: frameType,
                            headers: destHeaders,
                            joins: [],
                        },
                    },
                    QUERY_STRUCT: {
                        value: qs,
                    },
                    JOINS: {
                        value: joins,
                    },
                };

                // add the output
                // TODO: Determine if we are missing stuff from here. How will it work with editing in the middle?
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
                // } else if (leaf.opName === 'AddFrameFilter' || leaf.opName === 'ReplaceFrameFilter' || leaf.opName === 'DeleteFrameFilter' || leaf.opName === 'UnfilterFrame' || leaf.opName === 'SetFrameFilter') {
                //     // IMPORTANT ::: we will setup the frame filters by setting their pixel as the parameter, because we dont need the individual pieces. state is managed without parameters in filter directive
                //     // IMPORTANT ::: then later after all blocks have been processed, we will combine all the filter blocks into one because our filter widget handles ALL filters
                //     const nounInputs = leaf.nounInputs;
                //     const frameName = nounInputs.frame[0].value.alias;
                //     const frameType = nounInputs.frame[0].value.frameType;
                //     // const filters = nounInputs.filters[0].value.content;

                //     let pixel = '';

                //     // constructing the frame filter pixel
                //     for (let nodeIdx = 0; nodeIdx < node.length; nodeIdx++) {
                //         if (nodeIdx !== 0) {
                //             pixel += ' | ';
                //         }
                //         pixel += node[nodeIdx].opString;
                //     }
                //     pixel += ';';

                //     id = 'filter';
                //     config.pipeline.usePixel = true;
                //     config.pipeline.parameters = {
                //         'FRAME': {
                //             value: {
                //                 name: frameName,
                //                 type: frameType
                //             }
                //         },
                //         'PIXEL': {
                //             value: pixel
                //         }
                //     }

                //     // add the output
                //     config.pipeline.output.push({
                //         output: config.pipeline.output.length, // right now the only thing that is unique is the index
                //         downstream: {},
                //         frame: true,
                //         value: {
                //             name: frameName,
                //             type: frameType,
                //             headers: idMapping.endingFrameHeaders[frameName] ? idMapping.endingFrameHeaders[frameName].headerInfo.headers : [],
                //             joins: idMapping.endingFrameHeaders[frameName] ? idMapping.endingFrameHeaders[frameName].headerInfo.joins : [],
                //         }
                //     });
            } else if (leaf.opName === 'FrameFilterEmptyValues') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;
                const filterColumn = nounInputs.columns[0].value;
                id = 'clean-filter-empty';

                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    column: {
                        value: filterColumn,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'AddColumn') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-add-col';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    newColName: {
                        value: nounInputs.newCol[0].value,
                    },
                    newColType: {
                        value: nounInputs.dataType[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ChangeColumnType') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-change-col-type';

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    colName: {
                        value: nounInputs.column[0].value,
                    },
                    newType: {
                        value: nounInputs.dataType[0].value,
                    },
                    format: {
                        value: nounInputs.format
                            ? nounInputs.format[0].value
                            : '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Collapse') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-collapse';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    frameHeader1: {
                        value: nounInputs.groupByColumn
                            ? nounInputs.groupByColumn.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                    frameHeader2: {
                        value: nounInputs.value
                            ? nounInputs.value[0].value
                            : '',
                    },
                    separator: {
                        value: nounInputs.delimiter[0].value,
                    },
                    keepColumns: {
                        value: nounInputs.maintainCols
                            ? nounInputs.maintainCols.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ColumnAverage') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-column-average';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    cols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                    newCol: {
                        value: nounInputs.newCol[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'CountIf') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-count-if';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    colName: {
                        value: nounInputs.column[0].value,
                    },
                    strFind: {
                        value: nounInputs.regex[0].value,
                    },
                    newCol: {
                        value: nounInputs.newCol[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'CumulativeSum') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-cumulative-sum';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    newColumn: {
                        value: nounInputs.newCol[0].value,
                    },
                    valueColumn: {
                        value: nounInputs.value[0].value,
                    },
                    sortColumns: {
                        value: nounInputs.sortCols
                            ? nounInputs.sortCols
                                  .map((c) => {
                                      return '"' + c.value + '"';
                                  })
                                  .join(',')
                            : '',
                    },
                    groupByColumns: {
                        value: nounInputs.groupByCols
                            ? nounInputs.groupByCols
                                  .map((c) => {
                                      return '"' + c.value + '"';
                                  })
                                  .join(',')
                            : '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DateAddValue') {
                const frameName = leaf.nounInputs.frame[0].value.alias;
                const frameType = leaf.nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-date-add';

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    DATE_ADD_VALUE: {
                        value: {
                            srcCol: leaf.nounInputs.column[0].value,
                            new_col: leaf.nounInputs.new_col[0].value,
                            unit: leaf.nounInputs.unit[0].value,
                            val_to_add: leaf.nounInputs.val_to_add[0].value,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DateDifference') {
                const frameName = leaf.nounInputs.frame[0].value.alias;
                const frameType = leaf.nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-date-diff';

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    DATE_DIFFERENCE: {
                        value: {
                            start_column: leaf.nounInputs.start_column[0].value,
                            end_column: leaf.nounInputs.end_column[0].value,
                            input_use: leaf.nounInputs.input_use[0].value,
                            input_date: leaf.nounInputs.input_date[0].value,
                            unit: leaf.nounInputs.unit[0].value,
                            newCol: leaf.nounInputs.newCol[0].value,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DateExpander') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-date-expander';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    property: {
                        value: nounInputs.column[0].value,
                    },
                    opts: {
                        value: nounInputs.options.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DecodeURI') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-decode-uri';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    uriCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Discretize') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-discretize';
                let breaks = [];
                let labels = [];

                // convert breaks and labels strings into arrays
                if (nounInputs.requestMap[0].value.breaks) {
                    const breaksArray =
                        nounInputs.requestMap[0].value.breaks.split(',');
                    // breaksArray[0] = breaksArray[0].substring(1);
                    // breaksArray[breaksArray.length - 1] = breaksArray[breaksArray.length - 1].slice(0, -1);
                    breaks = breaksArray;
                }
                if (nounInputs.requestMap[0].value.labels) {
                    const labelsArray =
                        nounInputs.requestMap[0].value.labels.split(',');
                    // labelsArray[0] = labelsArray[0].substring(1);
                    // labelsArray[labelsArray.length - 1] = labelsArray[labelsArray.length - 1].slice(0, -1);
                    labels = labelsArray;
                }

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    DISCRETIZE: {
                        value: {
                            column: nounInputs.requestMap[0].value.column,
                            breaks: breaks,
                            labels: labels,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Division') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-division';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    numerator: {
                        value: nounInputs.numerator[0].value,
                    },
                    denominator: {
                        value: nounInputs.denominator[0].value,
                    },
                    newColName: {
                        value: nounInputs.newCol[0].value,
                    },
                    round: {
                        value: nounInputs.round[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DropColumn') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-drop-col';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    columns: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DropRows') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-drop-rows';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    column: {
                        value: nounInputs.qs[0].value.explicitFilters[0].content
                            .left.value[0].content.alias,
                    },
                    comparator: {
                        value: nounInputs.qs[0].value.explicitFilters[0].content
                            .comparator,
                    },
                    value: {
                        value: nounInputs.qs[0].value.explicitFilters[0].content
                            .right.value[0],
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'DuplicateColumn') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-duplicate-col';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    column: {
                        value: nounInputs.column[0].value,
                    },
                    newColName: {
                        value: nounInputs.newCol[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'EncodeColumn') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-encode-col';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    obfuscateCols: {
                        value: nounInputs.columns
                            ? nounInputs.columns
                                  .map((c) => {
                                      return '"' + c.value + '"';
                                  })
                                  .join(',')
                            : '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'EncodeURI') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-encode-uri';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    uriCols: {
                        value: nounInputs.columns
                            ? nounInputs.columns
                                  .map((c) => {
                                      return '"' + c.value + '"';
                                  })
                                  .join(',')
                            : '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (
                leaf.opName === 'ExportToExcel' ||
                leaf.opName === 'ExportToPPT' ||
                leaf.opName === 'ExportToExcelNN' ||
                leaf.opName === 'ExportToPPTNN'
            ) {
                // use the last frame if it exists, otherwise use this widget's current frame
                const frameName =
                    scope.pipeline.lastFrame.name ||
                    scope.widgetCtrl.getFrame('name');
                const frameType =
                    scope.pipeline.lastFrame.type ||
                    scope.widgetCtrl.getFrame('type');

                // set the id
                id = 'export-dashboard';

                // update the config
                config.pipeline.parameters = {
                    FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                        },
                    },
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                    },
                });
            } else if (
                leaf.opName === 'ExtractLetters' ||
                leaf.opName === 'ExtractNumbers'
            ) {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-extract-numbers-letters';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    extractorType: {
                        value: leaf.opName,
                    },
                    cols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                    override: {
                        value: nounInputs.override[0].value + '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'FuzzyMerge') {
                const nounInputs = leaf.nounInputs;
                const destFrameName = nounInputs.frame[0].value.alias;
                const destFrameType = nounInputs.frame[0].value.frameType;
                const qs = nounInputs.qs[0].value;

                // set the id
                id = 'pipeline-fuzzy-blend';

                // get the joins
                let joins = '(';
                for (
                    let joinIdx = 0, joinLen = nounInputs.joins.length;
                    joinIdx < joinLen;
                    joinIdx++
                ) {
                    if (
                        nounInputs.joins[joinIdx].type === 'JOIN' ||
                        nounInputs.joins[joinIdx].type === 'joins'
                    ) {
                        joins +=
                            nounInputs.joins[joinIdx].value.lColumn +
                            ', ' +
                            nounInputs.joins[joinIdx].value.joinType +
                            ', ' +
                            nounInputs.joins[joinIdx].value.rColumn;
                        break;
                    }
                }
                joins += ')';

                const srcFrame = qs.frameName;
                const srcFrameType = qs.frameType;
                const destFrame = destFrameName;

                const srcHeaders =
                    idMapping.startingFrameHeaders[srcFrame].headerInfo.headers;
                const destHeaders = idMapping.startingFrameHeaders[destFrame]
                    ? idMapping.startingFrameHeaders[destFrame].headerInfo
                          .headers
                    : [];

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: srcFrame,
                            type: srcFrameType,
                            headers: srcHeaders,
                            joins: [],
                        },
                    },
                    DESTINATION: {
                        value: {
                            name: destFrameName,
                            type: destFrameType,
                            headers: destHeaders,
                            joins: [],
                        },
                    },
                    FUZZY_MERGE: {
                        value: {
                            fedFrame: nounInputs.fedFrame[0].value.alias,
                            frame: nounInputs.frame[0].value.alias,
                            joins: joins,
                            matches: nounInputs.matches
                                ? nounInputs.matches
                                      .map((c) => {
                                          return '"' + c.value + '"';
                                      })
                                      .join(',')
                                : '',
                            nonMatches: nounInputs.nonMatches
                                ? nounInputs.nonMatches
                                      .map((c) => {
                                          return '"' + c.value + '"';
                                      })
                                      .join(',')
                                : '',
                            propagation: nounInputs.propagation[0].value,
                        },
                    },
                    QUERY_STRUCT: {
                        value: {
                            frameName: srcFrame,
                            qsType: qs.qsType,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: destFrame,
                        type: destFrameType,
                        headers: idMapping.endingFrameHeaders[destFrame]
                            ? idMapping.endingFrameHeaders[destFrame].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[destFrame]
                            ? idMapping.endingFrameHeaders[destFrame].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ImputeNullValues') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-impute';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    imputeCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'JoinColumns') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-join';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    joinCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                    separator: {
                        value: nounInputs.delimiter[0].value,
                    },
                    newColumn: {
                        value: nounInputs.newCol[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ToLowerCase') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-lower-case';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    lowerCaseCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Pivot') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-pivot';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    pivotColumn: {
                        value: nounInputs.pivotCol[0].value,
                    },
                    valueColumn: {
                        value: nounInputs.valueCol[0].value,
                    },
                    aggregate: {
                        value: nounInputs.function
                            ? nounInputs.function[0].value
                            : '',
                    },
                    pivotKeepColumns: {
                        value: nounInputs.maintainCols
                            ? nounInputs.maintainCols
                                  .map((c) => {
                                      return '"' + c.value + '"';
                                  })
                                  .join(',')
                            : '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ToProperCase') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-proper-case';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    properCaseCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RemoveDuplicateRows') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-remove-duplicate-rows';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RenameColumn') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-rename-col';

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    RENAME_COLUMN: {
                        value: {
                            selected: nounInputs.column[0].value,
                            new: nounInputs.newCol[0].value,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ReplaceColumnValue') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-replace';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    replaceType: { value: 'ReplaceColumnValue' },
                    columnName: {
                        value: nounInputs.column.map((c) => {
                            return c.value;
                        }),
                    },
                    curValue: {
                        value: nounInputs.value[0].value,
                    },
                    newValue: {
                        value: nounInputs.newValue[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RegexReplaceColumnValue') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-replace';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    replaceType: { value: 'RegexReplaceColumnValue' },
                    columnName: {
                        value: nounInputs.column.map((c) => {
                            return c.value;
                        }),
                    },
                    curValue: {
                        value: nounInputs.value[0].value,
                    },
                    newValue: {
                        value: nounInputs.newValue[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'SplitColumns') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-split';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    splitCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                    separator: {
                        value: nounInputs.delimiter[0].value,
                    },
                    regex: {
                        value: nounInputs.search[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'SplitUnpivot') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-split-unpivot';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    splitCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                    separator: {
                        value: nounInputs.delimiter[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'TimestampData') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-timestamp-data';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    newColName: {
                        value: nounInputs.newCol[0].value,
                    },
                    newColType: {
                        value: nounInputs.time[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Transpose') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-transpose';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'TrimColumns') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-trim';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    trimCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Unpivot') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-unpivot';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    unpivotColumns: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'UpdateRowValues') {
                const frameName = leaf.nounInputs.frame[0].value.alias;
                const frameType = leaf.nounInputs.frame[0].value.frameType;
                const filterQs =
                    leaf.nounInputs.qs[0].value.explicitFilters[0].content;
                const alias = filterQs.left.value[0].content.alias;
                const comparator = filterQs.comparator;
                const values = filterQs.right.value;
                const updateCol = leaf.nounInputs.column[0].value;
                const updateVal = leaf.nounInputs.value[0].value;

                // set the id
                id = 'clean-update-row';

                // update the config
                config.pipeline.parameters = {
                    FILTERS: {
                        value: [
                            {
                                alias: alias,
                                comparator: comparator,
                                operator: '', // default empty in widget
                                type: 'value', // default 'value' in widget
                                values: Array.isArray(values)
                                    ? values[0]
                                    : values,
                            },
                        ],
                    },
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    UPDATE_ROW: {
                        value: {
                            newCol: updateCol,
                            newVal: updateVal,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ToUpperCase') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-upper-case';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    upperCaseCols: {
                        value: nounInputs.columns.map((c) => {
                            return c.value;
                        }),
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'UpdateMatchColumnValues') {
                const nounInputs = leaf.nounInputs,
                    frameName = nounInputs.frame[0].value.alias,
                    frameType = nounInputs.frame[0].value.frameType,
                    startingHeaders = idMapping.startingFrameHeaders[frameName];
                let matches = [],
                    columnExists = false,
                    selectedColumn = nounInputs.column[0].value;
                id = 'column-cleaner';

                // Check if the selected column was removed
                if (startingHeaders) {
                    for (
                        let i = 0;
                        i < startingHeaders.headerInfo.headers.length;
                        i++
                    ) {
                        if (
                            startingHeaders.headerInfo.headers[i].alias ===
                            selectedColumn
                        ) {
                            columnExists = true;
                        }
                    }
                }
                // Parse the matches in the correct format
                if (columnExists) {
                    matches = nounInputs.matches.map((match) => {
                        const values = match.value.split(' == ');
                        return {
                            left: values[1],
                            right: values[0],
                            distance: '0%',
                        };
                    });
                }

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: startingHeaders
                                ? startingHeaders.headerInfo.headers
                                : [],
                            joins: startingHeaders
                                ? startingHeaders.headerInfo.joins
                                : [],
                        },
                    },
                    COLUMN_CLEANER: {
                        value: {
                            matchesObj: matches,
                            col: columnExists ? selectedColumn : '',
                            matchTable: nounInputs.matchesTable[0].value,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Convert') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'convert-frame';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    type: {
                        value: nounInputs.frameType[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (
                leaf.opName === 'ToCsv' ||
                leaf.opName === 'ToTsv' ||
                leaf.opName === 'ToTxt' ||
                leaf.opName === 'ToExcel'
            ) {
                const frameName = leaf.nounInputs.qs[0].value.frameName;
                const frameType = leaf.nounInputs.qs[0].value.frameType;
                const operation = leaf.opString;

                // set the id
                id = 'export-file';

                // update the config
                config.pipeline.parameters = {
                    FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                        },
                    },
                    OPERATION: {
                        value: operation,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'ToPercent') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-to-percent';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    col: {
                        value: nounInputs.column[0].value,
                    },
                    sigDigits: {
                        value: nounInputs.sigDigits[0].value,
                    },
                    by100: {
                        value: nounInputs.by100
                            ? nounInputs.by100[0].value
                            : false,
                    },
                    newCol: {
                        value: nounInputs.newCol
                            ? nounInputs.newCol[0].value
                            : '',
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunSimilarity') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-similarity';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    selectors: {
                        type: nounInputs.attributes[0].type,
                        value: nounInputs.attributes
                            ? nounInputs.attributes.map((c) => {
                                  return c.value;
                              })
                            : [], //  nounInputs.attributes[0].value
                    },
                    instance: {
                        type: nounInputs.instance[0].type,
                        value: nounInputs.instance[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunOutlier') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-outliers';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    alpha: {
                        value: nounInputs.alpha[0].value,
                    },
                    selectors: {
                        value: nounInputs.attributes
                            ? nounInputs.attributes.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                    nullHandleType: {
                        value: nounInputs.nullHandleType[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunNumericalCorrelation') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-numerical-correlation';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    selectors: {
                        value: nounInputs.attributes
                            ? nounInputs.attributes.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunNumericalColumnSimilarity') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-numerical-column-similarity';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    selectors: {
                        value: nounInputs.columns
                            ? nounInputs.columns.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                    sampleSize: {
                        value: nounInputs.sampleSize[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunMatrixRegression') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-matrix-regression';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    selectors: {
                        value: nounInputs.xColumns
                            ? nounInputs.xColumns.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                    instance: {
                        value: nounInputs.yColumn[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunLOF') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-lof';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    selectors: {
                        value: nounInputs.attributes
                            ? nounInputs.attributes.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                    instance: {
                        value: nounInputs.instance[0].value,
                    },
                    k: {
                        value: nounInputs.kNeighbors[0].value,
                    },
                    uniqInstPerRow: {
                        value: nounInputs.uniqInstPerRow[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'SemanticDescription') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-explore-localmaster-descriptions';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    input: {
                        value: nounInputs.input[0].value,
                        input: undefined,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'StringExtract') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'clean-string-extract';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    col: {
                        value: nounInputs.column[0].value,
                    },
                    where: {
                        value: nounInputs.where[0].value,
                    },
                    opt: {
                        value: nounInputs.option[0].value,
                    },
                    amount: {
                        value: nounInputs.amount[0].value,
                    },
                    newCol: {
                        value: nounInputs.newCol[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'MetaSemanticSimilarity') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType[0].type; // TODO: confirm that this is correct

                // set the id
                id = 'analytics-description-generator';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    instance: {
                        value: nounInputs.qs[0].selectors[0].content.alias, // TODO: confirm that this is correct
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunDocSimilarity') {
                // TODO: Test this to confirm it's working properly
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                // id = 'analytics-document-similarity';

                // update the config
                // config.pipeline.parameters = {
                //     'SMSS_FRAME': {
                //         value: {
                //             name: frameName,
                //             type: frameType,
                //             headers: idMapping.startingFrameHeaders[frameName] ? idMapping.startingFrameHeaders[frameName].headerInfo.headers : [],
                //             joins: idMapping.startingFrameHeaders[frameName] ? idMapping.startingFrameHeaders[frameName].headerInfo.joins : [],
                //         }
                //     },
                //     'instance': {
                //         value: nounInputs.qs[0].selectors[0].content.alias, // TODO: confirm that this is correct (might not need to include alias)
                //     },
                //     'description': {
                //         value: nounInputs.qs[0].selectors[1].content.alias, // TODO: confirm that this is correct (might not need to include alias)
                //     },
                //     'override': {
                //         value: nounInputs.frame[0].value.override.value, // TODO: confirm that this is correct (might not need to include value)
                //     }
                // }

                // // add the output
                // config.pipeline.output.push({
                //     output: config.pipeline.output.length, // right now the only thing that is unique is the index
                //     downstream: {},
                //     frame: true,
                //     value: {
                //         name: frameName,
                //         type: frameType,
                //         headers: idMapping.endingFrameHeaders[frameName] ? idMapping.endingFrameHeaders[frameName].headerInfo.headers : [],
                //         joins: idMapping.endingFrameHeaders[frameName] ? idMapping.endingFrameHeaders[frameName].headerInfo.joins : [],
                //     }
                // });
                return _setCodeblock(config, node);
            } else if (leaf.opName === 'RunDescriptionGenerator') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-description-generator';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    instance: {
                        value: nounInputs.instance[0].value,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunClassification') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;

                // set the id
                id = 'analytics-classification';

                // update the config
                config.pipeline.parameters = {
                    SMSS_FRAME: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    instance: {
                        value: nounInputs.classify[0].value,
                    },
                    selectors: {
                        value: nounInputs.attributes
                            ? nounInputs.attributes.map((c) => {
                                  return c.value;
                              })
                            : [],
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'R' || leaf.opName === 'Py') {
                const script = leaf.rowInputs[0].value;
                // use the last frame if it exists, otherwise use this widget's current frame
                const frameName =
                    scope.pipeline.lastFrame.name ||
                    scope.widgetCtrl.getFrame('name');
                const frameType =
                    scope.pipeline.lastFrame.type ||
                    scope.widgetCtrl.getFrame('type');
                const modeMap = {
                    R: 'r',
                    Py: 'python',
                };

                id = 'pipeline-codeblock';
                config.pipeline.parameters = {
                    CODE: {
                        value: script,
                    },
                    FILES: {
                        value: {},
                    },
                    LANGUAGE: {
                        value: modeMap[leaf.opName] || '',
                    },
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'RunDataQuality') {
                // Right now data quality is not exposed in pipeline
                // const nounInputs = leaf.nounInputs;
                // const frameName = nounInputs.frame[0].value.alias;
                // const frameType = nounInputs.frame[0].value.frameType;

                // // set the id
                // id = 'quality-report';

                // // update the config
                // config.pipeline.parameters = {
                //     'SOURCE': {
                //         value: {
                //             name: frameName,
                //             type: frameType,
                //             headers: idMapping.startingFrameHeaders[frameName] ? idMapping.startingFrameHeaders[frameName].headerInfo.headers : [],
                //             joins: idMapping.startingFrameHeaders[frameName] ? idMapping.startingFrameHeaders[frameName].headerInfo.joins : [],
                //         }
                //     },
                //     'DATA_QUALITY': { // not sure if this is a problem, but each data quality rule sends as its own leaf
                //         value: {
                //             rule: nounInputs.rule[0].value,
                //             column: nounInputs.column[0].value,
                //             options: nounInputs.options ? nounInputs.options.map((c) => { return c.value; }) : [], // might need to be a map
                //             inputTable: nounInputs.inputTable[0].value
                //         }
                //     }
                // }

                // // add the output
                // config.pipeline.output.push({
                //     output: config.pipeline.output.length, // right now the only thing that is unique is the index
                //     downstream: {},
                //     frame: true,
                //     value: {
                //         name: frameName,
                //         type: frameType,
                //         headers: idMapping.endingFrameHeaders[frameName] ? idMapping.endingFrameHeaders[frameName].headerInfo.headers : [],
                //         joins: idMapping.endingFrameHeaders[frameName] ? idMapping.endingFrameHeaders[frameName].headerInfo.joins : [],
                //     }
                // });
                return _setCodeblock(config, node);
            } else if (leaf.opName === 'CollectNewCol') {
                // formula builder
                const query = node[2].opString;
                const qs = leaf.nounInputs.qs[0].value;
                const frameName = qs.frameName;
                const frameType = qs.frameType;

                // set the id
                id = 'add';

                // update the config
                config.pipeline.parameters = {
                    QS: {
                        value: qs,
                    },
                    QUERY: {
                        value: query,
                    },
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Purge') {
                const frameName = leaf.nounInputs.frame[0].value.alias;
                const frameType = leaf.nounInputs.frame[0].value.frameType;

                // set the id
                id = 'purge';

                // update the config
                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    filters: {
                        value: leaf.nounInputs.filters,
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else if (leaf.opName === 'Rank') {
                const nounInputs = leaf.nounInputs;
                const frameName = nounInputs.frame[0].value.alias;
                const frameType = nounInputs.frame[0].value.frameType;
                const columns: any = [];
                const partitionByCols: any = [];

                // set the id
                id = 'rank';
                // get the applied columns and sort values for Rank
                nounInputs.columns.forEach((element, index) => {
                    columns.push({
                        columns: element.value,
                        rankDir: nounInputs.sort[index].value,
                    });
                });

                // get the applied columns and sort values for Rank
                if (nounInputs.partitionByCols) {
                    nounInputs.partitionByCols.forEach((element) => {
                        partitionByCols.push(element.value);
                    });
                }

                // update the config

                config.pipeline.parameters = {
                    SOURCE: {
                        value: {
                            name: frameName,
                            type: frameType,
                            headers: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.headers
                                : [],
                            joins: idMapping.startingFrameHeaders[frameName]
                                ? idMapping.startingFrameHeaders[frameName]
                                      .headerInfo.joins
                                : [],
                        },
                    },
                    RANK_COLUMN: {
                        value: {
                            newCol: nounInputs.newCol[0].value,
                            columns: columns,
                            partitionByCols: partitionByCols,
                        },
                    },
                };

                // add the output
                config.pipeline.output.push({
                    output: config.pipeline.output.length, // right now the only thing that is unique is the index
                    downstream: {},
                    frame: true,
                    value: {
                        name: frameName,
                        type: frameType,
                        headers: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .headers
                            : [],
                        joins: idMapping.endingFrameHeaders[frameName]
                            ? idMapping.endingFrameHeaders[frameName].headerInfo
                                  .joins
                            : [],
                    },
                });
            } else {
                // generic or not specified so we will always use code block. if no frame exists, we will connect it to the first frame we find.
                // const qs = leaf.nounInputs.qs[0].value;
                // const frameName = qs.frameName;
                // const frameType = qs.frameType;
                // id = 'pipeline-codeblock';
            }

            // can't find an id
            if (!id) {
                return false;
            }

            return {
                id: id,
                config: config,
            };
        }

        /**
         * @name finishPipelineRender
         * @desc once previous nodes and nodes from outside of pipeline have been rendered, run the rest of pipeline
         *      render code
         */
        function finishPipelineRender(): void {
            // render the connections
            for (const key in scope.pipeline.data) {
                renderComponentConnection(key);
            }

            // nothing, open the landing
            if (Object.keys(scope.pipeline.data).length === 0) {
                scope.pipeline.landing.open = true;
            } else {
                scope.pipeline.landing.open = false;
                scope.pipeline.edit.open = false;
                setDownstream();
                positionComponents();
            }
        }

        /**
         * @name setDownstream
         * @desc once pipeline is set, confirm downstream and upstream for UI
         */
        function setDownstream(): void {
            Object.keys(scope.pipeline.data).forEach((key: string) => {
                const component = scope.pipeline.data[key];
                if (
                    component.output &&
                    component.output[0] &&
                    component.output[0].downstream &&
                    Object.keys(component.output[0].downstream).length > 0
                ) {
                    component.hasDownstream = true;
                }

                for (let i = 0; i < component.input.length; i++) {
                    const param = component.input[i];

                    if (
                        (!component.parameters[param] ||
                            !component.parameters[param].value) &&
                        component.parameters[param].required
                    ) {
                        // if (component.id === 'pipeline-codeblock') {
                        //     continue;
                        // }
                        if (component.id === 'pipeline-fuzzy-blend') {
                            continue;
                        }

                        component.validInput = false;
                        return;
                    }
                }

                component.validInput = true;
            });
        }

        /**
         * @name positionPipeline
         * @desc reposition the pipeline
         */
        function positionPipeline(): void {
            for (const key in scope.pipeline.data) {
                if (scope.pipeline.data.hasOwnProperty(key)) {
                    if (!scope.pipeline.data[key].position) {
                        scope.pipeline.data[key].position = {};
                    }

                    scope.pipeline.data[key].position.auto = true;
                }
            }

            positionComponents();

            let pixel = '';
            // once the positions have been set, we will save it to the BE
            for (const key in scope.pipeline.data) {
                if (scope.pipeline.data.hasOwnProperty(key)) {
                    if (scope.pipeline.data[key].uniqueKey) {
                        pixel += semossCoreService.pixel.build([
                            {
                                type: 'positionInsightRecipeStep',
                                components: [
                                    scope.pipeline.data[key].uniqueKey,
                                    scope.pipeline.data[key].position,
                                ],
                                terminal: true,
                                meta: true,
                            },
                        ]);
                    }
                }
            }

            if (pixel) {
                // going to just run a meta here because we dont want to repaint
                scope.widgetCtrl.meta([
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ]);
            }
        }

        /**
         * @name positionComponents
         * @desc position components (and set the arrow) if is auto positioned
         */
        function positionComponents(): void {
            let keys = Object.keys(scope.pipeline.data),
                startTop = COMPONENT_STYLES.gutter;

            // TODO: Fix positioning to take children into account.
            const keyLen = keys.length;

            // get the starting position map
            for (let keyIdx = 0; keyIdx < keyLen; keyIdx++) {
                const key = keys[keyIdx];
                // we want the position of the ones that we are not touching (they will stay the same)
                if (scope.pipeline.data[key].position.auto) {
                    continue;
                }

                if (
                    scope.pipeline.data[key].position.left ===
                    COMPONENT_STYLES.gutter
                ) {
                    const currentTop =
                        scope.pipeline.data[key].position.top +
                        COMPONENT_STYLES.height +
                        COMPONENT_STYLES.gutter;
                    if (startTop < currentTop) {
                        startTop = currentTop;
                    }
                }
            }

            for (let keyIdx = 0; keyIdx < keyLen; keyIdx++) {
                const key = keys[keyIdx];

                // if it was already positioned don't do it again
                if (!scope.pipeline.data[key].position.auto) {
                    continue;
                }

                const upstreamKeys: [string, string] = ['', ''];

                for (const parameter in scope.pipeline.data[key].parameters) {
                    if (
                        scope.pipeline.data[key].parameters.hasOwnProperty(
                            parameter
                        )
                    ) {
                        const param =
                            scope.pipeline.data[key].parameters[parameter];

                        if (param.upstream && param.upstream.key) {
                            if (!upstreamKeys[0]) {
                                upstreamKeys[0] = param.upstream.key;
                            } else {
                                upstreamKeys[1] = param.upstream.key;
                            }
                        }
                    }
                }

                const parentA = scope.pipeline.data[upstreamKeys[0]],
                    parentB = scope.pipeline.data[upstreamKeys[1]];

                // there are two parents, so put it in the 'top' lane
                let alignmentTop = 0,
                    alignmentLeft = 0;

                if (parentA && parentB) {
                    const topA: number = parentA.position.top,
                        topB: number = parentB.position.top,
                        leftA: number = parentA.position.left,
                        leftB: number = parentB.position.left;

                    if (topA > topB) {
                        alignmentTop = topB;
                    } else {
                        alignmentTop = topA;
                    }

                    if (leftA > leftB) {
                        alignmentLeft = leftA + COMPONENT_STYLES.width * 1.25;
                    } else {
                        alignmentLeft = leftB + COMPONENT_STYLES.width * 1.25;
                    }
                } else if (parentA) {
                    alignmentTop = parentA.position.top;
                    alignmentLeft =
                        parentA.position.left + COMPONENT_STYLES.width * 1.25;
                } else {
                    alignmentTop = startTop;
                    alignmentLeft = COMPONENT_STYLES.gutter;
                }

                if (alignmentTop < COMPONENT_STYLES.gutter) {
                    console.error('Layout has issues. Revist.');
                    alignmentTop = COMPONENT_STYLES.gutter;
                }

                if (alignmentLeft < COMPONENT_STYLES.gutter) {
                    console.error('Layout has issues. Revist.');
                    alignmentLeft = COMPONENT_STYLES.gutter;
                }

                // set auto to false, so we don't reset it
                scope.pipeline.data[key].position.auto = false;

                scope.pipeline.data[key].position.top = alignmentTop;
                scope.pipeline.data[key].position.left = alignmentLeft;

                // actually update the view
                scope.pipeline.eles[key].style.top = alignmentTop + 'px';
                scope.pipeline.eles[key].style.left = alignmentLeft + 'px';

                // increment to a new one
                if (alignmentLeft === COMPONENT_STYLES.gutter) {
                    const currentTop =
                        alignmentTop +
                        COMPONENT_STYLES.height +
                        COMPONENT_STYLES.gutter;
                    if (startTop < currentTop) {
                        startTop = currentTop;
                    }
                }
            }

            // TODO NEEL bug with a block not offsetting so the arrow is coming out of an incorrect block when trying to connect
            // position the arrow
            for (let keyIdx = 0; keyIdx < keyLen; keyIdx++) {
                const key = keys[keyIdx];

                const elId = `pipeline__component__side__output--${key}__0`;

                const outputEle = ele[0].querySelector(`#${elId}`);
                if (outputEle) {
                    plumbing.manage(elId, outputEle);

                    plumbing.updateOffset({
                        elId: elId,
                        offset: {
                            top:
                                scope.pipeline.data[key].position.top +
                                COMPONENT_STYLES.offset_top,
                            left:
                                scope.pipeline.data[key].position.left +
                                COMPONENT_STYLES.offset_left,
                        },
                    });
                }
            }

            // repaint the plumbing
            plumbing.repaintEverything();
        }

        /** Pipeline Actions */
        /**
         * @name createFrameName
         * @desc will create a frame name using the app that was selected
         * @param {string} base - the base name for the frame
         * @param {array} frames - optional parameter, list of existing frames
         * @returns {string} - the name created for the frame
         */
        function createFrameName(base: string): string {
            let name: string,
                rootName: string,
                frameCounter = 0,
                frameObj: any = scope.widgetCtrl.getShared('frames'),
                frames: any = [],
                frameName: string;

            if (!base) {
                // if nothing passed, return empty string
                return '';
            }

            name =
                base.replace(/[^a-zA-Z0-9._ ]/g, '').replace(/[ .]/g, '_') +
                '_FRAME' +
                semossCoreService.utility.random();
            // double underscores not allowed in frame name due to FRAME__TABLE structure
            name = name.replace(/__/g, '_');
            if (!isNaN(Number(name[0]))) {
                // first letter is a number, we need to clean so BE SQL doesn't error out
                // add an underscore to the front.
                name = '_' + name;
            }
            rootName = name;
            // Need to create an array of all the frame names uppercased because it must be case insensitive
            for (frameName in frameObj) {
                if (frameObj.hasOwnProperty(frameName)) {
                    frames.push(frameName.toUpperCase());
                }
            }

            while (frames.indexOf(name.toUpperCase()) > -1) {
                frameCounter++;
                name = rootName + '_' + frameCounter;
            }
            return name;
        }

        /**
         * @name searchMenu
         * @desc search the menu for the pipeline
         */
        function searchMenu(): void {
            const searchTerm: string = String(
                    scope.pipeline.menu.searched
                ).toUpperCase(),
                accordion = scope.pipeline.menu.accordion;

            for (let idx = 0, len = accordion.length; idx < len; idx++) {
                accordion[idx].items = [];

                for (
                    let componentIdx = 0,
                        componentLen = scope.pipeline.components.length;
                    componentIdx < componentLen;
                    componentIdx++
                ) {
                    // it has to have a menu
                    // Nothing should be searched or it has to be part of the name or description
                    if (
                        scope.pipeline.components[componentIdx].pipeline
                            .group === accordion[idx].name &&
                        scope.pipeline.components[componentIdx].id !==
                            'pipeline-existing-insight' &&
                        (!searchTerm ||
                            scope.pipeline.components[componentIdx].name
                                .toUpperCase()
                                .indexOf(searchTerm) > -1 ||
                            scope.pipeline.components[componentIdx].description
                                .toUpperCase()
                                .indexOf(searchTerm) > -1)
                    ) {
                        accordion[idx].items.push(
                            scope.pipeline.components[componentIdx]
                        );
                        // open up accordion if it has item
                        if (accordion[idx].height === 0) {
                            accordion[idx].height = 20;
                            for (let i = 0; i < len; i++) {
                                if (i === idx) continue;
                                if (accordion[i].height >= 80) {
                                    accordion[i].height -= 20;
                                    break;
                                } else if (accordion[i].height > 10) {
                                    accordion[i].height -= 10;
                                }
                            }
                        }
                    }
                }
            }
        }

        /**
         * @check requirements
         * @param config the config for the widget
         * @desc checks the config to see if there are any requirements
         * @returns {string} the message about requirements not met
         */
        function checkRequirements(config: any): string {
            let message = checkRRequirements(config);
            if (message) {
                return message;
            }

            message = checkPyRequirements(config);
            if (message) {
                return message;
            }

            return '';
        }

        /**
         * @name checkRRequirements
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the r requirements
         * @returns {string} message
         */
        function checkRRequirements(config: any): string {
            if (config.required.R) {
                let installedPackages =
                        semossCoreService.getWidgetState(
                            'installedPackages.R'
                        ) || [],
                    missingPackages: any = [];

                if (installedPackages.length > 0) {
                    for (
                        let requiredPackageIdx = 0,
                            requiredPackageLen = config.required.R.length;
                        requiredPackageIdx < requiredPackageLen;
                        requiredPackageIdx++
                    ) {
                        if (
                            installedPackages.indexOf(
                                config.required.R[requiredPackageIdx]
                            ) === -1
                        ) {
                            missingPackages.push(
                                config.required.R[requiredPackageIdx]
                            );
                        }
                    }
                } else {
                    missingPackages = config.required.R;
                }

                if (missingPackages.length > 0) {
                    return `${config.name} is missing ${missingPackages.join(
                        ', '
                    )}`;
                }
            }

            return '';
        }

        /**
         * @name checkPyRequirements
         * @param {object} config - config for the widget
         * @desc validate the handle and see if it is hidden or disabled. Send a message. Based on the py requirements
         * @returns {string} message
         */
        function checkPyRequirements(config: any): string {
            if (config.required.PY) {
                let installedPackages =
                        semossCoreService.getWidgetState(
                            'installedPackages.PY'
                        ) || [],
                    missingPackages: any = [];

                if (installedPackages.length > 0) {
                    for (
                        let requiredPackageIdx = 0,
                            requiredPackageLen = config.required.PY.length;
                        requiredPackageIdx < requiredPackageLen;
                        requiredPackageIdx++
                    ) {
                        if (
                            installedPackages.indexOf(
                                config.required.PY[requiredPackageIdx]
                            ) === -1
                        ) {
                            missingPackages.push(
                                config.required.PY[requiredPackageIdx]
                            );
                        }
                    }
                } else {
                    missingPackages = config.required.PY;
                }

                if (missingPackages.length > 0) {
                    return `${config.name} is missing ${missingPackages.join(
                        ', '
                    )}`;
                }
            }

            return '';
        }

        /** Component Functions */
        /**
         * @name addComponent
         * @desc add a new widget
         * @param id - id of the widget to add
         * @param pos - position information
         * @param updated - updated config
         * @param suppressEdit - true to not open component, false otherwise
         * @returns key - added key
         */
        function addComponent(
            id: string,
            pos: any,
            updated: any,
            suppressEdit: boolean
        ): string {
            let config, key, options, parameter, parameters, json, required;

            config = semossCoreService.getSpecificConfig(id);
            if (!config) {
                config = updated;
            } else {
                config = angular.merge(config, updated);
            }

            // get the key
            counter++;
            key = 'pipeline--' + counter;

            parameters = config.pipeline.parameters;

            // convert to an options string
            if (config.hasOwnProperty('content')) {
                if (config.content.hasOwnProperty('template')) {
                    options = config.content.template.options;
                } else if (config.content.hasOwnProperty('json')) {
                    options = {
                        json: config.content.json,
                    };

                    // not defined, set the default
                    if (typeof parameters === 'undefined') {
                        parameters = {
                            SMSS_FRAME: {
                                frame: true,
                            },
                        };
                    }

                    if (
                        !config.pipeline.input ||
                        config.pipeline.input.length === 0
                    ) {
                        config.pipeline.input = ['SMSS_FRAME'];
                    }
                }
            }

            scope.pipeline.data[key] = {
                id: config.id,
                uniqueKey: config.uniqueKey,
                icon: config.icon,
                options: options,
                position: {
                    auto: true, // auto position
                    top: 0,
                    left: 0,
                },
                dependsOn: config.dependsOn,
                showPreview: config.pipeline.showPreview || false,
                name: config.name,
                disableEdit: true,
                description: config.description,
                key: key,
                pixel: config.pipeline.pixel ? config.pipeline.pixel : '',
                parameters: {},
                required: config.required,
                preview: config.pipeline.preview ? config.pipeline.preview : '',
                input: config.pipeline.input ? config.pipeline.input : [],
                output: config.pipeline.output ? config.pipeline.output : [],
                state: config.pipeline.state
                    ? config.pipeline.state
                    : scope.pipeline.STATE.INITIAL, // two states initial, executed
                group: config.pipeline.group,
                usePixel: config.pipeline.usePixel ? true : false,
                warningReturned: config.warningReturned,
                errorReturned: config.errorReturned,
                message: config.message,
            };

            // if the added component is a source, it should always be editable, even if they did not execute.
            if (config.pipeline && config.pipeline.group === 'Source') {
                scope.pipeline.data[key].disableEdit = false;
            }

            // if position is passed back, we will set it
            if (config.position) {
                scope.pipeline.data[key].position.auto =
                    typeof config.position.auto === 'boolean'
                        ? config.position.auto
                        : true;
                scope.pipeline.data[key].position.top =
                    config.position.top || 0;
                scope.pipeline.data[key].position.left =
                    config.position.left || 0;
            }

            if (scope.pipeline.data[key].input.length === 0) {
                scope.pipeline.data[key].validInput = true;
            }

            if (typeof pos !== 'undefined' && typeof pos.top !== 'undefined') {
                scope.pipeline.data[key].position.auto = false; // turn auto position off because it was set

                scope.pipeline.data[key].position.top = pos.top;
            }

            if (
                scope.pipeline.data[key].position.top < COMPONENT_STYLES.gutter
            ) {
                scope.pipeline.data[key].position.top = COMPONENT_STYLES.gutter;
            }

            if (typeof pos !== 'undefined' && typeof pos.left !== 'undefined') {
                scope.pipeline.data[key].position.auto = false; // turn auto position off because it was set

                scope.pipeline.data[key].position.left = pos.left;
            }

            if (
                scope.pipeline.data[key].position.left < COMPONENT_STYLES.gutter
            ) {
                scope.pipeline.data[key].position.left =
                    COMPONENT_STYLES.gutter;
            }

            // construct the data backing the value, it is bound by the key
            // important note: We link the the upstream and downstream and use it to validate the options as we add more
            // set up the defaults
            for (const parameter in parameters) {
                if (parameters.hasOwnProperty(parameter)) {
                    scope.pipeline.data[key].parameters[parameter] = {
                        parameter: parameter,
                        upstream: parameters[parameter].upstream
                            ? parameters[parameter].upstream
                            : {},
                        frame: parameters[parameter].frame
                            ? parameters[parameter].frame
                            : true,
                        type: parameters[parameter].type
                            ? parameters[parameter].type
                            : '',
                        value: parameters[parameter].hasOwnProperty('value')
                            ? parameters[parameter].value
                            : undefined,
                        required: undefined, // set later
                    };
                }
            }

            // process the parameters and json to match
            if (
                config.hasOwnProperty('content') &&
                config.content.hasOwnProperty('json')
            ) {
                parameters = scope.pipeline.data[key].parameters;
                if (
                    parameters.SMSS_FRAME &&
                    parameters.SMSS_FRAME.value &&
                    parameters.SMSS_FRAME.value.headers
                ) {
                    scope.pipeline.data[key].options.json = setHeadersInParams(
                        scope.pipeline.data[key].options.json,
                        parameters.SMSS_FRAME.value.headers,
                        key
                    );
                }
                json = scope.pipeline.data[key].options.json;

                scope.pipeline.data[key].pixel = '';

                // loop through the JSON and update it
                for (
                    let queryIdx = 0, queryLen = json.length;
                    queryIdx < queryLen;
                    queryIdx++
                ) {
                    // remove the extra
                    // separate checks for <SMSS_REFRESH_INSIGHT> and <SMSS_REFRESH> to be added as components
                    if (
                        json[queryIdx].query.indexOf('<SMSS_REFRESH_INSIGHT>') >
                        -1
                    ) {
                        // remove this internal param
                        json[queryIdx].query = json[queryIdx].query.replace(
                            '<SMSS_REFRESH_INSIGHT>',
                            ''
                        );
                    } else if (
                        json[queryIdx].query.indexOf('<SMSS_REFRESH>') > -1
                    ) {
                        // remove this internal param
                        json[queryIdx].query = json[queryIdx].query.replace(
                            '<SMSS_REFRESH>',
                            ''
                        );
                    } else if (
                        json[queryIdx].query.indexOf('<SMSS_AUTO>') > -1
                    ) {
                        // remove this internal param
                        json[queryIdx].query = json[queryIdx].query.replace(
                            '<SMSS_AUTO>',
                            ''
                        );
                    }

                    // make the pixel
                    scope.pipeline.data[key].pixel += json[queryIdx].query;

                    // remove the execute as I take control
                    if (json[queryIdx].hasOwnProperty('execute')) {
                        delete json[queryIdx].execute;
                    }

                    // all of the params in the pipeline, must be in the json...
                    pipelineLoop: for (const parameter in parameters) {
                        if (parameters.hasOwnProperty(parameter)) {
                            for (
                                let paramIdx = 0,
                                    paramLen = json[queryIdx].params.length;
                                paramIdx < paramLen;
                                paramIdx++
                            ) {
                                // it is already there, continue
                                if (
                                    json[queryIdx].params[paramIdx]
                                        .paramName ===
                                    parameters[parameter].parameter
                                ) {
                                    continue pipelineLoop;
                                }
                            }

                            json[queryIdx].params.push({
                                paramName: parameters[parameter].parameter,
                            });
                        }
                    }

                    // all of the params in the json, must be in the pipeline...
                    for (
                        let paramIdx = 0,
                            paramLen = json[queryIdx].params.length;
                        paramIdx < paramLen;
                        paramIdx++
                    ) {
                        if (
                            !parameters.hasOwnProperty(
                                json[queryIdx].params[paramIdx].paramName
                            )
                        ) {
                            parameters[
                                json[queryIdx].params[paramIdx].paramName
                            ] = {
                                key: key,
                                parameter: parameter,
                                upstream: {},
                                type: 'PIXEL',
                                value:
                                    json[queryIdx].params[paramIdx] &&
                                    json[queryIdx].params[
                                        paramIdx
                                    ].hasOwnProperty('model') &&
                                    json[queryIdx].params[
                                        paramIdx
                                    ].model.hasOwnProperty('defaultValue')
                                        ? json[queryIdx].params[paramIdx].model
                                              .defaultValue
                                        : undefined, // this doesn't really matter since we will update
                            };
                        }
                    }
                }
            }

            //  mark what is required after processing all
            required = semossCoreService.pixel.parameterize(
                semossCoreService.pixel.tokenize(scope.pipeline.data[key].pixel)
            );

            // preview is not valid clean it reset it
            if (
                !scope.pipeline.data[key].parameters.hasOwnProperty(
                    scope.pipeline.data[key].preview
                )
            ) {
                scope.pipeline.data[key].preview = '';
            }

            for (const parameter in parameters) {
                if (parameters.hasOwnProperty(parameter)) {
                    scope.pipeline.data[key].parameters[parameter].required =
                        required.indexOf(parameter) > -1;

                    // figure out what is preview
                    if (
                        !scope.pipeline.data[key].preview &&
                        scope.pipeline.data[key].parameters[parameter].frame
                    ) {
                        scope.pipeline.data[key].preview = parameter;
                    }
                }
            }

            // render in the UI
            renderComponent(key);

            // position if we need to
            if (scope.pipeline.data[key].position.auto) {
                positionComponents();
            }

            // show it to edit the data
            // supressed when we build from saved components
            if (!suppressEdit && scope.pipeline.data[key].input.length === 0) {
                showComponent(key);
            }

            scope.pipeline.numComponents++;

            return key;
        }

        /**
         * @name setHeadersInParams
         * @desc sets the headers in the params if its using FrameHeaders()
         */
        function setHeadersInParams(json, headers, key) {
            const tempJson = semossCoreService.utility.freeze(json);
            function _getFilteredHeaders(pixel, headers) {
                // all the data types the BE can pass back mapped to what the pixel can take in
                // FrameHeaders(headerTypes=["INT"]) passes back dataType: "NUMBER"
                const TYPEMAP = {
                    NUMBER: ['INT', 'INTEGER', 'DOUBLE', 'NUMBER'],
                    STRING: ['STRING'],
                    DATE: ['DATE'],
                    TIMESTAMP: ['TIMESTAMP'],
                    FACTOR: ['STRING'],
                };
                let filteredHeaders: any = [];
                // if we're in here then we know the pixel has FrameHeaders. so lets just look for anything in between ( and )
                const matches = pixel.match(/\[.*\]/g);

                if (matches) {
                    // if for whatever reason it fails...let it fall back to all headers
                    try {
                        // filter down headers to only these types
                        const filters = JSON.parse(matches[0]);

                        // we are converting everything to uppercase so we can do case insensitive match
                        for (
                            let filterIdx = 0;
                            filterIdx < filters.length;
                            filterIdx++
                        ) {
                            filters[filterIdx] =
                                filters[filterIdx].toUpperCase();
                        }

                        // loop through all headers to see if they should be added based on whats in filters array
                        for (
                            let headerIdx = 0;
                            headerIdx < headers.length;
                            headerIdx++
                        ) {
                            // if they exist in our mapping then we will check against all the options since BE and FE are not in sync
                            // in terms of what we're passing to them and what data type they are passing back to us. INT --> NUMBER
                            if (
                                TYPEMAP[
                                    headers[headerIdx].dataType.toUpperCase()
                                ]
                            ) {
                                for (
                                    let filterIdx = 0;
                                    filterIdx < filters.length;
                                    filterIdx++
                                ) {
                                    if (
                                        TYPEMAP[
                                            headers[
                                                headerIdx
                                            ].dataType.toUpperCase()
                                        ].indexOf(filters[filterIdx]) > -1
                                    ) {
                                        filteredHeaders.push(
                                            headers[headerIdx]
                                        );
                                    }
                                }
                            } else if (
                                filters.indexOf(
                                    headers[headerIdx].dataType.toUpperCase()
                                ) > -1
                            ) {
                                // otherwise we will match directly instead of using TYPEMAP
                                filteredHeaders.push(headers[headerIdx]);
                            }
                        }
                    } catch {
                        console.warn(
                            'FrameHeader match found but string was not converted.'
                        );
                        // should not be in here...but we will set just in case
                        filteredHeaders = headers;
                    }
                } else {
                    // return everything because it has no filters
                    filteredHeaders = headers;
                }

                return filteredHeaders;
            }

            for (let jsonIdx = 0; jsonIdx < tempJson.length; jsonIdx++) {
                for (
                    let paramIdx = 0;
                    paramIdx < tempJson[jsonIdx].params.length;
                    paramIdx++
                ) {
                    const param = tempJson[jsonIdx].params[paramIdx];
                    // if we find the param that is using FrameHeaders, we will replace them with what we have
                    if (
                        param.model &&
                        param.model.query &&
                        param.model.query.indexOf('FrameHeaders') > 0
                    ) {
                        const query =
                            tempJson[jsonIdx].params[paramIdx].model.query;
                        // so we found a param that needs to be manipulated
                        // first we wipe the query so it doesnt make call to get from the frame
                        tempJson[jsonIdx].params[paramIdx].model.query = '';
                        // then we set the defaultOptions to be the headers we have
                        tempJson[jsonIdx].params[
                            paramIdx
                        ].model.defaultOptions = _getFilteredHeaders(
                            query,
                            headers
                        );
                        // if this block errored or warned, we need to validate the headers because they could have been removed and no longer valid
                        if (
                            scope.pipeline.data[key].warningReturned ||
                            scope.pipeline.data[key].errorReturned
                        ) {
                            // set this boolean specifically for pipeline-compiler to process the default value and validate it's in defaultOptions
                            tempJson[jsonIdx].params[
                                paramIdx
                            ].model.validateHeaders = true;
                        }
                    }
                }
            }

            return tempJson;
        }

        /**
         * @name renderComponent
         * @desc renders the initial component
         * @param key - key of the component
         */
        function renderComponent(key: string): void {
            let componentHTML: string;
            // create the HTML and append to the DOM. We do this manually so we can control the applied events
            componentHTML = `
                        <div class="pipeline__component"
                            id='${key}'
                            title="{{pipeline.data['${key}'].message || pipeline.data['${key}'].description}}">
                            <div class="pipeline__component__side">
                                <div id="pipeline__component__side__input" class="pipeline__component__side__holder">
                                </div>
                            </div>
                            <div class="pipeline__component__content" smss-tooltip="{{pipeline.data['${key}'].parameters.IMPORT_FRAME.value.name}}">
                                <div id="pipeline__component__box" class="pipeline__component__box"
                                     ng-class="{'pipeline__component__box--replay': pipeline.data['${key}'].replay, 'pipeline__component__box__warning': pipeline.data['${key}'].warningReturned, 'pipeline__component__box__error': pipeline.data['${key}'].errorReturned}">
                                    <div id="pipeline__component__box__action" class="pipeline__component__box__action">
                                        <smss-btn title="Move Component"
                                            class="smss-btn--icon pipeline__component__box__action__icon--drag">
                                            <i class="fa fa-arrows-alt"></i>
                                        </smss-btn>
                                        <smss-btn title="Remove Component"
                                            ng-click="$event.stopPropagation();pipeline.confirmDelete('${key}')"
                                            class="smss-btn--icon pipeline__component__box__action__icon--close">
                                            <i class="fa fa-times"></i>
                                        </smss-btn>
                                    </div>
                                    <div class="pipeline__component__box__img">
                                        <img ng-src="{{pipeline.data['${key}'].icon}}">
                                    </div>
                                    <div class="smss-text pipeline__component__box__text">
                                        {{pipeline.data['${key}'].name}}
                                    </div>
                                </div>
                                <div class="pipeline__component__action">
                                    <smss-btn class="smss-btn--icon"
                                        ng-if="!pipeline.data['${key}'].hasDownstream && pipeline.data['${key}'].validInput"
                                        title="View the underlying data"
                                        ng-click="pipeline.viewComponent('${key}')">
                                        <i class="fa fa-table"></i>
                                    </smss-btn>
                                    <smss-btn class="smss-btn--icon"
                                        ng-disabled="pipeline.data['${key}'].disableEdit"
                                        title="Update this data"
                                        ng-click="pipeline.showComponent('${key}', true)">
                                        <i class="fa fa-edit"></i>
                                    </smss-btn>
                                    <smss-btn class="smss-btn--icon"
                                        ng-if="!pipeline.data['${key}'].hasDownstream && pipeline.data['${key}'].validInput"
                                        title="Federate this data"
                                        ng-click="pipeline.showFederate('${key}')"
                                        ng-hide="pipeline.data['${key}'].group === 'Source' && pipeline.data['${key}'].output[0].value.type === 'NATIVE'">
                                        <i class="fa fa-link"></i>
                                    </smss-btn>
                                    <smss-btn class="smss-btn--icon"
                                        ng-if="!pipeline.data['${key}'].hasDownstream && pipeline.data['${key}'].validInput"
                                        title="Visualize this data"
                                        ng-click="pipeline.visualizeComponent('${key}')">
                                        <i class="fa fa-bar-chart"></i>
                                    </smss-btn>
                                </div>
                            </div>
                            <div class="pipeline__component__side">
                                <div id="pipeline__component__side__output" class="pipeline__component__side__holder">
                                </div>
                            </div>
                        </div>`;

            // create, mount, and compile the element
            scope.pipeline.eles[key] = angular.element(componentHTML)[0];
            pipelineWorkspaceContentEle.appendChild(scope.pipeline.eles[key]);
            $compile(scope.pipeline.eles[key])(scope);

            // position
            scope.pipeline.eles[key].style.top =
                scope.pipeline.data[key].position.top + 'px';
            scope.pipeline.eles[key].style.left =
                scope.pipeline.data[key].position.left + 'px';

            // add the input fields
            renderComponentInput(key);

            scope.pipeline.movable[key] = Movable({
                handle: scope.pipeline.eles[key].querySelector(
                    '#pipeline__component__box'
                ),
                content: scope.pipeline.eles[key],
                on: () => {
                    // TODO: do we want to repaint everything, or just what was moved?
                    plumbing.repaintEverything();
                },
                stop: (top: string, left: string) => {
                    let pixel = '';
                    const component = scope.pipeline.data[key];

                    component.position.top = top;
                    component.position.left = left;

                    if (
                        component.output[0] &&
                        Object.keys(component.output[0].downstream).length === 0
                    ) {
                        plumbing.updateOffset({
                            elId: `pipeline__component__side__output--${key}__0`,
                            offset: {
                                left: left + COMPONENT_STYLES.offset_left,
                                top: top + COMPONENT_STYLES.offset_top,
                            },
                        });
                    }

                    // if no key then we dont have this block in the BE yet so no need to run to save position
                    if (scope.pipeline.data[key].uniqueKey) {
                        pixel += semossCoreService.pixel.build([
                            {
                                type: 'positionInsightRecipeStep',
                                components: [
                                    scope.pipeline.data[key].uniqueKey || '',
                                    scope.pipeline.data[key].position,
                                ],
                                terminal: true,
                                meta: true,
                            },
                        ]);

                        // going to just run a meta here because we dont want to repaint
                        scope.widgetCtrl.meta([
                            {
                                type: 'Pixel',
                                components: [pixel],
                                terminal: true,
                            },
                        ]);
                    }
                },
            });
        }

        /**
         * @name renderComponentInput
         * @desc render the input of the component
         * @param key - key of the component
         */
        function renderComponentInput(key: string): void {
            const sideEle: HTMLElement = scope.pipeline.eles[key].querySelector(
                '#pipeline__component__side__input'
            );

            for (
                let inputIdx = 0,
                    inputLen = scope.pipeline.data[key].input.length;
                inputIdx < inputLen;
                inputIdx++
            ) {
                // html
                let inputHTML: string, inputEle: HTMLElement;

                inputHTML = `
                <smss-btn class="smss-btn--icon pipeline__component__side__btn"
                    id="pipeline__component__side__input--${key}__${scope.pipeline.data[key].input[inputIdx]}"
                    ng-class="{'pipeline__component__side__btn--disabled': pipeline.data['${key}'].state !== pipeline.STATE.INITIAL}"
                    ng-disabled="pipeline.data['${key}'].state !== pipeline.STATE.INITIAL">
                    <i class="fa fa-arrow-circle-right"></i>
                </smss-btn>`;

                inputEle = $compile(inputHTML)(scope)[0];

                sideEle.appendChild(inputEle);

                plumbing.makeTarget(inputEle, {
                    isTarget: true,
                    anchor: 'LeftMiddle',
                    endpoint: 'Blank',
                    connectionsDetachable: false,
                    maxConnections: 1,
                    beforeDrop: linkComponent,
                });
            }

            // position it
            sideEle.style.top = `calc(50% - ${sideEle.clientHeight / 2}px)`;
        }

        /**
         * @name renderComponentOutput
         * @desc render the output of the component
         * @param {string} key - key of the component
         * @returns {void}
         */
        function renderComponentOutput(key: string): void {
            const sideEle: HTMLElement = scope.pipeline.eles[key].querySelector(
                    '#pipeline__component__side__output'
                ),
                outputEles: HTMLElement[] = [];

            for (
                let outputIdx = 0,
                    outputLen = scope.pipeline.data[key].output.length;
                outputIdx < outputLen;
                outputIdx++
            ) {
                // html
                let outputHTML: string, outputEle: HTMLElement;

                outputHTML = `<smss-btn class="smss-btn--icon pipeline__component__side__btn"
                    id="pipeline__component__side__output--${key}__${outputIdx}"
                    ng-disabled="pipeline.data['${key}'].hasDownstream">
                    <i class="fa fa-arrow-circle-right"></i>
                </smss-btn>`;

                // re-executing component will generate multiple side arrows if we dont check children
                if (sideEle.children.length === 0) {
                    outputEle = $compile(outputHTML)(scope)[0];
                    sideEle.appendChild(outputEle);

                    makePlumbingSource(outputEle);
                    outputEles.push(outputEle);
                }

                if (scope.pipeline.data[key].disableEdit) {
                    scope.pipeline.data[key].disableEdit = false;
                }
            }

            // position it
            sideEle.style.top = `calc(50% - ${sideEle.clientHeight / 2}px)`;
            // add it to managed elements
            outputEles.forEach((ele) => plumbing.manage(ele.id, ele));
        }

        /**
         * @name renderComponentOptions
         * @param key - component to update
         * @desc render the component options, according to the data passed in
         */
        function renderComponentOptions(key: string): void {
            const component = scope.pipeline.data[key];

            if (!component) {
                return;
            }

            if (
                component.id === 'pipeline-app' ||
                component.id === 'pipeline-query'
            ) {
                const qs = component.parameters.QUERY_STRUCT.value;

                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'databaseInfo',
                            components: [qs.engineName],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    (response: PixelReturnPayload) => {
                        const output = response.pixelReturn[0].output,
                            type = response.pixelReturn[0].operationType;

                        if (type.indexOf('ERROR') > -1) {
                            return;
                        }

                        // update the image + name
                        component.name = output.database_name.replace(
                            /_/g,
                            ' '
                        );
                        component.icon =
                            semossCoreService.app.generateDatabaseImageURL(
                                qs.engineName
                            ) +
                            '?time=' +
                            new Date().getTime();
                    }
                );
            } else if (component.id === 'pipeline-file') {
                const qs = component.parameters.QUERY_STRUCT.value;

                // set the name
                if (qs.filePath) {
                    const fileName = qs.filePath;

                    component.name = fileName.substring(
                        fileName.lastIndexOf('\\') + 1
                    );
                }

                // set the icon
                // TODO: TSV and paste
                let child = '';
                if (qs.qsType === 'CSV_FILE') {
                    child = 'pipeline-file$CSV';
                } else if (qs.qsType === 'EXCEL_FILE') {
                    child = 'pipeline-file$Excel';
                } else if (qs.qsType === 'RAW_RDF_FILE_ENGINE_QUERY') {
                    child = 'pipeline-rdf-file';
                }

                if (child) {
                    const config = semossCoreService.getSpecificConfig(child);
                    if (config) {
                        component.icon = config.icon;
                    }
                }
            } else if (component.id === 'pipeline-external') {
                const qs = component.parameters.QUERY_STRUCT.value;

                if (qs.config && qs.config.dbDriver) {
                    const connector = CONNECTORS[qs.config.dbDriver];

                    component.name = connector.name;
                    component.icon = connector.image;
                }
            } else {
                //noop
            }
        }

        /**
         * @name makePlumbingSource
         * @param ele - ele to make jsplumb source
         * @desc makes the ele a jsplumb source
         */
        function makePlumbingSource(ele: HTMLElement): void {
            plumbing.makeSource(ele, {
                isSource: true,
                anchor: 'RightMiddle',
                endpoint: 'Blank',
                connectionsDetachable: false,
                maxConnections: 1,
                connector: [
                    'Flowchart',
                    {
                        cssClass: 'pipeline__plumbing__connector',
                    },
                ],
                connectorOverlays: [
                    [
                        'Arrow',
                        {
                            location: 1,
                            length: 8,
                            width: 8,
                            cssClass: 'pipeline__plumbing__overlay',
                        },
                    ],
                ],
            });
        }

        /**
         * @name renderComponentConnection
         * @desc render all of the downstream connections
         * @param key - key of the component
         */
        function renderComponentConnection(key: string): void {
            for (
                let outputIdx = 0,
                    outputLen = scope.pipeline.data[key].output.length;
                outputIdx < outputLen;
                outputIdx++
            ) {
                if (
                    Object.keys(
                        scope.pipeline.data[key].output[outputIdx].downstream
                    ).length > 0
                ) {
                    plumbing.connect({
                        source: scope.pipeline.eles[key].querySelector(
                            `#pipeline__component__side__output--${key}__${scope.pipeline.data[key].output[outputIdx].output}`
                        ),
                        target: scope.pipeline.eles[
                            scope.pipeline.data[key].output[outputIdx]
                                .downstream.key
                        ].querySelector(
                            `#pipeline__component__side__input--${scope.pipeline.data[key].output[outputIdx].downstream.key}__${scope.pipeline.data[key].output[outputIdx].downstream.parameter}`
                        ),
                        detachable: false,
                        anchors: ['RightMiddle', 'LeftMiddle'],
                        endpoint: 'Blank',
                        connectionsDetachable: false,
                        maxConnections: 1,
                        connector: [
                            'Flowchart',
                            {
                                cssClass: 'pipeline__plumbing__connector',
                            },
                        ],
                        connectorOverlays: [
                            [
                                'Arrow',
                                {
                                    location: 1,
                                    length: 8,
                                    width: 8,
                                    cssClass: 'pipeline__plumbing__overlay',
                                },
                            ],
                        ],
                    });
                }
            }
        }

        /**
         * @name getComponent
         * @param key - key of the component
         * @desc called to get the value of the current parameter
         * @param accessor - accessor what data to grab
         * @returns current value
         */
        function getComponent(key: string, accessor: string): any {
            return semossCoreService.utility.getter(
                scope.pipeline.data[key],
                accessor
            );
        }

        /**
         * @name confirmDelete
         * @param {string} key popup for confirmin the removal of the block and its downstream
         * @desc show a popup to confirm removal
         * @returns {void}
         */
        function confirmDelete(key) {
            scope.pipeline.delete.open = true;
            scope.pipeline.delete.key = key;
        }

        /**
         * @name removeComponent
         * @param key - key of the component
         * @desc close the widget
         */
        function removeComponent(key: string): void {
            let downstreams: any = [],
                keysToDelete = [scope.pipeline.data[key].uniqueKey];
            // we haven't executed this component yet, so it is safe to continue
            if (
                scope.pipeline.data[key].state === scope.pipeline.STATE.INITIAL
            ) {
                deleteComponent(key);

                closePreview();
                return;
            }

            // get any downstream blocks we need to remove
            downstreams = getDownstreamBlocks(key);

            // add it to a list to delete from the BE recipe steps
            for (
                let downstreamIdx = 0;
                downstreamIdx < downstreams.length;
                downstreamIdx++
            ) {
                if (
                    scope.pipeline.data[downstreams[downstreamIdx]] &&
                    scope.pipeline.data[downstreams[downstreamIdx]].uniqueKey
                ) {
                    keysToDelete.push(
                        scope.pipeline.data[downstreams[downstreamIdx]]
                            .uniqueKey
                    );
                }
            }

            scope.widgetCtrl.execute([
                {
                    type: 'setInsightConfig',
                    components: [
                        semossCoreService.workspace.saveWorkspace(
                            scope.widgetCtrl.insightID
                        ),
                    ],
                    terminal: true,
                    meta: true,
                },
                {
                    type: 'deleteInsightRecipeStep',
                    components: [keysToDelete],
                    terminal: true,
                    meta: true,
                },
            ]);
        }

        /**
         * @name deleteComponent
         * @param key - key of the component
         * @desc delete the block and any downstreams for this block. FE only
         */
        function deleteComponent(key: string): void {
            if (!scope.pipeline.data[key]) {
                // already deleted
                return;
            }

            // remove the downstream
            if (scope.pipeline.data[key].output.length > 0) {
                const downstreamBlocks: string[] = getDownstreamBlocks(key);
                for (
                    let blockIdx = 0;
                    blockIdx < downstreamBlocks.length;
                    blockIdx++
                ) {
                    deleteComponent(downstreamBlocks[blockIdx]);
                }
            }

            // make it not movable (remove the reference)
            if (scope.pipeline.movable[key]) {
                scope.pipeline.movable[key].destroy();
            }

            for (
                let inputIdx = 0,
                    inputLen = scope.pipeline.data[key].input.length;
                inputIdx < inputLen;
                inputIdx++
            ) {
                plumbing.remove(
                    `pipeline__component__side__input--${key}__${scope.pipeline.data[key].input[inputIdx]}`
                );
            }

            for (
                let outputIdx = 0,
                    outputLen = scope.pipeline.data[key].output.length;
                outputIdx < outputLen;
                outputIdx++
            ) {
                plumbing.remove(
                    `pipeline__component__side__output--${key}__${outputIdx}`
                );
            }

            if (
                scope.pipeline.eles[key] &&
                scope.pipeline.eles[key].parentNode !== null
            ) {
                scope.pipeline.eles[key].parentNode.removeChild(
                    scope.pipeline.eles[key]
                );
            }

            // delete the reference
            delete scope.pipeline.data[key];

            scope.pipeline.numComponents--;

            // look through the parent components and remove references to deleted components
            Object.keys(scope.pipeline.data).forEach((k) => {
                scope.pipeline.data[k].output.forEach((output) => {
                    if (output.downstream && output.downstream.key === key) {
                        output.downstream = {};
                        scope.pipeline.data[k].hasDownstream = false;
                    }
                });
            });
        }

        /**
         * @name getDownstreamBlocks
         * @param {string} key the key to the starting block to get downstreams for
         * @desc get all the downstream blocks connected to this key
         * @returns {array} the list of downstream keys
         */
        function getDownstreamBlocks(key: string): string[] {
            const downstream: any = [],
                queue = [
                    semossCoreService.utility.freeze(
                        scope.pipeline.data[key].output
                    ),
                ];

            while (queue.length > 0) {
                const outputs = queue.shift();
                let currentOutput;
                for (
                    let outputIdx = 0;
                    outputIdx < outputs.length;
                    outputIdx++
                ) {
                    currentOutput = outputs[outputIdx];
                    if (
                        currentOutput.downstream &&
                        currentOutput.downstream.key
                    ) {
                        downstream.push(currentOutput.downstream.key);
                        queue.push(
                            semossCoreService.utility.freeze(
                                scope.pipeline.data[
                                    currentOutput.downstream.key
                                ].output
                            )
                        );
                    }
                }
            }

            return downstream;
        }

        /**
         * @name previewFrame
         * @param key - last component in pipeline frame
         * @desc called when user reruns pipeline and preview was already opened, just need to query the frame
         */
        function previewFrame(key: string): void {
            if (scope.pipeline.data[key].output.length === 0) {
                return;
            }
            const pixel = semossCoreService.pixel.build([
                {
                    type: 'frame',
                    components: [scope.pipeline.data[key].output[0].value.name],
                    meta: true,
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'limit',
                    components: [PREVIEW_LIMIT],
                },
                {
                    type: 'collect',
                    components: [500],
                    terminal: true,
                },
            ]);

            scope.widgetCtrl.emit('load-preview', {
                pixelComponents: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
            });
        }

        /**
         * @name showFederate
         * @param key - key of the component
         * @desc show the federate overlay
         * @returns {void}
         */
        function showFederate(key: string): void {
            let frame = '',
                type = '',
                outputIdx: number,
                headers: any = [];

            const output = getComponent(key, 'output');

            // find the frame name in the output
            for (outputIdx = 0; outputIdx < output.length; outputIdx++) {
                // if its a frame output, we will set the output
                if (output[outputIdx].frame) {
                    frame = output[outputIdx].value.name;
                    headers = output[outputIdx].value.headers;
                    type = output[outputIdx].value.type;
                }
            }

            closePreview();
            scope.pipeline.federate = {
                name: 'federate',
                open: true,
                key: key,
                frame: frame,
                type: type,
                importHeight: 100,
                previewHeight: 0,
                headers: headers,
            };
        }

        /**
         * @name showComponent
         * @param key - key of the component
         * @desc close the component detail for the selected component and stop editing
         */
        function showComponent(key: string): void {
            closePreview();

            scope.pipeline.edit = {
                name: scope.pipeline.data[key].name,
                open: true,
                selected: key,
                height: 100,
                preview: 0,
                showPreview: scope.pipeline.data[key].showPreview || false,
            };
        }

        /**
         * @name closeComponent
         * @param key - key of the component
         * @desc close the component detail for the selected component and stop editing, if key is empty
         *       simply closes the edit overlay
         */
        function closeComponent(key: string): void {
            // if there is only one component and it is not set, remove it.
            if (
                scope.pipeline.data.hasOwnProperty(key) &&
                scope.pipeline.data[key].state ===
                    scope.pipeline.STATE.INITIAL &&
                Object.keys(scope.pipeline.data).length === 1
            ) {
                // cancelled the first component which has been added but not imported yet need to reset the counter
                counter = 0;

                // remove it
                removeComponent(key);

                // render the landing
                scope.pipeline.landing.open = true;
            }

            scope.pipeline.edit = {
                open: false,
                selected: undefined,
                height: 100,
                preview: 0,
            };
        }

        /**
         * @name validateComponent
         * @desc validate that the component is valid
         * @param key - key of the component
         * @param values - map containing parameter to updated values
         * @returns valid or invalid
         */
        function validateComponent(key: string, values: string): boolean {
            // check if it is there or not
            for (const parameter in scope.pipeline.data[key].parameters) {
                if (
                    scope.pipeline.data[key].parameters.hasOwnProperty(
                        parameter
                    ) &&
                    scope.pipeline.data[key].parameters[parameter].required
                ) {
                    // if it is part of the pixel script, then it must be valid
                    if (typeof values[parameter] === 'undefined') {
                        return false;
                    }
                }
            }

            return true;
        }

        /**
         * @name buildComponent
         * @desc preview the data of this component
         * @param key - key of the component
         * @param values - map containing parameter to updated values
         */
        function buildComponent(key: string, values: any): string {
            const tokens = semossCoreService.pixel.tokenize(
                    scope.pipeline.data[key].pixel
                ),
                updated: any = {};

            for (const parameter in values) {
                if (
                    values.hasOwnProperty(parameter) &&
                    scope.pipeline.data[key].parameters.hasOwnProperty(
                        parameter
                    )
                ) {
                    updated[parameter] = generateComponentValue(
                        scope.pipeline.data[key].parameters[parameter].type,
                        values[parameter]
                    );
                }
            }

            return semossCoreService.pixel.construct(tokens, updated);
        }

        /**
         * @name buildCountComponent
         * @desc get the total count for this component
         * @param key - key of the component
         * @param values - map containing parameter to updated values
         */
        function buildCountComponent(key: string, values: any): string {
            const tokens = semossCoreService.pixel.tokenize(
                    '<QUERY_STRUCT> | QueryRowCount();'
                ),
                updated: any = {},
                tempValues = semossCoreService.utility.freeze(values);

            for (const parameter in tempValues) {
                // we only care about the QUERY_STRUCT
                if (
                    tempValues.hasOwnProperty(parameter) &&
                    scope.pipeline.data[key].parameters.hasOwnProperty(
                        parameter
                    )
                ) {
                    if (parameter === 'QUERY_STRUCT') {
                        delete tempValues[parameter].limit;
                        delete tempValues[parameter].offset;
                        delete tempValues[parameter].orders;
                        // // need one selector wrapped in a count
                        // tempValues[parameter].selectors = [tempValues[parameter].selectors[0]];
                        // if(tempValues[parameter].selectors[0].type === 'COLUMN') {
                        //     tempValues[parameter].selectors[0].type = 'FUNCTION';
                        //     // must define the inner selector
                        //     tempValues[parameter].selectors[0].content.innerSelectors = [];
                        //     tempValues[parameter].selectors[0].content.innerSelectors.push({
                        //         'content' : {
                        //             'column' : tempValues[parameter].selectors[0].content.column,
                        //             'table' : tempValues[parameter].selectors[0].content.table
                        //         }
                        //     })
                        //     tempValues[parameter].selectors[0].content.function = 'Count';
                        //     tempValues[parameter].selectors[0].content.alias = 'row_count';
                        // } else {
                        //     /**
                        //      * TODO: NEED TO LOOK AT HOW TO GET A PROPER COUNT WHEN YOU
                        //      * ARE ALREADY DOING AN AGGREGATION ON A COLUMN
                        //      */
                        //     // just reassign the function to count for now...
                        //     // just dont want the query to break
                        //     tempValues[parameter].selectors[0].content.function = 'Count';
                        //     tempValues[parameter].selectors[0].content.alias = 'row_count';
                        // }
                    }
                    updated[parameter] = generateComponentValue(
                        scope.pipeline.data[key].parameters[parameter].type,
                        tempValues[parameter]
                    );
                }
            }

            return semossCoreService.pixel.construct(tokens, updated);
        }

        /**
         * @name generateComponentValue
         * @desc preview the data of this component
         * @param type - type to generate value for
         * @param value - value to generate for
         */
        function generateComponentValue(type: string, value: any): any {
            let val;

            if (type === 'CREATE_FRAME' && value && value.type === 'default') {
                if (CONFIG.defaultFrameType) {
                    value.type = CONFIG.defaultFrameType;
                } else {
                    value.type = 'GRID';
                }
            }

            if (typeof value !== 'object') {
                val = value;
            } else {
                val = JSON.parse(JSON.stringify(value));
            }

            if (!type || type === 'PIXEL') {
                return val;
            }

            // this is the value (we just use another pixel string as the value)
            val = semossCoreService.pixel.build([
                {
                    type: type,
                    components: [val],
                },
            ]);
            val = val.slice(0, -2); // remove the last pipe and semicolon

            return val;
        }

        /**
         * @name previewComponent
         * @desc preview the data of this component
         * @param key - key of the component
         * @param values - map containing parameter to updated values
         */
        function previewComponent(key: string, values: any): void {
            let previewData: any = {},
                tempValues = semossCoreService.utility.freeze(values);

            // setting it to a new frame because python does not have a namespace
            if (tempValues.IMPORT_FRAME) {
                tempValues.IMPORT_FRAME.name = tempValues.IMPORT_FRAME.name
                    ? tempValues.IMPORT_FRAME.name + '__Preview'
                    : 'PreviewFrame';
            }

            if (timeout) {
                $timeout.cancel(timeout);
            }

            timeout = $timeout(() => {
                let pixel = '';

                // validate, if it isn't valid load the 'base' (nothing or the table)
                if (!validateComponent(key, tempValues)) {
                    pixel = '';
                    // preview on of the frames
                    if (
                        scope.pipeline.data[key].parameters[
                            scope.pipeline.data[key].preview
                        ] &&
                        scope.pipeline.data[key].parameters[
                            scope.pipeline.data[key].preview
                        ].value &&
                        scope.pipeline.data[key].parameters[
                            scope.pipeline.data[key].preview
                        ].value.name
                    ) {
                        pixel += semossCoreService.pixel.build([
                            {
                                type: 'frame',
                                components: [
                                    scope.pipeline.data[key].parameters[
                                        scope.pipeline.data[key].preview
                                    ].value.name,
                                ],
                                meta: true,
                            },
                            {
                                type: 'queryAll',
                                components: [],
                            },
                            {
                                type: 'limit',
                                components: [scope.pipeline.previewLimit],
                            },
                            {
                                type: 'collect',
                                components: [500],
                                terminal: true,
                            },
                        ]);
                    }

                    if (pixel.length === 0) {
                        scope.widgetCtrl.emit('load-preview', {
                            pixelComponents: [],
                        });
                        return;
                    }

                    scope.widgetCtrl.emit('load-preview', {
                        pixelComponents: [
                            {
                                type: 'Pixel',
                                components: [pixel],
                                terminal: true,
                            },
                        ],
                    });

                    return;
                }

                pixel += buildComponent(key, tempValues);

                if (pixel.length === 0) {
                    scope.widgetCtrl.emit('load-preview', {
                        pixelComponents: [],
                    });
                    return;
                }

                // preview on of the frames
                if (scope.pipeline.data[key].preview) {
                    pixel += semossCoreService.pixel.build([
                        {
                            type: 'frame',
                            components: [
                                tempValues[scope.pipeline.data[key].preview]
                                    .name,
                            ],
                            meta: true,
                        },
                        {
                            type: 'queryAll',
                            components: [],
                        },
                        {
                            type: 'limit',
                            components: [scope.pipeline.previewLimit],
                        },
                        {
                            type: 'collect',
                            components: [500],
                            terminal: true,
                        },
                    ]);
                }

                previewData = {
                    pixelComponents: [
                        {
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        },
                    ],
                };

                // if we're querying from the database, we will append the count pixel
                if (
                    tempValues.QUERY_STRUCT &&
                    (tempValues.QUERY_STRUCT.qsType === 'ENGINE' ||
                        tempValues.QUERY_STRUCT.qsType === 'RAW_ENGINE_QUERY' ||
                        tempValues.QUERY_STRUCT.qsType ===
                            'RAW_JDBC_ENGINE_QUERY' ||
                        tempValues.QUERY_STRUCT.qsType === 'FRAME' ||
                        tempValues.QUERY_STRUCT.qsType === 'RAW_FRAME_QUERY')
                ) {
                    previewData.totalCountPixelComponents = [
                        {
                            type: 'Pixel',
                            components: [buildCountComponent(key, tempValues)],
                            terminal: true,
                        },
                    ];
                }

                if (
                    (scope.pipeline.data[key].options &&
                        scope.pipeline.data[key].options.fileType) ||
                    (scope.pipeline.data[key].group === 'Source' &&
                        scope.pipeline.data[key].name === 'File')
                ) {
                    // cant run on new insight for preview because the file has been uploaded to a specific insight
                    previewData.newInsight = false;
                } else {
                    // preview in new insight for non file sources
                    previewData.newInsight = true;
                }

                scope.widgetCtrl.emit('load-preview', previewData);
            }, 300);
        }

        /**
         * @name expandPreviewComponent
         * @desc preview the data of this component
         */
        function expandPreviewComponent(): void {
            scope.pipeline.edit.height = 60;
            scope.pipeline.edit.preview = 40;
        }

        /**
         * @name getFrameConversionPixel
         * @param key the component to check
         * @desc see if we need to generate the frame conversion pixel
         * @returns {string} the pixel to conver the frame
         */
        function getFrameConversionPixel(key: string): string {
            let requiresConversion = false,
                frameName = '',
                frameType = '',
                pixel = '';
            const component = scope.pipeline.data[key],
                input = component.input,
                requiredFrameTypes =
                    component.required && component.required.Frame
                        ? component.required.Frame
                        : [];

            // input[1] is the 'destination' frame, which is the frame we would need to convert in cases like fuzzy merge
            if (input[1]) {
                frameName = component.parameters[input[1]]
                    ? component.parameters[input[1]].value.name
                    : '';
                frameType = component.parameters[input[1]]
                    ? component.parameters[input[1]].value.type
                    : '';
            } else if (input[0]) {
                frameName = component.parameters[input[0]]
                    ? component.parameters[input[0]].value.name
                    : '';
                frameType = component.parameters[input[0]]
                    ? component.parameters[input[0]].value.type
                    : '';
            } else {
                // expecting an input frame, if for some reason not, just return empty pixel
                return pixel;
            }

            if (requiredFrameTypes.length > 0 && frameName && frameType) {
                if (requiredFrameTypes.indexOf(frameType) === -1) {
                    // we need to convert the frame. so lets generate the pixel for it
                    pixel = semossCoreService.pixel.build([
                        {
                            type: 'variable',
                            components: [frameName],
                        },
                        {
                            type: 'convert',
                            components: [requiredFrameTypes[0]],
                            terminal: true,
                        },
                    ]);
                }
            }

            return pixel;
        }

        /**
         * @name executeComponent
         * @desc close the component detail for the selected component
         * @param key - key of the component
         * @param values - map containing parameter to updated values
         * @param options - updated options
         */
        function executeComponent(
            key: string,
            values: any,
            options: any,
            cb?: (...args: any) => any
        ): void {
            let pixel: string;

            if (!validateComponent(key, values)) {
                return;
            }

            pixel = buildComponent(key, values);

            if (!pixel) {
                return;
            }

            // we need to check this component to see if we need to convert the frame to R/Py
            // if so, we will append the convert pixel in front.
            pixel = getFrameConversionPixel(key) + pixel;

            const promises: ng.IPromise<void>[] = [];

            // we haven't executed this component yet, so it is a new one
            if (
                scope.pipeline.data[key].state === scope.pipeline.STATE.INITIAL
            ) {
                promises.push(executeNewComponent(key, pixel));
            } else {
                // edit the pixel step here because its a block that's been run already
                promises.push(editOldComponent(key, pixel));
            }

            $q.all(promises).then(() => {
                // close the modal
                closeComponent('');

                // preview it if it is open
                if (scope.pipeline.preview.open) {
                    previewFrame(key);
                }

                if (cb) {
                    // TODO should clean this logic up so that we don't need to set these temporarily just so visualizeComponent will work.
                    // state need to be set to executed to allow the callback (visualizeComponent) to process correctly instead of relying on timing of
                    // getPipeline to return before the cb is run
                    scope.pipeline.data[key].state =
                        scope.pipeline.STATE.EXECUTED;
                    // also need to set the output of this component if it has not been set because it's being used in the visualizeComponent
                    if (
                        values &&
                        values.IMPORT_FRAME &&
                        scope.pipeline.data[key].output.length === 0
                    ) {
                        scope.pipeline.data[key].output.push({
                            frame: true,
                            value: {
                                name: values.IMPORT_FRAME.name,
                                type: values.IMPORT_FRAME.type,
                            },
                        });
                    }
                    cb();
                }
            });
        }

        /**
         * @name editOldComponent
         * @param key the key of the component
         * @param pixel the new edited pixel
         * @desc run the reactor to edit the recipe step by passing it the pixel id and the new pixel to run
         */
        function editOldComponent(
            key: string,
            pixel: string
        ): ng.IPromise<void> {
            const deferred = $q.defer();
            const callback = (response: PixelReturnPayload) => {
                if (checkErrors(response)) {
                    deferred.reject();
                    return;
                }

                deferred.resolve();
            };

            // edit doesnt need to set the position, it's already set and edit doesnt move the blocks
            // need to set the position every time we execute, so we will append the position of the block here
            // pixel += semossCoreService.pixel.build([{
            //     type: 'positionInsightRecipeStep',
            //     components: [scope.pipeline.data[key].uniqueKey || '', scope.pipeline.data[key].position],
            //     terminal: true,
            //     meta: true
            // }]);

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'setInsightConfig',
                        components: [
                            semossCoreService.workspace.saveWorkspace(
                                scope.widgetCtrl.insightID
                            ),
                        ],
                        terminal: true,
                        meta: true,
                    },
                    {
                        type: 'editInsightRecipeStep',
                        components: [scope.pipeline.data[key].uniqueKey, pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback
            );

            return deferred.promise;
        }

        /**
         * @name executeNewComponent
         * @desc execute and run a new component
         * @param key - key of the component
         * @param pixel - pixel to update with
         */
        function executeNewComponent(
            key: string,
            pixel: string
        ): ng.IPromise<void> {
            const deferred = $q.defer();

            const callback = (response: PixelReturnPayload) => {
                // bad
                if (checkErrors(response)) {
                    deferred.reject();
                    return;
                }

                // resolve
                deferred.resolve();
            };

            // need to set the position every time we execute, so we will append the position of the block here
            pixel += semossCoreService.pixel.build([
                {
                    type: 'positionInsightRecipeStep',
                    components: [
                        scope.pipeline.data[key].uniqueKey || '',
                        scope.pipeline.data[key].position,
                    ],
                    terminal: true,
                    meta: true,
                },
            ]);

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );

            return deferred.promise;
        }

        /**
         * @name updateComponentParameters
         * @param key - component to update
         * @param options - new options to set options
         * @desc updates a components parameters after execution
         */
        function updateComponentParameters(
            key: string,
            values: { [key: string]: any }
        ): void {
            let id = '';
            for (const parameter in values) {
                if (
                    values.hasOwnProperty(parameter) &&
                    scope.pipeline.data[key].parameters.hasOwnProperty(
                        parameter
                    )
                ) {
                    scope.pipeline.data[key].parameters[parameter].value =
                        values[parameter];
                    // for pipeline-files if filetype has been changed after adding component, update pipeline key to match new filetype
                    if (
                        values[parameter] &&
                        values[parameter].hasOwnProperty('qsType')
                    ) {
                        const qsType = values[parameter].qsType;
                        id = scope.pipeline.data[key].id;
                        // TODO TSV and paste
                        if (qsType === 'CSV_FILE' || qsType === 'EXCEL_FILE') {
                            if (qsType === 'CSV_FILE') {
                                id = 'pipeline-file$CSV';
                            } else {
                                id = 'pipeline-file$Excel';
                            }
                            const config =
                                semossCoreService.getSpecificConfig(id);
                            if (config) {
                                scope.pipeline.data[key].id = id;
                                scope.pipeline.data[key].icon = config.icon;
                                scope.pipeline.data[key].description =
                                    config.description;
                            }
                        }
                    }
                }
            }
        }

        /**
         * @name viewComponent
         * @param key - key of the component
         * @desc view data of the component
         */
        function viewComponent(key: string): void {
            closeComponent('');
            openPreview(key);

            if (timeout) {
                $timeout.cancel(timeout);
            }

            // TODO: Can we view multiple? What happens with multiple?
            timeout = $timeout(() => {
                let output: any;

                if (scope.pipeline.data[key]) {
                    for (
                        let outputIdx = 0,
                            outputLen = scope.pipeline.data[key].output.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        output = scope.pipeline.data[key].output[outputIdx];
                        const tempPixelComponent = [
                            {
                                type: 'frame',
                                components: [output.value.name],
                                meta: true,
                            },
                        ];
                        if (scope.pipeline.data[key].id == 'pipeline-union') {
                            tempPixelComponent.push({
                                type: 'distinct',
                                components: [false],
                            });
                        }
                        tempPixelComponent.push(
                            {
                                type: 'queryAll',
                                components: [],
                            },
                            {
                                type: 'limit',
                                components: [PREVIEW_LIMIT],
                            },
                            {
                                type: 'collect',
                                components: [500],
                                terminal: true,
                            }
                        );

                        if (output.frame) {
                            scope.widgetCtrl.emit('load-preview', {
                                pixelComponents: tempPixelComponent,
                            });

                            break;
                        }
                    }
                }
            }, 300);
        }

        /**
         * @name linkComponent
         * @desc called when before a connection can occur
         * @param params - params
         * @returns is the connection valid?
         */
        function linkComponent(params: any): boolean {
            let source,
                target,
                sourceComponent,
                targetComponent,
                sourceOutput,
                targetParameter,
                error;

            source = params.sourceId
                .replace('pipeline__component__side__output--', '')
                .split('__');

            if (!error) {
                sourceComponent = scope.pipeline.data[source[0]];
                if (typeof sourceComponent === 'undefined') {
                    error = 'Source is not defined';
                }
            }

            if (!error) {
                sourceOutput = sourceComponent.output[+source[1]];
                if (typeof sourceOutput === 'undefined') {
                    error = 'Source output is not defined';
                }
            }

            // source is already linked
            if (!error) {
                if (Object.keys(sourceOutput.downstream).length !== 0) {
                    error = 'Source is already linked';
                }
            }

            target = params.targetId
                .replace('pipeline__component__side__input--', '')
                .split('__');

            if (!error) {
                targetComponent = scope.pipeline.data[target[0]];
                if (typeof targetComponent === 'undefined') {
                    error = 'Target is not defined';
                }
            }

            if (!error) {
                targetParameter = targetComponent.parameters[target[1]];
                if (typeof targetParameter === 'undefined') {
                    error = 'Target parameter is not defined';
                }
            }

            // parameter it nos an input
            if (!error) {
                if (
                    targetComponent.input.indexOf(targetParameter.parameter) ===
                    -1
                ) {
                    error = 'Target is not an input';
                }
            }

            // parameter already linked
            if (!error) {
                if (Object.keys(targetParameter.upstream).length !== 0) {
                    error = 'Target is already linked';
                }
            }

            // they both must be frames to link.
            // TODO : expand to have other types
            if (!error) {
                if (!sourceOutput.frame || !targetParameter.frame) {
                    error = 'Source or target are not frames';
                }
            }

            if (error) {
                $timeout(function () {
                    scope.widgetCtrl.alert('error', error);
                });

                return false;
            }

            targetComponent.disableEdit = false;
            targetComponent.validInput = true;

            $timeout(function () {
                setComponentsAndShow(
                    targetParameter,
                    targetComponent,
                    sourceOutput,
                    sourceComponent
                );
            });

            return true;
        }

        /**
         * @name allInputsLinked
         * @param component - pipeline component
         * @desc determines if component has all inputs linked
         * @return true if all inputs are linked
         */
        function allInputsLinked(component: any): boolean {
            if (component.input.length === 1) return true;
            if (component.input.length === 2) {
                if (component.prevConnection) {
                    return true;
                }

                component.prevConnection = true;
            }

            return false;
        }

        /**
         * @name setComponentsAndShow
         * @param targetParameter - target component parameters
         * @param targetComponent - target component data
         * @param sourceOutput - source component output data
         * @param sourceComponent - source component
         * @desc sets the necessary component values and reveals it
         */
        function setComponentsAndShow(
            targetParameter: any,
            targetComponent: any,
            sourceOutput: any,
            sourceComponent: any
        ): void {
            targetParameter.upstream = {
                key: sourceComponent.key,
                output: sourceOutput.output,
            };

            // save the value;
            targetParameter.value = JSON.parse(
                JSON.stringify(sourceOutput.value)
            );

            // record the downstream
            sourceOutput.downstream = {
                key: targetComponent.key,
                parameter: targetParameter.parameter,
            };

            sourceComponent.hasDownstream = true;
            if (allInputsLinked(targetComponent)) {
                showComponent(targetComponent.key);
            }
        }

        /**
         * @name visualizeComponent
         * @param key - key of the component
         * @desc called to jump and switch to the visualization menu
         */
        function visualizeComponent(key: string): void {
            closeComponent('');

            if (timeout) {
                $timeout.cancel(timeout);
            }

            // TODO why do we have a timeout for 300 here...?
            timeout = $timeout(() => {
                const tasks = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks'
                );

                // If this component is not executed, then we should not try to visualize
                if (
                    scope.pipeline.data[key].state !==
                    scope.pipeline.STATE.EXECUTED
                ) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Execute or delete this component prior to visualizing the data.'
                    );
                    return;
                }

                // if visualizing same frame AND there is an existing task, we will refresh this task
                // otherwise we will just paint a grid for them with QueryAll
                if (
                    scope.widgetCtrl.getWidget('frame') ===
                        scope.pipeline.data[key].output[0].value.name &&
                    scope.pipeline.data[key].output[0].value.name &&
                    tasks.length > 0 &&
                    hasSameHeaders(
                        tasks[0].meta.headerInfo,
                        scope.widgetCtrl.getWidget('frame')
                    )
                ) {
                    const callback = () => {
                        scope.widgetCtrl.open('widget-tab', 'view');
                    };
                    scope.widgetCtrl.execute(
                        [
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'setPanelView',
                                components: ['visualization'],
                                terminal: true,
                            },
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'refreshPanelTask',
                                components: [],
                                terminal: true,
                            },
                        ],
                        callback
                    );
                } else {
                    buildAndOpenGrid(key);
                }
            }, 300);
        }

        /**
         * @name buildAndOpenGrid
         * @param key - component key
         * @desc builds and open a grid based on frame
         */
        function buildAndOpenGrid(key: string): void {
            for (
                let outputIdx = 0,
                    outputLen = scope.pipeline.data[key].output.length;
                outputIdx < outputLen;
                outputIdx++
            ) {
                const output = scope.pipeline.data[key].output[outputIdx];
                if (output.frame) {
                    const callback = () => {
                        scope.widgetCtrl.open('widget-tab', 'view');
                    };

                    const tempPixel = [
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                        },
                        {
                            type: 'setPanelView',
                            components: ['visualization'],
                            terminal: true,
                        },
                        {
                            type: 'frame',
                            components: [output.value.name],
                        },
                    ];
                    if (scope.pipeline.data[key].id == 'pipeline-union') {
                        tempPixel.push({
                            type: 'distinct',
                            components: [false],
                        });
                    }

                    tempPixel.push(
                        {
                            type: 'queryAll',
                            components: [],
                        },
                        {
                            type: 'autoTaskOptions',
                            components: [scope.widgetCtrl.panelId, 'Grid'],
                        },
                        {
                            type: 'collect',
                            components: [scope.widgetCtrl.getOptions('limit')],
                            terminal: true,
                        }
                    );

                    scope.widgetCtrl.execute(tempPixel, callback);

                    break;
                }
            }
        }

        /**
         * @name hasSameHeaders
         * @param frame {string} the frame to check headers against
         * @desc determines if user has not altered headers from their last visualization
         * @return true if headers have not changed and we just want to change the panel view;
         */
        function hasSameHeaders(taskHeaders: any, frame: string): boolean {
            let sameHeaders = true;
            const frameHeaders = semossCoreService.getShared(
                scope.widgetCtrl.insightID,
                'frames.' + frame + '.headers'
            );

            if (taskHeaders.length !== frameHeaders.length) {
                sameHeaders = false;
            } else {
                const headerMap = {};
                // set the frame headers in the map to track all the headers
                for (
                    let frameHeaderIdx = 0;
                    frameHeaderIdx < frameHeaders.length;
                    frameHeaderIdx++
                ) {
                    headerMap[frameHeaders[frameHeaderIdx].alias] = '';
                }

                // loop through the existing task to make sure frameHeaders have all the headers needed to refresh the task
                for (
                    let taskHeaderIdx = 0;
                    taskHeaderIdx < taskHeaders.length;
                    taskHeaderIdx++
                ) {
                    if (
                        !headerMap.hasOwnProperty(
                            taskHeaders[taskHeaderIdx].alias
                        )
                    ) {
                        // if it doesnt exist then refresh will not work--we will need to just grab all headers again and paint grid
                        sameHeaders = false;
                        break;
                    }
                }
            }

            return sameHeaders;
        }

        /**
         * @name openPreview
         * @param key - key of the component
         * @desc close the component detail for the selected component and stop editing
         */
        function openPreview(key: string): void {
            scope.pipeline.preview = {
                open: true,
                selected: key,
            };

            pipelineContentEle.style.bottom = '20%';
            pipelinePreviewEle.style.top = '80%';
            pipelinePreviewEle.style.height = '20%';
        }

        /**
         * @name closePreview
         * @desc close the component detail for the selected component and stop editing
         */
        function closePreview(): void {
            scope.pipeline.preview = {
                open: false,
                selected: undefined,
            };

            pipelineContentEle.style.bottom = '0%';
            pipelinePreviewEle.style.top = '100%';
            pipelinePreviewEle.style.height = '0%';
        }

        /**
         * @name exportCSV
         * @desc exports the frame as a csv
         * @return {void}
         */
        function exportCSV(): void {
            const key = scope.pipeline.preview.selected;

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        `Frame(frame=[${scope.pipeline.data[key].output[0].value.name}]) | QueryAll() | ToCsv();`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name closeMenu
         * @desc close the side menu
         * @returns {void}
         */
        function closeMenu() {
            const menu = semossCoreService.workspace.getWorkspace(
                scope.widgetCtrl.insightID,
                'menu'
            );

            // already closed
            if (!menu.open) {
                return;
            }

            // close it
            menu.open = false;

            semossCoreService.emit('change-workspace-menu', {
                insightID: scope.widgetCtrl.insightID,
                options: menu,
            });
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize(): void {
            let leftResizable,
                previewResizable,
                pipelineListener: () => void,
                updateFrameListener: () => void,
                renderPipelineListener: () => void;
            // layout = scope.widgetCtrl.getWidget('view.visualization.layout'),
            // headers: { displayName: string }[] = [];

            pipelineEle = ele[0];
            pipelineLeftEle = ele[0].querySelector('#pipeline__left');
            pipelineContentEle = ele[0].querySelector('#pipeline__content');
            pipelineWorkspaceContentEle = ele[0].querySelector(
                '#pipeline__content__workspace'
            );
            pipelinePreviewEle = ele[0].querySelector('#pipeline__preview');

            semossCoreService.emit('change-widget-tab', {
                widgetId: scope.widgetCtrl.widgetId,
                tab: 'enrich',
            });

            // if (layout) {
            //     headers = scope.widgetCtrl.getFrame('headers');
            // }
            // scope.pipeline.headersIn = headers.map(header => header.displayName);

            // used when user visualizes to determine if they can go back to a previous visualization or we need to load a grid
            // close right side menu
            closeMenu();
            // set up the resizable
            leftResizable = Resizable({
                available: ['E'],
                unit: '%',
                content: pipelineLeftEle,
                container: pipelineEle,
                restrict: {
                    minimumWidth: '240px',
                    maximumWidth: '70%',
                },
                on: function (top, left, height, width) {
                    pipelineContentEle.style.left = width + '%';
                    pipelinePreviewEle.style.left = width + '%';
                    pipelinePreviewEle.style.width = 100 - width + '%';
                },
                stop: function () {
                    $timeout();
                },
            });

            previewResizable = Resizable({
                available: ['N'],
                unit: '%',
                content: pipelinePreviewEle,
                container: pipelineEle,
                restrict: {
                    minimumHeight: '20%',
                    maximumHeight: '50%',
                },
                on: function (top) {
                    pipelineContentEle.style.bottom = 100 - top + '%';
                },
                stop: function () {
                    $timeout();
                },
            });

            // set up the plumbing
            plumbing = jsPlumb.jsPlumb.getInstance({
                Container: pipelineWorkspaceContentEle,
            });

            pipelineListener = semossCoreService.on(
                'initialize-widgets',
                initializePipeline
            );
            renderPipelineListener = semossCoreService.on(
                'update-pixel',
                processRendering
            );
            updateFrameListener = semossCoreService.on(
                'update-frame-headers',
                function () {
                    scope.pipeline.hasFrameHeadersChange = true;
                }
            );

            initializePipeline();

            // cleanup
            scope.$on('$destroy', function () {
                // remove movable
                for (const key in scope.pipeline.movable) {
                    if (scope.pipeline.movable.hasOwnProperty(key)) {
                        scope.pipeline.movable[key].destroy();
                    }
                }

                if (leftResizable) {
                    leftResizable.destroy();
                }

                if (previewResizable) {
                    previewResizable.destroy();
                }

                pipelineListener();
                updateFrameListener();
                renderPipelineListener();
            });
        }

        initialize();
    }
}
