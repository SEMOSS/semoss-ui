import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

interface CustomCSSProperties extends CSSProperties {
    width?: string | number;
    height?: string | number;
    justifyContent?: string;
}

export interface ImageBlockDef extends BlockDef<'image'> {
    widget: 'image';
    data: {
        // style: CSSProperties;
        style: CustomCSSProperties;
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

    if (data.style.height) {
        return (
            <span
                style={{
                    ...data.style,
                    // this logic is here to make the outer border wrap just the image if the alignment is left
                    width:
                        data.style.justifyContent === 'left' ||
                        !data.style.justifyContent
                            ? data.style.width || '100%'
                            : '100%',
                    // temporary fix to cover the broken height percentage property
                    height:
                        `${data.style.height}`.slice(-1) === '%'
                            ? `${data.style.height}`.slice(0, -1) + 'px'
                            : data.style.height,
                    display: 'flex',
                    padding: 'none',
                    border: 'none',
                    margin: 'none',
                }}
                {...attrs}
            >
                <div
                    style={{
                        backgroundPosition: 'center',
                        ...data.style,
                        // this logic is here to make the outer border wrap just the image if the alignment is left
                        width:
                            data.style.justifyContent === 'left' ||
                            !data.style.justifyContent
                                ? '100%'
                                : data.style.width || '100%',
                        // temporary fix to cover the broken height percentage property
                        height:
                            `${data.style.height}`.slice(-1) === '%'
                                ? `${data.style.height}`.slice(0, -1) + 'px'
                                : data.style.height,
                        display: 'block',
                        backgroundImage: `url('${data.src}')`,
                        backgroundSize: 'cover',
                        margin: 'none',
                    }}
                    title={data.title}
                ></div>
            </span>
        );
    }

    return (
        <span
            style={{
                ...data.style,
                // this logic is here to make the outer border wrap just the image if the alignment is left
                width:
                    data.style.justifyContent === 'left' ||
                    !data.style.justifyContent
                        ? data.style.width || '100%'
                        : '100%',
                display: 'flex',
                border: 'none',
                padding: 'none',
                margin: 'none',
            }}
            {...attrs}
        >
            <img
                style={{
                    ...data.style,
                    // this logic is here to make the outer border wrap just the image if the alignment is left
                    width:
                        data.style.justifyContent === 'left' ||
                        !data.style.justifyContent
                            ? '100%'
                            : data.style.width || '100%',
                }}
                src={data.src}
                title={data.title}
            />
        </span>
    );
});
