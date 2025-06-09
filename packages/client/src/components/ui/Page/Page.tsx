import React, { useEffect, useState } from 'react';
import { styled, Container } from '@semoss/ui';

const StyledPage = styled(Container)(({ theme }) => ({
    top: '40px',
    position: 'absolute',
    height: 'calc(100vh - 40px) !important',
    width: '100%',
    overflow: 'scroll',
    background: '#FAFAFA',
    paddingBottom: theme.spacing(2.5),
    paddingLeft: '32px !important',
    paddingRight: '32px !important',
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
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(1),
    // paddingLeft: "32px",
    // paddingRight: "32px",
    // Checkout user permissions, and the stacked avatars
    zIndex: 10,
    // Set this in Theme
    background: '#FAFAFA',
    minWidth: '100%',
    width: 'fit-content',
    // position: 'sticky',
    // top: '-1px',
    // borderBottom: stuck ? `solid ${theme.palette.divider}` : 'none',
}));

const StyledContainer = styled(Container)(() => ({
    // width: '100%',
    padding: '0px',
    paddingLeft: '32px',
    paddingRight: '32px',
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
        <StyledPage
            id="home__content"
            maxWidth={false}
            sx={{ maxWidth: '1440px' }}
        >
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
