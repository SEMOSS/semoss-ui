import { useNavigate } from 'react-router-dom';

import { styled, Skeleton, Box } from '@semoss/ui';
import { usePixel } from '@/hooks';
import { PlainEngineCard } from '../engine/GenericEngineCards';

interface SimilarDatabasesProps {
    id: string;
}

const StyledCardContainer = styled('div')({
    minWidth: '360px',
    height: '200px',
});

const StyledSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
}));

const StyledBox = styled(Box)({
    width: '100%',
    display: 'flex',
    gap: '24px',
    overflowX: 'auto',
    height: '340px',
});

export const SimilarDatabases = (props: SimilarDatabasesProps) => {
    const { id } = props;
    const navigate = useNavigate();

    const { status, data } = usePixel<
        {
            /** Name of the Database */
            name: string;
            /** ID of Database */
            database_id: string;
            /** Owner of the Database */
            database_created_by: string;
            /** Description of the Database */
            description: string;
            /** Tag of the Database */
            tag: string[] | string;
        }[]
    >(`SimilarCatalog(database=["${id}"])`);

    if (status === 'SUCCESS' && data.length && typeof data !== 'string') {
        return (
            <StyledBox>
                {data.map((db, i) => {
                    return (
                        <StyledCardContainer key={i}>
                            <PlainEngineCard
                                name={db.name}
                                id={db.database_id}
                                tag={db.tag}
                                owner={db.database_created_by}
                                description={db.description}
                                onClick={() => {
                                    navigate(`/database/${db.database_id}`);
                                }}
                            />
                        </StyledCardContainer>
                    );
                })}
            </StyledBox>
        );
    } else if (status === 'LOADING') {
        return (
            <StyledBox>
                {[...Array(4)].map((_, idx) => (
                    <StyledSkeleton
                        key={idx}
                        variant="rounded"
                        width={360}
                        height={320}
                    />
                ))}
            </StyledBox>
        );
    } else {
        return <div>No similar databases found...</div>;
    }
};
