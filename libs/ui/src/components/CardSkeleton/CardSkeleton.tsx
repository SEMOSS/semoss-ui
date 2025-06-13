import { styled } from "@mui/material";

import { Card } from "../Card";
import { Skeleton } from "../Skeleton";

const StyledCard = styled(Card)(({ theme }) => ({
    width: 290,
    height: 387,
    borderRadius: 3,
    boxShadow: "3",
    overflow: "hidden",
}));

const StyledDiv = styled("div")(({ theme }) => ({
    position: "relative",
}));

const StyledSpacer = styled("div")(({ theme }) => ({
    position: "absolute",
    top: 16,
    width: 100,
    height: 140,
    overflow: "hidden",
}));

const StyledCardActions = styled(Card.Actions)(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    padding: `${theme.spacing(2) + 2}px`,
}));

const StyledActionsDiv = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
}));

const StyledSkeleton = styled(Skeleton)(({ theme }) => ({
    borderRadius: "6px",
}));

export const CardSkeleton = () => {
    return (
        <StyledCard>
            <StyledDiv>
                <Skeleton
                    height={135}
                    width="100%"
                    animation="wave"
                    variant="rectangular"
                />
                <StyledSpacer />
            </StyledDiv>
            <Card.Content sx={{ py: 1.5 }}>
                <StyledSkeleton
                    height={30}
                    width="100%"
                    animation="wave"
                    variant="rectangular"
                />
                <StyledSkeleton
                    height={20}
                    width="100%"
                    animation="wave"
                    variant="rectangular"
                />
                <StyledSkeleton
                    height={15}
                    width="50%"
                    animation="wave"
                    variant="rectangular"
                />
            </Card.Content>
            <StyledCardActions>
                <StyledActionsDiv>
                    <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        animation="wave"
                    />
                    <StyledSkeleton
                        variant="rectangular"
                        width={90}
                        height={15}
                        animation="wave"
                    />
                </StyledActionsDiv>
                <StyledSkeleton
                    variant="rectangular"
                    width={110}
                    height={30}
                    animation="wave"
                />
            </StyledCardActions>
        </StyledCard>
    );
};
