import { CellConfig } from '@/stores';
import { CodeCell, CodeCellDef } from './CodeCell';

export const CodeCellConfig: CellConfig<CodeCellDef> = {
    name: 'Code',
    widget: 'code',
    parameters: {
        type: 'pixel',
        code: '',
    },
    view: CodeCell,
    toPixel: ({ type, code }) => {
        console.log({ type, code });
        code = typeof code === 'string' ? code : code.join('\n');
        if (type === 'r') {
            return `R("<encode>${code}</encode>");`;
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
