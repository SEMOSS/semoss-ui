import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled } from '@semoss/components';

import { theme } from '@/theme';

const StyledCardFooter = styled('div', {
    padding: theme.space['4'],
    color: theme.colors['grey-2'],
    fontSize: theme.fontSizes.xs,
    borderTopWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
});

export type CardFooterProps = ComponentPropsWithRef<'div'>;

export const _CardFooter = (
    props: CardFooterProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const { children, ...otherProps } = props;

    return (
        <StyledCardFooter ref={ref} {...otherProps}>
            {children}
        </StyledCardFooter>
    );
};

export const CardFooter = forwardRef(_CardFooter) as (
    props: CardFooterProps & {
        ref?: ForwardedRef<HTMLDivElement>;
    },
) => ReturnType<typeof _CardFooter>;
