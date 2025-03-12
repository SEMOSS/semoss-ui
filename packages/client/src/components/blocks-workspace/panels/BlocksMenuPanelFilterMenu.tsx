import { Menu } from '@semoss/ui';

export interface BlocksMenuPanelFilterMenuProps {
    anchorEl: null | HTMLElement;
    onClose: () => void;
}

export const BlocksMenuPanelFilterMenu = ({
    anchorEl,
    onClose,
}: BlocksMenuPanelFilterMenuProps) => {
    return (
        <Menu open={Boolean(anchorEl)} onClose={onClose} anchorEl={anchorEl}>
            Hello world
        </Menu>
    );
};
