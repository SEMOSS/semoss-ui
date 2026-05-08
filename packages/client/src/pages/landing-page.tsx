import { observer } from "mobx-react-lite";
import { DeveloperUserScreen } from "@/components/landing";
import { usePage } from "@/hooks";
import { NavbarHeader, NavbarLeft } from "../components/shared";

export const LandingPage: React.FC = observer(() => {
	// setup the page
	usePage({
		showNavbarSearch: true,
	});

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<DeveloperUserScreen />
		</>
	);
});
