import { useEffect, useState } from 'react';
import { useBlocks, usePixel } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, CellState } from '@/stores';
import { CleanRoutineCellDef } from './config';
import { UppercaseCleanRoutineCellInput } from './routine-cell-inputs';
import { Stack, Typography } from '@semoss/ui';

export const CleanRoutineCellInput: CellComponent<CleanRoutineCellDef> = (
    props,
) => {
    const { cell } = props;

    const targetCell: CellState = computed(() => {
        return cell.query.cells[cell.parameters.targetCell.id];
    }).get();

    if (targetCell && (!targetCell.isExecuted || !targetCell.output)) {
        return (
            <Stack width="100%" paddingY={0.5}>
                <Typography variant="caption">
                    Run Cell {cell.parameters.targetCell.id} to define the
                    target frame variable before applying a clean routine.
                </Typography>
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
