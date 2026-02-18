import { observer } from "mobx-react-lite";
import { SettingsContext } from "@/contexts";
import { AppDetailPage } from "@/pages/app";
import { Panel } from "./Panel";

export const SettingsPanel = observer(({ value }: { value: "APPSETTINGS" }) => {
	const view = value;

	return (
		<Panel>
			<SettingsContext.Provider
				value={{
					adminMode: false,
				}}
			>
				<div className="flex h-full w-full flex-col gap-4 overflow-y-auto overflow-x-hidden p-5 pt-2">
					<div className="flex w-full flex-col items-start gap-4 self-stretch pt-4">
						<div className="flex w-full shrink-0 flex-col items-start gap-4">
							{view === "APPSETTINGS" && (
								<AppDetailPage showNav={false} />
							)}
						</div>
					</div>
				</div>
			</SettingsContext.Provider>
		</Panel>
	);
});
