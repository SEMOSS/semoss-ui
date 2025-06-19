import { Stack, styled, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const StyledRightMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
}));
export const StyledRightMenuHeader = styled(Stack)(({ theme }) => ({
    position: 'sticky',
    top: 0,
    height: theme.spacing(9),
    width: '100%',
    padding: theme.spacing(2),
    background: theme.palette.background.default,
    zIndex: 1,
}));

export const StyledRightMenuContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'mode',
})<{ mode: RightMenuProps['mode'] }>(({ theme, mode }) => ({
    flex: mode === 'fixed' ? 1 : 'initial',
    width: '100%',
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    background: theme.palette.background.default,
    overflowX: 'hidden',
    overflowY: 'auto',
}));

interface RightMenuProps {
    /** Mode */
    mode?: 'fluid' | 'fixed';

    /** Header in the menu */
    header: React.ReactNode;

    /** Content */
    children: React.ReactNode;

    /** Close the Menu */
    onClose?: () => void;
}

export const RightMenu = (props: RightMenuProps) => {
    const { children, mode = 'fluid', header, onClose } = props;
    return (
        <StyledRightMenu>
            <StyledRightMenuHeader
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                spacing={1}
            >
                {header ? header : null}
                <IconButton
                    size="small"
                    onClick={() => {
                        onClose();
                    }}
                >
                    <Close fontSize="medium" />
                </IconButton>
            </StyledRightMenuHeader>
            <StyledRightMenuContent mode={mode}>
                {children}
            </StyledRightMenuContent>
        </StyledRightMenu>
    );
};
