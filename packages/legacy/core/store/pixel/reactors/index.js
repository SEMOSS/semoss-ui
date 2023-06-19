/**
 * @name flattenSelector
 * @desc Takes the selected selector and flattens it
 * @param {*} selector current selector
 * @returns {string} the final flattened selector
 */
function flattenSelector(selector) {
    if (!selector) {
        return '';
    }

    const { type, content } = selector;

    if (type === 'FUNCTION') {
        return `${selector.content.function} ( ${content.innerSelectors
            .map((s) => {
                return flattenSelector(s);
            })
            .join('')} )`;
    } else if (type === 'ARITHMETIC') {
        return `( ${flattenSelector(content.left[0])} ${
            content.mathExpr
        } ${flattenSelector(content.right[0])} )`;
    } else if (type === 'COLUMN') {
        if (content.column === 'PRIM_KEY_PLACEHOLDER') {
            return content.table;
        }

        return content.table
            ? `${content.table}__${content.column}`
            : `${content.column}`;
    } else if (type === 'CONSTANT') {
        if (typeof content.constant === 'number') {
            return content.constant;
        }

        return `"${content.constant}"`;
    } else if (type === 'IF_ELSE') {
        return `If( (${flattenFilter(content.condition)}), (${flattenSelector(
            content.precedent
        )}), (${flattenSelector(content.antecedent)}) )`;
    }

    return '';
}

/**
 * @name flattenFilter
 * @desc Takes the selected filter and flattens it
 * @param {*} filter - current filter
 * @returns {string} - the final flattened filter
 */
function flattenFilter(filter) {
    if (!filter) {
        return '';
    }

    const type = filter.type,
        content = filter.content;

    if (type === 'OR' || type === 'AND') {
        if (!content || content.length === 0) {
            return '';
        }

        return `(${content.map((c) => flattenFilter(c)).join(` ${type} `)})`;
    } else if (type === 'SIMPLE') {
        const components = [],
            chunks = [content.left, content.right];

        while (chunks.length > 0) {
            let chunk = chunks.shift(),
                component = '';

            if (!chunk) {
                continue;
            }

            if (chunk.pixelType === 'COLUMN') {
                component = flattenSelector(chunk.value[0]);
            } else if (
                chunk.pixelType === 'BOOLEAN' ||
                chunk.pixelType === 'NULL_VALUE' ||
                chunk.pixelType === 'CONST_STRING' ||
                chunk.pixelType === 'CONST_INT' ||
                chunk.pixelType === 'CONST_DATE' ||
                chunk.pixelType === 'CONST_DECIMAL' ||
                chunk.pixelType === 'LAMBDA'
            ) {
                component = `${
                    Array.isArray(chunk.value)
                        ? JSON.stringify(chunk.value)
                        : JSON.stringify([chunk.value])
                }`;
            }

            if (component) {
                components.push(component);
            }
        }

        return `(${components.join(` ${content.comparator} `)})`;
    }

    return '';
}

