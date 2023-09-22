import { CSSProperties } from 'react';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

export interface TextBlockDef extends BlockDef<'text'> {
    widget: 'text';
    data: {
        style: CSSProperties;
        text: string;
    };
    slots: never;
}

export const TextBlock: BlockComponent<TextBlockDef> = ({ id }) => {
    const { attrs, data } = useBlock<TextBlockDef>(id);

    return (
        <span style={data.style} {...attrs}>
            {data.text}
        </span>
    );
};

TextBlock.widget = 'text';

TextBlock.config = {
    data: {
        style: {},
        text: 'Hello world',
    },
    listeners: {},
    slots: {
        test: [],
    },
};
