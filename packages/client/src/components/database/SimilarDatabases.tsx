import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Stack, styled } from '@semoss/ui';
import { usePixel } from '@/hooks';
import { PlainDatabaseCard } from './GenericDatabaseCards';

interface SimilarDatabasesProps {
    id: string;
}

const StyledCardContainer = styled('div')({
    width: '260px',
});

export const SimilarDatabases = (props: SimilarDatabasesProps) => {
    const { id } = props;
    const navigate = useNavigate();

    const { status, data, refresh } = usePixel<{
        database_name: string;
        database_id: string;
    }>(`SimilarCatalog(database=["${id}"])`);

    if (status === 'SUCCESS' && data.length) {
        return (
            <Stack direction={'row'} flexWrap={'nowrap'} overflow={'auto'}>
                {data.map((db, i) => {
                    return (
                        <StyledCardContainer key={i}>
                            <PlainDatabaseCard
                                name={db.database_name}
                                onClick={() => {
                                    console.log('navigating');
                                    navigate(`/database/${db.database_id}`);
                                }}
                            />
                        </StyledCardContainer>
                    );
                })}
            </Stack>
        );
    } else if (status === 'LOADING') {
        return <div>Loading</div>;
    } else {
        return <div>Placeholder</div>;
    }
};
