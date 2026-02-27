import { observer } from "mobx-react-lite";
import { ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
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
				<ToggleGroup
					type="single"
					size="sm"
					variant="outline"
					value={devMode ? "build" : ""}
					onValueChange={(val) => setDevMode(val === "build")}
				>
					<ToggleGroupItem
						value="build"
						className="text-muted-foreground hover:text-muted-foreground data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
					>
						Build
					</ToggleGroupItem>
				</ToggleGroup>
			</NavbarRight>
			{devMode ? <DeveloperUserScreen /> : <BusinessUserScreen />}
		</>
	);
});
