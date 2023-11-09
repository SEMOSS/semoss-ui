import React, { useState } from 'react';
import { Button, IconButton, Modal, useNotification, styled } from '@semoss/ui';
import { Visibility } from '@mui/icons-material';

import { useApp, useRootStore } from '@/hooks';
import { Env } from '@/env';

const StyledNavbarChildren = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledNavbarLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    // gap: theme.spacing(2),
}));

const StyledNavbarRight = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
}));

const StyledTrack = styled('div', {
    shouldForwardProp: (prop) => prop !== 'active',
})<{
    /** Track if dev mode is enabled */
    active: boolean;
}>(({ theme, active }) => ({
    display: 'flex',
    alignItems: 'center',
    flexShrink: '0',
    width: '52px',
    height: '32px',
    padding: '2px 4px',
    borderRadius: '100px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: active
        ? theme.palette.primary.light
        : theme.palette.grey['500'],
    backgroundColor: active
        ? theme.palette.primary.light
        : theme.palette.action.active,
    '&:hover': {
        borderColor: active
            ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
            : theme.palette.grey['400'],
    },
}));

const StyledHandle = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{
    /** Track if dev mode is enabled */
    active: boolean;
}>(({ theme, active }) => ({
    left: active ? '16px' : '0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '23px',
    color: active ? theme.palette.common.white : theme.palette.common.black,
    backgroundColor: active
        ? theme.palette.primary.main
        : theme.palette.grey['500'],
    '&:hover': {
        backgroundColor: active
            ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
            : theme.palette.grey['400'],
    },
    transition: theme.transitions.create(['left'], {
        duration: theme.transitions.duration.standard,
    }),
}));

const StyledRightButton = styled(Button)(({ theme }) => ({
    marginLeft: 'auto',
    height: '32px',
    paddingRight: theme.spacing(1),
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

export const DesignerEditorActions = () => {
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const {
        appId,
        editorMode,
        editorView,
        setEditorMode,
        setEditorView,
        setIsLoading,
        isLoading,
    } = useApp();

    return (
        <StyledNavbarChildren>
            <StyledNavbarLeft></StyledNavbarLeft>
            <StyledNavbarRight>
                <StyledTrack
                    active={!editorMode}
                    onClick={() => {
                        setEditorMode(!editorMode);
                    }}
                >
                    <StyledHandle active={!editorMode}>
                        <Visibility />
                    </StyledHandle>
                </StyledTrack>
                <StyledRightButton variant="outlined" onClick={() => {}}>
                    {/* <StyledPublishedIcon /> */}Publish
                </StyledRightButton>
            </StyledNavbarRight>
        </StyledNavbarChildren>
    );
};
