import { Cell, CellComponent } from '@/stores';
import {
    TransformationDef,
    TransformationMultiCellDef,
    TransformationMultiCellTitle,
    TransformationCellDef,
    TransformationCellOutput,
    Transformation,
    TransformationTargetCell,
    TransformationMultiCellRunActionButton,
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
    extends TransformationMultiCellDef<'join-transformation'> {
    widget: 'join-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<JoinTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        fromTargetCell: TransformationTargetCell;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        toTargetCell: TransformationTargetCell;
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
        fromTargetCell: {
            id: '',
            frameVariableName: '',
        },
        toTargetCell: {
            id: '',
            frameVariableName: '',
        },
    },
    view: {
        title: TransformationMultiCellTitle as CellComponent<JoinTransformationCellDef>,
        input: JoinTransformationCellInput,
        output: null,
        runActionButton:
            TransformationMultiCellRunActionButton as CellComponent<JoinTransformationCellDef>,
    },
    toPixel: ({ transformation, fromTargetCell, toTargetCell }) => {
        return `Frame(${fromTargetCell.frameVariableName}) | QueryAll()|Distinct(true) | Merge(joins=[(${transformation.parameters.fromNameColumn?.name}, ${transformation.parameters.joinType.code}, ${transformation.parameters.toNameColumn?.name}, ${transformation.parameters.compareOperation})], frame=[${toTargetCell.frameVariableName}]);`;
    },
};
