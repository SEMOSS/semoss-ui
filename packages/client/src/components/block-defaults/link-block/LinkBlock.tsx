import { CSSProperties, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { NavLink, useNavigate } from 'react-router-dom';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface LinkBlockDef extends BlockDef<'link'> {
    widget: 'link';
    data: {
        style: CSSProperties;
        href: string;
        text: string;
        isExternal: boolean;
    };
}

export const LinkBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<LinkBlockDef>(id);
    const { state } = useBlocks();
    const navigate = useNavigate();

    const handleNavigation = (ev) => {
        ev.preventDefault();
        if (state.mode === 'static') return;
        navigate(`../${data.href}`, { relative: 'path' });
    };

    return data.isExternal ? (
        <a
            id="link"
            href={data.href}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </a>
    ) : (
        <NavLink
            to="#"
            onClick={handleNavigation}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </NavLink>
    );
});
