import { Popover } from '@mui/material';
import { Box, Divider, Stack } from '@semoss/ui';

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
            <Stack>
                <Box>Filter By</Box>
                <Divider orientation="horizontal" />
                <Box>Checkboxes</Box>
                <Divider orientation="horizontal" />
                <Box>Buttons</Box>
            </Stack>
        </Popover>
    );
};
