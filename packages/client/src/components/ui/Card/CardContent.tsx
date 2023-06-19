import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled } from '@semoss/components';

import { theme } from '@/theme';

const StyledCardContent = styled('div', {
    flex: '1',
    padding: theme.space['4'],
    variants: {
        stretch: {
            true: {
                padding: '0',
            },
        },
    },
});

export interface CardContentProps extends ComponentPropsWithRef<'div'> {
    /** Stretch the content to fit the  card */
    stretch?: boolean;
}

export const _CardContent = (
    props: CardContentProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const { children, stretch = false, ...otherProps } = props;

    return (
        <StyledCardContent ref={ref} stretch={stretch} {...otherProps}>
            {children}
        </StyledCardContent>
    );
};

export const CardContent = forwardRef(_CardContent) as (
    props: CardContentProps & {
        ref?: ForwardedRef<HTMLDivElement>;
    },
) => ReturnType<typeof _CardContent>;
