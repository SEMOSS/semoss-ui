import { Cell, CellDef } from '@/stores';
import { QueryImportCellInput } from './QueryImportCellInput';

export interface QueryImportCellDef extends CellDef<'query-import'> {
    widget: 'query-import';
    parameters: {
        /** Database associated with the cell */
        databaseId: string;

        /** Output frame type */
        frameType: 'NATIVE' | 'PY' | 'R' | 'GRID';

        /** Ouput variable name */
        frameVariableName: string;

        /** Select query rendered in the cell */
        selectQuery: string;
    };
}

// export the config for the block
export const QueryImportCell: Cell<QueryImportCellDef> = {
    name: 'Import',
    widget: 'query-import',
    parameters: {
        databaseId: '',
        frameType: 'PY',
        frameVariableName: '',
        selectQuery: '',
    },
    view: {
        input: QueryImportCellInput,
    },
    toPixel: ({ databaseId, frameType, frameVariableName, selectQuery }) => {
        return `Database( database=["${databaseId}"] ) | Query("<encode>${selectQuery}</encode>") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])]);`;
    },
};
