import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface TextBlockDef extends BlockDef<'text'> {
    widget: 'text';
    data: {
        style: CSSProperties;
        text: string;
    };
    slots: never;
}

export const TextBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<TextBlockDef>(id);

    return (
        <span
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </span>
    );
});
