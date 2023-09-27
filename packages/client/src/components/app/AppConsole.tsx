import React from 'react';
import { Icon, Typography, useNotification, styled } from '@semoss/ui';
import { BugReport, CloseOutlined } from '@mui/icons-material';
import { useApp, useRootStore } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    // height: '100%',
    overflow: 'hidden',
}));

const StyledDebugPreviewContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
}));

const StyledOpenConsoleButton = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, .5)',
}));

export const AppConsole = () => {
    // Console when in edit mode
    const dateObject = new Date();
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const { appId, openConsole, setOpenConsole } = useApp();

    return (
        <StyledContainer>
            <StyledDebugPreviewContainer>
                <Typography variant="caption">
                    {dateObject.toUTCString()}
                </Typography>
                <StyledOpenConsoleButton
                    onClick={() => {
                        setOpenConsole();
                    }}
                >
                    <StyledIcon>
                        <BugReport />
                    </StyledIcon>
                    <Typography variant="caption">Debug Console</Typography>
                    {openConsole ? (
                        <StyledIcon>
                            <CloseOutlined />
                        </StyledIcon>
                    ) : null}
                </StyledOpenConsoleButton>
            </StyledDebugPreviewContainer>
            {openConsole ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <Typography variant="h6">
                        Currently in Progress...
                    </Typography>
                    <Typography variant="body1">
                        We appreciate the patience with ongoing development, in
                        the future this view will allow you to see the different
                        responses that come back via the application, whether
                        that being errors warnings and messages.
                    </Typography>
                </div>
            ) : null}
        </StyledContainer>
    );
};
