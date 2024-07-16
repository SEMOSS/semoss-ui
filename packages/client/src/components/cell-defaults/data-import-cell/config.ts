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
    }) => {
        // this only runs when the cell runs
        // it will check the frame type and variable name which the user could change
        // so NotebookAddCell should track the static first part of the pixel with db id / cols and add Meta | Frame() etc without the import and var name
        // then when this runs it can add the Import(...); Meta ...; with the right frametype and varname

        // old not working syntax
        const splitPixelString = selectQuery.split(';');
        const pixelAddition = ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) `;
        splitPixelString[0] = splitPixelString[0] + pixelAddition;
        const newPixelString = splitPixelString.join(';');
        // return newPixelString;

        // new partially working syntax
        const pixelImportString = ` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${frameVariableName}\" ] ) ] ) ; `;
        // const pixelMetaString = ` META | Frame() | QueryAll() | Limit(50) | Collect(500);`;
        // const combinedPixelString = selectQuery.slice(0, -1) + pixelImportString + pixelMetaString;
        const combinedPixelString =
            selectQuery.slice(0, -1) + pixelImportString;

        console.log({ combinedPixelString });

        return combinedPixelString;

        // const firstPixel = `${splitPixelString[0]};`;
        // const pixelString = `${selectQuery} Import ( frame = [ CreateFrame ( frameType=[${frameType}] , override = [ true ] ) .as ( ["${frameVariableName}"] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`
        return `Database( database=["${databaseId}"] ) | Query("<encode>${selectQuery}</encode>") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])]);`;
    },
};
