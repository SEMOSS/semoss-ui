import { IconButton } from "@mui/material";
import Filter from "../../../../assets/visualizationFilterBlock/FilterIcon.png";

const FilterIconComponent = ({ handleReset }: { handleReset: () => void }) => (
	<IconButton onClick={handleReset} size="small">
		<img src={Filter.toString()} alt="Filter Icon" />
	</IconButton>
);

export default FilterIconComponent;
