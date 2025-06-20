import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import {
    styled,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    Container,
    Stack,
} from '@semoss/ui';

import { THEME } from '@/constants';
import { Logo } from '@/assets/img/Logo';
import { usePage, useRootStore } from '@/hooks';
import { Search } from './Search';
import { MenuRounded, Search as SearchIcon } from '@mui/icons-material';

const StyledNavbar = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: '0',
    height: theme.spacing(7),
    width: '100%',
    borderBottom: '1px solid #EAEAEE',
    background: '#FAFAFA', //"var(--Background-Paper-2, #FAFAFA)",
    color: '#666666', //"var(--Text-Primary-1, #212B36)",
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 0,
    padding: theme.spacing(0, 2),
}));

const StyledNavbarHeader = styled(Stack)(({ theme }) => ({
    position: 'relative',
    background: 'transparent',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    zIndex: 0,
}));

const StyledNavbarHeaderLink = styled(Link)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    gap: theme.spacing(2),
    '&:hover': {
        background: theme.palette.action.hover,
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'center',
    '& .MuiOutlinedInput-root': {
        padding: '0px 12px',
        borderRadius: '8px',
        border: '1px solid  #C4C4C4',
    },
    '& .MuiOutlinedInput-root > input': {
        paddingLeft: '0px',
        paddingRight: '0px',
    },
}));

export const Navbar: React.FC = observer(() => {
    const { configStore } = useRootStore();
    const { page } = usePage();

    const themeMap = useMemo(() => {
        const theme = configStore.store.config['theme'];

        if (theme && theme['THEME_MAP']) {
            try {
                return JSON.parse(theme['THEME_MAP'] as string);
            } catch {
                return {};
            }
        }

        return {};
    }, [Object.keys(configStore.store.config).length]);

    return (
        <StyledNavbar ref={(n) => page.setNavbarElement(n)}>
            <Stack
                id={'navbar--left'}
                direction="row"
                alignItems={'center'}
                justifyContent={'flex-start'}
                spacing={1}
                flex={'1 1 0'}
            ></Stack>
            <Container maxWidth={false} sx={{ maxWidth: '720px' }}>
                {page.navbar && page.navbar.search ? (
                    <Search
                        renderInput={(params) => (
                            <StyledTextField
                                {...params}
                                variant="outlined"
                                size="small"
                                placeholder="Search"
                                label=""
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        height: '40px !important',
                                        border: 'none',
                                        '& input': {
                                            height: '40px !important',
                                        },
                                    },
                                }}
                            />
                        )}
                    />
                ) : (
                    <>&nbsp;</>
                )}
            </Container>
            <Stack
                id={'navbar--right'}
                direction="row"
                alignItems={'center'}
                justifyContent={'flex-end'}
                spacing={1}
                flex={'1 1 0'}
            ></Stack>
        </StyledNavbar>
    );
});
