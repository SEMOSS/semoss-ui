import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled } from '@semoss/components';

import { theme } from '@/theme';

const StyledCardHeader = styled('div', {
    padding: theme.space['4'],
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
});

export type CardHeaderProps = ComponentPropsWithRef<'div'>;

export const _CardHeader = (
    props: CardHeaderProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const { children, ...otherProps } = props;

    return (
        <StyledCardHeader ref={ref} {...otherProps}>
            {children}
        </StyledCardHeader>
    );
};

export const CardHeader = forwardRef(_CardHeader) as (
    props: CardHeaderProps & {
        ref?: ForwardedRef<HTMLDivElement>;
    },
) => ReturnType<typeof _CardHeader>;
