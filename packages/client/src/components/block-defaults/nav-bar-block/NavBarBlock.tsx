import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { useBlock, useBlocks } from '@/hooks';
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
    const { state } = useBlocks();

    const pages = computed(() => {
        const pages: {
            route: string;
            name: string;
            id: string;
            label: string;
        }[] = [];
        for (const b in state.blocks) {
            const block = state.blocks[b];

            // check if it is a page widget
            if (block.widget === 'page') {
                // store the pages
                pages.push({
                    id: block.id,
                    label: (block.data?.route as string) || 'home',
                    name: (block.data?.name as string) || '',
                    route: (block.data?.route as string) || '',
                });
            }
        }

        // sort by the path
        return pages.sort((a, b) => {
            const aRoute = a.route.toLowerCase(),
                bRoute = b.route.toLowerCase();

            if (aRoute < bRoute) {
                return -1;
            }
            if (aRoute > bRoute) {
                return 1;
            }
            return 0;
        });
    }).get();

    /**
     * Get's page data for link
     * @param id
     * @returns Page Block
     */
    const findPageBlock = (id) => {
        return pages.find((page) => page.id === id);
    };

    return (
        <AppBar position="relative" sx={{ ...data.style }} {...attrs}>
            {data.name}
            <div>
                {data.pages.map((p, i) => {
                    const page = findPageBlock(p);
                    return (
                        <Link key={i} to={page.route}>
                            {page.label}
                        </Link>
                    );
                })}
            </div>
        </AppBar>
    );
});
