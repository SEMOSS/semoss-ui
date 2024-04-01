import { computed } from 'mobx';
import { ActionMessages, CellComponent, CellState } from '@/stores';
import { useBlocks } from '@/hooks';
import { IconButton } from '@semoss/ui';
import { PlayCircle } from '@mui/icons-material';
import { QueryImportCell, QueryImportCellDef } from '../../query-import-cell';
import { TransformationMultiCellDef } from './transformation.types';

export const TransformationMultiCellRunActionButton: CellComponent<
    TransformationMultiCellDef
> = (props) => {
    const { cell } = props;
    const { state } = useBlocks();

    const targetCells: Array<CellState<QueryImportCellDef>> = computed(() => {
        const cells: Array<CellState<QueryImportCellDef>> = [];
        if (cell.query.cells[cell.parameters.fromTargetCell.id]) {
            cells.push(
                cell.query.cells[
                    cell.parameters.fromTargetCell.id
                ] as CellState<QueryImportCellDef>,
            );
        }

        if (cell.query.cells[cell.parameters.toTargetCell.id]) {
            cells.push(
                cell.query.cells[
                    cell.parameters.toTargetCell.id
                ] as CellState<QueryImportCellDef>,
            );
        }

        return cells;
    }).get();

    const doFramesExist: boolean = computed(() => {
        let exists = false;

        for (const cell of targetCells) {
            if (cell && (cell.isExecuted || cell.output)) {
                exists = true;
                break;
            }
        }
        return exists;
    }).get();

    const checkFieldsValid = (object: object): void | boolean => {
        for (const value of Object.values(object)) {
            console.log(object);
            if (!Array.isArray(value) && typeof value == 'object') {
                return checkFieldsValid(value);
            } else if (!value || (Array.isArray(value) && !value.length)) {
                return false;
            }
        }
    };

    const hasRequiredFields: boolean = computed(() => {
        return (
            checkFieldsValid(cell.parameters.transformation.parameters) !==
            false
        );
    }).get();

    return (
        <IconButton
            title="Run cell"
            disabled={cell.isLoading || !doFramesExist || !hasRequiredFields}
            size="small"
            onClick={() =>
                state.dispatch({
                    message: ActionMessages.RUN_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                    },
                })
            }
        >
            <PlayCircle fontSize="small" />
        </IconButton>
    );
};
