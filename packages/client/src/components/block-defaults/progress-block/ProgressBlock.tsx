import { observer } from 'mobx-react-lite';

import {
    Box,
    CircularProgress,
    LinearProgress,
    Typography,
    styled,
} from '@mui/material';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

const StyledCircularBox = styled(Box)(() => ({
    position: 'relative',
    display: 'inline-flex',
}));

const StyledLinearBox = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledCircularProgressBox = styled(Box)(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledLinearProgressBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'includeLabel',
})<{ includeLabel: boolean }>(({ theme, includeLabel }) => ({
    width: '100%',
    marginRight: theme.spacing(includeLabel ? 1 : 0),
}));

const StyledLabelBox = styled(Box)(({ theme }) => ({
    minWidth: theme.spacing(4.5),
}));

export interface ProgressBlockDef extends BlockDef<'progress'> {
    widget: 'progress';
    data: {
        type: 'linear' | 'circular';
        value: number;
        includeLabel: boolean;
        size: string;
    };
    slots: never;
}

export const ProgressBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<ProgressBlockDef>(id);

    if (data.type === 'circular') {
        return (
            <StyledCircularBox {...attrs}>
                <CircularProgress
                    variant="determinate"
                    value={data.value ?? 0}
                    size={data.size ?? null}
                />
                {data.includeLabel && (
                    <StyledCircularProgressBox>
                        <Typography
                            variant="caption"
                            component="div"
                            color="text.secondary"
                        >
                            {`${Math.round(data.value)}%`}
                        </Typography>
                    </StyledCircularProgressBox>
                )}
            </StyledCircularBox>
        );
    } else {
        return (
            <StyledLinearBox sx={{ width: data.size }} {...attrs}>
                <StyledLinearProgressBox includeLabel={data.includeLabel}>
                    <LinearProgress
                        variant="determinate"
                        value={data.value ?? 0}
                    />
                </StyledLinearProgressBox>
                {data.includeLabel && (
                    <StyledLabelBox sx={{ minWidth: 35 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >{`${Math.round(data.value)}%`}</Typography>
                    </StyledLabelBox>
                )}
            </StyledLinearBox>
        );
    }
});
