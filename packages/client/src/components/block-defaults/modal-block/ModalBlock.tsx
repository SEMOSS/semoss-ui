import React, { CSSProperties } from 'react';
import { BlockDef } from '@/stores';
import { Modal, Dialog, Box } from '@mui/material';
import { useBlock } from '@/hooks';
import { Slot } from '@/components/blocks';

export interface ModalBlockDef extends BlockDef<'modal'> {
    widget: 'modal';
    data: {
        style: CSSProperties;
        open: boolean;
    };
    slots: {
        children: true;
    };
}
export const ModalBlock = ({ id }) => {
    const { data, slots, attrs } = useBlock<ModalBlockDef>(id);

    return (
        <Dialog
            // open={data.open}
            open={false}
            container={() => document.getElementById('page-1')}
            sx={{ position: 'absolute' }}
            BackdropProps={{ style: { position: 'absolute' } }}
        >
            <Box sx={{ minWidth: '400px', minHeight: '400px' }} {...attrs}>
                <Slot slot={slots.children}></Slot>
            </Box>
        </Dialog>
    );
};
