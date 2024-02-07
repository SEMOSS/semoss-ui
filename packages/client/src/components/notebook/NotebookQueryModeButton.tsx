import { useState } from 'react';
import { styled, Button, Menu, MenuProps, List } from '@/component-library';
import { ActionMessages, QueryState } from '@/stores';
import { useBlocks } from '@/hooks';
import { AutoMode, AdsClick, KeyboardArrowDown } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledButtonLabel = styled('span')(({ theme }) => ({
    width: theme.spacing(8),
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
}));

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    width: theme.spacing(4),
    minWidth: 'unset',
}));

const QueryModeOptions = {
    automatic: {
        display: 'Automatic',
        value: 'automatic',
        icon: AutoMode,
    },
    manual: {
        display: 'Manual',
        value: 'manual',
        icon: AdsClick,
    },
};

export const NotebookQueryModeButton = (props: { query: QueryState }) => {
    const { query } = props;
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
                disabled={query.isLoading}
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={
                    query.mode === 'automatic' ? (
                        <AutoMode color="inherit" fontSize="small" />
                    ) : (
                        <AdsClick />
                    )
                }
                endIcon={<KeyboardArrowDown />}
            >
                <StyledButtonLabel>
                    {QueryModeOptions[query.mode].display}
                </StyledButtonLabel>
            </StyledButton>
            <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <List disablePadding dense>
                    {Array.from(
                        Object.values(QueryModeOptions),
                        (queryModeOption) => (
                            <List.Item
                                disablePadding
                                key={`${query.id}-${queryModeOption.value}`}
                            >
                                <List.ItemButton
                                    onClick={(e) => {
                                        state.dispatch({
                                            message:
                                                ActionMessages.UPDATE_QUERY,
                                            payload: {
                                                queryId: query.id,
                                                path: 'mode',
                                                value: queryModeOption.value,
                                            },
                                        });
                                        handleClose();
                                    }}
                                >
                                    <StyledListIcon>
                                        <queryModeOption.icon
                                            color="inherit"
                                            fontSize="small"
                                        />
                                    </StyledListIcon>
                                    <List.ItemText
                                        primary={queryModeOption.display}
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
