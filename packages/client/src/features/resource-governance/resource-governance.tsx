import { Navigate, useNavigate, useParams } from "react-router";
import { Card, cn } from "@semoss/ui/next";
import { GovernanceTypeSelect } from "./governance-type-select";
import {
	GOVERNANCE_COLUMNS_CLASS,
	GOVERNANCE_PANEL_CLASS,
	GovernanceTypeView,
	getGovernancePath,
} from "./governance-type-view";
import { findGovernanceType, GOVERNANCE_TYPES } from "./governance-types";

/**
 * Resource Governance: an admin chooses a project or engine type at the top of
 * the list, then sees every resource of it and everything about the one open.
 * It opens on the first type in the dropdown. The type and the resource are in
 * the address, so a link opens them.
 */
export const ResourceGovernance = () => {
	const navigate = useNavigate();
	const { type, id } = useParams<{ type: string; id: string }>();
	const entry = findGovernanceType(type);
	const typeSelect = (
		<GovernanceTypeSelect
			value={entry?.type}
			onValueChange={(next) => navigate(getGovernancePath(next))}
		/>
	);

	const [firstType] = GOVERNANCE_TYPES;
	if (!type && firstType) {
		return <Navigate to={getGovernancePath(firstType.type)} replace />;
	}

	if (entry) {
		// a new type starts its list over, search, order and checked rows included
		return (
			<GovernanceTypeView
				key={entry.type}
				entry={entry}
				typeSelect={typeSelect}
				resourceId={id}
			/>
		);
	}

	return (
		<div className={GOVERNANCE_COLUMNS_CLASS}>
			<Card
				className={cn(
					"flex min-h-0 flex-col gap-0 overflow-hidden border border-border/60 py-0",
					GOVERNANCE_PANEL_CLASS,
				)}
			>
				<div className="border-border/60 border-b p-3">
					{typeSelect}
				</div>
				<p className="flex h-40 items-center justify-center p-3 text-center text-muted-foreground text-sm">
					That type is not one this page lists. Choose another.
				</p>
			</Card>
			<Card
				className={cn(
					"hidden items-center justify-center border border-border/60 p-3 text-center text-muted-foreground text-sm lg:flex",
					GOVERNANCE_PANEL_CLASS,
				)}
			>
				Choose a type, then one of its projects or engines, to see
				everything about it
			</Card>
		</div>
	);
};
