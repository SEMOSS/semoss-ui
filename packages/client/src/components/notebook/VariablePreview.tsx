import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Alert,
    Box,
    Divider,
    styled,
    Button,
    Icon,
    IconButton,
    List,
    Menu,
    Modal,
    Typography,
    Stack,
    useNotification,
    Tooltip,
    TextField,
    LinearProgress,
} from '@semoss/ui';
import { Variable } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';
import {
    ContentCopy,
    MoreVert,
    WarningAmberOutlined,
    Widgets,
} from '@mui/icons-material';

import { ActionMessages, SerializedState } from '@/stores';
import { useBlocks } from '@/hooks';

const StyledStack = styled(Stack)(({ theme }) => ({
    // width: '400px',
}));
const StyledBox = styled(Box)(({ theme }) => ({
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledPreviewBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    width: '100%',
}));

const StyledBlocksBox = styled(Box)(({ theme }) => ({
    width: '350px',
}));

interface VariablePreviewProps {
    /**
     * Which variable to preview
     */
    variable: Variable;
}

export const VariablePreview = observer((props: VariablePreviewProps) => {
    const { variable } = props;
    const { state } = useBlocks();

    /**
     * To show Preview of Block
     * @param to what block to render
     * @returns Serialized State
     */
    const getStateWithBlock = (to: string) => {
        const block = state.getBlock(to);

        const s: SerializedState = {
            dependencies: {},
            variables: {},
            queries: {},
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#FAFAFA',
                        },
                    },
                    listeners: {
                        onPageLoad: [],
                    },
                    slots: {
                        content: {
                            name: 'content',
                            children: [to],
                        },
                    },
                },
                [to]: {
                    id: block.id,
                    widget: block.widget,
                    data: block.data,
                    parent: null,
                    listeners: block.listeners,
                    slots: block.slots,
                },
            },
        };

        return s;
    };

    const preview = useMemo(() => {
        if (variable.type === 'block') {
            return (
                <StyledBlocksBox>
                    <BlocksRenderer state={getStateWithBlock(variable.to)} />
                </StyledBlocksBox>
            );
        } else {
            return (
                <Typography variant="body2" fontWeight="bold">
                    {state.getVariable(variable.to, variable.type)}{' '}
                </Typography>
            );
        }
    }, [variable]);

    const previewValue = useMemo(() => {
        return (
            <>
                <Stack direction="row">
                    <Typography variant="body2" fontWeight="bold">
                        Type:{' '}
                    </Typography>
                    <Typography variant="body2">{variable.type}</Typography>
                </Stack>
                <Stack direction="row">
                    <Typography variant="body2" fontWeight="bold">
                        Value:{' '}
                    </Typography>
                    <Typography variant="body2">
                        {variable.type === 'block'
                            ? state.getBlock(variable.to).data?.value
                            : state.getVariable(variable.to, variable.type)}
                    </Typography>
                </Stack>
            </>
        );
    }, [variable]);

    return (
        <StyledStack spacing={0}>
            <StyledBox>
                <Typography variant={'body2'} fontWeight="medium">
                    Preview
                </Typography>
            </StyledBox>
            <Divider />
            <StyledPreviewBox>{preview}</StyledPreviewBox>
            <Divider />
            <StyledBox>
                <Stack direction={'column'}>{previewValue}</Stack>
            </StyledBox>
        </StyledStack>
    );
});
