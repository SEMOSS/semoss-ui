import { CSSProperties, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';
import { LoadingScreen } from '@/components/ui';

export interface PageBlockDef extends BlockDef<'page'> {
    widget: 'page';
    data: {
        style: CSSProperties;
        loading: boolean | string;
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

    // when the page is mounted, trigger the onPageLoad event
    useEffect(() => {
        if (listeners.onPageLoad) {
            listeners.onPageLoad();
        }
    }, []);

    const isLoading =
        typeof data.loading === 'string'
            ? data.loading.toLowerCase() === 'true'
            : data.loading;

    return (
        <div
            id={id}
            style={{
                // position Set to relative so we can have a modal to attach to page block
                position: 'relative',
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
                {isLoading ? <LoadingScreen.Trigger /> : null}
                <Slot slot={slots.content}></Slot>
            </LoadingScreen>
        </div>
    );
});
