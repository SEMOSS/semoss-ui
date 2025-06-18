import { observer } from 'mobx-react-lite';
import {
    styled, Typography,
    Switch,
    ToggleButtonGroup,
    ToggleButton
} from '@semoss/ui';

import { useCacheState, usePage } from '@/hooks';
import { BusinessUserScreen, DeveloperUserScreen } from '@/components/landing';
import { NavbarRight } from '@/components/shared';

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

    console.log(devMode);
    // setup the page
    usePage({
        showNavbarSearch: devMode,
    });

    return (
        <>
            <NavbarRight>
                {/* <StyledAppBuilder variant="h6">
                        App Builder
                    </StyledAppBuilder>
                    <StyledSwitch
                        checked={devMode}
                        size={'small'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setDevMode(e.target.checked);
                        }}
                    ></StyledSwitch> */}
                <ToggleButtonGroup
                    size="small"
                    color={'primary'}
                    value={devMode ? 'build' : ''}
                >
                    <ToggleButton
                        size="small"
                        value={'build'}
                        onClick={() => {
                            setDevMode(!devMode);
                        }}
                    >
                        Build
                    </ToggleButton>
                </ToggleButtonGroup>
            </NavbarRight>
            {devMode ? <DeveloperUserScreen /> : <BusinessUserScreen />}
        </>
    );
});
