import { styled } from "@semoss/ui";
import { UpdateSmssForm } from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useEngine } from "@/hooks";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(3),
}));

export const EngineSmssPage = () => {
	const { type, active } = useEngine();

	return (
		<SettingsContext.Provider
			value={{
				adminMode: false,
			}}
		>
			<StyledContainer>
				<UpdateSmssForm type={type} id={active.id} />
			</StyledContainer>
		</SettingsContext.Provider>
	);
};
