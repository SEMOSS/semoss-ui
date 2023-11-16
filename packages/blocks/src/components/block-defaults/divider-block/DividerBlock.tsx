import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface DividerBlockDef extends BlockDef<'container'> {
    widget: 'divider';
    data: {
        style: CSSProperties;
    };
}

export const DividerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<DividerBlockDef>(id);

    return (
        <Divider
            sx={{
                ...data.style,
            }}
            {...attrs}
        ></Divider>
    );
});
