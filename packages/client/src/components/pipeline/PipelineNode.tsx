import { NodeProps, Handle, Position } from 'react-flow-renderer';
import {
    styled,
    Card,
    Icon,
    IconButton,
    MoreVert,
    Stack,
    Typography,
    CloudOutlined,
} from '@semoss/ui';

import { PipelineNodeData } from './pipeline.types';

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

const StyledParameter = styled(Stack)(() => ({
    position: 'relative',
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

type PipelineNodeNodeProps = NodeProps<PipelineNodeData>;

export const PipelineNode = (props: PipelineNodeNodeProps) => {
    const { id, data } = props;

    return (
        <StyledNode>
            <Card.Header
                title={
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <StyledHeaderIcon>
                            <CloudOutlined />
                        </StyledHeaderIcon>
                        <StyledHeaderTitle variant="body1">
                            {data.widget}
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
                            <Typography variant={'body2'}>{i}</Typography>
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
                            <Typography variant={'body2'}>{o}</Typography>
                        </StyledParameter>
                    );
                })}
            </Card.Content>
        </StyledNode>
    );
};
