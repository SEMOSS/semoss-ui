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

    '& > div:first-of-type': {
        paddingLeft: theme.spacing(2),
    },

    '& > div:last-of-type': {
        paddingRight: theme.spacing(2),
    },
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

export const NAVBAR_LEFT_ID = 'navbar--left';
export const NAVBAR_MIDDLE_ID = 'navbar--middle';
export const NAVBAR_RIGHT_ID = 'navbar--right';

export const Navbar: React.FC = observer(() => {
    const { configStore } = useRootStore();
    // const { page } = usePage();

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
        <StyledNavbar>
            {/* {!page.sidebar.pinned && (
                <StyledNavbarHeader
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'flex-start'}
                    onMouseOver={() => page.openSidebar()}
                >
                    <IconButton size="small" onClick={() => page.openSidebar()}>
                        <MenuRounded fontSize="medium" />
                    </IconButton>

                    {page.navbar.logo && (
                        <StyledNavbarHeaderLink to={'/'} aria-label={'Go Home'}>
                            <Logo />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {themeMap.name ? themeMap.name : THEME.name}
                            </Typography>
                        </StyledNavbarHeaderLink>
                    )}
                </StyledNavbarHeader>
            )} */}

            <Stack
                id={NAVBAR_LEFT_ID}
                direction="row"
                alignItems={'center'}
                justifyContent={'flex-start'}
                spacing={1}
            ></Stack>

            <Stack
                id={NAVBAR_MIDDLE_ID}
                direction="row"
                alignItems={'center'}
                justifyContent={'flex-start'}
                spacing={1}
            ></Stack>

            <Stack
                id={NAVBAR_RIGHT_ID}
                direction="row"
                alignItems={'center'}
                justifyContent={'flex-end'}
                spacing={1}
            ></Stack>
        </StyledNavbar>
    );
});

{
    /* <Container maxWidth={false} sx={{ maxWidth: '720px' }}>
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
</Container> */
}
