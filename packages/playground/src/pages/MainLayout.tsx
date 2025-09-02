import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { Stack, styled } from "@semoss/ui";
import BACKGROUND from "@/assets/img/background.png";
import { Sidebar } from "@/components";
import { ChatContext } from "@/contexts";
import { ChatStore } from "@/stores";

const StyledMain = styled(Stack)(({ theme }) => ({
	position: "relative",
	height: "100%",
	width: "100%",
	background: theme.palette.background.default,
	backgroundImage: `url(${BACKGROUND})`,
	backgroundRepeat: "no-repeat",
	backgroundSize: "cover",
	backgroundPosition: "center",
}));

export const MainLayout = () => {
	const { actions } = useInsight();

	// set up the store
	const chatStore = useMemo(() => {
		const store = new ChatStore(actions);

		// initialize it
		store.initialize();

		return store;
	}, [actions]);

	return (
		<ChatContext.Provider
			value={{
				chat: chatStore,
			}}
		>
			<StyledMain direction={"row"} overflow={"hidden"} spacing={0}>
				<Sidebar />
				<Outlet />
			</StyledMain>
		</ChatContext.Provider>
	);
};
