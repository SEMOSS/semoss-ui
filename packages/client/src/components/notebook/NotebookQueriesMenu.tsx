import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    List,
    Divider,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    Stack,
    Menu,
    useNotification,
} from '@semoss/ui';
import { useBlocks, useRootStore, useWorkspace } from '@/hooks';
import {
    Add,
    Search,
    CheckCircle,
    MoreVert,
    Error as ErrorIcon,
    Pending,
    Edit,
    ContentCopy,
    Delete,
    HourglassEmpty,
    Download,
} from '@mui/icons-material';
import { NewQueryOverlay } from './NewQueryOverlay';
import { ActionMessages } from '@/stores';
import { NotebookTokensMenu } from './NotebookTokensMenu';

/**
 * Render the queries menu of the nodebook
 */
export const NotebookQueriesMenu = observer((): JSX.Element => {
    return (
        <Stack direction="column" spacing={0} sx={{ height: '100%' }}>
            <NotebookTokensMenu />
        </Stack>
    );
});
