import { StyledSelect, StyledSelectItem } from '../components';
import {
    Avatar,
    Chip,
    InputAdornment,
    Stack,
    Typography,
    styled,
} from '@semoss/ui';
import { THEME } from '@/constants';
import { ActionMessages } from '@/stores';
import { AccountTree, KeyboardArrowDown } from '@mui/icons-material';
import { useBlocks } from '@/hooks';
import React from 'react';

export const TransformationChip = styled(Chip)(({ theme }) => ({
    paddingLeft: theme.spacing(0.5),
}));

export const TransformationChipAvatar = styled(Avatar, {
    shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>(({ theme, color }) => {
    const palette = theme.palette as unknown as {
        green: Record<string, string>;
    };
    return {
        borderRadius: '4px',
        svg: {
            fontSize: '1.25rem',
        },
        ...(color === 'primary' && {
            backgroundColor: theme.palette.primary.main,
        }),
        ...(color === 'green' && {
            backgroundColor: palette.green['700'],
        }),
    };
});

export const StyledTypography = styled(Typography)(({ theme }) => ({
    lineHeight: '24px',
    fontWeight: theme.typography.fontWeightBold,
}));

type TransformationCellInputComponent = React.FunctionComponent<{
    /** Whether the content is expanded */
    isExpanded?: boolean;
    /** User facing name to display */
    display: string;
    /** Icon to display */
    Icon: React.FunctionComponent;
    /** Main content slot */
    children: React.ReactNode;
    /** Update frame Selection */
    frame?: {
        /**  */
        cell: any;
        /**  */
        options: Record<string, any>[];
    };
}>;

export const TransformationMultiCellInput: TransformationCellInputComponent = (
    props,
) => {
    const { children, frame, display, Icon, isExpanded } = props;
    const { state } = useBlocks();

    if (!isExpanded) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <div>
                    <TransformationChip
                        size="small"
                        color={THEME.name === 'SEMOSS' ? 'primary' : 'green'}
                        label={display}
                        avatar={
                            <TransformationChipAvatar
                                color={
                                    THEME.name === 'SEMOSS'
                                        ? 'primary'
                                        : 'green'
                                }
                                variant="rounded"
                            >
                                <Icon />
                            </TransformationChipAvatar>
                        }
                    />
                </div>
            </Stack>
        );
    }

    return (
        <Stack width="100%" paddingY={0.5}>
            <Stack direction="row" spacing={1}>
                <StyledSelect
                    size={'small'}
                    value={frame.cell.parameters.fromTargetCell.id}
                    SelectProps={{
                        IconComponent: KeyboardArrowDown,
                        style: {
                            height: '30px',
                            width: '200px',
                        },
                        startAdornment: (
                            <InputAdornment position="start">
                                <AccountTree />
                            </InputAdornment>
                        ),
                    }}
                    onChange={(e) => {
                        const target = frame.options.find((f) => {
                            if (f.id === e.target.value) {
                                return f;
                            }
                        });

                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: frame.cell.query.id,
                                cellId: frame.cell.id,
                                path: 'parameters.fromTargetCell',
                                value: {
                                    id: target.id,
                                    frameVariableName:
                                        target.parameters.frameVariableName,
                                },
                            },
                        });
                    }}
                >
                    {frame.options.map((c) => {
                        return (
                            <StyledSelectItem key={c.id} value={c.id}>
                                {c.parameters.frameVariableName}
                            </StyledSelectItem>
                        );
                    })}
                </StyledSelect>
                <StyledSelect
                    size={'small'}
                    value={frame.cell.parameters.toTargetCell.id}
                    SelectProps={{
                        IconComponent: KeyboardArrowDown,
                        style: {
                            height: '30px',
                            width: '200px',
                        },
                        startAdornment: (
                            <InputAdornment position="start">
                                <AccountTree />
                            </InputAdornment>
                        ),
                    }}
                    onChange={(e) => {
                        const target = frame.options.find((f) => {
                            if (f.id === e.target.value) {
                                return f;
                            }
                        });

                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: frame.cell.query.id,
                                cellId: frame.cell.id,
                                path: 'parameters.toTargetCell',
                                value: {
                                    id: target.id,
                                    frameVariableName:
                                        target.parameters.frameVariableName,
                                },
                            },
                        });
                    }}
                >
                    {frame.options.map((c) => {
                        return (
                            <StyledSelectItem key={c.id} value={c.id}>
                                {c.parameters.frameVariableName}
                            </StyledSelectItem>
                        );
                    })}
                </StyledSelect>
            </Stack>
            <StyledTypography variant="body1">{display}</StyledTypography>
            {children}
        </Stack>
    );
};
