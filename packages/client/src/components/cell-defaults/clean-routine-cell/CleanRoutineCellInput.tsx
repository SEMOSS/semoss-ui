import { computed } from 'mobx';
import { CellComponent, CellState } from '@/stores';
import { CleanRoutineCellDef } from './config';
import { UppercaseCleanRoutineCellInput } from './routine-cell-inputs';
import { Avatar, Chip, Stack, Typography, styled } from '@semoss/ui';
import { QueryImportCellDef } from '../query-import-cell';
import { CleanRoutines } from './clean.constants';
import { THEME } from '@/constants';
import { blue, green } from '@mui/material/colors';

const primaryLight = THEME.name === 'SEMOSS' ? blue[50] : green[50];
export const CleanRoutineChip = styled(Chip)(({ theme }) => ({
    backgroundColor: primaryLight,
    color: theme.palette.primary.main,
    paddingLeft: theme.spacing(0.5),
}));
export const CleanRoutineChipAvatar = styled(Avatar)(({ theme }) => ({
    color: `${theme.palette.primary.main}!important`,
    backgroundColor: primaryLight,
    borderRadius: '4px',
    svg: {
        fontSize: '1.25rem',
    },
}));

export const CleanRoutineCellInput: CellComponent<CleanRoutineCellDef> = (
    props,
) => {
    const { cell, isExpanded } = props;

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    if (targetCell && (!targetCell.isExecuted || !targetCell.output)) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <Typography variant="caption">
                    <em>
                        Run Cell {cell.parameters.targetCell.id} to define the
                        target frame variable before applying a clean routine.
                    </em>
                </Typography>
            </Stack>
        );
    }

    const CleanRoutineIcon: React.FunctionComponent =
        CleanRoutines[cell.parameters.cleanRoutine.routine].icon;

    if (!isExpanded) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <div>
                    <CleanRoutineChip
                        size="small"
                        color="primary"
                        label={
                            CleanRoutines[cell.parameters.cleanRoutine.routine]
                                .display
                        }
                        avatar={
                            <CleanRoutineChipAvatar variant="rounded">
                                <CleanRoutineIcon />
                            </CleanRoutineChipAvatar>
                        }
                    />
                </div>
            </Stack>
        );
    }

    switch (cell.parameters.cleanRoutine.routine) {
        case 'uppercase':
            return <UppercaseCleanRoutineCellInput {...props} />;
        default:
            return <></>;
    }
};
