import React from 'react';
import { Page } from '@/components/ui';
import { Box, Stack, TextField, Typography, styled } from '@semoss/ui';
import { AddApp } from '@/components/app';

const StyledBox = styled(Box)(({ theme }) => ({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '16px 16px 16px 16px',
    marginBottom: '32px',
}));

const StyledSelectionContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const StyledSelection = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '45%',
    border: 'solid',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    // flex: '1 0 0'
}));

export const ImportAppPage = () => {
    return (
        <Page
            header={
                <Stack>
                    <div>Back to Add App</div>
                    <Typography variant="h4">Import App</Typography>
                    <Typography variant="body1">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                    </Typography>
                </Stack>
            }
        >
            <StyledBox>
                <StyledSelectionContainer>
                    <StyledSelection>
                        <Typography variant="h6">Upload ZIP</Typography>
                    </StyledSelection>
                    <div>
                        <Typography variant={'caption'}>OR</Typography>
                    </div>
                    <StyledSelection>
                        <Typography variant="h6">Connect to Git</Typography>
                        <Typography variant="body1">
                            To import your app from a GitHub repository, copy
                            and paste the HTTPS link below:
                        </Typography>
                        <TextField />
                    </StyledSelection>
                </StyledSelectionContainer>
                <div>Details</div>
            </StyledBox>
        </Page>
    );
};
