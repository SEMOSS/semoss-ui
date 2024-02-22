import { computed } from 'mobx';
import { ActionMessages, CellComponent, CellState } from '@/stores';
import { useBlocks } from '@/hooks';
import { IconButton } from '@semoss/ui';
import { PlayCircle } from '@mui/icons-material';
import { QueryImportCellDef } from '../../query-import-cell';
import { TransformationCellDef } from './transformation.types';

export const TransformationCellRunActionButton: CellComponent<
    TransformationCellDef
> = (props) => {
    const { cell } = props;
    const { state } = useBlocks();

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    const doesFrameExist: boolean = computed(() => {
        return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
    }).get();

    const checkFieldsValid = (object: object): void | boolean => {
        for (const value of Object.values(object)) {
            if (!Array.isArray(value) && typeof value == 'object') {
                console.log('in first');
                return checkFieldsValid(value);
            } else if (!value || (Array.isArray(value) && !value.length)) {
                console.log('returning false');
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
            disabled={cell.isLoading || !doesFrameExist || !hasRequiredFields}
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
