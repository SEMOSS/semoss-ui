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
import React from 'react';

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
    frame?: {
        /**  */
        cell: any;
        /**  */
        options: Record<string, any>[];
    };
}>;

export const TransformationCellInput: TransformationCellInputComponent = (
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
            <StyledSelect
                size={'small'}
                value={frame ? frame.cell.parameters.targetCell.id : ''}
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
                            path: 'parameters.targetCell',
                            value: {
                                id: target.id,
                                frameVariableName:
                                    target.parameters.frameVariableName,
                            },
                        },
                    });
                }}
            >
                {frame &&
                    frame.options.map((c) => {
                        return (
                            <StyledSelectItem key={c.id} value={c.id}>
                                {c.parameters.frameVariableName}
                            </StyledSelectItem>
                        );
                    })}
            </StyledSelect>
            <StyledTypography variant="body1">{display}</StyledTypography>
            {children}
        </Stack>
    );
};
