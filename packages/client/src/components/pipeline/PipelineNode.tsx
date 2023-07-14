import { observer } from 'mobx-react-lite';
import { NodeProps, Handle, Position } from 'react-flow-renderer';
import {
    styled,
    Box,
    Card,
    Icon,
    IconButton,
    Stack,
    Typography,
} from '@semoss/ui';
import { CloudOutlined, MoreVert } from '@mui/icons-material';

import { usePipeline } from '@/hooks';
import { NodeData } from './pipeline.types';

const StyledNode = styled(Card)(() => ({
    width: '344px',
    overflow: 'visible',
}));

const StyledHeaderIcon = styled(Icon)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.palette.divider,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: theme.shape.borderRadius,
    height: 'auto',
    width: 'auto',
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
}));

const StyledHeaderTitle = styled(Typography)(() => ({
    flexGrow: 1,
}));

const StyledParameter = styled(Stack)(({ theme }) => ({
    position: 'relative',
    marginBottom: theme.spacing(1),
    '&:last-child': {
        marginBottom: 0,
    },
}));

const StyledParameterText = styled(Box)(({ theme }) => ({
    height: theme.spacing(5),
    width: '100%',
    padding: '8.5px 14px',
    // borderColor: theme.palette.outline, // TODO: create a theme variable
    borderColor: 'rgba(0, 0, 0, 0.23)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: theme.shape.borderRadius,
    textOverflow: 'ellipsis',
}));

const StyledParameterHandle = styled(Handle)(({ type, theme }) => ({
    height: '10px',
    width: '10px',
    left: type === 'target' ? '-5px' : undefined,
    right: type === 'source' ? '-5px' : undefined,
    marginLeft: type === 'target' ? theme.spacing(-2) : undefined,
    marginRight: type === 'source' ? theme.spacing(-2) : undefined,
    borderWidth: '2px',
    backgroundColor: theme.palette.common.white,
    borderColor: theme.palette.action.active,
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

type PipelineNodeProps = NodeProps<NodeData>;

export const PipelineNode = observer((props: PipelineNodeProps) => {
    const { id, data } = props;

    const { pipeline } = usePipeline();

    return (
        <StyledNode onClick={() => pipeline.openOverlay(id)}>
            <Card.Header
                title={
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <StyledHeaderIcon>
                            <CloudOutlined />
                        </StyledHeaderIcon>
                        <StyledHeaderTitle variant="body1">
                            {data.name}
                        </StyledHeaderTitle>
                        <IconButton>
                            <MoreVert />
                        </IconButton>
                    </Stack>
                }
            />
            <Card.Content>
                {data.input.map((i) => {
                    return (
                        <StyledParameter
                            key={`${id}--${i}`}
                            direction={'row'}
                            spacing={1}
                            alignItems={'center'}
                        >
                            <StyledParameterHandle
                                type="target"
                                id={i}
                                position={Position.Left}
                            />
                            <StyledParameterText>
                                <Typography variant={'body2'}>{i}</Typography>
                            </StyledParameterText>
                        </StyledParameter>
                    );
                })}
                {data.output.map((o) => {
                    return (
                        <StyledParameter
                            key={`${id}--${o}`}
                            direction={'row'}
                            spacing={1}
                            alignItems={'center'}
                        >
                            <StyledParameterHandle
                                type="source"
                                id={o}
                                position={Position.Right}
                            />
                            <StyledParameterText>
                                <Typography variant={'body2'}>{o}</Typography>
                            </StyledParameterText>
                        </StyledParameter>
                    );
                })}
            </Card.Content>
        </StyledNode>
    );
});
