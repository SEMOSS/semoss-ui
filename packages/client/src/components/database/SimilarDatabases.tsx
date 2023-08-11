import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Stack, styled } from '@semoss/ui';
import { usePixel } from '@/hooks';
import { PlainDatabaseCard } from './GenericDatabaseCards';
import { LoadingScreen } from '@/components/ui';

interface SimilarDatabasesProps {
    id: string;
}

const StyledCardContainer = styled('div')({
    width: '260px',
});

export const SimilarDatabases = (props: SimilarDatabasesProps) => {
    const { id } = props;
    const navigate = useNavigate();

    const { status, data, refresh } = usePixel<
        {
            database_name: string;
            database_id: string;
        }[]
    >(`SimilarCatalog(database=["${id}"])`);

    if (status === 'SUCCESS' && data.length) {
        return (
            <Stack direction={'row'} flexWrap={'nowrap'} overflow={'auto'}>
                {data.map((db, i) => {
                    return (
                        <StyledCardContainer key={i}>
                            <PlainDatabaseCard
                                id={db.database_id}
                                name={db.database_name}
                                onClick={() => {
                                    navigate(`/database/${db.database_id}`);
                                }}
                            />
                        </StyledCardContainer>
                    );
                })}
            </Stack>
        );
    } else if (status === 'LOADING') {
        return (
            <LoadingScreen.Trigger description="Getting Similar Databases" />
        );
    } else {
        return <div>Placeholder</div>;
    }
};
