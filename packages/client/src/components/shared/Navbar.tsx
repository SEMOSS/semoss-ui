import { observer } from "mobx-react-lite";
import { Container, Stack, styled } from "@semoss/ui";
import { usePage } from "@/hooks";
import { PlatformSearch } from "./platform-search";

const StyledNavbar = styled("div")(({ theme }) => ({
	position: "absolute",
	top: "0",
	height: theme.spacing(7),
	width: "100%",
	borderBottom: "1px solid #EAEAEE",
	background: "#FAFAFA", //"var(--Background-Paper-2, #FAFAFA)",
	color: theme.palette.text.primary,
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 0,
	padding: theme.spacing(0, 4),
}));

export const Navbar: React.FC = observer(() => {
	const { page } = usePage();

	return (
		<StyledNavbar ref={(n) => page.setNavbarElement(n)}>
			<Stack
				id={"navbar--left"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-start"}
				spacing={1}
				flex={"1 1 0"}
			></Stack>
			<Container maxWidth={false} sx={{ maxWidth: "720px" }}>
				{page.navbar?.search ? <PlatformSearch /> : <>&nbsp;</>}
			</Container>
			<Stack
				id={"navbar--right"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-end"}
				spacing={1}
				flex={"1 1 0"}
			></Stack>
		</StyledNavbar>
	);
});
