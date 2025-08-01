import { observer } from "mobx-react-lite";
import {
	Switch,
	styled,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@semoss/ui";
import { BusinessUserScreen, DeveloperUserScreen } from "@/components/landing";
import { useCacheState, usePage } from "@/hooks";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../components/shared";

const StyledAppBuilder = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	fontFeatureSettings: "'liga' off, 'clig' off",
	display: "flex",
	/* Typography/Caption */
	fontFamily: "Roboto",
	fontSize: "12px",
	fontStyle: "normal",
	fontWeight: "400",
	lineHeight: "166%" /* 19.92px */,
	letterSpacing: "0.4px",
	flexDirection: "column",
	alignItems: "flex-end",
	flexGrow: 1,
	alignSelf: "center",
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(0.25, 0),
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(1.25),
}));

export const LandingPage: React.FC = observer(() => {
	const [devMode, setDevMode] = useCacheState(false, `landing--devMode`);

	// setup the page
	usePage({
		showNavbarSearch: devMode,
	});

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<NavbarRight>
				{/* <StyledAppBuilder variant="caption">App Builder</StyledAppBuilder>
        <StyledSwitch
          checked={devMode}
          size={"small"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDevMode(e.target.checked);
          }}
        /> */}
				<ToggleButtonGroup
					size="small"
					color={"primary"}
					value={devMode ? "build" : ""}
				>
					<ToggleButton
						size="small"
						value={"build"}
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
