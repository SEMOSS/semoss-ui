import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';

import { styled } from '@semoss/ui';

const StyledSection = styled('section')(({ theme }) => ({
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: theme.palette.divider,
    '&:last-child': {
        borderBottom: 'none',
        marginBottom: 0,
    },
}));

export type SectionProps = ComponentPropsWithRef<'section'>;

const _Section = (
    props: SectionProps,
    ref: ForwardedRef<HTMLDivElement>,
): JSX.Element => {
    const { children, ...otherProps } = props;

    return (
        <StyledSection ref={ref} {...otherProps}>
            {children}
        </StyledSection>
    );
};

export const Section = forwardRef(_Section);
