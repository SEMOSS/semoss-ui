import { observer } from "mobx-react-lite";
import { Switch } from "@semoss/ui/next";
import { BusinessUserScreen, DeveloperUserScreen } from "@/components/landing";
import { useCacheState, usePage } from "@/hooks";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../components/shared";

export const LandingPage: React.FC = observer(() => {
	const [devMode, setDevMode] = useCacheState(false, `landing--devMode`);

	// setup the page
	usePage({
		showNavbarSearch: true,
	});

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<NavbarRight>
				<div className="flex h-9 items-center gap-3 px-2 font-medium text-foreground text-sm">
					<span>App Builder</span>
					<Switch
						checked={devMode}
						onCheckedChange={setDevMode}
						aria-label="Toggle app builder"
					/>
				</div>
			</NavbarRight>
			{devMode ? <DeveloperUserScreen /> : <BusinessUserScreen />}
		</>
	);
});
