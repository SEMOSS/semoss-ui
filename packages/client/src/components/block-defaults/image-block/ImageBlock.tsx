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
        disabled: boolean;
    };
    slots: never;
}

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<ImageBlockDef>(id);

    if (!data.src)
        return (
            <span
                style={{
                    width: '100%',
                    height: '350px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid gray',
                    overflow: 'hidden',
                    textAlign: 'center',
                    ...data.style,
                }}
                {...attrs}
            >
                please define
                <br />
                an image source
            </span>
        );

    return (
        // could wrap in a tag conditionally if clickable link is desired - probably full conditional return components
        // could also add tescription p tag underneath but would require style options
        // might want to add centering option - full width div wrapper with auto margins
        // TODO - add background styling / centering / covering etc
        <span
            style={{
                ...data.style,
                width: '100%',
                display: 'flex',
            }}
            {...attrs}
        >
            <img
                style={{
                    ...data.style,
                }}
                src={data.src}
                title={data.title}
            />
        </span>
    );
});
