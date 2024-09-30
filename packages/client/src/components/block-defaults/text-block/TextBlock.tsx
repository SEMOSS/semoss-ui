import React, { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useTypeWriter } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface TextBlockDef extends BlockDef<'text'> {
    widget: 'text';
    data: {
        style: CSSProperties;
        text: string;
        variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
        isStreaming: boolean;
    };
    slots: never;
}

export const TextBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<TextBlockDef>(id);

    let textContent =
        typeof data.text == 'string' ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : '');
    if (!data.isStreaming) displayTxt = textContent;

    return React.createElement(
        data.variant ? data.variant : 'p',
        {
            style: { ...data.style },
            ...attrs,
        },
        displayTxt,
    );
});
