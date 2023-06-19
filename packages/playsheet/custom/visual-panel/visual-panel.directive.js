(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */
    angular.module('app.visual-panel.directive', [])
        .directive('visualPanel', visualPanel);

    visualPanel.$inject = ['$rootScope', '_', '$filter', 'monolithService', 'dataService', 'pkqlService', 'widgetConfigService'];

    function visualPanel($rootScope, _, $filter, monolithService, dataService, pkqlService, widgetConfigService) {

        visualPanelCtrl.$inject = ["alertService"];
        visualPanelLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            scope: {},
            restrict: 'EA',
            require: [],
            controllerAs: 'visualPanel',
            bindToController: {},
            templateUrl: 'custom/visual-panel/visual-panel.directive.html',
            controller: visualPanelCtrl,
            link: visualPanelLink
        };

        function visualPanelCtrl(alertService) {
            var visualPanel = this,
                errorMessage = "";

            //variables
            visualPanel.visualizationsList = null; //all the visualization list information
            visualPanel.visualOptionList = [];//list of options pertinent to the selected visualization
            visualPanel.tempVisualOptionList = [];//temporary list of options
            visualPanel.autoDraw = true; //bool to auto draw the visualization
            visualPanel.selectedData = null;//data of the selected viz
            visualPanel.selectedDataHasDuplicates = false; //tracks duplicates in data
            visualPanel.selectedLayout = null; //layout of the selected viz
            visualPanel.loadScreen = false;
            visualPanel.sortableOptions = {
                stop: dragOptionStop,
                items: ".visual-btn-move",
                connectWith: ".visual-bind-content",
                tolerance: "intersect"
            };

            //functions
            visualPanel.resetPanel = resetPanel;
            visualPanel.toggleAutoDraw = toggleAutoDraw;
            visualPanel.toggleVisualPanel = toggleVisualPanel;
            visualPanel.setVisualType = setVisualType;
            visualPanel.checkRequiredSelections = checkRequiredSelections;
            visualPanel.clearAllOptions = clearAllOptions;
            visualPanel.clearVisualOption = clearVisualOption;
            visualPanel.changeGrouping = changeGrouping;
            visualPanel.quickSelect = quickSelect;


            /** Drag Functions **/
            /**
             * @name dragOptionStop
             * @param e - event object
             * @param ui - the draggable object and its contents
             * @desc updates the dropdown option for join type when the input is updated
             */
            function dragOptionStop(e, ui) {
                var option;
                var visualOption;
                var multiField = false;

                //If dropping back into list of data, don't do anything
                if (_.isEmpty(ui.item.sortable.droptarget) || ui.item.sortable.droptarget.parents()[0].className.indexOf("visual-panel-options-container") > -1) {
                    ui.item.sortable.cancel();
                    return;
                }

                //Add Item back to original list
                if (ui.item.sortable.droptarget && e.target != ui.item.sortable.droptarget[0]) {
                    visualPanel.selectedData.headers = JSON.parse(JSON.stringify(visualPanel.fullDataList));
                    visualPanel.selectedData.headers = sortOptionsByType(visualPanel.selectedData.headers);
                }

                //Add to visualOptionList
                //Use droptargetModel to find where what the label is in displayOptions
                var selectedLabel;
                for (var i = 0; i < visualPanel.displayedVisualOptionList.length; i++) {
                    if (ui.item.sortable.droptargetModel === visualPanel.displayedVisualOptionList[i].data) {
                        selectedLabel = visualPanel.displayedVisualOptionList[i].label;
                        if (visualPanel.displayedVisualOptionList[i].multiField) {
                            multiField = visualPanel.displayedVisualOptionList[i].multiField;
                        }
                    }
                }

                //If adding to label and it already has an option, cancel sort and return aka do nothing
                if (!multiField) {
                    //if label is empty, add to that one
                    if (ui.item.sortable.droptargetModel.length > 1) {
                        // ui.item.sortable.cancel();
                        // ui.item.sortable.droptargetModel = ui.item.sortable.droptargetModel.splice(1, ui.item.sortable.droptargetModel.length - 1);
                        // return;
                    }
                    else {
                        //for(var i = 0; i < visualPanel.visualOptionList.length; i++){
                        //    if(visualPanel.visualOptionList[i].name === selectedLabel){
                        //        visualPanel.visualOptionList[i].selected = ui.item.sortable.droptargetModel[0].title;
                        //    }
                        //}
                    }
                }

                //Ensure that duplicate items aren't added to fields that allow multiple options(dimension and value)
                else {
                    //check if it already exists in the grouping (droptargetModel), last element will be most recent
                    var index = ui.item.sortable.droptargetModel.length - 1; //Index of the most recently dragged element
                    for (var i = 0; i < ui.item.sortable.droptargetModel.length - 1; i++) {//Dont check against itself
                        if (ui.item.sortable.droptargetModel[i].title === ui.item.sortable.droptargetModel[index].title) {
                            ui.item.sortable.cancel();
                            ui.item.sortable.droptargetModel = ui.item.sortable.droptargetModel.splice(ui.item.sortable.droptargetModel.length - 1, 1);//remove last element
                            return;
                        }
                    }
                }


                //loop through the array checking for the selected label
                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    if (visualPanel.visualOptionList[i].optionGroup === selectedLabel || visualPanel.visualOptionList[i].name === selectedLabel) {
                        //Setting vars representing the most recent element dragged into visual options
                        //If value, use the latest element dragged into the box
                        if (multiField) {
                            var arrayIndex = visualPanel.displayedVisualOptionList[visualPanel.displayedVisualOptionList.length - 1];
                            option = visualPanel.displayedVisualOptionList[visualPanel.displayedVisualOptionList.length - 1].data[arrayIndex.data.length - 1].title;//change 1 to last element

                            //if there is an empty required field, add element to it
                            if (visualPanel.visualOptionList[i].delete === false && visualPanel.visualOptionList[i].selected === "") {

                                //Set type of selected Option
                                visualPanel.visualOptionList[i].type = visualPanel.displayedVisualOptionList[visualPanel.displayedVisualOptionList.length - 1].data[arrayIndex.data.length - 1].type;
                                visualOption = visualPanel.visualOptionList[i];
                                break;
                            }
                        }
                        else {
                            for (var j = 0; j < visualPanel.visualOptionList.length; j++) {
                                if (visualPanel.visualOptionList[j].name === selectedLabel) {
                                    //set type
                                    //set option and visualOption
                                    visualOption = visualPanel.visualOptionList[j];
                                    option = ui.item.sortable.droptargetModel[ui.item.sortable.droptargetModel.length - 1].title;
                                    break;
                                }
                            }
                            break;
                        }
                    }

                    //If looped through all elements and no empty required element exists, add visual option
                    if (i === visualPanel.visualOptionList.length - 1) {
                        addVisualOption();

                        //New visualOption will be the last index of the array
                        visualOption = visualPanel.visualOptionList[visualPanel.visualOptionList.length - 1];
                        break;
                    }

                }

                //Call paint visualization with new option added
                selectVisualOption(option, visualOption);

            }

            /** Visual Panel **/
            /**
             * @name resetPanel
             * @desc function that is resets panel when selected Widget Changes
             */
            function resetPanel() {
                //resetting variables
                visualPanel.visualOptionList = [];
                visualPanel.tempVisualOptionList = [];
                visualPanel.selectedLayout = null;
                visualPanel.fullDataList = [];
                visualPanel.displayedVisualOptionList = [];


                visualPanel.loadScreen = true;


                //when create loads it has no id initially
                if (visualPanel.selectedData.insightID) {
                    monolithService.getTableHeaders(visualPanel.selectedData.insightID).then(function (data) {
                        var headers = [];

                        for (var i = 0; i < data.tableHeaders.length; i++) {
                            var newHeader = {
                                title: data.tableHeaders[i].uri,
                                filteredTitle: $filter("replaceUnderscores")(data.tableHeaders[i].varKey),
                                type: data.tableHeaders[i].type,
                                operation: ''
                            };

                            headers.push(newHeader);
                        }

                        visualPanel.selectedData.headers = headers;

                        visualPanel.selectedData.headers = sortOptionsByType(visualPanel.selectedData.headers);

                        //load right side based on data frame
                        visualPanel.fullDataList = JSON.parse(JSON.stringify(visualPanel.selectedData.headers));//Saves a copy of the full list of options


                        //load left side based on dataTableAlign or dataTableKeys
                        //initialize visual type and options
                        checkVisualType(visualPanel.selectedData.layout);
                        if (visualPanel.selectedData.dataTableKeys) {
                            setVisualOptionsOnDataTableKeys(visualPanel.selectedData.dataTableKeys);
                        }
                        else if (visualPanel.selectedData.dataTableAlign) {
                            setVisualOptionsOnDataTableAlign(visualPanel.selectedData.dataTableAlign);
                        }
                        else {
                            console.log('set from non data table align');
                        }


                        //after visualOptionsLIst is set, copy it into tempVisualOptionsList if it's empty
                        if (!_.isEmpty(visualPanel.visualOptionList)) {
                            //copy the old selected values list so we can set them when user selects another visualtype
                            if (_.isEmpty(visualPanel.tempVisualOptionList)) {
                                visualPanel.tempVisualOptionList = JSON.parse(JSON.stringify(visualPanel.visualOptionList));
                            }
                        }


                        populateDisplayedVisualOptions();

                        //turn load screen off
                        visualPanel.loadScreen = false;
                    });
                }
            }

            /**
             * @name toggleAutoDraw
             * @desc toggles auto draw and triggers visualizations
             */
            function toggleAutoDraw() {
                visualPanel.autoDraw = !visualPanel.autoDraw;
                if (visualPanel.autoDraw) {
                    visualPanel.checkRequiredSelections();
                }
            }

            /**
             * @name toggleVisualPanel
             * @desc function that toggles open/close the visual panel
             */
            function toggleVisualPanel() {
                dataService.toggleWidgetHandle('tools');
            }

            /** Visual Type ***/
            /**
             * @name setVisualType
             * @desc function that verifies the visualization's layout and the then check if selections are valid
             * @param layout {String} layout of the selected visualization
             */
            function setVisualType(layout) {
                checkVisualType(layout);
                if (visualPanel.autoDraw) {
                    visualPanel.checkRequiredSelections();
                }
                //Reset displayed visual option list
                visualPanel.displayedVisualOptionList = [];
                populateDisplayedVisualOptions();
            }


            /**
             * @name checkVisualType
             * @desc function that verifies the visualization's layout and gets the default options
             * @param layout {String} layout of the selected visualization
             */
            function checkVisualType(layout) {
                //checks if visual type is registered in visualization service, if it is not defaults to a table.
                if (!layout) {
                    //layout = 'Grid';
                    return;
                }

                visualPanel.selectedLayout = layout;

                //get default visual options
                visualPanel.visualOptionList = JSON.parse(JSON.stringify(widgetConfigService.getDefaultVisualOptions(visualPanel.selectedLayout)));

                //if there is nothing selected then we wont add another dimension because there is nothing to add.
                for (var i = 0; i < visualPanel.tempVisualOptionList.length; i++) {
                    //add the selected values as long as you can
                    if (visualPanel.tempVisualOptionList[i].selected) {
                        if (visualPanel.visualOptionList[i]) {
                            visualPanel.visualOptionList[i].selected = visualPanel.tempVisualOptionList[i].selected;
                            visualPanel.visualOptionList[i].operation = visualPanel.tempVisualOptionList[i].operation
                        } else {
                            //try to add new option, some visualizations have limited dimensions
                            addVisualOption();

                            //if it was added, add the selected
                            if (visualPanel.visualOptionList[i]) {
                                visualPanel.visualOptionList[i].selected = visualPanel.tempVisualOptionList[i].selected;
                                visualPanel.visualOptionList[i].operation = visualPanel.tempVisualOptionList[i].operation
                            } else {
                                break;
                            }
                        }
                    } else {
                        break;
                    }
                }
            }

            /** Visual Options **/
            /**
             * @name checkRequiredSelections
             * @desc function that checks the selected options and checks duplicates if necessary
             */
            function checkRequiredSelections() {
                var checkDuplicatesBool = true;
                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    if ((visualPanel.visualOptionList[i].selected === "" && !visualPanel.visualOptionList[i].optional)) {
                        checkDuplicatesBool = false;
                        break;
                    }
                }

                if (checkDuplicatesBool) {
                    checkDuplicates();
                }
            }


            /**
             * @name clearAllOptions
             * @desc function clears all options from the selected chart options
             */
            function clearAllOptions() {
                for (var i = 0; i < visualPanel.displayedVisualOptionList.length; i++) {
                    for (var j = visualPanel.displayedVisualOptionList[i].data.length - 1; j >= 0; j--) {
                        visualPanel.clearVisualOption(visualPanel.displayedVisualOptionList[i], visualPanel.displayedVisualOptionList[i].data[j]);
                    }
                }
            }

            /**
             * @name clearVisualOption
             * @desc function that clears an individual visual option
             * @param param
             * @param option
             */
            function clearVisualOption(param, option) {
                //Remove from displayVisualData
                for (var i = 0; i < param.data.length; i++) {
                    if (param.data[i] === option) {
                        param.data.splice(i, 1);
                        break;
                    }
                }

                //remove from visualDataOption
                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    if ((visualPanel.visualOptionList[i].selected === option.title ) && ((visualPanel.visualOptionList[i].optionGroup === param.label) || (visualPanel.visualOptionList[i].name === param.label))) {
                        if (visualPanel.visualOptionList[i].delete) {
                            //Remove it from the array completely
                            visualPanel.visualOptionList.splice(i, 1);
                            break;

                        }
                        else {
                            visualPanel.visualOptionList[i].selected = "";
                            visualPanel.visualOptionList[i].type = "";
                            visualPanel.visualOptionList[i].operation = {};
                            visualPanel.visualOptionList[i].grouping = false;


                            //if a non-required field exists for value, add it to the required selection field
                            for (var j = 0; j < visualPanel.visualOptionList.length; j++) {
                                if (visualPanel.visualOptionList[j].delete === true && visualPanel.visualOptionList[j].selected !== "" && ((visualPanel.visualOptionList[j].optionGroup === visualPanel.visualOptionList[i].optionGroup) || visualPanel.visualOptionList[j].name === visualPanel.visualOptionList[i].name)) {
                                    visualPanel.visualOptionList[i].selected = visualPanel.visualOptionList[j].selected;
                                    visualPanel.visualOptionList[i].type = visualPanel.visualOptionList[j].type;
                                    visualPanel.visualOptionList[i].operation = visualPanel.visualOptionList[j].operation;
                                    visualPanel.visualOptionList[i].grouping = visualPanel.visualOptionList[j].grouping;
                                    //Remove the non required copy of the field that is now in the required spot
                                    visualPanel.visualOptionList.splice(j, 1);
                                    break;
                                }
                            }
                        }


                    }
                }
                if (visualPanel.autoDraw) {
                    visualPanel.checkRequiredSelections();
                }
            }

            /**
             * @name changeGrouping
             * @desc function that changes the selecetd options grouping
             */
            function changeGrouping(opt, grouping) {
                if (opt.grouping !== grouping) {
                    opt.grouping = grouping;
                    //opt.operation.math = grouping;

                    for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                        if (visualPanel.visualOptionList[i]['selected'] === opt['title']) {
                            visualPanel.visualOptionList[i]['grouping'] = grouping;
                            break;
                        }
                    }

                    if (visualPanel.autoDraw) {
                        visualPanel.checkRequiredSelections();
                    }
                }
            }

            /**
             * @name quickSelect
             * @desc moves the box that was double clicked into the top most empty visual option
             */
            function quickSelect(option) {

                //check to see which dimensions are empty
                var visualOption = false;
                for (var i = 0; i < visualPanel.displayedVisualOptionList.length; i++) {
                    if (visualPanel.displayedVisualOptionList[i].data.length === 0) {
                        //Add dimension that was clicked on to displayedVisualOptionList
                        visualPanel.displayedVisualOptionList[i].data.push(option);


                        //Find the visual option to add it to
                        for (var j = 0; i < visualPanel.visualOptionList.length; j++) {
                            if (visualPanel.visualOptionList[j].optionGroup === visualPanel.displayedVisualOptionList[i].label) {
                                visualOption = visualPanel.visualOptionList[j];
                                break;
                            }
                        }


                        break;
                    }
                    else if (visualPanel.displayedVisualOptionList[i].multiField) {
                        //Add dimension that was clicked on to displayedVisualOptionList
                        visualPanel.displayedVisualOptionList[i].data.push(option);

                        //It is multi so add a new option
                        addVisualOption();

                        //New visualOption will be the last index of the array
                        visualOption = visualPanel.visualOptionList[visualPanel.visualOptionList.length - 1];

                        break;
                    }
                }

                //Call paint visualization with new option added

                if (visualOption) {
                    selectVisualOption(option.title, visualOption);
                }

                ////Add Dimension to visual Option list
                //visualPanel.visualOptionList[j]


            }

            /** Helpers **/
            /**
             * @name sortOptionsByType
             * @param displayedVisualOptions
             * @desc gets a list of the options and sorts the values by its type
             */
            function sortOptionsByType(displayedVisualOptions) {
                var optionsByType = {}, types, sortedOptions = [];


                for (var i = 0; i < displayedVisualOptions.length; i++) {
                    if (!optionsByType[displayedVisualOptions[i].type]) {
                        optionsByType[displayedVisualOptions[i].type] = []
                    }

                    optionsByType[displayedVisualOptions[i].type].push(displayedVisualOptions[i]);
                }

                types = Object.keys(optionsByType);

                //sort so string is last =)
                types.sort();

                for (var i = 0; i < types.length; i++) {
                    //sort alphabetically within a type
                    optionsByType[types[i]].sort(function (a, b) {
                        if (a.filteredTitle < b.filteredTitle) {
                            return -1;
                        }
                        else if (a.filteredTitle > b.filteredTitle) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    });

                    sortedOptions = sortedOptions.concat(optionsByType[types[i]]);
                }

                return sortedOptions;

            }

            /**
             * @name populateDisplayedVisualOptions
             * @desc helps sort and populate displayedVIsualOptions
             */
            function populateDisplayedVisualOptions() {

                //Populate displayedVisualOptionList
                var optionGroups = [];
                //Get unique list of optionGroups
                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    //if it doesn't exist in the new array, delete it
                    var addToList = true;
                    for (var j = 0; j < optionGroups.length; j++) {
                        if (visualPanel.visualOptionList[i].optionGroup === optionGroups[j].label) {
                            addToList = false;
                            break;
                        }
                        //else if(visualPanel.visualOptionList[i].optionGroup === optionGroups[j]) {
                        //    addToList = true;
                        //    continue;
                        //}
                    }
                    if (addToList) {
                        optionGroups.push({
                            label: visualPanel.visualOptionList[i].optionGroup,
                            multiField: visualPanel.visualOptionList[i].multiField
                        });
                    }
                }


                //Populate displayedVisualOptionList
                for (var i = 0; i < optionGroups.length; i++) {
                    visualPanel.displayedVisualOptionList[i] = {};
                    visualPanel.displayedVisualOptionList[i].label = optionGroups[i].label;
                    visualPanel.displayedVisualOptionList[i].data = [];
                    visualPanel.displayedVisualOptionList[i].multiField = optionGroups[i].multiField;
                }

                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    //Add Value to displayedVisualOptionList based on optionGroup
                    for (var j = 0; j < visualPanel.displayedVisualOptionList.length; j++) {
                        if (visualPanel.visualOptionList[i].optionGroup === visualPanel.displayedVisualOptionList[j].label) {
                            if (visualPanel.visualOptionList[i].selected) {
                                var disabled = false;
                                if (visualPanel.visualOptionList[i].operation && visualPanel.visualOptionList[i].operation.calculatedBy && visualPanel.visualOptionList[i].operation.calculatedBy.length > 0) {
                                    var calculatedHeader = visualPanel.visualOptionList[i].operation.calculatedBy[0],
                                        headerValue = _.find(visualPanel.selectedData.headers, {title: calculatedHeader});

                                    if (headerValue && headerValue.type === 'STRING') {
                                        disabled = true;
                                    }
                                }


                                visualPanel.displayedVisualOptionList[j].data.push({
                                    title: visualPanel.visualOptionList[i].selected,
                                    type: visualPanel.visualOptionList[i].type,
                                    grouping: visualPanel.visualOptionList[i].grouping,
                                    disabled: disabled
                                });
                            }
                        }
                    }
                }
            }


            /**
             * @name setVisualOptionsOnDataTableAlign
             * @desc function that checks the visual options of the selected viz with the data and adds them appropriately
             * @params dataTAbleAlign {Object} selected options
             */
            function setVisualOptionsOnDataTableAlign(dataTableAlign) {
                var remainingDataTableAlign = JSON.parse(JSON.stringify(dataTableAlign));
                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    if (!_.isUndefined(remainingDataTableAlign[visualPanel.visualOptionList[i].model])) {
                        visualPanel.visualOptionList[i].selected = remainingDataTableAlign[visualPanel.visualOptionList[i].model];
                        delete  remainingDataTableAlign[visualPanel.visualOptionList[i].model];
                    }
                }

                for (var i in remainingDataTableAlign) {
                    addVisualOption();
                }

                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    if (!_.isUndefined(remainingDataTableAlign[visualPanel.visualOptionList[i].model])) {
                        visualPanel.visualOptionList[i].selected = remainingDataTableAlign[visualPanel.visualOptionList[i].model];
                        delete  remainingDataTableAlign[visualPanel.visualOptionList[i].model];
                    }
                }
            }

            /**
             * @name setVisualOptionsOnDataTableKeys
             * @desc function that checks the visual options of the selected viz with the data and adds them appropriately
             * @params dataTableKeys {Array} selected options
             */
            function setVisualOptionsOnDataTableKeys(dataTableKeys) {
                var remainingDataTableKeys = JSON.parse(JSON.stringify(dataTableKeys));
                for (var i = visualPanel.visualOptionList.length; i < remainingDataTableKeys.length; i++) {
                    addVisualOption();
                }


                for (var i = 0; i < visualPanel.visualOptionList.length; i++) {
                    if (remainingDataTableKeys[i]) {
                        visualPanel.visualOptionList[i].selected = remainingDataTableKeys[i]['uri'];
                        visualPanel.visualOptionList[i].type = remainingDataTableKeys[i]['type'];
                        visualPanel.visualOptionList[i].operation = remainingDataTableKeys[i]['operation'];
                        if (remainingDataTableKeys[i]['operation']) {
                            visualPanel.visualOptionList[i].grouping = remainingDataTableKeys[i]['operation']['math'];
                        }
                    }
                }
            }

            /**
             * @name addVisualOption
             * @desc function that adds out a visual option
             */
            function addVisualOption() {
                var newDim = widgetConfigService.addVisualOptionDimension(visualPanel.selectedLayout, visualPanel.visualOptionList.length);
                if (newDim) {
                    visualPanel.visualOptionList.push(newDim);
                }
            }

            /**
             * @name selectVisualOptions
             * @desc function that verifies the visualization's layout and gets the default options
             */
            function selectVisualOption(headerTitle, opt) {
                if (opt.selected === headerTitle) {
                    opt.selected = '';
                } else {
                    opt.selected = headerTitle;
                }

                visualPanel.tempVisualOptionList = JSON.parse(JSON.stringify(visualPanel.visualOptionList));

                if (visualPanel.autoDraw) {
                    visualPanel.checkRequiredSelections();
                }
            }

            /**
             * @name checkDuplicates
             * @desc function that checks duplicate values in the table and updates the data respectively
             */
            function checkDuplicates() {
                visualPanel.selectedDataHasDuplicates = false;
                if ((visualPanel.selectedLayout === 'Column' || visualPanel.selectedLayout === 'Pie' || visualPanel.selectedLayout === 'Scatter' || visualPanel.selectedLayout === 'Line' || visualPanel.selectedLayout === 'TreeMap' || visualPanel.selectedLayout === 'Radial') && visualPanel.visualOptionList[0].selected) {
                    monolithService.checkDuplicates([visualPanel.visualOptionList[0].selected], visualPanel.selectedData.insightID).then(function (data) {
                        if (data) {
                            visualPanel.selectedDataHasDuplicates = true;

                            //for each visualOption we need to set a grouping type if it has duplicates
                            for (var i = 1; i < visualPanel.visualOptionList.length; i++) {
                                //check if the selected option is calculated
                                var headerValue = _.find(visualPanel.selectedData.headers, {title: visualPanel.visualOptionList[i].selected});
                                if (visualPanel.visualOptionList[i].selected) {
                                    if (headerValue) {
                                        if (!_.isEmpty(visualPanel.visualOptionList[i].selected)) {
                                            visualPanel.visualOptionList[i].grouping = "Average";
                                            if (headerValue.type !== 'NUMBER' && visualPanel.visualOptionList[i].model !== 'series') {
                                                visualPanel.visualOptionList[i].grouping = "Count";
                                            } else if (visualPanel.visualOptionList[i].model === 'series') {
                                                visualPanel.visualOptionList[i].grouping = false;
                                            }
                                        }

                                        //if there is no headerValue, it is temporal
                                    } else {
                                        if (!visualPanel.visualOptionList[i].grouping && visualPanel.visualOptionList[i].operation && visualPanel.visualOptionList[i].operation.math) {
                                            visualPanel.visualOptionList[i].grouping = visualPanel.visualOptionList[i].operation.math
                                        }
                                    }
                                }
                            }

                            createVisualization();
                        }
                        else {
                            //need to set the options so that none have any groupings
                            for (var i = 1; i < visualPanel.visualOptionList.length; i++) {
                                visualPanel.visualOptionList[i].grouping = "";
                                var headerValue = _.find(visualPanel.selectedData.headers, {title: visualPanel.visualOptionList[i].selected});
                                if (!_.isEmpty(visualPanel.visualOptionList[i].selected) && headerValue && headerValue.type !== 'NUMBER' && visualPanel.visualOptionList[i].model !== 'series') {
                                    visualPanel.visualOptionList[i].grouping = "Count";
                                } else if (visualPanel.visualOptionList[i].model === 'series') {
                                    visualPanel.visualOptionList[i].grouping = false;
                                }
                            }

                            visualPanel.selectedDataHasDuplicates = false;
                            createVisualization();
                        }
                    });
                }
                else if (visualPanel.selectedLayout === 'HeatMap' && (visualPanel.visualOptionList[0].selected && visualPanel.visualOptionList[1].selected)) {
                    monolithService.checkDuplicates([visualPanel.visualOptionList[0].selected, visualPanel.visualOptionList[1].selected], visualPanel.selectedData.insightID).then(function (data) {
                            var headerValue = _.find(visualPanel.selectedData.headers, {title: visualPanel.visualOptionList[2].selected});
                            if (data) {
                                visualPanel.selectedDataHasDuplicates = true;
                                if (visualPanel.visualOptionList[2].selected) {
                                    if (headerValue) {
                                        visualPanel.visualOptionList[2].grouping = 'Average';
                                        if (headerValue.type !== 'NUMBER' && visualPanel.visualOptionList[2].model !== 'series') {
                                            visualPanel.visualOptionList[2].grouping = "Count";
                                        }
                                    } else {
                                        if (!visualPanel.visualOptionList[2].grouping && visualPanel.visualOptionList[2].operation && visualPanel.visualOptionList[2].operation.math) {
                                            visualPanel.visualOptionList[2].grouping = visualPanel.visualOptionList[2].operation.math
                                        }
                                    }
                                }
                                createVisualization();
                            }
                            else {
                                visualPanel.visualOptionList[2].grouping = "";
                                if (headerValue && headerValue.type !== 'NUMBER') {
                                    visualPanel.visualOptionList[2].grouping = "Count";
                                    visualPanel.visualOptionList[2].disableRadioBtn = true;
                                }


                                visualPanel.selectedDataHasDuplicates = false;
                                createVisualization();
                            }
                        }
                    )
                }
                else {
                    visualPanel.selectedDataHasDuplicates = false;
                    createVisualization();
                }
            }

            /**
             * @name createVisualization
             * @desc function that creates the visualization based on the passed in values
             */
            function createVisualization() {
                var visualQuery = pkqlService.generateVisualQuery(visualPanel.currentWidget.panelId, visualPanel.selectedLayout, visualPanel.visualOptionList);

                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, visualQuery);
            }
        }

        function visualPanelLink(scope, ele, attrs, ctrl) {
            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                scope.visualPanel.visualizationsList = widgetConfigService.getVisualizationsObj();
                scope.visualPanel.currentWidget = dataService.getWidgetData();
                if (scope.visualPanel.currentWidget && scope.visualPanel.currentWidget.data) {
                    scope.visualPanel.selectedData = scope.visualPanel.currentWidget.data.chartData;
                }
                if (scope.visualPanel.selectedData) {
                    scope.visualPanel.resetPanel();
                }
            }

            initialize();

            //listeners
            var visualPanelUpdateListener = $rootScope.$on('update-data', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-data');
                scope.visualPanel.currentWidget = dataService.getWidgetData();
                if (scope.visualPanel.currentWidget && scope.visualPanel.currentWidget.data) {
                    scope.visualPanel.selectedData = scope.visualPanel.currentWidget.data.chartData;
                }
                if (scope.visualPanel.selectedData) {
                    scope.visualPanel.resetPanel();
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying visualPanel....');
                visualPanelUpdateListener();
            });
        }
    }
}());
