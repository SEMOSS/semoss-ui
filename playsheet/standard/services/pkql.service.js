(function () {
    'use strict';

    /**
     * @name pkql.service.js
     * @desc the PKQL service directly interfaces with the PKQL endpoint on the Monolith REST API.
     *       used for creating and executing PKQL commands.
     */
    angular.module('app.pkql.service', [])
        .factory('pkqlService', pkqlService);

    pkqlService.$inject = ['$rootScope', '$q', '$timeout', 'monolithService', 'dataService', 'widgetConfigService', '_'];

    function pkqlService($rootScope, $q, $timeout, monolithService, dataService, widgetConfigService, _) {

        var PANEL = "panel",
            MATH = {
                SUM: {name: "Sum", pkql: "m:Sum"},
                AVERAGE: {name: "Average", pkql: "m:Average"},
                COUNT: {name: "Count", pkql: "m:Count"},
                MIN: {name: "Min", pkql: "m:Min"},
                MAX: {name: "Max", pkql: "m:Max"},
                MEDIAN: {name: "Median", pkql: "m:Median"},
                CONCATENATE: {name: "Concatenate", pkql: "m:Concat"},
                STDEV: {name: "StandardDeviation", pkql: "m:StandardDeviation"}
            },
            JOIN_TYPES = {
                INNER: "inner.join",
                PARTIAL: "left.outer.join",
                OUTER: "outer.join"
            },
            OPERATIONS = {
                COLUMN: {
                    ADD: "col.add",
                    FILTER: "col.filter",
                    UNFILTER: "col.unfilter"
                },
                PANEL: {
                    VIZ: ".viz",
                    CONFIG: ".config",
                    COMMENT: {
                        NAME: ".comment",
                        ADD: ".add",
                        EDIT: ".edit",
                        REMOVE: ".remove()"
                    },
                    LOOK_AND_FEEL: ".lookandfeel",
                    CLOSE: ".close()",
                    CLONE: ".clone",
                    TOOLS: ".tools"
                },
                DATA: {
                    IMPORT: "data.import",
                    JOIN: "data.join",
                    QUERY: "data.query"
                }
            };
        /*** PKQL Generation Functions ***/
        /**
         * @name generateDBImportPKQLQuery
         * @param queryType {Boolean} - use data.query if true
         * @param pkqlObject {Object} - engineName{String}, selectors{Array}, filters{Object}, joinType{Array}, triples{Array}, existingConcept{Array}, joinConcept{Array}, joinType{Array}
         * @desc returns the full pkql query for importing data from a db
         */
        function generateDBImportPKQLQuery(pkqlObject, queryType) {
            //e.g. data.import(api:Movie_DB.query([c:Title, c:Title__MovieBudget, c:Studio], (c:Studio =["WB","Fox"]), ([c:Title, right.outer.join , c:Studio]));
            var pkqlQuery = queryType ? OPERATIONS.DATA.QUERY : OPERATIONS.DATA.IMPORT,
                tableJoins = "";

            pkqlQuery += "(api:" + pkqlObject.engineName + ".query(" + createSelectors(pkqlObject.selectors);

            if (pkqlObject.filters && Object.keys(pkqlObject.filters).length > 0) {
                pkqlQuery += ",(" + createFilters(pkqlObject.filters, pkqlObject.filterSigns) + ")";
            }

            if (pkqlObject.triples) {
                var relations = "";
                for (var i = 0; i < pkqlObject.triples.length; i++) {
                    if (pkqlObject.triples[i].length === 1) {
                        continue; //no need to create relation when you have only one item in the triple (there is no relation)
                    }
                    relations += createRelations(JOIN_TYPES.INNER, pkqlObject.triples[i]);
                    relations += ",";
                }

                if (relations) {
                    relations = relations.slice(0, -1);
                    pkqlQuery += ",(" + relations + ")";
                }
            }

            if(pkqlObject.range) {
                if(pkqlObject.range.getCount) {
                    pkqlQuery += ",{'getCount': 'true'}";
                } else {
                    pkqlQuery += ",{'limit':" + pkqlObject.range.limit + ", 'offset':" + pkqlObject.range.offset;
                    pkqlQuery += ", 'getCount': 'false'}";
                }
            }

            pkqlQuery += ")";
            for (var j = 0; j < pkqlObject.existingConcept.length; j++) {
                if (pkqlObject.existingConcept[j] && pkqlObject.joinConcept[j]) {
                    var joinType = "";
                    if (pkqlObject.joinType[j] === "inner") {
                        joinType = JOIN_TYPES.INNER;
                    } else if (pkqlObject.joinType[j] === "partial") {
                        joinType = JOIN_TYPES.PARTIAL;
                    } else if (pkqlObject.joinType[j] === "outer") {
                        joinType = JOIN_TYPES.OUTER;
                    }
                    tableJoins += createTableJoin(pkqlObject.existingConcept[j], joinType, pkqlObject.joinConcept[j]);
                    tableJoins += ",";
                }
            }
            if (tableJoins) {
                tableJoins = tableJoins.slice(0, -1); //remove last comma
                pkqlQuery += ",(" + tableJoins + ")";
            }

            pkqlQuery += ");";

            return pkqlQuery;
        }

        /**
         * @name generateFreeTextPKQLQuery
         * @param csvData {String} - the csvData in the textbox
         * @param pkqlObject {Object} - existingConcepts, joinTypes, newConcepts, delimiter
         * @desc returns the full pkql query for importing free text data
         */
        function generateFreeTextImportPKQLQuery(csvData, pkqlObject) {
            var pkqlQuery = "", tableJoins = "";
            pkqlQuery = OPERATIONS.DATA.IMPORT + "((<startInput>";
            pkqlQuery += csvData;
            pkqlQuery += "<endInput>,\"";
            pkqlQuery += pkqlObject.delimiter + "\")";
            for (var i = 0; i < pkqlObject.tableJoins.length; i++) {
                if (pkqlObject.tableJoins[i].existingConcept.selected && pkqlObject.tableJoins[i].newConcept.selected && pkqlObject.tableJoins[i].joinType.selected) {
                    tableJoins += createTableJoin(pkqlObject.tableJoins[i].existingConcept.selected, pkqlObject.tableJoins[i].joinType.selected, pkqlObject.tableJoins[i].newConcept.selected);
                    tableJoins += ",";
                }
            }

            if (tableJoins) {
                tableJoins = tableJoins.slice(0, -1); //remove last comma
                pkqlQuery += ",(" + tableJoins + ")";
            }

            pkqlQuery += ");";
            return pkqlQuery;
        }

        /**
         * @name generateFreeTextPKQLQuery
         * @param fileLocation {String} - the location of the file
         * @param pkqlObject {Object} - existingConcept, joinType, newConcept, delimiter
         * @desc returns the full pkql query for importing free text data
         */
        function generateFileImportPKQLQuery(fileLocation, pkqlObject) {
            var pkqlQuery = "", tableJoins = "";
            //TODO need to be able to pass other file types

            if (pkqlObject.types && pkqlObject.types.length === pkqlObject.selectors.length) {
                pkqlQuery += 'data.import' + "(api:csvFile.query(" + createSelectors(pkqlObject.selectors) + ",{'file':'" + fileLocation + "'," + createSelectorsWithTypes(pkqlObject.selectors, pkqlObject.types) + "})";
            } else {
                pkqlQuery += 'data.import' + "(api:csvFile.query(" + createSelectors(pkqlObject.selectors) + ",{'file':'" + fileLocation + "'})";
            }


            for (var i = 0; i < pkqlObject.tableJoins.length; i++) {
                if (pkqlObject.tableJoins[i].existingConcept.selected &&
                    pkqlObject.tableJoins[i].newConcept.selected &&
                    pkqlObject.tableJoins[i].joinType.selected) { //if all selected
                    tableJoins += createTableJoin(pkqlObject.tableJoins[i].existingConcept.selected, pkqlObject.tableJoins[i].joinType.selected, pkqlObject.tableJoins[i].newConcept.selected);
                    tableJoins += ",";
                }
            }

            if (tableJoins) {
                tableJoins = tableJoins.slice(0, -1); //remove last comma
                pkqlQuery += ",(" + tableJoins + ")";
            }

            pkqlQuery += ");";

            return pkqlQuery;
        }

        /**
         * @name createSelectors
         * @param selectors {Array}
         * @desc return the selectors in pkql format: '[c:Title, c:Title__MovieBudget, c:Studio]'
         */
        function createSelectorsWithTypes(selectors, types) {
            var selectorComponent = "";
            for (var i = 0; i < selectors.length; i++) {
                if (selectors[i] && types[i]) {
                    selectorComponent += "'" + selectors[i] + "'" + ":" + "'" + types[i] + "'";
                }
                selectorComponent += ","
            }

            if (selectors.length > 0) {
                selectorComponent = selectorComponent.slice(0, -1); //remove last comma
            }
            selectorComponent += "";

            return selectorComponent;
        }


        /**
         * @name generateUrlImportPKQLQuery
         * @param api {String} - the api specifically from import.io
         * @desc returns the full pkql query for importing web data using import.io api - url:'https:....'
         */
        function generateUrlImportPKQLQuery(apiParam, source) {
            var pkqlQuery = "";

            if (source === 'Import.io') {
                pkqlQuery = "data.import(api:ImportIO.Query({'url':'" + apiParam + "'}));";
            } else if (source === 'Amazon Product - Search') {
                pkqlQuery = "data.import(api:AmazonProduct.Query({'itemSearch':'" + apiParam + "'}));";
            } else if (source === 'Amazon Product - Lookup') {
                pkqlQuery = "data.import(api:AmazonProduct.Query({'itemLookup':'" + apiParam + "'}));";
            }
            return pkqlQuery;
        }

        /**
         * @name generateFlatFileUploadQuery
         * @param dbName {String} - the database name that the user entered
         * @desc returns the pkql to run to create a db from flat file upload
         */
        function generateFlatFileUploadQuery(dbName) {
            return 'data.import(api:' + dbName + '.query());';
        }

        /**
         * @name generateEngineInstanceQuery
         * @param engine
         * @param selectors
         */
        function generateEngineInstanceQuery(engine, selectors) {
            var pkqlQuery = "";
            pkqlQuery = "api:" + engine + ".query(" + createSelectors(selectors) + ");";

            return pkqlQuery;
        }

        /** Params **/
        /**
         * @name createParamName
         * @param column
         * @desc creates column name with column and 'ParamOptions
         * @returns {string}
         */
        function createParamOptionsName(column) {
            return "v:" + column + "ParamOptions";
        }

        /**
         * @name createParamInput
         * @param paramOptionsName
         * @param paramName
         * @param selectAmount
         * @param engine
         * @param options
         * @desc create the pkql query to set parameters either based on engine or manually entered options
         * @returns {string}
         */
        function createParamInput(paramOptionsName, paramName, selectAmount, engine, options) {
            if (engine) {
                return "v:" + paramOptionsName + "= user.input(api:" + engine + ".query([" + paramName + "])," + selectAmount + ");";
            } else {
                return "v:" + paramOptionsName + "= user.input(" + options + ")," + selectAmount + ");";
            }
        }

        /**
         * @name createParamOptionsSearch
         * @param paramOptionsName
         * @param searchString
         * @desc returns pkql query to search for options containing the searchString
         * @returns {string}
         */
        function createParamOptionsSearch(paramOptionsName, searchString) {
            return paramOptionsName + ".search(" + searchString + ");"
        }

        /**
         * @createParamOptionsSelected
         * @param paramOptionsName
         * @param selectedValues
         * @desc this will return the pkql query to set selected options for a param
         * @returns {string}
         */
        function createParamOptionsSelected(paramOptionsName, selectedValues) {
            //TODO once backend enables multiselect we will get rid of the single quotes surrounding selectedValues and take in an array
            return "v:" + paramOptionsName + "='" + selectedValues[0] + "';";
        }

        /**
         * @name generateParamQuery
         * @paramName - name of param
         * @selectAmount multi vs single vs user-defined
         * @defaultValues - default values selected
         * @engine - the db to be querying
         * @queryComponents - the components used to query; will not use engine query
         * @returns {string}
         */
        function generateParamQuery(paramName, selectAmount, defaultValues, engine, queryComponents) {
            var pkqlQuery = "";

            pkqlQuery += "v:" + paramName + "=user.input(";

            if (queryComponents) {
                pkqlQuery += queryComponents;
            } else {
                pkqlQuery += "api:" + engine + ".query([c:" + paramName + "])";
            }

            pkqlQuery += "," + selectAmount;

            if (defaultValues && defaultValues.length !== 0) {
                pkqlQuery += "," + defaultValues;
            }

            pkqlQuery += ");";

            return pkqlQuery;
        }

        /*Panel*/
        /**
         * @name generateSavePanelConfigQuery
         * @param panelId {integer} -
         * @param config {object}
         * @desc generates query to save panel config
         */
        function generateSavePanelConfigQuery(panelId, config) {
            var panelConfigQuery = '';

            if (panelId || panelId === 0) {
                panelConfigQuery += (PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.CONFIG + '(');
            }
            else { //TODO remove this? since we should be always passing in a panel id
                panelConfigQuery += (PANEL + OPERATIONS.PANEL.CONFIG + '(');
            }

            panelConfigQuery += JSON.stringify(config);
            panelConfigQuery += ');';

            //since the backend wants all single quotes instead of double quotes
            panelConfigQuery = panelConfigQuery.replace(/"/g, "'");

            return panelConfigQuery;
        }

        /**
         * @name generateClosePanelQuery
         * @param panelId {integer} -
         * @desc generates query to close panel
         */
        function generateClosePanelQuery(panelId) {
            var closeQuery = '';

            closeQuery += (PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.CLOSE + ';');

            return closeQuery;
        }

        /**
         * @name generateDataFrameQuery
         * @param dataFrameType {String}
         * @desc generate query for setting dataframe type grid or graph
         */
        function generateDataFrameQuery(dataFrameType) {
            var pkqlQuery = "";

            pkqlQuery += "data.frame('" + dataFrameType + "');";

            return pkqlQuery;
        }

        /* Filter */
        /**
         * @name generateFilterQuery
         * @param filterOptions {Object} (same as filterPanel filterOption)
         * @param filterColumn {String} Header of Interest
         * @desc creates the complete query for filter/unfilter
         */
        function generateFilterQuery(filterOptions, filterColumn) {
            var filterQuery = "";
            if (filterOptions[filterColumn].useSlider) {
                filterQuery += OPERATIONS.COLUMN.FILTER + "(";
                var pkqlColumn = createColumnName(filterColumn);
                filterQuery += pkqlColumn + ">=[" + filterOptions[filterColumn].selectedRange[0] + "]," + pkqlColumn + "<=[" + filterOptions[filterColumn].selectedRange[1] + "]";
            }
            else if ((filterOptions[filterColumn].selectAll || filterOptions[filterColumn].list.length === 0)) {
                filterQuery += OPERATIONS.COLUMN.UNFILTER + "(";
                filterQuery += createColumnName(filterColumn);
            }
            else {
                filterQuery += OPERATIONS.COLUMN.FILTER + "(";
                var filterObj = {};
                filterObj[filterColumn] = [];
                for (var i = 0; i < filterOptions[filterColumn].list.length; i++) {
                    if (filterOptions[filterColumn].list[i].selected) {
                        filterObj[filterColumn].push(filterOptions[filterColumn].list[i].value);
                    }
                }

                filterQuery += createFilters(filterObj);
            }

            filterQuery += ");";

            return filterQuery;
        }

        /* Visual */
        /**
         * @name generateVisualQuery
         * @param panelId {Number} id of clone visual
         * @param layout {String} layout of the selected visualization
         * @param visualOptionList {Array} selected visual options
         * @desc creates the complete query for visual panel
         */
        function generateVisualQuery(panelId, layout, visualOptionList) {
            var visualQuery = '';

            //change panel
            if (panelId || panelId === 0) {
                visualQuery += (PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.VIZ + '(');
            }
            else {//TODO remove this? since we're always passing in a panel id
                visualQuery += PANEL + OPERATIONS.PANEL.VIZ + '(';
            }
            visualQuery += layout;
            visualQuery += ',';
            visualQuery += "[";
            for (var i = 0; i < visualOptionList.length; i++) {
                if (visualOptionList[i].selected) {
                    //does not have an operation
                    if (visualOptionList[i].grouping) {
                        if (visualOptionList[i].grouping === 'Sum') {
                            visualQuery += MATH.SUM.pkql + '('
                        }
                        else if (visualOptionList[i].grouping === 'Average') {
                            visualQuery += MATH.AVERAGE.pkql + '('
                        }
                        else if (visualOptionList[i].grouping === 'StandardDeviation') {
                            visualQuery += MATH.STDEV.pkql + '('
                        }
                        else if (visualOptionList[i].grouping === 'Count') {
                            visualQuery += MATH.COUNT.pkql + '('
                        }
                        else if (visualOptionList[i].grouping === 'Min') {
                            visualQuery += MATH.MIN.pkql + '('
                        }
                        else if (visualOptionList[i].grouping === 'Median') {
                            visualQuery += MATH.MEDIAN.pkql + '('
                        }
                        else if (visualOptionList[i].grouping === 'Max') {
                            visualQuery += MATH.MAX.pkql + '('
                        }
                        else {
                            console.log('Grouping Not Defined');
                            visualQuery += '';
                            break
                        }


                        if (!_.isEmpty(visualOptionList[i].operation)) {
                            visualQuery += createSelectors([visualOptionList[i].operation.calculatedBy[0]]);
                        }
                        else {
                            visualQuery += createSelectors([visualOptionList[i].selected]);
                        }


                        if (layout !== 'HeatMap') {
                            visualQuery += createSelectors([visualOptionList[0].selected]);
                        }
                        else {
                            visualQuery += createSelectors([visualOptionList[0].selected, visualOptionList[1].selected]);
                        }

                        visualQuery += ')';

                    }
                    else {
                        if (!_.isEmpty(visualOptionList[i].operation)) {
                            visualQuery += createColumnName([visualOptionList[i].operation.calculatedBy[0]]);
                        }
                        else {
                            visualQuery += createColumnName(visualOptionList[i].selected)
                        }
                    }
                }

                visualQuery += ","
            }
            if (visualOptionList.length > 0) {
                visualQuery = visualQuery.slice(0, -1); //remove last comma
            }
            visualQuery += "]";

            visualQuery += ");";
            return visualQuery;
        }

        /* Comment */
        /**
         * @name generateCommentQuery
         * @param panelId {Number} id of clone visual
         * @param commentObj {Object} comment on the selected visual
         * @param commentId
         * @param action {String} comment action
         * @desc creates the complete query for visual panel
         */
        function generateCommentQuery(panelId, commentObj, commentId, action) {
            var commentQuery = '';
            commentQuery += PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.COMMENT.NAME + '[' + commentId + ']';
            if (action === 'add') {
                commentQuery += OPERATIONS.PANEL.COMMENT.ADD + '("';
                commentQuery += commentObj.commentText;
                commentQuery += '",';
                commentQuery += commentObj.type;
                commentQuery += ',';
                commentQuery += JSON.stringify(commentObj.location);
                if (commentObj.groupID !== null) {
                    commentQuery += ',group';
                    commentQuery += commentObj.groupID;
                }

                commentQuery += ');';

                //since the backend wants all single quotes instead of double quotes
                commentQuery = commentQuery.replace(/"/g, "'");
            }
            else if (action === 'remove') {
                commentQuery += OPERATIONS.PANEL.COMMENT.REMOVE + ';';
            }
            else if (action === 'edit') {
                commentQuery += OPERATIONS.PANEL.COMMENT.EDIT + '("';
                commentQuery += commentObj.commentText;
                commentQuery += '",';
                commentQuery += commentObj.type;
                commentQuery += ',';
                commentQuery += JSON.stringify(commentObj.location);
                if (commentObj.groupID !== null) {
                    commentQuery += ',group';
                    commentQuery += commentObj.groupID;
                }

                commentQuery += ');';

                //since the backend wants all single quotes instead of double quotes
                commentQuery = commentQuery.replace(/"/g, "'");
            }
            else {
                return '';
            }

            return commentQuery;
        }

        /**
         * @name generateLookAndFeelQuery
         * @param panelId {Number} id of clone visual
         * @param lookandfeel {Object} lookandfeel options for the selected visual
         * @desc creates the complete query for visual panel
         */
        function generateLookAndFeelQuery(panelId, lookandfeel) {
            var editQuery;
            editQuery = PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.LOOK_AND_FEEL + '(' + JSON.stringify(lookandfeel) + ');';

            //since the backend wants all single quotes instead of double quotes
            editQuery = editQuery.replace(/"/g, "'");
            return editQuery;
        }

        /**
         * @name generateToolsQuery
         * @param panelId {Number} id of clone visual
         * @param tools {Object} tool options for the selected visual
         * @desc creates the complete query for visual panel
         */
        function generateToolsQuery(panelId, tools) {
            var cleanedTools = {};
            // make sure tools object doesnt have empty values
            for (var key in tools) {
                if (tools.hasOwnProperty(key)) {
                    if (tools[key] !== '') {
                        cleanedTools[key] = tools[key];
                    }
                }
            }

            var toolQuery;
            toolQuery = PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.TOOLS + '(' + JSON.stringify(cleanedTools) + ');';

            //backend needs quotes around booleans in the query string
            toolQuery = toolQuery.replace(/false/g, "'false'");
            toolQuery = toolQuery.replace(/true/g, "'true'");

            //since the backend wants all single quotes instead of double quotes
            toolQuery = toolQuery.replace(/"/g, "'");

            return toolQuery;
        }

        /**
         *
         * @param panelId {number} id of the clone visual
         * @param options {object} tool options for the selected visual
         * @param varsArray {array} options that should be left blank to be filled in with default handle
         */
        function generatePKQLwithVars(panelId, tools, varsObj) {
            var cleanedTools = {};
            // make sure tools object doesnt have empty values
            for (var key in tools) {
                if (tools.hasOwnProperty(key)) {
                    if (tools[key] !== '') {
                        cleanedTools[key] = tools[key];
                    }
                }
            }

            for (var item in varsObj) {
                cleanedTools[item] = '<' + varsObj[item] + '>';
            }

            var toolQuery;
            toolQuery = PANEL + '[' + panelId + ']' + OPERATIONS.PANEL.TOOLS + '(' + JSON.stringify(cleanedTools) + ');';

            //backend needs quotes around booleans in the query string
            toolQuery = toolQuery.replace(/false/g, "'false'");
            toolQuery = toolQuery.replace(/true/g, "'true'");

            //since the backend wants all single quotes instead of double quotes
            toolQuery = toolQuery.replace(/"/g, "'");

            return toolQuery;
        }

        /**
         * @name parseSpreadExpression
         * @param spreadExpression
         * @param headers
         * @returns {*}
         * @desc will return the pkql expression equivalent
         */
        function parseSpreadExpression(spreadExpression, headers) {
            if (!spreadExpression) {
                return "";
            }

            if (headers[spreadExpression.column] || spreadExpression.originalValue) {
                return spreadExpression.column ? createColumnName(headers[spreadExpression.column]) : spreadExpression.originalValue;
            }

            return parseSpreadExpression(spreadExpression.left, headers) + spreadExpression.operator.name + parseSpreadExpression(spreadExpression.right, headers);
        }

        /**
         * @name generateSpreadJSQuery
         * @param type {String} - the type of the cell change
         * @param calcStr {String} - the formula from the cell
         * @param headers {Array} - contains the column headers
         * @param tableName {String} - name of the spreadJS table
         * @param newColumnName {String} - name the new column
         * @desc creates the pkql query for a spreadJS formula
         */
        function generateSpreadJSQuery(type, calcStr, headers, tableName, newColumnName) {
            if (_.isEmpty(calcStr)) {
                return;
            }

            var pkqlCommand = "",  //this string is returned
                commandMap = { //TODO: should get this list from backend?
                    "SUM": MATH.SUM.pkql,
                    "AVERAGE": MATH.AVERAGE.pkql,
                    "STDEV": MATH.STDEV.pkql,
                    "MEDIAN": MATH.MEDIAN.pkql,
                    "MIN": MATH.MIN.pkql,
                    "MAX": MATH.MAX.pkql,
                    "CONCATENATE": MATH.CONCATENATE.pkql
                },
                commandsLength = Object.keys(commandMap);

            if (type === 'formula') {//parse the formula
                var instance = new GcSpread.Sheets.Calc.Parser();
                var parsedExpression; // Type: Expression
                parsedExpression = instance.parse(calcStr);

                if (parsedExpression.left || parsedExpression.right) {
                    pkqlCommand += parseSpreadExpression(parsedExpression, headers);
                }

                if (parsedExpression.fn) {
                    pkqlCommand += commandMap[parsedExpression.fn.name];
                    //loop through the function arguments
                    if (parsedExpression.args) {
                        pkqlCommand += "([";
                        for (var i = 0; i < parsedExpression.args.length; i++) {
                            if (!isNaN(parsedExpression.args[i].column)) { //cell reference
                                pkqlCommand += createColumnName(headers[parsedExpression.args[i].column]);
                            }
                            if (parsedExpression.args[i].value) { //value
                                pkqlCommand += "\"" + parsedExpression.args[i].value + "\"";
                            }
                            if (i < (parsedExpression.args.length - 1)) {
                                pkqlCommand += ", ";
                            }
                        }
                        pkqlCommand += "])";
                    } else {
                        pkqlCommand += "([])";
                    }
                }

                //convert cell values to column values
                var reg = new RegExp(tableName, "g");
                pkqlCommand = pkqlCommand.replace(reg, "");

                pkqlCommand = pkqlCommand.replace(/@/g, "");
                //this will replace brackets in the string.....
                //pkqlCommand = pkqlCommand.replace(/[\[\]']+/g, "");
                pkqlCommand = OPERATIONS.COLUMN.ADD + "(" + createColumnName(newColumnName) + ",(" + pkqlCommand + "));";
            }

            return pkqlCommand;
        }

        /**
         * @name generateQueryInParent
         * @param type
         * @desc generates query in parent
         */
        function generateQueryInParent(type) {
            $rootScope.$emit('pub-sub-receive', 'generate-query', {
                type: type
            });
        }

        /** Generation Helpers **/
        /**
         * @name createSelectors
         * @param selectors {Array}
         * @desc return the selectors in pkql format: '[c:Title, c:Title__MovieBudget, c:Studio]'
         */
        function createSelectors(selectors) {
            var selectorComponent = "[";
            for (var i = 0; i < selectors.length; i++) {
                if (selectors[i]) {
                    selectorComponent += createColumnName(selectors[i]);
                }
                selectorComponent += ","
            }
            if (selectors.length > 0) {
                selectorComponent = selectorComponent.slice(0, -1); //remove last comma
            }
            selectorComponent += "]";

            return selectorComponent;
        }

        /**
         * @name createRelations
         * @param joinType {String} - joinType array should align to with triples array
         * @param triple {Array} - triples array should align with joinType array
         * @desc return the relations in pkql format: '[c:Title, right.outer.join , c:Studio]'
         */
        function createRelations(joinType, triple) {
            var relationComponent = "", pkqlJoin;

            relationComponent += "[";
            relationComponent += createColumnName(triple[0]) + ",";
            relationComponent += joinType + ",";
            relationComponent += createColumnName(triple[2]);
            relationComponent += "]";

            return relationComponent;
        }

        /**
         * @name createTableJoin
         * @param existingConcept {String} - the column that is already in the table
         * @param joinType {String} - the join we want to do for these two columns
         * @param newConcept {String} - the column we want to join to. for example: if System is already in the table and we want to join to (or merge) ActiveSystem to System; application will be the newConcept
         * @desc return the table join in pkql format: '([c:System, right.outer.join , c:ActiveSystem])'
         */
        function createTableJoin(existingConcept, joinType, newConcept) {
            //[c:Title, inner.join, c:Title]
            var tableJoinComponent = "[";

            tableJoinComponent += createColumnName(existingConcept) + ",";
            tableJoinComponent += joinType + ",";
            tableJoinComponent += createColumnName(newConcept);

            tableJoinComponent += "]";
            return tableJoinComponent;
        }

        /**
         * @name createFilters
         * @param filters {Object} - {Title: ["WB"]}
         * @param filterSigns {Object} - {Title: "="} indicates what kind of filter we are doing '=', '!=', '?like', etc.
         * @desc return the filters in pkql format: ', (c:Studio__Studio =["WB","Fox"])'
         */
        function createFilters(filters, filterSigns) {
            var filterComponent = "", filterSign = "=";

            for (var filter in filters) {
                filterSign = "=";
                if(filterSigns && filterSigns[filter]) {
                    if(filterSigns[filter]) {
                        filterSign = filterSigns[filter];
                    }
                }

                filterComponent += createColumnName(filter) + filterSign + JSON.stringify(filters[filter]);
                filterComponent += ",";
            }

            filterComponent = filterComponent.slice(0, -1); //remove last/trailing comma
            return filterComponent;
        }

        /**
         * @name createColumnName
         * @param column {String}
         * @desc returns the column name format for query
         * @returns {String}
         */
        function createColumnName(column) {
            return "c:" + column;
        }

        /*** PKQL Execution Functions ***/
        /**
         * @name executePKQL
         * @param insightId {String}
         * @param pkql {String} - pkql command to run
         * @param navigation {Object} - moving between steps
         * @desc executes the pkql command
         */
        function executePKQL(insightId, pkql, navigation, forceRefresh) {
            var currentInsight = dataService.getInsightData();

            if (currentInsight) {
                var originalWidget = dataService.getWidgetData();
                var config = widgetConfigService.getVizConfig(originalWidget.data.chartData.layout);

                if (!config.pkqlEnabled) {
                    //MHS & Custom visualizations
                    if (pkql.indexOf("].close") === -1) {
                        $rootScope.$emit('chart-receive', 'sheet-resize-viz');
                    }
                    return;
                }

                //show the loading screen
                dataService.showWidgetLoadScreen(true);


                //TODO BAD REALLY bAD
                var addpkql = 0;

                //Add Panel Viz to The END
                var selectedWidget = dataService.getWidgetData();
                if (!_.isEmpty(selectedWidget)) {
                    var panelIDVizString = 'panel[' + selectedWidget.panelId + '].viz';
                    if (pkql.indexOf('data.') > -1 || pkql.indexOf('col.') > -1 || pkql.indexOf('panel.viz') > -1 || pkql.indexOf(panelIDVizString) > -1 || forceRefresh) {

                        var continueBool = true;

                        if (continueBool) {
                            var dirtySplitPKQLS = pkql.split(';'), splitPKQLS = [];

                            //remove empty + clean
                            for (var i = 0; i < dirtySplitPKQLS.length; i++) {
                                if (!_.isEmpty(dirtySplitPKQLS[i])) {
                                    splitPKQLS.push(dirtySplitPKQLS[i].trim());
                                }
                            }

                            for (var i = splitPKQLS.length - 1; i >= 0; i--) {
                                if (splitPKQLS[i].indexOf('panel.viz') > -1 || splitPKQLS[i].indexOf(panelIDVizString) > -1) {
                                    //only add if it is calculated and not equal to the last one
                                    if (splitPKQLS[i].indexOf('m:') > -1 && splitPKQLS[i] !== splitPKQLS[splitPKQLS.length - 1]) {
                                        pkql += splitPKQLS[i];
                                        addpkql++;
                                    }

                                    continueBool = false;
                                    break;
                                }
                            }
                        }

                        if (continueBool) {
                            var oldpkql = '', dirtySplitPKQLS = [], splitPKQLS = [];
                            for (var i = 0; i < currentInsight.pkqlData.length; i++) {
                                oldpkql += currentInsight.pkqlData[i]['command'];
                            }

                            //set up dirty
                            dirtySplitPKQLS = oldpkql.split(';');

                            //remove empty + clean
                            for (var i = 0; i < dirtySplitPKQLS.length; i++) {
                                if (!_.isEmpty(dirtySplitPKQLS[i])) {
                                    splitPKQLS.push(dirtySplitPKQLS[i].trim());
                                }
                            }

                            //add from end
                            for (var i = splitPKQLS.length - 1; i >= 0; i--) {
                                if (splitPKQLS[i].indexOf('panel.viz') > -1 || splitPKQLS[i].indexOf(panelIDVizString) > -1) {
                                    //only add if it is calculated and not equal to the last one
                                    if (splitPKQLS[i].indexOf('m:') > -1 && splitPKQLS[i] !== splitPKQLS[splitPKQLS.length - 1]) {
                                        pkql += splitPKQLS[i];
                                        addpkql++;
                                    }

                                    continueBool = false;
                                    break;
                                }
                            }
                        }

                        if (continueBool) {
                            if (selectedWidget.data.chartData && selectedWidget.data.chartData.dataTableKeys) {
                                var tempVisualQuery = panelIDVizString;
                                tempVisualQuery += '(';
                                tempVisualQuery += selectedWidget.data.chartData.layout;
                                tempVisualQuery += ',[';

                                for (var i = 0; i < selectedWidget.data.chartData.dataTableKeys.length; i++) {
                                    if (selectedWidget.data.chartData.dataTableKeys[i].operation && !_.isEmpty(selectedWidget.data.chartData.dataTableKeys[i].operation)) {
                                        tempVisualQuery += selectedWidget.data.chartData.dataTableKeys[i].operation.formula + ','
                                    }
                                    else {
                                        if (selectedWidget.data.chartData.dataTableKeys[i].varKey) {
                                            tempVisualQuery += 'c:' + selectedWidget.data.chartData.dataTableKeys[i].varKey + ','
                                        }
                                    }
                                }

                                if (tempVisualQuery[tempVisualQuery.length - 1] === ',') {
                                    tempVisualQuery = tempVisualQuery.slice(0, -1);
                                }
                                tempVisualQuery += ']);';


                                if (tempVisualQuery.indexOf('m:') > -1 || forceRefresh) {
                                    pkql += tempVisualQuery;
                                    addpkql++;
                                }

                                continueBool = false;
                            }
                        }


                        pkql = pkql.trim();

                        if (pkql[pkql.length - 1] !== ';') {
                            pkql += ';'
                        }
                    }
                }
            }

            if (!insightId) {
                insightId = 'new'
            }

            return monolithService.runPKQLQuery(insightId, pkql).then(function (data) {
                var currentInsight = dataService.getInsightData(),
                    updateDataCalls = [];

                if (currentInsight) {
                    //hide the loading screen
                    dataService.showWidgetLoadScreen(false);
                }

                //for dashboard
                if (data.dashboard) {
                    //update dashboard widgets that are joined or cloned off of base insight
                    $rootScope.$emit('pub-sub-receive', 'sync-data', {
                        widgetData: null,
                        insightData: null,
                        dashboardObject: data
                    });
                }

                for (var i = 0; i < data.insights.length; i++) {
                    //if insightId is false set it as the new one, otherwise make sure they are equal
                    if (!currentInsight.insightId || currentInsight.insightId === data.insights[i]['insightID']) {
                        //TODO FIX
                        while (addpkql > 0) {
                            data.insights[i].pkqlData.pop();
                            addpkql--;
                        }

                        if (!_.isEmpty(currentInsight)) {
                            updateDataCalls.push(dataService.updatePKQL(data.insights[i], navigation));
                        }
                    }
                }

                if (_.isEmpty(updateDataCalls)) {
                    return data.insights;
                }
                return $q.all(updateDataCalls).then(function (data) {
                    //TODO TEMP FIX for Create - returning PKQL
                    return data.insights;
                }.bind(null, data));
            }, function (error) {
                //Save Error
                //hide the loading screen
                dataService.showWidgetLoadScreen(false);

                return $q.reject(error);
            });
        }

        return {
            /*** PKQL Generation Functions ***/
            generateDBImportPKQLQuery: generateDBImportPKQLQuery,
            generateFreeTextImportPKQLQuery: generateFreeTextImportPKQLQuery,
            generateFileImportPKQLQuery: generateFileImportPKQLQuery,
            generateUrlImportPKQLQuery: generateUrlImportPKQLQuery,
            generateFlatFileUploadQuery: generateFlatFileUploadQuery,
            generateEngineInstanceQuery: generateEngineInstanceQuery,
            /* Param */
            createParamOptionsSearch: createParamOptionsSearch,
            createParamOptionsSelected: createParamOptionsSelected,
            generateParamQuery: generateParamQuery,
            /* DataFrame */
            generateDataFrameQuery: generateDataFrameQuery,
            /* Panel */
            generateSavePanelConfigQuery: generateSavePanelConfigQuery,
            generateClosePanelQuery: generateClosePanelQuery,
            /* Filter */
            generateFilterQuery: generateFilterQuery,
            /* Visual */
            generateVisualQuery: generateVisualQuery,
            /* Comment */
            generateCommentQuery: generateCommentQuery,
            /* EditMode */
            generateLookAndFeelQuery: generateLookAndFeelQuery,
            /*Tools*/
            generateToolsQuery: generateToolsQuery,
            generatePKQLwithVars: generatePKQLwithVars,
            /* SpreadJS */
            generateSpreadJSQuery: generateSpreadJSQuery,
            /* Parent Dependent */
            generateQueryInParent: generateQueryInParent,
            /*** PKQL Execution Functions ***/
            executePKQL: executePKQL
        };
    }
})();