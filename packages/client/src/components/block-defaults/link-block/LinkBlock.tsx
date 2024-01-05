import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { Link } from 'react-router-dom';

export interface LinkBlockDef extends BlockDef<'link'> {
    widget: 'link';
    data: {
        style: CSSProperties;
        label: string;
        route: string;
    };
}

export const LinkBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<LinkBlockDef>(id);

    return (
        <Link
            to={data.route}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.label}
        </Link>
    );
});
