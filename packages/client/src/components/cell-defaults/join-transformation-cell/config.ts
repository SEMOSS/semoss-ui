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
            frame: '',
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
            toFrame: '',
        },
        toPixel: ({
            frame,
            fromNameColumn,
            toNameColumn,
            joinType,
            compareOperation,
            toFrame,
        }) => {
            return `Frame(${frame}) | QueryAll()|Distinct(true) | Merge(joins=[(${fromNameColumn?.name}, ${joinType.code}, ${toNameColumn?.name}, ${compareOperation})], frame=[${toFrame}]);`;
        },
    };
