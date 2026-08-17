import { useEffect, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { Button, Muted, Spinner, toast } from "@semoss/ui/next";
import type { RouterConfigFormValue } from "@/components/import/model/model-import.constants";
import {
	RouterConfigField,
	routerConfigFromJson,
	routerConfigToJson,
	validateRouterConfig,
} from "@/components/import/model/router-config-field";
import { useRootStore } from "@/hooks";

export interface EngineRouterSettingsProps {
	/** Id of the model router engine */
	engineId: string;

	/** User's permission for the engine */
	permission: Role;

	/** Called after the routing configuration is saved */
	onUpdated?: () => void;
}

/**
 * Settings card for MODEL_ROUTER engines: loads the engine's router.json via
 * GetModelRouterConfig, edits it with the same structured editor the import
 * flow uses, and saves through UpdateModelRouterConfig, which validates and
 * applies the new routing to the running engine immediately.
 */
export const EngineRouterSettings: React.FC<EngineRouterSettingsProps> = ({
	engineId,
	permission,
	onUpdated,
}) => {
	const { configStore } = useRootStore();
	const isEditable = permission === "OWNER" || permission === "EDIT";

	const getConfig = usePixel<string>(
		`GetModelRouterConfig(engine=["${engineId}"]);`,
	);

	const [value, setValue] = useState<RouterConfigFormValue | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (getConfig.status !== "SUCCESS") {
			return;
		}
		setValue(routerConfigFromJson(getConfig.data));
	}, [getConfig.status, getConfig.data]);

	const save = async () => {
		const validation = validateRouterConfig(value);
		if (validation !== true) {
			toast.error(validation);
			return;
		}

		setSaving(true);
		try {
			const response = await configStore.runPixel(
				`UpdateModelRouterConfig(engine=["${engineId}"], map=[${routerConfigToJson(value)}]);`,
			);
			const result = response.pixelReturn?.[0];
			if (
				response.errors.length > 0 ||
				String(result?.operationType || "").includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") ||
						String(
							result?.output ||
								"Unable to update the routing configuration.",
						),
				);
			}

			toast.success("Routing configuration updated");
			getConfig.refresh();
			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update the routing configuration.",
			);
		} finally {
			setSaving(false);
		}
	};

	if (
		getConfig.status === "LOADING" ||
		(getConfig.status === "SUCCESS" && value === null)
	) {
		return (
			<div className="flex w-full items-center justify-center py-8">
				<Spinner />
			</div>
		);
	}

	if (getConfig.status === "ERROR") {
		return (
			<Muted className="text-destructive">
				{getConfig.error?.message ||
					"Failed to load the routing configuration."}
			</Muted>
		);
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<RouterConfigField
				value={value}
				onChange={(next) => setValue(next)}
				disabled={!isEditable || saving}
				excludeEngineId={engineId}
			/>
			<div className="flex w-full justify-end">
				<Button
					size="sm"
					onClick={() => save()}
					disabled={!isEditable || saving}
				>
					{saving ? "Saving..." : "Save Routing"}
				</Button>
			</div>
		</div>
	);
};
