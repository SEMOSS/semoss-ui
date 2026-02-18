import { observer } from "mobx-react-lite";
import { Container, styled } from "@semoss/ui";
import { SettingsContext } from "@/contexts";
import { AppDetailPage } from "@/pages/app";
import { Panel } from "./Panel";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	paddingTop: theme.spacing(2),
}));

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	flexShrink: "0",
}));

export const SettingsPanel = observer(({ value }: { value: "APPSETTINGS" }) => {
	const view = value;

	return (
		<Panel>
			<SettingsContext.Provider
				value={{
					adminMode: false,
				}}
			>
				<div className="flex h-full w-full flex-col gap-4 overflow-y-auto overflow-x-hidden p-5">
					<StyledContainer>
						<StyledContent>
							{view === "APPSETTINGS" && (
								<AppDetailPage showNav={false} />
							)}
						</StyledContent>
					</StyledContainer>
				</div>
			</SettingsContext.Provider>
		</Panel>
	);
});
