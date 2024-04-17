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
import { blue, green } from '@mui/material/colors';
import { QueryImportCellDef } from '../../query-import-cell';
import { ActionMessages, CellState } from '@/stores';
import { AccountTree, KeyboardArrowDown } from '@mui/icons-material';
import { useBlocks } from '@/hooks';
import React, { useMemo } from 'react';
import { TransformationCellDef } from './transformation.types';

const primaryLight = THEME.name === 'SEMOSS' ? blue[50] : green[50];
export const TransformationChip = styled(Chip)(({ theme }) => ({
    backgroundColor: primaryLight,
    color: theme.palette.primary.main,
    paddingLeft: theme.spacing(0.5),
}));
export const TransformationChipAvatar = styled(Avatar)(({ theme }) => ({
    color: `${theme.palette.primary.main}!important`,
    backgroundColor: primaryLight,
    borderRadius: '4px',
    svg: {
        fontSize: '1.25rem',
    },
}));
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
    cell: CellState<TransformationCellDef>;
}>;

export const TransformationMultiCellInput: TransformationCellInputComponent = (
    props,
) => {
    const { children, cell, display, Icon, isExpanded } = props;
    const { state } = useBlocks();

    if (!isExpanded) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <div>
                    <TransformationChip
                        size="small"
                        color="primary"
                        label={display}
                        avatar={
                            <TransformationChipAvatar variant="rounded">
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
            <StyledTypography variant="body1">{display}</StyledTypography>
            <Stack direction="row" spacing={1}>
                <StyledSelect
                    size={'small'}
                    value={cell.parameters.frame ? cell.parameters.frame : ''}
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
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.frame',
                                value: e.target.value,
                            },
                        });
                    }}
                >
                    {frames.map((c) => {
                        return (
                            <StyledSelectItem key={`${cell.id}-${c}`} value={c}>
                                {c}
                            </StyledSelectItem>
                        );
                    })}
                </StyledSelect>
                <StyledSelect
                    size={'small'}
                    value={
                        cell.parameters.toFrame ? cell.parameters.toFrame : ''
                    }
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
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.toFrame',
                                value: e.target.value,
                            },
                        });
                    }}
                >
                    {frames.map((c) => {
                        return (
                            <StyledSelectItem
                                key={`${cell.id}-${c}-toFrame`}
                                value={c}
                            >
                                {c}
                            </StyledSelectItem>
                        );
                    })}
                </StyledSelect>
            </Stack>
            {children}
        </Stack>
    );
};
