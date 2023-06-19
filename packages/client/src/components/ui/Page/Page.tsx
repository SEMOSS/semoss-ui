import React, { useEffect, useState } from 'react';
import { styled, Container } from 'semoss-components';

const StyledPage = styled('div')(() => ({
    height: '100%',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledPageHeader = styled('div', {
    shouldForwardProp: (prop) => prop !== 'stuck',
})<{
    /** Track if the page header is stuck */
    stuck: boolean;
}>(({ theme, stuck }) => ({
    position: 'sticky',
    top: '-1px',
    paddingTop: '1px',
    // Checkout user permissions, and the stacked avatars
    zIndex: '10',
    borderBottom: stuck ? 1 : 'none',
    borderBottomColor: theme.palette.grey['500'],
    marginBottom: theme.spacing(2),
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
        <StyledPage>
            {header && (
                <StyledPageHeader
                    ref={(node) => setHeaderElement(node)}
                    stuck={stuck}
                >
                    <Container maxWidth="md">{header}</Container>
                </StyledPageHeader>
            )}
            <Container maxWidth="md">{children}</Container>
        </StyledPage>
    );
};
