import ClearIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";

// 👉 Separate Search Filter Header Component
const FilterSearchFilterHeader = ({
	searchText,
	setSearchText,
	setChecked,
}: {
	searchText: string;
	setSearchText: (val: string) => void;
	setChecked: (val: string[]) => void;
}) => (
	<Box sx={{ alignItems: "center" }}>
		<TextField
			variant="outlined"
			size="small"
			placeholder="Search"
			value={searchText}
			onChange={(e) => {
				setSearchText(e.target.value);
			}}
			fullWidth
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<SearchIcon />
					</InputAdornment>
				),
				endAdornment: searchText && (
					<InputAdornment position="end">
						<IconButton
							size="small"
							onClick={() => {
								setSearchText("");
								setChecked([]);
							}}
						>
							<ClearIcon />
						</IconButton>
					</InputAdornment>
				),
			}}
		/>
	</Box>
);

export default FilterSearchFilterHeader;
