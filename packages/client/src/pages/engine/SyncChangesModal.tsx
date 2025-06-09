import React, { useState, useMemo } from 'react';
import {
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Stack,
    Typography,
    Divider,
    Modal,
    ModalContent,
} from '@semoss/ui';
import { ModalTitle } from '@semoss/ui/src/components/Modal/ModalTitle';
import { ModalActions } from '@semoss/ui/src/components/Modal/ModalActions';

interface SyncChangesModalProps {
    open: boolean;
    onClose: () => void;
    onApply: (selectedTables: string[], selectedViews: string[]) => void;
    tables: string[];
    views: string[];
}

export const SyncChangesModal: React.FC<SyncChangesModalProps> = ({
    open,
    onClose,
    onApply,
    tables,
    views,
}) => {
    const [tableSearch, setTableSearch] = useState('');
    const [viewSearch, setViewSearch] = useState('');
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [selectedViews, setSelectedViews] = useState<string[]>([]);

    const toggleSelection = (
        id: string,
        list: string[],
        setter: (val: string[]) => void,
    ) => {
        if (list.includes(id)) {
            setter(list.filter((i) => i !== id));
        } else {
            setter([...list, id]);
        }
    };

    const filteredTables = useMemo(
        () =>
            tables.filter((t) =>
                t.toLowerCase().includes(tableSearch.toLowerCase()),
            ),
        [tables, tableSearch],
    );

    const filteredViews = useMemo(
        () =>
            views.filter((v) =>
                v.toLowerCase().includes(viewSearch.toLowerCase()),
            ),
        [views, viewSearch],
    );

    const allTablesSelected = selectedTables.length === tables.length;
    const allViewsSelected = selectedViews.length === views.length;

    return (
        <Modal
            open={open}
            onClose={onClose}
            maxWidth={'sm'}
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    width: '550px',
                    height: '760px',
                },
            }}
        >
            <ModalTitle>Sync Changes</ModalTitle>
            <ModalContent>
                <Typography variant="caption">
                    Select tables and views below to sync with external database
                    changes.
                    <br />
                    <b>Note:</b> any local changes made to selected table and
                    view properties will be overwritten by sync.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={2}>
                    <Stack flex={1} spacing={1}>
                        <Typography variant="subtitle2">
                            Select Tables:
                        </Typography>
                        <TextField
                            placeholder="Search..."
                            size="small"
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={allTablesSelected}
                                    onChange={() =>
                                        setSelectedTables(
                                            allTablesSelected ? [] : tables,
                                        )
                                    }
                                />
                            }
                            label="(Select searched items)"
                        />
                        <Stack sx={{ maxHeight: 390, overflowY: 'auto' }}>
                            {filteredTables.map((t) => (
                                <FormControlLabel
                                    key={t}
                                    control={
                                        <Checkbox
                                            checked={selectedTables.includes(t)}
                                            onChange={() =>
                                                toggleSelection(
                                                    t,
                                                    selectedTables,
                                                    setSelectedTables,
                                                )
                                            }
                                        />
                                    }
                                    label={t}
                                />
                            ))}
                        </Stack>
                    </Stack>
                    <Stack flex={1} spacing={1}>
                        <Typography variant="subtitle2">
                            Select Views:
                        </Typography>
                        <TextField
                            placeholder="Search..."
                            size="small"
                            value={viewSearch}
                            onChange={(e) => setViewSearch(e.target.value)}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={allViewsSelected}
                                    onChange={() =>
                                        setSelectedViews(
                                            allViewsSelected ? [] : views,
                                        )
                                    }
                                />
                            }
                            label="(Select all)"
                        />
                        <Stack sx={{ maxHeight: 200, overflowY: 'auto' }}>
                            {filteredViews.map((v) => (
                                <FormControlLabel
                                    key={v}
                                    control={
                                        <Checkbox
                                            checked={selectedViews.includes(v)}
                                            onChange={() =>
                                                toggleSelection(
                                                    v,
                                                    selectedViews,
                                                    setSelectedViews,
                                                )
                                            }
                                        />
                                    }
                                    label={v}
                                />
                            ))}
                        </Stack>
                    </Stack>
                </Stack>
            </ModalContent>
            <ModalActions>
                <Button onClick={onClose} variant="text">
                    Cancel
                </Button>
                <Button
                    onClick={() => onApply(selectedTables, selectedViews)}
                    disabled={
                        selectedTables.length === 0 &&
                        selectedViews.length === 0
                    }
                    variant="contained"
                >
                    Apply
                </Button>
            </ModalActions>
        </Modal>
    );
};
