import { Box, Skeleton, Card } from '@semoss/ui';

const SkeletonCard = () => {
    return (
        <Card
            sx={{
                width: 290,
                height: 387,
                borderRadius: 3,
                boxShadow: 3,
                overflow: 'hidden',
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={135}
                    animation="wave"
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        width: 100,
                        height: 140,
                        overflow: 'hidden',
                    }}
                ></Box>
            </Box>
            <Card.Content sx={{ py: 1.5 }}>
                <Skeleton
                    height={30}
                    width="100%"
                    animation="wave"
                    variant="rectangular"
                    sx={{ borderRadius: '6px' }}
                />
                <Skeleton
                    height={20}
                    width="100%"
                    animation="wave"
                    variant="rectangular"
                    sx={{ borderRadius: '6px' }}
                />
                <Skeleton
                    height={15}
                    width="50%"
                    animation="wave"
                    variant="rectangular"
                    sx={{ borderRadius: '6px' }}
                />
            </Card.Content>
            <Card.Actions
                sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        animation="wave"
                    />
                    <Skeleton
                        variant="rectangular"
                        width={90}
                        height={15}
                        animation="wave"
                        sx={{ borderRadius: '6px' }}
                    />
                </Box>
                <Skeleton
                    variant="rectangular"
                    width={110}
                    height={30}
                    animation="wave"
                    sx={{ borderRadius: '6px' }}
                />
            </Card.Actions>
        </Card>
    );
};

export default SkeletonCard;
