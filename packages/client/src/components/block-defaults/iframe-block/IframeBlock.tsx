import { CSSProperties, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent, ActionMessages } from '@/stores';

export interface IframeBlockDef extends BlockDef<'iframe'> {
    widget: 'iframe';
    data: {
        style: CSSProperties;
        src: string;
        title: string;
        disabled: boolean;
    };
    slots: never;
}

export const IframeBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<IframeBlockDef>(id);
    const { state } = useBlocks();

    // bind custom frame leave event
    function bindIFrameMouseleave(iframe: HTMLIFrameElement) {
        iframe.contentDocument.addEventListener('mouseleave', function () {
            state.dispatch({
                message: ActionMessages.DISPATCH_EVENT,
                payload: {
                    name: 'iframeMouseLeave',
                },
            });
        });
    }

    useEffect(() => {
        bindIFrameMouseleave(
            document.querySelector(`[data-block-frame="${id}"]`),
        );
    }, []);

    return (
        <span
            style={{
                width: '100%',
                height: '400px',
                display: 'block',
                ...data.style,
            }}
            {...attrs}
        >
            <iframe
                style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: data.disabled ? 'none' : undefined,
                }}
                src={data.src}
                title={data.title}
                data-block-frame={id}
            />
        </span>
    );
});
