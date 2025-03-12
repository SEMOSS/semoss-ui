import { Popover } from '@mui/material';
import { Box, Button, Divider, Stack, styled } from '@semoss/ui';

export interface BlocksMenuPanelFilterMenuProps {
    anchorEl: null | HTMLElement;
    onClose: () => void;
}

const FlexButton = styled(Button)({
    flex: 1,
    textWrap: 'nowrap',
});

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
                <Stack direction="row" paddingX={4} paddingY={2} spacing={2}>
                    <FlexButton variant="outlined" color="secondary">
                        Clear All
                    </FlexButton>
                    <FlexButton variant="contained">Apply</FlexButton>
                </Stack>
            </Stack>
        </Popover>
    );
};
