import React, { useMemo } from 'react';
import { StyledSelect, StyledSelectItem } from '../components';
import {
    Avatar,
    Chip,
    InputAdornment,
    Stack,
    Select,
    Typography,
    styled,
} from '@semoss/ui';
import { THEME } from '@/constants';
import { blue, green } from '@mui/material/colors';
import { QueryImportCellDef } from '../../query-import-cell';
import { ActionMessages, CellState, CellConfig, CellDef } from '@/stores';
import { AccountTree, KeyboardArrowDown } from '@mui/icons-material';
import { useBlocks } from '@/hooks';
import { TransformationCellDef } from './transformation.types';
import { observer } from 'mobx-react-lite';

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
    Icon?: React.FunctionComponent;
    /** Main content slot */
    children: React.ReactNode;
    /** Used to set config info, see what querys have frames, and etc */
    cell: CellState<TransformationCellDef>;
}>;

export const TransformationCellInput2: TransformationCellInputComponent =
    observer((props) => {
        const { children, display, Icon, isExpanded, cell } = props;
        const { state } = useBlocks();

        const frames: string[] = useMemo(() => {
            const frameList = [];
            Object.values(cell.query.cells).forEach((cell) => {
                if (cell.widget === 'query-import') {
                    frameList.push(cell.parameters.frameVariableName);
                }
            });

            return frameList;
        }, [Object.keys(cell.query.cells).length]);

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
                    SelectProps={{
                        style: {
                            height: '30px',
                            width: '200px',
                        },
                    }}
                    value={cell.parameters.frame ? cell.parameters.frame : ''}
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
                <StyledTypography variant="body1">{display}</StyledTypography>
                {children}
            </Stack>
        );
    });
