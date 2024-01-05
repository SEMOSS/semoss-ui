import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { AppBar } from '@mui/material';
import { Link } from 'react-router-dom';

export interface NavBarBlockDef extends BlockDef<'nav-bar'> {
    widget: 'nav-bar';
    data: {
        style: CSSProperties;
        name: string;
        pages: any[];
    };
}

export const NavBarBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<NavBarBlockDef>(id);

    return (
        <AppBar position="relative" sx={{ ...data.style }} {...attrs}>
            {data.name}
            <div>
                {data.pages.map((p, i) => {
                    return (
                        <Link key={i} to={''}>
                            {p}
                        </Link>
                    );
                })}
            </div>
        </AppBar>
    );
});
