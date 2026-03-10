import { observer } from "mobx-react-lite";
import { Container, styled } from "@semoss/ui";
import { Help } from "@/components/help";
import { Navbar } from "./Navbar";
import { PlatformMessages } from "./PlatformMessages";
import { Sidebar } from "./Sidebar";

const StyledPage = styled("div")(() => ({
	position: "relative",
	display: "flex",
	flexDirection: "row",
	height: "100vh",
	width: "100vw",
	overflow: "hidden",
}));

const StyledContent = styled("div")(({ theme }) => ({
	position: "relative",
	flex: 1,
	height: "100%",
	width: "100%",
	overflow: "hidden",
	paddingTop: theme.spacing(7), // nav height
}));

const StyledInner = styled("div")(() => ({
	position: "relative",
	height: "100%",
	width: "100%",
	overflowX: "hidden",
	overflowY: "auto",
}));

const StyledContainer = styled(Container)(({ theme }) => ({
	paddingTop: theme.spacing(3),
}));

export interface PageProps {
	/** Content to include in the main section of the page */
	children: React.ReactNode;
}

export const Page: React.FC<PageProps> = observer(({ children }) => {
	return (
		<StyledPage>
			<Sidebar />
			<StyledContent>
				<Navbar />
				<StyledInner id="home__content">
					<StyledContainer
						sx={{ maxWidth: "1440px" }}
						id="home__container"
					>
						{children}
					</StyledContainer>
				</StyledInner>
			</StyledContent>
			<PlatformMessages />
			<Help />
		</StyledPage>
	);
});
