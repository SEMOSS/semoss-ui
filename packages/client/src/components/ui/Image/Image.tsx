import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled, StitchesCSS } from '@semoss/components';

import { theme } from '@/theme';

const StyledImageContainer = styled('div', {
    height: theme.space['40'],
    width: theme.space['64'],
});

const StyledImage = styled('img', {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    objectPosition: 'top',
});

export interface ImageProps
    extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    /** src of the image */
    src: string;
    /** How the image fits in the container */
    objectFit?: StitchesCSS['objectFit'];
    /** Alignment of the image in the container */
    objectPosition?: StitchesCSS['objectPosition'];
}

const _Image = (
    props: ImageProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const {
        src,
        objectFit = 'cover',
        objectPosition = 'top',
        ...otherProps
    } = props;

    return (
        <StyledImageContainer ref={ref} {...otherProps}>
            <StyledImage
                src={src}
                css={{
                    objectFit: objectFit,
                    objectPosition: objectPosition,
                }}
            />
        </StyledImageContainer>
    );
};

export const Image = forwardRef(_Image) as (
    props: ImageProps & {
        ref?: ForwardedRef<HTMLDivElement>;
    },
) => ReturnType<typeof _Image>;
