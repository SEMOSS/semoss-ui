import { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, styled } from '@semoss/ui';

import { WelcomeModal } from '@/components/welcome';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { HelpRounded } from '@mui/icons-material';
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

    const HELP = useMemo(() => {
        const theme = configStore.store.config['theme'];

        try {
            if (theme && theme['THEME_MAP']) {
                const themeMap = JSON.parse(theme['THEME_MAP'] as string);
                return {
                    order: themeMap['helpBannerOrder']
                        ? themeMap['helpBannerOrder']
                        : [],
                    values: themeMap['helpBannerValues']
                        ? themeMap['helpBannerValues']
                        : {},
                };
            }
            return {
                order: [],
                values: {},
            };
        } catch {
            return {
                order: [],
                values: {},
            };
        }
    }, []);
    return (
        <StyledContainer>
            <StyledButton
                // aria-controls={open ? 'help-menu' : undefined}
                // aria-haspopup="true"
                // aria-expanded={open ? 'true' : undefined}
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
                // id="help-menu"
                // aria-labelledby="help-btn"
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
                {HELP.order.map((key, i) => {
                    const v = HELP.values[key];
                    debugger;
                    if (v) {
                        return (
                            <MenuItem
                                key={`${key}-${i}`}
                                disabled={v.disabled ? v.disabled : false}
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
                            </MenuItem>
                        );
                    }
                })}
                {/* <MenuItem>
                    <span>
                        <StyledLink
                            href="https://workshop.cfg.deloitte.com/docs/category/app-creation-guides"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Tutorials
                        </StyledLink>
                    </span>
                </MenuItem>
                <MenuItem onClick={handleHelpClose} disabled>
                    Platform Tour
                </MenuItem>
                <MenuItem onClick={handleHelpClose} disabled>
                    Github
                </MenuItem>
                <MenuItem onClick={handleHelpClose} disabled>
                    Feedback
                </MenuItem> */}
            </Menu>
        </StyledContainer>
    );
});
