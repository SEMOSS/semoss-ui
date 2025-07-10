import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { HelpRounded } from '@mui/icons-material';

import { Button, Menu, styled } from '@semoss/ui';

import { useRootStore } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
}));

const StyledButton = styled(Button)(({ theme }) => ({
    boxShadow: '0px 5px 24px 0px rgba(0, 0, 0, 0.24)',
    background: theme.palette.background.paper,
    borderRadius: '64px',
    border: '1px solid var(--Secondary-Border, #C4C4C4)',
}));

const StyledLink = styled('a')(({ theme }) => ({
    textDecoration: 'none',
    color: 'black',
}));

export const Help = observer((): JSX.Element => {
    //Help Modal
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const { configStore } = useRootStore();

    const handleHelpClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleHelpClose = () => {
        setAnchorEl(null);
    };

    return (
        <StyledContainer>
            <StyledButton
                id="help-btn"
                variant="outlined"
                startIcon={<HelpRounded />}
                color="inherit"
                onClick={handleHelpClick}
                size="small"
            >
                Help
            </StyledButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleHelpClose}
                anchorOrigin={{
                    vertical: -8,
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                {configStore.theme.helpBannerOrder.map((key, i) => {
                    const v = configStore.theme.helpBannerValues[key];

                    if (v) {
                        return (
                            <Menu.Item
                                key={`${key}-${i}`}
                                disabled={v.disabled ? v.disabled : false}
                                value={null}
                            >
                                <span>
                                    <StyledLink
                                        href={v.src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {v.label}
                                    </StyledLink>
                                </span>
                            </Menu.Item>
                        );
                    }
                })}
            </Menu>
        </StyledContainer>
    );
});
