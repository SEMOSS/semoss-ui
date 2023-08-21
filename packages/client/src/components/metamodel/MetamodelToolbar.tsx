import React from 'react';
import { Button, styled, ButtonGroup, Typography } from '@semoss/ui';
import { Sync, Add, Save } from '@mui/icons-material';

const StyledButtonGroup = styled(ButtonGroup)(() => ({
    display: 'inline-flex',
    margin: '9px 9px 9px 9px',
    height: '42px',
    alignItems: 'center',
    flexShrink: 0,
    borderRadius: 'var(--shape-border-radius-lg, 12px)',
    background: 'var(--light-background-paper, #FFF)',
    // boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    border: 'none',
    // borderRadius: '16px',
    boxShadow: '0 8px 16px 0 #BDC9D7',
}));

const StyledButton = styled(Button)(() => ({
    display: 'flex',
    padding: '8px 22px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
}));
const StyledIconButton = styled(Button)(() => ({
    display: 'flex',
    padding: '0px 22px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    alignSelf: 'stretch',
    border: 'none',
}));
const StyledSyncIcon = styled(Sync)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    color: 'rgba(0, 0, 0, 0.54)',
}));
const StyledAddIcon = styled(Add)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    color: 'rgba(0, 0, 0, 0.54)',
}));
const StyledSaveIcon = styled(Save)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    color: 'rgba(0, 0, 0, 0.54)',
}));

const ButtonLabel = styled(Typography)(() => ({
    color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
    fontFeatureSettings: 'clig off, liga off',
    fontFamily: 'Inter',
    fontsize: '15px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '26px',
    letterSpacing: '0.46px',
}));

export const MetamodelToolbar = () => (
    <StyledButtonGroup variant="text">
        <StyledButton variant="text" onClick={() => console.log('hello')}>
            <StyledSyncIcon />{' '}
            <ButtonLabel variant="body2">Sync Changes</ButtonLabel>
        </StyledButton>
        <StyledButton variant="text" onClick={() => console.log('hello')}>
            <StyledAddIcon />
            <ButtonLabel variant="body2">Add Table</ButtonLabel>
        </StyledButton>
        <StyledIconButton variant="text">
            <StyledSaveIcon />
        </StyledIconButton>
    </StyledButtonGroup>
);
