(function () {
    var myConnector = tableau.makeConnector();

    myConnector.getSchema = function (schemaCallback) {
        var cols = [],
            headerAlias,
            headerType,
            tableInfo,
            headerIdx,
            entry,
            headerDataType,
            connectData = [];
        connectData = JSON.parse(tableau.connectionData);

        // Get the headers
        headerAlias = connectData[0];
        headerType = connectData[2];
        // Iterate over the JSON object
        for (headerIdx = 0; headerIdx < headerAlias.length; headerIdx++) {
            entry = {};
            entry.id = headerAlias[headerIdx];
            entry.alias = headerAlias[headerIdx];

            headerDataType = headerType[headerIdx];

            if (headerDataType === 'STRING') {
                entry.dataType = tableau.dataTypeEnum.string;
            } else if (headerDataType === 'NUMBER') {
                entry.dataType = tableau.dataTypeEnum.float;
                entry.columnRole = 'dimension';
            }

            cols.push(entry);
        }
        tableInfo = {
            id: 'Insight',
            alias: 'Data',
            columns: cols,
        };

        schemaCallback([tableInfo]);
    };

    myConnector.getData = function (table, doneCallback) {
        var values,
            row,
            tableData = [],
            headers,
            i,
            j,
            entry,
            connectData = [];

        connectData = JSON.parse(tableau.connectionData);
        headers = connectData[0];
        values = connectData[1];
        entry = {};

        for (i = 0; i < values.length; i++) {
            row = values[i];
            for (j = 0; j < headers.length; j++) {
                entry[headers[j]] = row[j];
            }

            tableData.push(entry);
            entry = {};
        }

        table.appendRows(tableData);
        doneCallback();
    };

    tableau.registerConnector(myConnector);
})();
