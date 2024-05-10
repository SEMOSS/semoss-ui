import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, styled } from '@semoss/ui';

import { WelcomeModal } from '@/components/welcome';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { HelpRounded } from '@mui/icons-material';

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
}));

const StyledLink = styled('a')(({ theme }) => ({
    textDecoration: 'none',
    color: 'black',
}));

export const Help = observer((): JSX.Element => {
    //Help Modal
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleHelpClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleHelpClose = () => {
        setAnchorEl(null);
    };

    return (
        <StyledContainer>
            <Button
                id="help-btn"
                variant="outlined"
                startIcon={<HelpRounded />}
                color="inherit"
                aria-controls={open ? 'help-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleHelpClick}
                size="small"
            >
                Help
            </Button>
            <Menu
                id="help-menu"
                aria-labelledby="help-btn"
                anchorEl={anchorEl}
                open={open}
                onClose={handleHelpClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem>
                    <span>
                        <StyledLink
                            href="https://workshop.cfg.deloitte.com/docs/"
                            target="_blank"
                        >
                            Documentation
                        </StyledLink>
                    </span>
                </MenuItem>
                <MenuItem>
                    <span>
                        <StyledLink
                            href="https://workshop.cfg.deloitte.com/docs/category/app-creation-guides"
                            target="_blank"
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
                </MenuItem>
            </Menu>
        </StyledContainer>
    );
});
