import { observer } from 'mobx-react-lite';
import { EChartVisualizationBlockDef } from './EChartVisualizationBlock';
import { useBlock, useFrame } from '@/hooks';
import { Menu, MenuItem } from '@semoss/ui';

export interface EChartContextMenuProps {
    id: string;
    frame: ReturnType<typeof useFrame>;
    contextMenu: {
        mouseX: number;
        mouseY: number;
        column: {
            name: string;
            selector: string;
            width: string;
        };
        value: unknown;
    } | null;
    onClose: () => void;
}

export const EChartContextMenu: React.FC<EChartContextMenuProps> = observer(
    ({ id = '', frame = '', contextMenu = null, onClose = () => null }) => {
        const { data } = useBlock<EChartVisualizationBlockDef>(id);
        return (
            <Menu open={contextMenu !== null}>
                <MenuItem value="unfilter">UnFilter</MenuItem>
                <MenuItem value="filter">Filter</MenuItem>
            </Menu>
        );
    },
);
