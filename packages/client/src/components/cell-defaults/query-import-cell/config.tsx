import { Cell, CellDef } from '@/stores';
import { QueryImportCellTitle } from './QueryImportCellTitle';
import { QueryImportCellInput } from './QueryImportCellInput';
import {
    getQueryImportPipeline,
    validateQueryImportQuery,
} from './query-import-pipeline-utils';
import { QueryImportCellDetails } from './QueryImportCellDetails';
import { QueryImportCellOutput } from './QueryImportCellOutput';

export interface QueryImportCellDef extends CellDef<'query-import'> {
    widget: 'query-import';
    parameters: {
        /** Database associated with the cell */
        databaseId: string;

        /** Output frame type */
        frameType: 'GRID' | 'R' | 'PY';

        /** Ouput variable name */
        frameVariableName: string;

        /** Select query rendered in the cell */
        selectQuery: string;
    };
}

// export the config for the block
export const QueryImportCell: Cell<QueryImportCellDef> = {
    widget: 'query-import',
    parameters: {
        databaseId: '',
        frameType: 'GRID',
        frameVariableName: 'databaseOutput',
        selectQuery: '',
    },
    view: {
        title: QueryImportCellTitle,
        input: QueryImportCellInput,
        details: QueryImportCellDetails,
        output: QueryImportCellOutput,
    },
    toPixel: ({ databaseId, frameType, frameVariableName, selectQuery }) => {
        validateQueryImportQuery(selectQuery);
        return getQueryImportPipeline(
            databaseId,
            frameType,
            frameVariableName,
            selectQuery,
        );
    },
};
