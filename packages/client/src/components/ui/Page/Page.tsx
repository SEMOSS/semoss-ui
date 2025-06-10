import React, { useEffect, useState } from 'react';
import { styled, Container, Stack, Box } from '@semoss/ui';

const StyledPage = styled(Container)(({ theme }) => ({
    top: '56px',
    position: 'absolute',
    height: 'calc(100vh - 56px) !important',
    width: '100%',
    overflow: 'scroll',
    background: '#FAFAFA',
    paddingBottom: theme.spacing(2.5),
    paddingLeft: '40px',
    paddingRight: '40px',
    display: 'flex',
    flexDirection: 'column',
    /* Media query for screens with a minimum width of 600px */
    '@media (min-width: 600px)': {
        '&.MuiContainer-root': {
            paddingLeft: '0px !important',
            paddingRight: '0px !important',
        },
    },
}));

const StyledPageHeader = styled('div', {
    shouldForwardProp: (prop) => prop !== 'stuck',
})<{
    /** Track if the page header is stuck */
    stuck: boolean;
}>(({ theme, stuck }) => ({
    paddingBottom: theme.spacing(1),
    // Checkout user permissions, and the stacked avatars
    zIndex: 10,
    // Set this in Theme
    background: '#FAFAFA',
    minWidth: '100%',
    width: 'fit-content',
}));

const StyledContainer = styled(Container)(() => ({
    // width: '100%',
    padding: '0px',
    paddingLeft: '40px',
    paddingRight: '40px',
    /* Media query for screens with a minimum width of 600px */
    '@media (min-width: 600px)': {
        '&.MuiContainer-root': {
            paddingLeft: '0px !important',
            paddingRight: '0px !important',
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
            <Stack direction={'column'} p={5} gap={2}>
                {header && (
                    <StyledPageHeader
                        ref={(node) => setHeaderElement(node)}
                        stuck={stuck}
                    >
                        {header}
                    </StyledPageHeader>
                )}
                <Box>{children}</Box>
            </Stack>
        </StyledPage>
    );
};
