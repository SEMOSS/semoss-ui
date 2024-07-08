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
    },
    toPixel: ({ databaseId, frameType, frameVariableName, selectQuery }) => {
        console.log({ databaseId, frameType, frameVariableName, selectQuery });
        const splitPixelString = selectQuery.split(';');
        const firstPixel = `${splitPixelString[0]};`;
        return firstPixel;
        return `Database( database=["${databaseId}"] ) | Query("<encode>${selectQuery}</encode>") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])]);`;
    },
};
