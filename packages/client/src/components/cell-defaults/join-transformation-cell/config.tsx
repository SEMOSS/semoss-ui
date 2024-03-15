import { Cell, CellComponent } from '@/stores';
import {
    TransformationDef,
    TransformationCellTitle,
    TransformationCellDef,
    TransformationCellOutput,
    Transformation,
    TransformationTargetCell,
    TransformationCellRunActionButton,
    ColumnInfo,
    comparator,
    joinType,
} from '../shared';
import { JoinTransformationCellInput } from './JoinTransformationCellInput';

export interface JoinTransformationDef extends TransformationDef<'join'> {
    key: 'join';
    parameters: {
        fromNameColumn: ColumnInfo;
        toNameColumn: ColumnInfo;
        joinType: joinType;
        compareOperation: comparator;
    };
}

export interface JoinTransformationCellDef
    extends TransformationCellDef<'join-transformation'> {
    widget: 'join-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<JoinTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

// export the config for the block
export const JoinTransformationCell: Cell<JoinTransformationCellDef> = {
    widget: 'join-transformation',
    parameters: {
        transformation: {
            key: 'join',
            parameters: {
                fromNameColumn: {
                    name: '',
                    dataType: '',
                },
                toNameColumn: {
                    name: '',
                    dataType: '',
                },
                joinType: {
                    name: '',
                    code: '',
                },
                compareOperation: '==',
            },
        },
        targetCell: {
            id: '',
            frameVariableName: '',
        },
    },
    view: {
        title: TransformationCellTitle as CellComponent<JoinTransformationCellDef>,
        input: JoinTransformationCellInput,
        output: TransformationCellOutput as CellComponent<JoinTransformationCellDef>,
        runActionButton:
            TransformationCellRunActionButton as CellComponent<JoinTransformationCellDef>,
    },
    toPixel: ({ transformation, targetCell }) => {
        return `Frame(${targetCell.frameVariableName}) | QueryAll()|Distinct(true) | Merge(joins=[(${transformation.parameters.fromNameColumn?.name}, ${transformation.parameters.joinType.code}, ${transformation.parameters.toNameColumn?.name}, ${transformation.parameters.compareOperation})], frame=[${targetCell.frameVariableName}]);`;
    },
};
