import { useId } from "react";
import type { ConnectorAccount } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import {
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface WorkbenchConnectorProviderControlProps {
	/** The account currently shown in this browser. */
	provider: ConnectorAccount;
	/** Switch the visible retained provider view. */
	onProviderChange: (provider: ConnectorAccount) => void;
}

/** Compact account selector placed in the shared viewer's toolbar. */
export function WorkbenchConnectorProviderControl({
	provider,
	onProviderChange,
}: WorkbenchConnectorProviderControlProps) {
	const { t } = useTranslation("sidebar");
	const { t: connectorText } = useTranslation("connectors");
	const id = useId();
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			<Label htmlFor={id} className="sr-only">
				{t("workbench.provider")}
			</Label>
			<Select
				value={provider}
				onValueChange={(value) => {
					if (value === "microsoft" || value === "google")
						onProviderChange(value);
				}}
			>
				<SelectTrigger
					id={id}
					size="sm"
					className="pointer-coarse:min-h-11 min-w-0 flex-1"
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{(["microsoft", "google"] as const).map((account) => (
						<SelectItem
							key={account}
							value={account}
							className="pointer-coarse:min-h-11"
						>
							{connectorText(`accounts.${account}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
