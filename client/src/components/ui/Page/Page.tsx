import React, { useEffect, useState } from 'react';
import { theme } from '@/theme';
import { styled, Scroll } from '@semoss/components';

const StyledHeader = styled('div', {
    position: 'sticky',
    top: '-1px',
    paddingTop: '1px',
    marginTop: theme.space['8'],
    // Checkout user permissions, and the stacked avatars
    zIndex: '10',
    variants: {
        stuck: {
            true: {
                background: theme.colors.background,
                borderBottomWidth: theme.borderWidths.default,
                borderBottomColor: theme.colors['grey-4'],
            },
            false: {},
        },
    },
});

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingTop: theme.space[4],
    paddingBottom: theme.space[4],
    zIndex: '1',
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

export interface PageProps {
    /** Content to include in the header */
    header?: React.ReactNode;

    /** Content to include in the main section of the page */
    children: React.ReactNode;
}

export const Page = (props: PageProps): JSX.Element => {
    const { header, children } = props;

    const [stuck, setStuck] = useState(false);
    const [headerElement, setHeaderElement] = useState(null);

    // if the header element, is scrolled, set it as sticky
    useEffect(() => {
        if (!headerElement) {
            return;
        }

        const observer = new IntersectionObserver(
            ([e]) => {
                setStuck(e.intersectionRatio < 1);
            },
            { threshold: [1] },
        );
        observer.observe(headerElement);

        return () => {
            observer.unobserve(headerElement);
        };
    }, [headerElement]);

    return (
        <Scroll horizontal={false}>
            {header && (
                <StyledHeader
                    ref={(node) => setHeaderElement(node)}
                    stuck={stuck}
                >
                    <StyledContainer>{header}</StyledContainer>
                </StyledHeader>
            )}
            <StyledContainer>{children}</StyledContainer>
        </Scroll>
    );
};
