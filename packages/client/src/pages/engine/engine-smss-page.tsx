import { UpdateSMSS } from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useEngine } from "@/hooks";

export const EngineSmssPage = () => {
	const { type, active } = useEngine();

	return (
		<SettingsContext.Provider
			value={{
				adminMode: false,
			}}
		>
			<div className="flex w-full flex-col items-start gap-6 self-stretch">
				<UpdateSMSS type={type} id={active.id} />
			</div>
		</SettingsContext.Provider>
	);
};
