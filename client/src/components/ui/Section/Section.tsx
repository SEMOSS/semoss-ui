import { ComponentPropsWithRef, forwardRef, ForwardedRef } from 'react';
import { styled } from '@semoss/components';

import { theme } from '@/theme';

const StyledSection = styled('section', {
    borderBottomWidth: theme.borderWidths.default,
    borderBottomColor: theme.colors['grey-4'],
    paddingBottom: theme.space[4],
    marginBottom: theme.space[2],
    '&:last-child': {
        borderBottom: 'none',
        marginBottom: 0,
    },
});

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
