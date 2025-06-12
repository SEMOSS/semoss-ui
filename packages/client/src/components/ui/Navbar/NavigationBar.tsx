import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import {
    styled,
    AppBar,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    Switch,
    Box,
    Container,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from '@semoss/ui';

import { THEME } from '@/constants';
import { Logo } from '@/assets/img/Logo';
import { useRootStore } from '@/hooks';
import Search from './Search';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    position: 'sticky',
    top: '0',
    borderBottom: '1px solid #EAEAEE',
    background: '#FAFAFA', //"var(--Background-Paper-2, #FAFAFA)",
    color: '#666666', //"var(--Text-Primary-1, #212B36)",
    padding: '8px 0px',
    boxShadow: 'none',
    transition: 'none',
    height: '56px',
    borderRadius: '0px',
    display: 'flex',
    alignItems: 'center',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    /* Media query for screens with a minimum width of 600px */
    '@media (min-width: 600px)': {
        '&.MuiContainer-root': {
            paddingLeft: '0px',
            paddingRight: '0px',
        },
    },
}));

const StyledLeftSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '264px',
    height: '40px !important',
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
    height: 'auto',
    maxWidth: '7.5em',
    display: 'flex',
    flexGrow: 1,
}));

const StyledSearchSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '18rem',
    alignItems: 'center',
    width: '720px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '720px',
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

const StyledRightSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '264px',
    height: '40px !important',
}));

const StyledAppBuilderSection = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexGrow: 1,
    justifyContent: 'flex-end',
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
    // width: '3.125rem',
    padding: '2px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': {
        bacakground: theme.palette.action.hover,
    },
}));

interface NavigationBarProps {
    isPinned: boolean;
    right?: React.ReactNode;
    onOpen: () => void;
}
export const NavigationBar: React.FC<NavigationBarProps> = observer(
    ({ isPinned, onOpen, right }) => {
        const { configStore } = useRootStore();
        const location = useLocation();

        const [showAppBuilder, setShowAppBuilder] = useState(false);

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

        useEffect(() => {
            setShowAppBuilder(configStore.store.isAppBuilder);
        }, [configStore.store.isAppBuilder]);

        return (
            <StyledAppBar>
                <StyledContainer maxWidth={false} sx={{ maxWidth: '1440px' }}>
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        pl={5}
                        pr={5}
                        width={'100%'}
                        justifyContent={'space-between'}
                    >
                        {!isPinned && (
                            <StyledLeftSection>
                                <StyledIconButton
                                    size="medium"
                                    // edge="start"
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={() => onOpen()}
                                >
                                    <MenuIcon
                                        sx={{
                                            width: '22.5px',
                                            height: '22.5px',
                                        }}
                                    />
                                </StyledIconButton>
                                <StyledHeaderLogo to={'/'}>
                                    <StyledAppTitle>
                                        <Logo />
                                        <StyledTypography
                                            variant="h6"
                                            sx={{
                                                /* Typography/H6 */
                                                fontSize: '20px',
                                                fontStyle: 'normal',
                                                fontWeight: '500',
                                                lineHeight: '160%',
                                                letterSpacing: '0.15px',
                                            }}
                                        >
                                            {themeMap.name
                                                ? themeMap.name
                                                : THEME.name}
                                        </StyledTypography>
                                    </StyledAppTitle>
                                </StyledHeaderLogo>
                            </StyledLeftSection>
                        )}
                        <StyledSearchSection>
                            {((location.pathname === '/' && showAppBuilder) ||
                                location.pathname !== '/') && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        margin: 'auto',
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
                                                sx={{
                                                    '& .MuiOutlinedInput-root':
                                                        {
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
                                </Box>
                            )}
                        </StyledSearchSection>
                        <StyledRightSection>
                            {right
                                ? right
                                : location.pathname === '/' && (
                                      <StyledAppBuilderSection>
                                          <ToggleButtonGroup
                                              size="small"
                                              color={'primary'}
                                              value={
                                                  showAppBuilder ? 'build' : ''
                                              }
                                          >
                                              <ToggleButton
                                                  size="small"
                                                  value={'build'}
                                                  onClick={() => {
                                                      configStore.setAppBuilderMode(
                                                          !showAppBuilder,
                                                      );
                                                  }}
                                              >
                                                  Build
                                              </ToggleButton>
                                          </ToggleButtonGroup>
                                      </StyledAppBuilderSection>
                                  )}
                        </StyledRightSection>
                    </Stack>
                </StyledContainer>
            </StyledAppBar>
        );
    },
);
