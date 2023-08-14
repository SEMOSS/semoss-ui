import React, { useEffect, useState } from 'react';
import { styled, Container } from '@semoss/ui';

const StyledPage = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    backgroundColor: theme.palette.background.paper,
    paddingBottom: theme.spacing(2.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledPageHeader = styled('div', {
    shouldForwardProp: (prop) => prop !== 'stuck',
})<{
    /** Track if the page header is stuck */
    stuck: boolean;
}>(({ theme, stuck }) => ({
    position: 'sticky',
    top: '-1px',
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(1),
    // Checkout user permissions, and the stacked avatars
    zIndex: 10,
    borderBottom: stuck ? `solid ${theme.palette.divider}` : 'none',
    // Set this in Theme
    backgroundColor: theme.palette.background.paper,
}));

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
        <StyledPage id="home__content">
            {header && (
                <StyledPageHeader
                    ref={(node) => setHeaderElement(node)}
                    stuck={stuck}
                >
                    <Container maxWidth={'xl'}>{header}</Container>
                </StyledPageHeader>
            )}
            <Container maxWidth={'xl'}>{children}</Container>
        </StyledPage>
    );
};
