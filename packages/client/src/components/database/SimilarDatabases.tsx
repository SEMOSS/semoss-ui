import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Stack, styled } from '@semoss/ui';
import { usePixel } from '@/hooks';
import { PlainEngineCard } from '../engine/GenericEngineCards';
import { LoadingScreen } from '@/components/ui';

interface SimilarDatabasesProps {
    id: string;
}

const StyledCardContainer = styled('div')({
    minWidth: '260px',
    height: '260px',
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
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                }}
            >
                {data.map((db, i) => {
                    return (
                        <StyledCardContainer key={i}>
                            <PlainEngineCard
                                id={db.database_id}
                                name={db.database_name}
                                onClick={() => {
                                    navigate(`/database/${db.database_id}`);
                                }}
                            />
                        </StyledCardContainer>
                    );
                })}
            </div>
        );
    } else if (status === 'LOADING') {
        return (
            <LoadingScreen.Trigger description="Getting Similar Databases" />
        );
    } else {
        return <div>Placeholder</div>;
    }
};
