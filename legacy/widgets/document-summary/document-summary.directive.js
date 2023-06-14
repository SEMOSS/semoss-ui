'use strict';

import './document-summary.scss';
import { PANEL_TYPES } from '../../core/constants.js';

export default angular
    .module('app.document-summary.directive', [])
    .directive('documentSummary', documentSummaryDirective);

documentSummaryDirective.$inject = ['monolithService', 'semossCoreService'];

function documentSummaryDirective(monolithService, semossCoreService) {
    documentSummaryCtrl.$inject = [];
    documentSummaryLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^insight'],
        controllerAs: 'documentSummary',
        bindToController: {},
        template: require('./document-summary.directive.html'),
        controller: documentSummaryCtrl,
        link: documentSummaryLink,
    };

    function documentSummaryCtrl() {}

    function documentSummaryLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        // VARIABLES
        scope.documentSummary.inputMethod = 'File Path';
        scope.documentSummary.inputText = '';
        scope.documentSummary.inputURL = '';
        scope.documentSummary.inputFilePath = '';
        scope.documentSummary.fileName = false;

        // FUNCTIONS
        scope.documentSummary.execute = execute;
        scope.documentSummary.checkFileExtension = checkFileExtension;
        scope.documentSummary.getFileLocation = getFileLocation;

        /**
         * @name resetPanel
         * @desc reset the panel information
         * @returns {void}
         */
        function resetPanel() {
            resetInputValues();
        }

        /**
         * @name execute
         * @desc define inputs and execute queries
         * @return {void}
         */
        function execute() {
            if (!scope.documentSummary.advanced) {
                resetInputValues();
            }

            if (
                scope.documentSummary.inputMethod === 'File Path' &&
                scope.documentSummary.fileName
            ) {
                getFileLocation();
            } else {
                runDocumentSummarization();
            }
        }

        /**
         * @name getFileLocation
         * @param {file|string} file - flow file
         * @desc gets the file extension type
         * @returns {*} - gets the file type from the extension
         */
        function getFileLocation() {
            var jobId = scope.insightCtrl.insightID;

            monolithService
                .uploadFile(scope.documentSummary.fileData.files, jobId)
                .then(function (data) {
                    var i;

                    for (i = 0; i < data.length; i++) {
                        scope.documentSummary.fileLocation = false;
                        // TODO set scope.documentSummary.fileName to data[i].fileName
                        // because when we already have that file in that location, the file gets appended with File (1).pdf
                        // and the fileName won't be the same anymore
                        // OR we need to run runDocumentSummarizon. not sure what this check is for
                        if (
                            data[i].fileName === scope.documentSummary.fileName
                        ) {
                            scope.documentSummary.fileLocation =
                                data[i].fileLocation;
                            runDocumentSummarization();
                            break;
                        }
                    }
                });
        }

        /**
         * @name getInputText
         * @desc get the correct input text from user
         * @return {string} input text
         */
        function getInputText() {
            switch (scope.documentSummary.inputMethod) {
                case 'Enter Manually':
                    return scope.documentSummary.inputText;
                case 'URL':
                    return scope.documentSummary.inputURL;
                case 'File Path':
                    return scope.documentSummary.fileLocation;
                default:
                    return false;
            }
        }

        /**
         * @name runDocumentSummarization
         * @desc execute runDocumentSummarization query
         * @return {void}
         */
        function runDocumentSummarization() {
            const inputText = getInputText();

            if (!inputText) {
                scope.insightCtrl.alert(
                    'error',
                    'Please include a valid document.'
                );
                return;
            }

            let callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // TODO expose New Sheet as an option (checkbox, default true) in Advanced Settings
                buildDashboard(output.name);
            };

            scope.insightCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'createSource',
                        components: [
                            'Frame',
                            'R',
                            semossCoreService.utility.random('FRAME'),
                            false,
                        ],
                        terminal: false,
                    },
                    {
                        type: 'runDocumentSummarization',
                        components: [
                            scope.documentSummary.inputMethod,
                            inputText,
                            scope.documentSummary.maxSentences,
                            scope.documentSummary.maxTopics,
                            scope.documentSummary.maxKeywords,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name buildDashboard
         * @desc create a dashboard showing summary results
         * @param {string} frame name of frame containing results
         * @return {void}
         */
        function buildDashboard(frame) {
            const sheetCounter = semossCoreService.workbook.getWorkbook(
                    scope.insightCtrl.insightID,
                    'worksheetCounter'
                ),
                sheetId = String(sheetCounter + 1),
                panelCounter = scope.insightCtrl.getShared('panelCounter'),
                panel0 = String(panelCounter + 1),
                panel1 = String(panelCounter + 2),
                panel2 = String(panelCounter + 3),
                panel3 = String(panelCounter + 4),
                panel4 = String(panelCounter + 5);

            scope.insightCtrl.execute([
                // new sheet
                {
                    type: 'Pixel',
                    components: [`AddSheet("${sheetId}")`],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        `Sheet("${sheetId}") | SetSheetLabel(sheetLabel = ["Summary"])`,
                    ],
                    terminal: true,
                },
                // Text Widget of Summary
                {
                    type: 'addPanel',
                    components: [panel0, sheetId],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel0],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'text-widget',
                        {
                            html: `<div style="padding: 10px 20px 10px 0;">
                                            <ul>
                                                <li ng-repeat="sentence in FrameData[0].output.data.values">{{sentence[0]}}</li>
                                            </ul>
                                        </div>`,
                            varList: [
                                {
                                    name: 'FrameData',
                                    query: 'Frame( ) | Select ( summary ) | Filter (summary!= [""]) | Iterate() | Collect(500);',
                                },
                            ],
                            freeze: false,
                            loading: true,
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel0],
                },
                {
                    type: 'setPanelLabel',
                    components: ['Summary of Document'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel0],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: scope.insightCtrl.getWorkspace(
                                'options.panel.type'
                            ),
                        },
                    ],
                    terminal: true,
                },
                // Word Cloud of Keywords
                {
                    type: 'addPanel',
                    components: [panel1, sheetId],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel1],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'visualization',
                        {
                            type: 'echarts',
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'frame',
                    components: [frame],
                    terminal: false,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: 'keyword',
                            },
                            {
                                alias: 'keyword_frequency',
                            },
                        ],
                    ],
                },
                {
                    type: 'taskOptions',
                    components: [
                        {
                            [panel1]: {
                                layout: 'Cloud',
                                alignment: {
                                    label: ['keyword'],
                                    value: ['keyword_frequency'],
                                },
                            },
                        },
                    ],
                },
                {
                    type: 'Pixel',
                    components: ['CollectAll()'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel1],
                },
                {
                    type: 'setPanelLabel',
                    components: ['Keywords throughout the Document'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel1],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: scope.insightCtrl.getWorkspace(
                                'options.panel.type'
                            ),
                        },
                    ],
                    terminal: true,
                },
                // Pie Charts of Labels and Prevelance
                {
                    type: 'addPanel',
                    components: [panel2, sheetId],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel2],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'visualization',
                        {
                            type: 'echarts',
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'frame',
                    components: [frame],
                    terminal: false,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: 'label',
                            },
                            {
                                alias: 'prevalence',
                            },
                        ],
                    ],
                },
                {
                    type: 'group',
                    components: [['label']],
                },
                {
                    type: 'taskOptions',
                    components: [
                        {
                            [panel2]: {
                                layout: 'Pie',
                                alignment: {
                                    label: ['label'],
                                    value: ['prevalence'],
                                },
                            },
                        },
                    ],
                },
                {
                    type: 'Pixel',
                    components: ['CollectAll()'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel2],
                },
                {
                    type: 'setPanelLabel',
                    components: ['Major Topics within the Document'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel2],
                },
                {
                    type: 'addPanelEvents',
                    components: [
                        {
                            onSingleClick: {
                                'Highlight and Show Keywords': [
                                    {
                                        panel: panel2,
                                        query: `<encode>Panel(<Panel>)|AddPanelOrnaments({"tools":{"shared":{"highlight":{"data":{"<SelectedAliasColumn>":<SelectedValues>}}}}});
                                    Panel(<Panel>)|RetrievePanelOrnaments();Panel (${panel3}) | SetPanelView ( "visualization" , "<encode>{"type":"echarts"}</encode>" );
                                    Frame ( ) | Select ( topic_keywords , topic_share ) .as ( [ topic_keywords , topic_share ] ) | Filter(label == ["<SelectedValue>"]) | 
                                    With ( Panel ( ${panel3} ) ) | Format ( type = [ "table" ] ) | TaskOptions ( { "${panel3}" : { "layout" : "Cloud" , "alignment" : { "label" : [ "topic_keywords" ] , 
                                    "value" : [ "topic_share" ] , "tooltip" : [ ] } } } ) | Collect ( 2000 ) ; Panel (${panel3}) | SetPanelLabel("Keywords within <SelectedValue>");
                                    Panel (${panel4}) | SetPanelView ( "text-widget" , "<encode>{"html":"<div style=\\\"padding: 10px 20px 10px 0;\\\">
                                    <ul><li ng-repeat=\\\"sentence in FrameData[0].output.data.values\\\">{{sentence[0]}}</li></ul></div>","varList":[{"name":"FrameData","query":"Frame( ) | Select ( topic_summary ) | 
                                    Filter (topic_summary != [\\\"\\\"] AND label == [\\\"<SelectedValue>\\\"]) | Iterate() | Collect(500);"}],"freeze":false,"loading":true}</encode>" ); 
                                    Panel (${panel4}) | SetPanelLabel("Summary of <SelectedValue>");</encode>`,
                                        options: {},
                                        refresh: false,
                                        disabledVisuals: [],
                                    },
                                ],
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel2],
                },
                {
                    type: 'retrievePanelEvents',
                    components: [],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel2],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: scope.insightCtrl.getWorkspace(
                                'options.panel.type'
                            ),
                        },
                    ],
                    terminal: true,
                },
                // Text Widget of Cloud Placeholder
                {
                    type: 'addPanel',
                    components: [panel3, sheetId],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel3],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'text-widget',
                        {
                            html: getPlaceholderHTML('cloud'),
                            varList: [],
                            freeze: false,
                            loading: true,
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel3],
                },
                {
                    type: 'setPanelLabel',
                    components: ['Keywords within a Major Topic'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel3],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: scope.insightCtrl.getWorkspace(
                                'options.panel.type'
                            ),
                        },
                    ],
                    terminal: true,
                },
                // Text Widget of Topic Summary Placeholder
                {
                    type: 'addPanel',
                    components: [panel4, sheetId],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel4],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'text-widget',
                        {
                            html: getPlaceholderHTML('summary'),
                            varList: [],
                            freeze: false,
                            loading: true,
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel4],
                },
                {
                    type: 'setPanelLabel',
                    components: ['Summary of a Major Topic'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [panel4],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: scope.insightCtrl.getWorkspace(
                                'options.panel.type'
                            ),
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        'SetInsightConfig({"panels":{"0":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"1":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"2":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"3":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"4":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"5":{"config":{"type":"golden","backgroundColor":"","opacity":100}}},"sheets":{"0":{"golden":{"content":[{"type":"row","content":[{"type":"stack","activeItemIndex":0,"width":100,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"0"}}]}]}]}},"1":{"golden":{"content":[{"type":"column","content":[{"type":"stack","activeItemIndex":0,"height":30,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"1"}}]},{"type":"row","height":35,"content":[{"type":"stack","activeItemIndex":0,"width":50,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"2"}}]},{"type":"stack","activeItemIndex":0,"width":50,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"3"}}]}]},{"type":"row","height":35,"content":[{"type":"stack","activeItemIndex":0,"width":50,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"4"}}]},{"type":"stack","activeItemIndex":0,"width":50,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"5"}}]}]}]}]}}},"sheet":"1"})',
                    ],
                    terminal: true,
                },
            ]);
        }

        /** * Helpers */

        /**
         * @name getPlaceholderHTML
         * @desc build html for placeholder text widget
         * @param {string} type specifies which text widget to build (wither cloud or summary)
         * @return {string} html for text widget
         */
        function getPlaceholderHTML(type) {
            var html = '';

            html +=
                '<div style="padding: 10px; color=#00206; margin: 0 auto; text-align: center; font-size: 20px">';

            if (type === 'cloud') {
                html +=
                    'Click on the Pie Chart to see keywords within a selected topic.';
            } else if (type === 'summary') {
                html +=
                    'Click on the Pie Chart to see a summary of a selected topic.';
            }

            html += '</div>';

            return html;
        }

        /**
         * @name checkFileExtension
         * @param {file} file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns {boolean} - checks wether it is an acceptable file
         */
        function checkFileExtension(file) {
            var fileExtension = getFileExtension(file);

            scope.documentSummary.fileName = file.name;

            if (fileExtension) {
                scope.documentSummary.fileType = fileExtension;
                return true;
            }

            scope.insightCtrl.alert(
                'error',
                'File must be .txt, .doc, .docx, or .pdf'
            );

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

            if (fileExtension === 'txt') {
                return 'txt';
            } else if (fileExtension === 'doc') {
                return 'excel';
            } else if (fileExtension === 'docx') {
                return 'tsv';
            } else if (fileExtension === 'pdf') {
                return 'pdf';
            }

            return false;
        }

        /**
         * @name resetInputValues
         * @desc reset the values of advanced settings
         * @returns {void}
         */
        function resetInputValues() {
            scope.documentSummary.maxSentences = 5;
            scope.documentSummary.maxTopics = 5;
            scope.documentSummary.maxKeywords = 5;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying document-summary...');
            });

            resetPanel();
        }

        initialize();
    }
}
