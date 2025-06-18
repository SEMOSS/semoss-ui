import { observer } from 'mobx-react-lite';
import {
    styled,
    Typography,
    Switch,
    ToggleButtonGroup,
    ToggleButton,
} from '@semoss/ui';

import { useCacheState, usePage } from '@/hooks';
import { BusinessUserScreen, DeveloperUserScreen } from '@/components/landing';
import { NavbarRight } from '@/components/shared';
import { useNavbar } from '@/hooks/useNavbar';
import {
    NAVBAR_LEFT_ID,
    NAVBAR_MIDDLE_ID,
    NAVBAR_RIGHT_ID,
} from '@/components/shared/navbar/Navbar';

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

export const LandingPage: React.FC = observer(() => {
    const [devMode, setDevMode] = useCacheState(false, `landing--devMode`);

    // setup the page
    // usePage({
    //     showNavbarSearch: devMode,
    // });

    const { left, middle, right } = useNavbar({
        left: document.getElementById(NAVBAR_LEFT_ID) ? <>branding</> : null,
        middle: document.getElementById(NAVBAR_MIDDLE_ID) ? (
            devMode ? (
                <div>Search component</div>
            ) : (
                <></>
            )
        ) : null,
        right: document.getElementById(NAVBAR_RIGHT_ID) ? (
            <>Build toggle</>
        ) : null,
    });

    return (
        <>
            {/* Commented NavbarRight */}
            {left && left()}
            {middle && middle()}
            {right && right()}
            {devMode ? <DeveloperUserScreen /> : <BusinessUserScreen />}
        </>
    );
});
