import React, { useState, useEffect } from 'react';
import { Button, Table, styled, Typography } from '@semoss/ui';
import { useEngine } from '@/hooks';
import { FileTable } from '@/components/settings';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTopDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
}));

export const EngineFilePage = () => {
    //Grabbing Engine Id for document creation
    const { id } = useEngine();

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>File Explorer</Typography>
            </StyledTopDiv>

            <StyledTableContainer>
                <FileTable id={id} />
            </StyledTableContainer>
        </StyledContainer>
    );
};
