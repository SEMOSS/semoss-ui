import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled } from '@semoss/components';

import { theme } from '@/theme';

const StyledSectionHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.space['4'],
    gap: theme.space['2'],
});

const StyledSectionTitle = styled('h4', {
    color: theme.colors['grey-2'],
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textTransform: 'uppercase',
});

export interface SectionHeaderProps extends ComponentPropsWithRef<'div'> {
    /** Actions to Append after the title */
    actions?: React.ReactNode;
}

const _SectionHeader = (
    props: SectionHeaderProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const { children, actions, ...otherProps } = props;

    return (
        <StyledSectionHeader ref={ref} {...otherProps}>
            <StyledSectionTitle>{children}</StyledSectionTitle>
            {actions}
        </StyledSectionHeader>
    );
};

export const SectionHeader = forwardRef(_SectionHeader);
