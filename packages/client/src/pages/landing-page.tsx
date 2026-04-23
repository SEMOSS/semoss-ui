import { observer } from "mobx-react-lite";
import { Button } from "@semoss/ui/next";
import { BusinessUserScreen, DeveloperUserScreen } from "@/components/landing";
import { useCacheState, usePage } from "@/hooks";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../components/shared";

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
				<Button
					variant={devMode ? "default" : "outline"}
					size="sm"
					onClick={() => setDevMode(!devMode)}
				>
					Build
				</Button>
			</NavbarRight>
			{devMode ? <DeveloperUserScreen /> : <BusinessUserScreen />}
		</>
	);
});
