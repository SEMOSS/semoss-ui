import { useState } from 'react';
import { styled, Button, Menu, MenuProps, List } from '@semoss/ui';
import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks } from '@/hooks';
import { CodeCellDef } from './config';
import { PythonIcon, RIcon } from './icons';
import { KeyboardArrowDown, CodeOff } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledButtonLabel = styled('span')(({ theme }) => ({
    width: theme.spacing(5.5),
    display: 'block',
    textAlign: 'start',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
    '.MuiList-root': {
        padding: 0,
    },
}));

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    width: theme.spacing(4),
    minWidth: 'unset',
}));

const CodeCellOptions = {
    py: {
        display: 'Python',
        value: 'py',
        icon: PythonIcon,
    },
    r: {
        display: 'R',
        value: 'r',
        icon: RIcon,
    },
    pixel: {
        display: 'Pixel',
        value: 'pixel',
        icon: CodeOff,
    },
};

export const CodeCellTitle: CellComponent<CodeCellDef> = (props) => {
    const { cell } = props;
    const { state } = useBlocks();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <>
            <StyledButton
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="outlined"
                disableElevation
                disabled={cell.isLoading}
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={
                    cell.parameters.type === 'py' ? (
                        <PythonIcon color="inherit" fontSize="small" />
                    ) : cell.parameters.type === 'r' ? (
                        <RIcon color="inherit" fontSize="small" />
                    ) : (
                        <CodeOff color="inherit" fontSize="small" />
                    )
                }
                endIcon={<KeyboardArrowDown />}
                title="Select Language"
            >
                <StyledButtonLabel>
                    {CodeCellOptions[cell.parameters.type].display}
                </StyledButtonLabel>
            </StyledButton>
            <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <List dense>
                    {Array.from(
                        Object.values(CodeCellOptions),
                        (codeCellOption) => (
                            <List.Item
                                disablePadding
                                key={`${cell.id}-${codeCellOption.value}`}
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.type',
                                                value: codeCellOption.value,
                                            },
                                        });
                                        handleClose();
                                    }}
                                >
                                    <StyledListIcon>
                                        <codeCellOption.icon
                                            color="inherit"
                                            fontSize="small"
                                        />
                                    </StyledListIcon>
                                    <List.ItemText
                                        primary={codeCellOption.display}
                                    />
                                </List.ItemButton>
                            </List.Item>
                        ),
                    )}
                </List>
            </StyledMenu>
        </>
    );
};
