import { StateStore } from '@/stores';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';

const ACTIVE = 'page-1';

export const BlocksAppRenderer = () => {
    return (
        <Blocks state={StateStore} registry={DefaultBlocks}>
            <Renderer id={ACTIVE} />
        </Blocks>
    );
};
