import { CellConfig } from '@/stores';
import { DataImportCell, DataImportCellDef } from './DataImportCell';

export const DataImportCellConfig: CellConfig<DataImportCellDef> = {
    name: 'Data Import',
    widget: 'data-import',
    view: DataImportCell,
    parameters: {
        databaseId: '',
        frameType: 'PY',
        frameVariableName: '',
        selectQuery: '',
        joins: [],
        tableNames: [],
        selectedColumns: [],
        columnAliases: [],
        rootTable: '',
        // filters: [],
    },
    toPixel: ({
        databaseId,
        frameType,
        frameVariableName,
        selectQuery,
        joins,
        selectedColumns,
        columnAliases,
        rootTable,
    }) => {
        const splitPixelString = selectQuery.split(';');
        const pixelAddition = ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) `;
        splitPixelString[0] = splitPixelString[0] + pixelAddition;
        const pixelImportString = ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) ; `;
        const combinedPixelString =
            selectQuery.slice(0, -1) + pixelImportString;
        return combinedPixelString;
    },
};
