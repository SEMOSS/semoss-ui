import { Cell, CellDef } from '@/stores';
import { CodeCellInput } from './CodeCellInput';
import { CodeCellTitle } from './CodeCellTitle';

export interface CodeCellDef extends CellDef<'code'> {
    widget: 'code';
    parameters: {
        /** Type of code in the cell */
        type: 'r' | 'py' | 'pixel';

        /** Code rendered in the cell */
        code: string;
    };
}

// export the config for the block
export const CodeCell: Cell<CodeCellDef> = {
    widget: 'code',
    parameters: {
        type: 'pixel',
        code: '',
    },
    view: {
        title: CodeCellTitle,
        input: CodeCellInput,
    },
    toPixel: ({ type, code }) => {
        if (type === 'r') {
            return `R(<encode>${code}</encode>);`;
        } else if (type === 'py') {
            return `Py("<encode>${code}</encode>");`;
        } else if (type === 'pixel') {
            return code;
        } else {
            throw new Error(
                `Error converting toString ::: ${type} is not valid`,
            );
        }
    },
};
