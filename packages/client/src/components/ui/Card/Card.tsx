import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled } from '@semoss/components';

import { theme } from '@/theme';

const StyledCard = styled('div', {
    display: 'block',
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
    borderRadius: theme.radii.default,
    backgroundColor: theme.colors.base,
    overflow: 'hidden',
});

export type CardProps = ComponentPropsWithRef<'div'>;

export const _Card = (
    props: CardProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const { children, ...otherProps } = props;

    return (
        <StyledCard ref={ref} {...otherProps}>
            {children}
        </StyledCard>
    );
};

export const Card = forwardRef(_Card) as (
    props: CardProps & {
        ref?: ForwardedRef<HTMLDivElement>;
    },
) => ReturnType<typeof _Card>;
