import { CellConfig } from '@/stores';
import { DataImportCell, DataImportCellDef } from './DataImportCell';

export const DataImportCellConfig: CellConfig<DataImportCellDef> = {
    name: 'Data Import',
    widget: 'data-import',
    view: DataImportCell,
    parameters: {
        frameVariableName: '',
        selectQuery: '',
        databaseId: '',
        frameType: 'PY',
        rootTable: '',
        selectedColumns: [],
        columnAliases: [],
        tableNames: [],
        joins: [],
        // TODO add filters and summaries
        // filters: [],
        // summaries: [],
    },
    toPixel: ({
        frameType,
        frameVariableName,
        selectQuery,
        // databaseId,
        // selectedColumns,
        // columnAliases,
        // rootTable,
        // joins,
    }) => {
        // const splitPixelString = selectQuery.split(';');
        // const pixelAddition = ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) `;
        // splitPixelString[0] = splitPixelString[0] + pixelAddition;
        // const pixelImportString = ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) ; `;
        // const combinedPixelString =
        //     selectQuery.slice(0, -1) + pixelImportString;
        // return combinedPixelString;
        return (
            selectQuery.slice(0, -1) +
            ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) ; `
        );
    },
};
