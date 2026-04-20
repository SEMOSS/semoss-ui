import { Search, X } from "lucide-react";
import { Button, Input } from "@semoss/ui/next";

const FilterSearchFilterHeader = ({
	searchText,
	setSearchText,
	setChecked,
}: {
	searchText: string;
	setSearchText: (val: string) => void;
	setChecked: (val: string[]) => void;
}) => (
	<div className="relative flex items-center">
		<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
		<Input
			placeholder="Search"
			value={searchText}
			className="pr-9 pl-9"
			onChange={(e) => setSearchText(e.target.value)}
		/>
		{searchText && (
			<Button
				variant="ghost"
				size="icon-sm"
				className="-translate-y-1/2 absolute top-1/2 right-1"
				onClick={() => {
					setSearchText("");
					setChecked([]);
				}}
			>
				<X className="size-4" />
			</Button>
		)}
	</div>
);

export default FilterSearchFilterHeader;
