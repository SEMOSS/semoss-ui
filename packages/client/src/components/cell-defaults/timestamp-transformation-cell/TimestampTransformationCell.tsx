import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { Checkbox, Stack, TextField, Typography, styled } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { CellComponent, ActionMessages } from '@/stores';

import {
    Transformations,
    TransformationCellInput2,
    ColumnInfoTwo,
} from '../shared';
const StyledTypography = styled(Typography)(() => ({
    textWrap: 'nowrap',
}));

export interface TimestampTransformationCellDef {
    widget: 'timestamp-transformation';
    parameters: {
        frame: string;
        newCol: ColumnInfoTwo;
        time: {
            type: 'CONST_STRING';
            value: string | boolean;
        };
    };
}

export const TimestampTransformationCell: CellComponent<TimestampTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const cellTransformation = computed(() => {
            return cell.widget;
        }).get();

        return (
            <TransformationCellInput2
                isExpanded={isExpanded}
                display={Transformations[cellTransformation].display}
                Icon={Transformations[cellTransformation].icon}
                cell={cell}
            >
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} width="100%">
                        <TextField
                            size="small"
                            label="Column Name"
                            value={cell.parameters.newCol?.value ?? ''}
                            fullWidth
                            onChange={(e) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.newCol',
                                        value: {
                                            type: 'CONST_STRING',
                                            value: e.target.value,
                                        },
                                    },
                                });
                            }}
                        />
                        <Checkbox
                            disableTypography
                            label={
                                <StyledTypography variant="body1">
                                    Include time
                                </StyledTypography>
                            }
                            checked={Boolean(cell.parameters.time?.value)}
                            onChange={() => {
                                const isChecked = Boolean(
                                    cell.parameters.time?.value,
                                );
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.time.value',
                                        value: !isChecked,
                                    },
                                });
                            }}
                        />
                    </Stack>
                </Stack>
            </TransformationCellInput2>
        );
    });
