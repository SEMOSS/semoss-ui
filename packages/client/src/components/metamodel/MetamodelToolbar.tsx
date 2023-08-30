import { Button, styled, Typography, IconButton } from '@semoss/ui';
import {
    Sync,
    FitScreenRounded,
    ArrowDropDownRounded,
    LanOutlined,
    OpenInFullRounded,
} from '@mui/icons-material';

const AddTableIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="24"
        viewBox="0 0 25 24"
        fill="none"
    >
        <path
            d="M18.25 14H20.25V17H23.25V19H20.25V22H18.25V19H15.25V17H18.25V14ZM4.25 3H18.25C18.7804 3 19.2891 3.21071 19.6642 3.58579C20.0393 3.96086 20.25 4.46957 20.25 5V12.08C18.7 11.82 17.17 12.18 15.93 13H12.25V17H13.33C13.22 17.68 13.22 18.35 13.33 19H4.25C3.71957 19 3.21086 18.7893 2.83579 18.4142C2.46071 18.0391 2.25 17.5304 2.25 17V5C2.25 4.46957 2.46071 3.96086 2.83579 3.58579C3.21086 3.21071 3.71957 3 4.25 3ZM4.25 7V11H10.25V7H4.25ZM12.25 7V11H18.25V7H12.25ZM4.25 13V17H10.25V13H4.25Z"
            fill="black"
            fillOpacity="0.54"
        />
    </svg>
);
const ViewTableIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="24"
        viewBox="0 0 25 24"
        fill="none"
    >
        <path
            d="M17.25 16.88C17.81 16.88 18.25 17.32 18.25 17.88C18.25 18.44 17.81 18.88 17.25 18.88C16.69 18.88 16.25 18.43 16.25 17.88C16.25 17.33 16.69 16.88 17.25 16.88ZM17.25 13.88C19.98 13.88 22.31 15.54 23.25 17.88C22.31 20.22 19.98 21.88 17.25 21.88C14.52 21.88 12.19 20.22 11.25 17.88C12.19 15.54 14.52 13.88 17.25 13.88ZM17.25 15.38C15.87 15.38 14.75 16.5 14.75 17.88C14.75 19.26 15.87 20.38 17.25 20.38C18.63 20.38 19.75 19.26 19.75 17.88C19.75 16.5 18.63 15.38 17.25 15.38ZM18.25 3H4.25C3.15 3 2.25 3.9 2.25 5V17C2.25 18.1 3.15 19 4.25 19H9.67C9.51 18.68 9.37 18.34 9.25 18C9.37 17.66 9.51 17.32 9.67 17H4.25V13H10.25V15.97C10.8 15.11 11.48 14.37 12.25 13.76V13H13.4C14.56 12.36 15.87 12 17.25 12C18.31 12 19.32 12.21 20.25 12.59V5C20.25 3.9 19.35 3 18.25 3ZM10.25 11H4.25V7H10.25V11ZM18.25 11H12.25V7H18.25V11Z"
            fill="black"
            fillOpacity="0.54"
        />
    </svg>
);

const StyledComponent = styled('div')(({ theme }) => {
    const shape = theme.shape as unknown as {
        borderRadiusNone: string;
        borderRadiusLg: string;
    };
    return {
        display: 'flex',
        padding: '16px',
        gap: '10px',
        height: '64px',
        alignItems: 'center',
        alignSelf: 'stretch',
        borderRadius: shape.borderRadiusLg,
        background: theme.palette.background.paper,
        boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    };
});

const QuickButtonGroup = styled('div')(({ theme }) => {
    const shape = theme.shape as unknown as {
        borderRadiusNone: string;
    };
    return {
        display: 'flex',
        width: '572px',
        padding: shape.borderRadiusNone,
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        borderRadius: shape.borderRadiusNone,
    };
});
const ExtraButtonGroup = styled('div')(({ theme }) => {
    const shape = theme.shape as unknown as {
        borderRadiusNone: string;
    };
    return {
        display: 'flex',
        paddingRight: '0px',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        gap: '10px',
        flex: '1 0 0',
        borderRadius: shape.borderRadiusNone,
    };
});
const ExpandButton = styled('div')(({ theme }) => {
    const shape = theme.shape as unknown as {
        borderRadiusNone: string;
    };
    return {
        display: 'flex',
        padding: shape.borderRadiusNone,
        alignItems: 'flex-start',
        gap: '4px',
        borderRadius: shape.borderRadiusNone,
    };
});

const StyledButtonContainer = styled('div')(({ theme }) => {
    const shape = theme.shape as unknown as {
        borderRadiusLg: string;
        borderRadiusNone: string;
    };

    return {
        display: 'flex',
        padding: shape.borderRadiusNone,
        alignItems: 'center',
        gap: '4px',
        flex: '1 0 0',
        borderRadius: shape.borderRadiusNone,
    };
});

const StyledSyncButton = styled(Button)(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 'var(--shape-border-radius-lg, 12px);',
    border: '1px solid var(--light-primary-shades-50-p, rgba(64, 160, 255, 0.50));',
}));
const StyledSyncButtonLabel = styled('div')(() => ({
    display: 'flex',
    padding: 'var(--shape-border-radius-none, 0px);',
    alignItems: 'center',
    gap: '8px',
    borderRadius: 'var(--shape-border-radius-none, 0px);',
}));
const StyledSaveButton = styled(Button)(() => ({
    display: 'flex',
    flexDirection: 'column',
    // padding: '8px 22px',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 'var(--shape-border-radius-lg, 12px);',
    background: 'var(--light-primary-main, #0471F0)',
}));
const StyledIconButton = styled(Button)(() => ({
    display: 'flex',
    padding: '0px 22px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    alignSelf: 'stretch',
}));
const StyledSyncIcon = styled(Sync)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    color: 'rgba(0, 0, 0, 0.54)',
}));

export const MetamodelToolbar = () => (
    <StyledComponent>
        <StyledButtonContainer>
            <Typography variant="h6">Metamodel</Typography>
            <QuickButtonGroup>
                <IconButton disabled={true}>
                    <FitScreenRounded />
                </IconButton>
                <IconButton disabled={true}>
                    <AddTableIcon />
                </IconButton>
                <IconButton disabled={true}>
                    <ViewTableIcon />
                    <ArrowDropDownRounded />
                </IconButton>
                <IconButton disabled={true}>
                    <LanOutlined />
                    <ArrowDropDownRounded />
                </IconButton>
            </QuickButtonGroup>
            <ExtraButtonGroup>
                <StyledSyncButton
                    disabled={true}
                    variant="outlined"
                    onClick={() => console.log('hello')}
                >
                    <StyledSyncButtonLabel>
                        <StyledSyncIcon />{' '}
                        <Typography variant="button">Sync</Typography>
                    </StyledSyncButtonLabel>
                </StyledSyncButton>
                <StyledSaveButton disabled={true} variant="contained">
                    Save
                </StyledSaveButton>
            </ExtraButtonGroup>
            <ExpandButton>
                <IconButton>
                    <OpenInFullRounded />
                </IconButton>
            </ExpandButton>
        </StyledButtonContainer>
    </StyledComponent>
);
