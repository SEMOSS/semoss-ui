import { useEffect, useRef } from 'react';
import { useBlock } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';
import { styled } from '@semoss/ui';
import DOMPurify from 'dompurify';

export interface HTMLBlockDef extends BlockDef<'html'> {
    widget: 'html';
    data: {
        html: string;
    };
    slots: never;
}

export const HTMLBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<HTMLBlockDef>(id);
    const shadowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data.html) {
            return;
        }

        const html = DOMPurify.sanitize(data.html);

        let shadowRoot = shadowRef.current.shadowRoot;

        // attach a shadow root if it doesn't exist
        if (!shadowRoot) {
            shadowRoot = shadowRef.current.attachShadow({
                mode: 'open',
            });
        }

        /// add the html
        shadowRoot.innerHTML = `
            ${html}
        `;
    }, [data.html]);

    if (!data.html) {
        return null;
    }

    return (
        <div
            ref={shadowRef}
            {...attrs} // needed for block highlighting / interaction
        ></div>
    );
});
