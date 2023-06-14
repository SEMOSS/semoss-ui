'use strict';

import angular from 'angular';

import './dashboard-assistant-modal.scss';

export default angular
    .module('app.dashboard-assistant.dashboard-assistant-modal', [])
    .directive('dashboardAssistantModal', dashboardAssistantModalDirective);

dashboardAssistantModalDirective.$inject = [
    '$q',
    'semossCoreService',
    'optionsService',
    'storeService'
];

function dashboardAssistantModalDirective(
    $q: ng.IQService,
    semossCoreService: SemossCoreService,
    optionsService: OptionsService,
    storeService: StoreService
) {
    dashboardAssistantModalLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./dashboard-assistant-modal.directive.html'),
        scope: {},
        require: ['^widget'],
        controllerAs: 'dashboardAssistantModal',
        bindToController: {
            open: '=',
            close: '&?',
            change: '&?',
        },
        link: dashboardAssistantModalLink,
        controller: dashboardAssistantModalCtrl,
    };

    function dashboardAssistantModalCtrl() {}

    function dashboardAssistantModalLink(scope, ele, attrs, ctrl) {
        // Scope -------------------------------------------------------------
        scope.widgetCtrl = ctrl[0];

        // --- State/Scope ---
        // Important
        scope.dashboardAssistantModal.page = ''; // 'ASK' | 'QUERY-PARAMS' | 'SECRET-KEY'
        scope.dashboardAssistantModal.mooseReactorPrefix = '' // text2sql | fillform | docquery
        
        scope.dashboardAssistantModal.secretKey = {
            selected: '',
            error: '',
        };
        scope.dashboardAssistantModal.question = {
            selected: '',
            error: '',
        };

        scope.dashboardAssistantModal.widgets = storeService.get('widgets')

        scope.dashboardAssistantModal.frameHasFilter = false;
        scope.dashboardAssistantModal.searchHistory = [];
        scope.dashboardAssistantModal.filteredHistory = [];
        scope.dashboardAssistantModal.activeQueryIndex = null; // necessary for editting correct query

        scope.dashboardAssistantModal.visible = false;
        scope.dashboardAssistantModal.loading = false;
        scope.dashboardAssistantModal.showPreview = false;
        scope.dashboardAssistantModal.previewSQL = '';
        scope.dashboardAssistantModal.editSql = false;

        // Pixel/API Fn's
        scope.dashboardAssistantModal.determineSecretKey = determineSecretKey;
        scope.dashboardAssistantModal.executeNLPQuery = executeNLPQuery;
        scope.dashboardAssistantModal.parseSql2Wrapper = parseSql2Wrapper;
        scope.dashboardAssistantModal.changeQueryParams = changeQueryParams;
        scope.dashboardAssistantModal.executeGeneratedQueryChanges =
            executeGeneratedQueryChanges;
        scope.dashboardAssistantModal.executeSql = executeSql;
        scope.dashboardAssistantModal.previewData = previewData;
        scope.dashboardAssistantModal.resetFrame = resetFrame;

        // Helper Fn's
        scope.dashboardAssistantModal.queryHasEdits = queryHasEdits;
        scope.dashboardAssistantModal.filterHistory = filterHistory;
        scope.dashboardAssistantModal.filterAndPreview = filterAndPreview;
        scope.dashboardAssistantModal.closeHistory = closeHistory;
        scope.dashboardAssistantModal.copySqlToClipboard = copySqlToClipboard;
        scope.dashboardAssistantModal.clearQuery = clearQuery;
        scope.dashboardAssistantModal.changePage = changePage;
        scope.dashboardAssistantModal.revertToOriginal = revertToOriginal

        // API Fn's --------------------------------------------------------------

        /**
         * @name executeNLPQuery
         * @param view
         */
        function executeNLPQuery(view: 'params' | 'frame' | 'preview') {
            const message = semossCoreService.utility.random('query-pixel');

            const prefix = scope.dashboardAssistantModal.mooseReactorPrefix;

            let questionInHistory = false;

            scope.dashboardAssistantModal.searchHistory.forEach((q, i) => {
                if (
                    scope.dashboardAssistantModal.question.selected ===
                    q.question.selected
                ) {
                    questionInHistory = true;
                    scope.dashboardAssistantModal.activeQueryIndex = i;
                }
            });

            if (questionInHistory) {
                scope.dashboardAssistantModal.visible = false;
                if (view === 'preview') {
                    previewData(
                        scope.dashboardAssistantModal.searchHistory[
                            scope.dashboardAssistantModal.activeQueryIndex
                        ].parseSqlQuery
                    );
                } else {
                    // Keeping code in case we want to do this on seperate page
                    if (view === 'params') {
                        // show sql params page from nlp
                        changePage('QUERY-PARAMS');
                    }
                    if (view === 'frame') {
                        // Show visualization with generated sql
                        executeSql();

                        // Set History so question shows when you open popup again
                        setHistory(
                            scope.dashboardAssistantModal.activeQueryIndex
                        );
                    }
                    scope.dashboardAssistantModal.showPreview = false;
                }
                return;
            }

            // Code below will only be executed if question is not in search history
            scope.dashboardAssistantModal.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                scope.dashboardAssistantModal.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Question could not be parsed into a query',
                    });
                    return;
                }

                // handle response for the 3 different (NLP) searches
                if(prefix === 'fillform') {
                    // output = {label: answer, age: '22'}
                    scope.dashboardAssistantModal.close(); // closes modal
                    
                    console.warn('Formatted Response fillform (NLP) sent to form builder', output)
                   
                    semossCoreService.emit('ai-fill-form', output);

                } else if(prefix === 'text2sql') {
                    console.warn('Response for text2sql')
                    const nestedOutput = output[0].output
                    if (
                        nestedOutput.SAMPLE ===
                        'Could not compute data, query is not correct.'
                    ) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'Model could not create valid query',
                        });
                        return;
                    }
    
                    if (nestedOutput.Query === '') {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'Blank SQL generated from NLP search',
                        });
                        return;
                    }
    
                    // set question in search history
                    const questionObj = {
                        question: {
                            selected: scope.dashboardAssistantModal.question.selected,
                            error: ''
                        },
                        generatedNLPQuery: nestedOutput.Query,
                        parseSqlQuery: nestedOutput.Query,
                        generatedParseSqlQuery: '',
                        id: '',
                        queryParamsOriginal: {},
                        queryParamsCopy: {},
                        queryParams: {},
                        paramChanges: [],
                        generatedQuery: '',
                        generatedQueryHtml: '',
                    };
        
                    // push new question to history
                    scope.dashboardAssistantModal.searchHistory.push(questionObj)
    
                    parseSql2Wrapper(view, scope.dashboardAssistantModal.searchHistory.length - 1);
                } else if (prefix === 'docquery') {
                    console.warn('Response for docquery')
                }
            });

            let pixel = '';

            // currently three different NLP searches
            if(prefix === 'fillform') {
                // Works below off of predefined fields in widget
                const widgets = scope.dashboardAssistantModal.widgets
                const  formFields: string[] = [];

                // Only look at this insights widgets
                Object.entries(widgets).forEach((keyVal) => {
                    const panel = widgets[keyVal[0]];
                    if(panel.insightID !== scope.widgetCtrl.insightID){
                        delete widgets[keyVal[0]]
                    }
                })
                
                // Constructing to get our fields at the moment
                // Does not get respective label/p tag;  Just sends all colums from DataModel
                Object.entries(widgets).forEach((keyVal) => {
                    if(widgets[keyVal[0]].active === 'form-builder'){
                        const data = widgets[keyVal[0]]['view']['form-builder']['options']['json']['data']
                        // push field name
                        Object.keys(data).forEach((k) => {
                            formFields.push(k)
                        })
                    }
                })

                pixel = `Moose ( command = [ "fillform: ${scope.dashboardAssistantModal.question.selected}" ] , form_fields = [${JSON.stringify(
                    formFields,
                )}] ) ;`

            } else if(prefix === 'text2sql') {
                pixel = `Moose(frame=[LastUsedFrame()], command=["text2sql:${
                    scope.dashboardAssistantModal.question.selected
                }"])`

            } else if(prefix === 'docquery') {
                pixel = 'docquery pixel'
            }

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        meta: true,
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name previewData
         * @param query
         */
        function previewData(query: string) {
            scope.dashboardAssistantModal.showPreview = true;

            const pixel = semossCoreService.pixel.build([
                {
                    type: 'Pixel',
                    components: ['Frame(frame=[LastUsedFrame()])'],
                    meta: true,
                },
                {
                    type: 'query',
                    components: [query],
                },
                {
                    type: 'limit',
                    components: [20],
                },
                {
                    type: 'collect',
                    components: [20],
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

            scope.dashboardAssistantModal.editSql = false;
            scope.dashboardAssistantModal.previewSQL = query;
        }

        /**
         * @name executeGeneratedQueryChanges
         */
        function executeGeneratedQueryChanges() {
            const message = semossCoreService.utility.random('query-pixel');
            const commands: PixelCommand[] = [];
            const errors: number[] = [];
            let pixel = '';

            const active =
                scope.dashboardAssistantModal.searchHistory[
                    scope.dashboardAssistantModal.activeQueryIndex
                ];

            // if there aren't any changes to sql
            if (active.paramChanges.length === 0) {
                executeSql();
                return;
            }

            active.paramChanges.forEach((k, i) => {
                const value = active.queryParams[k].selected;
                pixel += `ReplaceParam("${active.id}", "${k}" , "${value}");`;
            });

            scope.dashboardAssistantModal.loading = true;

            // There is a possibility of multiple indexes in our pixelReturn; The last non error index will have our true sql that will be executed; We still want to go through each pixel return to see if any changes had errors to display to user
            semossCoreService.once(message, function (response) {
                const pixelReturn = response.pixelReturn;

                let cont = true;
                let i = pixelReturn.length - 1;
                let generated = false;

                // reverse loop for last working sql
                while (cont) {
                    if (i === -1) {
                        cont = false;

                        // All error out
                        if (errors.length === active.paramChanges.length) {
                            scope.dashboardAssistantModal.loading = false;
                        }

                        // clear changes
                        active.paramChanges = [];
                        // Set new history
                        setHistory(
                            scope.dashboardAssistantModal.activeQueryIndex
                        );
                        return;
                    }

                    // Each pixel return output
                    const output = pixelReturn[i].output,
                        type = pixelReturn[i].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        errors.push(i);
                    } else {
                        if (!generated) {
                            // Only the last working SQL will be displayed to user
                            editHistory(
                                output,
                                scope.dashboardAssistantModal.activeQueryIndex
                            );

                            generateSQLHtml(
                                scope.dashboardAssistantModal.activeQueryIndex
                            );

                            scope.dashboardAssistantModal.loading = false;

                            executeSql();

                            generated = true;
                        }
                    }

                    i--;
                }
            });

            commands.push({
                type: 'Pixel',
                components: [pixel],
                terminal: true,
            });

            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name parseSql2Wrapper
         * @param query
         * @param view
         */
        function parseSql2Wrapper(view: 'params' | 'frame' | 'preview', index) {
            // Get search obj from search history
            const searchObj =
                scope.dashboardAssistantModal.searchHistory[index];

            const message = semossCoreService.utility.random('query-pixel');
            const commands: PixelCommand[] = [];

            //  Turn load on
            scope.dashboardAssistantModal.loading = true;

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                // is error
                if (type.indexOf('ERROR') > -1) {
                    scope.dashboardAssistantModal.loading = false;
                    scope.dashboardAssistantModal.question.error =
                        'Question could not be parsed into a data-driven question';
                    return;
                }

                // Edit searchObj in searchHistory
                editHistory(output, index);

                // Set active index for view query params page
                scope.dashboardAssistantModal.activeQueryIndex = index;

                // generate sql html string
                generateSQLHtml(index);

                scope.dashboardAssistantModal.loading = false;

                // set history
                setHistory(index);

                if (view === 'preview') {
                    previewData(searchObj.generatedNLPQuery);
                    return;
                }

                // hide preview
                scope.dashboardAssistantModal.showPreview = false;

                // Keeping code in case we want to do this on seperate page
                if (view === 'params') {
                    // show sql params page from nlp
                    changePage('QUERY-PARAMS');
                }

                if (view === 'frame') {
                    // Show visualization with generated sql
                    executeSql();
                }
            });

            const pixel = `ParseSQL2Wrapper("<encode>${searchObj.generatedNLPQuery}</encode>")`;

            commands.push({
                type: 'Pixel',
                components: [pixel],
                terminal: true,
            });

            semossCoreService.emit('query-pixel', {
                commandList: commands,
                listeners: [],
                response: message,
                insightID: scope.widgetCtrl.insightID,
            });
        }

        /**
         * @name executeSql
         */
        function executeSql() {
            const active =
                scope.dashboardAssistantModal.searchHistory[
                    scope.dashboardAssistantModal.activeQueryIndex
                ];

            // Switch page back to search default page
            scope.dashboardAssistantModal.page = 'ASK';
            scope.dashboardAssistantModal.change({ value: 'ASK' });

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `FrameFilterWithSQL(query=["<encode>${active.parseSqlQuery}</encode>"]);`,
                        ],
                        terminal: true,
                    },
                ],
                (response) => {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: output,
                        });
                        return;
                    }

                    scope.dashboardAssistantModal.close();
                }
            );
        }

        /**
         * @name resetFrame
         */
        function resetFrame() {
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [`ResetFrameToOriginalName();`],
                        terminal: true,
                    },
                ],
                (response) => {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: output,
                        });
                        return;
                    }

                    // No filter on frame
                    setHistory(-1);

                    scope.dashboardAssistantModal.question.selected = '';

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: `Successfully refreshed ${output.name}`,
                    });

                    scope.dashboardAssistantModal.showPreview = false;
                    scope.dashboardAssistantModal.frameHasFilter = false;
                }
            );
        }

        /**
         * @name determineSecretKey
         * @param determination
         * @desc checks if user has openAi key stored and sets it to local storage
         */
        function determineSecretKey(determination: 'check' | 'activate') {
            let pixel = `AddOpenAIKey`;

            if (determination === 'check') {
                pixel += '()';
            } else {
                pixel += `("${scope.dashboardAssistantModal.secretKey.selected}")`;
            }

            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                (response) => {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];

                    if (type.indexOf('ERROR') > -1) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'Error sending secret key',
                        });
                        return;
                    }

                    if (output.openai_defined) {
                        scope.dashboardAssistantModal.page = 'ASK';
                        scope.dashboardAssistantModal.change({ value: 'ASK' });
                    } else {
                        scope.dashboardAssistantModal.page = 'SECRET-KEY';
                        scope.dashboardAssistantModal.change({
                            value: 'SECRET-KEY',
                        });
                    }
                }
            );
        }
        // API Fn's End --------------------------------------------------------------

        // Helper Fn's ---------------------------------------------------------------

        /**
         * @name editHistory
         * @param output - output from reactor call
         * @param index - 0-infinity = index in history array
         * @desc map pixel output to searchObj in history
         */
        function editHistory(output, index): void {
            scope.dashboardAssistantModal.searchHistory[
                index
            ].generatedParseSqlQuery = output.generated_query;
            scope.dashboardAssistantModal.searchHistory[index].parseSqlQuery =
                output.query;
            scope.dashboardAssistantModal.searchHistory[index].queryParamsCopy =
                output.params;

            // New queries
            if (output.ID) {
                scope.dashboardAssistantModal.searchHistory[index].id =
                    output.ID;
                // set original query params so we can revert query if needed
                scope.dashboardAssistantModal.searchHistory[
                    index
                ].queryParamsOriginal = output.params;
            }

            // pass query to filtered history for dropdown options
            scope.dashboardAssistantModal.filteredHistory.push(
                scope.dashboardAssistantModal.searchHistory[index].question
                    .selected
            );
        }

        /**
         * @name generateSQLHtml
         * @param output
         */
        function generateSQLHtml(index): void {
            // fist get searchObj in history
            const searchObj =
                scope.dashboardAssistantModal.searchHistory[index];

            const paramsCopy = {};

            // create form fields for params
            for (const property in searchObj.queryParamsCopy) {
                paramsCopy[property] = {
                    selected: searchObj.queryParamsCopy[property],
                    original: searchObj.queryParamsCopy[property],
                    error: '',
                };
            }

            // bind it
            searchObj.queryParams = paramsCopy;

            // copy of generated query output to do regex and html string formatting
            let mutableString: string = searchObj.generatedParseSqlQuery;

            for (const property in searchObj.queryParams) {
                mutableString = mutableString.replace(
                    `<${property}>`,
                    `
                <smss-input 
                    class="dashboard-assistant-modal__query__param" 
                    ng-model="dashboardAssistantModal.searchHistory[${index}].queryParams['${property}'].selected" 
                    ng-change="dashboardAssistantModal.changeQueryParams('${property}', ${index})"
                >
                </smss-input>`
                );
            }

            // bind html string
            searchObj.generatedQueryHtml = mutableString;
        }

        /**
         * @name changeQueryParams
         * @param param
         */
        function changeQueryParams(param: string, index): void {
            const active = scope.dashboardAssistantModal.searchHistory[index];

            // See if <param> is in changes array
            const hasChanges = active.paramChanges.indexOf(param);
            // If original !== editted copy add to changes list
            if (
                active.queryParams[param].selected !==
                active.queryParams[param].original
            ) {
                if (hasChanges === -1) active.paramChanges.push(param);
            } else {
                if (hasChanges > -1) active.paramChanges.splice(hasChanges, 1);
            }
        }

        /**
         * @name revertToOriginal
         * @desc change query fields back to original and push changes into paramChanges []
         */
        function revertToOriginal(): void {
            const active =
                scope.dashboardAssistantModal.searchHistory[
                    scope.dashboardAssistantModal.activeQueryIndex
                ];

            // get actives original params, and each one that doesn't match up add to active.paramChanges
            for (const [key, value] of Object.entries(
                active.queryParamsOriginal
            )) {
                // if original value is not the same as form value
                if (value !== active.queryParams[key].selected) {
                    active.queryParams[key].selected = value;
                    active.paramChanges.push(key);
                }
            }

            // TO-DO: Do we want this to filter frame automatically
        }

        function queryHasEdits(): boolean {
            const active =
                scope.dashboardAssistantModal.searchHistory[
                    scope.dashboardAssistantModal.activeQueryIndex
                ];

                
            if(!active) return true
                
            let baseCase = true
            // JSON.stringify(active.queryParamsCopy) === JSON.stringify(active.queryParamsOriginal)

            for (const [key, value] of Object.entries(
                active.queryParamsOriginal
            )) {
                // if original value is not the same as form value
                if (value !== active.queryParams[key].selected) {
                    baseCase = false;
                }
            }

            return baseCase;
        }

        /**
         * @name changePage
         * @desc changes the selected page
         * @param page the page to view (ASK, QUERY-PARAMS)
         */
        function changePage(page: string): void {
            if (page === 'ASK') {
                let active =
                    scope.dashboardAssistantModal.searchHistory[
                        scope.dashboardAssistantModal.activeQueryIndex
                    ];

                if (active) {
                    active.paramChanges.forEach((param) => {
                        active.queryParams[param].selected =
                            active.queryParams[param].original;
                    });
                } else {
                    active = {};
                }
                // Switch params back to original
                active.paramChanges = [];

                // This may be important
                // scope.dashboardAssistantModal.activeQueryIndex = null;
            }

            scope.dashboardAssistantModal.page = page;
            scope.dashboardAssistantModal.change({ value: page });
        }

        /**
         * @name clearQuery
         */
        function clearQuery() {
            scope.dashboardAssistantModal.question.selected = '';
            scope.dashboardAssistantModal.question.error = '';
            scope.dashboardAssistantModal.showPreview = false;
            scope.dashboardAssistantModal.editSql = false;
            scope.dashboardAssistantModal.visible = false;
        }

        /**
         * @name closeHistory
         */
        function closeHistory() {
            if (scope.dashboardAssistantModal.visible) {
                scope.dashboardAssistantModal.visible = false;
            }
        }

        /**
         * @name filterAndPreview
         * @param event
         */
        function filterAndPreview(event) {
            // TO-DO prevent multiple enter keydowns in a row
            if (event.keyCode === 13) {
                executeNLPQuery('preview');
            }
        }

        /**
         * @name filterHistory
         */
        function filterHistory() {
            const filteredHistoryCopy: string[] = [];
            scope.dashboardAssistantModal.searchHistory.forEach((q) => {
                if (
                    q.question.selected
                        .toLowerCase()
                        .includes(
                            scope.dashboardAssistantModal.question.selected.toLowerCase()
                        )
                ) {
                    filteredHistoryCopy.unshift(q.question.selected);
                }
            });

            scope.dashboardAssistantModal.visible = true;
            scope.dashboardAssistantModal.filteredHistory = filteredHistoryCopy;
        }

        /**
         * @name setHistory
         */
        function setHistory(index) {
            optionsService.set(scope.widgetCtrl.insightID, 'search-history', {
                activeIndex: index,
                history: scope.dashboardAssistantModal.searchHistory,
            });

            console.log('History: ', {
                activeIndex: index,
                history: scope.dashboardAssistantModal.searchHistory,
            });
        }

        /**
         * @name copySqlToClipboard
         * @param string
         */
        function copySqlToClipboard(string: string): void {
            navigator.clipboard.writeText(string);

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Successfully copied to clipboard',
            });
        }

        // Helper Fn's End ------------------------------------------------------
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            // Turn load on while we figure out what page to show
            scope.dashboardAssistantModal.loading = true;

            // check our widgets and see what is present
            scope.dashboardAssistantModal.mooseReactorPrefix = 'text2sql'
            
            const widgets = scope.dashboardAssistantModal.widgets

            // Only look at this insights widgets
            Object.entries(widgets).forEach((keyVal) => {
                const panel = widgets[keyVal[0]];
                if(panel.insightID !== scope.widgetCtrl.insightID){
                    delete widgets[keyVal[0]]
                }
            })

            // determine what prefix to use
            Object.entries(widgets).forEach((keyVal) => {
                if(widgets[keyVal[0]].active === 'form-builder'){
                    scope.dashboardAssistantModal.mooseReactorPrefix = 'fillform'
                }  else if(widgets[keyVal[0]].active === 'docquery') {
                    scope.dashboardAssistantModal.mooseReactorPrefix = 'docquery'
                }
            })

            if(scope.dashboardAssistantModal.mooseReactorPrefix === 'text2sql') {
                // check if we have a openai secret key in order to hit
                determineSecretKey("check")
    
                // Store it at insight level
                const searchHistory = optionsService.get(
                    scope.widgetCtrl.insightID,
                    'search-history'
                );
    
                // Previous search history stored on insight
                if(searchHistory) {
                    scope.dashboardAssistantModal.searchHistory = searchHistory.history
    
                    if(scope.dashboardAssistantModal.searchHistory.length > 0 && searchHistory.activeIndex > -1) {
                        scope.dashboardAssistantModal.question.selected = scope.dashboardAssistantModal.searchHistory[searchHistory.activeIndex].question.selected
                        scope.dashboardAssistantModal.frameHasFilter = true;
                    }
                }
    
                filterHistory();
            } else {
                scope.dashboardAssistantModal.page = 'ASK'
                scope.dashboardAssistantModal.change({value: 'ASK'})
            }


            scope.dashboardAssistantModal.loading = false;
        }

        initialize();
    }
}
