import { Filter } from "lucide-react";
import { Button } from "@semoss/ui/next";

const FilterIconComponent = ({ handleReset }: { handleReset: () => void }) => (
	<Button variant="ghost" size="icon-sm" onClick={handleReset}>
		<Filter className="size-4" />
	</Button>
);

export default FilterIconComponent;
