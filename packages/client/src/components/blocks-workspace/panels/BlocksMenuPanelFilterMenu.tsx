import { Close } from '@mui/icons-material';
import { ListItemIcon, ListItemText, Popover } from '@mui/material';
import {
    Button,
    Checkbox,
    Divider,
    IconButton,
    List,
    MenuItem,
    Stack,
    styled,
    Typography,
} from '@semoss/ui';
import { FilterCategory } from '../menus/menu-types';
import { useEffect, useState } from 'react';

export interface BlocksMenuPanelFilterMenuProps {
    anchorEl: null | HTMLElement;
    onClose: () => void;
    categoryMap: Record<string, FilterCategory>;
}

const FlexButton = styled(Button)({
    flex: 1,
    textWrap: 'nowrap',
});

export const BlocksMenuPanelFilterMenu = ({
    anchorEl,
    onClose,
    categoryMap,
}: BlocksMenuPanelFilterMenuProps) => {
    const [localCategoryMap, setLocalCategoryMap] =
        useState<typeof categoryMap>(categoryMap);

    useEffect(() => {
        if (anchorEl) setLocalCategoryMap(categoryMap);
    }, [categoryMap, anchorEl]);

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
                <Stack
                    paddingX={2}
                    paddingTop={2}
                    paddingBottom={1}
                    alignItems="center"
                    justifyContent="space-between"
                    direction="row"
                >
                    <Typography variant="body2" color="primary">
                        Filter By
                    </Typography>
                    <IconButton size="small" onClick={onClose}>
                        <Close />
                    </IconButton>
                </Stack>
                <Divider orientation="horizontal" />
                <List>
                    {Object.values(localCategoryMap).map((category) => (
                        <MenuItem
                            key={category.id}
                            value={category.id}
                            onClick={() =>
                                setLocalCategoryMap((prev) => {
                                    const newMap = { ...prev };
                                    const newCategory = {
                                        ...newMap[category.id],
                                    };
                                    newCategory.enabled = !newCategory.enabled;
                                    newMap[category.id] = newCategory;
                                    return newMap;
                                })
                            }
                        >
                            <ListItemIcon>
                                <Checkbox checked={category.enabled} />
                            </ListItemIcon>
                            <ListItemText primary={category.display} />
                        </MenuItem>
                    ))}
                </List>
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
