import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Divider } from '@semoss/ui';

export interface DividerBlockDef extends BlockDef<'divider'> {
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
