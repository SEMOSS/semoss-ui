import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled, Typography } from '@/component-library';

const StyledSectionHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledSectionTitle = styled(Typography)(() => ({
    // textTransform: 'uppercase',
}));

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
            <StyledSectionTitle variant={'h6'}>{children}</StyledSectionTitle>
            {actions}
        </StyledSectionHeader>
    );
};

export const SectionHeader = forwardRef(_SectionHeader);
