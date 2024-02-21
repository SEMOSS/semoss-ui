import { Cell, CellDef } from '@/stores';
import { TransformationCellTitle } from './TransformationCellTitle';
import { TransformationCellInput } from './TransformationCellInput';
import { TransformationCellDetails } from './TransformationCellDetails';
import { TransformationCellOutput } from './TransformationCellOutput';
import {
    Transformation,
    TransformationTargetCell,
    UppercaseTransformationDef,
} from './transformation.types';
import { Transformations } from './transformation.constants';
import { TransformationCellRunActionButton } from './TransformationCellRunActionButton';

export interface TransformationCellDef extends CellDef<'transformation'> {
    widget: 'transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

// export the config for the block
export const TransformationCell: Cell<TransformationCellDef> = {
    widget: 'transformation',
    parameters: {
        transformation: {
            routine: 'uppercase',
            parameters: {
                columns: [],
            },
        } as Transformation<UppercaseTransformationDef>, // set a default routine
        targetCell: {
            id: '',
            frameVariableName: '',
        },
    },
    view: {
        title: TransformationCellTitle,
        input: TransformationCellInput,
        details: TransformationCellDetails,
        output: TransformationCellOutput,
        runActionButton: TransformationCellRunActionButton,
    },
    toPixel: ({ transformation, targetCell }) => {
        if (!targetCell.id) {
            return '';
        }
        return Transformations[transformation.routine].config.toPixel(
            transformation.parameters,
            targetCell,
        );
    },
};
