import React, { useEffect, useState } from 'react';
import { styled, Container } from '@semoss/ui';

const StyledPage = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflow: 'scroll',
    backgroundColor: theme.palette.background.paper1,
    paddingBottom: theme.spacing(2.5),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
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
    backgroundColor: theme.palette.background.paper1,
    minWidth: '100%',
    width: 'fit-content',
}));

const StyledContainer = styled(Container)(() => ({
    width: '1264px',
    padding: '0px',
    /* Media query for screens with a minimum width of 600px */
    '@media (min-width: 600px)': {
        '&.MuiContainer-root': {
            paddingLeft: '0px',
            paddingRight: '0px',
        },
    },
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
                    <StyledContainer maxWidth={false}>{header}</StyledContainer>
                </StyledPageHeader>
            )}
            <StyledContainer maxWidth={false}>{children}</StyledContainer>
        </StyledPage>
    );
};
