import { computed } from 'mobx';
import { ActionMessages, CellComponent, CellState } from '@/stores';
import { UppercaseTransformationCellDef } from './config';
import { useBlocks } from '@/hooks';
import { IconButton } from '@semoss/ui';
import { PlayCircle } from '@mui/icons-material';
import { QueryImportCellDef } from '../query-import-cell';

export const UppercaseTransformationCellRunActionButton: CellComponent<
    UppercaseTransformationCellDef
> = (props) => {
    const { cell } = props;
    const { state } = useBlocks();

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    return (
        <IconButton
            title="Run cell"
            disabled={
                cell.isLoading ||
                (targetCell && (!targetCell.isExecuted || !targetCell.output))
            }
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
