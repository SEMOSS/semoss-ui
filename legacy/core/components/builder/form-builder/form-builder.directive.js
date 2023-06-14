'use strict';
// TODO refactor to remove the dependency from builder.directive.js. it's mixing old forms and new forms and jumping around...gets too confusing
// TODO think about how custom data model's will be used whereever we expect there to be config.app and config.table
/**
 * @name form-builder
 * @desc form html builder view
 */
export default angular
    .module('app.form-builder.directive', [])
    .directive('formBuilder', formDirective);

import './form-builder.scss';

formDirective.$inject = ['$compile', '$timeout', 'semossCoreService'];

function formDirective($compile, $timeout, semossCoreService) {
    form.$inject = [];
    formLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./form-builder.directive.html'),
        scope: {},
        controller: form,
        controllerAs: 'form',
        bindToController: {
            mode: '@?',
            app: '=?',
            table: '=?',
            json: '=?',
        },
        require: ['?^widget'],
        link: formLink,
    };

    function form() {}

    function formLink(scope, ele, attrs, ctrl) {
        var counter = 0,
            cache = {},
            groupCounter = 0;

        scope.widgetCtrl = ctrl[0];

        scope.form.setData = setData;
        scope.form.addComponent = addComponent;
        scope.form.addMultiComponents = addMultiComponents;
        scope.form.processInput = processInput;
        scope.form.closeInput = closeInput;
        scope.form.selectComponent = selectComponent;
        scope.form.removeComponent = removeComponent;
        scope.form.toggleSource = toggleSource;
        scope.form.toggleVariableBinding = toggleVariableBinding;
        scope.form.showModelBinding = showModelBinding;
        scope.form.toggleStyle = toggleStyle;
        scope.form.addEmptyStyle = addEmptyStyle;
        scope.form.removeStyle = removeStyle;
        scope.form.updateStyleFromModel = updateStyleFromModel;
        scope.form.cleanBindingName = cleanBindingName;
        scope.form.exitEditBinding = exitEditBinding;
        scope.form.addBinding = addBinding;
        scope.form.addDataBinding = addDataBinding;
        scope.form.editDataBinding = editDataBinding;
        scope.form.deleteDataBinding = deleteDataBinding;
        scope.form.addPixelBinding = addPixelBinding;
        scope.form.editPixelBinding = editPixelBinding;
        scope.form.deletePixelBinding = deletePixelBinding;
        scope.form.cleanHTML = cleanHTML;
        scope.form.getGroupHTML = getGroupHTML;
        scope.form.runPixel = runPixel;
        scope.form.updatePixelBinding = updatePixelBinding;
        scope.form.updateDataBinding = updateDataBinding;
        scope.form.getViewFromSource = getViewFromSource;
        scope.form.setOptions = setOptions;
        scope.form.getModelList = getModelList;
        scope.form.navigateHelper = navigateHelper;
        scope.form.setPixelHelper = setPixelHelper;
        scope.form.toggleAutoPopulate = toggleAutoPopulate;
        scope.form.toggleGroupAutoPopulate = toggleGroupAutoPopulate;
        scope.form.toggleUseFullList = toggleUseFullList;
        scope.form.toggleGroupUseFullList = toggleGroupUseFullList;
        scope.form.toggleRequired = toggleRequired;
        scope.form.updatePixelDependency = updatePixelDependency;
        scope.form.updateGroupPixelDependency = updateGroupPixelDependency;
        scope.form.updateFormModel = updateFormModel;
        scope.form.changeComponent = changeComponent;
        scope.form.getMoreInstances = getMoreInstances;
        scope.form.applyTheme = applyTheme;
        scope.form.isEmpty = semossCoreService.utility.isEmpty;

        scope.form.uniqueId = semossCoreService.utility.random();
        scope.form.formBackground = {
            'background-image': '',
            'background-size': '',
            'background-position': '',
            'background-color': '',
            'background-repeat': '',
        };
        scope.form.pixelHelpers = {};
        scope.form.formKeys = [
            '<SMSS_DATA_SELECTED>',
            '<SMSS_DATA_OPTIONS>',
            '<SMSS_CLICK_RUN_PIXEL>',
        ];
        // scope.form.alerts = [];
        // scope.form.alertCounter = 0;
        scope.form.content = {
            items: [],
            selected: false,
        };
        scope.form.showPreview = false;
        scope.form.editSource = false;
        scope.form.customStyles = false;
        scope.form.openDataFields = false;
        scope.form.sourceCode = '';
        scope.form.styleModel = [];
        scope.form.dataVariableList = [];
        scope.form.dataVariableSearch = '';
        scope.form.dataModel = {};
        scope.form.pixelVariableList = [];
        scope.form.pixelModel = {};
        scope.form.variableBinding = {
            show: false,
            type: '',
        };
        scope.form.dataBinding = [];
        scope.form.pixelBinding = [];
        scope.form.showManualOptions = false;
        scope.form.showValuePixel = false;
        scope.form.tempPixel = {
            name: '',
            pixel: '',
            defaultValue: '',
            type: '',
            isNew: true,
            dependsOn: [],
            manualOptions: '',
            valuePixel: '',
            required: true,
            autoPopulate: false,
            useFullList: false,
        };
        scope.form.tempComponent = {};
        scope.form.inputs = {
            data: {
                source: '',
            },
            iframe: {},
            image: {},
            css: {},
            js: {},
            group: [
                {
                    data: '',
                    type: '',
                },
            ],
        };
        scope.form.columns = [];
        scope.form.selectedDataFields = [];

        scope.form.pixelTemplates = {
            list: [
                {
                    name: 'Custom',
                    pixel: '',
                },
                {
                    name: 'Insert Form',
                    pixel:
                        'Database(database=["' +
                        (scope.form.app ? scope.form.app.value : '') +
                        '"]) | Insert(into=[{TABLE}__{COLUMN}], values=[("{VALUE}")]);',
                },
                {
                    name: 'Update Form',
                    pixel:
                        'Database(database=["' +
                        (scope.form.app ? scope.form.app.value : '') +
                        '"]) | Update(columns=[{TABLE}__{COLUMN}], values=[("{VALUE}")]) | Filter(({TABLE}__{COLUMN} == ["{VALUE}"])) | ExecQuery();',
                },
                {
                    name: 'Delete Form',
                    pixel:
                        'Database(database=["' +
                        (scope.form.app ? scope.form.app.value : '') +
                        '"]) | Delete(from=[{TABLE}__{COLUMN}]) | Filter(({TABLE}__{COLUMN} == ["{VALUE}"])) | ExecQuery();',
                },
            ],
            selected: {
                name: 'Custom',
                pixel: '',
            },
        };

        scope.form.themes = {};

        scope.form.styleTemplates = [];
        scope.form.styleCollapsible = [
            {
                display: 'Font Style',
                value: 'font',
                opened: true,
            },
        ];

        scope.form.components = {
            'form-header': {
                id: 'form-header',
                icon: require('images/header.svg'),
                name: 'Header',
                requireInput: true,
                html: `
<h3 smss-form-model="<SMSS_TEXT>">{{item.model}}</h3>
`,
            },
            'form-text': {
                id: 'form-text',
                icon: require('images/string.svg'),
                name: 'Text',
                requireInput: true,
                html: `
<p smss-form-model="<SMSS_TEXT>">{{item.model}}</p>
`,
            },
            'form-input': {
                id: 'form-input',
                icon: require('images/textfield.svg'),
                name: 'Text Field',
                html: `
<smss-input ng-model="item.selected"></smss-input>
`,
            },
            'form-dropdown': {
                id: 'form-dropdown',
                icon: require('images/dropdown.svg'),
                name: 'Dropdown',
                html: `
<smss-dropdown model="item.selected"
    options="item.options"
    placeholder="Select One">
</smss-dropdown>
`,
            },
            'form-single-checklist': {
                id: 'form-single-checklist',
                icon: require('images/single-checklist.svg'),
                name: 'Single Checklist',
                html: `
<smss-checklist options="item.options" style="max-height: 300px; overflow-y: auto;"
    model="item.selected" searchable>
</smss-checklist>
`,
            },
            'form-multi-checklist': {
                id: 'form-multi-checklist',
                icon: require('images/multi-checklist.svg'),
                name: 'Multi Checklist',
                // model is always string to start off with...might need to double check how it'd work with a checklist that expects an array
                html: `
<smss-checklist options="item.options" style="max-height: 300px; overflow-y: auto"
    model="item.selected" searchable multiple quickselect>
</smss-checklist>
`,
            },
            'form-date': {
                id: 'form-date',
                icon: require('images/date.svg'),
                name: 'Date',
                html: `
<smss-date-picker model="item.selected" format="'YYYY-MM-DD'"></smss-date-picker>
`,
            },
            'form-email': {
                id: 'form-email',
                icon: require('images/email.svg'),
                name: 'Email',
                html: '<smss-input ng-model="item.selected" type="email" pattern="^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$"></smss-input>',
            },
            'form-number': {
                id: 'form-number',
                icon: require('images/number.svg'),
                name: 'Number',
                html: `
<smss-input type="number" ng-model="item.selected"></smss-input>
`,
            },
            'form-radio': {
                id: 'form-radio',
                icon: require('images/radio.svg'),
                name: 'Radio',
                html: `
<smss-radio model="item.selected" value="Option1">Option 1</smss-radio>
`,
            },
            'form-slider-numerical': {
                id: 'form-slider-numerical',
                icon: require('images/slider.svg'),
                name: 'Numerical Slider',
                html: `
<smss-slider min="0" max="100" sensitivity="1" model="item.selected" numerical></smss-slider>
`,
            },
            'form-slider-categorical': {
                id: 'form-slider-categorical',
                icon: require('images/slider.svg'),
                name: 'Categorical Slider',
                html: `
<smss-slider model="item.selected" categorical options="item.options"></smss-slider>
`,
            },
            'form-textarea': {
                id: 'form-textarea',
                icon: require('images/textarea.svg'),
                name: 'Text Area',
                html: `
<smss-textarea ng-model="item.selected"></smss-textarea>
`,
            },
            'form-typeahead': {
                id: 'form-typeahead',
                icon: require('images/typeahead.svg'),
                name: 'Type Ahead',
                html: `
<smss-typeahead model="item.selected" options="item.options" placeholder="'Type to Search'">
</smss-typeahead>
`,
            },
            'form-group': {
                id: 'form-group',
                icon: require('images/group.svg'),
                name: 'Field Group',
                html: `
<div smss-form-group ng-init="form.<SMSS_GROUP_MODEL> = {}; form.<SMSS_GROUP_MODEL>.model = [<SMSS_GROUP_DATA>];" smss-form-group-labels="<SMSS_GROUP_LABELS>">
    <div class="form-builder__left__components__vertical-scroll">
        <div ng-repeat="group in form.<SMSS_GROUP_MODEL>.model track by $index" class="form-builder__left__components__vertical-group" style="position: relative">
            <smss-btn ng-if="'<Hidden>'" title="Remove Group" ng-click="form.<SMSS_GROUP_MODEL>.model.splice($index, 1); form.<SMSS_GROUP_MODEL>.original.splice($index, 1)" class="smss-right smss-btn--icon" style="position: absolute; right: 0; top: 0;"><i class="fa fa-times"></i></smss-btn>
            <div ng-repeat="(key, value) in group">
                <div class="smss-text">{{item.group.labels[key]}}</div>
                <div dynamic="form.getGroupHTML(<SMSS_GROUP_MAP>, key, '<SMSS_GROUP_MODEL>.model', $parent.$index)"></div>
            </div>
        </div>
    </div>
    <div class="smss-center"><smss-btn class="smss-btn--text" ng-if="'<Hidden>'" ng-click="form.<SMSS_GROUP_MODEL>.model.push(<SMSS_GROUP_DATA>);">Add Group</smss-btn></div>
</div>
`,
                group: {
                    list: [],
                },
                requireInput: true,
            },
            'form-submit': {
                id: 'form-submit',
                icon: require('images/submit.svg'),
                name: 'Submit',
                html: '<div smss-form-model="<SMSS_TEXT>" class="form-builder__submit"><smss-btn ng-click="form.runPixel(<SMSS_CLICK_RUN_PIXEL>)">{{item.model}}</smss-btn></div>',
                pixel: {
                    Click: {
                        name: '',
                    },
                },
                requireInput: true,
            },
        };

        scope.form.staticComponents = {
            'form-image': {
                id: 'form-image',
                icon: require('images/image.svg'),
                name: 'Image',
                html: '<img width="100%" height="100%" src="<SMSS_SOURCE>">',
                requireInput: true,
            },
            'form-iframe': {
                id: 'form-iframe',
                icon: require('images/iframe.svg'),
                name: 'iFrame',
                html: '<iframe width="100%" height="100%" src="<SMSS_SOURCE>"></iframe>',
                requireInput: true,
            },
            'form-divider': {
                id: 'form-divider',
                icon: require('images/divider.svg'),
                name: 'Divider',
                html: '<hr>',
            },
        };

        scope.form.fileComponents = {
            'form-css': {
                id: 'form-css',
                icon: require('images/css.svg'),
                name: 'CSS',
                html: '',
                requireInput: true,
            },
            'form-js': {
                id: 'form-js',
                icon: require('images/js.svg'),
                name: 'JavaScript',
                html: '',
                requireInput: true,
            },
        };

        scope.form.dataFieldComponents = [
            // will autopopulate
        ];

        scope.form.menu = [
            {
                name: 'Components',
                height: 33,
                components: [
                    scope.form.components['form-header'],
                    scope.form.components['form-text'],
                    scope.form.components['form-input'],
                    scope.form.components['form-number'],
                    scope.form.components['form-date'],
                    // scope.form.components['form-email'],
                    scope.form.components['form-dropdown'],
                    scope.form.components['form-radio'],
                    scope.form.components['form-slider-numerical'],
                    scope.form.components['form-slider-categorical'],
                    scope.form.components['form-textarea'],
                    scope.form.components['form-single-checklist'],
                    scope.form.components['form-multi-checklist'],
                    scope.form.components['form-typeahead'],
                    scope.form.components['form-group'],
                    scope.form.components['form-submit'],
                ],
                search: {},
            },
            {
                name: 'Static Components',
                height: 33,
                components: [
                    scope.form.staticComponents['form-divider'],
                    scope.form.staticComponents['form-image'],
                    scope.form.staticComponents['form-iframe'],
                ],
                search: {},
            },
            {
                name: 'Data Fields',
                height: 33,
                components: [],
                search: {},
            }, // ,
            // {
            //     'name': 'CSS/JS',
            //     'height': 25,
            //     'components': [
            //         scope.form.fileComponents['form-css'],
            //         scope.form.fileComponents['form-js']
            //     ]
            // }
        ];
        scope.form.newComponent = {
            list: scope.form.menu[0].components.slice(
                2,
                scope.form.menu[0].components.length - 2
            ),
            selected: {},
        };

        /** Grouping logic **/
        /**
         * @name getGroupUseFullList
         * @param {array} models the models for this group
         * @desc get the autopopulate value based on all of the models within the group; if one is false--all is false. true if all is true
         * @returns {boolean} the autopopulate boolean
         */
        function getGroupUseFullList(models) {
            var modelIdx,
                useFullList = true;

            for (modelIdx = 0; modelIdx < models.length; modelIdx++) {
                if (!scope.form.dataModel[models[modelIdx]].useFullList) {
                    useFullList = false;
                    break;
                }
            }

            return useFullList;
        }

        /**
         * @name getGroupAutoPopulate
         * @param {array} models the models for this group
         * @desc get the autopopulate value based on all of the models within the group; if one is false--all is false. true if all is true
         * @returns {boolean} the autopopulate boolean
         */
        function getGroupAutoPopulate(models) {
            var modelIdx,
                autoPopulate = true;

            for (modelIdx = 0; modelIdx < models.length; modelIdx++) {
                if (!scope.form.dataModel[models[modelIdx]].autoPopulate) {
                    autoPopulate = false;
                    break;
                }
            }

            return autoPopulate;
        }

        /**
         * @name getGroupDependsOn
         * @param {array} models the models for this group
         * @desc check all of the models for this group for common dependsOn values. ideally they'd be the same ones unless user specifically changed it themselves
         * @returns {array} the array of dependsOn values for the models in the group
         */
        function getGroupDependsOn(models) {
            var dependsOn = [],
                modelIdx,
                dependIdx,
                tempDependsOn;
            for (modelIdx = 0; modelIdx < models.length; modelIdx++) {
                if (modelIdx === 0) {
                    dependsOn = semossCoreService.utility.freeze(
                        scope.form.dataModel[models[modelIdx]].dependsOn
                    );
                } else {
                    tempDependsOn = semossCoreService.utility.freeze(
                        scope.form.dataModel[models[modelIdx]].dependsOn
                    );
                    for (
                        dependIdx = 0;
                        dependIdx < dependsOn.length;
                        dependIdx++
                    ) {
                        if (
                            scope.form.dataModel[
                                models[modelIdx]
                            ].dependsOn.indexOf(dependsOn[dependIdx]) === -1
                        ) {
                            tempDependsOn.splice(
                                tempDependsOn.indexOf(dependsOn[dependIdx]),
                                1
                            );
                        }
                    }

                    dependsOn = semossCoreService.utility.freeze(tempDependsOn);
                }
            }

            return dependsOn;
        }

        /**
         * @name updateGroupModel
         * @param {string} model the model to update
         * @desc loop through the items and see if there are any group components, then set the value to the data model's selected field
         * for cases where autopopulate updates the model that need to be synced back to the grouped components
         * @returns {void}
         */
        function updateGroupModel(model) {
            var itemIdx;

            for (
                itemIdx = 0;
                itemIdx < scope.form.content.items.length;
                itemIdx++
            ) {
                if (
                    scope.form.content.items[itemIdx].group &&
                    scope.form.content.items[itemIdx].group.list &&
                    scope.form.content.items[itemIdx].group.model
                ) {
                    // we only want to set the selected value for items with autoPopulate toggled on
                    if (
                        scope.form.content.items[itemIdx].group.list.indexOf(
                            model
                        ) > -1 &&
                        scope.form.content.items[itemIdx].dependsOn.length ===
                            0 &&
                        scope.form.content.items[itemIdx].autoPopulate
                    ) {
                        semossCoreService.utility.setter(
                            scope,
                            scope.form.content.items[itemIdx].group.model +
                                '.model.0.' +
                                model,
                            scope.form.dataModel[model].selected
                        );
                    }
                }
            }
        }

        /**
         * @name updateGroupPixelDependency
         * @param {number} idx the idx of item to work off of
         * @desc update the dependency for all of the fields bound to this group
         * @returns {void}
         */
        function updateGroupPixelDependency(idx) {
            var groupIdx;

            for (
                groupIdx = 0;
                groupIdx < scope.form.content.items[idx].group.list.length;
                groupIdx++
            ) {
                // sync the dependsOn to the data model
                scope.form.dataModel[
                    scope.form.content.items[idx].group.list[groupIdx]
                ].dependsOn = scope.form.content.items[idx].dependsOn;
                // update the pixel dependency for each individual field in the group
                updatePixelDependency(
                    scope.form.content.items[idx].group.list[groupIdx],
                    scope.form.content.items[idx].dependsOn
                );
                // set the options in case they have changed with the dependency changes
                setOptions(scope.form.content.items[idx].group.list[groupIdx]);
            }
        }

        /**
         * @name getGroupHTML
         * @param {object} groupMap the group map of data to component type
         * @param {string} data the data binding
         * @param {string} groupModel the group model to replace html with
         * @param {number} modelIndex the index of the model to work off of
         * @desc get the cleaned up HTML
         * @returns {string} the html string
         */
        function getGroupHTML(groupMap, data, groupModel, modelIndex) {
            var html = '',
                componentIdx;

            for (
                componentIdx = 0;
                componentIdx < scope.form.newComponent.list.length;
                componentIdx++
            ) {
                if (
                    scope.form.newComponent.list[componentIdx].name ===
                    groupMap[data]
                ) {
                    html = scope.form.newComponent.list[componentIdx].html;
                    html = html.replace(
                        'model="item.selected"',
                        'model="form.' +
                            groupModel +
                            '[' +
                            modelIndex +
                            '][key]"'
                    );
                    html = html.replace(
                        'ng-model="item.selected"',
                        'ng-model="form.' +
                            groupModel +
                            '[' +
                            modelIndex +
                            '][key]"'
                    );
                    html = html.replace(
                        'options="item.options"',
                        'options="form.dataModel[\'' + data + '\'].options"'
                    );
                    break;
                }
            }

            return html;
        }

        /**
         * @name checkGroupings
         * @desc check for groupings in each item since we need special processing for them
         * @returns {void}
         */
        function checkGroupings() {
            var itemIdx,
                groupInfo,
                groupModel,
                returnData = [];
            for (
                itemIdx = 0;
                itemIdx < scope.form.content.items.length;
                itemIdx++
            ) {
                groupInfo = semossCoreService.utility.freeze(
                    scope.form.content.items[itemIdx].group
                );
                if (
                    groupInfo &&
                    groupInfo.list &&
                    groupInfo.list.length > 0 &&
                    groupInfo.model
                ) {
                    groupModel = semossCoreService.utility.getter(
                        scope,
                        groupInfo.model
                    );
                    returnData.push(groupModel);
                }
            }

            return returnData;
        }

        /**
         * @name toggleGroupAutoPopulate
         * @param {number} itemIdx the item to work off of
         * @desc toggle the auto populate for a group, this will toggle the autoPopulate boolean for all the fields bound to the group
         * @returns {void}
         */
        function toggleGroupAutoPopulate(itemIdx) {
            var groupIdx;
            for (
                groupIdx = 0;
                groupIdx < scope.form.content.items[itemIdx].group.list.length;
                groupIdx++
            ) {
                // sync the autoPopulate to the data model
                scope.form.dataModel[
                    scope.form.content.items[itemIdx].group.list[groupIdx]
                ].autoPopulate = scope.form.content.items[itemIdx].autoPopulate;
                // use existing function to do the rest of the logic
                toggleAutoPopulate(
                    scope.form.content.items[itemIdx].group.list[groupIdx]
                );
                // update the values for the group model
                updateGroupModel(
                    scope.form.content.items[itemIdx].group.list[groupIdx]
                );
            }
        }

        /**
         * @name toggleGroupUseFullList
         * @param {number} itemIdx the item to work off of
         * @desc toggle useFullList for a group, this will toggle the useFullList boolean for all the fields bound to the group
         * @returns {void}
         */
        function toggleGroupUseFullList(itemIdx) {
            var groupIdx;
            for (
                groupIdx = 0;
                groupIdx < scope.form.content.items[itemIdx].group.list.length;
                groupIdx++
            ) {
                // sync the useFullList to the data model
                scope.form.dataModel[
                    scope.form.content.items[itemIdx].group.list[groupIdx]
                ].useFullList = scope.form.content.items[itemIdx].useFullList;
                // use existing function to do the rest of the logic
                toggleUseFullList(
                    scope.form.content.items[itemIdx].group.list[groupIdx]
                );
                // update the values for the group model
                // updateGroupModel(scope.form.content.items[itemIdx].group.list[groupIdx]);
            }
        }

        /**
         * @name setGroupData
         * @param {string} model the model to check dependencies for
         * @desc set the group data when auto populate is toggled on for the whole group
         * @returns {void}
         */
        function setGroupData(model) {
            var dependsOn = [],
                groupPixel = '',
                itemIdx,
                emptyModel = {},
                groupListIdx;
            // find the groups that are dependent on model
            for (
                itemIdx = 0;
                itemIdx < scope.form.content.items.length;
                itemIdx++
            ) {
                dependsOn = scope.form.content.items[itemIdx].dependsOn;

                if (
                    dependsOn &&
                    dependsOn.indexOf(model) > -1 &&
                    scope.form.content.items[itemIdx].autoPopulate
                ) {
                    for (
                        groupListIdx = 0;
                        groupListIdx <
                        scope.form.content.items[itemIdx].group.list.length;
                        groupListIdx++
                    ) {
                        // create the emptyModel because we are going to reset the data in the group
                        emptyModel[
                            scope.form.content.items[itemIdx].group.list[
                                groupListIdx
                            ]
                        ] = '';
                    }
                    semossCoreService.utility.setter(
                        scope,
                        scope.form.content.items[itemIdx].group.model +
                            '.model',
                        [emptyModel]
                    );

                    // check the depends on for this group. if all of the dependsOn columns have selected values, we will go on to run the pixel to populate
                    if (isDependsOnFilled(dependsOn)) {
                        groupPixel = getGroupPixel(
                            scope.form.content.items[itemIdx].group.list,
                            dependsOn
                        );

                        if (groupPixel) {
                            // run the groupPixel and then set the data to the group
                            scope.widgetCtrl.meta(
                                [
                                    {
                                        meta: true,
                                        type: 'Pixel',
                                        components: [groupPixel],
                                        terminal: true,
                                    },
                                ],
                                _setData.bind(null, itemIdx)
                            );
                        }
                    }
                }
            }
            // $timeout();
            function _setData(idx, response) {
                var output = response.pixelReturn[0].output;
                if (output.data) {
                    processGroupData(
                        output.data,
                        scope.form.content.items[idx].group.model
                    );
                }
            }
        }

        /**
         * @name processGroupData
         * @param {object} data the data we want to use to set the group
         * @param {string} groupModel the group model to populate
         * @desc process the data returned from the BE for the group and set it to the group model
         * @returns {void}
         */
        function processGroupData(data, groupModel) {
            var headers = data.headers,
                values = data.values,
                model = [],
                headerIdx,
                valueIdx,
                tempObj = {};
            for (valueIdx = 0; valueIdx < values.length; valueIdx++) {
                tempObj = {};
                for (headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                    tempObj[headers[headerIdx]] = values[valueIdx][headerIdx];
                }

                model.push(tempObj);
            }
            semossCoreService.utility.setter(
                scope,
                groupModel + '.model',
                semossCoreService.utility.freeze(model)
            );
            semossCoreService.utility.setter(
                scope,
                groupModel + '.original',
                semossCoreService.utility.freeze(model)
            );
        }

        /**
         * @name getGroupPixel
         * @param {array} models the models to set as selectors
         * @param {array} dependsOn the dependencies to set as filters
         * @returns {string} the pixel string
         */
        function getGroupPixel(models, dependsOn) {
            var pixelComponents = [],
                pixel = '',
                modelIdx,
                selectors = [],
                dependIdx,
                filterObj = {};

            for (modelIdx = 0; modelIdx < models.length; modelIdx++) {
                if (pixelComponents.length === 0) {
                    pixelComponents.push({
                        type: 'database',
                        components: [scope.form.app.value],
                        terminal: false,
                    });
                }

                selectors.push({
                    selector:
                        scope.form.dataModel[models[modelIdx]].config.table +
                        '__' +
                        models[modelIdx],
                    alias: models[modelIdx],
                });
            }

            if (selectors.length > 0) {
                pixelComponents.push({
                    type: 'select2',
                    components: [selectors],
                    terminal: false,
                });

                if (dependsOn.length > 0) {
                    for (
                        dependIdx = 0;
                        dependIdx < dependsOn.length;
                        dependIdx++
                    ) {
                        filterObj[
                            scope.form.dataModel[dependsOn[dependIdx]].config
                                .table +
                                '__' +
                                dependsOn[dependIdx]
                        ] = {
                            comparator: '==',
                            value: scope.form.dataModel[dependsOn[dependIdx]]
                                .selected,
                        };
                    }
                    pixelComponents.push({
                        type: 'filter',
                        components: [filterObj],
                        terminal: false,
                    });
                }

                pixelComponents.push({
                    type: 'collect',
                    components: [-1],
                    terminal: true,
                });
            }

            if (pixelComponents.length > 0) {
                pixel = semossCoreService.pixel.build(pixelComponents);
            }

            return pixel;
        }

        /**
         * @name getGroupingData
         * @param {object} attributes the attributes to look through
         * @desc look through the attributes and manipulate to original form and then find & return the models that are bound to the fields
         * @returns {array} the array of the bound fields
         */
        function getGroupingData(attributes) {
            var attrIdx, groupingData;

            // TODO maybe shouldn't require the smss-form-group to be first attr?
            if (
                attributes &&
                attributes.length > 1 &&
                attributes[0].name === 'smss-form-group'
            ) {
                for (attrIdx = 0; attrIdx < attributes.length; attrIdx++) {
                    if (
                        attributes[attrIdx].name === 'ng-init' ||
                        attributes[attrIdx].name === 'smss-form-group-labels'
                    ) {
                        if (!groupingData) {
                            groupingData = {
                                list: [],
                                model: [],
                                labels: {},
                            };
                        }

                        if (attributes[attrIdx].name === 'ng-init') {
                            // we just want to grab the value that's being set...convert single quotes to escaped double for proper parsing using JSON.parse
                            groupingData.list = Object.keys(
                                JSON.parse(
                                    attributes[attrIdx].value
                                        .replace(
                                            /form.multiGroup[\w\s]+\s*=\s*{}/,
                                            ''
                                        )
                                        .replace(
                                            /form.multiGroup[\w\s]+.model\s*=/,
                                            ''
                                        )
                                        .replace(/;/g, '')
                                        .replace(/'/g, '"')
                                        .trim()
                                )[0]
                            );
                            groupingData.model = attributes[attrIdx].value
                                .replace(/[=]\s*[\s\S]+;/, '')
                                .trim();
                        }

                        // set the label mapping
                        if (
                            attributes[attrIdx].name ===
                            'smss-form-group-labels'
                        ) {
                            groupingData.labels = JSON.parse(
                                attributes[attrIdx].value.replace(/'/g, '"')
                            );
                        }
                    }
                }
            }

            return groupingData;
        }

        /** Actions **/
        /**
         * @name applyTheme
         * @param {string} themeName the name of the theme to apply
         * @desc apply the selected theme
         * @returns {void}
         */
        function applyTheme(themeName) {
            var source = getSourceFromModel(),
                themeStyle,
                currentStyle;
            scope.form.sourceCode = source;

            currentStyle = getStyleContent(source);
            themeStyle = scope.form.themes.list[themeName].style;
            scope.form.themes.selected = themeName;
            // for default, we revert our styles back to normal; no need to save this style.
            if (themeName === 'Blank') {
                ele[0].querySelector('style')
                    ? ele[0].querySelector('style').remove()
                    : '';
                themeStyle = '';
            } else if (ele[0].querySelector('style')) {
                // remove old style and then add new style in getViewFromSource
                ele[0].querySelector('style').remove();
            }
            // remove any existing styles
            if (currentStyle) {
                scope.form.sourceCode = scope.form.sourceCode.replace(
                    currentStyle,
                    themeStyle
                );
            } else {
                // override the style with the theme styles
                scope.form.sourceCode = themeStyle + scope.form.sourceCode;
            }
            // set the theme style to scope to be picked up next time we create the src
            getViewFromSource();
            // invalidate the manual background by resetting the background styles. we want the theme to override any background set manually.
            scope.form.formBackground = {
                'background-image': '',
                'background-size': '',
                'background-position': '',
                'background-color': '',
                'background-repeat': '',
            };
        }

        /**
         * @name addComponent
         * @desc add a new widget
         * @param {object} component - component to add
         * @param {number} componentIdx - the index to insert the component
         * @param {number} draggedIdx the index that was dragged to be removed
         * @returns {void}
         */
        function addComponent(component, componentIdx, draggedIdx) {
            var id,
                item,
                newIdx = componentIdx,
                labelComponent;

            if (draggedIdx === 0 || draggedIdx) {
                // reuse existing unique id
                id = component.id;
            } else {
                counter++;
                if (component.id) {
                    id = component.id + '' + counter;
                } else {
                    id = '' + counter;
                }
            }

            if (component.requireInput) {
                scope.form.inputs.data.source = '';
                scope.form.tempComponent =
                    semossCoreService.utility.freeze(component);
                scope.form.tempComponent.newIdx = newIdx;
                scope.form.tempComponent.id = id;
                scope.form.openInput = true;

                if (component.dataType) {
                    if (component.dataType === 'STRING') {
                        scope.form.inputs.data.source =
                            scope.form.components['form-input'];
                    } else if (component.dataType === 'NUMBER') {
                        scope.form.inputs.data.source =
                            scope.form.components['form-number'];
                    }
                    // else if (component.dataType === 'DATE') {

                    // }
                }
                return;
            }

            // coming from data-fields so lets add the label for it
            if (component.id && component.id.indexOf('data-field') > -1) {
                labelComponent = semossCoreService.utility.freeze(
                    scope.form.components['form-text']
                );
                labelComponent.requireInput = false;
                labelComponent.html = labelComponent.html.replace(
                    '<SMSS_TEXT>',
                    component.name + ':'
                );
                labelComponent.model = component.name + ':';
                addComponent(labelComponent, newIdx);
                newIdx += 1;
            }

            item = {
                id: id,
                group: component.group,
                html: component.html,
                style: component.style || {},
                class: component.class || '',
                data: semossCoreService.utility.freeze(component.data),
                pixel: semossCoreService.utility.freeze(component.pixel),
                selected: '',
                options: [], // used for item.options in the html for a default model
            };

            if (component.group && component.group.list) {
                // we found a group--now lets check its auto populate and dependsOn fields
                item.autoPopulate = getGroupAutoPopulate(component.group.list);
                item.dependsOn = getGroupDependsOn(component.group.list);
                item.useFullList = getGroupUseFullList(component.group.list);
            }

            if (component.model) {
                item.model = component.model;
            }

            if (draggedIdx !== false && draggedIdx < newIdx) {
                newIdx--;
            }

            // add to specific index
            scope.form.content.items.splice(newIdx, 0, item);

            // remove the item dragged and then add them into position after
            if (draggedIdx === 0 || draggedIdx) {
                scope.form.dataBinding.splice(draggedIdx, 1);
                scope.form.styleModel.splice(draggedIdx, 1);
                scope.form.pixelBinding.splice(draggedIdx, 1);
            }

            // refreshView();
            scope.form.styleModel.splice(newIdx, 0, []);

            scope.form.dataBinding.splice(newIdx, 0, {
                name: component.data ? component.data : '',
            });

            scope.form.pixelBinding.splice(
                newIdx,
                0,
                semossCoreService.utility.isEmpty(component.pixel)
                    ? {}
                    : component.pixel
            );
            scope.form.content.selected = newIdx;
            scope.form.newComponent.selected = findComponent(
                scope.form.content.items[scope.form.content.selected].html
            );

            updateDataBinding(scope.form.content.selected);
            resetStyleTemplates();
            // timeout this so init runs first and then we update the model
            $timeout(function () {
                if (component.group && component.group.list) {
                    for (var i = 0; i < component.group.list.length; i++) {
                        updateGroupModel(component.group.list[i]);
                    }
                }
            });
        }

        /**
         * @name addMultiComponents
         * @param {*} components all the components to add in order
         * @desc add multiple components at once
         * @returns {void}
         */
        function addMultiComponents(components) {
            // loop through each component and add one by one
            var componentIdx;

            for (
                componentIdx = 0;
                componentIdx < components.length;
                componentIdx++
            ) {
                addComponent(
                    components[componentIdx],
                    scope.form.content.items.length
                );
            }

            scope.form.selectedDataFields = [];
            scope.form.openDataFields = false;
        }

        /**
         * @name processInput
         * @desc process the input and setup the html correctly
         * @returns {void}
         */
        function processInput() {
            var tempComponent = semossCoreService.utility.freeze(
                    scope.form.tempComponent
                ),
                idx,
                groupIdx,
                selectedOption,
                selectedListItem,
                itemIdx,
                tempPixel,
                valid = true,
                groupData = {},
                groupArr = [],
                groupLabels = {},
                groupMap = {},
                labelComponent;
            if (tempComponent.id.indexOf('form-iframe') > -1) {
                if (scope.form.inputs.data.source) {
                    tempComponent.html = tempComponent.html.replace(
                        '<SMSS_SOURCE>',
                        scope.form.inputs.data.source
                    );
                } else {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'A source location is required prior to proceeding.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                    return;
                }
            } else if (tempComponent.id.indexOf('form-image') > -1) {
                if (scope.form.inputs.data.source) {
                    tempComponent.html = tempComponent.html.replace(
                        '<SMSS_SOURCE>',
                        scope.form.inputs.data.source
                    );
                } else {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'A source location is required prior to proceeding.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                    return;
                }
            } else if (tempComponent.id.indexOf('data-field') > -1) {
                labelComponent = semossCoreService.utility.freeze(
                    scope.form.components['form-text']
                );
                if (scope.form.inputs.data.source) {
                    tempComponent.html += scope.form.inputs.data.source.html;

                    tempComponent.data = tempComponent.name;

                    // lets automatically add the label by processing the component
                    labelComponent.requireInput = false;
                    labelComponent.html = labelComponent.html.replace(
                        '<SMSS_TEXT>',
                        tempComponent.name + ':'
                    );
                    labelComponent.model = tempComponent.name + ':';
                    addComponent(labelComponent, tempComponent.newIdx);
                    tempComponent.newIdx += 1;
                } else {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'A field type must be selected prior to proceeding.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                    return;
                }
            } else if (tempComponent.id.indexOf('form-css') > -1) {
                console.log(
                    'css loading ' + scope.form.inputs.data.source + ' here'
                );
                closeInput();
                return;
            } else if (
                tempComponent.id.indexOf('form-text') > -1 ||
                tempComponent.id.indexOf('form-header') > -1
            ) {
                if (scope.form.inputs.data.source) {
                    tempComponent.html = tempComponent.html.replace(
                        '<SMSS_TEXT>',
                        scope.form.inputs.data.source
                    );
                    tempComponent.model = scope.form.inputs.data.source;

                    // TODO we should look for ALL classes at the PARENT level. but for now we can look for this specific one
                    if (tempComponent.html.indexOf('class="smss-text"') > -1) {
                        tempComponent.html = tempComponent.html.replace(
                            'class="smss-text"',
                            ''
                        );
                        // add to the class list
                        tempComponent.class = 'smss-text';
                    }
                } else {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'Text is required prior to proceeding.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                    return;
                }
            } else if (tempComponent.id.indexOf('form-submit') > -1) {
                selectedOption = scope.form.pixelHelpers.selected;
                selectedListItem =
                    scope.form.pixelHelpers.options[selectedOption].selected;
                tempPixel =
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].pixel;

                if (
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].name === 'Custom'
                ) {
                    if (
                        !scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].model[0].pixel ||
                        !scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].model[0].name
                    ) {
                        valid = false;
                    }
                } else {
                    for (
                        idx = 0;
                        idx <
                        scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].model.length;
                        idx++
                    ) {
                        if (
                            semossCoreService.utility.isEmpty(
                                scope.form.pixelHelpers.options[selectedOption]
                                    .list[selectedListItem].model[idx].selected
                            )
                        ) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (!valid) {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'All required fields must be filled before proceeding.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                    return;
                }

                tempPixel = _cleanPixel(tempPixel);
                tempComponent.model = 'Submit';
                tempComponent.html = tempComponent.html.replace(
                    '<SMSS_TEXT>',
                    'Submit'
                );
            } else if (tempComponent.id.indexOf('form-group') > -1) {
                if (scope.form.inputs.group.length === 0) {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'All required fields must be filled before proceeding.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                } else {
                    for (
                        groupIdx = 0;
                        groupIdx < scope.form.inputs.group.length;
                        groupIdx++
                    ) {
                        if (
                            !scope.form.inputs.group[groupIdx].data.name ||
                            !scope.form.inputs.group[groupIdx].type.name
                        ) {
                            semossCoreService.emit('alert', {
                                color: 'warn',
                                text: 'All required fields must be filled before proceeding.',
                                insightID: scope.widgetCtrl
                                    ? scope.widgetCtrl.insightID
                                    : undefined,
                            });
                            return;
                        }
                        groupData[scope.form.inputs.group[groupIdx].data.name] =
                            '';
                        groupArr.push(
                            scope.form.inputs.group[groupIdx].data.name
                        );
                        groupMap[scope.form.inputs.group[groupIdx].data.name] =
                            scope.form.inputs.group[groupIdx].type.name;
                        groupLabels[
                            scope.form.inputs.group[groupIdx].data.name
                        ] = scope.form.inputs.group[groupIdx].label;
                    }

                    tempComponent.html = tempComponent.html.replace(
                        /<SMSS_GROUP_DATA>/g,
                        JSON.stringify(groupData).replace(/"/g, "'")
                    );
                    tempComponent.html = tempComponent.html.replace(
                        /<SMSS_GROUP_MODEL>/g,
                        'multiGroup' + groupCounter
                    );
                    tempComponent.html = tempComponent.html.replace(
                        /<SMSS_GROUP_MAP>/g,
                        JSON.stringify(groupMap).replace(/"/g, "'")
                    );
                    tempComponent.html = tempComponent.html.replace(
                        /<SMSS_GROUP_LABELS>/g,
                        JSON.stringify(groupLabels).replace(/"/g, "'")
                    );
                    tempComponent.group.list = groupArr;
                    tempComponent.group.model =
                        'form.multiGroup' + groupCounter;
                    tempComponent.group.labels = groupLabels;
                    groupCounter++;
                }
            }
            tempComponent.requireInput = false;

            addComponent(tempComponent, tempComponent.newIdx);

            // perform the below only after addComponent has been run because we are depending on the logic in there to continue the process
            if (tempComponent.id.indexOf('form-submit') > -1) {
                addPixelBinding({
                    name: scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].model[0].name,
                    pixel: tempPixel,
                });

                scope.form.pixelBinding[
                    scope.form.content.selected
                ].Click.name =
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].model[0].name;

                updatePixelBinding('Click');

                // for Update and Delete we need to adjust the html so that it hides the "Add Group" and "X" buttons
                for (
                    itemIdx = 0;
                    itemIdx < scope.form.content.items.length;
                    itemIdx++
                ) {
                    if (
                        scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].model[0].name === 'Update'
                    ) {
                        scope.form.content.items[itemIdx].html =
                            scope.form.content.items[itemIdx].html.replace(
                                /'<Hidden>'/g,
                                'false'
                            );
                    } else {
                        scope.form.content.items[itemIdx].html =
                            scope.form.content.items[itemIdx].html.replace(
                                /'<Hidden>'/g,
                                'true'
                            );
                    }
                }
            }
            closeInput();

            /**
             * @name _cleanPixel
             * @param {string} pixel the pixel to clean up
             * @desc replace any values in the pixel and return it
             * @returns {string} the cleaned pixel
             */
            function _cleanPixel(pixel) {
                var helperData,
                    pixelComponent = '',
                    pixelComponentSelected,
                    selectedIdx,
                    returnPixel = pixel;

                // TODO check for edge cases where formats might be different. if so, check for the specific helperData key to perform custom logic
                for (helperData in scope.form.pixelHelpers.options[
                    selectedOption
                ].list[selectedListItem].data) {
                    if (
                        scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].data.hasOwnProperty(helperData)
                    ) {
                        pixelComponent = '';
                        pixelComponentSelected =
                            semossCoreService.utility.getter(
                                scope.form.pixelHelpers,
                                scope.form.pixelHelpers.options[selectedOption]
                                    .list[selectedListItem].data[helperData]
                            );
                        if (helperData === '<SMSS_FORM_FILTER>') {
                            for (
                                selectedIdx = 0;
                                selectedIdx < pixelComponentSelected.length;
                                selectedIdx++
                            ) {
                                // TODO set it to the <name.original> here once it's setup
                                pixelComponent +=
                                    '(' +
                                    scope.form.table +
                                    '__' +
                                    pixelComponentSelected[selectedIdx].name +
                                    ' == <' +
                                    pixelComponentSelected[selectedIdx].name;
                                if (
                                    scope.form.pixelHelpers.options[
                                        selectedOption
                                    ].list[selectedListItem].name === 'Update'
                                ) {
                                    // we want to go through the original if it's Update. Delete will just delete whatever value is shown on the view.
                                    pixelComponent += '.original';
                                }

                                pixelComponent += '>)';
                                if (
                                    selectedIdx !==
                                    pixelComponentSelected.length - 1
                                ) {
                                    pixelComponent += ', ';
                                }
                            }
                            returnPixel = returnPixel.replace(
                                helperData,
                                pixelComponent
                            );
                        } else if (helperData === '<SMSS_FORM_PARAM>') {
                            for (
                                selectedIdx = 0;
                                selectedIdx < pixelComponentSelected.length;
                                selectedIdx++
                            ) {
                                pixelComponent +=
                                    '(<' +
                                    pixelComponentSelected[selectedIdx].name +
                                    '>)';
                                if (
                                    selectedIdx !==
                                    pixelComponentSelected.length - 1
                                ) {
                                    pixelComponent += ', ';
                                }
                            }
                            returnPixel = returnPixel.replace(
                                helperData,
                                pixelComponent
                            );
                        } else if (
                            helperData === '<SMSS_FORM_COLUMN>' &&
                            Array.isArray(pixelComponentSelected)
                        ) {
                            for (
                                selectedIdx = 0;
                                selectedIdx < pixelComponentSelected.length;
                                selectedIdx++
                            ) {
                                pixelComponent +=
                                    scope.form.table +
                                    '__' +
                                    pixelComponentSelected[selectedIdx].name;
                                if (
                                    selectedIdx !==
                                    pixelComponentSelected.length - 1
                                ) {
                                    pixelComponent += ', ';
                                }
                            }
                            returnPixel = returnPixel.replace(
                                helperData,
                                pixelComponent
                            );
                        } else if (
                            helperData === '<SMSS_PARAM>' &&
                            Array.isArray(pixelComponentSelected)
                        ) {
                            for (
                                selectedIdx = 0;
                                selectedIdx < pixelComponentSelected.length;
                                selectedIdx++
                            ) {
                                pixelComponent +=
                                    '<' +
                                    pixelComponentSelected[selectedIdx].name +
                                    '>';
                                if (
                                    selectedIdx !==
                                    pixelComponentSelected.length - 1
                                ) {
                                    pixelComponent += ', ';
                                }
                            }
                            returnPixel = returnPixel.replace(
                                helperData,
                                pixelComponent
                            );
                        } else {
                            returnPixel = returnPixel.replace(
                                helperData,
                                pixelComponentSelected
                            );
                        }
                    }
                }

                return returnPixel;
            }
        }

        /**
         * @name closeInput
         * @desc close the input overlay
         * @returns {void}
         */
        function closeInput() {
            scope.form.openInput = false;
            scope.form.tempComponent = {};
            scope.form.inputs.data = {};
            scope.form.inputs.image = {};
            scope.form.inputs.iframe = {};
            scope.form.inputs.css = {};
            scope.form.inputs.js = {};
            scope.form.inputs.group = [
                {
                    data: '',
                    type: '',
                },
            ];
            // scope.form.inputs.submit = {};
            // scope.form.inputs = {
            //     image: {},
            //     css: {},
            //     js: {},
            //     submit: {}
            // };
        }

        /**
         * @name findComponent
         * @param {string} html the html to parse through
         * @desc find the component that matches this html
         * @returns {object} the component that matches this html
         */
        function findComponent(html) {
            var component = {};
            if (
                html.trim().search(/^<smss-dropdown[\s\S]*<\/smss-dropdown>$/) >
                -1
            ) {
                // dropdown found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-dropdown']
                );
            } else if (
                html
                    .trim()
                    .search(
                        /^<smss-input type="number"[\s\S]*<\/smss-input>$/
                    ) > -1
            ) {
                // number found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-number']
                );
            } else if (
                html.trim().search(/^<smss-input[\s\S]*<\/smss-input>$/) > -1
            ) {
                // input found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-input']
                );
            } else if (
                html
                    .trim()
                    .search(
                        /^<smss-checklist[\s\S]*(multiple)[\s\S]*<\/smss-checklist>$/
                    ) > -1
            ) {
                // multi checklist found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-multi-checklist']
                );
            } else if (
                html
                    .trim()
                    .search(/^<smss-checklist[\s\S]*<\/smss-checklist>$/) > -1
            ) {
                // single checklist found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-single-checklist']
                );
            } else if (
                html
                    .trim()
                    .search(/^<smss-date-picker[\s\S]*<\/smss-date-picker>$/) >
                -1
            ) {
                // date found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-date']
                );
            } else if (
                html.trim().search(/^<smss-radio[\s\S]*<\/smss-radio>$/) > -1
            ) {
                // radio found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-radio']
                );
            } else if (
                html
                    .trim()
                    .search(
                        /^<smss-slider[\s\S]+numerical[\s\S]*<\/smss-slider>$/
                    ) > -1
            ) {
                // slider found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-slider-numerical']
                );
            } else if (
                html
                    .trim()
                    .search(
                        /^<smss-slider[\s\S]+categorical[\s\S]*<\/smss-slider>$/
                    ) > -1
            ) {
                // slider found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-slider-categorical']
                );
            } else if (
                html.trim().search(/^<smss-textarea[\s\S]*<\/smss-textarea>$/) >
                -1
            ) {
                // textarea found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-textarea']
                );
            } else if (
                html
                    .trim()
                    .search(/^<smss-typeahead[\s\S]*<\/smss-typeahead>$/) > -1
            ) {
                // textarea found
                component = semossCoreService.utility.freeze(
                    scope.form.components['form-typeahead']
                );
            }

            return component;
        }

        /**
         * @name changeComponent
         * @param {number} idx the idx of component to change
         * @param {object} newComponent the new component to change to
         * @desc change the component type
         * @returns {void}
         */
        function changeComponent(idx, newComponent) {
            var tempComponent = semossCoreService.utility.freeze(
                scope.form.content.items[idx]
            );

            tempComponent.html = newComponent.html;
            scope.form.content.items[idx] = tempComponent;
            scope.form.updateDataBinding(idx);
        }

        /**
         * @name selectComponent
         * @param {string} idx - index of the component
         * @desc select the widget
         * @returns {void}
         */
        function selectComponent(idx) {
            scope.form.content.selected = idx;
            setDependList();
            resetStyleTemplates();
            // set the component type
            scope.form.newComponent.selected = findComponent(
                scope.form.content.items[idx].html
            );
        }

        /**
         * @name removeComponent
         * @param {string} id - id of the component
         * @desc remove the widget
         * @returns {void}
         */
        function removeComponent(id) {
            var groupListIdx, model;
            // reset somet values; auto populate and dependsOn
            if (scope.form.content.items[id].data) {
                if (
                    scope.form.dataModel[scope.form.content.items[id].data]
                        .autoPopulate
                ) {
                    scope.form.dataModel[
                        scope.form.content.items[id].data
                    ].autoPopulate = false;
                    toggleAutoPopulate(scope.form.content.items[id].data);
                }

                if (
                    scope.form.dataModel[scope.form.content.items[id].data]
                        .dependsOn.length > 0
                ) {
                    scope.form.dataModel[
                        scope.form.content.items[id].data
                    ].dependsOn = [];
                    updatePixelDependency(
                        scope.form.content.items[id].data,
                        []
                    );
                    setOptions(scope.form.content.items[id].data);
                }

                if (
                    !scope.form.dataModel[scope.form.content.items[id].data]
                        .useFullList
                ) {
                    scope.form.dataModel[
                        scope.form.content.items[id].data
                    ].useFullList = false;
                    toggleUseFullList(scope.form.content.items[id].data);
                }

                // remove the dependency from other models
                for (model in scope.form.dataModel) {
                    if (scope.form.dataModel.hasOwnProperty(model)) {
                        if (
                            scope.form.dataModel[model].dependsOn.indexOf(
                                scope.form.content.items[id].data
                            ) > -1
                        ) {
                            // found one...so lets remove it from the dependency
                            scope.form.dataModel[model].dependsOn.splice(
                                scope.form.dataModel[model].dependsOn.indexOf(
                                    scope.form.content.items[id].data
                                ),
                                1
                            );
                            updatePixelDependency(
                                model,
                                scope.form.dataModel[model].dependsOn
                            );
                            setOptions(model);
                        }
                    }
                }
            }

            // reset the values for any group components too
            if (
                scope.form.content.items[id].group &&
                scope.form.content.items[id].group.list
            ) {
                for (
                    groupListIdx = 0;
                    groupListIdx <
                    scope.form.content.items[id].group.list.length;
                    groupListIdx++
                ) {
                    if (
                        scope.form.dataModel[
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        ].autoPopulate
                    ) {
                        scope.form.dataModel[
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        ].autoPopulate = false;
                        toggleAutoPopulate(
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        );
                    }

                    if (
                        scope.form.dataModel[
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        ].dependsOn.length > 0
                    ) {
                        scope.form.dataModel[
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        ].dependsOn = [];
                        updatePixelDependency(
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ],
                            []
                        );
                        setOptions(
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        );
                    }

                    if (
                        !scope.form.dataModel[
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        ].useFullList
                    ) {
                        scope.form.dataModel[
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        ].useFullList = false;
                        toggleUseFullList(
                            scope.form.content.items[id].group.list[
                                groupListIdx
                            ]
                        );
                    }
                }
            }
            // delete the reference
            scope.form.content.items.splice(id, 1);
            scope.form.styleModel.splice(id, 1);
            scope.form.dataBinding.splice(id, 1);
            scope.form.pixelBinding.splice(id, 1);

            // select nothing
            scope.form.content.selected = scope.form.content.items.length - 1;
            if (scope.form.content.selected > -1) {
                scope.form.newComponent.selected = findComponent(
                    scope.form.content.items[scope.form.content.selected].html
                );
            } else {
                scope.form.newComponent.selected = {};
            }
            resetStyleTemplates();
        }

        /**
         * @name exitEditBinding
         * @desc get out of binding edit/add step
         * @returns {void}
         */
        function exitEditBinding() {
            scope.form.tempPixel.type = '';
            scope.form.tempPixel.isNew = true;
            scope.form.tempPixel.pixel = '';
            scope.form.tempPixel.name = '';
            scope.form.tempPixel.manualOptions = '';
            scope.form.tempPixel.defaultValue = '';
            scope.form.tempPixel.dependsOn = [];
            scope.form.tempPixel.valuePixel = '';
            scope.form.tempPixel.required = true;
            scope.form.tempPixel.autoPopulate = false;
            scope.form.tempPixel.useFullList = false;
        }

        /**
         * @name addBinding
         * @param {object} binding the binding to set
         * @desc routes to the appropriate add function
         * @returns {void}
         */
        function addBinding(binding) {
            let warnMessage = '';

            if (!binding.name) {
                warnMessage =
                    'A variable name is required. Please enter a name.';
            }

            if (!scope.form.showManualOptions && !binding.pixel) {
                warnMessage =
                    'A pixel script is required. Please enter a pixel script.';
            }

            if (scope.form.showManualOptions && !binding.manualOptions) {
                warnMessage =
                    'Manual options are required. Please enter manual options.';
            }

            if (warnMessage) {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: warnMessage,
                    insightID: scope.widgetCtrl
                        ? scope.widgetCtrl.insightID
                        : undefined,
                });

                return;
            }

            if (scope.form.tempPixel.type === 'pixel') {
                addPixelBinding(binding);
            } else if (scope.form.tempPixel.type === 'data') {
                addDataBinding([binding], true);
            }
        }

        /**
         * @name cleanBindingName
         * @param {object} bindingObj the binding object to manipulate
         * @desc clean the binding name so that it's a valid key in the object
         * @returns {void}
         */
        function cleanBindingName(bindingObj) {
            if (bindingObj.name.indexOf(' ') > -1) {
                // replace the spaces
                bindingObj.name = bindingObj.name.replace(/ /g, '_');
            }

            // might need additional rules like, cant start with a number, some special characters, etc.
        }

        /**
         * @name addPixelBinding
         * @param {object} pixelObj the pixel to add as binding
         * @desc add a new pixel variable to be bound
         * @returns {void}
         */
        function addPixelBinding(pixelObj) {
            var pixelVariable = {},
                pixel = pixelObj.pixel,
                name = pixelObj.name;

            if (!pixel) {
                return;
            }

            /**
             * @name _addPixelVariable
             * @param {object} pixelObject the pixel object to add
             * @desc add to the pixel variable list & make sure its unique
             * @returns {void}
             */
            function _addPixelVariable(pixelObject) {
                var existingIdx = -1,
                    i;

                for (i = 0; i < scope.form.pixelVariableList.length; i++) {
                    if (scope.form.pixelVariableList[i].name === name) {
                        existingIdx = i;
                        break;
                    }
                }

                if (existingIdx > -1) {
                    scope.form.pixelVariableList[existingIdx] = pixelObject;
                } else {
                    scope.form.pixelVariableList.push(pixelObject);
                }
            }

            pixelVariable.name = name;
            pixelVariable.pixel = pixel;
            _addPixelVariable(pixelVariable);
            scope.form.pixelModel[pixelVariable.name] = {
                name: name,
                pixel: pixel,
            };

            scope.form.tempPixel.type = '';
            scope.form.tempPixel.name = '';
            scope.form.tempPixel.pixel = '';
            scope.form.tempPixel.defaultValue = '';
            scope.form.tempPixel.manualOptions = '';
            scope.form.tempPixel.dependsOn = [];
            scope.form.tempPixel.valuePixel = '';
            scope.form.tempPixel.required = true;
            scope.form.tempPixel.autoPopulate = false;
            scope.form.tempPixel.useFullList = false;
        }

        /**
         * @name editPixelBinding
         * @param {*} pixelBinding the data binding
         * @desc edit an existing pixel variable
         * @returns {void}
         */
        function editPixelBinding(pixelBinding) {
            scope.form.tempPixel = {
                name: pixelBinding.name,
                pixel: pixelBinding.pixel,
                valuePixel: pixelBinding.valuePixel,
                manualOptions: pixelBinding.manualOptions,
                defaultValue: pixelBinding.defaultValue,
                type: 'pixel',
                isNew: false,
                dependsOn: pixelBinding.dependsOn,
                required: pixelBinding.required,
                autoPopulate: pixelBinding.autoPopulate,
                useFullList: pixelBinding.useFullList,
            };
        }

        /**
         * @name deletePixelBinding
         * @param {*} pixelBinding the data binding
         * @desc edit an existing pixel variable
         * @returns {void}
         */
        function deletePixelBinding(pixelBinding) {
            var idx;

            // delete from varlist
            for (idx = 0; scope.form.pixelVariableList.length; idx++) {
                if (
                    scope.form.pixelVariableList[idx].name === pixelBinding.name
                ) {
                    scope.form.pixelVariableList.splice(idx, 1);
                    break;
                }
            }
            // delete from model
            delete scope.form.pixelModel[pixelBinding.name];
        }

        /**
         * @name deleteDataBinding
         * @param {*} dataBinding the data binding
         * @desc delete a specific data binding variable
         * @returns {void}
         */
        function deleteDataBinding(dataBinding) {
            var idx, model, bindingIdx, dataFieldIdx;

            // delete from varlist
            for (idx = 0; scope.form.dataVariableList.length; idx++) {
                if (
                    scope.form.dataVariableList[idx].name === dataBinding.name
                ) {
                    scope.form.dataVariableList.splice(idx, 1);
                    break;
                }

                // remove from any dependsOn
                if (
                    scope.form.dataVariableList[idx].dependsOn.indexOf(
                        dataBinding.name
                    ) > -1
                ) {
                    scope.form.dataVariableList[idx].dependsOn.splice(
                        scope.form.dataVariableList[idx].dependsOn.indexOf(
                            dataBinding.name
                        ),
                        1
                    );
                }
            }

            // remove from data model's dependsOn's
            for (model in scope.form.dataModel) {
                if (
                    scope.form.dataModel.hasOwnProperty(model) &&
                    scope.form.dataModel[model].dependsOn.indexOf(
                        dataBinding.name
                    ) > -1
                ) {
                    scope.form.dataModel[model].dependsOn.splice(
                        scope.form.dataModel[model].dependsOn.indexOf(
                            dataBinding.name
                        ),
                        1
                    );
                    // refresh this model since its dependencies have changed.
                    setOptions(model);
                }
            }

            // look through data binding and wipe the deleted variable
            for (
                bindingIdx = 0;
                bindingIdx < scope.form.dataBinding.length;
                bindingIdx++
            ) {
                if (
                    scope.form.dataBinding[bindingIdx].name === dataBinding.name
                ) {
                    scope.form.dataBinding[bindingIdx].name = '';
                    // update additional values upon changing of the dataBinding value
                    // this function will also revert the html back to when its without any variable binding
                    updateDataBinding(bindingIdx);
                    break;
                }
            }

            for (
                dataFieldIdx = 0;
                dataFieldIdx < scope.form.dataFieldComponents.length;
                dataFieldIdx++
            ) {
                if (
                    scope.form.dataFieldComponents[dataFieldIdx].name ===
                    dataBinding.name
                ) {
                    scope.form.dataFieldComponents.splice(dataFieldIdx, 1);
                    break;
                }
            }

            // remove the watcher
            scope.form.dataModel[dataBinding.name].unbind();

            // finally delete the model
            delete scope.form.dataModel[dataBinding.name];
        }

        /**
         * @name editDataBinding
         * @param {object} dataBinding the data variable to edit
         * @desc edit the existing data binding
         * @returns {void}
         */
        function editDataBinding(dataBinding) {
            scope.form.showManualOptions = dataBinding.manualOptions
                ? true
                : false;
            scope.form.showValuePixel = dataBinding.valuePixel ? true : false;
            scope.form.tempPixel = {
                name: dataBinding.name,
                pixel: dataBinding.pixel,
                defaultValue: dataBinding.defaultValue,
                manualOptions: dataBinding.manualOptions,
                type: 'data',
                isNew: false,
                dependsOn: semossCoreService.utility.freeze(
                    dataBinding.dependsOn
                ),
                valuePixel: dataBinding.valuePixel,
                required: dataBinding.required,
                autoPopulate: dataBinding.autoPopulate,
                useFullList: dataBinding.useFullList,
            };
        }

        /**
         * @name runValuePixel
         * @param {string} valuePixel the pixel to run to get the value pixel returns
         * @param {string} model the data model to work off of
         * @desc run the value pixel and set it
         * @returns {void}
         */
        function runValuePixel(valuePixel, model) {
            var insightID = scope.widgetCtrl
                    ? scope.widgetCtrl.insightID
                    : semossCoreService.get('queryInsightID'),
                message = semossCoreService.utility.random('meta-pixel'),
                tempValuePixel = fillPixel(valuePixel);

            if (
                isDependsOnFilled(scope.form.dataModel[model].dependsOn) &&
                tempValuePixel
            ) {
                semossCoreService.emit('meta-pixel', {
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [tempValuePixel],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    insightID: insightID,
                    response: message,
                });

                semossCoreService.once(message, function (response) {
                    var data;
                    if (
                        response.pixelReturn[
                            response.pixelReturn.length - 1
                        ].operationType.indexOf('ERROR') > -1
                    ) {
                        // alert already being handled from store service
                        return;
                    }

                    data = formatData(
                        response.pixelReturn[response.pixelReturn.length - 1]
                    );
                    if (isChecklist(model)) {
                        scope.form.dataModel[model].selected = data;
                    } else {
                        scope.form.dataModel[model].selected = data[0];
                    }
                    scope.form.dataModel[model].original =
                        semossCoreService.utility.freeze(
                            scope.form.dataModel[model].selected
                        );
                });
            }
        }

        /**
         * @name addDataBinding
         * @param {array} pixelArr pixel to run & its attributes
         * @param {boolean} isManualBinding if this binding is added manually from user
         * @desc run pixel and set new data variable to scope
         * @returns {void}
         */
        function addDataBinding(pixelArr, isManualBinding) {
            // TODO pixelObj needs to become an array, and we need to wrap majority of this in a for statement
            // concatenate the pixel to run, and then process the output individually based on the order of the array
            let message = semossCoreService.utility.random('meta-pixel'),
                tempModelArr = [],
                chainedPixel = '',
                insightID = scope.widgetCtrl
                    ? scope.widgetCtrl.insightID
                    : semossCoreService.get('queryInsightID');

            for (let arrIdx = 0; arrIdx < pixelArr.length; arrIdx++) {
                let pixelObj = pixelArr[arrIdx],
                    pixel = pixelObj.pixel,
                    valuePixel = pixelObj.valuePixel,
                    tempPixel = pixel,
                    tempValuePixel = valuePixel,
                    name = pixelObj.name,
                    defaultValue = pixelObj.defaultValue,
                    dependsOn = pixelObj.dependsOn,
                    manualOptions = pixelObj.manualOptions,
                    required = pixelObj.required,
                    autoPopulate = pixelObj.autoPopulate,
                    manualOptionsArr = [],
                    config = pixelObj.config,
                    useFullList = pixelObj.useFullList,
                    modelObj = {
                        pixel,
                        defaultValue,
                        dependsOn,
                        required,
                        autoPopulate,
                        valuePixel,
                        manualOptions,
                        useFullList,
                        tempValuePixel,
                    };

                if (
                    !name ||
                    (scope.form.tempPixel.type === 'pixel' &&
                        !scope.form.tempPixel.pixel)
                ) {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'Please fill in all required fields.',
                        insightID: scope.widgetCtrl
                            ? scope.widgetCtrl.insightID
                            : undefined,
                    });
                    return;
                }

                tempPixel = fillPixel(tempPixel);

                if (isDependsOnFilled(dependsOn) && tempPixel) {
                    // wrapped into a If statement so we can group the pixels into one to keep track when they return from the BE
                    chainedPixel += `If(true, (${tempPixel}));`;
                    tempModelArr.push({
                        modelObj,
                        config,
                        name,
                    });
                } else if (scope.form.showManualOptions && manualOptions) {
                    // manual options defined--convert to an array by splitting ',' and trimming each item
                    manualOptionsArr = manualOptions
                        .split(',')
                        .map(function (item) {
                            return item.trim();
                        });

                    _addDataModel(
                        {
                            options: manualOptionsArr,
                        },
                        config,
                        modelObj,
                        name
                    );
                    _addDataVariable(modelObj, name);
                    scope.form.tempPixel = {
                        name: '',
                        pixel: '',
                        defaultValue: '',
                        type: '',
                        dependsOn: [],
                        valuePixel: '',
                        manualOptions: '',
                        required: true,
                        autoPopulate: false,
                        useFullList: false,
                    };
                } else {
                    // no options defined via manual options or pixel
                    _addDataModel(
                        {
                            options: [],
                        },
                        config,
                        modelObj,
                        name
                    );
                    _addDataVariable(modelObj, name);
                    scope.form.tempPixel = {
                        name: '',
                        pixel: '',
                        defaultValue: '',
                        type: '',
                        dependsOn: [],
                        valuePixel: '',
                        manualOptions: '',
                        required: true,
                        autoPopulate: false,
                        useFullList: false,
                    };
                }
            }

            /**
             * @name addDataModel
             * @param {object} data the data to format and assign to options
             * @param {object} config config properties
             * @param {object} modelObj model properties
             * @param {string} name the model name
             * @desc add a new variable into the data model
             * @returns {void}
             */
            function _addDataModel(data, config, modelObj, name) {
                var unbind,
                    tempConfig = config;

                if (scope.form.dataModel[name] && !config) {
                    tempConfig = scope.form.dataModel[name].config;
                }

                // if it's manual binding, we dont keep the config information
                // having a config means we're treating it as one of the default data variables, and process the pixel a little differently when there are dependencies.
                if (isManualBinding) {
                    tempConfig = '';
                }

                // unbind existing watch
                if (
                    scope.form.dataModel[name] &&
                    scope.form.dataModel[name].unbind
                ) {
                    scope.form.dataModel[name].unbind();
                }

                scope.form.dataModel[name] = {
                    name: name,
                    options: formatData(data),
                    pixel: modelObj.pixel,
                    defaultValue: modelObj.defaultValue,
                    selected: modelObj.defaultValue, // TODO this will always be a string. In cases where it makes sense to use multi values, then this value will need to be converted to an array
                    dependsOn: semossCoreService.utility.freeze(
                        modelObj.dependsOn
                    ),
                    required: modelObj.required,
                    autoPopulate: modelObj.autoPopulate,
                    valuePixel: modelObj.valuePixel,
                    manualOptions: modelObj.manualOptions,
                    config: tempConfig,
                    useFullList: modelObj.useFullList,
                };

                if (
                    modelObj.autoPopulate &&
                    scope.form.dataModel[name].options &&
                    scope.form.dataModel[name].options.length > 0
                ) {
                    if (isChecklist(name)) {
                        scope.form.dataModel[name].selected = [
                            scope.form.dataModel[name].options[0],
                        ];
                    } else {
                        scope.form.dataModel[name].selected =
                            scope.form.dataModel[name].options[0];
                    }
                }

                // update the pixel with filters if it has dependencies
                if (modelObj.dependsOn.length > 0) {
                    updatePixelDependency(name, modelObj.dependsOn);
                }

                // also need an event listener to check to see if there are children impacted by the change in the model.
                unbind = scope.$watch(
                    'form.dataModel["' + name + '"].selected',
                    function (model, newValue, oldValue) {
                        cascadeOptions(model, newValue, oldValue);
                        updateGroupModel(model);
                    }.bind(null, name),
                    true
                ); // object equality check needed for multi checklist...

                // bind to the dataModel so we can unbind the watch later
                scope.form.dataModel[name].unbind = unbind;

                // if there is a valuePixel we will run it to set the selected value
                if (modelObj.tempValuePixel) {
                    runValuePixel(modelObj.tempValuePixel, name);
                }
            }

            /**
             * @name _addDataVariable
             * @param {object} modelObj model properties
             * @param {string} name name of the model variable
             * @desc make sure pixel is valid and then run it to set the options and then set everything to the dataModel
             * @returns {void}
             */
            function _addDataVariable(modelObj, name) {
                var tempObj = {
                        name: name,
                        pixel: modelObj.pixel,
                        options: scope.form.dataModel[name].options,
                        defaultValue: modelObj.defaultValue,
                        dependsOn: semossCoreService.utility.freeze(
                            modelObj.dependsOn
                        ),
                        valuePixel: modelObj.valuePixel,
                        manualOptions: modelObj.manualOptions,
                        required: modelObj.required,
                        autoPopulate: modelObj.autoPopulate,
                        useFullList: modelObj.useFullList,
                    },
                    i,
                    existingIdx = -1;

                for (i = 0; i < scope.form.dataVariableList.length; i++) {
                    if (scope.form.dataVariableList[i].name === name) {
                        existingIdx = i;
                        break;
                    }
                }

                if (existingIdx > -1) {
                    scope.form.dataVariableList[existingIdx] = tempObj;
                } else {
                    scope.form.dataVariableList.push(tempObj);
                }
            }

            semossCoreService.once(message, function (response) {
                for (
                    let pixelIdx = 0;
                    pixelIdx < tempModelArr.length;
                    pixelIdx++
                ) {
                    const config = tempModelArr[pixelIdx].config,
                        modelObj = tempModelArr[pixelIdx].modelObj,
                        name = tempModelArr[pixelIdx].name,
                        opType = response.pixelReturn[pixelIdx].operationType,
                        output = response.pixelReturn[pixelIdx].output;

                    if (opType.indexOf('VECTOR') > -1) {
                        const lastOutput = output[output.length - 1];
                        if (lastOutput.operationType.indexOf('ERROR') > -1) {
                            continue;
                        }

                        _addDataModel(lastOutput, config, modelObj, name);
                        _addDataVariable(modelObj, name);
                        setDependList();

                        if (scope.form.tempPixel.pixel) {
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text:
                                    'Successfully added ' +
                                    name +
                                    ' as a data variable.',
                                insightID: scope.widgetCtrl
                                    ? scope.widgetCtrl.insightID
                                    : undefined,
                            });
                        }

                        scope.form.tempPixel = {
                            name: '',
                            pixel: '',
                            defaultValue: '',
                            type: '',
                            dependsOn: [],
                            valuePixel: '',
                            manualOptions: '',
                            required: true,
                            autoPopulate: false,
                            useFullList: false,
                        };
                    }
                }
            });

            if (chainedPixel) {
                semossCoreService.emit('meta-pixel', {
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [chainedPixel],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    insightID: insightID,
                    response: message,
                });
            }
        }

        /**
         * @name toggleAutoPopulate
         * @param {string} model the model to work off of
         * @desc toggle auto populate and set the selected values
         * @returns {void}
         */
        function toggleAutoPopulate(model) {
            var dataIdx;

            if (scope.form.dataModel[model].autoPopulate) {
                if (isChecklist(model)) {
                    scope.form.dataModel[model].selected =
                        scope.form.dataModel[model].options.length > 0
                            ? [scope.form.dataModel[model].options[0]]
                            : [];
                } else {
                    scope.form.dataModel[model].selected =
                        scope.form.dataModel[model].options.length > 0
                            ? scope.form.dataModel[model].options[0]
                            : '';
                }
            } else if (isChecklist(model)) {
                scope.form.dataModel[model].selected = [
                    scope.form.dataModel[model].defaultValue,
                ];
            } else {
                scope.form.dataModel[model].selected =
                    scope.form.dataModel[model].defaultValue;
            }

            // original to be used in params <Title.original> in cases where users need the original value AND the new value using the same model. e.g. in update form where we want to update Title using just one input box that's auto populated
            scope.form.dataModel[model].original =
                semossCoreService.utility.freeze(
                    scope.form.dataModel[model].selected
                );

            // sync to the data variable list
            for (
                dataIdx = 0;
                dataIdx < scope.form.dataVariableList.length;
                dataIdx++
            ) {
                if (scope.form.dataVariableList[dataIdx].name === model) {
                    scope.form.dataVariableList[dataIdx].autoPopulate =
                        scope.form.dataModel[
                            scope.form.dataVariableList[dataIdx].name
                        ].autoPopulate;
                    break;
                }
            }

            // make sure useFullList is correctly set since it's directly related to autoPopulate
            toggleUseFullList(model);
        }

        /**
         * @name toggleUseFullList
         * @param {string} model the model to work off of
         * @desc toggle useFullList
         * @returns {void}
         */
        function toggleUseFullList(model) {
            var dataIdx, valuePixel;

            // first need to update the pixel for options since we depend on it later
            // reset the pixel properly and then run it to get the new options
            updatePixelDependency(model, scope.form.dataModel[model].dependsOn);

            // if dependsOn AND autopopulate AND toggleUseFullList then we need to generate a valuePixel and run it to get the right value
            // otherwise we set valuePixel to empty string
            if (scope.form.dataModel[model].useFullList) {
                if (
                    scope.form.dataModel[model].dependsOn.length > 0 &&
                    scope.form.dataModel[model].autoPopulate
                ) {
                    valuePixel = getFilterPixel(
                        model,
                        scope.form.dataModel[model].dependsOn
                    );
                }
            }

            scope.form.dataModel[model].valuePixel = valuePixel;

            // valuePixel gets run in the setOptions so we do this last
            setOptions(model);

            // sync to the data variable list so we show the model correctly on the UI
            for (
                dataIdx = 0;
                dataIdx < scope.form.dataVariableList.length;
                dataIdx++
            ) {
                if (scope.form.dataVariableList[dataIdx].name === model) {
                    scope.form.dataVariableList[dataIdx].useFullList =
                        scope.form.dataModel[
                            scope.form.dataVariableList[dataIdx].name
                        ].useFullList;
                    scope.form.dataVariableList[dataIdx].valuePixel =
                        scope.form.dataModel[model].valuePixel;
                    break;
                }
            }
        }

        /**
         * @name toggleRequired
         * @desc when required is toggled, sync it back to dataVariableList
         * @returns {void}
         */
        function toggleRequired() {
            var dataIdx;
            for (
                dataIdx = 0;
                dataIdx < scope.form.dataVariableList.length;
                dataIdx++
            ) {
                if (
                    scope.form.dataVariableList[dataIdx].name ===
                    scope.form.content.items[scope.form.content.selected].data
                ) {
                    scope.form.dataVariableList[dataIdx].required =
                        scope.form.dataModel[
                            scope.form.dataVariableList[dataIdx].name
                        ].required;
                    break;
                }
            }
        }

        /**
         * @name updateFormModel
         * @param {number} idx the index to update
         * @desc update the item model
         * @returns {void}
         */
        function updateFormModel(idx) {
            scope.form.content.items[idx].html = scope.form.content.items[
                idx
            ].html.replace(
                /smss-form-model\s*=\s*"\s*[\s\S]*\s*"/,
                'smss-form-model="' + scope.form.content.items[idx].model + '"'
            );
        }

        /**
         * @name getFilterPixel
         * @param {string} model the model to work off of
         * @param {array} dependsOn the filters to setup
         * @desc get the filter pixel
         * @returns {string} the filter pixel
         */
        function getFilterPixel(model, dependsOn) {
            var collect = 'Collect(-1)',
                filter = '',
                dependIdx,
                tempPixel;

            for (dependIdx = 0; dependIdx < dependsOn.length; dependIdx++) {
                // if (Array.isArray(scope.form.dataModel[dependsOn[dependIdx]].selected)) {
                //     filter += `Filter(${scope.form.dataModel[model].config.table}__${dependsOn[dependIdx]} == [<${dependsOn[dependIdx]}>])|`;
                // } else {
                //     filter += `Filter(${scope.form.dataModel[model].config.table}__${dependsOn[dependIdx]} == <${dependsOn[dependIdx]}>)|`;
                // }
                filter += `Filter(${scope.form.dataModel[model].config.table}__${dependsOn[dependIdx]} == [<${dependsOn[dependIdx]}>])|`;
            }

            // TODO we should probably remove the filters for the dependsOn models only.
            tempPixel = scope.form.dataModel[model].pixel.replace(
                /\s*Filter\([\s\S]*\)\s*\|\s*/g,
                ''
            );

            if (filter) {
                tempPixel = tempPixel.replace(collect, filter + collect);
            }

            return tempPixel;
        }

        /**
         * @name updatePixelDependency
         * @param {string} model the model to update pixel for
         * @param {array} dependsOn the dependencies
         * @desc update the pixel to take in dependency for data field pixels only
         * @returns {void}
         */
        function updatePixelDependency(model, dependsOn) {
            var tempDependsOn = semossCoreService.utility.freeze(dependsOn),
                valuePixel = '';
            // TODO make table and app agnostic
            if (
                scope.form.dataModel[model].config &&
                scope.form.dataModel[model].config.table &&
                scope.form.app &&
                scope.form.app.value
            ) {
                if (scope.form.dataModel[model].useFullList) {
                    tempDependsOn = [];
                    if (
                        scope.form.dataModel[model].dependsOn.length > 0 &&
                        scope.form.dataModel[model].autoPopulate
                    ) {
                        valuePixel = getFilterPixel(
                            model,
                            scope.form.dataModel[model].dependsOn
                        );
                        scope.form.dataModel[model].valuePixel = valuePixel;
                    }
                }

                scope.form.dataModel[model].pixel = getFilterPixel(
                    model,
                    tempDependsOn
                );
            }
        }

        /**
         * @name getMoreInstances
         * @param {string} tempModel the model to work off of
         * @desc infinite scrolling to get more instances
         * @returns {void}
         */
        function getMoreInstances() {
            // dataModel would have a infinitePixel and we will run it here
        }

        /**
         * @name isChecklist
         * @param {string} model the model to check
         * @desc checks to see if the model is a checklist
         * @returns {boolean} true/false
         */
        function isChecklist(model) {
            var isChecklistBool = false,
                componentIdx,
                component;

            for (
                componentIdx = 0;
                componentIdx < scope.form.content.items.length;
                componentIdx++
            ) {
                if (scope.form.content.items[componentIdx].data === model) {
                    component = findComponent(
                        scope.form.content.items[componentIdx].html
                    );
                    if (
                        component.name === 'Single Checklist' ||
                        component.name === 'Multi Checklist'
                    ) {
                        isChecklistBool = true;
                        break;
                    }
                }
            }

            return isChecklistBool;
        }

        /**
         * @name setOptions
         * @param {string} tempModel the model to go through
         * @desc set the options from the pixel return
         * @returns {void}
         */
        function setOptions(tempModel) {
            var completePixel = scope.form.dataModel[tempModel].pixel,
                message = '',
                insightID = scope.widgetCtrl
                    ? scope.widgetCtrl.insightID
                    : semossCoreService.get('queryInsightID'),
                valuePixel = scope.form.dataModel[tempModel].valuePixel,
                dataVariableIdx;

            scope.form.dataModel[tempModel].options = [];
            scope.form.dataModel[tempModel].selected =
                scope.form.dataModel[tempModel].defaultValue;
            scope.form.dataModel[tempModel].original =
                semossCoreService.utility.freeze(
                    scope.form.dataModel[tempModel].selected
                );

            if (!tempModel) {
                return;
            }

            // sync the depends on in data davariable list...
            // also sync the pixel in case it has changed due to dependency changes
            for (
                dataVariableIdx = 0;
                dataVariableIdx < scope.form.dataVariableList.length;
                dataVariableIdx++
            ) {
                if (
                    scope.form.dataVariableList[dataVariableIdx].name ===
                    tempModel
                ) {
                    scope.form.dataVariableList[dataVariableIdx].dependsOn =
                        scope.form.dataModel[tempModel].dependsOn;
                    scope.form.dataVariableList[dataVariableIdx].pixel =
                        scope.form.dataModel[tempModel].pixel;
                }
            }

            function _setData(model, response) {
                scope.form.dataModel[model].options = formatData(
                    response.pixelReturn[response.pixelReturn.length - 1]
                );
                if (
                    scope.form.dataModel[model].autoPopulate &&
                    scope.form.dataModel[model].useFullList &&
                    scope.form.dataModel[model].dependsOn.length > 0
                ) {
                    // this will be handled in the toggleFullList function
                } else if (scope.form.dataModel[model].autoPopulate) {
                    // check all of the components and see what component type they are.
                    // if the type is single/multi checklist, we need selected to be an array instead of a string value
                    if (isChecklist(model)) {
                        scope.form.dataModel[model].selected = [
                            scope.form.dataModel[model].options[0],
                        ];
                    } else {
                        scope.form.dataModel[model].selected =
                            scope.form.dataModel[model].options[0];
                    }
                } else if (
                    scope.form.dataModel[model].defaultValue ||
                    scope.form.dataModel[model].defaultValue === 0
                ) {
                    // if there is a default value, we will set it
                    scope.form.dataModel[model].selected =
                        scope.form.dataModel[model].defaultValue;
                } else if (isChecklist(model)) {
                    // if no default value and it is a checklist, we need to set the model to be an array
                    scope.form.dataModel[model].selected = [];
                } else {
                    // other we will set it to an empty string
                    scope.form.dataModel[model].selected = '';
                }

                scope.form.dataModel[model].original =
                    semossCoreService.utility.freeze(
                        scope.form.dataModel[model].selected
                    );
            }

            completePixel = fillPixel(completePixel);
            if (isDependsOnFilled(scope.form.dataModel[tempModel].dependsOn)) {
                if (completePixel) {
                    message = semossCoreService.utility.random('meta-pixel');
                    semossCoreService.once(message, function (response) {
                        _setData(tempModel, response);
                        // rerun the value pixel too in case any dependencies have been updated
                        if (valuePixel) {
                            runValuePixel(valuePixel, tempModel);
                        }
                    });
                    semossCoreService.emit('meta-pixel', {
                        commandList: [
                            {
                                type: 'Pixel',
                                components: [completePixel],
                                terminal: true,
                                meta: true,
                            },
                        ],
                        insightID: insightID,
                        response: message,
                    });
                } else if (scope.form.dataModel[tempModel].manualOptions) {
                    // setting back the options...
                    // manual options defined--convert to an array by splitting ',' and trimming each item
                    scope.form.dataModel[tempModel].options =
                        scope.form.dataModel[tempModel].manualOptions
                            .split(',')
                            .map(function (item) {
                                return item.trim();
                            });

                    // check autopopulate as well
                    if (scope.form.dataModel[tempModel].autoPopulate) {
                        if (isChecklist(tempModel)) {
                            scope.form.dataModel[tempModel].selected = [
                                scope.form.dataModel[tempModel].options[0],
                            ];
                        } else {
                            scope.form.dataModel[tempModel].selected =
                                scope.form.dataModel[tempModel].options[0];
                        }
                    }

                    if (valuePixel) {
                        runValuePixel(valuePixel, tempModel);
                    }
                }
            } else {
                // if dependsOn is not filled in, then the options need to be wiped
                scope.form.dataModel[tempModel].options = [];
                // value should be wiped too?
                if (isChecklist(tempModel)) {
                    scope.form.dataModel[tempModel].selected = [];
                } else {
                    scope.form.dataModel[tempModel].selected = '';
                }
            }
        }

        /**
         * @name cascadeOptions
         * @param {string} model the model that has changed
         * @param {string} newValue the new value
         * @param {string} oldValue the old value
         * @param {boolean} force the model to refresh
         * @desc checks to see if need to cascade the change down to children, if so, rerun their pixels to get updated values.
         * @returns {void}
         */
        function cascadeOptions(model, newValue, oldValue, force) {
            var tempModel;

            // force these models to update
            if (force) {
                setOptions(model);
            }

            if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                // loop through once to reset the selected values first for components that depend on this model
                for (tempModel in scope.form.dataModel) {
                    if (tempModel === model) {
                        continue; // no need to cascade to itself
                    }

                    if (
                        scope.form.dataModel[tempModel].dependsOn.indexOf(
                            model
                        ) > -1
                    ) {
                        if (isChecklist(model)) {
                            scope.form.dataModel[tempModel].selected = [];
                        } else {
                            scope.form.dataModel[tempModel].selected = '';
                        }
                    }
                }

                // then loop through again to set the options
                for (tempModel in scope.form.dataModel) {
                    if (tempModel === model) {
                        continue; // no need to cascade to itself
                    }

                    if (
                        scope.form.dataModel[tempModel].dependsOn.indexOf(
                            model
                        ) > -1
                    ) {
                        setOptions(tempModel);
                    }
                }

                setGroupData(model);
            }
        }

        /**
         * @name formatData
         * @param {object} pixelReturn the data to format
         * @desc format the return data
         * @returns {array} array of the formatted data
         */
        function formatData(pixelReturn) {
            var len,
                i,
                formattedData = [];

            if (pixelReturn.options) {
                formattedData = pixelReturn.options;
            } else if (pixelReturn.operationType.indexOf('TASK_DATA') > -1) {
                // looking at operationType to figure out how to grab the return data
                for (
                    i = 0, len = pixelReturn.output.data.values.length;
                    i < len;
                    i++
                ) {
                    formattedData.push(pixelReturn.output.data.values[i][0]);
                }
            } else if (
                pixelReturn.operationType.indexOf('FRAME_HEADERS') > -1
            ) {
                // TODO look at other operationTypes and see how they are structured and set in the param as appropriate
                for (
                    i = 0, len = pixelReturn.output.headers.length;
                    i < len;
                    i++
                ) {
                    formattedData.push(pixelReturn.output.headers[i]);
                }
            } else if (Array.isArray(pixelReturn.output)) {
                for (i = 0, len = pixelReturn.output.length; i < len; i++) {
                    formattedData.push(pixelReturn.output[i]);
                }
            } else if (typeof pixelReturn.output !== 'object') {
                formattedData = [pixelReturn.output];
            }

            return formattedData;
        }

        /**
         * @name cleanHTML
         * @param {string} html the html to clean up and return
         * @param {number} index the index to clean
         * @param {boolean} newHTML grab the new HTML rather than from cache
         * @desc clean up the html and replace any semoss values we have
         * @returns {string} the cleaned html
         */
        function cleanHTML(html, index, newHTML) {
            var cleanedHTML = html,
                idx,
                attributes = [];
            if (cache[index + html] && !newHTML) {
                return cache[index + html];
            }

            if (
                scope.form.pixelBinding[index] &&
                scope.form.pixelBinding[index].Click &&
                scope.form.pixelBinding[index] &&
                scope.form.pixelBinding[index].Click.name
            ) {
                cleanedHTML = cleanedHTML.replace(
                    /<SMSS_CLICK_RUN_PIXEL>/g,
                    'form.pixelModel.' +
                        scope.form.pixelBinding[index].Click.name +
                        '.pixel'
                );
            } else {
                cleanedHTML = cleanedHTML.replace(
                    /<SMSS_CLICK_RUN_PIXEL>/g,
                    ''
                );
            }

            // take the smss-form-model's value and set it to the model
            if (cleanedHTML.indexOf('smss-form-model') > -1) {
                // look for attributes at the two different levels: at the parent level and at the children level
                attributes =
                    $compile(cleanedHTML)(scope)[0].attributes.length > 0
                        ? $compile(cleanedHTML)(scope)[0].attributes
                        : $compile(cleanedHTML)(scope)[0].children[0]
                              .attributes;
                for (idx = 0; idx < attributes.length; idx++) {
                    if (
                        attributes[idx].name === 'smss-form-model' &&
                        scope.form.content.items[index].model !==
                            attributes[idx].value
                    ) {
                        scope.form.content.items[index].model =
                            attributes[idx].value;
                    }
                }
            }

            cache[index + html] = cleanedHTML;
            return cleanedHTML;
        }

        /**
         * @name setDependList
         * @desc set the list of available options to select as dependency
         * @returns {void}
         */
        function setDependList() {
            var idx;

            scope.form.dependList = [];

            for (idx = 0; idx < scope.form.content.items.length; idx++) {
                if (idx === scope.form.content.selected) {
                    continue;
                }

                if (
                    scope.form.content.items[idx].data &&
                    scope.form.dependList.indexOf(
                        scope.form.content.items[idx].data
                    ) === -1
                ) {
                    scope.form.dependList.push(
                        scope.form.content.items[idx].data
                    );
                }
            }
        }

        /**
         * @name getModelList
         * @param {string} selectedOption the selected option
         * @param {number} selectedListItem the selected list item
         * @param {number} selectedModel the selected model idx
         * @desc get the list of models used in the UI
         * @returns {void}
         */
        function getModelList(selectedOption, selectedListItem, selectedModel) {
            var idx, groupIdx;

            scope.form.pixelHelpers.options[selectedOption].list[
                selectedListItem
            ].model[selectedModel].list = [];
            for (idx = 0; idx < scope.form.content.items.length; idx++) {
                // if a multi field component is used, we need to see what data bindings are being used in the inner fields
                if (
                    scope.form.content.items[idx].group &&
                    scope.form.content.items[idx].group.list
                ) {
                    for (
                        groupIdx = 0;
                        groupIdx <
                        scope.form.content.items[idx].group.list.length;
                        groupIdx++
                    ) {
                        scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].model[selectedModel].list.push(
                            scope.form.dataModel[
                                scope.form.content.items[idx].group.list[
                                    groupIdx
                                ]
                            ]
                        );
                    }
                }

                if (scope.form.content.items[idx].data) {
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].model[selectedModel].list.push(
                        scope.form.dataModel[scope.form.content.items[idx].data]
                    );
                }

                // TODO need to make these unique in cases where models are used in multiple places
            }
            // we want to auto select the options by default so lets set the selected to the whole list
            if (
                scope.form.pixelHelpers.options[selectedOption].list[
                    selectedListItem
                ].name === 'Insert' ||
                scope.form.pixelHelpers.options[selectedOption].list[
                    selectedListItem
                ].name === 'Update' ||
                scope.form.pixelHelpers.options[selectedOption].list[
                    selectedListItem
                ].name === 'Delete'
            ) {
                scope.form.pixelHelpers.options[selectedOption].list[
                    selectedListItem
                ].model[selectedModel].selected =
                    semossCoreService.utility.freeze(
                        scope.form.pixelHelpers.options[selectedOption].list[
                            selectedListItem
                        ].model[selectedModel].list
                    );
            }
        }

        /**
         * @name showModelBinding
         * @desc returns true or false for whether to show options for data binding
         * @returns {boolean} true or false
         */
        function showModelBinding() {
            return scope.form.content.items[scope.form.content.selected]
                ? scope.form.content.items[scope.form.content.selected].html
                      .split('')
                      .reverse()
                      .join('')
                      .search(/[=]\s*ledom(?!(-mrof-ssms))/) > -1 &&
                      scope.form.content.items[
                          scope.form.content.selected
                      ].html.indexOf('smss-form-group') === -1
                : false; // using negative lookahead instead of negative lookbehind due to javascript compatibility.
        }

        /**
         * @name toggleSource
         * @param {boolean} bool set the view if passed in
         * @desc toggle the source code
         * @returns {void}
         */
        function toggleSource() {
            scope.form.editSource = !scope.form.editSource;
            if (scope.form.editSource) {
                scope.form.sourceCode = getSourceFromModel();
            } else {
                getViewFromSource();
            }
        }

        /**
         * @name toggleVariableBinding
         * @param {string} type pixel or data variable
         * @desc toggle the overlay for editing pixel/data variables
         * @returns {void}
         */
        function toggleVariableBinding(type) {
            scope.form.variableBinding.show = !scope.form.variableBinding.show;
            scope.form.variableBinding.type = type;
            scope.form.showManualOptions = false;
            scope.form.pixelTemplates.selected = {
                name: 'Custom',
                pixel: '',
            };
            scope.form.tempPixel = {
                name: '',
                pixel: '',
                defaultValue: '',
                type: '',
                dependsOn: [],
                valuePixel: '',
                manualOptions: '',
                required: true,
                autoPopulate: false,
                useFullList: false,
            };
        }

        /**
         * @name resetStyleTemplates
         * @desc reset the style templates to default
         * @returns {void}
         */
        function resetStyleTemplates() {
            scope.form.styleTemplates = {
                width: {
                    id: 1,
                    name: 'Width',
                    collapsible: false,
                    html: `
                    <smss-field>
                        <label>
                            Width (%):
                        </label>
                        <content>
                            <smss-input type="number" ng-model="form.styleTemplates['width'].model.value" max="100" min = "1"
                                ng-change="form.toggleStyle(form.content.selected, 'width', form.styleTemplates['width'].model.value + '%')">
                            </smss-input>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'width',
                        value: 100,
                    },
                },
                'font-size': {
                    id: 2,
                    name: 'Font Size',
                    collapsible: 'font',
                    html: `
                    <smss-field>
                        <label>
                            Size (px):
                        </label>
                        <content>
                            <smss-input type="number" ng-model="form.styleTemplates['font-size'].model.value" min="1" max="50"
                                ng-change="form.toggleStyle(form.content.selected, 'font-size', form.styleTemplates['font-size'].model.value + 'px')">
                            </smss-input>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'font-size',
                        value: 14,
                    },
                },
                color: {
                    id: 3,
                    name: 'Font Color',
                    collapsible: 'font',
                    html: `
                    <smss-field>
                        <label>
                            Color:
                        </label>
                        <content>
                            <smss-color-picker model="form.styleTemplates['color'].model.value" change="form.toggleStyle(form.content.selected, 'color', form.styleTemplates['color'].model.value)"></smss-color-picker>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'color',
                        value: '#000000',
                    },
                },
                'font-weight': {
                    id: 4,
                    name: 'Font Weight', // normal, bold
                    collapsible: 'font',
                    html: `
                    <smss-field>
                        <label>
                            Weight:
                        </label>
                        <content>
                            <smss-btn-group class="form-builder__right__styling__tile-container">
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['font-weight'].model.value === 'normal'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'font-weight', 'normal', 'font-weight');">
                                    Normal
                                </smss-btn>
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['font-weight'].model.value === 'bold'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'font-weight', 'bold', 'font-weight');">
                                    Bold
                                </smss-btn>
                            </smss-btn-group>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'font-weight',
                        value: '',
                    },
                },
                'font-style': {
                    id: 5,
                    name: 'Font Style', // normal, italic
                    collapsible: 'font',
                    html: `
                    <smss-field>
                        <label>
                            Style:
                        </label>
                        <content>
                            <smss-btn-group class="form-builder__right__styling__tile-container">
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['font-style'].model.value === 'normal'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'font-style', 'normal', 'font-style');">
                                    Normal
                                </smss-btn>
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['font-style'].model.value === 'italic'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'font-style', 'italic', 'font-style');">
                                    Italic
                                </smss-btn>
                            </smss-btn-group>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'font-style',
                        value: '',
                    },
                },
                alignment: {
                    id: 6,
                    name: 'Alignment',
                    collapsible: false,
                    html: `
                    <smss-field>
                        <label>
                            Alignment:
                        </label>
                        <content>
                            <smss-btn-group class="form-builder__right__styling__tile-container">
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['alignment'].model.value === 'left'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'text-align', 'left', 'alignment');">
                                    Left
                                </smss-btn>
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['alignment'].model.value === 'center'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'text-align', 'center', 'alignment');">
                                    Center
                                </smss-btn>
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['alignment'].model.value === 'right'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'text-align', 'right', 'alignment');">
                                    Right
                                </smss-btn>
                            </smss-btn-group>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'text-align',
                        value: '',
                    },
                },
                display: {
                    id: 7,
                    name: 'Display',
                    collapsible: false,
                    html: `
                    <smss-field>
                        <label>
                            Display:
                        </label>
                        <content>
                            <smss-btn-group class="form-builder__right__styling__tile-container">
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['display'].model.value === 'block'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'display', 'block', 'display');">
                                    Block
                                </smss-btn>
                                <smss-btn class="smss-btn--compact form-builder__right__styling__tiles" ng-class="{'smss-btn--selected': form.styleTemplates['display'].model.value === 'inline-block'}"
                                    ng-click="form.toggleStyle(form.content.selected, 'display', 'inline-block', 'display');">
                                    Inline
                                </smss-btn>
                            </smss-btn-group>
                        </content>
                    </smss-field>
                    `,
                    model: {
                        name: 'display',
                        value: '',
                    },
                },
            };

            updateStyleTemplates();
        }

        /**
         * @name updateStyleTemplates
         * @desc update the style templates model
         * @returns {void}
         */
        function updateStyleTemplates() {
            var styleIdx, template;
            if (scope.form.styleModel.length > 0) {
                for (
                    styleIdx = 0;
                    styleIdx <
                    scope.form.styleModel[scope.form.content.selected].length;
                    styleIdx++
                ) {
                    for (template in scope.form.styleTemplates) {
                        if (
                            scope.form.styleModel[scope.form.content.selected][
                                styleIdx
                            ].name ===
                            scope.form.styleTemplates[template].model.name
                        ) {
                            scope.form.styleTemplates[template].model.value =
                                isNaN(
                                    parseFloat(
                                        scope.form.styleModel[
                                            scope.form.content.selected
                                        ][styleIdx].value,
                                        10
                                    )
                                )
                                    ? scope.form.styleModel[
                                          scope.form.content.selected
                                      ][styleIdx].value
                                    : parseFloat(
                                          scope.form.styleModel[
                                              scope.form.content.selected
                                          ][styleIdx].value,
                                          10
                                      );
                        }
                    }
                }
            }
        }

        /**
         * @name toggleStyle
         * @param {*} selected the selected element
         * @param {*} styleName the style to toggle
         * @param {string} styleValue the style value to set to
         * @param {number} template the id of styleTemplate to update
         * @desc add new style
         * @returns {void}
         */
        function toggleStyle(selected, styleName, styleValue, template) {
            var styleIdx;
            for (
                styleIdx = 0;
                styleIdx < scope.form.styleModel[selected].length;
                styleIdx++
            ) {
                if (
                    scope.form.styleModel[selected][styleIdx].name === styleName
                ) {
                    if (
                        scope.form.styleModel[selected][styleIdx].value ===
                            styleValue &&
                        template
                    ) {
                        // remove it if it's the same value then we toggle it off by removing it
                        removeStyle(styleIdx);
                        resetStyleTemplates();
                    } else {
                        if (template) {
                            scope.form.styleTemplates[template].model.value =
                                styleValue;
                        }
                        scope.form.styleModel[selected][styleIdx].value =
                            styleValue;
                        updateStyleFromModel();
                    }

                    return;
                }
            }

            scope.form.styleModel[selected].push({
                name: styleName,
                value: styleValue,
            });
            updateStyleFromModel();
        }

        /**
         * @name addEmptyStyle
         * @param {*} idx the index to add style to
         * @desc add a placeholder style
         * @returns {void}
         */
        function addEmptyStyle(idx) {
            scope.form.styleModel[idx].push({
                name: '',
                value: '',
            });
        }

        /**
         * @name removeStyle
         * @param {*} idx the index to remove
         * @desc remove the style for the selected element
         * @returns {void}
         */
        function removeStyle(idx) {
            scope.form.styleModel[scope.form.content.selected].splice(idx, 1);
            updateStyleFromModel();
        }

        /**
         * @name getStyleContent
         * @param {string} source the source code to look at
         * @desc look through the source and look for <style> </style> tags
         * @returns {string} the style content
         */
        function getStyleContent(source) {
            var styleContent = '',
                styleRegex = new RegExp('<style>[\\S\\s]*<\\/style>'),
                matches = source.match(styleRegex);

            if (matches && matches.length > 0) {
                // only care about the first <style></style>
                styleContent = matches[0];
            }

            return styleContent;
        }

        /**
         * @name getUpdatedStyleContent
         * @param {string} styleContent the style to update
         * @desc {string} styleContent the style content to update
         * @returns {void}
         */
        function getUpdatedStyleContent(styleContent) {
            var updatedStyle = styleContent,
                classRegex = new RegExp('.*[\\w-*]+\\s*{', 'g'),
                matches = updatedStyle.match(classRegex),
                updatedClass = '',
                matchIdx,
                formContentRegex = new RegExp(
                    '#form-content-' +
                        scope.form.uniqueId +
                        ' ' +
                        '#form-content-' +
                        scope.form.uniqueId,
                    'g'
                );

            if (matches && matches.length > 0) {
                for (matchIdx = 0; matchIdx < matches.length; matchIdx++) {
                    updatedClass =
                        '#form-content-' +
                        scope.form.uniqueId +
                        ' ' +
                        matches[matchIdx];
                    updatedStyle = updatedStyle.replace(
                        matches[matchIdx],
                        updatedClass
                    );
                }
            }

            // remove duplicates
            updatedStyle = updatedStyle.replace(
                formContentRegex,
                '#form-content-' + scope.form.uniqueId
            );

            return updatedStyle;
        }

        /**
         * @name setFormStyle
         * @param {string} style the style to set
         * @desc set the style to the html
         * @returns {void}
         */
        function setFormStyle(style) {
            var compiledEle;
            // need to compile style to the element to apply
            compiledEle = $compile(style)(scope)[0];
            ele[0].appendChild(compiledEle);
        }

        /**
         * @name getViewFromSource
         * @desc build the view based on the source
         * @returns {void}
         */
        function getViewFromSource() {
            var root = ele[0].querySelector('#form-builder__placeholder'),
                childIdx,
                len,
                htmlArr = [],
                htmlIdx,
                tempStyle = {},
                tempClass = '',
                styleIdx,
                selectedData,
                selectedPixel,
                styleTagContent = '',
                updatedStyleTagContent = '',
                groupData;

            scope.form.styleTagContent = '';
            if (ele[0].querySelector('style')) {
                ele[0].querySelector('style').remove(); // remove existing styles to prevent multiple stylesheets being appended to the dom
            }
            cache = {}; // clear the cache
            counter = 0;
            groupCounter = 0;
            // wipe the model and use the source to recreate the model
            scope.form.content.items = [];
            scope.form.styleModel = [];
            scope.form.dataBinding = [];
            scope.form.pixelBinding = [];
            scope.form.originalStyleTagContent = '';

            styleTagContent = getStyleContent(scope.form.sourceCode);
            if (styleTagContent) {
                // save the original and the updated style
                // original to be used to display back to the user when they swithc to the view
                // updated to be use
                // dont think we need the updatedStyleTagContent
                scope.form.originalStyleTagContent = styleTagContent;
                updatedStyleTagContent =
                    getUpdatedStyleContent(styleTagContent);
                scope.form.sourceCode = scope.form.sourceCode.replace(
                    styleTagContent,
                    ''
                );
                setFormStyle(updatedStyleTagContent);
                // TODO we need to check the style and see if its one of the themes and select it
            }

            // lets remove the style content so we dont draw it
            scope.form.sourceCode = scope.form.sourceCode.replace(
                scope.form.styleTagContent,
                ''
            );

            // set the new html in the dom so we can access the children html
            root.innerHTML = scope.form.sourceCode;

            // grab the html pieces from the children for us to recreate in the view
            for (
                childIdx = 0, len = root.children.length;
                childIdx < len;
                childIdx++
            ) {
                tempStyle = {};
                // store the styles in an object for the ng-style in list item; so that the style from the div can be applied at at the list level to make styling consistent
                for (
                    styleIdx = 0;
                    styleIdx < root.children[childIdx].style.length;
                    styleIdx++
                ) {
                    tempStyle[root.children[childIdx].style[styleIdx]] =
                        root.children[childIdx].style.getPropertyValue(
                            root.children[childIdx].style[styleIdx]
                        );
                }

                // lets store the classes applied to this content to be applied back later when we switch to src
                tempClass = root.children[childIdx].className;

                // now remove the style from the div because we're moving the styles to the list item
                // this means that the child's outerHTML will have no styles saved. we want that because we're
                // transferring the styles to list items and don't want duplicate styles in different places which would cause unintended styling
                root.children[childIdx].removeAttribute('style');
                root.children[childIdx].removeAttribute('class'); // removing the class as well with same reason as style

                // then we need to take care of the models and options specifically to control the data binding
                selectedData = getDataBinding(
                    root.children[childIdx].attributes
                ); // addComponent below will add into the form.dataBinding array
                if (
                    root.children[childIdx].attributes.length === 1 &&
                    root.children[childIdx].attributes[0].name ===
                        'smss-form-model' &&
                    root.children[childIdx].children[0] &&
                    root.children[childIdx].children[0].attributes.length > 0
                ) {
                    // TODO this is hardcoded...should not be doing this. we're specifically looking for the smss-btn that is within a div.
                    // TODO can become unpredictable when users starts messing with the html and have the structure that will match this check
                    // <div> <smss-btn ng-click="..."> </smss-btn> </div>
                    selectedPixel = getPixelBinding(
                        root.children[childIdx].children[0].attributes
                    );
                } else {
                    selectedPixel = getPixelBinding(
                        root.children[childIdx].attributes
                    );
                }

                groupData = getGroupingData(root.children[childIdx].attributes);
                htmlArr.push({
                    html: root.children[childIdx].outerHTML,
                    class: tempClass,
                    style: tempStyle,
                    data: selectedData,
                    pixel: selectedPixel,
                    group: groupData,
                });
            }

            // now lets clear the root so we start fresh
            root.innerHTML = '';

            // then properly add the components we pulled from the root.children
            for (htmlIdx = 0; htmlIdx < htmlArr.length; htmlIdx++) {
                addComponent(
                    {
                        html: htmlArr[htmlIdx].html,
                        class: htmlArr[htmlIdx].class,
                        style: htmlArr[htmlIdx].style,
                        data: htmlArr[htmlIdx].data,
                        pixel: htmlArr[htmlIdx].pixel,
                        group: htmlArr[htmlIdx].group,
                    },
                    htmlIdx
                );
            }

            setStyleModel();
            resetStyleTemplates();
        }

        /**
         * @name getSourceFromModel
         * @desc grab the source from the model
         * @returns {string} the src
         */
        function getSourceFromModel() {
            var dataIdx,
                tempSrc = '',
                root = ele[0].querySelector('#form-builder__placeholder'),
                style;

            for (
                dataIdx = 0;
                dataIdx < scope.form.content.items.length;
                dataIdx++
            ) {
                // in here we are trying to set the styles that we've removed from buildViewFromSource back into the html to show in the UI
                // we've already storing the styles separately, so will be simple to set it back to the outer div of the content
                // we don't want to manipulate the HTML string directly because it's not predictable so we're constructing the html and using the JS api to set styles
                // root.innerHTML = scope.form.content.items[dataIdx].html;
                root.innerHTML = cleanHTML(
                    scope.form.content.items[dataIdx].html,
                    dataIdx,
                    true
                );
                for (style in scope.form.content.items[dataIdx].style) {
                    if (
                        scope.form.content.items[dataIdx].style.hasOwnProperty(
                            style
                        )
                    ) {
                        root.children[0].style[style] =
                            scope.form.content.items[dataIdx].style[style];
                    }
                }

                // we're doing the same for classes. so lets add that back as well since we're storing that information anyway.
                if (scope.form.content.items[dataIdx].class) {
                    root.children[0].className =
                        scope.form.content.items[dataIdx].class;
                }

                // now this outerHTML will have the styles appended back into the html.
                tempSrc += root.children[0].outerHTML + '\n';
                root.innerHTML = ''; // reset the HTML
            }

            // append back the style to the source code
            if (scope.form.originalStyleTagContent) {
                tempSrc = scope.form.originalStyleTagContent + '\n' + tempSrc;
            }

            return tempSrc;
        }

        /**
         * @name updatePixelBinding
         * @param {string} trigger the trigger/event name
         * @desc update the pixel binding in the content.items to get synced up
         * @returns {void}
         */
        function updatePixelBinding(trigger) {
            scope.form.content.items[scope.form.content.selected].pixel =
                scope.form.pixelBinding[scope.form.content.selected][
                    trigger
                ].name;
            // TODO need to grab the dom and then update the html, otherwise it will keep referencing the original model
        }

        /**
         * @name updateDataBinding
         * @param {number} idx the index to update
         * @desc update the data binding in the content.items to get synced up
         * @returns {void}
         */
        function updateDataBinding(idx) {
            scope.form.content.items[idx].data =
                scope.form.dataBinding[idx].name;

            if (scope.form.dataBinding[idx].name) {
                // blow out anything in the model and options and replace with the new model
                // TODO should think about ng-model='...' vs ng-model="..."
                scope.form.content.items[idx].html = scope.form.content.items[
                    idx
                ].html.replace(
                    /ng-model\s*=\s*"\s*[\w.\s]*\s*"/,
                    'ng-model="form.dataModel.' +
                        scope.form.dataBinding[scope.form.content.selected]
                            .name +
                        '.selected"'
                );
                scope.form.content.items[idx].html = scope.form.content.items[
                    idx
                ].html
                    .split('')
                    .reverse()
                    .join('')
                    .replace(
                        /"s*[\s.\w]*\s*"\s*=\s*ledom(?!(-mrof-ssms))/,
                        '"detceles.' +
                            scope.form.dataBinding[
                                scope.form.content.selected
                            ].name
                                .split('')
                                .reverse()
                                .join('') +
                            '.ledoMatad.mrof"=ledom'
                    )
                    .split('')
                    .reverse()
                    .join(''); // negative lookbehind not widely supported in JS...so reversing the string and then doing negative lookahead
                // scope.form.content.items[idx].html = scope.form.content.items[idx].html.replace(/model\s*=\s*"\s*[\w.\s]*\s*"/, 'model="form.dataModel.' + scope.form.dataBinding[scope.form.content.selected].name + '.selected"');
                scope.form.content.items[idx].html = scope.form.content.items[
                    idx
                ].html.replace(
                    /options\s*=\s*"\s*[\w.\s]*\s*"/,
                    'options="form.dataModel.' +
                        scope.form.dataBinding[scope.form.content.selected]
                            .name +
                        '.options"'
                );
            } else {
                // if nothing is selected
                scope.form.content.items[idx].html = scope.form.content.items[
                    idx
                ].html.replace(
                    /ng-model\s*=\s*"\s*"/,
                    'ng-model="item.selected"'
                );
                scope.form.content.items[idx].html = scope.form.content.items[
                    idx
                ].html
                    .split('')
                    .reverse()
                    .join('')
                    .replace(
                        /"s*"\s*=\s*ledom(?!(-mrof-ssms))/,
                        '"detceles.meti"=ledom'
                    )
                    .split('')
                    .reverse()
                    .join('');
                // scope.form.content.items[idx].html = scope.form.content.items[idx].html.replace(/model\s*=\s*"\s*[\w.\s]*\s*"/, 'model="item.selected"');
                scope.form.content.items[idx].html = scope.form.content.items[
                    idx
                ].html.replace(
                    /options\s*=\s*"\s*[\w.\s]*\s*"/,
                    'options="item.options"'
                );
            }
            setDependList();
            if (scope.form.content.items[idx].data) {
                updatePixelDependency(
                    scope.form.content.items[idx].data,
                    scope.form.dataModel[scope.form.content.items[idx].data]
                        .dependsOn
                );
            }
        }

        /**
         * @name setDataBinding
         * @param {*} attributes the attributes to loop through to look for model and options that we want to control
         * @desc setting up the data binding by looking at the elements' attributes
         * @returns {string} the selected data binding
         */
        function getDataBinding(attributes) {
            var attrIdx,
                selectedData = '',
                accessors = [];
            for (attrIdx = 0; attrIdx < attributes.length; attrIdx++) {
                accessors = [];
                // TODO need to rethink this. this would cause an issue when users type in manual options
                // TODO need to stop grabbing from
                // switch the model and options back to <SMSS_DATA_SELECTED> and <SMSS_DATA_OPTIONS>
                if (
                    attributes[attrIdx].name === 'model' ||
                    attributes[attrIdx].name === 'ng-model'
                ) {
                    accessors = attributes[attrIdx].value.split('.');
                    if (
                        accessors[0] &&
                        accessors[0] === 'form' &&
                        accessors[1] &&
                        accessors[1] === 'dataModel' &&
                        accessors[2]
                    ) {
                        selectedData = semossCoreService.utility.getter(
                            scope,
                            accessors[0] +
                                '.' +
                                accessors[1] +
                                '.' +
                                accessors[2] +
                                '.name'
                        );
                    }
                    // attributes[attrIdx].value = '<SMSS_DATA_SELECTED>';
                }

                if (attributes[attrIdx].name === 'options') {
                    // attributes[attrIdx].value = '<SMSS_DATA_OPTIONS>';
                }
            }

            return selectedData ? selectedData : '';
        }

        /**
         * @name setPixelBinding
         * @param {*} attributes the attributes to loop through to look for model and options that we want to control
         * @desc setting up the pixel binding by looking at the elements' attributes
         * @returns {string} the selected pixel binding
         */
        function getPixelBinding(attributes) {
            var attrIdx,
                selectedPixel = '',
                pixelObj = {},
                matchers;
            for (attrIdx = 0; attrIdx < attributes.length; attrIdx++) {
                if (attributes[attrIdx].value) {
                    // TODO check for other ng attributes that can run a function such as ng-change
                    // check to see if within runPixel(...), we're passing in a variable form.pixelModel
                    if (
                        attributes[attrIdx].name === 'ng-click' &&
                        attributes[attrIdx].value.indexOf('form.runPixel') > -1
                    ) {
                        if (
                            attributes[attrIdx].value.indexOf(
                                'form.pixelModel'
                            ) > -1
                        ) {
                            matchers = attributes[attrIdx].value.match(
                                /(form.runPixel\()([\w\S]*)(\))/
                            );

                            // group 0 is the whole string matched
                            // group 1 is the form.runPixel( matched
                            // group 2 is the text inside runPixel matched
                            // group 3 is the ) matched
                            if (matchers.length === 4) {
                                selectedPixel =
                                    semossCoreService.utility.getter(
                                        scope,
                                        matchers[2].replace(/pixel$/, 'name')
                                    ) || '';
                                attributes[attrIdx].value = attributes[
                                    attrIdx
                                ].value.replace(
                                    matchers[2],
                                    '<SMSS_CLICK_RUN_PIXEL>'
                                );
                            }
                        } else if (
                            attributes[attrIdx].value
                                .replace(/ /g, '')
                                .indexOf('form.runPixel()') > -1
                        ) {
                            // nothing in the runPixel...so it's empty. lets add the tag back so we know how to replace later
                            attributes[attrIdx].value =
                                'form.runPixel(<SMSS_CLICK_RUN_PIXEL>)';
                        }
                        pixelObj.Click = {
                            name: selectedPixel,
                        };
                    }
                }
            }

            return pixelObj;
        }

        /**
         * @name setStyleModel
         * @desc set the model for the styles used for the UI
         * @returns {void}
         */
        function setStyleModel() {
            var i,
                style,
                tempStyle = {};
            scope.form.styleModel = [];
            for (i = 0; i < scope.form.content.items.length; i++) {
                scope.form.styleModel[i] = [];
                for (style in scope.form.content.items[i].style) {
                    if (
                        scope.form.content.items[i].style.hasOwnProperty(style)
                    ) {
                        tempStyle = {};

                        tempStyle.name = style;
                        tempStyle.value =
                            scope.form.content.items[i].style[style];
                        scope.form.styleModel[i].push(tempStyle);
                    }
                }
            }
        }

        /**
         * @name updateStyleFromModel
         * @desc convert from styleModel to normal style structure
         * @returns {void}
         */
        function updateStyleFromModel() {
            var i, j;
            scope.form.content.items[scope.form.content.selected].style = {};

            for (i = 0; i < scope.form.styleModel.length; i++) {
                for (j = 0; j < scope.form.styleModel[i].length; j++) {
                    if (scope.form.styleModel[i][j].name) {
                        scope.form.content.items[i].style[
                            scope.form.styleModel[i][j].name
                        ] = scope.form.styleModel[i][j].value;
                    }
                }
            }

            updateStyleTemplates();
        }

        /**
         * @name setLeftMenu
         * @desc sets up the options for the left section of the form
         * @returns {void}
         */
        function setLeftMenu() {
            scope.form.left = {
                items: [],
                options: {
                    start: function () {
                        scope.form.left.dragging = true;
                    },
                    dragover: function () {
                        return false;
                    },
                    dragend: function () {
                        scope.form.left.dragging = false;
                    },
                },
            };
        }

        /**
         * @name setDataFields
         * @desc set the data fields menu
         * @returns {void}
         */
        function setDataFields() {
            var columnIdx,
                icon,
                pixelComponents = [],
                message = semossCoreService.utility.random('meta-pixel'),
                insightID = semossCoreService.get('queryInsightID'),
                tableName = '',
                tempPixelArr = [],
                tempPixel = '';

            scope.form.dataFieldComponents = [];

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getDatabaseTableStructure',
                        components: [scope.form.app.value],
                        terminal: true,
                    },
                ],
                function (response) {
                    var output = response.pixelReturn[0].output,
                        len,
                        i;
                    for (i = 0, len = output.length; i < len; i++) {
                        scope.form.columns.push({
                            name: String(output[i][1]).replace(/_/g, ' '),
                            raw: output[i][1],
                            value: output[i][3]
                                ? output[i][1]
                                : output[i][0] + '__' + output[i][1],
                            isPK: output[i][3],
                            dataType: output[i][2],
                            table: output[i][0],
                        });
                    }
                    // sort the array by type
                    scope.form.columns.sort(function (a, b) {
                        var comparisonObj = {
                            STRING: 0,
                            NUMBER: 1,
                            DATE: 2,
                        };

                        if (
                            comparisonObj[a.dataType.toUpperCase()] <
                            comparisonObj[b.dataType.toUpperCase()]
                        ) {
                            return -1;
                        }

                        if (
                            comparisonObj[a.dataType.toUpperCase()] >
                            comparisonObj[b.dataType.toUpperCase()]
                        ) {
                            return 1;
                        }

                        return 0;
                    });

                    for (
                        columnIdx = 0;
                        columnIdx < scope.form.columns.length;
                        columnIdx++
                    ) {
                        // make sure we are only showing the columns in the selected table
                        if (
                            scope.form.columns[columnIdx].table !==
                            scope.form.table
                        ) {
                            continue;
                        }

                        tempPixel = '';
                        switch (
                            scope.form.columns[columnIdx].dataType.toUpperCase()
                        ) {
                            case 'NUMBER':
                                icon = require('images/number.svg');
                                break;
                            case 'DATE':
                                icon = require('images/date.svg');
                                break;
                            default:
                                icon = require('images/string.svg');
                        }
                        scope.form.dataFieldComponents.push({
                            id: 'data-field' + columnIdx,
                            icon: icon,
                            data: scope.form.columns[columnIdx].isPK
                                ? scope.form.columns[columnIdx].value
                                : scope.form.columns[columnIdx].value.split(
                                      '__'
                                  )[1],
                            // grab the original name, not the display name because it causes issues with spaces being used in the dataModel
                            name: scope.form.columns[columnIdx].isPK
                                ? scope.form.columns[columnIdx].value
                                : scope.form.columns[columnIdx].value.split(
                                      '__'
                                  )[1],
                            html: '',
                            dataType: scope.form.columns[columnIdx].dataType,
                        });

                        if (
                            scope.form.columns[
                                columnIdx
                            ].dataType.toUpperCase() === 'STRING'
                        ) {
                            scope.form.dataFieldComponents[
                                scope.form.dataFieldComponents.length - 1
                            ].html =
                                scope.form.components['form-typeahead'].html;
                        } else if (
                            scope.form.columns[
                                columnIdx
                            ].dataType.toUpperCase() === 'NUMBER'
                        ) {
                            scope.form.dataFieldComponents[
                                scope.form.dataFieldComponents.length - 1
                            ].html = scope.form.components['form-number'].html;
                        } else {
                            scope.form.dataFieldComponents[
                                scope.form.dataFieldComponents.length - 1
                            ].html = scope.form.components['form-input'].html;
                        }
                        // } else if (scope.form.column[columnIdx].dataType.toUpperCase() === 'DATE') {
                        // }

                        pixelComponents.push({
                            meta: true,
                            type: 'database',
                            components: [scope.form.app.value],
                            terminal: false,
                        });
                        pixelComponents.push({
                            type: 'select2',
                            components: [
                                [
                                    {
                                        selector:
                                            scope.form.columns[columnIdx].value,
                                        alias: scope.form.columns[
                                            columnIdx
                                        ].name.replace(/ /g, '_'),
                                    },
                                ],
                            ],
                            terminal: false,
                        });

                        // this portion is just building the pixels to setup for dependencies...
                        tempPixel += semossCoreService.pixel.build([
                            {
                                type: 'database',
                                components: [scope.form.app.value],
                                terminal: false,
                            },
                            {
                                type: 'select2',
                                components: [
                                    [
                                        {
                                            selector:
                                                scope.form.columns[columnIdx]
                                                    .value,
                                            alias: scope.form.columns[
                                                columnIdx
                                            ].name.replace(/ /g, '_'),
                                        },
                                    ],
                                ],
                                terminal: false,
                            },
                        ]);
                        tempPixel = tempPixel.substring(
                            0,
                            tempPixel.length - 1
                        ); // remove the semi-colon that's tagged on...
                        tempPixel += semossCoreService.pixel.build([
                            {
                                type: 'collect',
                                components: [-1],
                                terminal: true,
                            },
                        ]);
                        tempPixelArr.push(tempPixel);

                        pixelComponents.push({
                            type: 'collect',
                            components: [-1],
                            terminal: true,
                        });

                        tableName = scope.form.columns[columnIdx].table;
                    }

                    if (pixelComponents.length > 0) {
                        semossCoreService.once(message, function (response2) {
                            var idx,
                                tempObj = {},
                                existingIdx = -1,
                                unbind,
                                tempModel;

                            for (
                                idx = 0;
                                idx < scope.form.dataFieldComponents.length;
                                idx++
                            ) {
                                tempModel = {
                                    name: scope.form.dataFieldComponents[idx]
                                        .name,
                                    options: formatData(
                                        response2.pixelReturn[idx]
                                    ),
                                    pixel: tempPixelArr[idx],
                                    defaultValue: '',
                                    selected: '',
                                    required: true,
                                    autoPopulate: false,
                                    useFullList: false,
                                    dependsOn: [],
                                    config: {
                                        table: tableName,
                                        app: {
                                            value: scope.form.app.value,
                                        },
                                    },
                                };

                                // if already defined, we dont want to override it
                                // the or check is for when user creates a component before data fields have finished loading...which would create a model via angularjs. the model used in the html will create the object if it doesn't exist
                                if (
                                    !scope.form.dataModel[
                                        scope.form.dataFieldComponents[idx].name
                                    ] ||
                                    !scope.form.dataModel[
                                        scope.form.dataFieldComponents[idx].name
                                    ].hasOwnProperty('name')
                                ) {
                                    scope.form.dataModel[
                                        scope.form.dataFieldComponents[idx].name
                                    ] = tempModel;
                                }

                                // if watched already, we will unbind the watch.
                                if (
                                    scope.form.dataModel[
                                        scope.form.dataFieldComponents[idx].name
                                    ].unbind
                                ) {
                                    scope.form.dataModel[
                                        scope.form.dataFieldComponents[idx].name
                                    ].unbind();
                                }

                                // assign the watch to a variable so we can call to unbind later
                                // also need an event listener to check to see if there are children impacted by the change in the model.
                                unbind = scope.$watch(
                                    'form.dataModel["' +
                                        scope.form.dataFieldComponents[idx]
                                            .name +
                                        '"].selected',
                                    function (model, newValue, oldValue) {
                                        cascadeOptions(
                                            model,
                                            newValue,
                                            oldValue
                                        );
                                        updateGroupModel(model);
                                    }.bind(
                                        null,
                                        scope.form.dataFieldComponents[idx].name
                                    ),
                                    true
                                ); // object equality check needed for multi checklist...

                                // bind to the dataModel so we can unbind the watch later
                                scope.form.dataModel[
                                    scope.form.dataFieldComponents[idx].name
                                ].unbind = unbind;

                                tempObj = {
                                    name: scope.form.dataFieldComponents[idx]
                                        .name,
                                    pixel: tempPixelArr[idx], // this is the pixel with the dependencies
                                    options:
                                        scope.form.dataModel[
                                            scope.form.dataFieldComponents[idx]
                                                .name
                                        ].options,
                                    defaultValue: '',
                                    dependsOn: [],
                                    valuePixel: '',
                                    required: true,
                                    autoPopulate: false,
                                    useFullList: false,
                                };

                                for (
                                    i = 0;
                                    i < scope.form.dataVariableList.length;
                                    i++
                                ) {
                                    if (
                                        scope.form.dataVariableList[i].name ===
                                        scope.form.dataFieldComponents[idx].name
                                    ) {
                                        existingIdx = i;
                                        break;
                                    }
                                }

                                if (existingIdx > -1) {
                                    scope.form.dataVariableList[
                                        existingIdx
                                    ].options = tempObj.options;
                                } else {
                                    scope.form.dataVariableList.push(tempObj);
                                }
                            }
                        });
                        semossCoreService.emit('meta-pixel', {
                            commandList: pixelComponents,
                            insightID: insightID,
                            response: message,
                            listeners: [], // no loading bar; we want this to load in the background
                        });
                    }

                    // append to the data fields accordion menu
                    scope.form.menu[2].components =
                        scope.form.dataFieldComponents;
                },
                []
            );
        }

        /**
         * @name setContentSection
         * @desc sets up the options for the content section of the form
         * @returns {void}
         */
        function setContentSection() {
            scope.form.content = {
                options: {
                    start: function (index) {
                        scope.form.content.draggedIdx = index;
                        scope.form.content.dragging = true;
                        // get
                    },
                    stop: function (index, item) {
                        if (scope.form.content.dragging) {
                            scope.form.content.items.splice(
                                scope.form.content.draggedIdx,
                                1
                            );
                        }
                        addComponent(
                            semossCoreService.utility.freeze(item),
                            index,
                            scope.form.content.dragging
                                ? scope.form.content.draggedIdx
                                : false
                        );

                        return true;
                    },
                    dragend: function () {
                        scope.form.content.dragging = false;
                    },
                },
                items: [],
            };
        }

        /**
         * @name setPixelHelper
         * @desc sets up the pixel helper object
         * @returns {void}
         */
        function setPixelHelper() {
            scope.form.pixelHelpers = {
                selected: 'form',
                options: {
                    form: {
                        selected: 0,
                        list: [
                            {
                                name: 'Insert',
                                // 'pixel': `Database(database=["${scope.form.app ? scope.form.app.value : ''}"]) | Insert(into=[${scope.form.table ? scope.form.table : ''}__<SMSS_FORM_COLUMN>], values=[(<<SMSS_VALUE>>)]);`,
                                pixel: `Database(database=["${
                                    scope.form.app ? scope.form.app.value : ''
                                }"]) | Insert(into=[<SMSS_FORM_COLUMN>], values=[<SMSS_FORM_PARAM>]);`,
                                steps: {
                                    selected: 0,
                                    list: [
                                        {
                                            html: `
                                            <div ng-show="false">
                                                <smss-field>
                                                    <label>
                                                        Enter a unique name for this action
                                                    </label>
                                                    <content>
                                                        <smss-input ng-model="form.pixelHelpers.options.form.list[0].model[0].name" ng-change="form.cleanBindingName(form.pixelHelpers.options.form.list[0].model[0])"></smss-input>
                                                    </content>
                                                </smss-field>
                                            </div>
                                            <smss-field>
                                                <label>
                                                    Select Column/s to Insert:
                                                </label>
                                                <content>
                                                <smss-checklist model="form.pixelHelpers.options.form.list[0].model[0].selected" display="name" multiple
                                                    options="form.pixelHelpers.options.form.list[0].model[0].list" ng-init="form.getModelList('form', 0, 0);">
                                                </smss-checklist>
                                                </content>
                                            </smss-field>
                                            `,
                                        },
                                    ],
                                },
                                model: [
                                    {
                                        name: 'Insert',
                                        selected: [],
                                        list: [],
                                    },
                                ],
                                data: {
                                    // define how to traverse through scope.form.pixelHelpers to get the value to replace with
                                    '<SMSS_FORM_COLUMN>':
                                        'options.form.list.0.model.0.selected',
                                    '<SMSS_FORM_PARAM>':
                                        'options.form.list.0.model.0.selected',
                                },
                            },
                            {
                                name: 'Update',
                                // 'pixel': `Database(database=["${scope.form.app ? scope.form.app.value : ''}"]) | Insert(into=[${scope.form.table ? scope.form.table : ''}__<SMSS_FORM_COLUMN>], values=[(<<SMSS_VALUE>>)]);`,
                                pixel: `Database(database=["${
                                    scope.form.app ? scope.form.app.value : ''
                                }"]) | Update(columns=[<SMSS_FORM_COLUMN>], values=[<SMSS_FORM_PARAM>]) | Filter(<SMSS_FORM_FILTER>) | ExecQuery();`,
                                steps: {
                                    selected: 0,
                                    list: [
                                        {
                                            html: `
                                            <div ng-show="false">
                                                <smss-field>
                                                    <label>
                                                        Enter Unique Name:
                                                    </label>
                                                    <content>
                                                    <smss-input ng-model="form.pixelHelpers.options.form.list[1].model[0].name" ng-change="form.cleanBindingName(form.pixelHelpers.options.form.list[1].model[0])"></smss-input>
                                                    </content>
                                                </smss-field>
                                            </div>
                                            <smss-field>
                                                <label>
                                                    Select Column/s this Update is Based On:
                                                </label>
                                                <content>
                                                <smss-checklist model="form.pixelHelpers.options.form.list[1].model[0].selected" display="name" multiple
                                                    options="form.pixelHelpers.options.form.list[1].model[0].list" ng-init="form.getModelList('form', 1, 0)">
                                                </smss-checklist>
                                                </content>
                                            </smss-field>
                                            `,
                                        },
                                        {
                                            html: `
                                            <smss-field>
                                                <label>
                                                    Select Column/s to Update:
                                                </label>
                                                <content>
                                                    <smss-checklist model="form.pixelHelpers.options.form.list[1].model[1].selected" display="name" multiple
                                                        options="form.pixelHelpers.options.form.list[1].model[1].list" ng-init="form.getModelList('form', 1, 1)">
                                                    </smss-checklist>
                                                </content>
                                            </smss-field>
                                            `,
                                        },
                                    ],
                                },
                                model: [
                                    {
                                        name: 'Update',
                                        selected: [],
                                        list: [],
                                    },
                                    {
                                        selected: [],
                                        list: [],
                                    },
                                ],
                                data: {
                                    // define how to traverse through scope.form.pixelHelpers to get the value to replace with
                                    '<SMSS_FORM_FILTER>':
                                        'options.form.list.1.model.0.selected',
                                    '<SMSS_FORM_COLUMN>':
                                        'options.form.list.1.model.1.selected',
                                    '<SMSS_FORM_PARAM>':
                                        'options.form.list.1.model.1.selected',
                                },
                            },
                            {
                                name: 'Delete',
                                // 'pixel': `Database(database=["${scope.form.app ? scope.form.app.value : ''}"]) | Insert(into=[${scope.form.table ? scope.form.table : ''}__<SMSS_FORM_COLUMN>], values=[(<<SMSS_VALUE>>)]);`,
                                pixel: `Database(database=["${
                                    scope.form.app ? scope.form.app.value : ''
                                }"]) | Delete(from=[<SMSS_FORM_COLUMN>]) | Filter(<SMSS_FORM_FILTER>) | ExecQuery();`,
                                steps: {
                                    selected: 0,
                                    list: [
                                        {
                                            html: `
                                            <div ng-show="false">
                                                <smss-field>
                                                    <label>
                                                        Enter Unique Name:
                                                    </label>
                                                    <content>
                                                    <smss-input ng-model="form.pixelHelpers.options.form.list[2].model[0].name" ng-change="form.cleanBindingName(form.pixelHelpers.options.form.list[2].model[0])"></smss-input>
                                                    </content>
                                                </smss-field>
                                            </div>
                                            <smss-field>
                                                <label>
                                                    Select Column/s to Delete:
                                                </label>
                                                <content>
                                                <smss-checklist model="form.pixelHelpers.options.form.list[2].model[0].selected" display="name" multiple
                                                    options="form.pixelHelpers.options.form.list[2].model[0].list" ng-init="form.getModelList('form', 2, 0)">
                                                </smss-checklist>
                                                </content>
                                            </smss-field>
                                            `,
                                        },
                                    ],
                                },
                                model: [
                                    {
                                        name: 'Delete',
                                        selected: [],
                                        list: [],
                                    },
                                ],
                                data: {
                                    // define how to traverse through scope.form.pixelHelpers to get the value to replace with
                                    '<SMSS_FORM_COLUMN>':
                                        'options.form.list.2.model.0.selected',
                                    '<SMSS_FORM_FILTER>':
                                        'options.form.list.2.model.0.selected',
                                },
                            },
                            {
                                name: 'Custom',
                                pixel: '<SMSS_PIXEL>',
                                steps: {
                                    selected: 0,
                                    list: [
                                        {
                                            html: `
                                            <div ng-show="false">
                                                <smss-field>
                                                    <label>
                                                        Enter Unique Name:
                                                    </label>
                                                    <content>
                                                        <smss-input ng-model="form.pixelHelpers.options.form.list[3].model[0].name" ng-change="form.cleanBindingName(form.pixelHelpers.options.form.list[3].model[0])"></smss-input>
                                                    </content>
                                                </smss-field>
                                            </div>
                                            <smss-field>
                                                <label>
                                                    Enter Pixel Script:
                                                </label>
                                                <content>
                                                    <smss-textarea rows="7" ng-model="form.pixelHelpers.options.form.list[3].model[0].pixel" style="resize: vertical;"></smss-textarea>
                                                </content>
                                            </smss-field>
                                            `,
                                        },
                                    ],
                                },
                                model: [
                                    {
                                        name: 'Custom',
                                        pixel: '',
                                    },
                                ],
                                data: {
                                    '<SMSS_PIXEL>':
                                        'options.form.list.3.model.0.pixel',
                                },
                            },
                        ],
                    },
                },
            };
        }

        /**
         * @name navigateHelper
         * @param {*} direction the direction to navigate back/next
         * @desc navigate the pixel helper steps
         * @returns {void}
         */
        function navigateHelper(direction) {
            var selectedOption = scope.form.pixelHelpers.selected,
                selectedListItem =
                    scope.form.pixelHelpers.options[selectedOption].selected;

            if (direction === 'back') {
                if (
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].steps.selected > 0
                ) {
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].steps.selected--;
                }
            } else if (direction === 'next') {
                if (
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].steps.selected <
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].steps.list.length -
                        1
                ) {
                    scope.form.pixelHelpers.options[selectedOption].list[
                        selectedListItem
                    ].steps.selected++;
                }
            }
        }

        /**
         * @name getSEMOSSValues
         * @param {*} dataToGrab the value to grab
         * @desc grabs values stored internally on the FE
         * @returns {*} returns the value
         */
        function getSEMOSSValues(dataToGrab) {
            var value, logins;

            switch (dataToGrab) {
                case '<SMSS_USER>':
                    logins = semossCoreService.getCurrentLogins();
                    value = semossCoreService.utility.isEmpty(logins)
                        ? ''
                        : logins[Object.keys(logins)[0]];
                    break;
                case '<SMSS_LIMIT>':
                    value = semossCoreService.getOptions(
                        scope.widgetCtrl.widgetId,
                        'limit'
                    );
                    break;
                case '<SMSS_PANEL_ID>':
                    value = semossCoreService.getWidget(
                        scope.widgetCtrl.widgetId,
                        'panelId'
                    );
                    break;
                case '<SMSS_LAYOUT>':
                    value = semossCoreService.getWidget(
                        scope.widgetCtrl.widgetId,
                        'view.visualization.layout'
                    );
                    break;
                case '<SMSS_META>':
                    value = semossCoreService.getWidget(
                        scope.widgetCtrl.widgetId,
                        'meta'
                    );
                    break;
                case '<SMSS_SHARED_STATE>':
                    value = semossCoreService.getWidget(
                        scope.widgetCtrl.widgetId,
                        'view.visualization.tools.shared'
                    );
                    break;
                case '<SMSS_ACTIVE_STATE>':
                    value = semossCoreService.getWidget(
                        scope.widgetCtrl.widgetId,
                        'view.visualization.tools.individual.' +
                            semossCoreService.getWidget(
                                'view.visualization.layout'
                            )
                    );
                    break;
                case '<SMSS_INSIGHT_ID>':
                    value = semossCoreService.getShared(
                        semossCoreService.getWidget(
                            scope.widgetCtrl.widgetId,
                            'insightID'
                        ),
                        'insightID'
                    );
                    break;
                case '<SMSS_FRAME>':
                    value = semossCoreService.getShared(
                        semossCoreService.getWidget(
                            scope.widgetCtrl.widgetId,
                            'insightID'
                        ),
                        'frames.' +
                            scope.widgetCtrl.getWidget(
                                scope.widgetCtrl.widgetId,
                                'frame'
                            )
                    );
                    break;
                case '<SMSS_FRAME_NAME>':
                    value = semossCoreService.getShared(
                        semossCoreService.getWidget(
                            scope.widgetCtrl.widgetId,
                            'insightID'
                        ),
                        'frames.' +
                            scope.widgetCtrl.getWidget(
                                scope.widgetCtrl.widgetId,
                                'frame'
                            ) +
                            '.name'
                    );
                    break;
                case '<SMSS_FRAME_TYPE>':
                    value = semossCoreService.getShared(
                        semossCoreService.getWidget(
                            scope.widgetCtrl.widgetId,
                            'insightID'
                        ),
                        'frames.' +
                            scope.widgetCtrl.getWidget(
                                scope.widgetCtrl.widgetId,
                                'frame'
                            ) +
                            '.type'
                    );
                    break;
                case '<SMSS_CLONE_ID>':
                    value =
                        semossCoreService.getShared(
                            semossCoreService.getWidget(
                                scope.widgetCtrl.widgetId,
                                'insightID'
                            ),
                            'frames.' +
                                scope.widgetCtrl.getWidget(
                                    scope.widgetCtrl.widgetId,
                                    'panelCounter'
                                )
                        ) + 1;
                    break;
                case '<SMSS_INSIGHT>':
                    value = semossCoreService.getShared(
                        semossCoreService.getWidget(
                            scope.widgetCtrl.widgetId,
                            'insightID'
                        ),
                        'insight'
                    );
                    break;
                case '<SMSS_CREDENTIALS>':
                    value = semossCoreService.getCredentials();
                    break;
                default:
                    value = '';
            }

            return value;
        }

        /**
         * @name checkSEMOSSValues
         * @param {String} query the query used to replace smss values
         * @desc this will check to see if the query has semoss values that need to be used
         * @returns {String} the filled in pixel
         */
        function checkSEMOSSValues(query) {
            var tempQuery = query,
                semossVarRegex = new RegExp('<!*SMSS_[\\w_.]+>', 'g'),
                matches = query.match(semossVarRegex) || [],
                matchIdx,
                matchLen,
                variable,
                accessor,
                matchedValue,
                value;

            for (
                matchIdx = 0, matchLen = matches.length;
                matchIdx < matchLen;
                matchIdx++
            ) {
                // remove the start < and end >
                accessor = matches[matchIdx].substring(
                    1,
                    matches[matchIdx].length - 1
                );

                // split so we can remove the param, so we can get it using the accessor
                accessor = accessor.split('.');
                variable = accessor.shift();

                if (variable.indexOf('!') === 0) {
                    variable = variable.substring(1, variable.length);
                }

                // add the start < and end > back
                variable = '<' + variable + '>';

                value = getSEMOSSValues(variable);
                if (typeof value === 'undefined') {
                    // no variable is set
                    continue;
                }

                // get the accessor
                accessor = accessor.join('.');

                // special logic for values that come back as object and user wants to access a specific key in the object
                matchedValue = semossCoreService.utility.getter(
                    value,
                    accessor
                );

                // this is toggling all the booleans...e.g. <!SMSS_SHARED_STATE.displayValue>
                // first character is <
                if (
                    matches[matchIdx].indexOf('!') === 1 &&
                    typeof matchedValue === 'boolean'
                ) {
                    matchedValue = !matchedValue;
                }

                tempQuery = tempQuery.replace(matches[matchIdx], matchedValue);
            }

            return tempQuery;
        }

        /**
         * @name fillPixel
         * @param {*} pixel the pixel to fill
         * @desc completes the pixel
         * @returns {string} filled in pixel
         */
        function fillPixel(pixel) {
            var key = '',
                tempPixel = pixel,
                regex,
                matches,
                matchIdx,
                tempVal;

            tempPixel = checkSEMOSSValues(tempPixel);

            for (key in scope.form.dataModel) {
                if (scope.form.dataModel.hasOwnProperty(key)) {
                    regex = new RegExp(`<!*${key}(\\.{1}original)*>`, 'g');
                    matches = tempPixel.match(regex) || [];

                    for (matchIdx = 0; matchIdx < matches.length; matchIdx++) {
                        tempVal = scope.form.dataModel[key].selected;
                        if (matches[matchIdx].indexOf('.original') > -1) {
                            // TODO need a generic way of doing this instead of specifically looking for original. take a look at widget compiler
                            // tempVal = semossCoreService.utility.isEmpty(scope.form.dataModel[key].original) ? scope.form.dataModel[key].selected : scope.form.dataModel[key].original;
                            if (
                                typeof scope.form.dataModel[key].original ===
                                    'undefined' ||
                                (typeof scope.form.dataModel[key].original ===
                                    'string' &&
                                    scope.form.dataModel[key].original
                                        .length === 0)
                            ) {
                                tempVal = scope.form.dataModel[key].selected;
                            } else {
                                tempVal = scope.form.dataModel[key].original;
                            }
                            // tempVal = (typeof scope.form.dataModel[key].original === 'undefined') || scope.form.dataModel[key].original ? scope.form.dataModel[key].selected : scope.form.dataModel[key].original;
                        }

                        if (Array.isArray(tempVal) && tempVal.length > 0) {
                            // remove the starting and ending [ ] once stringified
                            tempPixel = tempPixel.replace(
                                matches[matchIdx],
                                JSON.stringify(tempVal).slice(1, -1)
                            );
                        } else if (tempVal === 0 || tempVal) {
                            // replace the value as is
                            tempPixel = tempPixel.replace(
                                matches[matchIdx],
                                JSON.stringify(tempVal)
                            );
                        } else if (
                            isDateComponent(matches[matchIdx]) &&
                            tempVal === ''
                        ) {
                            // if its a date component and value to replace is empty string, we need to replace with null instead
                            tempPixel = tempPixel.replace(
                                matches[matchIdx],
                                null
                            );
                        } else {
                            // for empties...replace with empty ""
                            tempPixel = tempPixel.replace(
                                matches[matchIdx],
                                JSON.stringify(tempVal)
                            );
                        }
                    }
                }
            }

            return tempPixel;
        }

        /**
         * @name isDateComponent
         * @param {string} model the model to check component type
         * @desc check to see if the model is of Date component type
         * @returns {boolean} true or false
         */
        function isDateComponent(model) {
            var isDate = false,
                componentIdx,
                component;

            for (
                componentIdx = 0;
                componentIdx < scope.form.content.items.length;
                componentIdx++
            ) {
                if (
                    scope.form.content.items[componentIdx].data ===
                    model.replace('<', '').replace('>', '')
                ) {
                    component = findComponent(
                        scope.form.content.items[componentIdx].html
                    );
                    isDate = component.name === 'Date';
                    break;
                }
            }

            return isDate;
        }

        /**
         * @name isDependsOnFilled
         * @param {array} dependsOn the dependsOn list to check
         * @desc checks to see if dependsOn params are filled
         * @returns {boolean} true or false
         */
        function isDependsOnFilled(dependsOn) {
            var dependsOnIdx,
                filled = true;

            for (
                dependsOnIdx = 0;
                dependsOnIdx < dependsOn.length;
                dependsOnIdx++
            ) {
                if (
                    semossCoreService.utility.isEmpty(
                        scope.form.dataModel[dependsOn[dependsOnIdx]].selected
                    )
                ) {
                    return false;
                }
            }

            return filled;
        }

        /**
         * @name isValidPixel
         * @param {string} pixel the pixel to validate
         * @returns {boolean} true or false
         */
        function isValidPixel(pixel) {
            var idx,
                valid = true,
                itemIdx,
                dependIdx;

            if (!pixel) {
                return false;
            }

            // check to see if any of the internal values were somehow not replaced
            for (idx = 0; idx < scope.form.formKeys.length; idx++) {
                if (pixel.indexOf(scope.form.formKeys[idx]) > -1) {
                    return false;
                }
            }

            for (
                itemIdx = 0;
                itemIdx < scope.form.content.items.length;
                itemIdx++
            ) {
                if (scope.form.content.items[itemIdx].data) {
                    if (
                        pixel.indexOf(
                            '<' + scope.form.content.items[itemIdx].data + '>'
                        ) > -1
                    ) {
                        return false;
                    }

                    if (
                        scope.form.dataModel[
                            scope.form.content.items[itemIdx].data
                        ].dependsOn
                    ) {
                        for (
                            dependIdx = 0;
                            dependIdx <
                            scope.form.dataModel[
                                scope.form.content.items[itemIdx].data
                            ].dependsOn.length;
                            dependIdx++
                        ) {
                            if (
                                pixel.indexOf(
                                    '<' +
                                        scope.form.dataModel[
                                            scope.form.content.items[itemIdx]
                                                .data
                                        ].dependsOn[dependIdx] +
                                        '>'
                                ) > -1
                            ) {
                                return false;
                            }
                        }
                    }
                }
            }

            // check to see if any of the variables were not replaced correctly
            return valid;
        }

        /**
         * @name checkRequiredFields
         * @desc checks to see if all required fields are filled in
         * @returns {boolean} true or false
         */
        function checkRequiredFields() {
            var itemIdx, selectedValue;

            for (
                itemIdx = 0;
                itemIdx < scope.form.content.items.length;
                itemIdx++
            ) {
                if (scope.form.content.items[itemIdx].data) {
                    selectedValue = semossCoreService.utility.getter(
                        scope.form.dataModel,
                        scope.form.content.items[itemIdx].data + '.selected'
                    );
                    if (
                        scope.form.dataModel[
                            scope.form.content.items[itemIdx].data
                        ].required &&
                        ((Array.isArray(selectedValue) &&
                            selectedValue.length === 0) ||
                            (selectedValue !== 0 && !selectedValue))
                    ) {
                        return false;
                    }
                }
            }

            return true;
        }

        /**
         * @name runPixel
         * @param {*} pixel the pixel to run
         * @desc run the pixel
         * @returns {void}
         */
        function runPixel(pixel) {
            var message = semossCoreService.utility.random('execute-pixel'),
                insightID = scope.widgetCtrl
                    ? scope.widgetCtrl.insightID
                    : semossCoreService.get('queryInsightID'),
                completePixel = '',
                groupModel,
                tempModel,
                groupIdx;

            if (!pixel) {
                console.log('Empty Pixel');
                return;
            }

            // TODO ideally this checkGroupings will check the groupings based on the pixel that's going to be run
            // TODO because you can have a form that runs separate pixels and we only need to check for the components that are used in that pixel that's running
            groupModel = checkGroupings();

            // if a group is introduced...we're going to use a special logic to process them.
            // mainly, we treat each item in the group as a new row which translates to having multiple insert/update/delete pixels to do what we want
            // this basically limits how users can use the group component
            if (groupModel && groupModel.length > 0 && groupModel[0].model) {
                // TODO assuming only one group item is used...if we allow multiple group components to be used, we'd need to think about which combinations we want to add
                for (
                    groupIdx = 0;
                    groupIdx < groupModel[0].model.length;
                    groupIdx++
                ) {
                    for (tempModel in groupModel[0].model[groupIdx]) {
                        if (
                            groupModel[0].model[groupIdx].hasOwnProperty(
                                tempModel
                            )
                        ) {
                            scope.form.dataModel[tempModel].selected =
                                groupModel[0].model[groupIdx][tempModel];
                            if (
                                groupModel[0].original &&
                                groupModel[0].original[groupIdx]
                            ) {
                                scope.form.dataModel[tempModel].original =
                                    groupModel[0].original[groupIdx][tempModel];
                            }
                        }
                    }

                    // TODO try to optimize for updates. if selected and original are the same, we prob shouldn't try to update it to the same value.
                    // we'd have to loop through the group and check if all of the values are the same. if so, we skip it
                    completePixel += fillPixel(pixel);
                }
            } else {
                completePixel = fillPixel(pixel);
            }

            if (!checkRequiredFields() || !isValidPixel(completePixel)) {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: 'All required fields must be filled in.',
                    insightID: scope.widgetCtrl
                        ? scope.widgetCtrl.insightID
                        : undefined,
                });

                return;
            }

            // preventing submitting of same form multiple times via multiple consecutive clicks
            if (scope.form.isSubmitting) {
                return;
            }

            // alert(fillPixel(pixel));
            if (scope.form.mode === 'build' || scope.form.mode === 'preview') {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text:
                        'This action will run the following pixel: ' +
                        completePixel,
                    insightID: scope.widgetCtrl
                        ? scope.widgetCtrl.insightID
                        : undefined,
                });
            } else {
                scope.form.isSubmitting = true;

                semossCoreService.once(message, function (response) {
                    // stop loading
                    scope.widgetCtrl.emit('stop-loading', {
                        id: scope.widgetCtrl.widgetId,
                    });

                    // turn off
                    scope.form.isSubmitting = false;

                    if (
                        response.pixelReturn &&
                        response.pixelReturn[0] &&
                        response.pixelReturn[0].operationType.indexOf('ERROR') >
                            -1
                    ) {
                        return;
                    }

                    let altered = false,
                        success = true,
                        tempModels = {},
                        errorMessage = '';

                    for (
                        let outputIdx = 0,
                            outputLen = response.pixelReturn.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        if (
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('ERROR') > -1
                        ) {
                            success = false;
                            errorMessage =
                                response.pixelReturn[outputIdx].output;
                        }

                        // form specific...
                        // lets check the op type that returns, if it's a form type we will grab the orignal values via the pixel again
                        if (
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('ALTER_DATABASE') > -1
                        ) {
                            altered = true;
                        }
                    }

                    if (altered) {
                        // lets grab all of the data models being used in the form
                        for (
                            let itemIdx = 0,
                                itemLen = scope.form.content.items.length;
                            itemIdx < itemLen;
                            itemIdx++
                        ) {
                            if (scope.form.content.items[itemIdx].data) {
                                tempModels[
                                    scope.form.content.items[itemIdx].data
                                ] = '';
                            }

                            if (scope.form.content.items[itemIdx].group) {
                                for (
                                    let groupIndex = 0,
                                        groupLen =
                                            scope.form.content.items[itemIdx]
                                                .group.list.length;
                                    groupIndex < groupLen;
                                    groupIndex++
                                ) {
                                    tempModels[
                                        scope.form.content.items[
                                            itemIdx
                                        ].group.list[groupIndex]
                                    ] = '';
                                }
                            }
                        }
                        for (let model in tempModels) {
                            // we only want to update the options for data models that are used in the form
                            if (tempModels.hasOwnProperty(model)) {
                                // we'll force a cascade here so that we go through the logic to update the options & new originals
                                // pass in true and false to force the cascade
                                cascadeOptions(model, true, false, true);
                            }
                        }

                        // reset the values in the UI to default (clear the form)
                        for (let model in scope.form.dataModel) {
                            if (scope.form.dataModel.hasOwnProperty(model)) {
                                if (
                                    isChecklist(model) &&
                                    !Array.isArray(
                                        scope.form.dataModel[model].defaultValue
                                    )
                                ) {
                                    scope.form.dataModel[model].selected = [
                                        scope.form.dataModel[model]
                                            .defaultValue,
                                    ];
                                } else {
                                    scope.form.dataModel[model].selected =
                                        scope.form.dataModel[
                                            model
                                        ].defaultValue;
                                }
                            }
                        }
                    }

                    if (success) {
                        // default vs custom success messages
                        if (
                            !(
                                response.pixelReturn[0].additionalOutput &&
                                response.pixelReturn[0].additionalOutput[0] &&
                                response.pixelReturn[0].additionalOutput[0].operationType.indexOf(
                                    'SUCCESS'
                                ) > -1
                            )
                        ) {
                            // message = response.pixelReturn[0].additionalOutput[0].output;
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Form was successfully submitted',
                                insightID: scope.widgetCtrl
                                    ? scope.widgetCtrl.insightID
                                    : undefined,
                            });
                        }
                    } else {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: errorMessage,
                            insightID: scope.widgetCtrl
                                ? scope.widgetCtrl.insightID
                                : undefined,
                        });
                    }
                });

                // start loading
                scope.widgetCtrl.emit('start-loading', {
                    id: scope.widgetCtrl.widgetId,
                    message: 'Submitting form...',
                });

                semossCoreService.emit('execute-pixel', {
                    commandList: [
                        {
                            type: 'Pixel',
                            components: [completePixel],
                            terminal: true,
                        },
                    ],
                    insightID: insightID,
                    responseObject: {
                        response: message,
                        payload: {},
                    },
                });
            }
        }

        /**
         * @name generateSaveJSON
         * @desc generate the json to be saved
         * @returns {Object} the json object for the view
         */
        function generateSaveJSON() {
            var json = {
                    html: '',
                    js: [],
                    css: [],
                    pixel: {},
                    data: {},
                    config: {
                        background: scope.form.formBackground,
                    },
                    id: scope.form.uniqueId,
                },
                dataItem,
                pixelItem; // jsIdx, cssIdx;
            //
            if (scope.form.editSource) {
                scope.form.toggleSource();
            }

            json.html = getSourceFromModel();

            for (dataItem in scope.form.dataModel) {
                if (scope.form.dataModel.hasOwnProperty(dataItem)) {
                    json.data[dataItem] = {
                        name: dataItem,
                        options: [],
                        pixel: scope.form.dataModel[dataItem].pixel,
                        defaultValue:
                            scope.form.dataModel[dataItem].defaultValue,
                        config: scope.form.dataModel[dataItem].config,
                        dependsOn: scope.form.dataModel[dataItem].dependsOn,
                        required: scope.form.dataModel[dataItem].required,
                        autoPopulate:
                            scope.form.dataModel[dataItem].autoPopulate,
                        valuePixel: scope.form.dataModel[dataItem].valuePixel,
                        manualOptions:
                            scope.form.dataModel[dataItem].manualOptions,
                        useFullList: scope.form.dataModel[dataItem].useFullList,
                    };
                }
            }

            for (pixelItem in scope.form.pixelModel) {
                if (scope.form.pixelModel.hasOwnProperty(pixelItem)) {
                    json.pixel[pixelItem] = {
                        name: pixelItem,
                        pixel: scope.form.pixelModel[pixelItem].pixel,
                    };
                }
            }

            return json;
        }

        /**
         * @name setData
         * @param {object} options that will be set in the directive
         * @desc sets the data needed to paint the form
         * @returns {void}
         */
        function setData(options) {
            var model,
                pixelModel,
                uniqueIdRegex,
                modelArr = [];
            scope.form.dataModel = options.data;
            scope.form.pixelModel = options.pixel;
            scope.form.sourceCode = options.html;
            scope.form.jsList = options.js;
            scope.form.cssList = options.css;
            scope.form.content.items = [];

            if (options.id) {
                // update all of the unique id's in the source so we don't ever conflict with other panels' unique id when updating css/themes
                uniqueIdRegex = new RegExp(options.id, 'g');
                scope.form.sourceCode = scope.form.sourceCode.replace(
                    uniqueIdRegex,
                    scope.form.uniqueId
                );
                // scope.form.uniqueId = options.id;
                // setThemes(); // reset the uniqueId in the theme to correctly grab the form-content id we're pulling
            }

            if (options.config) {
                if (options.config.background) {
                    scope.form.formBackground = options.config.background;
                }
            }

            // run the data model pixels so we get the options to be used in the html
            for (model in scope.form.dataModel) {
                if (scope.form.dataModel.hasOwnProperty(model)) {
                    scope.form.showManualOptions = scope.form.dataModel[model]
                        .manualOptions
                        ? true
                        : false;
                    scope.form.dataModel[model].selected =
                        scope.form.dataModel[model].defaultValue;
                    modelArr.push(scope.form.dataModel[model]);

                    // TODO make it app and table agnostic
                    if (scope.form.dataModel[model].config) {
                        if (!scope.form.table) {
                            scope.form.table =
                                scope.form.dataModel[model].config.table;
                        }

                        if (!scope.form.app || !scope.form.app.value) {
                            scope.form.app =
                                scope.form.dataModel[model].config.app;
                        }
                    }
                }
            }

            scope.form.addDataBinding(modelArr);

            for (pixelModel in scope.form.pixelModel) {
                if (scope.form.pixelModel.hasOwnProperty(pixelModel)) {
                    scope.form.addPixelBinding(
                        scope.form.pixelModel[pixelModel]
                    );
                }
            }

            scope.form.getViewFromSource();
        }

        /**
         * @name setThemes
         * @desc set the themes
         * @returns {void}
         */
        function setThemes() {
            scope.form.themes = {
                selected: '',
                list: {
                    Blank: {
                        name: 'Blank',
                        icon: require('images/theme-blank.jpg'),
                        style: '',
                    },
                    Blue: {
                        name: 'Blue',
                        icon: require('images/theme-blue.jpg'),
                        style:
                            // DO NOT TRY TO STYLE/SPACE OUT THE BELOW
                            `
<style>
/* ::: Blue ::: */
h3 {
    background-color: #3498db;
    color: #ffffff;
    text-align: center;
}
ul {
    height: calc(100% - 100px);
    background: #ffffff;
    margin: 50px 100px;
}
#form-content-${scope.form.uniqueId} {
    background-color: #253545;
}
.smss-btn {
    background: #3498db;
    color: #ffffff;
    width: 100%;
}
.form-builder__submit {
    text-align: center;
}
.smss-text {
    color: #000000;
    font-weight: bold;
    overflow: inherit;
}
</style>
`,
                    },
                    DHA: {
                        name: 'DHA',
                        icon: require('images/theme-dha.jpg'),
                        style:
                            // DO NOT TRY TO STYLE/SPACE OUT THE BELOW
                            `
<style>
/* ::: DHA ::: */
h3 {
    color: #dcdcdc;
    background-color: #495c7e;
    text-align: center;
}
hr {
    border-bottom: 1.5px solid #590d10;
}
ul {
    height: calc(100% - 100px);
    background-color: #e1e1e1;
    margin: 50px 100px;
    opacity: .95;
}
li {
    opacity: .95;
}
#form-content-${scope.form.uniqueId} {
    background-image: url('core/resources/img/theme-dha.jpg');
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    background-color: #ffffff;
}
.smss-btn {
    font-family: "Verdana", sans-serif;
    font-size: 14px;
    font-weight: normal;
    background: linear-gradient(to top, #f5f5f5 0%, #eeeeee 100%);
    color: #86332d;
}
.form-builder__submit {
    text-align: center;
}
.smss-text {
    color: #86332d;
    font-weight: bold;
    overflow: inherit;
}

</style>
`,
                    },
                },
                Blue: {
                    name: 'Blue',
                    icon: require('images/theme-blue.jpg'),
                    style:
                        // DO NOT TRY TO STYLE/SPACE OUT THE BELOW
                        `
<style>
/* ::: Blue ::: */
h3 {
background-color: #3498db;
color: #ffffff;
text-align: center;
}
ul {
height: calc(100% - 100px);
background: #ffffff;
margin: 50px 100px;
}
#form-content-${scope.form.uniqueId} {
background-color: #253545;
}
.smss-btn {
background: #3498db;
color: #ffffff;
width: 100%;
}
.form-builder__submit {
text-align: center;
}
.smss-text {
color: #000000;
font-weight: bold;
overflow: inherit;
}
</style>
`,
                },
            };
        }

        function setSelectedTheme(styleContent) {
            const pattern = /\/\*\s:{3}\s(.+)\s:{3}\s\*\//,
                name = styleContent.match(pattern);
            let theme;

            if (Array.isArray(name)) {
                scope.form.themes.selected = 'Blank';

                for (theme in scope.form.themes.list) {
                    if (scope.form.themes.list.hasOwnProperty(theme)) {
                        if (scope.form.themes.list[theme].name === name[1]) {
                            scope.form.themes.selected = name[1];
                            break;
                        }
                    }
                }
            } else {
                scope.form.themes.selected = 'Blank';
            }
        }

        /** Initialize */

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var previewListener = semossCoreService.on(
                    'form-preview',
                    function () {
                        scope.form.previewJSON = generateSaveJSON();
                        scope.form.showPreview = true;
                    }
                ),
                editListener = semossCoreService.on(
                    'form-edit-source',
                    function () {
                        scope.form.toggleSource();
                    }
                ),
                setViewListener = semossCoreService.on(
                    'form-set-view',
                    function () {
                        var pixelComponents = [],
                            insightID = scope.widgetCtrl
                                ? scope.widgetCtrl.insightID
                                : semossCoreService.get('queryInsightID');

                        pixelComponents.push({
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                        });

                        pixelComponents.push({
                            type: 'setPanelView',
                            components: [
                                'form-builder',
                                {
                                    json: generateSaveJSON(),
                                },
                            ],
                            terminal: true,
                        });

                        semossCoreService.emit('execute-pixel', {
                            insightID: insightID,
                            commandList: pixelComponents,
                        });
                    }
                ),
                // listens for moose (NLP) response
                fillFormListener = semossCoreService.on(
                    'ai-fill-form',
                    function(answers) {
                        // WORKS BELOW BASED ON WIDGETS DATA MODEL
                        Object.entries(answers).forEach((keyVal) => {
                            const dataModel = scope.form.dataModel[keyVal[0]]
                            if(dataModel) {
                                const dataTypeToCompare = typeof dataModel.options[dataModel.options.length - 1]
                                const answerDataType = typeof keyVal[1]

                                if(dataTypeToCompare === answerDataType) {
                                    dataModel.selected = keyVal[1]
                                } else { // they do not match
                                    if(dataTypeToCompare === "number"){
                                        const convertedAnswer = parseInt(keyVal[1].replace(/\D/g, ''))
                                        if(typeof convertedAnswer !== dataTypeToCompare) {
                                            console.warn(`Unable to parse ${answerDataType}:${keyVal[1]} to bound field ${dataTypeToCompare}:${obj.column}`)
                                        } else {
                                            dataModel.selected = convertedAnswer
                                        }
                                    }
                                }
                            }
                        })

                    }
                )

            if (scope.form.mode === 'build') {
                setLeftMenu();
                setDataFields();
                setContentSection();
                setPixelHelper();
                resetStyleTemplates();
                setThemes();
                if (scope.form.json && scope.form.json.html) {
                    setSelectedTheme(getStyleContent(scope.form.json.html));
                }

                if (scope.form.json) {
                    // setup the data
                    setData(scope.form.json);
                }
            } else if (scope.form.mode === 'preview') {
                scope.form.previewJSON = scope.form.json;
                scope.form.showPreview = true;
                setData(scope.form.previewJSON);
            } else {
                scope.form.loaderJSON = scope.widgetCtrl.getWidget(
                    'view.form-builder.options.json'
                );
            }

            // cleanup
            scope.$on('$destroy', function () {
                previewListener();
                editListener();
                setViewListener();
                fillFormListener();
            });
        }

        initialize();
    }
}