const REACTORS = {
    /**
     * @name Pixel
     * @param {string} query - raw query
     * @returns {string} query
     */
    Pixel: function (query) {
        return query;
    },

    /**
     * @name variable
     * @param {string} query - pixel variable
     * @returns {string} query
     */
    variable: function (query) {
        return query;
    },

    /**
     * @name if
     * @param {array} conditionalComponentsArray - conditional component array
     * @param {array} trueComponentsArray - true component array
     * @param {array} falseComponentsArray - falsestatement component array
     * @returns {string} query
     */
    if: function (
        conditionalComponentsArray,
        trueComponentsArray,
        falseComponentsArray
    ) {
        var query = '',
            trueIdx,
            falseIdx;

        query += 'if(  (';
        query += this.trim(this.build(conditionalComponentsArray), ';');
        query += ') , (';
        if (trueComponentsArray && trueComponentsArray.length > 0) {
            for (trueIdx = 0; trueIdx < trueComponentsArray.length; trueIdx++) {
                if (
                    trueIdx === 0 ||
                    trueComponentsArray[trueIdx - 1].terminal
                ) {
                    query += '(';
                }
                query += this.trim(
                    this.build([trueComponentsArray[trueIdx]]),
                    ';'
                );
                if (trueComponentsArray[trueIdx].terminal) {
                    query += ')';
                }
                if (
                    trueIdx !== trueComponentsArray.length - 1 &&
                    trueComponentsArray[trueIdx].terminal
                ) {
                    query += ',';
                }
            }
        } else {
            query += 'true';
        }
        query += ') , (';
        if (falseComponentsArray && falseComponentsArray.length > 0) {
            for (
                falseIdx = 0;
                falseIdx < falseComponentsArray.length;
                falseIdx++
            ) {
                if (
                    falseIdx === 0 ||
                    falseComponentsArray[falseIdx - 1].terminal
                ) {
                    query += '(';
                }
                query += this.trim(
                    this.build([falseComponentsArray[falseIdx]]),
                    ';'
                );
                if (falseComponentsArray[falseIdx].terminal) {
                    query += ')';
                }
                if (
                    falseIdx !== falseComponentsArray.length - 1 &&
                    falseComponentsArray[falseIdx].terminal
                ) {
                    query += ',';
                }
            }
        } else {
            query += 'false';
        }
        query += ') )';

        return query;
    },

    /**
     * @name date
     * @returns {string} query
     */
    date: function () {
        var query = '';
        query += 'Date()';
        return query;
    },

    /**
     * @name getUserInfo
     * @returns {string} query
     */
    getUserInfo: function () {
        var query = '';
        query += 'GetUserInfo()';
        return query;
    },

    /**
     * @name if
     * @param {array} conditionalComponentsArray - conditional component array
     * @param {array} trueComponentsArray - true component array
     * @returns {string} query
     */
    ifError: function (conditionalComponentsArray, trueComponentsArray) {
        var query = '';

        query += 'ifError(  (';
        query += this.trim(this.build(conditionalComponentsArray), ';');
        query += ') , (';

        if (trueComponentsArray.length === 0) {
            query += 'true';
        } else {
            query += this.trim(this.build(trueComponentsArray), ';');
        }

        query += ') )';

        return query;
    },

    /** *Insight */
    /**
     * @name openEmptyInsight
     * @desc open an empty insight
     * @param {string} recipe - recipe to run
     * @param {object} params - params to add to the recipe
     * @returns {string} query
     */
    openEmptyInsight: function (recipe, params) {
        var query = '';

        query += 'OpenEmptyInsight(';

        if (recipe) {
            query += 'recipe=["<sEncode>' + recipe + '</sEncode>"]';
        }

        if (params) {
            query += ' params=["' + JSON.stringify(params) + '"] ';
        }

        query += ');';

        return query;
    },

    /**
     * @name OpenInsight
     * @param {string} project - app to grab the insight from
     * @param {string} rdbmsId - id of the insight
     * @param {object} params - params to add to the recipe
     * @param {string} postQuery - pixel to run after opening
     * @param {boolean} useExistingInsight - open insight using an existing opened insight if it exists
     * @desc open an insight
     * @returns {string} query
     */
    openInsight: function (
        project,
        rdbmsId,
        params,
        postQuery,
        useExistingInsight
    ) {
        var query = '';

        query +=
            'OpenInsight(project=["' + project + '"], id=["' + rdbmsId + '"]';

        if (params) {
            query += ', params=["' + params + '"]';
        }

        if (postQuery) {
            query += ', additionalPixels=["' + postQuery + '"]';
        }

        if (useExistingInsight) {
            query += ', useExistingIfOpen=[true]';
        }

        query += ');';

        return query;
    },

    /**
     * @name IsInsightParameterized
     * @param {string} projectId - app to grab the insight from
     * @param {string} insightId - id of the insight
     * @desc checks if an insight has parameters
     * @returns {string} query
     */
    isInsightParameterized: function (projectId, insightId) {
        var query = '';

        query +=
            'IsInsightParameterized(project=["' +
            projectId +
            '"], id=["' +
            insightId +
            '"]';
        query += ');';

        return query;
    },

    /**
     * @name SetOpenInsightParamValue
     * @param {object} insightParams - app to grab the insight from
     * @desc checks if an insight has parameters
     * @returns {string} query
     */
    setOpenInsightParamValue: function (insightParams) {
        var query = '';
        if (insightParams && Object.keys(insightParams).length > 0) {
            query += 'SetOpenInsightParamValue({';
            for (let key in insightParams) {
                if (insightParams.hasOwnProperty(key)) {
                    query += '"' + key + '": ';
                    query += JSON.stringify(insightParams[key]);
                    query += ', ';
                }
            }
            // Remove last comma space (, )
            query = query.slice(0, -2);
            query += '})';
        }
        return query;
    },

    /**
     * @name databaseRecommendations
     * @desc get all recommended apps
     * @returns {string} query
     */
    databaseRecommendations: function () {
        var query = '';

        query += 'DatabaseRecommendations()';

        return query;
    },

    /**
     * @name widgetTracking
     * @desc send widget tracking (user clicks)
     * @param {array} insightChanges - boolean to only show local apps; if false include external apps
     * @returns {string} query
     */
    widgetTracking: function (insightChanges) {
        var query = '';

        query += 'WidgetT(' + JSON.stringify(insightChanges) + ')';

        return query;
    },

    /**
     * @name clearInsight
     * @param {boolean} suppress to suppress the optype so we don't react (in the case of pipeline)
     * @desc clears an insight
     * @returns {string} query
     */
    clearInsight: function (suppress) {
        var query = '';

        query += 'ClearInsight(';

        if (suppress) {
            query += 'suppress=["' + suppress + '"]';
        }

        query += ')';

        return query;
    },
    /**
     * @name dropInsight
     * @desc drops an insight
     * @returns {string} query
     */
    dropInsight: function () {
        var query = '';

        query = 'DropInsight()';

        return query;
    },

    /**
     * @name getSpecificInsightMeta
     * @param {string} project the project id
     * @param {string} insightId the insight id
     * @desc get the specific meta information for this insight
     * @returns {string} the pixel component
     */
    getSpecificInsightMeta: function (project, insightId) {
        // GetSpecificInsightMeta ( project=["ccebb957-ec6e-4622-9d71-640016744ad5"], id=["551983e5-34ac-4e26-a1f5-92f919b6615c"] ) ;
        var query = '';

        query = `GetSpecificInsightMeta(project=["${project}"], id=["${insightId}"])`;

        return query;
    },

    /**
     * @name setInsightMetadata
     * @param {string} project the project id
     * @param {string} insightId the insight id
     * @param {map} meta a map of metadata to set for the insight
     * @desc set the insight metadata
     * @returns {string} the pixel component
     */
    setInsightMetadata: function (project, insightId, meta) {
        var query = '';

        query = `SetInsightMetadata(project=["${project}"], id=["${insightId}"], meta=${JSON.stringify(
            meta
        )})`;

        return query;
    },

    /**
     * @name getAvailableTags
     * @param {string} project the project id
     * @desc get the list of available tags for this insight
     * @returns {string} the pixel component
     */
    getAvailableTags: function (project) {
        // GetAvailableTags(project=["ccebb957-ec6e-4622-9d71-640016744ad5"]);
        var query = '';

        query += 'GetAvailableTags(';
        if (project) {
            query += `project=["${project}"]`;
        }
        query += ')';

        return query;
    },

    /**
     * @name getDatabaseMetaValues
     * @param {string} key the meta key to search options on
     * @desc get the list of available options for the provided key
     * @returns {string} the pixel component
     */
    getDatabaseMetaValues: function (keys) {
        var query = '';

        query += 'GetDatabaseMetaValues(';
        if (keys) {
            query += `metaKeys=${JSON.stringify(keys)}`;
        }
        query += ')';

        return query;
    },

    /**
     * @name getDatabaseMetakeyOptions
     * @param {string} key the meta key to search options on
     * @desc get the list of available field options or check if the key provided exists
     * @returns {string} the pixel component
     */
    getDatabaseMetakeyOptions: function (key) {
        var query = '';

        query += 'GetDatabaseMetakeyOptions(';
        if (key) {
            query += `metaKeys=${JSON.stringify(key)}`;
        }
        query += ')';

        return query;
    },

    /**
     * @name getDatabaseMetadata
     * @desc retrieve database meta values for given keys
     * @param {string} database - the database name
     * @param {array} metakeys - database metakeys to retrieve value for.
     * @returns {string} the pixel query
     */
    getDatabaseMetadata: function (database, metakeys) {
        var query = '';

        query += `GetDatabaseMetadata(`;
        query += `database=["${database}"]`;
        if (metakeys) {
            query += `, metaKeys=${JSON.stringify(metakeys)}`;
        }
        query += `)`;

        return query;
    },

    /**
     * @name getDatabaseMarkdown
     * @param {string} databaseId database id
     * @desc get the markdown for the given database
     * @returns {string} the pixel component
     */
    getDatabaseMarkdown: function (databaseId) {
        var query = '';

        query = `GetDatabaseMarkdown(database=["${databaseId}"])`;

        return query;
    },

    /**
     * @name getAsset
     * @param {string} space - space of file
     * @param {string} file - filepath
     * @returns {string} query
     */
    getAsset: function (space, file) {
        var query = '';

        query = `GetAsset(filePath=["${file}"], space=["${space}"])`;

        return query;
    },

    /** Data**/

    /**
     * @name filePaste
     * @param {string} pastedData - type of file
     * @param {string} delimiter - the delimiter to use to parse the data
     * @returns {string} query
     */
    filePaste: function (pastedData, delimiter) {
        var query = '';

        query = 'TextInput(fileData=["<encode>' + pastedData + '</encode>"],';
        query += 'delim=["' + delimiter + '"]';

        query += ')';

        return query;
    },
    /**
     * @name fileRead
     * @param {string} fileType - type of file
     * @param {string} path - path of the file
     * @param {string} sheetName - name of the sheet to read for excel
     * @param {string} sheetRange - range of sheet
     * @param {object} dataTypeMap - the types for the headers
     * @param {string} delimiter - the delimiter to use to parse the data
     * @param {array} newHeaders - the new header names
     * @param {string} plainFileName - file name without path, timestamp, and extension
     * @param {object} additionalDataTypes - if data type has formatting, we map the formatting to the data type here
     * @returns {string} query
     */
    fileRead: function (
        fileType,
        path,
        sheetName,
        sheetRange,
        dataTypeMap,
        delimiter,
        newHeaders,
        plainFileName,
        additionalDataTypes
    ) {
        var query = '';

        query = 'FileRead(filePath=["' + path + '"],';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '],';
        query += 'delimiter=["' + delimiter + '"],';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '],';

        if (fileType === 'excel') {
            query += 'sheetName=["' + sheetName + '"],';
            query += 'sheetRange=["' + sheetRange + '"], ';
        }

        query += 'fileName=["' + plainFileName + '"], ';

        query +=
            'additionalDataTypes=[' + JSON.stringify(additionalDataTypes) + ']';

        query += ')';

        return query;
    },
    /**
     * @name createSource
     * @param {string} sourceType - type of source e.g Database or Frame
     * @param {string} sourceName - name of the source you are pulling from
     * @param {string} alias - used to identify newly created source
     * @desc create the source component e.g. CreateFrame(grid).as(['frame'])
     * @returns {string} query
     */
    createSource: function (sourceType, sourceName, alias) {
        var query = '';

        query += 'Create' + sourceType + '(' + sourceName + ')';

        if (alias) {
            query += ".as(['" + alias + "'])";
        }

        return query;
    },

    /**
     * @name removeFrame
     * @param {string} frameName the name of the frame to remove
     * @desc remove the frame
     * @returns {string} query
     */
    removeFrame: function (frameName) {
        var query = '';

        query += 'RemoveFrame("' + frameName + '")';

        return query;
    },

    /**
     * @name getFrames
     * @desc get the available (active) frames
     * @returns {string} query
     */
    getFrames: function () {
        var query = '';

        query += 'GetFrames()';

        return query;
    },

    /**
     * @name removeVariable
     * @param {string} variable - variable to remove
     * @desc removes a variable
     * @returns {string} query
     */
    removeVariable: function (variable) {
        var query = '';

        query += 'RemoveVariable("' + variable + '")';

        return query;
    },

    /**
     * @name currentVariables
     * @desc gets the variables and their values on backend
     * @return {void}
     */
    currentVariables: function () {
        var query = '';

        query += 'CurrentVariables()';

        return query;
    },

    /**
     * @name source
     * @param {string} sourceType - type of source e.g Database or Frame
     * @param {string} sourceName - name of the source you are pulling from
     * @desc create the source component e.g. Database("Movie_DB")
     * @returns {string} query
     */
    source: function (sourceType, sourceName) {
        var query = '';

        query += sourceType;

        query += '(';

        if (sourceName) {
            query += sourceName;
        }

        query += ')';

        return query;
    },

    /**
     * @name frame
     * @param {string} frame - frame that you are importing
     * @desc create the frame component e.g. Frame(ABCD)
     * @returns {string} query
     */
    frame: function (frame) {
        var query = '';

        query += 'Frame(';
        if (frame) {
            query += ' frame=[' + frame + '] ';
        }
        query += ')';

        return query;
    },

    /**
     * @name database
     * @param {string} database - database that you are importing
     * @desc create the frame component e.g. Database(Movie_DB)
     * @returns {string} query
     */
    database: function (database) {
        var query = '';

        query += 'Database(';
        query += ' database=["' + database + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name distinct
     * @param {boolean} distinct - whether database is distinct or not
     * @desc create the frame component e.g. Distinct(false)
     * @returns {string} query
     */
    distinct: function (distinct) {
        var query = '';

        query = `Distinct(${distinct})`;

        return query;
    },

    /**
     * @name adminDatabase
     * @param {string} database - database that you are importing
     * @param {string} encode - database that you are importing
     * @param {string} collect - database that you are importing
     * @desc create the frame component e.g. Database(Movie_DB)
     * @returns {string} query
     */
    adminDatabase: function (database, encode, collect) {
        var query = '';

        query += 'AdminDatabase("' + database + '")';
        query += '| Query("<encode>' + encode + '</encode>")';
        if (collect > 0) {
            query += '| Collect(' + collect + ');';
        } else {
            query += '| AdminExecQuery();';
        }

        return query;
    },

    /**
     * @name jdbcSource
     * @param {object} conDetails - JSON string map of connection details
     * @desc create the frame component e.g. Database(Movie_DB)
     * @returns {string} query
     */
    jdbcSource: function (conDetails) {
        var query = '';

        query += 'JdbcSource(';
        query += 'conDetails=[' + JSON.stringify(conDetails || {}) + ']';
        query += ')';

        return query;
    },

    /**
     * @name query
     * @param {string} queryText - raw query you want to query
     * @desc create the query component e.g. Query("Select....")
     * @returns {string} query
     */
    query: function (queryText) {
        var query = '';
        query += 'Query("<encode>';
        query += queryText;
        query += '</encode>")';
        return query;
    },

    /**
     * @name addPreDefinedParam
     * @param {string} queryDetails - map containing details to generate teh pre defined parameter
     * @param {string} databaseId - databaseId
     * @desc create the query component e.g. Query("Select....")
     * @returns {string} query
     */
    addPreDefinedParam: function (queryDetails, databaseId) {
        var query = 'AddPreDefinedParameter(';
        query +=
            'preDefinedParamStruct=[' +
            JSON.stringify(queryDetails || {}) +
            '],';
        query += 'database=["' + databaseId + '"]';
        query += ')';
        return query;
    },

    /**
     * @name select2
     * @param {array} selectors - list of the selectors to add
     * @desc create the select component e.g. Select(Title,Studio)
     * @returns {string} query
     */
    select2: function (selectors) {
        var query = '',
            i,
            hasAlias = true,
            len = selectors.length;

        query += 'Select(';

        for (i = 0; i < len; i++) {
            // Add grouping to query if applicable
            if (selectors[i].selector) {
                query += selectors[i].selector;
            } else if (selectors[i].math && selectors[i].calculatedBy) {
                query +=
                    selectors[i].math + '(' + selectors[i].calculatedBy + ')';
            } else {
                query += selectors[i].alias;
            }

            // can't add an alias if it isn't there or missing...
            if (!selectors[i].alias) {
                hasAlias = false;
                console.error('Alias is needed!');
            }
            query += ', ';
        }

        // trim trailing comma
        query = this.trim(query, ',');

        query += ')'; // Select(Title)

        // add the alias
        if (hasAlias) {
            query += '.as([';
            for (i = 0; i < len; i++) {
                if (selectors[i].alias) {
                    query += selectors[i].alias;
                } else {
                    query += selectors[i].selector; // Fallback... you should pass in an alias
                }
                query += ', ';
            }

            // trim trailing comma
            query = this.trim(query, ',');

            query += '])';
        }

        return query;
    },

    /**
     * @name filter
     * @param {object} filterObj - object containing the selectors to add
     * @desc create the filter component e.g. Filter(Studio=["WB", "Paramount"])
     * @returns {string} query
     */
    filter: function (filterObj) {
        var query = '',
            filter,
            itemIdx;

        for (filter in filterObj) {
            if (filterObj.hasOwnProperty(filter)) {
                if (filterObj[filter].isFilterString) {
                    // complex filters means utilizing AND/OR filters aka custom filters, which we will just append.
                    query += filterObj[filter].value;
                } else {
                    // filter filterObj[filter].comparator
                    query += filter; // Filter(Studio
                    query += ' ' + filterObj[filter].comparator + ' '; // Filter(Studio=

                    // handle array different instead of JSON.stringifying because '\' gets escaped. so will manually construct
                    if (Array.isArray(filterObj[filter].value)) {
                        query += '[';
                        for (
                            itemIdx = 0;
                            itemIdx < filterObj[filter].value.length;
                            itemIdx++
                        ) {
                            if (
                                typeof filterObj[filter].value[itemIdx] ===
                                'string'
                            ) {
                                query += '"';
                                // escape special characters (quotes and backslash)
                                query += filterObj[filter].value[
                                    itemIdx
                                ].replace(/"/g, '\\"');
                                query += '"';
                            } else {
                                query += filterObj[filter].value[itemIdx];
                            }

                            // if not last
                            if (
                                itemIdx !==
                                filterObj[filter].value.length - 1
                            ) {
                                query += ', ';
                            }
                        }
                        query += ']';
                    } else if (typeof filterObj[filter].value === 'string') {
                        if (filterObj[filter].isVariable) {
                            query += filterObj[filter].value;
                        } else {
                            query +=
                                '"' +
                                filterObj[filter].value.replace(/"/g, '\\"') +
                                '"'; // Filter(Studio=["WB", "Paramount"]
                        }
                    } else {
                        query += filterObj[filter].value; // Filter(MovieBudget>1000000
                    }
                }

                query += ',';
            }
        }

        // trim trailing comma
        query = this.trim(query, ',');

        if (query) {
            query = 'Filter(' + query + ')'; // Filter(Studio=["WB", "Paramount"])
        }

        return query;
    },

    /**
     * @name filter
     * @param {object} filterObj - object containing the selectors to add
     * @desc create the filter component e.g. Filter(Studio=["WB", "Paramount"])...specific to JSON API
     *       only difference is this one wraps keys and values in double quotes
     * @returns {string} query
     */
    jsonFilter: function (filterObj) {
        var query = '',
            subValue,
            filter;

        for (filter in filterObj) {
            if (filterObj.hasOwnProperty(filter)) {
                if (
                    !Array.isArray(filterObj[filter].value) &&
                    typeof filterObj[filter].value === 'object'
                ) {
                    for (subValue in filterObj[filter].value) {
                        if (filterObj[filter].value.hasOwnProperty(subValue)) {
                            query += '"' + filter + '"'; // Filter(Studio
                            query += ' ' + filterObj[filter].comparator + ' '; // Filter(Studio=
                            query += '"' + subValue + '"';
                            query += ',';
                        }
                    }
                } else {
                    // filter filterObj[filter].comparator
                    query += '"' + filter + '"'; // Filter(Studio
                    query += ' ' + filterObj[filter].comparator + ' '; // Filter(Studio=

                    if (Array.isArray(filterObj[filter].value)) {
                        query += JSON.stringify(filterObj[filter].value); // Filter(Studio=["WB", "Paramount"]
                    } else {
                        query += '"' + filterObj[filter].value + '"'; // Filter(MovieBudget>1000000
                    }

                    query += ',';
                }
            }
        }

        // trim trailing comma
        query = this.trim(query, ',');

        query = 'Filter(' + query + ')'; // Filter(Studio=["WB", "Paramount"])

        return query;
    },

    /**
     * @name implicitFilterOverride
     * @param {boolean} bool true to not use filters and return all results
     * @desc reactor to indicate whether you want to override the filters that currently exists
     * @returns {string} query
     */
    implicitFilterOverride: function (bool) {
        var query = '';

        query += 'ImplicitFilterOverride(' + bool + ')';

        return query;
    },

    /**
     * @name join
     * @param {array} joinList - array of the join information
     * @desc create the join component e.g. Join(Title inner.join Studio)
     * @returns {string} query
     */
    join: function (joinList) {
        var query = '',
            i,
            len = joinList.length;

        if (len > 0) {
            for (i = 0; i < len; i++) {
                if (joinList[i].fromColumn && joinList[i].toColumn) {
                    query += '(';
                    query += joinList[i].fromColumn + ', '; // Join(Title
                    query += this.convertJoin(joinList[i].joinType) + ', '; // Join(Title inner.join
                    query += joinList[i].toColumn; // Join(Title inner.join Studio
                    query += '), ';
                }
            }

            // trim trailing comma
            query = this.trim(query, ',');
            query = 'Join(' + query + ')';
        }

        return query;
    },

    /**
     * @name UNIONS
     * @param {object} unionObj - contains array or unions and uniontype
     * @desc create a union
     * @returns {string} query
     */
    UNIONS: function (unionObj) {
        var query = '',
            i,
            len,
            mapping = {},
            unions = [];
        query += 'Union(';
        query += 'frame1=[' + unionObj.frame1 + '], ';
        query += 'frame2=[' + unionObj.frame2 + '], ';
        query += 'unionType=["' + unionObj.unionType + '"], ';
        query += 'mapping=[';
        if (unionObj.unions) {
            for (i = 0, len = unionObj.unions.length; i < len; i++) {
                mapping[unionObj.unions[i].from] = unionObj.unions[i].to;
            }
            query += JSON.stringify(mapping);
        }
        query += ']';
        query += ')';
        return query;
    },

    /**
     * @name merge
     * @param {array} tableJoins - array of the join information
     * @desc create the merge component e.g. Merge(Title inner.join Title); this is exactly the same as creating the join component. but will keep separate because they could change in the future
     * @param {string} frame - frame that you are mergin into
     * @returns {string} query
     */
    merge: function (tableJoins, frame) {
        var query = '',
            i,
            len;

        query += 'Merge(';

        if (tableJoins) {
            query += 'joins=[';
            for (i = 0, len = tableJoins.length; i < len; i++) {
                query += '(';
                query += tableJoins[i].fromColumn + ', '; // Join(Title
                query += this.convertJoin(tableJoins[i].joinType) + ', '; // Join(Title inner.join
                query += tableJoins[i].toColumn; // Join(Title inner.join Studio
                query += '), ';
            }
            // trim trailing comma
            query = this.trim(query, ',');
            query += ']';
        }

        if (frame) {
            query += ', frame=[' + frame + '] ';
        }
        query += ')';

        return query;
    },

    /**
     * @name limit
     * @param {number} limit - limit the select
     * @desc create a limt component that determines the datas's output
     * @returns {string} query
     */
    limit: function (limit) {
        var query = '';

        query = 'Limit(' + limit + ')';

        return query;
    },

    /**
     * @name import
     * @desc create the import component e.g. Import() to import the data into the frame
     * @param {string} frame - frame that you are importing
     * @returns {string} query
     */
    import: function (frame) {
        var query = '';

        query += 'Import(';

        if (frame) {
            query += ' frame=[' + frame + '] ';
        }
        query += ')';

        return query;
    },

    /**
     * @name queryAll
     * @desc create the query all component to automatically get the whole frame
     * @returns {string} query
     */
    queryAll: function () {
        var query = '';

        query += 'QueryAll()';

        return query;
    },

    /**
     * @name execute
     * @desc create the execute component e.g. Execute() to query the db and not import it
     * @returns {string} query
     */
    execute: function () {
        // TODO: confirm that it's okay that I changed this from Execute() to ExecQuery)_
        var query = '';

        query += 'ExecQuery()';

        return query;
    },

    /**
     * @name convert
     * @desc create the convert component e.g. Convert() to convert a frame from one type to another
     * @param {string} frameType - frame type to convert the current frame to
     * @param {string} alias - used to identify newly created source
     * @returns {string} query
     */
    convert: function (frameType, alias) {
        var query = '';

        query += 'Convert(';
        query += 'frameType=[' + frameType + ']';
        query += ')';

        if (alias) {
            query += ".as(['" + alias + "'])";
        }

        return query;
    },

    /**
     * @name purge
     * @param {string} filterString the generated filter string to pass into purge
     * @desc create the purge component e.g. Purge() to truncate the data
     * @returns {string} query
     */
    purge: function (filterString) {
        var query = '';

        query += 'Purge(' + filterString + ')';

        return query;
    },

    /**
     * @name toCsv
     * @desc create the toCsv component e.g. ToCsv() to query the db and export it
     * @returns {string} query
     */
    toCsv: function () {
        var query = '';

        query += 'ToCsv()';

        return query;
    },

    /**
     * @name toTsv
     * @desc create the toTsv component e.g. ToTsv() to query the db and export it
     * @returns {string} query
     */
    toTsv: function () {
        var query = '';

        query += 'ToTsv()';

        return query;
    },

    /**
     * @name toTxt
     * @param {string} delimiter the delimiter to use in the generated text file
     * @desc create the toTxt component e.g. ToTxt() to query the db and export it
     * @returns {string} query
     */
    toTxt: function (delimiter) {
        var query = '';

        query += 'ToTxt("' + delimiter + '")';

        return query;
    },

    /**
     * @name toExcel
     * @desc create the toExcel component e.g. ToExcel() to query the db and export it
     * @returns {string} query
     */
    toExcel: function () {
        var query = '';

        query += 'ToExcel()';

        return query;
    },

    /**
     * @name exportToExcel
     * @desc exports the dashboard into Excel (native)
     * @param {string} fileName - name of file to create
     * @param {string} filePath - path to download file to
     * @param {string} exportTemplate - path of template
     * @param {boolean} exportAudit -if  true will export audit parameters in excel
     * @param {string} templateData Template Data
     * @param {string} panelOrderIds Panel Order Ids
     * @param {string} appId - database id
     * @returns {string} query
     */
    exportToExcel: function (
        fileName,
        filePath,
        exportTemplate,
        exportAudit,
        templateData,
        panelOrderIds,
        appId
    ) {
        var query = '';

        let queryValues = {},
            keys = [];
        if (fileName) {
            queryValues.fileName = fileName;
        }
        if (filePath) {
            queryValues.filePath = filePath;
        }
        if (exportTemplate) {
            queryValues.export_template = exportTemplate;
        }
        if (exportAudit) {
            queryValues.exportAudit = `${exportAudit}`;
        }
        if (exportTemplate) {
            queryValues.placeHolderData = templateData;
        }
        if (panelOrderIds && panelOrderIds.length > 0) {
            queryValues.panelOrderIds = panelOrderIds;
        }
        if (exportTemplate) {
            queryValues.project = appId;
        }
        keys = Object.keys(queryValues);

        query += 'ExportToExcel(';

        for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
            if (keyIdx !== 0) {
                // Add a comma before each query parameter except the first one
                query += ', ';
            }
            query += `${keys[keyIdx]}=[${JSON.stringify(
                queryValues[keys[keyIdx]]
            )}]`;
        }
        query += ')';

        return query;
    },

    /**
     * @name exportToExcelNN
     * @desc exports the dashboard into Excel (non-native)
     * @param {string} fileName - name of file to create
     * @param {string} filePath - path to download file to
     * @param {boolean} usePanel - if true will print panels on separate sheets, else will print on same sheet
     * @param {boolean} exportAudit -if  true will export audit parameters in excel
     * @param {string} templateData Template Data
     * @param {string} panelOrderIds Panel Order Ids
     * @param {string} appId - database id
     * @returns {string} query
     */
    exportToExcelNN: function (
        fileName,
        filePath,
        usePanel,
        exportAudit,
        templateData,
        panelOrderIds,
        appId
    ) {
        var query = '';

        let queryValues = {},
            keys = [];
        if (fileName) {
            queryValues.fileName = fileName;
        }
        if (filePath) {
            queryValues.filePath = filePath;
        }
        if (usePanel) {
            queryValues.usePanel = `${usePanel}`;
        }
        if (exportAudit) {
            queryValues.exportAudit = `${exportAudit}`;
        }
        if (templateData) {
            queryValues.placeHolderData = templateData;
        }
        if (panelOrderIds && panelOrderIds.length > 0) {
            queryValues.panelOrderIds = panelOrderIds;
        }
        if (appId) {
            queryValues.project = appId;
        }
        keys = Object.keys(queryValues);

        query += 'ExportToExcelNN(';

        for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
            if (keyIdx !== 0) {
                // Add a comma before each query parameter except the first one
                query += ', ';
            }
            query += `${keys[keyIdx]}=[${JSON.stringify(
                queryValues[keys[keyIdx]]
            )}]`;
        }
        query += ')';

        return query;
    },

    /**
     * @name exportToPPT
     * @desc exports the dashboard into Powerpoint (native)
     * @returns {string} query
     */
    exportToPPT: function () {
        var query = '';

        query += 'ExportToPPT()';

        return query;
    },

    /**
     * @name exportToPPTNN
     * @desc exports the dashboard into Powerpoint (non-native)
     * @param {string} fileName - name of file to create
     * @param {string} filePath - path to download file to
     * @param {boolean} usePanel - if true will print panels on separate sheets, else will print on same sheet
     * @param {number} height - height of image
     * @param {number} width - width of image
     * @param {string} slideLayout - name of slide layout to use
     * @param {number} shapeIndex - location on slide layout to place the content
     * @param {string} exportTemplate - path of template
     * @returns {string} query
     */
    exportToPPTNN: function (
        fileName,
        filePath,
        usePanel,
        height,
        width,
        slideLayout,
        shapeIndex,
        exportTemplate
    ) {
        var query = '';

        query += 'ExportToPPTNN(';
        query += `fileName= ["${fileName}"]`;

        if (filePath) {
            query += `, filePath=["${filePath}"]`;
        }
        if (usePanel) {
            query += `, usePanel=[${usePanel}]`;
        }
        if (height) {
            query += `, height=[${height}]`;
        }
        if (width) {
            query += `, width=[${width}]`;
        }
        if (slideLayout) {
            query += `, slideLayout=["${slideLayout}"]`;
        }
        if (shapeIndex) {
            query += `, shapeIndex=[${shapeIndex}]`;
        }
        if (exportTemplate) {
            query += `, export_template=["${exportTemplate}"]`;
        }

        query += ')';

        return query;
    },

    /**
     * @name exportImage
     * @desc exports an image of the insight
     * @param {string} baseUrl - base semoss url
     * @param {string} url - url of the insight to export
     * @returns {string} query
     */
    exportImage: function (baseUrl, url) {
        var query = '';

        query += 'ExportImage (';
        query += `baseUrl = ["${baseUrl}"], `;
        query += `url = ["${url}"]`;
        query += ')';

        return query;
    },
    /**
     * @name tableToXLSX
     * @desc exports panels into excel
     * @param {string} sheetName - name of sheet
     * @param {string} html - html to create on the sheet
     * @param {string} fileName - file name to download to
     * @param {boolean} mergeCells - whether to merge cells if rowspan/colspan is present
     * @param {string} template - location of template file
     * @param {number} rowPad - padding inbetween tables
     * @returns {string} query
     */
    tableToXLSX: function (
        sheetName,
        html,
        fileName,
        mergeCells,
        template,
        rowPad
    ) {
        let query = '';

        query += 'TableToXLSX(';
        query += `sheet=["${sheetName}"], `;
        query += `html=["<encode>${html}</encode>"], `;
        query += `fileName=["${fileName}"], `;
        query += `${mergeCells}`;
        if (template) {
            query += `, "${template}"`;
        }
        if (rowPad) {
            query += `, ${rowPad}`;
        }
        query += ')';

        return query;
    },

    /**
     * @name openTab
     * @desc opens a url in a new tab
     * @param {string} url - the url to open
     * @returns {string} query
     */
    openTab: function (url) {
        var query = '';
        query = 'OpenTab("' + url + '")';
        return query;
    },

    /**
     * @name iterate
     * @desc create a iterate component that initializes the iterator
     * @returns {string} query
     */
    iterate: function () {
        var query = '';

        query = 'Iterate()';

        return query;
    },

    /**
     * @name format
     * @param {string} type - type of format that you will pipe the data into
     * @param {object} options - format options
     * @desc create a format component that determines the datas's output
     * @returns {string} query
     */
    format: function (type, options) {
        var query = '';

        query = "Format(type=['" + type + "']";

        if (options) {
            query += ', options=' + JSON.stringify(options);
        }

        query += ')';

        return query;
    },

    /**
     * @name removeLayer
     * @param {string} panelId - panel id layer belongs to
     * @param {string} layerId - layer id to remove
     * @desc removes a layer
     * @returns {string} query
     */
    removeLayer: function (panelId, layerId) {
        var query = '';

        query += 'RemoveLayer(';
        query += 'panel=["' + panelId + '"], ';
        query += 'layer=["' + layerId + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name task
     * @param {string} taskId - id of the tast to select
     * @desc creates a task component that sets options associated with the view
     * @returns {string} query
     */
    task: function (taskId) {
        var query = '';
        query += 'Task("' + taskId + '")';
        return query;
    },

    /**
     * @name removeTask
     * @param {string} taskId - id of the task
     * @param {boolean} drop - drop now}
     * @desc removes a task
     * @returns {string} query
     */
    removeTask: function (taskId, drop) {
        var query = '';

        query += 'RemoveTask("';
        query += taskId;
        query += '"';
        if (typeof drop !== 'undefined') {
            query += ', ';
            query += drop;
        }
        query += ')';

        return query;
    },

    /**
     * @name taskOptions
     * @param {object} options - options to associate with the view
     * @desc creates a taskOptions component that sets options associated with the view
     * @returns {string} query
     */
    taskOptions: function (options) {
        var query = '',
            optionsString = JSON.stringify(options),
            facetVariable = optionsString.match(/"{facet_\w*}"/g);

        // if we find a facet varaible in the task options, we need to remove the quotes around the facet variable to allow BE to replace properly.
        if (facetVariable && facetVariable.length > 0) {
            optionsString = optionsString.replace(
                facetVariable[0],
                facetVariable[0].substring(1, facetVariable[0].length - 1)
            );
        }

        query = 'TaskOptions(' + optionsString + ')';

        return query;
    },

    /**
     * @name autoTaskOptions
     * @param {string} panelId - panelId
     * @param {string} layout - layout
     * @desc automatically sets the taskOptions component that sets options associated with the view
     * @returns {string} query
     */
    autoTaskOptions: function (panelId, layout) {
        var query = '';

        query += 'AutoTaskOptions(';
        query += 'panel=["' + panelId + '"], ';
        query += 'layout=["' + layout + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name sortOptions
     * @param {array} sortOptions the sort options array
     * @desc builds sort options query: sort(cols=[col1, col2....], dirs=[asc, desc, asc....])
     * @return {string} query
     */
    sortOptions: function (sortOptions) {
        var query = '',
            i,
            len = sortOptions.length,
            cols = [],
            dirs = [];

        for (i = 0; i < len; i++) {
            cols.push(sortOptions[i].alias);
            dirs.push(sortOptions[i].dir);
        }

        if (cols.length > 0 && cols.length === dirs.length) {
            query =
                'Sort(columns=' +
                JSON.stringify(cols) +
                ', sort=' +
                JSON.stringify(dirs) +
                ')';
        }

        return query;
    },

    /**
     * @name collectNewCol
     * @desc create a collect new col pixel to add new column to frame
     * @returns {string} query
     */
    collectNewCol: function () {
        var query = '';

        query = 'CollectNewCol()';

        return query;
    },

    /**
     * @name collectNewTemporalCol
     * @desc create a collect new col pixel to add new column to frame
     * @returns {string} query
     */
    collectNewTemporalCol: function () {
        var query = '';

        query = 'CollectNewTemporalCol()';

        return query;
    },

    /**
     * Custom sorting that takes a column's values order into account
     * @param {{ column: string, values: string[] }} params params
     * @return {string} sort by
     */
    sortBy: function (params) {
        if (Array.isArray(params.column) && Array.isArray(params.values)) {
            return (
                'SortBy(column=' +
                JSON.stringify(params.column) +
                ', values=' +
                JSON.stringify(params.values) +
                ')'
            );
        }

        return '';
    },

    /**
     * @name collect
     * @param {number} amount - amount to collect
     * @desc create a collect component that pulls from the iterator
     * @returns {string} query
     */
    collect: function (amount) {
        var query = '';

        query = 'Collect(' + amount + ')';

        return query;
    },

    /**
     * @name collectGraph
     * @param {string} frame frame name
     * @desc create a collect graph component that pulls all of the nodes and edges
     * @returns {string} query
     */
    collectGraph: function (frame) {
        var query = 'CollectGraph(';

        if (frame) {
            query += 'frame=[' + frame + ']';
        }
        query += ')';

        return query;
    },

    /**
     * @name collectPivot
     * @param {*} rows the rows for the pivot table
     * @param {*} columns the columns for the pivot table
     * @param {*} calculations the calculations for the intersections
     * @param {*} sections create different pivot tables; similar to facet
     * @desc create a pivot table from r using the passed in params
     * @returns {string} query
     */
    collectPivot: function (rows, columns, calculations, sections) {
        var query = 'CollectPivot(';

        query += 'rowGroups=' + JSON.stringify(rows);
        query += ', ';
        query += 'columns=' + JSON.stringify(columns);
        query += ', ';
        query += 'values=' + JSON.stringify(calculations);
        query += ', ';
        query += 'json=["True"]';
        query += ', ';
        query += 'margins=["False"]';
        if (sections.length > 0) {
            query += ', ';
            query += 'sections=' + JSON.stringify(sections);
        }
        query += ')';

        return query;
    },

    /**
     * @name collectGGPlot
     * @param {*} ggplot ggplot script
     * @desc create ggplot graph
     * @returns {string} query
     */
    collectGGPlot: function (ggplot) {
        var query = 'CollectGGPlot(';

        query += ggplot;
        query += ')';

        return query;
    },

    /**
     * @name collectSeaborn
     * @param {*} seaborn seaborn script
     * @desc create ggplot graph
     * @returns {string} query
     */
    collectSeaborn: function (seaborn) {
        var query = 'CollectSeaborn(';

        query += seaborn;
        query += ')';

        return query;
    },

    /**
     * @name refreshPanelTask
     * @param {number} limit the limit to collect
     * @desc refresh the latest task on the panel
     * @returns {string} query
     */
    refreshPanelTask: function (limit) {
        var query = 'RefreshPanelTask(';

        if (typeof limit !== 'undefined') {
            query += 'limit=[' + limit + ']';
        }

        query += ')';

        return query;
    },

    /**
     * @name cachedPanel
     * @param {*} panelId the panel id to get cache for
     * @desc get the specified panel's cached panel state
     * @returns {string} query
     */
    cachedPanel: function (panelId) {
        var query = 'CachedPanel(';

        query += 'panel=["' + panelId + '"]';
        query += ')';

        return query;
    },

    /**
     * @name cachedSheet
     * @param {*} sheetId the panel id to get cache for
     * @desc get the specified panel's cached panel state
     * @returns {string} query
     */
    cachedSheet: function (sheetId) {
        var query = 'CachedSheet(';

        query += 'sheet=["' + sheetId + '"]';
        query += ')';

        return query;
    },

    /**
     * @name changeGraphLayout
     * @param {string} layout - specified tinker layout
     * @param {string} frame frame name
     * @desc create a change graph layout component to specify graph tinker layout
     * @returns {string} query
     */
    changeGraphLayout: function (layout, frame) {
        var query = '';

        if (frame) {
            query += frame + ' | ';
        }
        query += 'ChangeGraphLayout(graphLayout=["layout.' + layout + '"])';

        return query;
    },

    /**
     * @name clusterGraph
     * @param {string} method - specified tinker cluster method
     * @param {string} frame frame name
     * @desc create a cluster graph component to specify graph tinker cluster
     * @returns {string} query
     */
    clusterGraph: function (method, frame) {
        var query = '';

        if (frame) {
            query += frame + ' | ';
        }
        query = 'ClusterGraph(routine=["' + method + '"])';

        return query;
    },

    /**
     * @name checkRPackages
     * @desc identifies all installed packages (to be compared to required packages for specific widgets)
     * @param {bool} reload - whether or not to reload
     * @returns {string} query
     */
    checkRPackages: function (reload) {
        var query = '';

        query = 'CheckRPackages(';

        if (reload) {
            query += 'reload=["' + reload + '"]';
        }

        query += ')';

        return query;
    },

    /** *Frame */
    /**
     * @name frameHeaders
     * @desc gets the frameHeaders
     * @param {string} frame - passed in frame
     * @param {string} type - which type of headers to get. Ie STRING, NUMBER
     * @returns {string} query
     */
    frameHeaders: function (frame, type) {
        var query = '';
        query = 'FrameHeaders(';
        if (frame) {
            query += ' frame=[' + frame + '] ';
        }

        if (type) {
            query += ', "' + type + '"';
        }

        query += ')';

        return query;
    },

    /**
     * @name frameFilterModelFilteredValues
     * @param {string} title - column to filter on
     * @param {string} search - query to match instances with
     * @param {number} limit - max amount of instances to get back
     * @param {number} offset - where to start getting instances from
     * @desc retrieves values that are filtered out of the frame based on parameters
     * @return {string} the query
     */
    frameFilterModelFilteredValues: function (title, search, limit, offset) {
        var query = '',
            off;

        if (offset === undefined) {
            off = 0;
        } else {
            off = offset;
        }

        query += 'FrameFilterModelFilteredValues(column=["' + title + '"]';

        if (typeof search !== 'undefined' && search) {
            query += ', filterWord=["' + search + '"]';
        }

        query += ', limit=[' + limit + '], offset=[' + off + '])';

        return query;
    },

    /**
     * @name frameFilterModelVisibleValues
     * @param {string} title - column to filter on
     * @param {string} search - query to match instances with
     * @param {number} limit - max amount of instances to get back
     * @param {number} offset - where to start getting instances from
     * @desc retrieves values that are in the frame based on parameters
     * @return {string} the query
     */
    frameFilterModelVisibleValues: function (title, search, limit, offset) {
        var query = '',
            off;

        if (offset === undefined) {
            off = 0;
        } else {
            off = offset;
        }

        query += 'FrameFilterModelVisibleValues(column=["' + title + '"]';

        if (typeof search !== 'undefined' && search) {
            query += ', filterWord=["' + search + '"]';
        }

        query += ', limit=[' + limit + '], offset=[' + off + '])';

        return query;
    },

    /**
     * @name frameFilterModelNumericRange
     * @param {string} title - column to get range for
     * @desc retrieves the min and max of the column
     * @return {string} the query
     */
    frameFilterModelNumericRange: function (title) {
        var query = '';

        query += 'FrameFilterModelNumericRange(column=["' + title + '"])';

        return query;
    },

    /**
     * @name frameFilterModel
     * @param {string} alias - used to select the column to filter on
     * @param {string} search - search term used to filter the model
     * @param {number} limit - used to grab a certain portion of the model
     * @param {number} offset - used to grab a certain amount of the model
     * @desc gets the frame filtermodel
     * @returns {string} query
     */
    frameFilterModel: function (alias, search, limit, offset) {
        var query = '';

        query += 'FrameFilterModel(column=[';
        query += alias;
        query += ']';

        if (typeof search !== 'undefined' && search) {
            query += ', filterWord=["' + search + '"]';
        }

        if (typeof limit !== 'undefined') {
            query += ', limit=[' + limit + ']';
        }

        if (typeof offset !== 'undefined') {
            query += ', offset=[' + offset + ']';
        }

        query += ')';

        return query;
    },

    /**
     * @name filterModelState
     * @param {string} frame - frame to grab the values from
     * @param {string} panel - panel to store the filters state
     * @param {string} alias - used to select the column to filter on
     * @param {string} search - search term used to filter the model
     * @param {number} limit - used to grab a certain portion of the model
     * @param {number} offset - used to grab a certain amount of the model
     * @param {boolean} dynamic - is the filter dynamic?
     * @param {boolean} optionsCache - are the options cached?
     * @desc gets the frame filtermodel
     * @returns {string} query
     */
    filterModelState: function (
        frame,
        panel,
        alias,
        search,
        limit,
        offset,
        dynamic,
        optionsCache
    ) {
        var query = '';

        query += 'FilterModelState(';

        query += 'frame=[' + frame + ']';
        query += ', panel=[Panel("' + panel + '")]';
        query += ', column=[' + alias + ']';

        if (typeof search !== 'undefined' && search) {
            query += ', filterWord=["' + search + '"]';
        }

        if (typeof limit !== 'undefined') {
            query += ', limit=[' + limit + ']';
        }

        if (typeof offset !== 'undefined') {
            query += ', offset=[' + offset + ']';
        }

        if (typeof dynamic !== 'undefined') {
            query += ', dynamic=[' + dynamic + ']';
        }

        if (typeof optionsCache !== 'undefined') {
            query += ', optionsCache=[' + optionsCache + ']';
        }

        query += ')';

        return query;
    },

    /**
     * @name setFilterModelState
     * @param {string} panel - panel to store the filters state
     * @param {array} filters - filter to add to the frame
     * @desc save state associated with the filter
     * @returns {string} query
     */
    setFilterModelState: function (panel, filters) {
        var query = '';

        query += 'SetFilterModelState(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name addFilterModelState
     * @param {array} filters - filter to add to the frame
     * @desc save state associated with the filter
     * @returns {string} query
     */
    addFilterModelState: function (filters) {
        var query = '';

        query += 'AddFilterModelState(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name getFrameFilterState
     * @param {string} alias - used to select the column to filter on
     * @param {string} search - search term used to filter the model
     * @param {number} limit - used to grab a certain portion of the model
     * @param {number} offset - used to grab a certain amount of the model
     * @param {boolean} dynamic - is the filter dynamic?
     * @param {boolean} optionsCache - are the options cached?
     * @param {arrray} panels - panels to run this on
     * @desc gets the frame filtermodel
     * @returns {string} query
     */
    getFrameFilterState: function (
        alias,
        search,
        limit,
        offset,
        dynamic,
        optionsCache,
        panels
    ) {
        var query = '';

        query += 'GetFrameFilterState(column=[';
        query += alias;
        query += ']';

        if (typeof search !== 'undefined' && search) {
            // escape special characters (quotes and backslash)
            query +=
                ', filterWord=["' +
                search.toString().replace(/"/g, '\\"') +
                '"]';
        }

        if (typeof limit !== 'undefined') {
            query += ', limit=[' + limit + ']';
        }

        if (typeof offset !== 'undefined') {
            query += ', offset=[' + offset + ']';
        }

        if (typeof dynamic !== 'undefined') {
            query += ', dynamic=[' + dynamic + ']';
        }

        if (typeof optionsCache !== 'undefined') {
            query += ', optionsCache=[' + optionsCache + ']';
        }

        if (typeof panels !== 'undefined' && Array.isArray(panels)) {
            query += ', panel=' + JSON.stringify(panels);
        }

        query += ')';

        return query;
    },

    /**
     * @name getFrameFilterRange
     * @param {string} alias - used to select the column to filter on
     * @param {boolean} dynamic - is the filter dynamic?
     * @param {boolean} optionsCache - are the options cached?
     * @param {arrray} panels - panels to run this on
     * @desc gets the frame filtermodel
     * @returns {string} query
     */
    getFrameFilterRange: function (alias, dynamic, optionsCache, panels) {
        var query = '';

        query += 'GetFrameFilterRange(column=[';
        query += alias;
        query += ']';
        if (typeof dynamic !== 'undefined') {
            query += ', dynamic=[' + dynamic + ']';
        }

        if (typeof optionsCache !== 'undefined') {
            query += ', optionsCache=[' + optionsCache + ']';
        }
        if (typeof panels !== 'undefined' && Array.isArray(panels)) {
            query += ', panel=' + JSON.stringify(panels);
        }
        query += ')';

        return query;
    },

    /**
     * @name addFrameFilter
     * @param {array} filters - filters to construct from
     * @desc adds a filter to the frame
     * @returns {string} query
     */
    addFrameFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'AddFrameFilter(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name removeFrameFilter
     * @param {array} filters - filters to construct from
     * @desc removes a filter to the frame
     * @returns {string} query
     */
    removeFrameFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'RemoveFrameFilter(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },
    /**
     * @name deleteFrameFilter
     * @param {array} filters - array of filters to remove
     * @desc removes a filter from the frame
     * @returns {string} query
     */
    deleteFrameFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'DeleteFrameFilter ( index';
        query += ' = [';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            query += String(filters[filterIdx].index) + ', ';
        }
        query = this.trim(query, ',');
        query += '])';

        return query;
    },

    /**
     * @name setFrameFilter
     * @param {array} filters - filters to construct from
     * @desc sets a filter to the frame
     * @returns {string} query
     */
    setFrameFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'SetFrameFilter(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name setFrameFilter2
     * @param {array} qsFilters - filter query struct to construct the filters
     * @desc replaces a filter to the frame (adds if it doesn't exist)
     * @returns {string} query
     */
    setFrameFilter2: function (qsFilters) {
        // look through all of the chunks, this should ideally be 1
        const filterStrs = [];
        for (
            let filterIdx = 0, filterLen = qsFilters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            let filterStr = flattenFilter(qsFilters[filterIdx]);
            if (!filterStr) {
                console.error('Invalid Filter');
                continue;
            }

            filterStrs.push(filterStr);
        }

        return `SetFrameFilter(${filterStrs.join(' | ')})`;
    },

    /**
     * @name getPanelFilters
     * @returns {string} query
     */
    getPanelFilters: function () {
        var query = '';

        query = 'GetPanelFilters()';

        return query;
    },

    /**
     * @name getPanelFiltersQS
     * @returns {string} query
     */
    getPanelFiltersQS: function () {
        var query = '';

        query = 'GetPanelFiltersQS()';

        return query;
    },

    /**
     * @name addPanelFilter
     * @param {array} filters - filters to construct from
     * @desc adds a filter to the frame
     * @returns {string} query
     */
    addPanelFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'AddPanelFilter(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name removePanelFilter
     * @param {array} filters - filters to construct from
     * @desc removes a filter to the frame
     * @returns {string} query
     */
    removePanelFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'RemovePanelFilter(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name setPanelFilter
     * @param {array} filters - filters to construct from
     * @desc sets a filter to the frame
     * @returns {string} query
     */
    setPanelFilter: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        query += 'SetPanelFilter(';
        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `(${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `("${filters[filterIdx].values[0]}" <= ${filters[filterIdx].alias}), (${filters[filterIdx].alias} <= "${filters[filterIdx].values[1]}")`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }
        query += ')';

        return query;
    },

    /**
     * @name setPanelFilter2
     * @param {array} qsFilters - filter query struct to construct the filters
     * @desc replaces a filter to the frame (adds if it doesn't exist)
     * @returns {string} query
     */
    setPanelFilter2: function (qsFilters) {
        // look through all of the chunks, this should ideally be 1
        const filterStrs = [];
        for (
            let filterIdx = 0, filterLen = qsFilters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            let filterStr = flattenFilter(qsFilters[filterIdx]);
            if (!filterStr) {
                console.error('Invalid Filter');
                continue;
            }

            filterStrs.push(filterStr);
        }

        return `SetPanelFilter(${filterStrs.join(' | ')})`;
    },

    /**
     * @name unfilterFrame
     * @param {string} alias - used to select the column to filter on
     * @desc unfilters the frame
     * @returns {string} query
     */
    unfilterFrame: function (alias) {
        var query = '';

        query += 'UnfilterFrame(';
        if (alias) {
            query += alias;
        }
        query += ')';

        return query;
    },

    /**
     * @name unfilterPanel
     * @param {string} alias - used to select the column to filter on
     * @desc unfilters the panel
     * @returns {string} query
     */
    unfilterPanel: function (alias) {
        var query = '';

        query += 'UnfilterPanel(';
        if (alias) {
            query += alias;
        }
        query += ')';

        return query;
    },

    /**
     * @name frameHeaderExists
     * @param {string} frame the id of the frame
     * @param {string} header the name of the header to check
     * @desc check to see if column exists in frame
     * @returns {string} query
     */
    frameHeaderExists: function (frame, header) {
        var query = '';

        if (frame) {
            query +=
                'FrameHeaderExists(frame=[' +
                frame +
                '], column=[' +
                header +
                '])';
        } else {
            query += 'FrameHeaderExists(' + header + ')';
        }

        return query;
    },
    /**
     * @name addSheet
     * @param {*} sheetId the sheet id
     * @desc add a new sheet
     * @returns {string} query
     */
    addSheet: function (sheetId) {
        let query = '';

        query += 'AddSheet("' + sheetId + '")';

        return query;
    },

    /** *PANEL */

    /**
     * @name addPanel
     * @param {string} panelId - panel id to create
     * @param {string} sheetId - sheet to add the panel to
     * @desc creates a new panel
     * @returns {string} query
     */
    addPanel: function (panelId, sheetId) {
        let query = '';

        query = `AddPanel(panel=[${panelId}] ${
            sheetId ? `, sheet=["${sheetId}"]` : ''
        })`;

        return query;
    },

    /**
     * @name addPanelIfAbsent
     * @param {string} panelId - panel id to create
     * @param {string} sheetId - sheet to add the panel to
     * @desc creates a new panel if it does not already exist
     * @returns {string} query
     */
    addPanelIfAbsent: function (panelId, sheetId) {
        let query = '';

        query = `AddPanelIfAbsent(panel=[${panelId}] ${
            sheetId ? `, sheet=["${sheetId}"]` : ''
        })`;

        return query;
    },

    /**
     * @name clonePanel
     * @param {number} id - new panel id to clone to
     * @param {number} cloneId - If specified, this will be the new panel id for the cloned panel
     * @param {number} sheetId - If specified, this will be the sheet where the panel is cloned to
     * @desc creates and clones a new panel
     * @returns {string} query
     */
    clonePanel: function (id, cloneId, sheetId) {
        var query = '';
        if (cloneId) {
            query = `Clone(panel=["${id}"], cloneId=["${cloneId}"] ${
                sheetId ? `, sheet=["${sheetId}"]` : ''
            })`;
        } else {
            query = 'Clone("' + id + '")';
        }
        return query;
    },

    /**
     * @name closePanel
     * @param {number} id - panel id to close
     * @desc closes a panel
     * @returns {string} query
     */
    closePanel: function (id) {
        var query = '';

        query = 'ClosePanel(' + id + ')';

        return query;
    },

    /**
     * @name panel
     * @param {number} id - panel id to create
     * @desc selects a panel
     * @returns {string} query
     */
    panel: function (id) {
        var query = '';

        query = 'Panel(' + id + ')';

        return query;
    },

    /**
     * @name setPanelView
     * @param {string} view - new view to set the panel to
     * @param {object} options - view options
     * @desc sets the panel view
     * @returns {string} query
     */
    setPanelView: function (view, options) {
        var query = '';

        query += 'SetPanelView("' + view + '"';

        if (options) {
            query += ', "<encode>' + JSON.stringify(options) + '</encode>"';
        }

        query += ')';

        return query;
    },

    /**
     * @name setPanelLabel
     * @param {string} label - new view to set the panel to
     * @desc sets the panel label
     * @returns {string} query
     */
    setPanelLabel: function (label) {
        var query = '';

        query += 'SetPanelLabel("' + label + '")';

        return query;
    },
    /**
     * @name addPanelOrnaments
     * @param {object} ornaments - ornaments to add to the panel
     * @desc adds and saves ornaments to the panel
     * @returns {string} query
     */
    addPanelOrnaments: function (ornaments) {
        var query = '';

        query = 'AddPanelOrnaments(' + JSON.stringify(ornaments) + ')';

        return query;
    },

    /**
     * @name addPanelConfig
     * @param {object} config - panel configuration
     * @return {string} query
     */
    addPanelConfig: function (config) {
        var query = '';

        query += 'AddPanelConfig(config=[' + JSON.stringify(config) + '])';

        return query;
    },

    /**
     * @name setPanelPosition
     * @param {object} position - panel position values
     * @return {string} query
     */
    setPanelPosition: function (position) {
        var query = '',
            positionArr = [];

        for (let prop in position) {
            if (position.hasOwnProperty(prop)) {
                let value = position[prop];
                if (typeof value === 'string') {
                    value = `"${value}"`;
                }
                positionArr.push(`"${prop}": ${value}`);
            }
        }

        query += 'SetPanelPosition({';
        query += positionArr.join(',');
        query += '})';

        return query;
    },

    /**
     * @name removePanelOrnaments
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @desc removes ornaments from the panel
     * @returns {string} query
     */
    removePanelOrnaments: function (accessor) {
        var query = '';

        query = 'RemovePanelOrnaments("' + accessor + '")';

        return query;
    },

    /**
     * @name retrievePanelOrnaments
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @desc retrieves saved ornaments from the panel
     * @returns {string} query
     */
    retrievePanelOrnaments: function (accessor) {
        var query = '';

        query = 'RetrievePanelOrnaments("' + accessor + '")';

        return query;
    },

    /**
     * @name addPanelColorByValue
     * @param {string} variable -  variable to add
     * @param {object} options - optional colorby value options
     * @desc adds and saves colorbyvalue to the panel
     * @returns {string} query
     */
    addPanelColorByValue: function (variable, options) {
        var query = '';

        query += 'AddPanelColorByValue(';
        query += 'name=["' + variable + '"], ';
        query += 'qs=[' + variable + '], ';
        query += 'options=[' + JSON.stringify(options) + ']';
        query += ')';

        return query;
    },

    /**
     * @name retrievePanelColorByValue
     * @param {string} variable -  variable to remove
     * @desc adds and saves colorbyvalue to the panel
     * @returns {string} query
     */
    retrievePanelColorByValue: function (variable) {
        var query = '';

        query += 'RetrievePanelColorByValue(';
        query += 'name=["' + variable + '"]';
        query += ')';

        return query;
    },

    /**
     * @name removePanelColorByValue
     * @param {string} variable -  variable to remove
     * @desc adds and saves colorbyvalue to the panel
     * @returns {string} query
     */
    removePanelColorByValue: function (variable) {
        var query = '';

        query += 'RemovePanelColorByValue(';
        query += 'name=["' + variable + '"]';
        query += ')';

        return query;
    },

    /**
     * @name getPanelSort
     * @desc builds the GetPanelSort query
     * @returns {string} query
     */
    getPanelSort: function () {
        return 'GetPanelSort()';
    },

    /**
     * @name setPanelSort
     * @param {array} sortOptions the sort options array
     * @desc builds the setpanelsort query
     * @returns {string} query
     */
    setPanelSort: function (sortOptions) {
        var query = '',
            i,
            len = sortOptions.length,
            cols = [],
            dirs = [];

        for (i = 0; i < len; i++) {
            cols.push(sortOptions[i].alias);
            dirs.push(sortOptions[i].dir);
        }

        if (cols.length > 0 && cols.length === dirs.length) {
            query =
                'SetPanelSort(columns=' +
                JSON.stringify(cols) +
                ', sort=' +
                JSON.stringify(dirs) +
                ')';
        }
        return query;
    },

    /**
     * @name RANK_COLUMN
     * @param {object} Config
     * @desc builds the rank query
     * @returns {string} query
     */

    RANK_COLUMN: function (Config) {
        var query = '';

        if (
            Config[1].columns.length > 0 &&
            Config[1].columns.length === Config[2].sortValues.length
        ) {
            query =
                'columns=' +
                JSON.stringify(Config[1].columns) +
                ', newCol=' +
                JSON.stringify(Config[0].newCol) +
                ', sort=' +
                JSON.stringify(Config[2].sortValues);
        }

        if (Config[3].partitionByCols) {
            query =
                query +
                ', partitionByCols=' +
                JSON.stringify(Config[3].partitionByCols);
        }

        return query;
    },

    /**
     * @name setMultiTypePanelSort
     * @param {array} sortConfig the sort options array
     * @desc builds the setpanelsort query
     * @returns {string} query
     */
    setMultiTypePanelSort: function (sortConfig) {
        return (
            'SetMultiTypePanelSort(sortConfig=' +
            JSON.stringify(sortConfig) +
            ')'
        );
    },

    /**
     * @name unsortPanel
     * @desc removes sorts in the panel
     * @returns {string} query
     */
    unsortPanel: function () {
        var query = '';

        query += 'UnsortPanel()';

        return query;
    },

    /**
     * @name addPanelComment
     * @param {object} comment - comment object to add to the panel
     * @desc adds comment to panel
     * @returns {string} query
     */
    addPanelComment: function (comment) {
        var query = '';
        comment.commentText = encodeURIComponent(comment.commentText);
        query = 'AddPanelComment(' + JSON.stringify(comment) + ')';

        return query;
    },

    /**
     * @name removePanelComment
     * @param {object} commentId - comment id to remove
     * @desc removes panel comment by id
     * @returns {string} query
     */
    removePanelComment: function (commentId) {
        var query = '';

        query = 'RemovePanelComment(' + JSON.stringify(commentId) + ')';

        return query;
    },

    /**
     * @name RetrievePanelComment
     * @desc retrieves saved comments for the panel
     * @returns {string} query
     */
    retrievePanelComments: function () {
        var query = '';

        query = 'RetrievePanelComment()';

        return query;
    },

    /**
     * @name addPanelEvents
     * @param {object} event - events to add to the panel
     * @desc adds and saves ornaments to the panel
     * @returns {string} query
     */
    addPanelEvents: function (event) {
        var query = '',
            queryObj = {},
            action,
            eventName,
            eventIdx,
            uniqueName,
            queryId;

        // we're going to pull out all of the queries in events we're adding...
        // because we don't want to stringify the queries themselves...
        // that causes issues with double escapes if the query is doing (for example) set panel view of a default-handle
        for (action in event) {
            if (event.hasOwnProperty(action)) {
                for (eventName in event[action]) {
                    if (event[action].hasOwnProperty(eventName)) {
                        for (
                            eventIdx = 0;
                            eventIdx < event[action][eventName].length;
                            eventIdx++
                        ) {
                            uniqueName = action + eventName + eventIdx;
                            queryObj['<' + uniqueName + '>'] =
                                event[action][eventName][eventIdx].query;
                            event[action][eventName][eventIdx].query =
                                '<' + uniqueName + '>';
                        }
                    }
                }
            }
        }

        query = 'AddPanelEvents(' + JSON.stringify(event) + ')';

        for (queryId in queryObj) {
            if (queryObj.hasOwnProperty(queryId)) {
                query = query.replace(queryId, queryObj[queryId]);
            }
        }

        return query;
    },

    /**
     * @name removePanelEvents
     * @param {object} event - event to remove from the panel
     * @desc removes the specified event panel
     * @returns {string} query
     */
    removePanelEvents: function (event) {
        var query = '';

        query = 'RemovePanelEvents("' + event + '")';

        return query;
    },

    /**
     * @name retrievePanelOrnaments
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @desc retrieves saved ornaments from the panel
     * @returns {string} query
     */
    retrievePanelEvents: function (accessor) {
        var query = '';

        query = 'RetrievePanelEvents(';

        if (accessor) {
            query += '"' + accessor + '"';
        }

        query += ')';

        return query;
    },

    /**
     * @name getPanelCollect
     * @desc get the collect limit from the BE
     * @returns {string} query
     */
    getPanelCollect: function () {
        var query = '';

        query = 'GetPanelCollect()';

        return query;
    },

    /**
     * @name setPanelCollect
     * @param {number} limit the limit to set in the BE
     * @desc set the collect limit in the BE
     * @returns {string} query
     */
    setPanelCollect: function (limit) {
        var query = '';

        query = 'SetPanelCollect(';

        query += limit;

        query += ')';

        return query;
    },

    /**
     * @name with
     * @param {object} panelId - panelId
     * @desc creates with panel id query
     * @returns {string} query
     */
    with: function (panelId) {
        var query = '';

        query = 'With(Panel(' + panelId + '))';

        return query;
    },

    /**
     * @name hasDuplicates
     * @param {array} fields - fields to check duplicates on
     * @desc check whether duplicates exist for the parameters
     * @returns {string} query
     */
    hasDuplicates: function (fields) {
        var query = '',
            i;
        query += 'HasDuplicates(';
        for (i = 0; i < fields.length; i++) {
            query += fields[i] + ',';
        }
        query = this.trim(query, ',');
        query += ')';

        return query;
    },

    /**
     * @name group
     * @desc specifies a grouping for a math operation
     * @param {string} group the field to perform the grouping on
     * @returns {string} query
     */
    group: function (group) {
        var query = '',
            i,
            len = group.length;

        if (group.length > 0) {
            for (i = 0; i < len; i++) {
                query += group[i] + ',';
            }

            query = this.trim(query, ',');
            query = 'Group(' + query + ')';
        }

        return query;
    },

    /**
     * @name sort
     * @param {array} cols the columns to sort
     * @param {array} directions the directions of the columns
     * @returns {string} query
     */
    sort: function (cols, directions) {
        var query = '';

        query = 'Sort(columns=' + JSON.stringify(cols);

        if (directions) {
            query += ', sort=' + JSON.stringify(directions);
        }

        query += ')';
        return query;
    },

    /**
     * @name importParamOptions
     * @desc get the params available to be used from the insight
     * @returns {string} query
     */
    importParamOptions() {
        var query = '';

        query += 'ImportParamOptions()';

        return query;
    },

    /**
     * @name getInsightParameters
     * @desc get the list of existing insight parameters
     * @returns {string} query
     */
    getInsightParameters() {
        var query = '';

        query += 'GetInsightParameters()';

        return query;
    },

    /**
     * @name addInsightParameter
     * @param {object} paramStruct the details of the param
     * @desc add this param
     * @returns {string} query
     */
    addInsightParameter(paramStruct) {
        var query = '';

        query += 'AddInsightParameter(';

        query += 'paramStruct=[' + JSON.stringify(paramStruct) + ']';

        query += ')';

        return query;
    },

    /**
     * @name updateInsightParameter
     * @param {object} paramStruct the details of the param
     * @desc update this param
     * @returns {string} query
     */
    updateInsightParameter(paramStruct) {
        var query = '';

        query += 'UpdateInsightParameter(';

        query += 'paramStruct=[' + JSON.stringify(paramStruct) + ']';

        query += ')';

        return query;
    },

    /**
     * @name deleteInsightParameter
     * @param {string} paramName the name of the param to delete
     * @desc delete the insight parameter specified via param name
     * @returns {string} query
     */
    deleteInsightParameter(paramName) {
        var query = '';

        query += 'DeleteInsightParameter(';

        query += 'paramName=["' + paramName + '"]';

        query += ')';

        return query;
    },

    /**
     * @name saveInsight
     * @param {string} project - project to save to
     * @param {string} insightName - new question name
     * @param {boolean} isGlobal - is the insight global (true) or private (false)
     * @param {array} steps - steps to save
     * @param {string} layout - layout to save as
     * @param {string} image - image of the saved insight
     * @param {string} appVar - the variable containing the app name
     * @param {array} tags - list of tags
     * @param {string} description - the description for this insight
     * @param {boolean} cacheable - list of tags
     * @param {number} cacheMinutes - the description for this insight
     * @param {boolean} cacheEncrypt - the description for this insight
     * @desc constructs a save pixel
     * @returns {string} query
     */
    saveInsight: function (
        project,
        insightName,
        isGlobal,
        steps,
        layout,
        image,
        appVar,
        tags,
        description,
        cacheable,
        cacheMinutes,
        cacheEncrypt,
        cacheCron
    ) {
        var query = '',
            i,
            len;

        query += 'SaveInsight(';
        if (project) {
            query += 'project=["' + project + '"], ';
        } else if (appVar) {
            query += 'project=[' + appVar + '], ';
        }
        query += 'insightName=["' + insightName + '"], ';
        query += 'global=[' + isGlobal + '], ';
        if (steps && steps.length > 0) {
            query += 'recipe=[';

            for (i = 0, len = steps.length; i < len; i++) {
                query +=
                    '"<sEncode>' + steps[i].expression + '</sEncode>"' + ', ';
            }

            query = this.trim(query, ',');
            query += '], ';
        }

        query += 'layout=["' + layout + '"]';

        if (image) {
            query += ', image=["' + image + '"]';
        }

        if (tags && tags.length > 0) {
            query += ', tags=' + JSON.stringify(tags);
        }

        if (description) {
            query += ', description=["' + description + '"]';
        }

        query += `, cache=[${cacheable}]`;
        query += `, cacheMinutes=[${cacheMinutes}]`;
        query += `, cacheEncrypt=[${cacheEncrypt}]`;
        query += `, cacheCron=["${cacheCron}"]`;

        query += ')';

        return query;
    },

    /**
     * @name updateInsight
     * @param {string} project - project to save to
     * @param {string} insightName - new question name
     * @param {boolean} isGlobal - is the insight global (true) or private (false)
     * @param {array} steps - steps to save
     * @param {string} layout - layout to save as
     * @param {string} image - image of the saved insight
     * @param {string} rdbmsId - id of the insisght db
     * @param {string} appVar - the variable containing the app name
     * @param {array} tags - list of tags
     * @param {string} description - the description for this insight
     * @param {boolean} cacheable - cache insight
     * @param {number} cacheMinutes - number of minutes for cache
     * @param {boolean} cacheEncrypt - encrypt cache
     * @desc constructs an update insight pixel
     * @returns {string} query
     */
    updateInsight: function (
        project,
        insightName,
        isGlobal,
        steps,
        layout,
        image,
        rdbmsId,
        appVar,
        tags,
        description,
        cacheable,
        cacheMinutes,
        cacheEncrypt,
        cacheCron
    ) {
        var query = '',
            i,
            len;

        query += 'UpdateInsight(';

        if (project) {
            query += 'project=["' + project + '"], ';
        } else if (appVar) {
            query += 'project=[' + appVar + '], ';
        }

        query += 'insightName=["' + insightName + '"], ';
        query += 'global=[' + isGlobal + '], ';
        if (steps && steps.length > 0) {
            query += 'recipe=[';

            for (i = 0, len = steps.length; i < len; i++) {
                query +=
                    '"<sEncode>' + steps[i].expression + '</sEncode>"' + ', ';
            }

            query = this.trim(query, ',');
            query += '], ';
        }
        query += 'layout=["' + layout + '"], ';
        if (image) {
            query += 'image=["' + image + '"], ';
        }
        query += 'id=["' + rdbmsId + '"] ';

        if (tags && tags.length > 0) {
            query += ', tags=' + JSON.stringify(tags);
        }

        if (description) {
            query += ', description=["' + description + '"]';
        }

        query += `, cache=[${cacheable}]`;
        query += `, cacheMinutes=[${cacheMinutes}]`;
        query += `, cacheEncrypt=[${cacheEncrypt}]`;
        query += `, cacheCron=["${cacheCron}"]`;

        query += ')';

        return query;
    },

    /**
     * @name dashboardInsightConfig
     * @param {array} insightArray - array of insightInfo and insightId in the current dashbaord
     * @param {object} currentLayout - dashboard layout
     * @param {string} selectedLayout - dashboard selectedLayout
     * @desc constructs a dashboardInsightConfig pixel
     * @returns {string} query
     */
    dashboardInsightConfig: function (
        insightArray,
        currentLayout,
        selectedLayout
    ) {
        var query = '',
            i,
            len = insightArray.length;

        query += 'DashboardInsightConfig(';
        query += 'insights=[';
        for (i = 0; i < len; i++) {
            query +=
                '"' +
                insightArray[i].app_id +
                '__' +
                insightArray[i].app_insight_id +
                '"' +
                ', ';
        }
        query = this.trim(query, ',');
        query += '], ';
        query += 'oldIds=[';
        for (i = 0; i < len; i++) {
            query += '"' + insightArray[i].insightID + '"' + ', ';
        }
        query = this.trim(query, ',');
        query += '], ';
        query += 'layout=["<encode>';
        query += JSON.stringify({
            currentLayout: currentLayout,
            selectedLayout: selectedLayout,
        });
        query += '</encode>"';
        query += '] ';
        query += ')';

        return query;
    },

    /* Meta Pixel*/
    /**
     * @name getDatabaseMetamodel
     * @param {string} database - name of the database to get metamodel for
     * @param {array} options - array of options
     * @returns {string} query
     */
    getDatabaseMetamodel: function (database, options, viewOnly) {
        var query = '';

        query += 'GetDatabaseMetamodel(';
        query += ' database=["' + database + '"]';
        if (options && options.length > 0) {
            query += ', options=' + JSON.stringify(options) + '';
        }
        if (viewOnly) {
            query += ', options=' + JSON.stringify(options) + '';
        }
        query += ')';

        return query;
    },

    /**
     * @name getDatabaseTableStructure
     * @param {string} database - name of the database to get table info for
     * @returns {string} query
     */
    getDatabaseTableStructure: function (database) {
        var query = '';

        query = 'GetDatabaseTableStructure(database=["' + database + '"])';

        return query;
    },

    /**
     * @name getFrameMetamodel
     * @param {array} options - array of options
     * @returns {string} query
     */
    getFrameMetamodel: function (options) {
        var query = '';

        query += 'GetFrameMetamodel(';
        if (options && options.length > 0) {
            query += 'options=' + JSON.stringify(options) + '';
        }
        query += ')';

        return query;
    },

    /**
     * @name getFrameTableStructure
     * @returns {string} query
     */
    getFrameTableStructure: function () {
        var query = '';

        query = 'GetFrameTableStructure()';

        return query;
    },

    /**
     * @name predictDataTypes
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter to use for the file
     * @param {boolean} rowCount - rowCount
     * @desc predict the datatypes based on a file
     * @returns {string} the query
     */
    predictDataTypes: function (path, delimiter, rowCount) {
        var query = '';

        query += 'PredictDataTypes(';
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'rowCount=[' + rowCount + ']);';
        return query;
    },

    /**
     * @name predictExcelDataTypes
     * @param {string} path - path to the file to upload
     * @desc predict the datatypes based on a file
     * @returns {string} the query
     */
    predictExcelDataTypes: function (path) {
        var query = '';

        query += 'PredictExcelDataTypes(';
        query += 'filePath=["' + path + '"]);';
        return query;
    },

    /**
     * @name predictMetamodel
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter to use for the file
     * @param {boolean} rowCount - rowCount
     * @desc predict the metamodel based on a file
     * @returns {string} the query
     */
    predictMetamodel: function (path, delimiter, rowCount) {
        var query = '';

        query += 'PredictMetamodel(';
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'rowCount=[' + rowCount + ']);';
        return query;
    },

    /**
     * @name generateDescription
     * @desc auto-generates descriptions for tables and databases using GPT-2 Word embeddings
     * @param {string} type - type of description to generate (App or Table)
     * @param {string} databaseId - database id
     * @param {string} tableName - table name (empty if it's for App generation)
     * @param {number} numDescriptions - the number of descriptions to generate
     * @returns {string} query
     */
    generateDescription: function (
        type,
        databaseId,
        tableName,
        numDescriptions
    ) {
        let query = '';

        query += 'RunGPT2Description(';
        if (type === 'table') {
            query += 'descriptionType=["Table"], ';
        } else {
            query += 'descriptionType=["App"], ';
        }
        query += `database=["${databaseId}"], `;
        query += `table=["${tableName}"], `;
        query += `numDescriptions=[${numDescriptions}]);`;

        return query;
    },

    /**
     * @name parseMetamodel
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter to use for the file
     * @param {boolean} rowCount - rowCount
     * @param {string} prop - path to the prop file
     * @desc predict the metamodel basd on a csv
     * @returns {string} the query
     */
    parseMetamodel: function (path, delimiter, rowCount, prop) {
        var query = '';

        query += 'ParseMetamodel(';
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'rowCount=[' + rowCount + '], ';
        query += 'propFile=["' + prop + '"]);';
        return query;
    },

    /**
     * @name rdbmsUploadTableData
     * @param {string} app - new app name
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter to use for the file
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {boolean} existing - add to existing?
     * @param {string} appVar - the variable containing the app name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    rdbmsUploadTableData: function (
        app,
        path,
        delimiter,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        existing,
        appVar
    ) {
        var query = '';

        query += 'RdbmsUploadTableData(';
        if (appVar) {
            query += 'database=[' + appVar + '], ';
        } else {
            query += 'database=["' + app + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },

    /**
     * @name rdbmsUploadExcelData
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {boolean} existing - add to existing?
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    rdbmsUploadExcelData: function (
        database,
        path,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        existing,
        databaseVar
    ) {
        var query = '';

        query += 'RdbmsUploadExcelData(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },

    /**
     * @name rdbmsCsvUpload
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter
     * @param {string} propFile - path to propfile
     * @param {object} metamodel - map of the metamodel
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {boolean} existing - add to existing?
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    rdbmsCsvUpload: function (
        database,
        path,
        delimiter,
        propFile,
        metamodel,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        existing,
        databaseVar
    ) {
        var query = '';

        query += 'RdbmsCsvUpload(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        if (propFile) {
            query += 'propFile=["' + propFile + '"], ';
        }
        query += 'metamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },

    /**
     * @name rdfCsvUpload
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter
     * @param {string} propFile - path to propfile
     * @param {object} metamodel - map of the metamodel
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {string} uri - custom base uri?
     * @param {boolean} existing - add to existing?
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    rdfCsvUpload: function (
        database,
        path,
        delimiter,
        propFile,
        metamodel,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        uri,
        existing,
        databaseVar
    ) {
        var query = '';

        query += 'RdfCsvUpload(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        if (propFile) {
            query += 'propFile=["' + propFile + '"], ';
        }
        query += 'metamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'customBaseURI=["' + uri + '"], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },
    /**
     * @name tinkerCsvUpload
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter
     * @param {string} propFile - path to propfile
     * @param {object} metamodel - map of the metamodel
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {string} tinkerDriver - type of tinker driver to create?
     * @param {boolean} existing - add to existing?
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    tinkerCsvUpload: function (
        database,
        path,
        delimiter,
        propFile,
        metamodel,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        tinkerDriver,
        existing,
        databaseVar
    ) {
        var query = '';

        query += 'TinkerCsvUpload(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        if (propFile) {
            query += 'propFile=["' + propFile + '"], ';
        }
        query += 'metamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'tinkerDriver=["' + tinkerDriver + '"], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },

    /**
     * @name rdfLoaderSheetUpload
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {string} uri - custom base uri?
     * @param {boolean} existing - add to existing?
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a loadersheet as a new database
     * @returns {string} the query
     */
    rdfLoaderSheetUpload: function (
        database,
        path,
        uri,
        existing,
        databaseVar
    ) {
        var query = '';

        query += 'RdfLoaderSheetUpload(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'customBaseURI=["' + uri + '"], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },

    /**
     * @name rdbmsLoaderSheetUpload
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {boolean} existing - add to existing?
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a loadersheet as a new database
     * @returns {string} the query
     */
    rdbmsLoaderSheetUpload: function (database, path, existing, databaseVar) {
        var query = '';

        query += 'RdbmsLoaderSheetUpload(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'existing=[' + existing + ']);';

        return query;
    },

    /**
     * @name rdbmsReplaceDatabaseCsvUpload
     * @param {string} database the database to replace
     * @param {string} filePath the filePath to grab file
     * @param {string} delimiter the delimiter to use for csv file
     * @param {object} propFile the property file to use
     * @param {object} metamodel the metamodel for this database
     * @param {object} dataTypeMap the mapping from column to type
     * @param {object} newHeaders new headers to add
     * @param {object} additionalDataTypes additional information on data type such as date format
     * @param {object} descriptionMap the description mapping for columns
     * @param {object} logicalNamesMap the logical name mapping
     * @desc replace database for a rdbms db via csv
     * @returns {string} pixel query
     */
    rdbmsReplaceDatabaseCsvUpload: function (
        database,
        filePath,
        delimiter,
        propFile,
        metamodel,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap
    ) {
        var query = '';

        query += 'rdbmsReplaceDatabaseCsvUpload(';

        query += 'database=["' + database + '"], ';
        query += 'filePath=["' + filePath + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        if (propFile) {
            query += 'propFile=["' + propFile + '"], ';
        }
        query += 'metamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + ']';

        query += ')';

        return query;
    },

    /**
     * @name rdbmsReplaceDatabaseExcelUpload
     * @param {string} databaseId the database to replace
     * @param {string} filePath the filePath to grab file
     * @param {object} dataTypeMap the mapping from column to type
     * @param {object} newHeaders new headers to add
     * @param {object} additionalDataTypes additional information on data type such as date format
     * @param {object} descriptionMap the description mapping for columns
     * @param {object} logicalNamesMap the logical name mapping
     * @desc replace database for a rdbms db via csv
     * @returns {string} pixel query
     */
    rdbmsReplaceDatabaseExcelUpload: function (
        databaseId,
        filePath,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap
    ) {
        var query = '';

        query += 'RdbmsReplaceDatabaseExcelUpload(';

        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + filePath + '"], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + ']';

        query += ')';

        return query;
    },

    /**
     * @name rdbmsReplaceDatabaseLoaderSheetUpload
     * @param {string} databaseId - the database to replace
     * @param {string} filePath - path to the file to upload
     * @param {boolean} existing - add to existing?
     * @param {string} appVar - the variable containing the app name
     * @desc upload a loadersheet as a new database
     * @returns {string} the query
     */
    rdbmsReplaceDatabaseLoaderSheetUpload: function (databaseId, filePath) {
        var query = '';

        query += 'RdbmsReplaceDatabaseLoaderSheetUpload(';
        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + filePath + '"]';

        query += ')';

        return query;
    },

    /**
     * @name rdbmsReplaceDatabaseUploadTable
     * @param {string} databaseId - the database to replace
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter to use for the file
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {boolean} existing - add to existing?
     * @param {string} appVar - the variable containing the app name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    rdbmsReplaceDatabaseUploadTable: function (
        databaseId,
        path,
        delimiter,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap
    ) {
        var query = '';

        query += 'RdbmsReplaceDatabaseUploadTable(';

        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + ']';

        query += ')';
        return query;
    },

    /**
     * @name rdfReplaceDatabaseLoaderSheetUpload
     * @param {string} databaseId the database to replace
     * @param {string} filePath the path to grab file
     * @param {string} customBaseURI the uri to use
     * @desc replace database for rdf via a loader sheet
     * @returns {string} pixel query
     */
    rdfReplaceDatabaseLoaderSheetUpload: function (
        databaseId,
        filePath,
        customBaseURI
    ) {
        var query = '';

        query += 'RdfReplaceDatabaseLoaderSheetUpload(';

        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + filePath + '"], ';
        query += 'customBaseURI=["' + customBaseURI + '"]';

        query += ')';
        return query;
    },

    /**
     * @name rdfReplaceDatabaseCsvUpload
     * @param {string} databaseId the database to replace
     * @param {string} filePath to path to grab csv file
     * @param {string} delimiter the delimiter to use
     * @param {object} propFile the property file to use
     * @param {object} metamodel the metamodel of db
     * @param {object} dataTypeMap the type mapping from column to type
     * @param {object} newHeaders new headers to add
     * @param {object} additionalDataTypes additional informatino on the data type such as date format
     * @param {object} descriptionMap description of columns
     * @param {object} logicalNamesMap mapping of logical names
     * @param {string} customBaseURI the base uri to use
     * @desc replace the rdf database via a csv file
     * @returns {string} the pixel query
     */
    rdfReplaceDatabaseCsvUpload: function (
        databaseId,
        filePath,
        delimiter,
        propFile,
        metamodel,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        customBaseURI
    ) {
        var query = '';

        query += 'RdfReplaceDatabaseCsvUpload(';

        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + filePath + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        if (propFile) {
            query += 'propFile=["' + propFile + '"], ';
        }
        query += 'metamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'customBaseURI=["' + customBaseURI + '"]';

        query += ')';

        return query;
    },

    /**
     * @name rReplaceDatabaseCsvUpload
     * @param {string} databaseId - the database to replace
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @desc upload a CSV as an R Native App
     * @returns {string} the query
     */
    rReplaceDatabaseCsvUpload: function (
        databaseId,
        path,
        delimiter,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap
    ) {
        var query = '';

        query += 'RReplaceDatabaseCsvUpload(';

        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + ']';
        query += ');';

        return query;
    },

    /**
     * @name tinkerReplaceDatabaseCsvUpload
     * @param {string} databaseId - the database to replace
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter
     * @param {string} propFile - path to propfile
     * @param {object} metamodel - map of the metamodel
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {string} tinkerDriver - type of tinker driver to create?
     * @param {boolean} existing - add to existing?
     * @param {string} appVar - the variable containing the app name
     * @desc upload a CSV or TSV as a new database
     * @returns {string} the query
     */
    tinkerReplaceDatabaseCsvUpload: function (
        databaseId,
        path,
        delimiter,
        propFile,
        metamodel,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        tinkerDriver
    ) {
        var query = '';

        query += 'TinkerReplaceDatabaseCsvUpload(';

        query += 'database=["' + databaseId + '"], ';
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        if (propFile) {
            query += 'propFile=["' + propFile + '"], ';
        }
        query += 'metamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + '], ';
        query += 'tinkerDriver=["' + tinkerDriver + '"]';

        query += ')';

        return query;
    },

    /**
     * @name externalUpdateJdbcTablesAndViews
     * @param {string} databaseId the database id to get tables and views from
     * @desc get the tables and views for this app
     * @returns {string} pixel query
     */
    externalUpdateJdbcTablesAndViews: function (databaseId) {
        var query = '';

        query += 'ExternalUpdateJdbcTablesAndViews(';
        query += 'database=["' + databaseId + '"]';
        query += ')';

        return query;
    },

    /**
     * @name externalUpdateJdbcSchema
     * @param {string} databaseId the database to sync new tables and views to
     * @param {array} tablesAndViews the tables and views to sync to this app
     * @desc update the selected tables and views for this app
     * @returns {string} the pixel query
     */
    externalUpdateJdbcSchema: function (databaseId, tablesAndViews) {
        var query = '';

        query += 'ExternalUpdateJdbcSchema(';
        query += 'database=["' + databaseId + '"]';
        query += ', filters=' + JSON.stringify(tablesAndViews);

        query += ')';

        return query;
    },

    /**
     * @name externalJdbcTablesAndViews
     * @param {string} conDetails - JSON string map of connection details
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    externalJdbcTablesAndViews: function (conDetails) {
        var query = '',
            newConDetails =
                conDetails && Object.keys(conDetails).length > 0
                    ? conDetails
                    : {};

        // BE expecting specific names in the object as the key, so lets convert them here.
        for (let key in newConDetails) {
            if (newConDetails.hasOwnProperty(key)) {
                if (key === 'connectionString') {
                    newConDetails.CONNECTION_URL = newConDetails[key];
                    delete newConDetails[key];
                }

                if (key === 'username') {
                    newConDetails.USERNAME = newConDetails[key];
                    delete newConDetails[key];
                }

                if (key === 'password') {
                    newConDetails.PASSWORD = newConDetails[key];
                    delete newConDetails[key];
                }
            }
        }

        query += 'ExternalJdbcTablesAndViews(';
        query += 'conDetails=[' + JSON.stringify(newConDetails) + ']';
        query += ')';

        return query;
    },

    /**
     * @name externalJdbcSchema
     * @param {string} conDetails - JSON string map of connection details
     * @param {array} filters - filter information
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    externalJdbcSchema: function (conDetails, filters) {
        var query = '',
            newConDetails =
                conDetails && Object.keys(conDetails).length > 0
                    ? conDetails
                    : {};

        // BE expecting specific names in the object as the key, so lets convert them here.
        for (let key in newConDetails) {
            if (newConDetails.hasOwnProperty(key)) {
                if (key === 'connectionString') {
                    newConDetails.CONNECTION_URL = newConDetails[key];
                    delete newConDetails[key];
                }

                if (key === 'username') {
                    newConDetails.USERNAME = newConDetails[key];
                    delete newConDetails[key];
                }

                if (key === 'password') {
                    newConDetails.PASSWORD = newConDetails[key];
                    delete newConDetails[key];
                }
            }
        }

        query += 'ExternalJdbcSchema(';
        query += 'conDetails=[' + JSON.stringify(newConDetails) + ']';
        if (filters) {
            query += ', filters=' + JSON.stringify(filters) + '';
        }

        query += ')';

        return query;
    },

    /**
     * @name rdbmsExternalUpload
     * @param {string} conDetails - JSON string map of connection details
     * @param {string} databaseId - new app name
     * @param {string} metamodel - ?
     * @desc delete the cache so it can recache when running
     * @returns {string} the query
     */
    rdbmsExternalUpload: function (conDetails, databaseId, metamodel) {
        var query = '',
            newConDetails =
                conDetails && Object.keys(conDetails).length > 0
                    ? conDetails
                    : {};

        // BE expecting specific names in the object as the key, so lets convert them here.
        for (let key in newConDetails) {
            if (newConDetails.hasOwnProperty(key)) {
                if (key === 'connectionString') {
                    newConDetails.CONNECTION_URL = newConDetails[key];
                    delete newConDetails[key];
                }

                if (key === 'username') {
                    newConDetails.USERNAME = newConDetails[key];
                    delete newConDetails[key];
                }

                if (key === 'password') {
                    newConDetails.PASSWORD = newConDetails[key];
                    delete newConDetails[key];
                }
            }
        }

        query += 'RdbmsExternalUpload(';
        query += 'conDetails=[' + JSON.stringify(newConDetails) + '], ';
        query += 'database=["' + databaseId + '"], ';
        query += 'metamodel=[' + JSON.stringify(metamodel) + ']';
        query += ')';

        return query;
    },

    /**
     * @name rCsvUpload
     * @param {string} database - new database name
     * @param {string} path - path to the file to upload
     * @param {string} delimiter - delimiter
     * @param {object} dataTypeMap - map of the dataTypes
     * @param {object} newHeaders - map of the new headers
     * @param {object} additionalDataTypes - map of the additional types
     * @param {object} descriptionMap - map of descriptions
     * @param {object} logicalNamesMap - map of logical names
     * @param {string} databaseVar - the variable containing the database name
     * @desc upload a CSV as an R Native App
     * @returns {string} the query
     */
    rCsvUpload: function (
        database,
        path,
        delimiter,
        dataTypeMap,
        newHeaders,
        additionalDataTypes,
        descriptionMap,
        logicalNamesMap,
        databaseVar
    ) {
        var query = '';

        query += 'RCsvUpload(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'filePath=["' + path + '"], ';
        query += 'delimiter=["' + delimiter + '"], ';
        query += 'dataTypeMap=[' + JSON.stringify(dataTypeMap) + '], ';
        query += 'newHeaders=[' + JSON.stringify(newHeaders) + '], ';
        query +=
            'additionalDataTypes=[' +
            JSON.stringify(additionalDataTypes) +
            '], ';
        query += 'descriptionMap=[' + JSON.stringify(descriptionMap) + '], ';
        query += 'logicalNamesMap=[' + JSON.stringify(logicalNamesMap) + ']';
        query += ');';

        return query;
    },

    /**
     * @name getGraphProperties
     * @param {string} path - path
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    getGraphProperties: function (path) {
        var query = '',
            newPath = path ? path : '';

        query += 'GetGraphProperties(';
        query += 'filePath=["' + newPath + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name getGraphMetaModel
     * @param {string} path - path
     * @param {string} graphType - graphType for user
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    getGraphMetaModel: function (path, graphType) {
        var query = '',
            newPath = path ? path : '',
            newGraphType = graphType ? graphType : '';

        query += 'GetGraphMetaModel(';
        query += 'filePath=["' + newPath + '"], ';
        query += 'graphTypeId=["' + newGraphType + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name CreateExternalGraphDatabase
     * @param {string} path - path
     * @param {string} graphType - graphType
     * @param {string} graphName - graphName
     * @param {object} metamodel - metamodel to import
     * @param {string} database - new app name
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    createExternalGraphDatabase: function (
        path,
        graphType,
        graphName,
        metamodel,
        database
    ) {
        var query = '',
            newPath = path ? path : '',
            newGraphType = graphType ? graphType : '',
            newGraphName = graphName ? graphName : '';

        query += 'CreateExternalGraphDatabase(';
        query += 'filePath=["' + newPath + '"], ';
        query += 'graphTypeId=["' + newGraphType + '"], ';
        query += 'graphNameId=["' + newGraphName + '"], ';
        query += 'graphMetamodel=[' + JSON.stringify(metamodel) + '], ';
        query += 'database=["' + database + '"]';
        query += ')';

        return query;
    },
    /**
     * @name getDSEGraphProperties
     * @param {string} host - database host
     * @param {string} port - database port
     * @param {string} graph - graph name
     * @param {string} username - username to access db
     * @param {string} password - password for user
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    getDSEGraphProperties: function (host, port, graph, username, password) {
        var query = '',
            newHost = host ? host : '',
            newPort = port ? port : '',
            newGraph = graph ? graph : '',
            newUser = username ? username : '',
            newPass = password ? password : '';

        query += 'GetDSEGraphProperties(';
        query += 'host=["' + newHost + '"], ';
        query += 'port=["' + newPort + '"], ';
        query += 'graphName=["' + newGraph + '"], ';
        query += 'username=["' + newUser + '"], ';
        query += 'password=["' + newPass + '"]';
        query += ')';

        return query;
    },

    /**
     * @name getDSEGraphMetaModel
     * @param {string} host - database host
     * @param {string} port - database port
     * @param {string} graph - graph name
     * @param {string} username - username to access db
     * @param {string} password - password for user
     * @param {string} graphType - graphType for user
     * @desc connects to external database and returns its contents
     * @return {object} database contents
     */
    getDSEGraphMetaModel: function (
        host,
        port,
        graph,
        username,
        password,
        graphType
    ) {
        var query = '',
            newHost = host ? host : '',
            newPort = port ? port : '',
            newGraph = graph ? graph : '',
            newUser = username ? username : '',
            newPass = password ? password : '',
            newGraphType = graphType ? graphType : '';

        query += 'GetDSEGraphMetaModel(';
        query += 'host=["' + newHost + '"], ';
        query += 'port=["' + newPort + '"], ';
        query += 'graphName=["' + newGraph + '"], ';
        query += 'username=["' + newUser + '"], ';
        query += 'password=["' + newPass + '"], ';
        query += 'graphTypeId=["' + newGraphType + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name insightMetamodel
     * @desc gets the frame metamodel
     * @returns {string} query
     */
    insightMetamodel: function () {
        var query = '';

        query = 'InsightMetamodel()';

        return query;
    },

    /**
     * @name getConnected
     * @param {array} conceptualNames a list of logical names to get conencted concepts for
     * @param {boolean} isLogical boolean to indicate if its a list of logical names
     * @returns {string} query
     */
    getTraversalOptions: function (conceptualNames, isLogical) {
        var query = '';

        query = 'GetTraversalOptions(values=' + JSON.stringify(conceptualNames);

        if (isLogical) {
            query += ', logical=[true]';
        }

        query += ')';

        return query;
    },

    /**
     * @name getConceptProperties
     * @param {array} logicalNames a list of logical names to get properties for
     * @param {array} database - the database to search for
     * @returns {string} query
     */
    getConceptProperties: function (logicalNames, database) {
        var query = '';

        query = 'GetConceptProperties(concepts=' + JSON.stringify(logicalNames);

        if (database) {
            query += ', database=["' + database + '"]';
        }

        query += ')';

        return query;
    },

    /**
     * @name getDatabaseConcepts
     * @param {string} database the database to get concepts for
     * @returns {string} query
     */
    getDatabaseConcepts: function (database) {
        var query = '';

        query = 'GetDatabaseConcepts(database=["' + database + '"])';

        return query;
    },

    /**
     * @name getDatabaseConnections
     * @param {array} columns - columns to
     * @param {string} database - database
     * @returns {string} query
     */
    getDatabaseConnections: function (columns, database) {
        var query = '',
            i,
            len;

        query = 'GetDatabaseConnections(';
        query += 'columns=[';
        for (i = 0, len = columns.length; i < len; i++) {
            query += '"' + columns[i] + '"' + ', ';
        }
        query = this.trim(query, ',');
        query += ']';

        if (database) {
            query += ', database=["' + database + '"]';
        }

        query += ')';

        return query;
    },

    /**
     * @name toDatabase
     * @param {string} targetDatabase the database to write to
     * @param {string} targetTable the table to write to
     * @param {boolean} override whether to override the data in existing table
     * @param {boolean} insertId whether to generate an id column
     * @desc save frame to a database table
     * @returns {string} query
     */
    toDatabase: function (targetDatabase, targetTable, override, insertId) {
        var query = '';

        query =
            'ToDatabase(targetDatabase=["' +
            targetDatabase +
            '"], targetTable=["' +
            targetTable +
            '"], override=[' +
            override +
            '], insertId=[' +
            insertId +
            '])';

        return query;
    },

    /**
     * @name WRITE_TO_DATABASE
     * @param {object} inputVars input variables
     * @return {string} pipeline string
     */
    WRITE_TO_DATABASE: function (inputVars) {
        var inputString = '';

        inputString += 'targetDatabase=["' + inputVars.targetDatabase + '"],';
        inputString += 'targetTable=["' + inputVars.targetTable + '"],';
        inputString += 'override=[' + inputVars.override + '],';
        inputString += 'insertId=[' + inputVars.insertId + ']';

        return inputString;
    },

    /**
     * @name getSpecificConceptProperties
     * @param {string} database - the database to get properties for
     * @param {string} concept - the concept to get properties for
     * @returns {string} query
     */
    getSpecificConceptProperties: function (database, concept) {
        var query = '';

        query =
            'GetSpecificConceptProperties(database=["' +
            database +
            '"], concept=[' +
            concept +
            '])';

        return query;
    },

    /**
     * @name getDatabaseList
     * @returns {string} query
     */
    getDatabaseList: function () {
        var query = '';

        query = 'GetDatabaseList()';

        return query;
    },

    /**
     * @name getProjectList
     * @returns {string} query
     */
    getProjectList: function () {
        var query = '';

        query = 'GetProjectList()';

        return query;
    },

    /**
     * @name getFrameFilters
     * @returns {string} query
     */
    getFrameFilters: function () {
        var query = '';

        query = 'GetFrameFilters()';

        return query;
    },

    /**
     * @name getFrameFiltersQS
     * @returns {string} query
     */
    getFrameFiltersQS: function () {
        var query = '';

        query = 'GetFrameFiltersQS()';

        return query;
    },

    /**
     * @name updateInsightImage
     * @param {string} project -  project to update
     * @param {number} rdbmsId - the rdbmsId of the insight to be updated
     * @param {string} url - the url for BE to fetch the image from
     * @returns {string} query for updating an insights image on feed
     */
    updateInsightImage: function (project, rdbmsId, url) {
        var query = '';

        query += 'UpdateInsightImage(';
        query += 'project=["' + project + '"], ';
        query += 'id=["' + rdbmsId + '"], ';
        query += 'url=["' + url + '"]';
        query += ')';

        return query;
    },

    /**
     * @name updateRowValues
     * @param {string} col The column to perform replacement on
     * @param {number | string | date} replacementValue The value to be used for replacement
     * @param {Array} replacementArray The values in col to be replaced with replacementValue
     * @returns {string} The updateRowValues query to be run
     */
    updateRowValues: function (col, replacementValue, replacementArray) {
        var query = '',
            i;

        query =
            'UpdateRowValues(' +
            col +
            ', ' +
            '"' +
            replacementValue +
            '", Filter(' +
            col +
            ' == [';

        for (i = 0; i < replacementArray.length; i++) {
            query += '"' + replacementArray[i] + '"';

            if (i !== replacementArray.length - 1) {
                query += ', ';
            }
        }

        query += ']))';

        return query;
    },

    // App calls

    /**
     * @name myProjects
     * @desc create the pixel to get my myProjects
     * @param {boolean} onlyFavorites - if true, then only favorited apps will be returned
     * @param {string} sort - sort type ("date", "name")
     * @returns {string} the pixel query
     */
    myProjects: function (onlyFavorites) {
        var query = '';
        query += 'MyProjects(';

        if (typeof onlyFavorites !== 'undefined') {
            query += `onlyFavorites=[${onlyFavorites}], `;
        }

        query = this.trim(query, ',');

        query += ')';
        return query;
    },

    /**
     * @name myDatabases
     * @desc create the pixel to get my databases
     * @param {boolean} onlyFavorites - if true, then only favorited apps will be returned
     * @param {string} sort - sort type ("date", "name")
     * @returns {string} the pixel query
     */
    myDatabases: function (
        onlyFavorites,
        sort,
        metaKeys,
        metaFilters,
        limit,
        offset,
        filter
    ) {
        var query = '';
        query += 'MyDatabases(';

        if (typeof onlyFavorites !== 'undefined') {
            query += `onlyFavorites=[${onlyFavorites}], `;
        }
        if (typeof sort !== 'undefined') {
            query += `sort=["${sort}"], `;
        }
        if (typeof metaKeys !== 'undefined') {
            query += `metaKeys=${JSON.stringify(metaKeys)}, `;
        }
        if (typeof metaFilters !== 'undefined') {
            query += `metaFilters=${JSON.stringify(metaFilters)}, `;
        }
        if (typeof filter !== 'undefined' && filter) {
            query += 'filterWord=["' + filter + '"], ';
        }
        if (typeof sort !== 'undefined') {
            query += `sort=["${sort}"], `;
        }
        if (typeof limit !== 'undefined' && typeof offset !== 'undefined') {
            query += 'limit=["' + limit + '"], ';
            query += 'offset=["' + offset + '"],';
        }

        query = this.trim(query, ',');

        query += ')';
        return query;
    },

    /**
     * @name myDatabases
     * @desc create the pixel to get my databases
     * @param {boolean} onlyFavorites - if true, then only favorited apps will be returned
     * @param {string} sort - sort type ("date", "name")
     * @returns {string} the pixel query
     */
    myDiscoverableDatabases: function (
        onlyFavorites,
        sort,
        metaKeys,
        metaFilters,
        limit,
        offset,
        filter
    ) {
        var query = '';
        query += 'MyDiscoverableDatabases(';

        if (typeof onlyFavorites !== 'undefined') {
            query += `onlyFavorites=[${onlyFavorites}], `;
        }

        if (typeof sort !== 'undefined') {
            query += `sort=["${sort}"], `;
        }
        if (typeof metaKeys !== 'undefined') {
            query += `metaKeys=${JSON.stringify(metaKeys)}, `;
        }
        if (typeof metaFilters !== 'undefined') {
            query += `metaFilters=${JSON.stringify(metaFilters)}, `;
        }
        if (typeof filter !== 'undefined' && filter) {
            query += 'filterWord=["' + filter + '"], ';
        }
        if (typeof sort !== 'undefined') {
            query += `sort=["${sort}"], `;
        }
        if (typeof limit !== 'undefined' && typeof offset !== 'undefined') {
            query += 'limit=["' + limit + '"], ';
            query += 'offset=["' + offset + '"],';
        }

        query = this.trim(query, ',');

        query += ')';
        return query;
    },

    /**
     * @name printMetadata
     * @desc create the pixel to export a pdf of the database metadata
     * @param {string} database - database to export
     * @returns {string} the pixel query
     */
    requestDatabase: function (database, permission = 'READ_ONLY') {
        var query = '';

        query += 'RequestDatabase(';
        query += 'database=["';
        query += database;
        query += '"], ';
        query += 'permission=["';
        query += permission;
        query += '"]';
        query += ')';

        return query;
    },

    /**
     * @name projectInfo
     * @desc create the pixel to get metadata for the project
     * @param {string} project - the project name
     * @returns {string} the pixel query
     */
    projectInfo: function (project) {
        var query = '';

        query += 'ProjectInfo(';
        query += 'project=["' + project + '"]';
        query += ')';

        return query;
    },

    /**
     * @name databaseInfo
     * @desc create the pixel to get metadata for the database
     * @param {string} database - the database name
     * @returns {string} the pixel query
     */
    databaseInfo: function (database) {
        var query = '';

        query += 'DatabaseInfo(';
        query += 'database=["' + database + '"]';
        query += ')';

        return query;
    },

    /**
     * @name databaseUsers
     * @desc create the pixel to get users of the database
     * @param {string} databaseId - the database id
     * @returns {string} the pixel query
     */
    databaseUsers: function (databaseId) {
        var query = '';

        query += 'DatabaseUsers(';
        query += 'database=["' + databaseId + '"]';
        query += ')';

        return query;
    },

    /**
     * @name projectUsers
     * @desc create the pixel to get users of the project
     * @param {string} projectId - the project id
     * @returns {string} the pixel query
     */
    projectUsers: function (projectId) {
        var query = '';

        query += 'ProjectUsers(';
        query += 'project=["' + projectId + '"]';
        query += ')';

        return query;
    },

    /**
     * @name naturalLanguageSearch
     * @desc create the pixel to get the insights for an app
     * @param {string} searchQuery - the search query
     * @param {array} database - the database names
     * @param {boolean} global - scope of the query. If true will be all DB (string query), if false will be at frame level (template query).
     * @param {number} panelId - the ID to create the new panel with
     * @returns {string} the pixel query
     */
    naturalLanguageSearch: function (searchQuery, database, global, panelId) {
        var query = '';

        query += 'NaturalLanguageSearch(';
        query +=
            'query=["' +
            JSON.stringify(searchQuery).replace(/"/g, '\\"') +
            '"], ';
        query += 'database=' + JSON.stringify(database) + ', ';
        query += 'global = [' + global + ']';
        if (panelId) {
            query += ', panel = [' + panelId + ']';
        } else {
            query += ', panel = [0]';
        }
        query += ')';

        return query;
    },

    /**
     * @name naturalLanguagePredictVizType
     * @desc predict the visualization type for the nlp suggested insight
     * @param {string} databaseId - selected database ID
     * @param {array} columns - columns to include in viz
     * @returns {string} the pixel query
     */
    naturalLanguagePredictVizType: function (databaseId, columns) {
        var query = '';
        // query += 'Frame ( frame = [ ' + frame + ' ] )| ';
        query += 'PredictViz(';
        query += 'database=["' + databaseId + '"], ';
        query += 'columns=' + JSON.stringify(columns) + '';
        query += ')';

        return query;
    },

    /**
     * @name nlsQueryHelper
     * @desc create the pixel to get the insights for an app
     * @param {string} searchQuery - the search query
     * @param {array} database - the database names
     * @param {boolean} global - scope of the query. If true will be all DB (string query), if false will be at frame level (template query).
     * @returns {string} the pixel query
     */
    nlsQueryHelper: function (searchQuery, database, global) {
        var query = '';

        query += 'NLSQueryHelper(';
        query +=
            'query=["' +
            JSON.stringify(searchQuery).replace(/"/g, '\\"') +
            '"], ';
        query += 'database=' + JSON.stringify(database) + ', ';
        query += 'helpOn = [ true ], ';
        query += 'global = [  ' + global + ']';
        query += ')';

        return query;
    },

    /**
     * @name getInsights
     * @desc create the pixel to get the insights for an app
     * @param {string | array} project - the app name
     * @param {string} limit - requested limit
     * @param {string} offset - requested offset
     * @param {string} filter - filter workd
     * @param {array} tags - tags to search on
     * @param {boolean} onlyFavorites - if true, then only favorited insights will be returned
     * @param {string} sort - the sort type ("date", "name")
     * @returns {string} the pixel query
     */
    getInsights: function (
        project,
        limit,
        offset,
        filter,
        tags,
        onlyFavorites,
        sort
    ) {
        var query = '',
            j;

        query += 'GetInsights(';

        if (typeof project !== undefined && project) {
            if (typeof project === 'object') {
                if (project.length > 0) {
                    query += 'project=[';
                    for (j = 0; j < project.length; j++) {
                        if (j === project.length - 1) {
                            query += '"' + project[j] + '"';
                        } else {
                            query += '"' + project[j] + '"' + ', ';
                        }
                    }
                    query += '], ';
                }
            } else {
                query += 'project=["' + project + '"], ';
            }
        }

        if (typeof limit !== 'undefined' && typeof offset !== 'undefined') {
            query += 'limit=["' + limit + '"], ';
            query += 'offset=["' + offset + '"],';
        }

        if (typeof filter !== 'undefined' && filter) {
            query += 'filterWord=["' + filter + '"], ';
        }

        if (typeof tags !== 'undefined' && tags.length > 0) {
            query += ` metaFilters=[{'tag':${JSON.stringify(tags)}}],`;
        }

        if (typeof onlyFavorites !== 'undefined') {
            query += `onlyFavorites=[${onlyFavorites}], `;
        }

        if (typeof sort !== 'undefined') {
            query += `sort=["${sort}"], `;
        }

        query = this.trim(query, ',');

        query += ')';

        return query;
    },

    /**
     * @name openDatabase
     * @desc create the pixel to open an database
     * @param {string} app - database to open
     * @returns {string} the pixel query
     */
    openDatabase: function (app) {
        var query = '';

        query += 'OpenDatabase(';
        query += 'database=["';
        query += app;
        query += '"] ';
        query += ')';

        return query;
    },

    /**
     * @name exportProject
     * @desc create the pixel to export a project
     * @param {string} project - project to export
     * @returns {string} the pixel query
     */
    exportProject: function (project) {
        var query = '';

        query += 'ExportProject(';
        query += 'project=["';
        query += project;
        query += '"] ';
        query += ')';

        return query;
    },

    /**
     * @name exportDatabase
     * @desc create the pixel to export a database
     * @param {string} database - database to export
     * @returns {string} the pixel query
     */
    exportDatabase: function (database) {
        var query = '';

        query += 'ExportDatabase(';
        query += 'database=["';
        query += database;
        query += '"] ';
        query += ')';

        return query;
    },

    /**
     * @name printMetadata
     * @desc create the pixel to export a pdf of the database metadata
     * @param {string} database - database to export
     * @returns {string} the pixel query
     */
    printMetadata: function (database) {
        var query = '';

        query += 'DatabaseMetadataToPdf(';
        query += 'database=["';
        query += database;
        query += '"] ';
        query += ')';

        return query;
    },

    /**
     * @name deleteProject
     * @desc create the pixel to delete a project
     * @param {array} projects - projects to delete
     * @returns {string} the pixel query
     */
    deleteProject: function (projects) {
        var query = '',
            i,
            len;

        query += 'DeleteProject(';
        query += 'project=[';
        for (i = 0, len = projects.length; i < len; i++) {
            query += '"' + projects[i] + '"' + ', ';
        }
        query = this.trim(query, ',');
        query += '] ';
        query += ')';

        return query;
    },

    /**
     * @name deleteDatabase
     * @desc create the pixel to delete a database
     * @param {array} databases - databases to delete
     * @returns {string} the pixel query
     */
    deleteDatabase: function (databases) {
        var query = '',
            i,
            len;

        query += 'DeleteDatabase(';
        query += 'database=[';
        for (i = 0, len = databases.length; i < len; i++) {
            query += '"' + databases[i] + '"' + ', ';
        }
        query = this.trim(query, ',');
        query += '] ';
        query += ')';

        return query;
    },

    /**
     * @name deleteInsight
     * @desc create the pixel to delete insights for a project
     * @param {string} projectId the project id to delete from
     * @param {array} insights insights to delete
     * @returns {string} the pixel query
     */
    deleteInsight: function (projectId, insights) {
        var query = '',
            i,
            len;

        query += 'DeleteInsight(project=["' + projectId + '"], ';
        query += 'id=[';
        for (i = 0, len = insights.length; i < len; i++) {
            query += '"' + insights[i] + '"' + ', ';
        }
        query = this.trim(query, ',');
        query += '] ';
        query += ')';

        return query;
    },

    /**
     * @name fuzzyMatches
     * @param {string} outputFrame - frame for matches to go to (random string)
     * @param {string} column - name of column to match
     * @param {string} frame - frame to get matches from
     * @desc gets fuzzy matches for a column
     * @return {string} query
     */
    fuzzyMatches: function (outputFrame, column, frame) {
        var query = '';

        query += 'FuzzyMatches(';
        if (frame) {
            query += 'frame=[' + frame + '], ';
        }
        query += 'outputFrame=["' + outputFrame + '"], ';
        query += 'frameCol=[' + column + '])';

        return query;
    },
    /**
     * @name fuzzyMerge
     * @param {object} params all the params
     * @returns {string} the pixel query
     */
    FUZZY_MERGE: function (params) {
        var query = '',
            param;

        for (param in params) {
            if (params.hasOwnProperty(param)) {
                query += param + '=[' + params[param] + '],';
            }
        }

        // remove trailing comma
        query = query.slice(0, -1);

        return query;
    },

    // /** PLEASE USE FuzzyMatches
    //  * @name federationBestMatches
    //  * @param {string} databaseId - id of the selected database to pull from
    //  * @param {string} conceptName - name of the selected column to pull from
    //  * @param {string} columnName - name of the selected column to pull from
    //  * @param {string} frameColumnName - name of the frameColumn tha tyou will interact with
    //  * @param {string} outputFrame - name of frame to use from output
    //  * @returns {string} the pixel query
    //  */
    // federationBestMatches: function (databaseId, conceptName, columnName, frameColumnName, outputFrame) {
    //     var query = '';

    //     query += 'FederationBestMatches(';
    //     query += 'database=[\"' + databaseId + '\"], ';
    //     query += 'concept=[\"' + conceptName + '\"], ';
    //     query += 'column=[\"' + columnName + '\"], ';
    //     query += 'frameCol=[\"' + frameColumnName + '\"] ';
    //     if (outputFrame) {
    //         query += ',';
    //         query += 'outputFrame=[\"' + outputFrame + '\"] ';
    //     }
    //     query += ')';

    //     return query;
    // },

    // /** PLEASE USE FuzzyMerge
    //  * @name FederationBlend
    //  * @param {string} databaseName - name of the selected database to pull from
    //  * @param {string} conceptName - name of the selected column to pull from
    //  * @param {string} columnName - name of the selected column to pull from
    //  * @param {string} fedFrame - name of the frame to federate with
    //  * @param {string} frameColumnName - name of the frameColumn tha tyou will interact with
    //  * @param {string} joinType - type of join
    //  * @param {array} acceptedMatches - accepted matches to use
    //  * @param {array} rejectedMatches - reject matches to use
    //  * @param {number} propagation - propagation score
    //  * @param {string} additionalCols - additional columns to bring in
    //  * @param {string} frame - frame to import into
    //  * @returns {string} the pixel query
    //  */
    // federationBlend: function (databaseName, conceptName, columnName, fedFrame, frameColumnName, joinType, acceptedMatches, rejectedMatches, propagation, additionalCols, frame) {
    //     var query = '',
    //         i, len;

    //     query += 'FederationBlend(';
    //     query += 'database=[\"' + databaseName + '\"], ';
    //     query += 'concept=[\"' + conceptName + '\"], ';
    //     query += 'column=[\"' + columnName + '\"], ';
    //     query += 'fedFrame=[\"' + fedFrame + '\"], ';
    //     query += 'frameCol=[\"' + frameColumnName + '\"], ';
    //     query += 'joinType=[\"' + joinType + '\"], ';
    //     query += 'matches=[';
    //     for (i = 0, len = acceptedMatches.length; i < len; i++) {
    //         query += ('\"' + acceptedMatches[i] + '\"' + ', ');
    //     }
    //     query = this.trim(query, ',');
    //     query += '], ';
    //     query += 'nonMatches=[';
    //     for (i = 0, len = rejectedMatches.length; i < len; i++) {
    //         query += ('\"' + rejectedMatches[i] + '\"' + ', ');
    //     }
    //     query = this.trim(query, ',');
    //     query += '], ';
    //     query += 'propagation=[' + propagation + '], ';
    //     query += 'additionalCols=[';
    //     for (i = 0, len = additionalCols.length; i < len; i++) {
    //         query += ('\"' + additionalCols[i] + '\"' + ', ');
    //     }
    //     query = this.trim(query, ',');
    //     query += '] ';
    //     if (frame) {
    //         query += ', frame=[' + frame + '] ';
    //     }
    //     query += ')';

    //     return query;
    // },

    // Git calls
    /**
     * @name isGit
     * @desc checks if an app is Gitified
     * @param {string} appName the name you want to use as the app name
     * @returns {string} the pixel query
     */
    isGit: function (appName) {
        var query = '';

        query += 'IsGit(';
        query += 'project=["' + appName + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name gitStatus
     * @desc checks the status of the app
     * @param {string} appName the name you want to use as the app name
     * @returns {string} the pixel query
     */
    gitStatus: function (appName) {
        var query = '';

        query += 'GitStatus(';
        query += 'app=["' + appName + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name copyAppRepo
     * @param {string} appName the name of the app you want to synchronize
     * @param {string} gitLocation the url link to your git
     * @desc create the pixel for to copy a 'git' app
     * @returns {string} the pixel query
     */

    copyAppRepo: function (appName, gitLocation) {
        var query = '';

        query += 'CopyAppRepo(';
        query += 'app=["' + appName + '"], ';
        query += 'repository=["' + gitLocation + '"] ';
        query += ')';

        return query;
    },
    /**
     * @name uploadAppRepo
     * @param {string} filePath - the path of the file
     * @param {string} fileSpace  - optional: the space where the file is located
     * @desc imports an app via a zip file
     * @returns {string} the pixel query
     */
    uploadAppRepo: function (filePath, fileSpace) {
        var query = '';
        query = `UploadApp(filePath=["${filePath}"], space=["${
            fileSpace ? fileSpace : ''
        }"])`;
        return query;
    },

    uploadDatabaseRepo: function (filePath, fileSpace) {
        var query = '';
        query = `UploadDatabase(filePath=["${filePath}"], space=["${
            fileSpace ? fileSpace : ''
        }"])`;
        return query;
    },

    uploadProjectRepo: function (filePath, fileSpace) {
        var query = '';
        query = `UploadProject(filePath=["${filePath}"], space=["${
            fileSpace ? fileSpace : ''
        }"])`;
        return query;
    },

    /* uploadAppRepo: function (filePath, fileSpace) {
        var query = '';
        query = `UploadApp(filePath=["${filePath}"], space=["${fileSpace ? fileSpace : ''}"])`;
        return query;
    },*/

    /**
     * @name initAppRepo
     * @param {string} appName the name of the app you want to synchronize
     * @param {string} gitLocation the url link to your git
     * @param {string} databaseSync  - sync the database?
     * @desc create the pixel for to create a new 'git' app
     * @returns {string} the pixel query
     */

    initAppRepo: function (appName, gitLocation, databaseSync) {
        var query = '';

        query += 'InitAppRepo(';
        query += 'app=["' + appName + '"], ';
        query += 'repository=["' + gitLocation + '"], ';
        query += 'syncDatabase=["' + databaseSync + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name syncApp
     * @param {string} appName - the name of the app you want to synchronize
     * @param {string} gitLocation - the url link to your git
     * @param {string} dualSync - true/false the dictates whether you are just pulling (false) or pulling and then pushing (true)
     * @param {string} databaseSync  - sync the database?
     * @desc create the pixel for synchronizing the app to/from git
     * @returns {string} the pixel query
     */
    syncApp: function (appName, gitLocation, dualSync, databaseSync) {
        var query = '';

        query += 'SyncApp(';
        query += 'app=["' + appName + '"], ';
        query += 'repository=["' + gitLocation + '"], ';
        query += 'dual=["' + dualSync + '"], ';
        query += 'syncDatabase=["' + databaseSync + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name syncAppFilesO
     * @param {string} appName - the name of the app you want to synchronize
     * @param {string} gitLocation - the url link to your git
     * @param {string} dualSync - true/false the dictates whether you are just pulling (false) or pulling and then pushing (true)
     * @param {array} files - files to sync
     * @param {string} databaseSync  - sync the database?
     * @desc create the pixel for synchronizing the app to/from git
     * @returns {string} the pixel query
     */
    syncAppFilesO: function (
        appName,
        gitLocation,
        dualSync,
        files,
        databaseSync
    ) {
        var query = '',
            i,
            len;

        query += 'SyncAppFilesO(';
        query += 'app=["' + appName + '"], ';
        query += 'repository=["' + gitLocation + '"], ';
        query += 'dual=["' + dualSync + '"], ';
        query += 'syncDatabase=["' + databaseSync + '"], ';
        query += 'files=[';
        for (i = 0, len = files.length; i < len; i++) {
            query += '"' + files[i] + '"' + ', ';
        }
        query = this.trim(query, ',');
        query += '] ';
        query += ')';

        return query;
    },

    /**
     * @name deleteAppRepo
     * @param {string} appName the name of the app you want to synchronize
     * @param {string} gitLocation the url link to your git
     * @desc create the pixel for to create a delete 'git' app (local + remote)
     * @returns {string} the pixel query
     */

    deleteAppRepo: function (appName, gitLocation) {
        var query = '';

        query += 'DeleteAppRepo(';
        query += 'app=["' + appName + '"], ';
        query += 'repository=["' + gitLocation + '"]';
        query += ')';

        return query;
    },

    /**
     * @name dropAppRepo
     * @param {string} appName the name of the app you want to synchronize
     * @param {string} gitLocation the url link to your git
     * @desc create the pixel for to a drop 'git' app (local)
     * @returns {string} the pixel query
     */

    dropAppRepo: function (appName, gitLocation) {
        var query = '';

        query += 'DropAppRepo(';
        query += 'app=["' + appName + '"], ';
        query += 'repository=["' + gitLocation + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name listAppRemotes
     * @desc get a list of remote repos associated with an app
     * @param {string} appName the name of the app you want to synchronize
     * @returns {string} the pixel query
     */
    listAppRemotes: function (appName) {
        var query = '';

        query += 'ListAppRemotes(';
        query += 'app=["' + appName + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name listAppCollaborators
     * @desc create the pixel to get all of the collabarators for this app/repo
     * @param {string} gitLocation the url link to your git
     * @returns {string} the pixel query
     */
    listAppCollaborators: function (gitLocation) {
        var query = '';

        query += 'ListAppCollaborators(';
        query += 'repository=["' + gitLocation + '"]';
        query += ')';
        return query;
    },

    /**
     * @name searchAppCollaborator
     * @desc create the pixel to search for a collabarators
     * @param {string} search search string
     * @returns {string} the pixel query
     */
    searchAppCollaborator: function (search) {
        var query = '';

        query += 'SearchAppCollaborator(';
        query += 'collaborator=["' + search + '"]';
        query += ')';

        return query;
    },

    /**
     * @name AddAppCollaborator
     * @param {string} gitLocation the url location of the git repository
     * @param {string} collaboratorAccName the name of the collaborator you want to add
     * @desc create the pixel for adding a collaborator to the repo
     * @returns {string} the pixel query
     */
    addAppCollaborator: function (gitLocation, collaboratorAccName) {
        var query = '';

        query += 'AddAppCollaborator(';
        query += 'repository=["' + gitLocation + '"], ';
        query += 'collaborator=["' + collaboratorAccName + '"]';
        query += ')';

        return query;
    },

    /**
     * @name removeAppCollaborator
     * @param {string} gitLocation the url location of the git repository
     * @param {string} collaboratorAccName the name of the collaborator you want to add
     * @desc create the pixel for removing a collaborator to the repo
     * @returns {string} the pixel query
     */
    removeAppCollaborator: function (gitLocation, collaboratorAccName) {
        var query = '';

        query += 'RemoveAppCollaborator(';
        query += 'repository=["' + gitLocation + '"], ';
        query += 'collaborator=["' + collaboratorAccName + '"]';
        query += ')';
        return query;
    },

    /**
     * @name scheduleJob
     * @param {string} jobName name of job to schedule
     * @param {string} jobGroup name of group job belongs to
     * @param {string} cronExpression a cron expression
     * @param {string} recipe pixel to run for job
     * @param {string} recipeParameters recipe parameter pixel to run for job
     * @param {array} jobTags array of the tags for the job
     * @param {boolean} onLoad whether to trigger on load
     * @param {string} uiState stringified object that BE will send back when listing jobs
     * @desc schedules a job
     * @return {string} the pixel query
     */
    scheduleJob: function (
        jobName,
        jobGroup,
        cronExpression,
        recipe,
        recipeParameters,
        jobTags,
        onLoad,
        uiState
    ) {
        var query = '',
            i;

        query += 'ScheduleJob(';
        query += 'jobName=["' + jobName + '"], ';
        query += 'jobGroup=["' + jobGroup + '"], ';
        query += 'cronExpression=["' + cronExpression + '"], ';
        query += 'recipe=["<encode>' + recipe + '</encode>"], ';
        if (recipeParameters) {
            query +=
                'recipeParameters=["<encode>' +
                recipeParameters +
                '</encode>"], ';
        }

        if (jobTags && jobTags.length > 0) {
            query += 'jobTags=["';
            for (i = 0; i < jobTags.length; i++) {
                if (i === jobTags.length - 1) {
                    query += jobTags[i] + '"], ';
                } else {
                    query += jobTags[i] + '", "';
                }
            }
        }
        query += 'uiState=["' + uiState + '"], ';
        query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false]';
        query += ')';

        return query;
    },

    /**
     * @name editScheduledJob
     * @param {string} jobId name of job to schedule
     * @param {string} jobName name of job to schedule
     * @param {string} jobGroup name of group job belongs to
     * @param {string} cronExpression a cron expression
     * @param {string} recipe pixel to run for job
     * @param {string} recipeParameters recipe parameter pixel to run for job
     * @param {array} jobTags tags for the job
     * @param {boolean} onLoad whether to trigger on load
     * @param {string} uiState stringified object that BE will send back when listing jobs
     * @param {string} curJobName current job name
     * @param {string} curJobGroup current job group
     * @desc reschedules a job
     * @return {string} the pixel query
     */
    editScheduledJob: function (
        jobId,
        jobName,
        jobGroup,
        cronExpression,
        recipe,
        recipeParameters,
        jobTags,
        onLoad,
        uiState,
        curJobName,
        curJobGroup
    ) {
        var query = '',
            i;

        query += 'EditScheduledJob(';
        query += 'jobId=["' + jobId + '"], ';
        query += 'jobName=["' + jobName + '"], ';
        query += 'jobGroup=["' + jobGroup + '"], ';
        query += 'cronExpression=["' + cronExpression + '"], ';
        query += 'recipe=["<encode>' + recipe + '</encode>"], ';
        if (recipeParameters) {
            query +=
                'recipeParameters=["<encode>' +
                recipeParameters +
                '</encode>"], ';
        }

        if (jobTags && jobTags.length > 0) {
            query += 'jobTags=["';
            for (i = 0; i < jobTags.length; i++) {
                if (i === jobTags.length - 1) {
                    query += jobTags[i] + '"], ';
                } else {
                    query += jobTags[i] + '", "';
                }
            }
        }
        query += 'uiState=["' + uiState + '"], ';
        query += 'triggerOnLoad=[' + onLoad + '], triggerNow=[false],';
        query += 'curJobName=["' + curJobName + '"], ';
        query += 'curJobGroup=["' + curJobGroup + '"]';
        query += ')';

        return query;
    },

    /**
     * @name executeScheduledJob
     * @param {string} jobId id of job to schedule
     * @param {string} jobGroup name of group job belongs to
     * @desc schedules a job
     * @return {string} the pixel query
     */
    executeScheduledJob: function (jobId, jobGroup) {
        var query = '';

        query += 'ExecuteScheduledJob(';
        query += 'jobId=["' + jobId + '"], ';
        query += 'jobGroup=["' + jobGroup + '"]';
        query += ')';

        return query;
    },

    /**
     * @name pauseJobTrigger
     * @param {string} jobId id of job to schedule
     * @param {string} jobGroup name of group job belongs to
     * @desc mark job as inactive
     * @return {string} the pixel query
     */
    pauseJobTrigger: function (jobId, jobGroup) {
        var query = '';

        query += 'PauseJobTrigger(';
        query += 'jobId=["' + jobId + '"], ';
        query += 'jobGroup=["' + jobGroup + '"]';
        query += ')';

        return query;
    },

    /**
     * @name ResumeJobTrigger
     * @param {string} jobId id of job to schedule
     * @param {string} jobGroup name of group job belongs to
     * @desc resumes a paused job
     * @return {string} the pixel query
     */
    resumeJobTrigger: function (jobId, jobGroup) {
        var query = '';

        query += 'ResumeJobTrigger(';
        query += 'jobId=["' + jobId + '"], ';
        query += 'jobGroup=["' + jobGroup + '"] ';
        query += ')';

        return query;
    },

    /**
     * @name deleteJob
     * @param {string} jobId id of job to schedule
     * @param {string} jobGroup name of group job belongs to
     * @desc pause a job
     * @return {string} the pixel query
     */
    removeJobFromDB: function (jobId, jobGroup) {
        var query = '';

        query += 'RemoveJobFromDB(';
        query += 'jobId=["' + jobId + '"], ';
        query += 'jobGroup=["' + jobGroup + '"]) ';
        return query;
    },

    /**
     * @name listAllJobs
     * @desc lists all available jobs in semoss
     * @param {array} jobTags list of tags for filtering
     * @return {string} the pixel query
     */
    listAllJobs: function (jobTags) {
        var query = '',
            i;

        if (!Array.isArray(jobTags) || !jobTags.length) {
            query += 'ListAllJobs()';
        } else {
            query += 'ListAllJobs(';

            query += 'jobTags=["';
            for (i = 0; i < jobTags.length; i++) {
                if (i === jobTags.length - 1) {
                    query += jobTags[i] + '"] ';
                } else {
                    query += jobTags[i] + '", "';
                }
            }

            query += ')';
        }
        return query;
    },

    /**
     * @name schedulerHistory
     * @desc lists the history of executed jobs in semoss
     * @param {string} appId the app id
     * @param {array} jobTags list of tags for filtering
     * @return {string} the pixel query
     */
    schedulerHistory: function (appId, jobTags) {
        // filters, limit, offset
        var query = '',
            i;
        if (!Array.isArray(jobTags) || !jobTags.length) {
            if (appId) {
                query +=
                    'SchedulerHistory(filters=[Filter(SMSS_JOB_RECIPES__JOB_GROUP == "' +
                    appId +
                    '")])';
            } else {
                query += 'SchedulerHistory()';
            }
        } else {
            if (appId) {
                query +=
                    'SchedulerHistory(filters=[Filter(SMSS_JOB_RECIPES__JOB_GROUP == "' +
                    appId +
                    '")], ';
            } else {
                query += 'SchedulerHistory(';
            }
            query += 'jobTags=["';
            for (i = 0; i < jobTags.length; i++) {
                if (i === jobTags.length - 1) {
                    query += jobTags[i] + '"] ';
                } else {
                    query += jobTags[i] + '", "';
                }
            }
            query += ')';
        }
        return query;
    },

    /**
     * @name getTemplateList
     * @desc lists all available templates in semoss
     * @param {string} projectId the project id for the templates
     * @return {string} the pixel query
     */
    getTemplateList: function (projectId) {
        var query = '';

        if (projectId) {
            query += 'GetTemplateList(project=["' + projectId + '"])';
        } else {
            query += 'GetTemplateList()';
        }
        return query;
    },

    /**
     * @name updateTemplate
     * @desc update a template in semoss
     * @param {string} projectId the project id for the templates
     * @param {string} templateName the template name
     * @param {string} templateFile the template file name
     * @return {string} the pixel query
     */
    updateTemplate: function (projectId, templateName, templateFile) {
        var query = '';

        query += 'UpdateTemplate(';
        query += 'project=["' + projectId + '"], ';
        query += 'template_name=["' + templateName + '"], ';
        query += 'template_file=["' + templateFile + '"]';
        query += ')';

        return query;
    },

    /**
     * @name deleteTemplate
     * @desc delete a template in semoss
     * @param {string} projectId the project id for the templates
     * @param {string} templateName the template name
     * @param {string} templateFile the template file name
     * @return {string} the pixel query
     */
    deleteTemplate: function (projectId, templateName, templateFile) {
        var query = '';

        query += 'DeleteTemplate(';
        query += 'project=["' + projectId + '"], ';
        query += 'template_name=["' + templateName + '"], ';
        query += 'template_file=["' + templateFile + '"]';
        query += ')';

        return query;
    },

    /**
     * @name GetPlaceHolders
     * @desc lists all available templates in semoss
     * @param {string} projectId the app id for the templates
     * @param {string} templateName project template name
     * @return {string} the pixel query
     */
    GetPlaceHolders: function (projectId, templateName) {
        var query = '';

        if (projectId && templateName) {
            query +=
                'GetPlaceHolders(project=["' +
                projectId +
                '"], template_name=["' +
                templateName +
                '"])';
        } else if (templateName) {
            query += 'GetPlaceHolders(template_name=["' + templateName + '"]))';
        } else {
            query += 'GetPlaceHolders()';
        }
        return query;
    },

    /**
     * @name addTemplate
     * @desc add a template in semoss
     * @param {string} projectId the project id for the templates
     * @param {string} templateName the template name
     * @param {string} templateFile the template file name
     * @return {string} the pixel query
     */
    addTemplate: function (projectId, templateName, templateFile) {
        var query = '';

        query += 'AddTemplate(';
        query += 'project=["' + projectId + '"], ';
        query += 'template_name=["' + templateName + '"], ';
        query += 'template_file=["' + templateFile + '"]';
        query += ')';

        return query;
    },

    /**
     * @name insightRecipe
     * @param {string} project Name of the project your insight is tied to
     * @param {string} rdbmsId The RDBMS ID of your insight
     * @returns {string} Pixel query to run
     * @desc creates and returns the pixel query for getting an insight's recipe
     */
    insightRecipe: function (project, rdbmsId) {
        var query = '';

        query +=
            'InsightRecipe(project=["' +
            project +
            '"], id=["' +
            rdbmsId +
            '"])';

        return query;
    },

    /**
     * @name getCurrentRecipe
     * @desc gets the insight's current recipe
     * @returns {string} query
     */
    getCurrentRecipe: function () {
        let query = '';

        query += 'GetCurrentRecipe()';

        return query;
    },

    /**
     * @name googleListFiles
     * @desc lists all of the google sheets files
     * @returns {string} the query
     */
    googleListFiles: function () {
        var query = '';

        query += 'GoogleListFiles()';

        return query;
    },

    /**
     * @name googleSheetSource
     * @param {string} sheetId unique id of the sheet
     * @param {string} sheetType the type of the sheet
     * @desc sets the google sheets as the data source
     * @returns {string} the query
     */
    googleFileRetriever: function (sheetId, sheetType) {
        var query = '';

        query += 'GoogleFileRetriever(id=["' + sheetId + '"],';

        query += 'type=["' + sheetType + '"])';

        return query;
    },

    /**
     * @name dropBoxListFiles
     * @desc lists all of the dropbox files (text/csv)
     * @returns {string} the query
     */
    dropBoxListFiles: function () {
        var query = '';

        query += 'DropBoxListFiles()';

        return query;
    },

    /**
     * @name dropBoxFileRetriever
     * @param {string} path path of the file
     * @desc sets the file as the data source
     * @returns {string} the query
     */
    dropBoxFileRetriever: function (path) {
        var query = '';

        query += 'DropBoxFileRetriever(path=["' + path + '"])';

        return query;
    },

    /**
     * @name oneDriveListFiles
     * @desc lists all of the one drive files (text/csv)
     * @returns {string} the query
     */
    oneDriveListFiles: function () {
        var query = '';

        query += 'OneDriveListFiles()';

        return query;
    },

    /**
     * @name oneDriveFileRetriever
     * @param {string} id unique id of the file
     * @desc sets the file as the data source
     * @returns {string} the query
     */
    oneDriveFileRetriever: function (id) {
        var query = '';

        query += 'OneDriveFileRetriever(id=["' + id + '"])';

        return query;
    },

    /**
     * @name api
     * @param {string} type - type of API to parse (JSON, XML, etc.)
     * @param {string} url -  API url to hit
     * @param {string} method - API method, post, etc.
     * @param {object} headers - headers for the call
     * @param {object} body - body for the call
     * @param {object} roots - roots of the path
     * @returns {string} Pixel query to run
     * @desc Creates and returns the API pixel query necessary for the jsonPath UI
     */
    api: function (type, url, method, headers, body, roots) {
        var query = '';

        query += 'API(';
        query += 'api_type=["' + type + '"]';
        query +=
            ', aliasMap=[' +
            JSON.stringify(
                angular.merge(
                    {
                        input_url: url,
                        input_method: method,
                    },
                    roots || {}
                )
            ) +
            ']';

        if (headers && Object.keys(headers).length > 0) {
            query += ', headersMap=[' + JSON.stringify(headers) + ']';
        }

        // Case that we are passing headers
        if (body && Object.keys(body).length > 0) {
            query += ', bodyMap=[' + JSON.stringify(body) + ']';
        }

        query += ')';

        return query;
    },

    /**
     * @name jsonPath
     * @param {string} apiType JSON, XML, etc.
     * @param {string} inputURL API url to hit
     * @param {string} inputMethod GET, POST, etc.
     * @param {array} aliases Array of alias strings to use
     * @param {array} jsonPaths Array of json path strings corresponding to aliases
     * @param {Object} headerMap Map of headers to pass through call
     * @returns {string} Pixel query to run
     * @desc Creates and returns the API pixel query necessary for the jsonPath UI
     */
    jsonPath: function (
        apiType,
        inputURL,
        inputMethod,
        aliases,
        jsonPaths,
        headerMap
    ) {
        var query = '',
            key,
            i = 0;

        query +=
            'API(api_type=["' +
            apiType +
            '"], aliasMap=[{"input_url": "' +
            inputURL +
            '", "input_method": "' +
            inputMethod.toLocaleLowerCase() +
            '", ';

        for (i; i < aliases.length; i++) {
            query += '"' + aliases[i] + '": "' + jsonPaths[i] + '", ';

            if (i === aliases.length - 1) {
                query = query.slice(0, -2);
            }
        }

        if (headerMap && Object.keys(headerMap).length > 0) {
            // Close our aliasMap array and open our
            // headersMap array
            query += '}], headersMap=[{';

            for (key in headerMap) {
                if (headerMap.hasOwnProperty(key)) {
                    query += '"' + key + '": ';
                    query += '"' + headerMap[key] + '"';
                    query += ', ';
                }
            }

            // Remove last comma space (, )
            query = query.slice(0, -2);
        }

        query += '}])'; // TODO::: multiple urls?

        return query;
    },

    /**
     * @name jsonPath
     * @param {string} apiType JSON, XML, etc.
     * @param {string} inputURL API url to hit
     * @param {string} inputMethod GET, POST, etc.
     * @param {string} root JMES Path for the root
     * @param {array} aliasCombos Array of alias combos to pass into the API call
     * @param {Object} headerMap Map of headers to pass through call
     * @returns {string} Pixel query to run
     * @desc Creates and returns the API pixel query necessary for the jsonPath UI
     */
    jmesPath: function (
        apiType,
        inputURL,
        inputMethod,
        root,
        aliasCombos,
        headerMap
    ) {
        var query = '',
            key,
            i;

        query +=
            'API(api_type=["' +
            apiType +
            '"], aliasMap=[{"input_url": "' +
            inputURL +
            '", "input_method": "' +
            inputMethod.toLocaleLowerCase() +
            '", "root": ' +
            root;

        if (aliasCombos) {
            for (i = 0; i < aliasCombos.length; i++) {
                query += ', ';
                query += '"' + aliasCombos[i].alias + '":';
                query += '"' + aliasCombos[i].property + '"';
            }
        }

        if (headerMap && Object.keys(headerMap).length > 0) {
            // Close our aliasMap array and open our
            // headersMap array
            query += '}], headersMap=[{';

            for (key in headerMap) {
                if (headerMap.hasOwnProperty(key)) {
                    query += '"' + key + '": ';
                    query += '"' + headerMap[key] + '"';
                    query += ', ';
                }
            }

            // Get rid of last comma
            query = query.slice(0, -2);
        }

        // Close our array
        query += '}])';

        return query;
    },

    /**
     * @name getNumTable
     * @param {string} URL URL string to hit
     * @param {string} inputMethod Type of input to use (GET, POST, etc.)
     * @param {Object} headerMap Optional object composed of headers to add to our URL
     * @returns {string} query
     * @desc Create the GetNumTable pixel to fetch the number of tables
     *       at a given URL
     */
    getNumTable: function (URL, inputMethod, headerMap) {
        var query = '',
            key;

        query += 'GetNumTable(url=["' + URL + '"], ';
        query +=
            'aliasMap=[{"input_method": "' + inputMethod.toLowerCase() + '"';

        if (headerMap && Object.keys(headerMap).length > 0) {
            query += '}], headersMap=[{';

            for (key in headerMap) {
                if (headerMap.hasOwnProperty(key)) {
                    query += '"' + key + '": ';
                    query += '"' + headerMap[key] + '"';
                    query += ', ';
                }
            }

            // Get rid of last comma
            query = query.slice(0, -2);
        }

        query += '}])';

        return query;
    },

    /**
     * @name getTableHeader
     * @param {string} URL URL to hit
     * @param {string} inputMethod Type of input to use (GET, POST, etc.)
     * @param {number} tableNumber The number of the table to pull eata from
     * @param {Object} headerMap Optional object composed of headers to add to our URL
     * @returns {string} query
     * @desc Creates the GetTableHeader pixel that fetches
     *       the names of a certain table on a web page.
     */
    getTableHeader: function (URL, inputMethod, tableNumber, headerMap) {
        var query = '',
            key;

        query += 'GetTableHeader(url=["' + URL + '"], ';
        query +=
            'aliasMap=[{"input_method": "' + inputMethod.toLowerCase() + '", ';
        query += '"table_number": ' + tableNumber;

        if (headerMap && Object.keys(headerMap).length > 0) {
            query += '}], headersMap=[{';

            for (key in headerMap) {
                if (headerMap.hasOwnProperty(key)) {
                    query += '"' + key + '": ';
                    query += '"' + headerMap[key] + '"';
                    query += ', ';
                }
            }

            // Get rid of last comma
            query = query.slice(0, -2);
        }

        query += '}])';

        return query;
    },

    /**
     * @name scrapeURL
     * @param {string} URL URL to hit
     * @param {string} inputMethod Type of input to use (GET, POST, etc.)
     * @param {number} tableNumber The number of the table to pull data from
     * @param {Object} headerMap Optional object composed of headers to add to the URL
     * @returns {string} query
     * @desc Creates the WEB API call to pull in data from a web page.
     */
    scrapeURL: function (URL, inputMethod, tableNumber, headerMap) {
        var query = '',
            key;

        query += 'API(api_type=["WEB"], ';
        query += 'aliasMap=[{"input_url": "' + URL + '", ';
        query += '"input_method": "' + inputMethod.toLowerCase() + '", ';
        query += '"table_number": ' + tableNumber;

        if (headerMap && Object.keys(headerMap).length > 0) {
            query += '}], headersMap=[{';

            for (key in headerMap) {
                if (headerMap.hasOwnProperty(key)) {
                    query += '"' + key + '": ';
                    query += '"' + headerMap[key] + '"';
                    query += ', ';
                }
            }

            // Get rid of last comma
            query = query.slice(0, -2);
        }

        query += '}])';

        return query;
    },

    /**
     * @name getRequest
     * @param {string} URL url to fetch data from
     * @param {object} headers -  map of headers for URL
     * @returns {string} pixel query to run
     * @desc Creates a simple GetRequest query that fetches data from an endpoint
     */
    getRequest: function (URL, headers) {
        var query = '';

        query += 'GetRequest(';
        query += 'url=["' + URL + '"]';

        // Case that we are passing headers
        if (headers && Object.keys(headers).length > 0) {
            query += ', headersMap=[' + JSON.stringify(headers) + ']';
        }

        query += ')';

        return query;
    },

    /**
     * @name postRequest
     * @param {string} URL url to fetch data from
     * @param {object} headers -  map of headers for URL
     * @param {object} body - map of body params for request
     * @returns {string} Pixel query to run
     * @desc Creates a simple GetRequest query that fetches data from an endpoint
     */
    postRequest: function (URL, headers, body) {
        var query = '';

        query += 'PostRequest(';
        query += 'url=["' + URL + '"]';

        // Case that we are passing headers
        if (headers && Object.keys(headers).length > 0) {
            query += ', headersMap=[' + JSON.stringify(headers) + ']';
        }

        // Case that we are passing body
        if (body && Object.keys(body).length > 0) {
            query += ', bodyMap=[' + JSON.stringify(body) + ']';
        }

        query += ')';

        return query;
    },

    /**
     * @name getInsightDataSources
     * @desc grabs all of the data source pixels in the insight
     * @returns {string} Pixel query
     */
    getInsightDatasources: function () {
        var query = '';

        query += 'GetInsightDatasources()';

        return query;
    },

    /**
     * @name modifyInsightDatasource
     * @param {array} options of datasources to replace along with their data {"index": 4, "pixel": "pixel"}
     * @desc modifies the data source used in this insight
     * @returns {string} the pixel query to run
     */
    modifyInsightDatasource: function (options) {
        var query = '';

        query +=
            'ModifyInsightDatasource(options=' + JSON.stringify(options) + ')';

        return query;
    },

    /**
     * @name generateNewApp
     * @param {string} appName the name of the app
     * @desc generate an empty app with insight
     * @returns {string} the query
     */
    generateEmptyApp: function (appName) {
        var query = '';

        query = 'GenerateEmptyApp(' + appName + ')';

        return query;
    },

    discretize: function (column, breaks, labels) {
        var query = '';

        query = 'Discretize([{"column":' + '"' + column + '", ';

        if (breaks) {
            query += '"breaks":"' + breaks + '"' + ', ';
        }

        if (labels) {
            // TODO
        } else {
            query = query.slice(0, -2);
            query += '}])';
        }

        return query;
    },

    /**
     * @name matchColumnValues
     * @param {string} col Name of a column in the frame
     * @returns {string} Pixel query to run
     * @desc Creates the MatchColumnValues pixel to get all of the matched
     *       column values in a particular column.
     */
    matchColumnValues: function (col) {
        var query = '';

        query += 'MatchColumnValues(column=["' + col + '"])';

        return query;
    },

    /**
     * @name updateMatchColumnValues
     * @param {string} col Name of the column in the frame
     * @param {array} matchArray Array of matched value objects to use in update
     * @param {string} tableName The name of the R table to update these values for
     * @returns {string} Pixel query to run
     * @desc Creates the UpdateMatchColumnValues pixel to update the R table
     *       containing the matches that a user has indicated.
     */
    updateMatchColumnValues: function (col, matchArray, tableName) {
        var query = '',
            i;

        query += 'UpdateMatchColumnValues(column=["' + col + '"], ';
        query += 'matches=[';

        for (i = 0; i < matchArray.length; i++) {
            query +=
                '"' + matchArray[i].left + ' == ' + matchArray[i].right + '"';

            if (i !== matchArray.length - 1) {
                query += ', ';
            }
        }

        query += '], ';
        query += 'matchesTable=["' + tableName + '"])';

        return query;
    },

    /**
     * @name semanticBlending
     * @param {array} cols The columns to run semantic blending with (required)
     * @param {number} display The display parameter (optional, default = 3)
     * @param {number} randomVals The randomVals parameter (optional, default = 20)
     * @param {boolean} genFrame The genFrame parameter (optional, default = false)
     * @param {string} frameName The frame to run this on (option, default = 'predictionFrame'...only needed when genFrame = true)
     * @return {string} Pixel query
     * @desc Creates and returns the pixel query for running semantic blending
     */
    semanticBlending: function (
        cols,
        display,
        randomVals,
        genFrame,
        frameName
    ) {
        var query = '',
            finalDisplay = display || 3,
            finalRandomVals = randomVals || 20,
            finalGenFrame = false,
            finalFrameName = frameName || 'predictionFrame',
            i;

        // Have to do this one separately since || only works for truthy vals
        if (genFrame) {
            finalGenFrame = genFrame;
        }

        query += 'SemanticBlending(columns=["';

        for (i = 0; i < cols.length; i++) {
            if (i === cols.length - 1) {
                query += cols[i] + '"], ';
            } else {
                query += cols[i] + '", "';
            }
        }

        query += 'display =["' + finalDisplay + '"], ';
        query += 'randomVals = ["' + finalRandomVals + '"], ';
        query += 'genFrame = [' + finalGenFrame + '], ';
        query += 'frameName = ["' + finalFrameName + '"])';

        return query;
    },

    /**
     * @name addInsightComment
     * @param {string} comment The insight comment String to be saved
     * @returns {string} Pixel query
     * @desc Creates and returns the pixel query for adding an insight comment
     */
    addInsightComment: function (comment) {
        var query = '';

        query += 'AddInsightComment("' + comment + '")';

        return query;
    },

    /**
     * @name modifyInsightComment
     * @param {string} id The id of the insight to modify
     * @param {string} newComment The new comment to replace the old comment with
     * @returns {string} pixel queyr
     * @desc Creates and returns the pixel query for modifying an insight comment
     */
    modifyInsightComment: function (id, newComment) {
        var query = '';

        query += 'ModifyInsightComment("' + id + '", "' + newComment + '")';

        return query;
    },

    /**
     * @name getInsightComments
     * @returns {string} Pixel query
     * @desc Creates and returns the pixel query for getting all insight comments
     */
    getInsightComments: function () {
        var query = '';

        query += 'GetInsightComments()';

        return query;
    },

    /**
     * @name getRuleTypes
     * @returns {string} Pixel query to run
     * @desc Creates the GetEditRuleTypes pixel to fetch all the pre-defined
     *       business rules held in the back-end.
     */
    getRuleTypes: function () {
        var query = '';

        query += 'GetRuleTypes()';

        return query;
    },

    /**
     * @name predictExcelRangeMetadata
     * @param {string} fileLocation the location of the file
     * @param {string} sheetName name of the sheet to parse
     * @param {string} range the range to get metadata for
     * @desc get the metadata for the range specified in the sheet
     * @returns {string} the full query
     */
    predictExcelRangeMetadata: function (fileLocation, sheetName, range) {
        var query = '';

        query +=
            'PredictExcelRangeMetadata(filePath=["' +
            fileLocation +
            '"], sheetName=["' +
            sheetName +
            '"], sheetRange=["' +
            range +
            '"])';

        return query;
    },

    /**
     * @name extractDatabaseMeta
     * @param {string} db name of db to store unique values
     * @param {boolean} descriptions true if called when user clicks optimize button instead of on upload
     * @param {string} dbVar - the variable containing the db name
     * @desc used in optimizing apps
     * @returns {string} the query
     */
    extractDatabaseMeta: function (db, descriptions, dbVar) {
        var pixel = 'ExtractDatabaseMeta( ';

        if (db) {
            pixel += 'database=["' + db + '"]';
        } else if (dbVar) {
            pixel += 'database=[' + dbVar + ']';
        }

        if (descriptions) {
            pixel += ', descriptions = [ true ]';
        }

        pixel += ')';

        return pixel;
    },

    /**
     * @name frameCache
     * @param {boolean} bool whether to turn frame cache on or off
     * @desc turns the frame cache on/off
     * @returns {string} the query
     */
    frameCache: function (bool) {
        var pixel = 'FrameCache(';

        pixel += '"' + bool + '"';

        pixel += ')';

        return pixel;
    },

    /**
     * @name frameType
     * @desc checks the frame type
     * @returns {string} the query
     */
    frameType: function () {
        var pixel = 'FrameType()';

        return pixel;
    },

    /**
     * @name deleteInsightCache
     * @param {string} app the name of the app to delete cache from
     * @param {string} insightId the id of the insight to delete cache for
     * @desc delete the cache so it can recache when running
     * @returns {string} the query
     */
    deleteInsightCache: function (app, insightId) {
        var pixel =
            'DeleteInsightCache(project=["' +
            app +
            '"], id=["' +
            insightId +
            '"])';

        return pixel;
    },

    /**
     * @name setInsightConfig
     * @param {string} config the stringified version of the insight config
     * @desc set the insight configurations
     * @returns {string} the query
     */
    setInsightConfig: function (config) {
        var pixel = 'SetInsightConfig(';

        pixel += JSON.stringify(config);

        pixel += ')';

        return pixel;
    },

    /**
     * @name setInsightCacheable
     * @param {string} app the app id the insight is from
     * @param {string} id the insight id
     * @param {boolean} cache set cacheable to true/false
     * @desc turning on/off the insight cache
     * @returns {string} the query
     */
    setInsightCacheable: function (app, id, cache) {
        var pixel = '';

        pixel +=
            'SetInsightCacheable("' + app + '", "' + id + '", ' + cache + ')';

        return pixel;
    },

    /**
     * @name cacheNativeFrame
     * @param {string} frame the frame to cache
     * @param {string} frameType the frame type of the cache
     * @desc starts a separate thread to perform the query + swap to the cached frame
     * @returns {string} the query
     */
    cacheNativeFrame: function (frame, frameType) {
        var pixel = '';

        pixel += 'CacheNativeFrame(';

        pixel += 'frame=[' + frame + '],';
        pixel += 'frameType=["' + frameType + '"]';

        pixel += ')';

        return pixel;
    },

    /**
     * @name generateFrameFromRVariable
     * @param {string} rVariable the name of the variable to bring into frame
     * @desc bring the data from the r variable to the frame
     * @returns {string} the pixel to run
     */
    generateFrameFromRVariable: function (rVariable) {
        var pixel = 'GenerateFrameFromRVariable("' + rVariable + '")';

        return pixel;
    },

    /**
     * @name generateFrameFromPyVariable
     * @param {string} pyVariable the name of the variable to bring into frame
     * @desc bring the data from the py variable to the frame
     * @returns {string} the pixel to run
     */
    generateFrameFromPyVariable: function (pyVariable) {
        var pixel = 'GenerateFrameFromPyVariable("' + pyVariable + '")';

        return pixel;
    },

    /**
     * @name databaseColumnUnique
     * @param {string} database the app id
     * @param {array} columns list of columns to check
     * @desc checks to see if the columns passed in will yield a unique row
     * @returns {string} the pixel to run
     */
    databaseColumnUnique: function (database, columns) {
        var pixel =
            'DatabaseColumnUnique(database=["' +
            database +
            '"], columns=' +
            JSON.stringify(columns) +
            ')';

        return pixel;
    },

    /**
     * @name getImageAsset
     * @param {string} filePath the the file path
     * @desc get the file image in base64 format
     * @returns {string} the pixel to run
     */
    getImageAsset: function (filePath) {
        var pixel = 'GetImageAsset(filePath=["';

        pixel += filePath;

        pixel += '"])';

        return pixel;
    },

    /** OWL **/
    /**
     * @name addOwlConcept
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} dataType - dataType
     * @param {string} additionalDataType - additionalDataTypes
     * @param {string} conceptual - conceptual
     * @param {string} description - description
     * @param {array} logicalNames - logicalNames
     * @param {string} databaseVar - the variable containing the database name
     * @desc add a concept to the owl
     * @returns {string} query
     */
    addOwlConcept: function (
        database,
        concept,
        column,
        dataType,
        additionalDataType,
        conceptual,
        description,
        logicalNames,
        databaseVar
    ) {
        var query = '';

        query += 'AddOwlConcept(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', column=["' + column + '"]';
        query += ', dataType=["' + dataType + '"]';
        if (typeof additionalDataType === 'string') {
            query += ', additionalDataType=["' + additionalDataType + '"]';
        } else {
            query +=
                ", additionalDataType=['" +
                JSON.stringify(additionalDataType) +
                "']";
        }
        query += ', conceptual=["' + conceptual + '"]';
        if (description) {
            query += ', description=["' + description + '"]';
        }
        if (logicalNames && logicalNames.length > 0) {
            query += ', logicalNames=' + JSON.stringify(logicalNames) + ' ';
        }

        query += ');';

        return query;
    },
    /**
     * @name removeOwlConcept
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} databaseVar - the variable containing the database name
     * @desc remove a concept from the owl
     * @returns {string} query
     */
    removeOwlConcept: function (database, concept, databaseVar) {
        var query = '';

        query += 'RemoveOwlConcept(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ');';

        return query;
    },
    /**
     * @name editOwlConceptDataType
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} dataType - dataType
     * @param {string} additionalDataType - additionalDataTypes
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit a concept's datatype in the owl
     * @returns {string} query
     */
    editOwlConceptDataType: function (
        database,
        concept,
        dataType,
        additionalDataType,
        databaseVar
    ) {
        var query = '';

        query += 'EditOwlConceptDataType(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', dataType=["' + dataType + '"]';
        if (typeof additionalDataType === 'string') {
            query += ', additionalDataType=["' + additionalDataType + '"]';
        } else {
            query +=
                ", additionalDataType=['" +
                JSON.stringify(additionalDataType) +
                "']";
        }
        query += ');';

        return query;
    },
    /**
     * @name editOwlConceptConceptualName
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} conceptual - conceptual
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit a concept's conceptural name in the owl
     * @returns {string} query
     */
    editOwlConceptConceptualName: function (
        database,
        concept,
        conceptual,
        databaseVar
    ) {
        var query = '';

        query += 'EditOwlConceptConceptualName(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', conceptual=["' + conceptual + '"]';
        query += ');';

        return query;
    },
    /**
     * @name addOwlProperty
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} dataType - dataType
     * @param {string} additionalDataType - additionalDataTypes
     * @param {string} conceptual - conceptual
     * @param {string} description - description
     * @param {array} logicalNames - logicalNames
     * @param {string} databaseVar - the variable containing the app name
     * @desc add a property to the owl
     * @returns {string} query
     */
    addOwlProperty: function (
        database,
        concept,
        column,
        dataType,
        additionalDataType,
        conceptual,
        description,
        logicalNames,
        databaseVar
    ) {
        var query = '';

        query += 'AddOwlProperty(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', column=["' + column + '"]';
        query += ', dataType=["' + dataType + '"]';
        if (typeof additionalDataType === 'string') {
            query += ', additionalDataType=["' + additionalDataType + '"]';
        } else {
            query +=
                ", additionalDataType=['" +
                JSON.stringify(additionalDataType) +
                "']";
        }
        query += ', conceptual=["' + conceptual + '"]';
        if (description) {
            query += ', description=["' + description + '"]';
        }
        if (logicalNames && logicalNames.length > 0) {
            query += ', logicalNames=' + JSON.stringify(logicalNames) + ' ';
        }

        query += ');';

        return query;
    },
    /**
     * @name removeOwlProperty
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} databaseVar - the variable containing the database name
     * @desc remove a property from the owl
     * @returns {string} query
     */
    removeOwlProperty: function (database, concept, column, databaseVar) {
        var query = '';

        query += 'RemoveOwlProperty(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', column=["' + column + '"]';
        query += ');';

        return query;
    },

    /**
     * @name editOwlPropertyDataType
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} dataType - dataType
     * @param {string} additionalDataType - additionalDataTypes
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit a property's datatype in the owl
     * @returns {string} query
     */
    editOwlPropertyDataType: function (
        database,
        concept,
        column,
        dataType,
        additionalDataType,
        databaseVar
    ) {
        var query = '';

        query += 'EditOwlPropertyDataType(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', column=["' + column + '"]';
        query += ', dataType=["' + dataType + '"]';
        if (typeof additionalDataType === 'string') {
            query += ', additionalDataType=["' + additionalDataType + '"]';
        } else {
            query +=
                ", additionalDataType=['" +
                JSON.stringify(additionalDataType) +
                "']";
        }
        query += ');';

        return query;
    },
    /**
     * @name editOwlPropertyConceptualName
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} conceptual - conceptual
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit a property's conceptural name in the owl
     * @returns {string} query
     */
    editOwlPropertyConceptualName: function (
        database,
        concept,
        column,
        conceptual,
        databaseVar
    ) {
        var query = '';

        query += 'EditOwlPropertyConceptualName(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        query += ', column=["' + column + '"]';
        query += ', conceptual=["' + conceptual + '"]';
        query += ');';

        return query;
    },
    /**
     * @name predictOwlDescription
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} databaseVar - the variable containing the database name
     * @desc predict descriptions in the owl
     * @returns {string} query
     */
    predictOwlDescription: function (database, concept, column, databaseVar) {
        var query = '';

        query += 'PredictOwlDescription(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        if (column) {
            query += ', column=["' + column + '"]';
        }
        query += ');';

        return query;
    },
    /**
     * @name editOwlDescription
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} description - description
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit descriptions in the owl
     * @returns {string} query
     */
    editOwlDescription: function (
        database,
        concept,
        column,
        description,
        databaseVar
    ) {
        var query = '';

        query += 'EditOwlDescription(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        if (column) {
            query += ', column=["' + column + '"]';
        }
        if (description) {
            query += ', description=["' + description + '"]';
        }
        query += ');';

        return query;
    },
    /**
     * @name predictOwlLogicalNames
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {string} databaseVar - the variable containing the database name
     * @desc predict logical names in the owl
     * @returns {string} query
     */
    predictOwlLogicalNames: function (database, concept, column, databaseVar) {
        var query = '';

        query += 'PredictOwlLogicalNames(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        if (column) {
            query += ', column=["' + column + '"]';
        }
        query += ');';

        return query;
    },
    /**
     * @name editOwlLogicalNames
     * @param {string} database - database
     * @param {string} concept - concept
     * @param {string} column - column
     * @param {array} logicalNames - logicalNames
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit the logical names in the owl
     * @returns {string} query
     */
    editOwlLogicalNames: function (
        database,
        concept,
        column,
        logicalNames,
        databaseVar
    ) {
        var query = '';

        query += 'EditOwlLogicalNames(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', concept=["' + concept + '"]';
        if (column) {
            query += ', column=["' + column + '"]';
        }
        if (logicalNames && logicalNames.length > 0) {
            query += ', logicalNames=' + JSON.stringify(logicalNames) + ' ';
        }

        query += ');';

        return query;
    },
    /**
     * @name addOwlRelationship
     * @param {string} database - database name
     * @param {array} startT - array of start table names
     * @param {array} startC - array of start column names
     * @param {array} endT - array of end table names
     * @param {array} endC - array of end column names
     * @param {string} store - where to store the results
     * @param {string} databaseVar - the variable containing the database name
     * @desc add a relationship to the owl
     * @returns {string} query
     */
    addOwlRelationship: function (
        database,
        startT,
        startC,
        endT,
        endC,
        store,
        databaseVar
    ) {
        var query = '';

        query += 'AddOwlRelationship(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', startT=' + JSON.stringify(startT) + ' ';
        query += ', startC=' + JSON.stringify(startC) + ' ';
        query += ', endT=' + JSON.stringify(endT) + ' ';
        query += ', endC=' + JSON.stringify(endC) + ' ';
        if (store) {
            query += ', store=[' + store + ']';
        }
        query += ');';

        return query;
    },
    /**
     * @name addBulkOwlRelationships
     * @param {string} database - database name
     * @param {string} frame - frame to add from
     * @param {number} propagation - propagation threshold
     * @param {string} store - where to store the results
     * @param {string} databaseVar - the variable containing the database name
     * @desc add a relationship to the owl
     * @returns {string} query
     */
    addBulkOwlRelationships: function (
        database,
        frame,
        propagation,
        store,
        databaseVar
    ) {
        var query = '';

        query += 'AddBulkOwlRelationships(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', frame=[' + frame + ']';
        query += ', propagation=[' + propagation + ']';
        if (store) {
            query += ', store=[' + store + ']';
        }
        query += ');';

        return query;
    },
    /**
     * @name removeOwlRelationship
     * @param {string} database - database name
     * @param {array} startT - array of start table names
     * @param {array} startC - array of start column names
     * @param {array} endT - array of end table names
     * @param {array} endC - array of end column names
     * @param {string} store - where to store the results
     * @param {string} databaseVar - the variable containing the database name
     * @desc add a relationship to the owl
     * @returns {string} query
     */
    removeOwlRelationship: function (
        database,
        startT,
        startC,
        endT,
        endC,
        store,
        databaseVar
    ) {
        var query = '';

        query += 'RemoveOwlRelationship(';
        if (databaseVar) {
            query += 'database=[' + databaseVar + ']';
        } else {
            query += 'database=["' + database + '"]';
        }
        query += ', startT=' + JSON.stringify(startT) + ' ';
        query += ', startC=' + JSON.stringify(startC) + ' ';
        query += ', endT=' + JSON.stringify(endT) + ' ';
        query += ', endC=' + JSON.stringify(endC) + ' ';
        if (store) {
            query += ', store=[' + store + ']';
        }
        query += ');';

        return query;
    },
    /**
     * @name saveOwlPositions
     * @param {string} database - database
     * @param {string} positions - map of the positions {table to x,y}
     * @param {string} databaseVar - the variable containing the database name
     * @desc edit the logical names in the owl
     * @returns {string} query
     */
    saveOwlPositions: function (database, positions, databaseVar) {
        var query = '';

        query += 'SaveOwlPositions (';
        if (databaseVar) {
            query += 'database=[' + databaseVar + '], ';
        } else {
            query += 'database=["' + database + '"], ';
        }
        query += 'positionMap=[' + JSON.stringify(positions) + '] ';

        query += ');';

        return query;
    },
    /**
     * @name syncDatabaseWithLocalMaster
     * @param {string} db - db name
     * @param {string} dbVar - the variable containing the db name
     * @desc sync the owl to local master
     * @returns {string} query
     */
    syncDatabaseWithLocalMaster: function (db, dbVar) {
        var query = '';

        query += 'SyncDatabaseWithLocalMaster(';
        if (dbVar) {
            query += 'database=[' + dbVar + ']';
        } else {
            query += 'database=["' + db + '"]';
        }
        query += ');';

        return query;
    },
    /**
     * @name runDataQuality
     * @param {string} ruleId - rule identifier
     * @param {string} columns - column to run the rule on
     * @param {array} options - specified formatting options for the rule
     * @param {string} inputTable - R data frame
     * @param {array} newFrame - whether or not to create a new frame
     * @desc run data quality pixel
     * @returns {string} query
     */
    runDataQuality: function (ruleId, columns, options, inputTable, newFrame) {
        var query = '',
            i;

        query += 'RunDataQuality ( rule = [ "' + ruleId + '" ] , ';
        query += ' column = [ "' + columns + '" ] , ';

        query += 'options = [ ';
        if (options && options.length > 0) {
            for (i = 0; i < options.length; i++) {
                query += '"' + options[i] + '"';
                query += ', ';
            }

            // trim trailing comma
            query = this.trim(query, ',');
        } else {
            query += '""';
        }
        query += ' ] , ';

        if (newFrame) {
            query += 'inputTable = ["' + inputTable + '"] ) ;';
        } else {
            query += 'inputTable = [' + inputTable + ' ] ) ;';
        }

        return query;
    },

    /**
     * @name runDocumentSummarization
     * @param {string} fileOrigin - input method
     * @param {string} userInput - document or text to summarize
     * @param {array} numSentences - max number of sentences to include in the summary
     * @param {string} numTopics - max number of topics to include in the summary
     * @param {array} numTopicTerms - max number of keywords to include in the summary
     * @desc run document summarization pixel
     * @returns {string} query
     */
    runDocumentSummarization: function (
        fileOrigin,
        userInput,
        numSentences,
        numTopics,
        numTopicTerms
    ) {
        var query = '';

        query +=
            'RunDocumentSummarization ( fileOrigin = [ "' +
            fileOrigin +
            '" ] , ';
        query += ' userInput = [ "' + userInput + '" ] , ';
        query += ' numSentences = [ "' + numSentences + '" ] , ';
        query += ' numTopics = [ "' + numTopics + '" ] , ';
        query += 'numTopicTerms = [ "' + numTopicTerms + '" ] ) ;';

        return query;
    },

    /**
     * @name dateAddValue
     * @desc creates param string for add date value pixel FOR PIPELINE
     * @param {string} srcCol values for dateAddValue
     * @param {string} newCol the new column
     * @param {string} unit unit
     * @param {string} valToAdd value to add
     * @return {string} query
     */
    dateAddValue: function (srcCol, newCol, unit, valToAdd) {
        var query = 'DateAddValue( ';

        query += 'column = [ "' + srcCol + '"], ';
        query += 'new_col = ["' + newCol + '"], ';
        query += 'unit = ["' + unit + '"], ';
        query += 'val_to_add = [' + valToAdd + '] )';

        return query;
    },

    /**
     * @name ChangeColumnType
     * @desc creates param string for add date value pixel FOR PIPELINE
     * @param {string} srcCol values for dateAddValue
     * @param {string} newCol the new column
     * @param {string} unit unit
     * @param {string} valToAdd value to add
     * @return {string} query
     */

    changeColumnType: function (col, dataType, format) {
        let query =
            'ChangeColumnType( column=[' +
            col +
            '], dataType=["' +
            dataType +
            '"]';
        if (format) {
            query += ', format=["' + format + '"]';
        }
        query += ')';
        return query;
    },

    /**
     * @name replayRecipe
     * @desc replay the full recipe
     * @returns {string} query
     */
    replayRecipe: function () {
        var query = 'ReplayRecipe(';

        query += ')';

        return query;
    },

    checkInsightNameExists: function (appId, insightName) {
        var query = 'CheckInsightNameExists(';

        query += 'project=["' + appId + '"], ';
        query += 'insightName=["' + insightName + '"]';

        query += ')';

        return query;
    },

    /**
     * @name storeInsightRecipeStepMetadata
     * @param {*} pixelId the unique id of the pixel step
     * @param {*} pixelAlias the alias for the pixel step
     * @param {*} pixelDescription the description for the pixel step
     * @desc store alias and description for the recipe step
     * @returns {string} query
     */
    storeInsightRecipeStepMetadata: function (
        pixelId,
        pixelAlias,
        pixelDescription
    ) {
        var query = 'StoreInsightRecipeStepMetadata(';

        query += 'pixelId="' + pixelId + '", ';
        query += 'alias="' + pixelAlias + '", ';
        query += 'description="' + pixelDescription + '" ';

        query += ')';
        console.log('storeInsightRecipeStepMetadata query: ', query);

        return query;
    },

    /**
     * @name editInsightRecipeStep
     * @param {*} pixelId the unique id of the pixel step
     * @param {*} pixel the new pixel to run in replace of the existing
     * @desc edit a specific recipe step
     * @returns {string} query
     */
    editInsightRecipeStep: function (pixelId, pixel) {
        var query = 'EditInsightRecipeStep(';

        query += 'pixelId=["' + pixelId + '"], ';
        query += 'pixel=["<encode>' + pixel + '</encode>"]';

        query += ')';

        return query;
    },

    /**
     * @name deleteInsightRecipeStep
     * @param {*} pixelIdxArr the unique id of the pixel steps
     * @param {boolean} propagate - if true, then the BE will automatically try to remove related downstream steps
     * @desc delete specific recipe steps
     * @returns {string} query
     */
    deleteInsightRecipeStep: function (pixelIdxArr, propagate) {
        var query = 'DeleteInsightRecipeStep(';

        query += 'pixelId=' + JSON.stringify(pixelIdxArr);

        if (typeof propagate === 'boolean') {
            query += `, propagate=[${propagate}]`;
        }

        query += ')';

        return query;
    },

    /**
     * @name positionInsightRecipeStep
     * @param {*} pixelId the pixel id to set position for
     * @param {*} positionMap the position details to set: auto, top, left
     * @desc sets the position of the block in pipeline
     * @returns {string} query
     */
    positionInsightRecipeStep: function (pixelId, positionMap) {
        var query = 'PositionInsightRecipeStep(';

        if (pixelId) {
            query += 'pixelId=["' + pixelId + '"], ';
        }
        query += 'positionMap=[' + JSON.stringify(positionMap) + ']';

        query += ')';

        return query;
    },

    /**
     * @name pbeDecrypt
     * @param {*} sql the encrypted sql; string or array
     * @param {boolean} isArray is the value passed an bytearray? [-1,2,-36...]
     * @desc decrypt the sql string
     * @return {string} the query
     */
    pbeDecrypt: function (sql, isArray) {
        var query = 'PBEDecrypt(query=';

        if (!isArray) {
            query += '["<encode>' + sql + '</encode>"]';
        } else {
            query += JSON.stringify(sql);
        }
        query += ')';

        return query;
    },

    CHANGE_COLUMN_TYPE: function (changeColumnType) {
        let query =
            'column=[' +
            changeColumnType.column +
            '], dataType=["' +
            changeColumnType.dataType +
            '"]';
        if (changeColumnType.format) {
            query += ', format=["' + changeColumnType.format + '"]';
        }
        return query;
    },

    /**
     * @name DATE_ADD_VALUE
     * @desc creates param string for add date value pixel FOR PIPELINE
     * @param {object} dateAddValue values for dateAddValue
     * @return {string} query
     */
    DATE_ADD_VALUE: function (dateAddValue) {
        var query = '';

        query += 'column = [ "' + dateAddValue.srcCol + '"], ';
        query += 'new_col = ["' + dateAddValue.new_col + '"], ';
        query += 'unit = ["' + dateAddValue.unit + '"], ';
        query += 'val_to_add = [' + dateAddValue.val_to_add + ']  ';

        return query;
    },

    /**
     * @name DateDifference
     * @desc creates the param string for date difference pixel FOR PIPELINE
     * @param {string} startColumn start column
     * @param {string} endColumn end column
     * @param {string} inputUse input
     * @param {string} inputDate date
     * @param {string} unit unit
     * @param {string} newCol new column
     * @return {string} query
     */
    dateDifference: function (
        startColumn,
        endColumn,
        inputUse,
        inputDate,
        unit,
        newCol
    ) {
        var query = 'DateDifference( ';

        query += 'start_column = [ "' + startColumn + '"], ';
        query += 'end_column = ["' + endColumn + '"], ';
        query += 'input_use = ["' + inputUse + '"], ';
        query += 'input_date = ["' + inputDate + '"], ';
        query += 'unit = ["' + unit + '"], ';
        query += 'newCol = ["' + newCol + '"] )';

        return query;
    },

    /**
     * @name DATE_DIFFERENCE
     * @desc creates the param string for date difference pixel FOR PIPELINE
     * @param {object} dateDifference -
     * @return {string} query
     */
    DATE_DIFFERENCE: function (dateDifference) {
        var query = '';

        query += 'start_column = [ "' + dateDifference.start_column + '"], ';
        query += 'end_column = ["' + dateDifference.end_column + '"], ';
        query += 'input_use = ["' + dateDifference.input_use + '"], ';
        query += 'input_date = ["' + dateDifference.input_date + '"], ';
        query += 'unit = ["' + dateDifference.unit + '"], ';
        query += 'newCol = ["' + dateDifference.newCol + '"] ';

        return query;
    },

    /** NEW */
    /**
     * @name PIXEL
     * @param {string} query - raw query
     * @returns {string} query
     */
    PIXEL: function (query) {
        return query;
    },
    /**
     * @name QUERY_STRUCT
     * @param {object} qs - the query struct
     * @desc generate pixel from query struct
     * @returns {string} query
     */
    QUERY_STRUCT: function (qs) {
        var pixel = '',
            pixelComponents = [];

        // start building with what we have
        if (qs.qsType === 'ENGINE') {
            pixelComponents.push({
                type: 'database',
                components: [qs.engineName],
            });
        } else if (qs.qsType === 'RAW_JDBC_ENGINE_QUERY') {
            pixelComponents.push({
                type: 'jdbcSource',
                components: [qs.config],
            });
        } else if (qs.qsType === 'RAW_ENGINE_QUERY') {
            pixelComponents.push({
                type: 'database',
                components: [qs.engineName],
            });
        } else if (qs.qsType === 'CSV_FILE') {
            if (qs.preview) {
                pixelComponents.push({
                    type: 'variable',
                    components: ['META'],
                });
            }

            pixelComponents.push({
                type: 'fileRead',
                components: [
                    'csv',
                    qs.filePath,
                    '',
                    '',
                    qs.columnTypes,
                    qs.delimiter,
                    qs.newHeaderNames,
                    qs.fileName,
                    qs.additionalTypes,
                ],
            });
        } else if (qs.qsType === 'EXCEL_FILE') {
            if (qs.preview) {
                pixelComponents.push({
                    type: 'variable',
                    components: ['META'],
                });
            }

            pixelComponents.push({
                type: 'fileRead',
                components: [
                    'excel',
                    qs.filePath,
                    qs.sheetName,
                    qs.sheetRange,
                    qs.columnTypes,
                    qs.delimiter,
                    qs.newHeaderNames,
                    qs.fileName,
                    qs.additionalTypes,
                ],
            });
        } else if (qs.qsType === 'FRAME') {
            pixelComponents.push({
                type: 'frame',
                components: [qs.frameName],
            });
        } else if (qs.qsType === 'API') {
            console.error('TODO: Standardize with the backend');
            pixelComponents.push({
                type: 'api',
                components: [
                    qs.type,
                    qs.url,
                    qs.method,
                    qs.headers,
                    qs.body,
                    qs.roots,
                ],
            });
        } else if (qs.qsType === 'SOCIAL') {
            // console.error('TODO: Standardize with the backend');
            if (qs.provider === 'google') {
                pixelComponents.push({
                    type: 'googleFileRetriever',
                    components: [qs.fileId, qs.fileType],
                });
            } else if (qs.provider === 'dropbox') {
                pixelComponents.push({
                    type: 'dropBoxFileRetriever',
                    components: [qs.filePath],
                });
            } else if (qs.provider === 'ms') {
                pixelComponents.push({
                    type: 'oneDriveFileRetriever',
                    components: [qs.fileId],
                });
            }
            // pixelComponents.push({
            //     type: 'social',
            //     components: [
            //         qs.fileName,
            //         qs.fileId,
            //         qs.fileType,
            //         qs.provider
            //     ]
            // });
        }

        if (qs.query) {
            pixelComponents.push({
                type: 'query',
                components: [qs.query],
            });
        } else {
            if (qs.queryAll) {
                pixelComponents.push({
                    type: 'queryAll',
                    components: [],
                });
            } else if (qs.selectors && qs.selectors.length > 0) {
                pixelComponents.push({
                    type: 'QS_SELECTOR',
                    components: [qs.selectors],
                });
            }

            if (qs.relations) {
                const joinComponents = [];
                for (
                    let relationIdx = 0, relationLen = qs.relations.length;
                    relationIdx < relationLen;
                    relationIdx++
                ) {
                    joinComponents.push({
                        fromColumn: qs.relations[relationIdx][0],
                        joinType: qs.relations[relationIdx][1],
                        toColumn: qs.relations[relationIdx][2],
                    });
                }

                pixelComponents.push({
                    type: 'join',
                    components: [joinComponents],
                });
            }

            if (qs.groups && qs.groups.length > 0) {
                const groupComponents = [];
                for (
                    let groupIdx = 0, groupLen = qs.groups.length;
                    groupIdx < groupLen;
                    groupIdx++
                ) {
                    if (qs.groups[groupIdx].column === 'PRIM_KEY_PLACEHOLDER') {
                        groupComponents.push(qs.groups[groupIdx].content.table);
                    } else {
                        groupComponents.push(
                            qs.groups[groupIdx].content.table +
                                '__' +
                                qs.groups[groupIdx].content.column
                        );
                    }
                }

                pixelComponents.push({
                    type: 'group',
                    components: [groupComponents],
                });
            }

            if (qs.explicitFilters && qs.explicitFilters.length > 0) {
                pixelComponents.push({
                    type: 'QS_FILTER',
                    components: [qs.explicitFilters],
                });
            }
        }

        if (qs.hasOwnProperty('isDistinct')) {
            pixelComponents.push({
                type: 'distinct',
                components: [qs.isDistinct],
            });
        }

        if (qs.limit > -1) {
            pixelComponents.push({
                type: 'limit',
                components: [qs.limit],
            });
        }

        for (
            let componentIdx = 0, componentLen = pixelComponents.length;
            componentIdx < componentLen;
            componentIdx++
        ) {
            pixel += this.REACTORS[pixelComponents[componentIdx].type].apply(
                this,
                pixelComponents[componentIdx].components
            );
            pixel = this.append(pixel, this.ENUMS.PIPE);
        }

        return pixel;
    },

    /**
     * @name QS_SELECTOR
     * @param {array} selectors - selectors to build off of
     * @desc generate pixel from a frame
     * @returns {string} query
     */
    QS_SELECTOR: function (selectors) {
        const selects = [],
            aliases = [];

        for (
            let selectorIdx = 0, selectorLen = selectors.length;
            selectorIdx < selectorLen;
            selectorIdx++
        ) {
            const selector = selectors[selectorIdx];

            let selectorString = flattenSelector(selector);
            if (!selectorString) {
                console.error('Invalid Selector');
                continue;
            }

            selects.push(selectorString);

            // save the alias
            if (selector && selector.content && selector.content.alias) {
                aliases.push(selector.content.alias);
            }
        }

        if (selects.length === 0) {
            return '';
        }

        if (aliases.length !== selects.length) {
            console.error('Alias is needed!');
            return `Select(${selects.join(', ')})`;
        }

        return `Select(${selects.join(', ')}).as([${aliases.join(', ')}])`;
    },

    /**
     * @name QS_FILTER
     * @param {array} filters - filter to build off of
     * @desc generate pixel from a frame
     * @returns {string} query
     */
    QS_FILTER: function (filters) {
        // look through all of the chunks, this should ideally be 1
        const filterStrs = [];
        for (
            let filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            let filterStr = flattenFilter(filters[filterIdx]);
            if (!filterStr) {
                console.error('Invalid Filter');
                continue;
            }

            filterStrs.push(`Filter(${filterStr})`);
        }

        return filterStrs.join(' | ');
    },
    /**
     * @name CREATE_FRAME
     * @param {object} frame - the frame object
     * @desc generate pixel from a frame
     * @returns {string} query
     */
    CREATE_FRAME: function (frame) {
        var frameType = frame.type,
            override = false;

        // TODO: remove when backend can set the default
        // if (frameType === 'default') {
        //     frameType = 'GRID';
        // }

        if (frame.override) {
            override = true;
        }

        return `CreateFrame(frameType=[${frameType}], override=[${override}]).as(["${frame.name}"])`;
    },
    /**
     * @name JOINS
     * @param {array} joins - array of the join information
     * @desc create a joins component
     * @returns {string} query
     */
    JOINS: function (joins) {
        var query = '',
            i,
            len;

        if (joins) {
            for (i = 0, len = joins.length; i < len; i++) {
                // ORDER IS ON PURPOSE DO NOT CHANGE
                query += '(';
                query += joins[i].from + ', '; // Join(Title
                query += this.convertJoin(joins[i].join) + ', '; // Join(Title inner.join
                query += joins[i].to; // Join(Title inner.join Studio
                // if joinComarator added and its not '=='. '==' is default
                if (
                    joins[i].joinComparator &&
                    joins[i].joinComparator !== '=='
                ) {
                    query += ', ' + joins[i].joinComparator; // Join (Title inner.join Studio >=
                }
                query += '), ';
            }
            // trim trailing comma
            query = this.trim(query, ',');
        }

        return query;
    },
    /**
     * @name RDF_FILE_SOURCE
     * @param {object} file - path and format
     * @return {string} query
     */
    RDF_FILE_SOURCE: function (file) {
        return `RDFFileSource(filePath=["${file.path}"], rdfType=["${file.format}"])`;
    },
    /**
     * @name FILTERS
     * @param {array} filters - array of the filter information
     * @desc create a joins component
     * @returns {string} query
     */
    FILTERS: function (filters) {
        var query = '',
            filterIdx,
            filterLen;

        for (
            filterIdx = 0, filterLen = filters.length;
            filterIdx < filterLen;
            filterIdx++
        ) {
            if (filters[filterIdx].type === 'value') {
                query += `( ${filters[filterIdx].alias} ${
                    filters[filterIdx].comparator
                } ${JSON.stringify(filters[filterIdx].values)})`;
            } else if (filters[filterIdx].type === 'range') {
                query += `( ${filters[filterIdx].values[0]} <= ${filters[filterIdx].alias}), ( ${filters[filterIdx].alias} <= ${filters[filterIdx].values[1]})`;
            } else if (filters[filterIdx].type === 'delete') {
                query += `( ${filters[filterIdx].values} )`;
            } else {
                console.warn('Unrecognized type');
            }

            if (filters[filterIdx].operator) {
                query += ' ' + filters[filterIdx].operator + ' ';
            }
        }

        return query;
    },
    /**
     * @name UPDATE_ROW
     * @param {object} updateRow - values for update row
     * @desc creates param string for update row pixel
     * @return {string} query
     */
    UPDATE_ROW: function (updateRow) {
        var query = '',
            value;
        if (isNaN(updateRow.newVal)) {
            value = `"${updateRow.newVal}"`;
        } else {
            value = updateRow.newVal;
        }
        query += `${updateRow.newCol}, ${value}`;

        return query;
    },
    /**
     * @name RENAME_COLUMN
     * @param {object} renameCol - values for rename col
     * @desc creates param string for rename col pixel
     * @return {string} query
     */
    RENAME_COLUMN: function (renameCol) {
        var query = '';

        query += `column=["${renameCol.selected}"], newCol=["${renameCol.new}"]`;

        return query;
    },
    /**
     * @name COLUMN_CLEANER
     * @param {object} colCleaner - values for column cleaner
     * @desc creates param string for column cleaner pixel
     * @return {string} query
     */
    COLUMN_CLEANER: function (colCleaner) {
        var query = '';

        query += `column=["${colCleaner.col}"], matches=[${colCleaner.matches}], matchesTable=["${colCleaner.matchTable}"]`;

        return query;
    },
    /**
     * @name DISCRETIZE
     * @param {object} discretize - values for column cleaner
     * @desc creates param string for discretize column pixel
     * @return {string} query
     */
    DISCRETIZE: function (discretize) {
        var query = '';

        query += `{"column":"${discretize.column}"`;
        if (discretize.breaks && discretize.breaks.length > 0) {
            query += `, "breaks":"${discretize.breaks}"`;
        }
        if (discretize.labels && discretize.labels.length > 0) {
            query += `, "labels":"${discretize.labels}"`;
        }
        query += '}';

        return query;
    },

    /**
     * @name addDatabaseStructure
     * @param {string} databaseId - databaseId
     * @param {object} tableDetails - tableDetails => {tableName:{columnName:columnType}}
     * @desc add database structure to physical database
     * @returns {string} query
     */
    addDatabaseStructure: function (databaseId, tableDetails) {
        var query = `AddDatabaseStructure( database=[${JSON.stringify(
            databaseId
        )}], metamodelAdd=[${JSON.stringify(tableDetails)}] );`;
        console.log('query is: ', query);
        return query;
    },
    /**
     * @name deleteDatabaseStructure
     * @param {string} databaseId - databaseId
     * @param {array} tableArr - tableArr => [tablename1, tablename2, tablename3]
     * @param {object} tableDetails - tableDetails => {tableName:[columnName:columnType]}
     * @desc deletes database structure to physical database
     * @returns {string} query
     */
    deleteDatabaseStructure: function (databaseId, tableDetails) {
        var query = `DeleteDatabaseStructure( database=[${JSON.stringify(
            databaseId
        )}], metamodelDelete=[${JSON.stringify(tableDetails)}] );`;
        console.log('query is: ', query);
        return query;
    },
    /**
     * @name createNewRdbmsInternalDatabase
     * @param {string} databaseName - databaseName
     * @param {object} databaseDetails - databaseDetails => {type: '', description: '', options: {}}
     * @desc deletes database structure to physical database
     * @returns {string} query
     */
    createNewRdbmsInternalDatabase: function (databaseName, databaseDetails) {
        var query = `CreateNewRdbmsInternalDatabase( database=${JSON.stringify(
            databaseName
        )});`;
        // var query = `CreateNewRdbmsInternalDatabase( database=[${JSON.stringify(databaseName)}], metamodelAdditions=[${JSON.stringify(databaseDetails)}] );`;
        console.log('query is: ', query);
        return query;
    },
    /**
     * @name editDatabasePropertyDataType
     * @desc updates column data type
     * @param {string} databaseId
     * @param {string} concept
     * @param {string} column
     * @param {string} dataType
     */
    editDatabasePropertyDataType: function (
        databaseId,
        concept,
        column,
        dataType
    ) {
        var query = `EditDatabasePropertyDataType( database=[${JSON.stringify(
            databaseId
        )}], concept=[${JSON.stringify(concept)}], column=[${JSON.stringify(
            column
        )}], dataType=[${JSON.stringify(dataType)}] );`;
        console.log('EditDBPropertyDataType query is: ', query);
        return query;
    },

    /**
     * @name renameColumn
     * @desc change column name
     * @param {string} databaseId
     * @param {string} tableName aka concept
     * @param {string} columnName
     * @param {string} newColumnName
     */
    renameColumn: function (databaseId, tableName, columnName, newColumnName) {
        //  DatabaseRenameColumn(database=["2555ec1b-e1a2-4905-91e0-022dc57fc564"], concept=["ACTIVE_PLANS"], column=["ID"], newValue=["ID2"]);
        var query = `DatabaseRenameColumn( database=[ "${databaseId}" ], concept=["${tableName}"], column=["${columnName}"], newValue=["${newColumnName}"]);`;
        return query;
    },

    /**
     * @name renameTable
     * @desc change table name
     * @param {string} databaseId
     * @param {string} tableName
     * @param {string} newTableName
     */
    renameTable: function (databaseId, tableName, newTableName) {
        var query = `DatabaseRenameTable(database=["${databaseId}"], concept=["${tableName}"], newValue=["${newTableName}"]);`;
        return query;
    },
};

module.exports = REACTORS;
