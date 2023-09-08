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
    width: '360px',
    height: '200px',
    borderRadius: theme.shape.borderRadius,
    zIndex: 100,
}));

const StyledBox = styled(Box)({
    width: '100%',
    display: 'flex',
    gap: '24px',
    overflowX: 'auto',
});

export const SimilarDatabases = (props: SimilarDatabasesProps) => {
    const { id } = props;
    const navigate = useNavigate();

    const { status, data } = usePixel<
        {
            database_name: string;
            database_id: string;
        }[]
    >(`SimilarCatalog(database=["${id}"])`);

    if (status === 'SUCCESS' && data.length && typeof data !== 'string') {
        return (
            <StyledBox>
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
                        height={200}
                    />
                ))}
            </StyledBox>
        );
    } else {
        return <div>None similar databases found...</div>;
    }
};
