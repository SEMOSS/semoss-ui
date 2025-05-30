import { ChangeEvent, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';

import {
    styled,
    AppBar,
    TextField,
    Toolbar,
    Typography,
    IconButton,
    InputAdornment,
    Switch,
    Box,
} from '@semoss/ui';

import { THEME } from '@/constants';
import { Logo } from '@/assets/img/Logo';
import { useRootStore } from '@/hooks';
import Search from './Search';
import { useLocation } from 'react-router-dom';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    borderBottom: '1px solid #EAEAEE',
    background: '#FAFAFA', //"var(--Background-Paper-2, #FAFAFA)",
    color: '#666666', //"var(--Text-Primary-1, #212B36)",
    padding: '0px 32px 0px 32px',
    boxShadow: 'none',
    transition: 'none',
}));

const StyledLeftSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: '1.5 0.5 5%',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    marginRight: 2,
    borderRadius: '7px',
    border: '0.938px solid #323232',
    width: '30px',
    height: '30px',
}));

const StyledAppTitle = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontFamily: 'Inter',
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '160%' /* 32px */,
    letterSpacing: '0.15px',
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    // marginLeft: "8px",
    height: 'auto',
    maxWidth: '7.5em',
    display: 'flex',
    flexGrow: 1,
}));

const StyledSearchSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '18rem',
    alignItems: 'center',
    flex: '2 0.5 10%',
    minWidth: '0px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#F5F5F5',
    width: '50rem',
    // marginLeft:"128px",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'center',
    '& .MuiOutlinedInput-root': {
        padding: '0px 12px',
        borderRadius: '8px',
        border: '1px solid  #C4C4C4',
        marginBottom: '8px',
    },
    '& .MuiOutlinedInput-root > input': {
        paddingLeft: '0px',
        paddingRight: '0px',
    },
}));

const StyledRightSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: '1 0.5 15%',
}));

const StyledAppBuilderSection = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexGrow: 1,
}));

const StyledAppBuilder = styled(Typography)(({ theme }) => ({
    color: 'var(--Text-Secondary, #666)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    display: 'flex',
    /* Typography/Caption */
    fontFamily: 'Roboto',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '166%' /* 19.92px */,
    letterSpacing: '0.4px',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexGrow: 1,
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
    display: 'flex',
    width: '3.125rem',
    padding: '2px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
}));

interface NavigationBarProps {
    onOpen: () => void;
}
export const NavigationBar = (props: NavigationBarProps) => {
    const { onOpen } = props;
    const { configStore } = useRootStore();
    const location = useLocation();

    const [showAppBuilder, setShowAppBuilder] = useState(
        configStore.store.isAppBuilder,
    );

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
        <StyledAppBar>
            <Toolbar>
                <StyledLeftSection>
                    <StyledIconButton
                        size="medium"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => onOpen()}
                    >
                        <MenuIcon />
                    </StyledIconButton>
                    <StyledAppTitle>
                        <Logo />
                        <StyledTypography variant="h6">
                            {themeMap.name ? themeMap.name : THEME.name}
                        </StyledTypography>
                    </StyledAppTitle>
                </StyledLeftSection>
                {showAppBuilder && (
                    <StyledSearchSection>
                        <Box
                            sx={{
                                width: '100%',
                                maxWidth: 500,
                                margin: 'auto',
                                padding: 2,
                            }}
                        >
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
                                    />
                                )}
                            />
                        </Box>
                    </StyledSearchSection>
                )}
                <StyledRightSection>
                    {location.pathname === '/' && (
                        <StyledAppBuilderSection>
                            <StyledAppBuilder variant="h6">
                                App Builder
                            </StyledAppBuilder>
                            <StyledSwitch
                                checked={showAppBuilder}
                                onChange={(
                                    e: ChangeEvent<HTMLInputElement>,
                                ) => {
                                    setShowAppBuilder(e.target.checked);

                                    const key = `builder--${configStore.store.userEpoch}`;
                                    if (e.target.checked) {
                                        localStorage.setItem(
                                            key,
                                            JSON.stringify({ state: true }),
                                        );
                                        configStore.setAppBuilderMode(true);
                                    } else {
                                        const item = localStorage.getItem(
                                            `builder--${configStore.store.userEpoch}`,
                                        );
                                        if (item) {
                                            localStorage.removeItem(key);
                                        }
                                        configStore.setAppBuilderMode(false);
                                    }
                                }}
                            ></StyledSwitch>
                        </StyledAppBuilderSection>
                    )}
                </StyledRightSection>
            </Toolbar>
        </StyledAppBar>
    );
};
