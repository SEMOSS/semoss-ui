import { CellConfig } from '@/stores';
import {
    JoinTransformationCellDef,
    JoinTransformationCell,
} from './JoinTransformationCell';

// export the config for the block
export const JoinTransformationCellConfig: CellConfig<JoinTransformationCellDef> =
    {
        name: 'Join',
        widget: 'join-transformation',
        view: JoinTransformationCell,
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
        toPixel: ({ transformation, fromTargetCell, toTargetCell }) => {
            return `Frame(${fromTargetCell.frameVariableName}) | QueryAll()|Distinct(true) | Merge(joins=[(${transformation.parameters.fromNameColumn?.name}, ${transformation.parameters.joinType.code}, ${transformation.parameters.toNameColumn?.name}, ${transformation.parameters.compareOperation})], frame=[${toTargetCell.frameVariableName}]);`;
        },
    };
