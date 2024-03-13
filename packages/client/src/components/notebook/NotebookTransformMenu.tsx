import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { DefaultCellTypes } from '../cell-defaults';
import AddIcon from '@mui/icons-material/Add';
import { Typography, styled } from '@semoss/ui';

const StyledList = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '8px 0px',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'stretch',
}));

const StyledTile = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '312px',
    padding: '8px 16px',
    alignItems: 'center',
    gap: '16px',
    borderRadius: '12px',
    border: `1px solid ${theme.palette.secondary.main}`,
    background: theme.palette.background.paper,

    /* Elevation - SEMOSS/2 */
    boxShadow: '0px 1px 5px 0px rgba(0, 0, 0, 0.08)',
}));

const StyledTileContent = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    flex: '1 0 0',
}));

export const NotebookTransformMenu = observer((): JSX.Element => {
    const filteredTransformations = useMemo(() => {
        // Iterate through the data object and filter out the cell types that have 'transformation' key
        return Object.values(DefaultCellTypes).filter(
            (obj) => obj.parameters && obj.parameters.transformation,
        );
    }, [DefaultCellTypes]);

    return (
        <StyledList>
            {filteredTransformations.map((transformation, i) => {
                return (
                    <StyledTile key={i}>
                        <AddIcon />
                        <StyledTileContent>
                            <Typography variant="body2">
                                {transformation.name}
                            </Typography>
                            <Typography variant="caption">
                                Description
                            </Typography>
                        </StyledTileContent>
                    </StyledTile>
                );
            })}
        </StyledList>
    );
});
