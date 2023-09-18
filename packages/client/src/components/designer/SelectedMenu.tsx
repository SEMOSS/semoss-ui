import { observer } from 'mobx-react-lite';
import { styled, Paper } from '@semoss/ui';
import { useDesigner } from '@/hooks/useDesigner';

const StyledContent = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    overflowY: 'auto',
    height: '100%',
    width: theme.spacing(43),
    borderRadius: '0',
}));

const StyledContentInner = styled('div')(({ theme }) => ({
    flex: '1',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
    width: '100%',
}));

export const SelectedMenu = observer(() => {
    const { designer } = useDesigner();

    return (
        <StyledContent elevation={7}>
            <StyledContentInner>
                Selected {designer.selected}
            </StyledContentInner>
        </StyledContent>
    );
});
