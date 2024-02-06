import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface ImageBlockDef extends BlockDef<'image'> {
    widget: 'image';
    data: {
        style: CSSProperties;
        src: string;
        title: string;
    };
    slots: never;
}

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<ImageBlockDef>(id);

    if (!data.src) {
        return (
            <div style={{ ...data.style }} {...attrs}>
                Awaiting Image Source
            </div>
        );
    } else {
        return (
            <img
                style={{ ...data.style }}
                src={data.src}
                title={data.title}
                {...attrs}
            />
        );
    }
});
