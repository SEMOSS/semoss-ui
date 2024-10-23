import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Button, Menu } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

const StyledButton = styled(Button)(({ theme }) => ({
    width: theme.spacing(16),
}));

export const CodeWorkspaceTabs = observer(() => {
    const { workspace } = useWorkspace();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    /**
     * Close the menu and select a layout
     * @param layout -
     */
    const handleClose = (layout?: string) => {
        setAnchorEl(null);

        if (layout) {
            workspace.selectLayout(layout);
        }
    };

    console.log(workspace.selectedLayout);

    return (
        <>
            <StyledButton
                variant="outlined"
                size="small"
                onClick={(e) => handleOpen(e)}
            >
                {workspace.selectedLayout ? workspace.selectedLayout.name : ''}
            </StyledButton>
            <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
                {workspace.availableLayouts.map((a, lIdx) => {
                    return (
                        <Menu.Item
                            key={lIdx}
                            value={a.id}
                            onClick={(e) => handleClose(a.id)}
                        >
                            {a.name}
                        </Menu.Item>
                    );
                })}
            </Menu>
        </>
    );
});
