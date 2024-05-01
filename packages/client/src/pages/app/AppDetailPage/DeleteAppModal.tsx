import { styled } from '@semoss/ui';

const StyledModalContent = styled('div')(({ theme }) => ({}));

interface DeleteAppModalProps {
    appId: string;
}

export const DeleteAppModal = (props: DeleteAppModalProps) => {
    return <StyledModalContent></StyledModalContent>;
};
