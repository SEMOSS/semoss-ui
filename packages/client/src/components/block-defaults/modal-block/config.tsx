import { BlockConfig } from '@/stores';
import { ModalBlock, ModalBlockDef } from './';
import { BLOCK_TYPE_MERMAID } from '../block-defaults.constants';
import { Schema } from '@mui/icons-material';

export const config: BlockConfig<ModalBlockDef> = {
    widget: 'modal',
    type: BLOCK_TYPE_MERMAID,
    data: {
        style: {},
        open: false,
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ModalBlock,
    icon: Schema,
    contentMenu: [
        // {
        //     name: 'General',
        //     children: [
        //         {
        //             description: 'Open',
        //             render: ({ id }) => <InputSettings {id} />,
        //         },
        //     ],
        // },
    ],
};
