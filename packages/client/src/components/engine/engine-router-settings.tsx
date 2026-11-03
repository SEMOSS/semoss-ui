import { useEffect, useMemo, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { RouterConfigFormValue } from "@/components/import/model/model-import.constants";
import {
	RouterConfigField,
	routerConfigFromJson,
	routerConfigToJson,
	validateRouterConfig,
} from "@/components/import/model/router-config-field";
import { useSession } from "@/hooks";

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
	const runPixel = useSession((state) => state.runPixel);
	const isEditable = permission === "OWNER" || permission === "EDIT";

	const getConfig = usePixel<string>(
		`GetModelRouterConfig(engine=["${engineId}"]);`,
	);

	const [value, setValue] = useState<RouterConfigFormValue | null>(null);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState("");

	// the routing as saved, which Discard goes back to
	const savedValue = useMemo(
		() =>
			getConfig.status === "SUCCESS"
				? routerConfigFromJson(getConfig.data)
				: null,
		[getConfig.status, getConfig.data],
	);
	const isDirty =
		value !== null &&
		savedValue !== null &&
		routerConfigToJson(value) !== routerConfigToJson(savedValue);

	useEffect(() => {
		if (savedValue === null) {
			return;
		}
		setValue(savedValue);
	}, [savedValue]);

	const handleDiscard = () => {
		setSaveError("");
		setValue(savedValue);
	};

	const save = async () => {
		setSaveError("");
		const validation = validateRouterConfig(value);
		if (validation !== true) {
			setSaveError(validation);
			return;
		}

		setSaving(true);
		try {
			const response = await runPixel(
				`UpdateModelRouterConfig(engine=["${engineId}"], map=[${routerConfigToJson(value)}]);`,
			);
			const result = response.pixelReturn?.[0];
			if (
				!result ||
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
			setSaveError(
				getErrorMessage(
					error,
					"Unable to update the routing configuration.",
				),
			);
		} finally {
			setSaving(false);
		}
	};

	const isLoading =
		getConfig.status === "INITIAL" ||
		getConfig.status === "LOADING" ||
		(getConfig.status === "SUCCESS" && value === null);

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Routing</CardTitle>
				<CardDescription>
					This engine is a model router. Context window, token limits,
					reasoning and built-in tools come from the engines it routes
					to. Changes to the routing apply to the running engine
					immediately.
				</CardDescription>
				{isEditable && isDirty && (
					<CardAction className="flex gap-2 self-center">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleDiscard}
							disabled={saving}
							data-testid="engine-router-settings--cancel-btn"
						>
							Discard
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={() => save()}
							disabled={saving}
							data-testid="engine-router-settings--save-btn"
						>
							{saving ? <Spinner className="size-4" /> : null}
							{saving ? "Saving..." : "Save"}
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{getConfig.status === "ERROR" ? (
					<Alert variant="destructive">
						<AlertDescription className="flex flex-col items-start gap-2">
							{getConfig.error?.message ||
								"Failed to load the routing configuration."}
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => getConfig.refresh()}
							>
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				) : isLoading || value === null ? (
					<div className="flex justify-center py-4">
						<Spinner />
					</div>
				) : (
					<>
						<RouterConfigField
							value={value}
							onChange={(next) => setValue(next)}
							disabled={!isEditable || saving}
							excludeEngineId={engineId}
						/>
						{saveError && (
							<Alert variant="destructive">
								<AlertDescription>{saveError}</AlertDescription>
							</Alert>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
};
