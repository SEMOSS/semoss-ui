import { Controller } from 'react-hook-form';

import { Select, Typography } from '@semoss/ui';
import { useBlocks } from '@semoss/renderer';

interface CellIdSelectorProps {
    control: any;
    cells: any[];
    queryId: string;
}

export const CellIdSelector = ({
    control,
    cells,
    queryId,
}: CellIdSelectorProps) => {
    const { state } = useBlocks();

    return (
        <Controller
            name="payload.cellId"
            control={control}
            render={({ field }) => (
                <Select
                    label="Cell"
                    value={field.value || ''}
                    onChange={field.onChange}
                >
                    {cells.map((cell: any) => {
                        const variableName = state.getAlias(queryId, cell.id);
                        return (
                            <Select.Item key={cell.id} value={cell.id}>
                                <Typography variant="body2">
                                    {variableName}
                                </Typography>
                            </Select.Item>
                        );
                    })}
                </Select>
            )}
        />
    );
};
