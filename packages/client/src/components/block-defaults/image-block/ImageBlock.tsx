import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

// interface CustomCSSProperties extends CSSProperties {
//     width?: string | number;
//     height?: string | number;
//     justifyContent?: string;
//     marginBottom?: string;
//     borderRadius?: string;
//     marginRight?: string;
//     marginLeft?: string;
//     marginTop?: string;
//     margin?: string;
//     border?: string;
// }

export interface ImageBlockDef extends BlockDef<'image'> {
    widget: 'image';
    data: {
        style: CSSProperties;
        src: string;
        title: string;
    };
    slots: never;
}

// conditionally returns a span, div or img element wrapped in a span for spacing
// based on if there is an image source and if the user has or hasn't changed the image's size
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
