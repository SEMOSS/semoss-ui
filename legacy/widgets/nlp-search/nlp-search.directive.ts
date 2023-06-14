'use strict';

import angular from 'angular';

import './nlp-search.scss';
import {
    TEMPLATE_VALUES,
    SUGGESTION_TYPE,
    TEMPLATE_TYPE,
    TEMPLATES,
    AGGREGATES,
    HAVING,
    BASED_ON,
} from './templates';

export default angular
    .module('app.nlp-search.directive', [])
    .directive('nlpSearch', nlpSearchDirective);

nlpSearchDirective.$inject = [
    'semossCoreService',
    '$timeout',
    'optionsService',
];

function nlpSearchDirective(
    semossCoreService: SemossCoreService,
    $timeout,
    optionsService: OptionsService
) {
    nlpSearchLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./nlp-search.directive.html'),
        scope: {},
        require: ['^widget'],
        controllerAs: 'nlpSearch',
        bindToController: {},
        link: nlpSearchLink,
        controller: nlpSearchCtrl,
    };

    function nlpSearchCtrl() {}

    function nlpSearchLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        let updateFrameListener;
        let templateDropdownEle;
        // General
        scope.nlpSearch.page = 'QUERY';
        scope.nlpSearch.types = [
            {
                display: 'Current Frame',
                value: 'FRAME',
                desc: 'Search on data that you imported into the Insight.',
            },
            {
                display: 'Global',
                value: 'GLOBAL',
                desc: 'Search across all your SEMOSS databases.',
            },
        ];
        scope.nlpSearch.selectedType = scope.nlpSearch.types[0].value;
        scope.nlpSearch.reverse = false;
        scope.nlpSearch.helpOverlay = false;

        // Databases (Global NLP Search)
        scope.nlpSearch.dbList = [];
        scope.nlpSearch.selectedDBs = [];

        // Frame (Current Frame NLP Search)
        scope.nlpSearch.availableFrames = [];
        scope.nlpSearch.selectedFrame = '';
        scope.nlpSearch.headers = [];
        scope.nlpSearch.frameMap = {};

        // Template Dropdown
        scope.nlpSearch.selectedTemplate = '';
        scope.nlpSearch.showTemplateDropdown = false;

        // Query
        scope.nlpSearch.query = [];
        scope.nlpSearch.previousQuery = undefined;
        scope.nlpSearch.disableIndex = scope.nlpSearch.query.length;
        scope.nlpSearch.temporaryComponent = []; // A queue that keeps track of the index of temporary components

        // Suggestions
        scope.nlpSearch.suggestions = [];
        scope.nlpSearch.suggestionType = SUGGESTION_TYPE.TEMPLATE;

        // Results
        scope.nlpSearch.results = [];
        scope.nlpSearch.loading = false;
        scope.nlpSearch.selectedInsight = {};
        scope.nlpSearch.vizType = {
            options: [],
            selected: '',
        };

        // HTML
        scope.nlpSearch.html = {
            display: `<div class="nlp-search__block__name">
                <div ng-if="block.display && block.display.length">{{block.display}}</div>
                <div ng-if="block.display && !block.display.length && !block.display.isObject">
                    <smss-dropdown model="block.display.selected"
                        options="block.display.options"
                        placeholder=""
                        change="nlpSearch.componentUpdated(parentIndex, 'display');"></smss-dropdown>
                </div>
                <div ng-if="block.display && !block.display.length && block.display.isObject">
                    <smss-dropdown model="block.display.selected"
                        options="block.display.options"
                        placeholder=""
                        display="display"
                        value="value"
                        change="nlpSearch.componentUpdated(parentIndex, 'display');"></smss-dropdown>
                </div>
            </div>`,
            column: `<div ng-if="block.column && block.column.type == 'SINGLE' && block.column.options.length > 0" class="nlp-search__block__subcomponent">
            <smss-dropdown model="block.column.selected" 
                options="block.column.options"
                change="nlpSearch.resetComponent(parentIndex, 'column'); nlpSearch.componentUpdated(parentIndex, 'column');"
                placeholder="column"
                open="block.column.showPopover"></smss-dropdown>
            </div>
            <div ng-if="block.column && block.column.type == 'MULTIPLE' && block.column.options.length > 0" 
                class="nlp-search__block__subcomponent" 
                title="{{block.column.selected}}"
                smss-popover>
                <span ng-if="block.column.selected.length === 0" class="nlp-search__block__placeholder">column</span>
                <span ng-repeat="col in block.column.selected track by $index">{{col}}{{$index != block.column.selected.length - 1 ? ', ' : ''}}</span>
                <smss-popover-content class="nlp-search__popover" closable="false"  model="block.column.showPopover" position="['SW']">
                    <smss-checklist model="block.column.selected" 
                        options="block.column.options"
                        multiple
                        quickselect
                        searchable
                        change="nlpSearch.resetComponent(parentIndex, 'column'); nlpSearch.componentUpdated(parentIndex, 'column');"></smss-checklist>
                </smss-popover-content>
            </div>`,
            operation: `<div ng-if="block.operation" class="nlp-search__block__subcomponent">
                <div ng-if="block.operation.options.length > 0 && block.operation.options[0] !== '?'">
                    <smss-dropdown model="block.operation.selected"
                        options="block.operation.options"
                        change="nlpSearch.resetComponent(parentIndex, 'operation'); nlpSearch.componentUpdated(parentIndex, 'operation');"
                        placeholder="operation"></smss-dropdown>
                </div>
                <div ng-if="block.operation.options.length === 1 && block.operation.options[0] === '?'">
                    <smss-input ng-model="block.operation.selected" 
                        ng-change="nlpSearch.resetComponent(parentIndex, 'operation'); nlpSearch.componentUpdated(parentIndex, 'operation');"
                        placeholder="operation">
                    </smss-input>
                </div>
            </div>`,
            static_operation: `<div ng-if="block.static_operation" class="nlp-search__block__name">{{block.static_operation}}</div>`,
            value: `<div ng-if="block.value" class="nlp-search__block__subcomponent" ng-class="{'nlp-search__block__subcomponent--full': block.value.type === 'RANGE'}">
                <div ng-if="block.value.options.length > 0 && block.value.options[0] !== '?' && block.dataType !== 'NUMBER'" 
                    title="{{block.value.selected}}"
                    smss-popover>
                    <span ng-if="block.value.selected.length === 0" class="nlp-search__block__placeholder">values</span>
                    <span ng-repeat="col in block.value.selected track by $index">{{col}}{{$index != block.value.selected.length - 1 ? ', ' : ''}}</span>
                    <smss-popover-content class="nlp-search__popover" closable="false" position="['SW']">
                        <smss-checklist model="block.value.selected"
                        options="block.value.options"
                        multiple
                        quickselect
                        searchable
                        change="nlpSearch.componentUpdated(parentIndex, 'value')"></smss-checklist>
                    </smss-popover-content>
                </div>
                <div ng-if="block.value.type !== 'RANGE' &&(block.value.options.length === 1 && block.value.options[0] === '?') || block.dataType === 'NUMBER'">
                    <smss-input ng-model="block.value.selected" 
                        ng-change="nlpSearch.componentUpdated(parentIndex, 'value')"
                        placeholder="value"></smss-input>
                </div>
                <div ng-if="block.value.options[0] === '?' && block.value.type === 'RANGE'" class="nlp-search__block__range">
                    <smss-input ng-model="block.value.selected[0]" placeholder="value 1" ng-change="nlpSearch.componentUpdated(parentIndex, 'value')"></smss-input>
                    <span class="nlp-search__block__name">and</span>
                    <smss-input ng-model="block.value.selected[1]" placeholder="value 2" ng-change="nlpSearch.componentUpdated(parentIndex, 'value')"></smss-input>
                </div>
            </div>`,
        };

        // Functions
        scope.nlpSearch.frameChanged = frameChanged;
        scope.nlpSearch.isValidQuery = isValidQuery;
        scope.nlpSearch.clearQuery = clearQuery;
        scope.nlpSearch.addComponent = addComponent;
        scope.nlpSearch.componentUpdated = componentUpdated;
        scope.nlpSearch.resetComponent = resetComponent;
        scope.nlpSearch.deleteComponent = deleteComponent;
        scope.nlpSearch.getSuggestions = getSuggestions;
        scope.nlpSearch.getInsights = getInsights;
        scope.nlpSearch.createInsight = createInsight;
        scope.nlpSearch.addSentence = addSentence;
        scope.nlpSearch.getVizType = getVizType;
        scope.nlpSearch.changePage = changePage;

        /**
         * @name changePage
         * @desc changes the selected page
         * @param page the page to view (QUERY, RESULT)
         */
        function changePage(page: string): void {
            scope.nlpSearch.page = page;
        }

        /**
         * @name clearQuery
         * @desc resets the whole query
         */
        function clearQuery(): void {
            scope.nlpSearch.query = [];
            scope.nlpSearch.suggestionType = SUGGESTION_TYPE.TEMPLATE;
            scope.nlpSearch.results = [];
            scope.nlpSearch.temporaryComponent = [];
            scope.nlpSearch.suggestions = [];
            scope.nlpSearch.disableIndex = 0;
            scope.nlpSearch.selectedInsight = {};
            scope.nlpSearch.vizType = {
                options: [],
                selected: '',
            };
        }

        /**
         * @name addSentence
         * @desc creates the query from the selected sentence template
         * @param sentence - the sentence template that was chosen
         */
        function addSentence(sentence: string[]): void {
            for (let i = 0; i < sentence.length; i++) {
                const template = createTemplate(sentence[i]);

                scope.nlpSearch.query.push(template);
                if (i > 0) {
                    template.omit = 'all';
                    scope.nlpSearch.temporaryComponent.push(i);
                }
            }
            scope.nlpSearch.selectedTemplate = '';
            scope.nlpSearch.suggestionType = SUGGESTION_TYPE.SUBCOMPONENT;
            getSuggestions(
                0,
                TEMPLATES[scope.nlpSearch.query[0].component].required[0]
            );
        }

        /**
         * @name createTemplate
         * @desc creates the template based on the component being added
         * @param model - the template being created
         */
        function createTemplate(model: string): any {
            const template: any = {
                component: model,
                query: TEMPLATES[model].query,
                display: TEMPLATES[model].display,
                column: {
                    options: [],
                    selected: TEMPLATES[model].column == 'SINGLE' ? '' : [],
                    type: TEMPLATES[model].column,
                    showPopover: false,
                },
                isComplete: false,
                order: TEMPLATES[model].order,
            };
            if (TEMPLATES[model].operation) {
                template.operation = {
                    options: [],
                    selected: TEMPLATES[model].operation == 'SINGLE' ? '' : [],
                    type: TEMPLATES[model].operation,
                };
            }
            if (TEMPLATES[model].static_operation) {
                template.static_operation = TEMPLATES[model].static_operation;
            }
            if (TEMPLATES[model].value) {
                template.value = {
                    options: [],
                    selected: TEMPLATES[model].value == 'SINGLE' ? '' : [],
                    type: TEMPLATES[model].value,
                };
            }
            if (TEMPLATES[model].static_value) {
                template.static_value = TEMPLATES[model].static_value;
            }

            if (model === TEMPLATE_TYPE.AGGREGATE_GENERAL) {
                template.query = AGGREGATES[0];
                template.display = {
                    selected: AGGREGATES[0],
                    options: AGGREGATES,
                };
            }
            if (model === TEMPLATE_TYPE.HAVING_GENERAL) {
                template.query = HAVING[0].value;
                template.display = {
                    selected: HAVING[0].value,
                    options: HAVING,
                    isObject: true,
                };
            }

            if (model === TEMPLATE_TYPE.BASED_ON) {
                template.query = BASED_ON[0];
                template.display = {
                    selected: BASED_ON[0],
                    options: BASED_ON,
                };
            }

            if (model === TEMPLATE_TYPE.SORT_GENERAL) {
                template.operation = {
                    selected: 'ascending',
                    options: ['ascending', 'descending'],
                    type: TEMPLATES[model].operation,
                };
            }

            return template;
        }

        /**
         * @name addComponent
         * @desc called whenever a new component is added to the query
         * IMPORTANT RULES:
         * If a select is present and an aggregate is added, then group must be automatically added.
         * If a select is NOT present and an aggregate is added, then select and group must be automatically added.
         * Group and Select must use the same columns.
         */
        function addComponent(): void {
            const model = scope.nlpSearch.selectedTemplate,
                template = createTemplate(model);
            scope.nlpSearch.selectedTemplate = '';
            templateDropdownEle.blur();
            scope.nlpSearch.suggestionType = SUGGESTION_TYPE.SUBCOMPONENT;

            scope.nlpSearch.query.push(template);
            const currentIndex = scope.nlpSearch.query.length - 1;

            // If the user manually added the group (it was not automatically added), have to sync with select
            if (model === TEMPLATE_TYPE.GROUP) {
                scope.nlpSearch.temporaryComponent.push(currentIndex);
                scope.nlpSearch.query[currentIndex].omit =
                    TEMPLATES[
                        scope.nlpSearch.query[currentIndex].component
                    ].required[0];
                updateGroupOrSelect(
                    scope.nlpSearch.query[currentIndex],
                    [],
                    TEMPLATE_TYPE.SELECT
                );
            }

            // If an aggregate is added or group is manually added, must check to see if select and group components are present
            if (
                model === TEMPLATE_TYPE.AGGREGATE_GENERAL ||
                model === TEMPLATE_TYPE.GROUP
            ) {
                let selectPresent = false,
                    groupPresent = false;
                for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                    if (
                        scope.nlpSearch.query[i].component ===
                        TEMPLATE_TYPE.SELECT
                    ) {
                        selectPresent = true;
                    }
                    if (
                        scope.nlpSearch.query[i].component ===
                        TEMPLATE_TYPE.GROUP
                    ) {
                        groupPresent = true;
                    }
                }

                if (!selectPresent) {
                    const selectTemplate = {
                        component: TEMPLATE_TYPE.SELECT,
                        query: TEMPLATES[TEMPLATE_TYPE.SELECT].query,
                        display: TEMPLATES[TEMPLATE_TYPE.SELECT].display,
                        column: {
                            options: [],
                            selected:
                                TEMPLATES[TEMPLATE_TYPE.SELECT].column ==
                                'SINGLE'
                                    ? ''
                                    : [],
                            type: TEMPLATES[TEMPLATE_TYPE.SELECT].column,
                        },
                        isComplete: true,
                        isTemporary: true,
                        omit: 'all',
                        order: TEMPLATES[TEMPLATE_TYPE.SELECT].order,
                    };

                    scope.nlpSearch.query.push(selectTemplate);
                    updateGroupOrSelect(
                        scope.nlpSearch.query[scope.nlpSearch.query.length - 1],
                        [],
                        TEMPLATE_TYPE.GROUP
                    );
                    scope.nlpSearch.temporaryComponent.push(
                        scope.nlpSearch.query.length - 1
                    );
                }
                if (!groupPresent) {
                    const groupTemplate = {
                        component: TEMPLATE_TYPE.GROUP,
                        query: TEMPLATES[TEMPLATE_TYPE.GROUP].query,
                        display: TEMPLATES[TEMPLATE_TYPE.GROUP].display,
                        column: {
                            options: [],
                            selected:
                                TEMPLATES[TEMPLATE_TYPE.GROUP].column ==
                                'SINGLE'
                                    ? ''
                                    : [],
                            type: TEMPLATES[TEMPLATE_TYPE.GROUP].column,
                        },
                        isComplete: true,
                        isTemporary: true,
                        omit: 'all',
                        order: TEMPLATES[TEMPLATE_TYPE.GROUP].order,
                    };

                    scope.nlpSearch.query.push(groupTemplate);
                    updateGroupOrSelect(
                        scope.nlpSearch.query[scope.nlpSearch.query.length - 1],
                        [],
                        TEMPLATE_TYPE.SELECT
                    );
                    scope.nlpSearch.temporaryComponent.push(
                        scope.nlpSearch.query.length - 1
                    );
                }
            }
            if (currentIndex <= scope.nlpSearch.disableIndex) {
                getSuggestions(currentIndex, TEMPLATES[model].required[0]);
            }
        }

        /**
         * @name componentUpdated
         * @desc called whenever a template is updated in the query, will get the next set of suggestions
         * @param templateIndex the location of the template in the query
         * @param subcomponent the subcomponent that is being updated
         */
        function componentUpdated(
            templateIndex: number,
            subcomponent?: string
        ): void {
            let template = scope.nlpSearch.query[templateIndex],
                required: string[] = TEMPLATES[template.component].required,
                isComplete = true,
                getSubcomponent = true,
                i,
                nextSubcomponent,
                subcomponentIndex =
                    template.order.indexOf(subcomponent) || null;

            /** Updates to current template component */

            // For aggregate, having, and based on templates, set query to the display value that the BE expects
            if (template.display.selected) {
                template.query = template.display.selected;
            }

            // If the component needs a value, set the data type of the column (determines the type of component to show)
            if (required.indexOf('value') > -1) {
                if (template.column.selected) {
                    for (let k = 0; k < scope.nlpSearch.headers.length; k++) {
                        if (
                            template.column.selected ===
                            scope.nlpSearch.headers[k].alias
                        ) {
                            template.dataType =
                                scope.nlpSearch.headers[k].dataType;
                            break;
                        }
                    }
                }
            }

            // For having and where, the template value can be multiple values or a range of values
            if (
                (template.component === TEMPLATE_TYPE.WHERE ||
                    template.component === TEMPLATE_TYPE.HAVING_GENERAL) &&
                template.operation
            ) {
                if (template.operation.selected === 'between value and value') {
                    template.value.type = TEMPLATE_VALUES.RANGE;
                } else {
                    template.value.type =
                        TEMPLATES[template.component].value.type;
                }
            }

            // If a subcomponent is updated, must wipe out any trailing subcomponents to get an updated list of options
            // Exception: Sort template uses predefined list of options (not options fetched from BE)
            if (
                subcomponent &&
                subcomponentIndex < template.order.length - 1 &&
                template.component !== TEMPLATE_TYPE.SORT_GENERAL
            ) {
                for (
                    let i = subcomponentIndex + 1;
                    i < template.order.length;
                    i++
                ) {
                    const key = template.order[i],
                        type = template[key].type;
                    template[key].selected = type === 'SINGLE' ? '' : [];
                }
            }

            /** Updates to the full query */

            // Reset any trailing template components so they can get new options
            if (templateIndex < scope.nlpSearch.query.length - 1) {
                scope.nlpSearch.temporaryComponent = [];
                const newQuery: any = [];
                for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                    const templateName = scope.nlpSearch.query[i].component;
                    if (i >= templateIndex + 1 && templateName) {
                        const emptyTemplate = createTemplate(templateName);
                        emptyTemplate.omit = 'all';
                        newQuery.push(emptyTemplate);
                        scope.nlpSearch.temporaryComponent.push(i);
                    } else {
                        newQuery.push(scope.nlpSearch.query[i]);
                    }
                }
                scope.nlpSearch.query = newQuery;
            }

            // Enforces rule that group and select must have the same columns selected
            if (template.component === TEMPLATE_TYPE.SELECT) {
                updateGroupOrSelect(
                    template,
                    template.column.selected,
                    TEMPLATE_TYPE.GROUP
                );
            }
            if (template.component === TEMPLATE_TYPE.GROUP) {
                updateGroupOrSelect(
                    template,
                    template.column.selected,
                    TEMPLATE_TYPE.SELECT
                );
            }

            // Check if all the required parts are filled in the template
            for (i = 0; i < required.length; i++) {
                // If the value type is range, need to check for 2 values
                if (
                    required[i] === 'value' &&
                    template.value.type === 'RANGE'
                ) {
                    if (template.value.selected.length < 2) {
                        isComplete = false;
                        getSubcomponent = false;
                        break;
                    } else {
                        if (
                            template.value.selected[0].length === 0 ||
                            template.value.selected[1].length === 0
                        ) {
                            isComplete = false;
                            getSubcomponent = false;
                            break;
                        }
                    }
                }
                if (template[required[i]].selected.length < 1) {
                    isComplete = false;
                    nextSubcomponent = required[i];
                    break;
                }
            }

            // If the component is complete, then check for temporary components to fill, otherwise get the next set of suggestions
            // Else get the suggestions for the next subcomponent
            if (isComplete) {
                template.isComplete = true;
                if (
                    templateIndex + 1 ==
                    scope.nlpSearch.temporaryComponent[0]
                ) {
                    const firstSubcomponent =
                        TEMPLATES[
                            scope.nlpSearch.query[templateIndex + 1].component
                        ].required[0];
                    scope.nlpSearch.query[templateIndex + 1].omit =
                        scope.nlpSearch.query[templateIndex + 1].omit === 'all'
                            ? firstSubcomponent
                            : '';

                    scope.nlpSearch.suggestionType =
                        SUGGESTION_TYPE.SUBCOMPONENT;
                    getSuggestions(templateIndex + 1, firstSubcomponent);
                } else {
                    scope.nlpSearch.suggestionType = SUGGESTION_TYPE.TEMPLATE;
                    getSuggestions();
                }
            } else {
                template.isComplete = false;
                scope.nlpSearch.suggestionType = SUGGESTION_TYPE.SUBCOMPONENT;
                if (getSubcomponent) {
                    getSuggestions(templateIndex, nextSubcomponent);
                }
            }
        }

        /**
         * @name mergeColumns
         * @desc helper function to merge columns to enforce that select and group have the same columns
         * @param col1 - array of columns
         * @param col2 - array  of columns
         */
        function mergeColumns(col1, col2): string[] {
            const merged: string[] = [];

            for (let id1 = 0; id1 < col1.length; id1++) {
                if (merged.indexOf(col1[id1]) === -1) {
                    merged.push(col1[id1]);
                }
            }

            for (let id2 = 0; id2 < col2.length; id2++) {
                if (merged.indexOf(col2[id2]) === -1) {
                    merged.push(col2[id2]);
                }
            }

            return merged;
        }
        /**
         * @name updateGroupOrSelect
         * @desc updates the selected columns for the group or select component when the other component is updated
         * @param template - the template that was updated
         * @param columns - list of selected columns
         * @param update - the template to update
         */
        function updateGroupOrSelect(
            template: any,
            columns: any[],
            update: string
        ): void {
            for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                if (scope.nlpSearch.query[i].component === update) {
                    const old = scope.nlpSearch.query[i].column.selected,
                        merged = mergeColumns(old, columns);
                    scope.nlpSearch.query[i].column.selected = merged;
                    template.column.selected = merged;
                }
            }
        }

        /**
         * @name resetComponent
         * @desc for where and having components, will reset any subcomponents if an earlier subcomponent is updated
         * @param componentIndex - the index of the component to update
         * @param subcomponent  - the subcomponent that is being updated
         */
        function resetComponent(
            componentIndex: number,
            subcomponent: string
        ): void {
            const component = scope.nlpSearch.query[componentIndex],
                template = TEMPLATES[component.component];

            if (
                subcomponent == 'column' &&
                template.operation &&
                template.value
            ) {
                // reset operation and value
                component.operation = {
                    options: [],
                    selected: template.operation == 'SINGLE' ? '' : [],
                    type: template.operation,
                };
                component.value = {
                    options: [],
                    selected: template.value == 'SINGLE' ? '' : [],
                    type: template.value,
                };
            } else if (subcomponent == 'operation' && template.value) {
                // reset value
                component.value = {
                    options: [],
                    selected: template.value == 'SINGLE' ? '' : [],
                    type: template.value,
                };
            }
        }

        /**
         * @name deleteComponent
         * @desc called to delete a component in the query
         * @param index - the component to delete
         */
        function deleteComponent(index): void {
            const newTempComponent: any[] = [],
                newQuery: any[] = [],
                autoDelete: string[] = [],
                componentToDelete: string =
                    scope.nlpSearch.query[index].component;

            // Check for other components to auto delete because they require the deleted component
            if (componentToDelete === TEMPLATE_TYPE.GROUP) {
                autoDelete.push(TEMPLATE_TYPE.AGGREGATE_GENERAL);
                autoDelete.push(TEMPLATE_TYPE.HAVING_GENERAL);
            }
            if (componentToDelete === TEMPLATE_TYPE.AGGREGATE_GENERAL) {
                autoDelete.push(TEMPLATE_TYPE.GROUP);
                autoDelete.push(TEMPLATE_TYPE.HAVING_GENERAL);
            }
            if (componentToDelete === TEMPLATE_TYPE.BASED_ON) {
                autoDelete.push(TEMPLATE_TYPE.DISTRIBUTION);
            }
            if (componentToDelete === TEMPLATE_TYPE.DISTRIBUTION) {
                autoDelete.push(TEMPLATE_TYPE.BASED_ON);
            }

            // Reconstruct the query
            for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                if (
                    i !== index &&
                    autoDelete.indexOf(scope.nlpSearch.query[i].component) ===
                        -1
                ) {
                    newQuery.push(scope.nlpSearch.query[i]);
                    // If the template is temporary, need to update the index
                    if (scope.nlpSearch.temporaryComponent.indexOf(i) > -1) {
                        newTempComponent.push(newQuery.length - 1);
                    }
                }
            }
            scope.nlpSearch.query = newQuery;
            scope.nlpSearch.temporaryComponent = newTempComponent;
            if (scope.nlpSearch.temporaryComponent[0] === index) {
                const firstComponent =
                    TEMPLATES[scope.nlpSearch.query[index].component]
                        .required[0];
                scope.nlpSearch.suggestionType = SUGGESTION_TYPE.SUBCOMPONENT;
                scope.nlpSearch.query[index].omit =
                    scope.nlpSearch.query[index].omit === 'all'
                        ? firstComponent
                        : '';
                getSuggestions(index, firstComponent);
            } else {
                scope.nlpSearch.suggestionType = SUGGESTION_TYPE.TEMPLATE;
            }
        }

        /**
         * @name getInsights
         * @desc runs the query that the user built and returns insights to build
         */
        function getInsights(): void {
            let query: any[] = [],
                message = semossCoreService.utility.random('query-pixel'),
                panelId: number = scope.widgetCtrl.getShared('panelCounter'),
                commands: PixelCommand[] = [];
            // If this is a brand new nlp viz (not previously created by nlp-search), then open in a new panel
            if (!scope.nlpSearch.reverse) {
                panelId++;
            }
            scope.nlpSearch.loading = true;

            for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                const oldTemplate = scope.nlpSearch.query[i],
                    template: any = {
                        component: oldTemplate.query,
                    };
                if (oldTemplate.column && oldTemplate.column.selected.length) {
                    template.column = oldTemplate.column.selected;
                }
                if (
                    oldTemplate.operation &&
                    oldTemplate.operation.selected.length
                ) {
                    template.operation = oldTemplate.operation.selected;
                }
                if (oldTemplate.static_operation) {
                    template.operation = oldTemplate.static_operation;
                }
                if (oldTemplate.value && oldTemplate.value.selected.length) {
                    template.value = oldTemplate.value.selected;
                }
                if (oldTemplate.static_value) {
                    template.value = oldTemplate.static_value;
                }
                query.push(template);
            }

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                scope.nlpSearch.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.nlpSearch.results = output;

                if (scope.nlpSearch.results.length === 1) {
                    scope.nlpSearch.selectedInsight = JSON.stringify(
                        scope.nlpSearch.results[0]
                    );
                    getVizType();
                }

                changePage('RESULT');
            });

            if (scope.nlpSearch.selectedType === 'FRAME') {
                commands.push({
                    type: 'Pixel',
                    components: [scope.nlpSearch.selectedFrame],
                });
            }
            commands.push({
                type: 'naturalLanguageSearch',
                components: [
                    query,
                    scope.nlpSearch.selectedType === 'GLOBAL'
                        ? scope.nlpSearch.selectedDBs.map(
                              (db) => db.database_id
                          )
                        : [],
                    scope.nlpSearch.selectedType === 'GLOBAL',
                    panelId,
                ],
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
         * @name getVizType
         * @desc gets the list of possible viz types (first imports data, then gets viz types)
         */
        function getVizType(): void {
            scope.nlpSearch.vizType = {
                options: [],
                selected: '',
            };
            const insight =
                    typeof scope.nlpSearch.selectedInsight === 'string'
                        ? JSON.parse(scope.nlpSearch.selectedInsight)
                        : scope.nlpSearch.selectedInsight,
                callback2 = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];
                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    scope.nlpSearch.vizType.options = output;
                    scope.nlpSearch.vizType.selected = output[0];
                },
                callback1 = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];
                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    // After importing data, get the viz types
                    if (insight && insight.viz_types_pixel) {
                        scope.widgetCtrl.execute(
                            [
                                {
                                    type: 'Pixel',
                                    components: [insight.viz_types_pixel],
                                    terminal: true,
                                },
                            ],
                            callback2
                        );
                    }
                };

            // First import data
            if (insight && insight.import_pixel) {
                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'Pixel',
                            components: [insight.import_pixel],
                            terminal: true,
                        },
                    ],
                    callback1
                );
            }
        }

        /**
         * @name createInsight
         * @desc creates the insight (first imports data, then runs the recipe)
         */
        function createInsight(): void {
            const currentPanel = scope.widgetCtrl.panelId,
                currentWidgetId = scope.widgetCtrl.widgetId,
                insight =
                    typeof scope.nlpSearch.selectedInsight === 'string'
                        ? JSON.parse(scope.nlpSearch.selectedInsight)
                        : scope.nlpSearch.selectedInsight,
                callback1 = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];
                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    // after importing data, run the recipe to create the viz
                    if (insight && insight.viz_pixel) {
                        let recipe = insight.viz_pixel;

                        if (scope.nlpSearch.vizType.selected === 'Sunburst') {
                            recipe = recipe.replace('echarts', 'standard');
                        }

                        scope.widgetCtrl.execute(
                            [
                                {
                                    type: 'Pixel',
                                    components: [
                                        recipe.replace(
                                            '<viztype>',
                                            JSON.stringify(
                                                scope.nlpSearch.vizType.selected
                                            )
                                        ),
                                    ],
                                    terminal: true,
                                },
                            ],
                            callback2
                        );
                    }
                },
                callback2 = function (response) {
                    for (let i = 0; i < response.pixelReturn.length; i++) {
                        if (
                            response.pixelReturn[i].operationType.indexOf(
                                'ERROR'
                            ) > -1
                        ) {
                            return;
                        }
                    }
                    const panelId = response.pixelReturn[0].output.panelId,
                        widgetId =
                            currentWidgetId.substring(
                                0,
                                currentWidgetId.length - currentPanel.length
                            ) + panelId;
                    // Save the query so we can go from viz to nlp-search
                    optionsService.set(
                        widgetId,
                        'nlpQuery',
                        scope.nlpSearch.query
                    );
                    optionsService.set(widgetId, 'nlpQueryOptions', {
                        type: scope.nlpSearch.selectedType,
                        selected:
                            scope.nlpSearch.selectedType === 'GLOBAL'
                                ? scope.nlpSearch.selectedDBs
                                : '',
                    });
                };
            // first import data
            if (insight && insight.import_pixel) {
                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'Pixel',
                            components: [insight.import_pixel],
                            terminal: true,
                        },
                    ],
                    callback1
                );
            }
        }

        /**
         * @name isSameQuery
         * @desc checks if the previous and current query are the same
         * @param q1 the first query to check
         * @param q2 the second query to check
         */
        function isSameQuery(q1, q2): boolean {
            if (!q1 || !q2) {
                return false;
            }
            if (
                (q1.length === 0 || q2.length === 0) &&
                scope.nlpSearch.suggestions.length === 0
            ) {
                return false;
            }
            if (q1.length !== q2.length) {
                return false;
            }

            for (let i = 0; i < q1.length; i++) {
                if (JSON.stringify(q1[i]) !== JSON.stringify(q2[i])) {
                    return false;
                }
            }

            return true;
        }

        /**
         * @name getSuggestions
         * @desc gets the next set of suggested templates
         * @param templateIndex - the component to update (optional)
         * @param subcomponent - the subcomponent that is being updated (optional)
         */
        function getSuggestions(
            templateIndex?: number | undefined,
            subcomponent?: string | undefined
        ): void {
            // Only get new suggestions if the query has changed
            if (
                isSameQuery(
                    scope.nlpSearch.query,
                    scope.nlpSearch.previousQuery
                )
            ) {
                return;
            }

            scope.nlpSearch.suggestions = [];
            scope.nlpSearch.previousQuery = semossCoreService.utility.freeze(
                scope.nlpSearch.query
            );

            const message = semossCoreService.utility.random('query-pixel'),
                query: any = [],
                commands: PixelCommand[] = [];

            // Build the query in the format that the backend expects
            for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                const oldTemplate = scope.nlpSearch.query[i],
                    template: any = {
                        component: oldTemplate.query,
                    };

                // If group was auto-added and the aggregate is empty, omit the whole component to get the options for the aggregate
                if (oldTemplate.omit && oldTemplate.omit === 'all') {
                    continue;
                }
                // If group was auto-added and aggregate is filled, omit the column to get the options for the group
                if (
                    oldTemplate.omit &&
                    oldTemplate.omit.length > 0 &&
                    oldTemplate.omit !== 'all'
                ) {
                    query.push(template);
                    continue;
                }

                if (oldTemplate.column && oldTemplate.column.selected.length) {
                    template.column = oldTemplate.column.selected;
                }
                if (
                    oldTemplate.operation &&
                    oldTemplate.operation.selected.length
                ) {
                    template.operation = oldTemplate.operation.selected;
                }
                if (oldTemplate.static_operation) {
                    template.operation = oldTemplate.static_operation;
                }
                if (oldTemplate.value && oldTemplate.value.selected.length) {
                    template.value = oldTemplate.value.selected;
                }
                if (oldTemplate.static_value) {
                    template.value = oldTemplate.static_value;
                }
                // For top/bottom templates, the user must enter the n value before selecting a column
                if (
                    oldTemplate.component === TEMPLATE_TYPE.TOP ||
                    oldTemplate.component === TEMPLATE_TYPE.BOTTOM ||
                    oldTemplate.component === TEMPLATE_TYPE.EXCLUDE_TOP ||
                    oldTemplate.component === TEMPLATE_TYPE.EXCLUDE_BOTTOM
                ) {
                    if (
                        oldTemplate.value.selected.length === 0 &&
                        oldTemplate.column.selected.length === 0
                    ) {
                        template.column = '';
                    }
                }
                query.push(template);
            }
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // Set options for sentence templates (only for initial use when the query is empty)
                if (scope.nlpSearch.query.length === 0) {
                    const options: any[] = [];
                    for (let i = 0; i < output.length; i++) {
                        options.push({
                            display: output[i].join(' '),
                            value: output[i],
                        });
                    }
                    scope.nlpSearch.suggestions = options;
                    // Set options for filling out the subcomponents in the template
                } else if (
                    scope.nlpSearch.suggestionType ===
                        SUGGESTION_TYPE.SUBCOMPONENT &&
                    (templateIndex || templateIndex === 0) &&
                    subcomponent
                ) {
                    scope.nlpSearch.query[templateIndex][subcomponent].options =
                        output.sort();
                    $timeout(function () {
                        scope.nlpSearch.query[templateIndex][
                            subcomponent
                        ].showPopover = true;
                    });
                    scope.nlpSearch.suggestions = [];
                    // If the template being updated is the temporary component, then update to get the next suggestions
                    if (
                        scope.nlpSearch.temporaryComponent[0] === templateIndex
                    ) {
                        scope.nlpSearch.query[templateIndex].omit = '';
                        scope.nlpSearch.temporaryComponent.shift();
                        componentUpdated(templateIndex);
                    }
                    // If there is only one result, automatically set it and get the next set off suggestions
                    if (
                        scope.nlpSearch.query[templateIndex][subcomponent]
                            .options.length === 1 &&
                        scope.nlpSearch.query[templateIndex][subcomponent]
                            .options[0] !== '?'
                    ) {
                        scope.nlpSearch.query[templateIndex][
                            subcomponent
                        ].selected =
                            scope.nlpSearch.query[templateIndex][
                                subcomponent
                            ].options[0];
                        scope.nlpSearch.query[templateIndex][
                            subcomponent
                        ].showPopover = false;
                        componentUpdated(templateIndex);
                    }
                    const blockEle = ele[0].querySelector(
                        `#block-${templateIndex}`
                    );
                    if (blockEle) {
                        blockEle.scrollIntoView();
                    }
                    // Set options for template suggestions
                } else {
                    scope.nlpSearch.suggestions = output;
                }
            });

            if (scope.nlpSearch.selectedType === 'FRAME') {
                commands.push({
                    type: 'Pixel',
                    components: [scope.nlpSearch.selectedFrame],
                });
            }
            commands.push({
                type: 'nlsQueryHelper',
                components: [
                    query,
                    scope.nlpSearch.selectedType === 'GLOBAL'
                        ? scope.nlpSearch.selectedDBs.map(
                              (db) => db.database_id
                          )
                        : [],
                    scope.nlpSearch.selectedType === 'GLOBAL',
                ],
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
         * @name getFrames
         * @desc gets the possible frames for the insight
         */
        function getFrames(): void {
            const frames = scope.widgetCtrl.getShared('frames') || {},
                current = scope.widgetCtrl.getFrame();
            scope.nlpSearch.availableFrames = [];
            scope.nlpSearch.frameMap = frames;
            for (const frame in frames) {
                if (frames.hasOwnProperty(frame)) {
                    scope.nlpSearch.availableFrames.push(frames[frame].name);
                }
            }
            scope.nlpSearch.selectedFrame = current ? current.name : '';
        }

        /**
         * @name getDBs
         * @desc get a list of databases
         */
        function getDBs(databases): void {
            const message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                scope.nlpSearch.dbList = output;
                scope.nlpSearch.selectedDBs =
                    databases.length > 0 ? databases : output;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'myDatabases',
                        components: [],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name frameChanged
         * @desc called to update the headers whenever the selected frame changes
         */
        function frameChanged(): void {
            for (let i = 0; i < scope.nlpSearch.availableFrames.length; i++) {
                if (
                    scope.nlpSearch.availableFrames[i] ===
                    scope.nlpSearch.selectedFrame
                ) {
                    scope.nlpSearch.headers =
                        scope.nlpSearch.frameMap[
                            scope.nlpSearch.availableFrames[i]
                        ].headers;
                    break;
                }
            }
        }

        /**
         * @name isValidQuery
         * @desc checks if the query is valid
         */
        function isValidQuery(): boolean {
            let hasSelect = false,
                hasAggregate = false,
                hasGroup = false,
                hasBasedOn = false;

            if (scope.nlpSearch.selectedType === 'FRAME') {
                // Invalid if the frame has not been selected in frame mode
                if (scope.nlpSearch.selectedFrame.length === 0) {
                    scope.nlpSearch.errorMessage = 'You must select a frame.';
                    return false;
                }
            }

            if (scope.nlpSearch.selectedType === 'GLOBAL') {
                // Invalid if no databases are selected in global mode
                if (scope.nlpSearch.selectedDBs.length === 0) {
                    scope.nlpSearch.errorMessage =
                        'You must select at least one database.';
                    return false;
                }
            }

            // Invalid if the query is empty
            if (scope.nlpSearch.query.length === 0) {
                return false;
            }

            for (let i = 0; i < scope.nlpSearch.query.length; i++) {
                // Invalid if the components are incomplete
                if (!scope.nlpSearch.query[i].isComplete) {
                    scope.nlpSearch.disableIndex = i + 1;
                    scope.nlpSearch.errorMessage =
                        'All components must be complete before execution.';
                    return false;
                }
                if (
                    scope.nlpSearch.query[i].component === TEMPLATE_TYPE.SELECT
                ) {
                    hasSelect = true;
                }
                if (
                    scope.nlpSearch.query[i].component ===
                    TEMPLATE_TYPE.AGGREGATE_GENERAL
                ) {
                    hasAggregate = true;
                }
                if (
                    scope.nlpSearch.query[i].component === TEMPLATE_TYPE.GROUP
                ) {
                    hasGroup = true;
                }

                if (
                    scope.nlpSearch.query[i].component ===
                    TEMPLATE_TYPE.BASED_ON
                ) {
                    hasBasedOn = true;
                }
            }

            scope.nlpSearch.disableIndex = scope.nlpSearch.query.length;

            // Invalid if the query does not contain select or aggregate (average, count, max, min, sum)
            if (!(hasSelect || hasBasedOn)) {
                scope.nlpSearch.errorMessage =
                    'Your query must contain select or based on.';
                return false;
            }

            // Invalid if the query contains an aggregate but no group
            if (hasAggregate && !hasGroup) {
                scope.nlpSearch.errorMessage =
                    'Your query must contain a group component.';
                return false;
            }
            scope.nlpSearch.errorMessage = '';
            return true;
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            // Load NLP search to improve performance
            scope.widgetCtrl.meta([
                {
                    meta: true,
                    type: 'Pixel',
                    components: ['LoadNLPSearch()'],
                    terminal: true,
                },
            ]);

            // Check the store if the widget has a previously saved query
            const storedQuery = optionsService.get(
                    scope.widgetCtrl.widgetId,
                    'nlpQuery'
                ),
                options = optionsService.get(
                    scope.widgetCtrl.widgetId,
                    'nlpQueryOptions'
                ),
                active = scope.widgetCtrl.getWidget('active'),
                type = scope.widgetCtrl.getWidget(
                    'view.' + active + '.options.type'
                );

            if (storedQuery) {
                scope.nlpSearch.query = storedQuery;
                scope.nlpSearch.reverse = true;
            }
            if (type && type === 'GLOBAL') {
                scope.nlpSearch.selectedType = type;
                scope.nlpSearch.selectedDBs = [];
            }
            if (options && options.type === 'GLOBAL') {
                scope.nlpSearch.selectedType = options.type;
                scope.nlpSearch.selectedDBs = options.selected;
            }

            // Get Frames
            getFrames();
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                getFrames
            );
            if (scope.nlpSearch.selectedFrame) {
                getSuggestions();
                $timeout(function () {
                    scope.nlpSearch.showTemplateDropdown = true;
                });
            }

            // Get databases
            getDBs(scope.nlpSearch.selectedDBs);

            templateDropdownEle = ele[0].querySelector('#template-dropdown');

            scope.$watchCollection(
                'nlpSearch.query',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        if (newValue.length === 0) {
                            scope.nlpSearch.suggestionType =
                                SUGGESTION_TYPE.TEMPLATE;
                            getSuggestions();
                        }
                    }
                }
            );

            scope.$on('$destroy', function () {
                updateFrameListener();
            });
        }

        initialize();
    }
}
