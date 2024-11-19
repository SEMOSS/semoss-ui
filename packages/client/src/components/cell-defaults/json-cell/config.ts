import { CellConfig } from '@/stores';
import { JSONCell, JSONCellDef } from './JSONCell';

export const JSONCellConfig: CellConfig<JSONCellDef> = {
    name: 'JSON',
    widget: 'json',
    parameters: {
        type: 'pixel',
        code: '',
    },
    view: JSONCell,
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
