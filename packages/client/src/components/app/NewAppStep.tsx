import { Breadcrumbs, Icon, Stack, Typography, styled } from '@semoss/ui';
import { Outlet } from 'react-router-dom';
import { Page, LoadingScreen } from '@/components/ui';
import { ArrowBack } from '@mui/icons-material';
import React from 'react';

const StyledLink = styled('a')(({ theme }) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

interface NewAppStepProps {
    /** Content in the step */
    children: React.ReactNode;

    /** Title of the step */
    title: string;

    /** Optional discription to show with the step*/
    description?: string;

    /** Show the loading screen on the step. If defined, will show */
    isLoading?: boolean;

    /** Previous step. If defined, will show.  */
    previous?: {
        /** Title of the step */
        title: string;

        /** Callback fired on click */
        onClick: () => void;
    };
}

export const NewAppStep = (props: NewAppStepProps) => {
    const {
        children,
        title = '',
        description = '',
        isLoading = false,
        previous = { title: '', onClick: () => null },
    } = props;
    return (
        <Page
            header={
                <Stack>
                    <Breadcrumbs>
                        {previous ? (
                            <StyledLink
                                onClick={() => {
                                    // trigger the action
                                    previous.onClick();
                                }}
                            >
                                <Icon>
                                    <ArrowBack />
                                </Icon>
                                {previous.title}
                            </StyledLink>
                        ) : null}
                    </Breadcrumbs>
                    <Typography variant="h4">{title}</Typography>
                    {description ? (
                        <Typography variant="body1">{description}</Typography>
                    ) : (
                        <></>
                    )}{' '}
                </Stack>
            }
        >
            {isLoading && <LoadingScreen.Trigger />}
            {children}
        </Page>
    );
};
