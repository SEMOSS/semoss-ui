import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface LinkBlockDef extends BlockDef<'link'> {
    widget: 'link';
    data: {
        style: CSSProperties;
        href: string;
        text: string;
    };
}

/*
TODO: If this is a link to somewhere internally on app switch to a Link (react-router)
*/
export const LinkBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<LinkBlockDef>(id);
    return (
        <a
            href={data.href}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </a>
    );
});
