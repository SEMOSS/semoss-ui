import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Routes, Route } from 'react-router-dom';

import { useBlocks } from '@/hooks';
import { Renderer } from '@/components/blocks';

/**
 * Router that will render the view
 */
export const Router = observer(() => {
    // get the store
    const { state } = useBlocks();

    // get the pages as an array
    const pages = computed(() => {
        const pages: { route: string; id: string }[] = [];
        for (const b in state.blocks) {
            const block = state.blocks[b];

            // check if it is a page widget
            if (block.widget === 'page') {
                // store the pages
                pages.push({
                    id: block.id,
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

    // render the view
    return (
        <Routes>
            {pages.map((p) => {
                return (
                    <Route
                        key={p.id}
                        element={<Renderer id={p.id} />}
                        path={p.route}
                    />
                );
            })}
        </Routes>
    );
});
