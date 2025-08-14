import { Env, InsightProvider } from "@semoss/sdk/react";
import { Notification, styled, ThemeProvider } from "@semoss/ui";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

const StyledMain = styled("div")(({ theme }) => ({
	position: "absolute",
	inset: 0,
	background: theme.palette.background.default,
}));

export const App = () => {
	return (
		<InsightProvider>
			<ThemeProvider>
				<Notification>
					<StyledMain>
						<Router />
					</StyledMain>
				</Notification>
			</ThemeProvider>
		</InsightProvider>
	);
};
