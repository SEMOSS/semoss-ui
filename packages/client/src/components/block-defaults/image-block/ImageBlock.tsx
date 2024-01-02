import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

interface CustomCSSProperties extends CSSProperties {
    width?: string | number;
    height?: string | number;
    justifyContent?: string;
    margin?: string;
    marginLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    borderRadius?: string;
    border?: string;
}

export interface ImageBlockDef extends BlockDef<'image'> {
    widget: 'image';
    data: {
        style: CustomCSSProperties;
        src: string;
        title: string;
        disabled: boolean;
    };
    slots: never;
}

// conditionally returns based on if there is image source and if the user has / hasn't changed the image size
export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<ImageBlockDef>(id);

    // returns if there is no image source
    if (!data.src)
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
                    padding: 'none',
                    border: data.style.border || '1px solid gray',
                    // these conditional margins cover margins for centered and right aligned images
                    ...(data.style.justifyContent === 'center'
                        ? {
                              margin: 'none',
                              marginTop: data.style.margin,
                              marginBottom: data.style.margin,
                          }
                        : {}),
                    ...(data.style.justifyContent === 'right'
                        ? {
                              margin: 'none',
                              marginTop: data.style.margin,
                              marginBottom: data.style.margin,
                              marginRight: data.style.margin,
                          }
                        : {}),
                }}
                {...attrs}
            >
                <span
                    style={{
                        height: data.style.height || '250px',
                        width: data.style.width || '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        borderRadius: data.style.borderRadius,
                        margin: 'none',
                        overflow: 'hidden',
                    }}
                    {...attrs}
                >
                    please define
                    <br />
                    an image source
                </span>
            </span>
        );

    // returns when the user has started manipulating the image size
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
                    display: 'flex',
                    padding: 'none',
                    border: 'none',
                    // these conditional margins cover margins for centered and right aligned images
                    ...(data.style.justifyContent === 'center'
                        ? {
                              margin: 'none',
                              marginTop: data.style.margin,
                              marginBottom: data.style.margin,
                          }
                        : {}),
                    ...(data.style.justifyContent === 'right'
                        ? {
                              margin: 'none',
                              marginTop: data.style.margin,
                              marginBottom: data.style.margin,
                              marginRight: data.style.margin,
                          }
                        : {}),
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

    // returns if the user has not started manipulated the image size
    return (
        <span
            style={{
                ...data.style,
                // this logic is here to make the outer border wrap just the image if the alignment is left
                width:
                    data.style.justifyContent === 'left' ||
                    !data.style.justifyContent
                        ? // || data.style.margin
                          data.style.width || '100%'
                        : '100%',
                display: 'flex',
                // these conditional margins cover margins for centered and right aligned images
                ...(data.style.justifyContent === 'center'
                    ? {
                          margin: 'none',
                          marginTop: data.style.margin,
                          marginBottom: data.style.margin,
                      }
                    : {}),
                ...(data.style.justifyContent === 'right'
                    ? {
                          margin: 'none',
                          marginTop: data.style.margin,
                          marginBottom: data.style.margin,
                          marginRight: data.style.margin,
                      }
                    : {}),
                border: 'none',
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
                    padding: 'none',
                    margin: 'none',
                }}
                src={data.src}
                title={data.title}
            />
        </span>
    );
});
