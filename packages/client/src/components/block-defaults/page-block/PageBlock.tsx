import { CSSProperties, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';
import { LoadingScreen } from '@/components/ui';

export interface PageBlockDef extends BlockDef<'page'> {
    widget: 'page';
    data: {
        style: CSSProperties;
        loading: boolean;
    };
    slots: {
        content: true;
    };
    listeners: {
        onPageLoad: true;
    };
}

export const PageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, listeners } = useBlock<PageBlockDef>(id);
    const [loading, setLoading] = useState(data.loading);

    // when the page is mounted, trigger the onPageLoad event
    useEffect(() => {
        if (listeners.onPageLoad) {
            listeners.onPageLoad();
        }
    }, []);

    useEffect(() => {
        if (loading) {
            setTimeout(() => {
                console.log('PageBlock ' + data.loading);
                setLoading(false);
            }, 2000);
        }
    }, []);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#FFFFFF',
                overflow: 'scroll',
                ...data.style,
            }}
            {...attrs}
            data-page
        >
            {/* TODO: Make Loading Screen relative to the Page */}
            <LoadingScreen>
                {loading ? <LoadingScreen.Trigger /> : null}
                <Slot slot={slots.content}></Slot>
            </LoadingScreen>
        </div>
    );
});
