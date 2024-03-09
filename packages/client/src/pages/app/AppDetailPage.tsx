import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Breadcrumbs,
    Button,
    ButtonGroup,
    IconButton,
    styled,
    useNotification,
} from '@semoss/ui';
import { SettingsTiles } from '@/components/settings/SettingsTiles';
import { AppSettings } from '@/components/app/AppSettings';
import { useRootStore } from '@/hooks';

const TopButtonsContainer = styled('div')({
    display: 'flex',
    gap: '0.25rem',
    marginLeft: 'auto',
});

const StyledTextButton = styled(Button)(({ theme }) => ({
    fontWeight: 'bold',
}));

const StyledArrowDropDownIcon = styled(ArrowDropDownIcon)({
    display: 'flex',
    alignItems: 'center',
});

const Sidebar = styled('div')({
    display: 'flex',
    borderRight: 'solid',
    flexDirection: 'column',
    fontWeight: 'bold',
    gap: '1rem',
    overflow: 'scroll',
});

const SidebarLink = styled(Link)({
    color: 'inherit',
    fontWeight: 'bold',
    textDecoration: 'none',
    '&:visited': {
        color: 'inherit',
    },
});

export function AppDetailPage() {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    return (
        <Sidebar>
            <Breadcrumbs>Breadcrumbs</Breadcrumbs>
            <TopButtonsContainer>
                <StyledTextButton variant="text">
                    Change Access
                </StyledTextButton>
                <ButtonGroup>
                    <Button variant="contained">Open</Button>
                    <Button variant="contained">
                        <StyledArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
                {/* <div style={{ width: '50rem' }}> */}
                <IconButton>
                    <MoreVertIcon />
                </IconButton>
                {/* </div> */}
            </TopButtonsContainer>
            <div
                style={{
                    display: 'flex',
                }}
            >
                <Sidebar>
                    <SidebarLink to="#main-uses">Main Uses</SidebarLink>
                    <SidebarLink to="#tags">Tags</SidebarLink>
                    <SidebarLink to="#videos">Videos</SidebarLink>
                    <SidebarLink to="#dependencies">Dependencies</SidebarLink>
                    <SidebarLink to="#app-access">App Access</SidebarLink>
                    <SidebarLink to="#member-access">Member Access</SidebarLink>
                </Sidebar>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontWeight: 'bold',
                    }}
                >
                    <pre>(Title Section)</pre>
                    <pre id="#main-uses">Main uses</pre>
                    <pre id="#tags">Tags</pre>
                    <pre id="#videos">Video</pre>
                    <pre id="#dependencies">Dependencies (reactor call)</pre>
                    <pre id="#member-access">Member Access</pre>
                    {/* <AppSettings id={appId} /> */}
                    {/* <SettingsTiles
                        id={appId}
                        mode={'app'}
                        name={'app'}
                        onDelete={() => {
                            navigate('..', { relative: 'path' });
                        }}
                    /> */}
                    <pre id="#app-access">
                        App Access section (components from Settings)
                    </pre>
                </div>
            </div>
        </Sidebar>
    );
}
