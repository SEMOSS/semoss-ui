import { UpdateSMSS } from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useEngine } from "@/hooks";

export const EngineSmssPage = () => {
	const { type, engine } = useEngine();

	return (
		<SettingsContext.Provider
			value={{
				adminMode: false,
			}}
		>
			<div className="flex w-full flex-col items-start gap-6 self-stretch">
				<UpdateSMSS type={type} id={engine.engine_id} />
			</div>
		</SettingsContext.Provider>
	);
};
