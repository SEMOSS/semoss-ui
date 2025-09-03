import { Search as SearchIcon } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import {
	Container,
	InputAdornment,
	Stack,
	styled,
	TextField,
} from "@semoss/ui";
import { usePage } from "@/hooks";
import { Search } from "./Search";

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

const StyledLeft = styled(Stack)(({ theme }) => ({}));

const StyledTextField = styled(TextField)(() => ({
	width: "100%",
	display: "flex",
	flexDirection: "column",
	alignItems: "stretch",
	alignSelf: "center",
	"& .MuiOutlinedInput-root": {
		padding: "0px 12px",
		borderRadius: "8px",
		border: "1px solid  #C4C4C4",
	},
	"& .MuiOutlinedInput-root > input": {
		paddingLeft: "0px",
		paddingRight: "0px",
	},
}));

export const Navbar: React.FC = observer(() => {
	const { page } = usePage();

	return (
		<StyledNavbar ref={(n) => page.setNavbarElement(n)}>
			<StyledLeft
				id={"navbar--left"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-start"}
				spacing={1}
				flex={"1 1 0"}
			></StyledLeft>
			<Container maxWidth={false} sx={{ maxWidth: "720px" }}>
				{page.navbar && page.navbar.search ? (
					<Search
						renderInput={(params) => (
							<StyledTextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Search"
								label=""
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon />
										</InputAdornment>
									),
								}}
								sx={{
									"& .MuiOutlinedInput-root": {
										height: "40px !important",
										border: "none",
										"& input": {
											height: "40px !important",
										},
									},
								}}
							/>
						)}
					/>
				) : (
					<>&nbsp;</>
				)}
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
