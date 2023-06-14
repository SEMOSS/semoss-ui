import angular from 'angular';

import './dashboard-assistant.scss';

import './dashboard-assistant-modal/dashboard-assistant-modal.directive.ts';

export default angular
    .module('app.dashboard-assistant.directive', [
        'app.dashboard-assistant.dashboard-assistant-modal',
    ])
    .directive('dashboardAssistant', dashboardAssistantDirective);

dashboardAssistantDirective.$inject = ['storeService', 'semossCoreService'];

function dashboardAssistantDirective(
    storeService: StoreService,
    semossCoreService: SemossCoreService
) {
    dashboardAssistantCtrl.$inject = [];
    dashboardAssistantLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        scope: {},
        template: require('./dashboard-assistant.directive.html'),
        require: ['^widget', '^insight'],
        controllerAs: 'dashboardAssistant',
        controller: dashboardAssistantCtrl,
        link: dashboardAssistantLink,
    };

    function dashboardAssistantCtrl() {}

    function dashboardAssistantLink(scope, ele, attrs, ctrl) {
        let buttonEle, clickTimer;

        scope.widgetCtrl = ctrl[0];
        scope.insightCtrl = ctrl[1];

        scope.dashboardAssistant.widgets = storeService.get('widgets');

        scope.dashboardAssistant.insightID = scope.widgetCtrl.insightID;
        scope.dashboardAssistant.opts = [];
        scope.dashboardAssistant.selectedOpt = 'text2sql';

        scope.dashboardAssistant.modalHeader = '';
        scope.dashboardAssistant.closeModal = closeModal;
        scope.dashboardAssistant.changeModalHeader = changeModalHeader;

        /**
         * @name openModal
         * @desc Open the modal
         */
        function openModal(): void {
            scope.dashboardAssistant.searchModal = true;
        }

        /**
         * @name closeModal
         * @desc close the modal
         */
        function closeModal(): void {
            scope.dashboardAssistant.searchModal = false;
        }

        /**
         * @name mousedown
         * @desc sets a timer when mouse is down so we do not run unfilter on drag
         */
        function mousedown(): void {
            clickTimer = Date.now();
        }

        /**
         * @name changeModalHeader
         * @desc changes the header of modal
         */
        function changeModalHeader(value: string): void {
            scope.dashboardAssistant.modalHeader = value;
        }

        /**
         * @name mouseup
         * @desc determines if click was fast enought to run unfilter, resets clickTimer
         */
        function mouseup(): void {
            if (clickTimer) {
                console.log(clickTimer);
                if (Date.now() - clickTimer < 250) {
                    openModal();
                }
                clickTimer = null;
            }
        }

        // -------------------------
        // CALLBACKS FOR MOOSE
        // -------------------------
        /**
         * @name fillForm
         * @param answers - answers to fill on form builder
         */
        const fillForm = (answers) => {
            semossCoreService.emit('ai-fill-form', answers);
        };

        /**
         * @name filterFrame
         * @param sql
         */
        const filterFrame = (sql) => {
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `FrameFilterWithSQL(query=["<encode>${sql}</encode>"]);`,
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
                }
            );
        };

        /**
         * @name unfilterFrame
         */
        const unfilterFrame = () => {
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

                    console.log('unfiltering');
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: `Successfully refreshed ${output.name}`,
                    });
                }
            );
        };

        // -------------------------
        // CONSTRUCT MOOSE OPTIONS
        // -------------------------
        /**
         * @name constructFillFormFields
         * @param formWidget
         * @returns
         */
        function constructFillFormFields(formWidget): string[] {
            const formFields: string[] = [];
            const dataObj =
                formWidget['view']['form-builder']['options']['json']['data'];

            // push field name
            Object.keys(dataObj).forEach((k: string) => {
                formFields.push(k);
            });

            return formFields;
        }

        /**
         * @name constructDocQAOptions
         * @param docQAWidget
         * @returns docqa options
         */
        function constructDocQAOptions(docQAWidget) {
            const docQAOptions =
                docQAWidget['view']['document-query']['options']['json'];
            return docQAOptions;
        }

        /**
         * @name constructOptionsForMoose
         * @desc
         */
        function constructOptionsForMoose() {
            let selectedModel = '';
            const widgets = scope.dashboardAssistant.widgets;
            // Only look at this insights widgets
            Object.entries(widgets).forEach((keyVal) => {
                const panel = widgets[keyVal[0]];
                if (panel.insightID !== scope.widgetCtrl.insightID) {
                    delete widgets[keyVal[0]];
                }
            });

            // determine what prefix to use and construct options
            Object.entries(widgets).forEach(async (keyVal) => {
                if (widgets[keyVal[0]].active === 'form-builder') {
                    if (!selectedModel) selectedModel = 'fillform';
                    const panelFormFields = await constructFillFormFields(
                        widgets[keyVal[0]]
                    );
                    let foundIndex = -1;

                    for (
                        let i = 0;
                        i < scope.dashboardAssistant.opts.length;
                        i++
                    ) {
                        if (
                            scope.dashboardAssistant.opts[i].model ===
                            'fillform'
                        ) {
                            foundIndex = i;
                        }
                    }

                    if (foundIndex > -1) {
                        // fix this dont add new fields if they are already there
                        scope.dashboardAssistant.opts[foundIndex] = {
                            ...scope.dashboardAssistant.opts[foundIndex],
                            form_fields: [
                                ...scope.dashboardAssistant.opts[foundIndex]
                                    .form_fields,
                                panelFormFields,
                            ],
                        };
                    } else {
                        scope.dashboardAssistant.opts.push({
                            model: 'fillform',
                            form_fields: panelFormFields,
                            callback: fillForm,
                        });
                    }
                } else if (widgets[keyVal[0]].active === 'document-query') {
                    if (!selectedModel) selectedModel = 'docqa';
                    const docQAOptions = await constructDocQAOptions(
                        widgets[keyVal[0]]
                    );
                    let foundIndex = -1;

                    for (
                        let i = 0;
                        i < scope.dashboardAssistant.opts.length;
                        i++
                    ) {
                        if (
                            scope.dashboardAssistant.opts[i].model === 'docqa'
                        ) {
                            foundIndex = i;
                        }
                    }

                    if (foundIndex > -1) {
                        scope.dashboardAssistant.opts[foundIndex] = {
                            model: 'docqa',
                            ...docQAOptions,
                        };
                    } else {
                        scope.dashboardAssistant.opts.push({
                            model: 'docqa',
                            ...docQAOptions,
                        });
                    }
                }
            });

            scope.dashboardAssistant.selectedOpt = !selectedModel
                ? 'text2sql'
                : selectedModel;
        }

        // -------------------------
        // UPDATES WITH LISTENERS
        // -------------------------
        const getUpdatedWidgets = () => {
            scope.dashboardAssistant.widgets = storeService.get('widgets');
            constructOptionsForMoose();
        };

        function updateDocQAOptions(options) {
            let foundIndex = -1;

            for (let i = 0; i < scope.dashboardAssistant.opts.length; i++) {
                if (scope.dashboardAssistant.opts[i].model === 'docqa') {
                    foundIndex = i;
                }
            }

            if (foundIndex > -1) {
                scope.dashboardAssistant.opts[foundIndex] = {
                    model: 'docqa',
                    ...options,
                };
            } else {
                scope.dashboardAssistant.opts.push({
                    model: 'docqa',
                    ...options,
                });
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            buttonEle = ele[0].querySelector('#dashboard-assistant__btn');
            buttonEle.addEventListener('mousedown', mousedown);
            buttonEle.addEventListener('mouseup', mouseup);

            scope.dashboardAssistant.insightID = scope.widgetCtrl.insightID;
            const presentationListener = scope.insightCtrl.on(
                'updated-presentation',
                getUpdatedWidgets
            );

            const selectedPanelListener = scope.insightCtrl.on(
                'selected-panel',
                getUpdatedWidgets
            );

            const updatedDocQaListener = semossCoreService.on(
                'updated-docqa',
                updateDocQAOptions
            );

            scope.dashboardAssistant.opts.push({
                model: 'text2sql',
                frame: 'LastUsedFrame()',
                callback: filterFrame,
                unfilter: unfilterFrame,
            });

            getUpdatedWidgets();

            scope.$on('$destroy', function () {
                presentationListener();
                selectedPanelListener();
                updatedDocQaListener();

                buttonEle.removeEventListener('mousedown', mousedown);
                buttonEle.removeEventListener('mouseup', mouseup);
            });
        }

        initialize();
    }
}
