import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { CatalogTypeIcon } from "@/components/shared/catalog-type-icon";
import { GOVERNANCE_TYPES } from "./governance-types";

const GROUPS = [
	{ kind: "PROJECT", label: "Projects" },
	{ kind: "ENGINE", label: "Engines" },
] as const;

interface GovernanceTypeSelectProps {
	/** The type chosen, or undefined before one is */
	value?: string;
	/** Called with the type chosen */
	onValueChange: (type: string) => void;
}

/**
 * The project or engine type whose resources are listed, with the project
 * types and the engine types in their own groups, each with its icon. Its
 * label sits inside the trigger, so the trigger lines up with the search below
 * it, and the chosen type shows there with its icon.
 */
export const GovernanceTypeSelect = ({
	value,
	onValueChange,
}: GovernanceTypeSelectProps) => (
	<Select value={value ?? ""} onValueChange={onValueChange}>
		<SelectTrigger className="w-full min-w-0">
			<span className="flex min-w-0 items-center gap-2">
				<span className="shrink-0 text-muted-foreground">Type</span>
				<SelectValue className="truncate" placeholder="Choose one" />
			</span>
		</SelectTrigger>
		<SelectContent>
			{GROUPS.map((group) => (
				<SelectGroup key={group.kind}>
					<SelectLabel>{group.label}</SelectLabel>
					{GOVERNANCE_TYPES.filter(
						(option) => option.kind === group.kind,
					).map((option) => (
						<SelectItem key={option.type} value={option.type}>
							<span className="flex min-w-0 items-center gap-2">
								<CatalogTypeIcon type={option.type} />
								<span className="truncate">{option.label}</span>
							</span>
						</SelectItem>
					))}
				</SelectGroup>
			))}
		</SelectContent>
	</Select>
);
