import { Popover } from '@mui/material';

export interface BlocksMenuPanelFilterMenuProps {
    anchorEl: null | HTMLElement;
    onClose: () => void;
}

export const BlocksMenuPanelFilterMenu = ({
    anchorEl,
    onClose,
}: BlocksMenuPanelFilterMenuProps) => {
    return (
        <Popover
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorEl={anchorEl}
            anchorOrigin={{
                horizontal: 'right',
                vertical: 'bottom',
            }}
            id="blocks-filter-menu"
            transformOrigin={{
                horizontal: 'right',
                vertical: 'top',
            }}
        >
            Hi World
        </Popover>
    );
};
