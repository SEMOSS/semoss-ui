import { Cell, CellDef } from '@/stores';
import { QueryImportCellTitle } from './QueryImportCellTitle';
import { QueryImportCellInput } from './QueryImportCellInput';
import { Parser } from 'node-sql-parser';

export interface QueryImportCellDef extends CellDef<'query-import'> {
    widget: 'query-import';
    parameters: {
        /** Database associated with the cell */
        databaseId: string;

        /** Output frame type */
        frameType: 'GRID' | '';

        /** Ouput variable name */
        variableName: string;

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
        variableName: '',
        selectQuery: '',
    },
    view: {
        title: QueryImportCellTitle,
        input: QueryImportCellInput,
    },
    toPixel: ({ databaseId, frameType, variableName, selectQuery }) => {
        const parser = new Parser();
        const ast = parser.astify(selectQuery);

        console.log(ast);

        return `Database ( database = [ \"${databaseId}\" ] ) | 
            Select ( DIABETES__AGE , DIABETES__DRUG ) .as ( [ AGE , DRUG ] ) | 
            Distinct ( false ) | Limit ( 20 ) | 
            Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ \"${variableName}\" ] ) ] ) ;`;
    },
};
