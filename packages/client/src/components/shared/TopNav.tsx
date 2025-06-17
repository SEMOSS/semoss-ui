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
    Button,
} from '@semoss/ui';

import { THEME } from '@/constants';
import { Logo } from '@/assets/img/Logo';
import { usePage, useRootStore } from '@/hooks';
import { Search } from './Search';
import { MenuRounded, Search as SearchIcon } from '@mui/icons-material';

const StyledTopNav = styled(Stack)(({ theme }) => ({
    position: 'absolute',
    top: '0',
    borderBottom: '1px solid #EAEAEE',
    background: '#FAFAFA', //"var(--Background-Paper-2, #FAFAFA)",
    color: '#666666', //"var(--Text-Primary-1, #212B36)",
    height: theme.spacing(7),
}));

const StyledNavHeader = styled(Stack)(({ theme }) => ({
    position: 'relative',
    background: 'transparent',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    zIndex: 0,
}));

const StyledNavHeaderLink = styled(Link)(({ theme }) => ({
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

export const TopNav: React.FC = observer(() => {
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

    if (!page.topNav) {
        return null;
    }

    return (
        <StyledTopNav
            direction="row"
            alignItems={'center'}
            justifyContent={'space-between'}
            width={'100%'}
        >
            <Stack direction="row" flex={1} alignItems={'center'} spacing={1}>
                {!page.sideNav.pinned && (
                    <StyledNavHeader
                        direction={'row'}
                        alignItems={'center'}
                        justifyContent={'flex-start'}
                        onMouseOver={() => page.openSideNav()}
                    >
                        <IconButton
                            size="small"
                            onClick={() => page.openSideNav()}
                        >
                            <MenuRounded fontSize="medium" />
                        </IconButton>

                        {page.topNav.left ? (
                            page.topNav.left()
                        ) : (
                            <StyledNavHeaderLink
                                to={'/'}
                                aria-label={'Go Home'}
                            >
                                <Logo />
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700 }}
                                >
                                    {themeMap.name ? themeMap.name : THEME.name}
                                </Typography>
                            </StyledNavHeaderLink>
                        )}
                    </StyledNavHeader>
                )}
            </Stack>
            <Container maxWidth={false} sx={{ maxWidth: '720px' }}>
                {page.topNav && page.topNav.search ? (
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
                direction="row"
                flex={1}
                alignItems={'center'}
                justifyContent={'flex-end'}
                spacing={1}
                paddingRight={2}
            >
                {page.topNav.right ? page.topNav.right() : null}
            </Stack>
        </StyledTopNav>
    );
});
