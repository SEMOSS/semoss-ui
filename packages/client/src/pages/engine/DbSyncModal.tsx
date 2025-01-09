import {
    styled,
    Modal,
    Stack,
    Search,
    Checkbox,
    Button,
    Typography,
} from '@semoss/ui';
import { useState } from 'react';

const StyledList = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.primary.border}`,
    padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
    overflowY: 'auto',
}));

interface PropsDbSyncModal {
    open: boolean;
    onClose: () => void;
}
export const DbSyncModal = (props: PropsDbSyncModal) => {
    const { open, onClose } = props;

    const [dbTables, setDbTables] = useState([]);
    const [dbViews, setDbViews] = useState([]);

    const handleTableChange = () => {
        // TODO
    };

    const handleViewChange = () => {
        // TODO
    };

    const handleApplyChanges = () => {
        // TODO
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Modal.Title>Sync Changes</Modal.Title>
            <Modal.Content>
                <Typography variant="body1">
                    Select tables and views below to sync with external database
                    changes.{' '}
                    <i>
                        <b>Note:</b> any local changes made to selected table
                        and view properties will be overwritten by sync.
                    </i>
                </Typography>
                <br />

                <Stack direction="row" gap={1}>
                    <div>
                        <Typography variant="subtitle1">
                            Select Tables:
                        </Typography>

                        <Search />

                        <StyledList>
                            {dbTables.map((table, idx) => (
                                <Checkbox
                                    key={idx}
                                    label={table}
                                    checked={true}
                                    onChange={handleTableChange}
                                />
                            ))}
                        </StyledList>
                    </div>

                    <div>
                        <Typography variant="subtitle1">
                            Select Views:
                        </Typography>

                        <Search />

                        <StyledList>
                            {dbViews.map((table, idx) => (
                                <Checkbox
                                    key={idx}
                                    label={table}
                                    checked={true}
                                    onChange={handleViewChange}
                                />
                            ))}
                        </StyledList>
                    </div>
                </Stack>
            </Modal.Content>

            <Modal.Actions>
                <Button onChange={handleApplyChanges}>Apply</Button>
            </Modal.Actions>
        </Modal>
    );
};
