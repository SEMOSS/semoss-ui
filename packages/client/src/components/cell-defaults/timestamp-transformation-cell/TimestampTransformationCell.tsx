import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Checkbox, Stack, TextField, Typography, styled } from '@semoss/ui';
import {
    Transformation,
    TransformationCellInput,
    Transformations,
    TransformationDef,
    TransformationCellDef,
    TransformationTargetCell,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';

const StyledTypography = styled(Typography)(() => ({
    textWrap: 'nowrap',
}));

export interface TimestampTransformationDef
    extends TransformationDef<'timestamp'> {
    key: 'timestamp';
    parameters: {
        columnName: string;
        includeTime: boolean;
    };
}

export interface TimestampTransformationCellDef
    extends TransformationCellDef<'timestamp-transformation'> {
    widget: 'timestamp-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<TimestampTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const TimestampTransformationCell: CellComponent<
    TimestampTransformationCellDef
> = (props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    const cellTransformation: Transformation<TimestampTransformationDef> =
        computed(() => {
            return cell.parameters
                .transformation as Transformation<TimestampTransformationDef>;
        }).get();

    const doesFrameExist: boolean = computed(() => {
        return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
    }).get();

    const helpText = cell.parameters.targetCell.id
        ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
        : 'A Python or R target frame variable must be defined in order to apply a transformation.';

    if (!doesFrameExist && !cellTransformation.parameters.columnName) {
        return (
            <TransformationCellInput
                isExpanded={isExpanded}
                display={Transformations[cellTransformation.key].display}
                Icon={Transformations[cellTransformation.key].icon}
            >
                <Stack width="100%" paddingY={0.75}>
                    <Typography variant="caption">
                        <em>{helpText}</em>
                    </Typography>
                </Stack>
            </TransformationCellInput>
        );
    }

    return (
        <TransformationCellInput
            isExpanded={isExpanded}
            display={Transformations[cellTransformation.key].display}
            Icon={Transformations[cellTransformation.key].icon}
        >
            <Stack spacing={2}>
                <Typography variant="caption">
                    {!doesFrameExist ? (
                        <em>{helpText}</em>
                    ) : (
                        "Add a new column with today's date as the column value"
                    )}
                </Typography>
                <Stack direction="row" spacing={2} width="100%">
                    <TextField
                        size="small"
                        label="Column Name"
                        value={cellTransformation.parameters.columnName}
                        fullWidth
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.columnName',
                                    value: e.target.value,
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
                        value={cellTransformation.parameters.includeTime}
                        onChange={() => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.includeTime',
                                    value: !cellTransformation.parameters
                                        .includeTime,
                                },
                            });
                        }}
                    />
                </Stack>
            </Stack>
        </TransformationCellInput>
    );
};

TimestampTransformationCell.config = {
    name: 'Timestamp',
    widget: 'timestamp-transformation',
    parameters: {
        transformation: {
            key: 'timestamp',
            parameters: {
                columnName: '',
                includeTime: false,
            },
        },
        targetCell: {
            id: '',
            frameVariableName: '',
        },
    },
    toPixel: ({ transformation, targetCell }) => {
        return `${targetCell.frameVariableName} | TimestampData(newCol=["${transformation.parameters.columnName}"],time=["${transformation.parameters.includeTime}"]);`;
    },
};
