import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

interface CustomCSSProperties extends CSSProperties {
    width?: string | number;
    height?: string | number;
    justifyContent?: string;
    marginBottom?: string;
    borderRadius?: string;
    marginRight?: string;
    marginLeft?: string;
    marginTop?: string;
    margin?: string;
    border?: string;
}

export interface ImageBlockDef extends BlockDef<'image'> {
    widget: 'image';
    data: {
        style: CustomCSSProperties;
        disabled: boolean;
        title: string;
        src: string;
    };
    slots: never;
}

// conditionally returns a span, div or img element wrapped in a span for spacing
// based on if there is an image source and if the user has or hasn't changed the image's size

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<ImageBlockDef>(id);

    // if there is no image source returns a default span with placeholder text styled if the user has defined styles
    if (!data.src)
        return (
            <span
                style={{
                    ...data.style,
                    // makes outer border wrap just the image if the alignment is left
                    width:
                        data.style.justifyContent === 'left' ||
                        !data.style.justifyContent
                            ? data.style.width || '100%'
                            : '100%',
                    // covers buggy behavior if using percentage for image height
                    height:
                        `${data.style.height}`.slice(-1) === '%'
                            ? `${data.style.height}`.slice(0, -1) + 'vh'
                            : data.style.height,
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
                        // covers buggy behavior if using percentage for image height
                        height:
                            `${data.style.height}`.slice(-1) === '%'
                                ? `${data.style.height}`.slice(0, -1) + 'vh'
                                : data.style.height || '250px',
                        borderRadius: data.style.borderRadius,
                        width: data.style.width || '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        overflow: 'hidden',
                        display: 'flex',
                        margin: 'none',
                    }}
                    {...attrs}
                >
                    please define
                    <br /> an image source
                </span>
            </span>
        );

    // returns sized div inside span when the user has started manipulating the image size
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
                    // fix to cover the broken height percentage property
                    height:
                        `${data.style.height}`.slice(-1) === '%'
                            ? `${data.style.height}`.slice(0, -1) + 'vh'
                            : data.style.height,
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
                        // fix to cover the broken height percentage property
                        height:
                            `${data.style.height}`.slice(-1) === '%'
                                ? `${data.style.height}`.slice(0, -1) + 'vh'
                                : data.style.height,
                        backgroundImage: `url('${data.src}')`,
                        backgroundSize: 'cover',
                        display: 'block',
                        margin: 'none',
                    }}
                    title={data.title}
                ></div>
            </span>
        );
    }

    // returns img in span if the user has not started manipulated the image size
    return (
        <span
            style={{
                ...data.style,
                // makes the outer border wrap just the image if the alignment is left
                width:
                    data.style.justifyContent === 'left' ||
                    !data.style.justifyContent
                        ? data.style.width || '100%'
                        : '100%',
                display: 'flex',
                // conditional margins cover margins for centered and right aligned images
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
