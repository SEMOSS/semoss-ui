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
    toPixel: ({ frameType, frameVariableName, selectQuery }) => {
        return (
            selectQuery.slice(0, -1) +
            ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) ; `
        );
    },
};
