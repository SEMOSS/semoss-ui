import { useState } from "react";
import type { Engine } from "@semoss/shared";
import { Alert, AlertDescription, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { isRecord } from "@semoss/utility/object";
import { setUserDefaultModel, type UserDefaultModelKey } from "@/api/auth";
import { useAPI } from "@/hooks/use-api";
import { useSession } from "@/hooks/use-session";
import { useSettings } from "@/hooks/useSettings";
import { DefaultModelField } from "./default-model-field";

/** One default the card offers. */
interface DefaultModelOption {
	/** The user metadata key it is kept under. */
	key: UserDefaultModelKey;
	/** The field's label. */
	label: string;
	/** What the default is used for. */
	description: string;
}

const DEFAULT_MODELS: DefaultModelOption[] = [
	{
		key: "text-generation-model",
		label: "Text Generation Model",
		description: "Powers AI-driven text generation requests",
	},
	{
		key: "code-generation-model",
		label: "Code Generation Model",
		description: "Powers AI-driven code generation requests",
	},
];

/**
 * Reads the models getEngines lists as engines of the shared picker, without
 * the EMBEDDED subtype.
 *
 * @param data - The getEngines reply.
 * @returns The models, none for a reply that is not a list.
 */
const readModels = (data: unknown): Engine[] => {
	if (!Array.isArray(data)) {
		return [];
	}
	return data.flatMap((row): Engine[] => {
		if (
			!isRecord(row) ||
			typeof row.engine_id !== "string" ||
			row.engine_subtype === "EMBEDDED"
		) {
			return [];
		}
		return [
			{
				engine_id: row.engine_id,
				engine_name:
					typeof row.engine_name === "string"
						? row.engine_name
						: row.engine_id,
				engine_display_name:
					typeof row.engine_display_name === "string"
						? row.engine_display_name
						: undefined,
				engine_type: "MODEL",
				engine_subtype:
					typeof row.engine_subtype === "string"
						? row.engine_subtype
						: undefined,
			},
		];
	});
};

/**
 * My Profile's default models: the text and the code generation model the
 * user's requests use, side by side. Each saves as soon as it is picked, and
 * No default removes it.
 */
export const DefaultModelsCard = () => {
	const { adminMode } = useSettings();
	const getModels = useAPI(["getEngines", adminMode, "", "MODEL"]);
	const defaultTextGenerationModel = useSession(
		(state) => state.defaultTextGenerationModel,
	);
	const defaultCodeGenerationModel = useSession(
		(state) => state.defaultCodeGenerationModel,
	);
	const updateUserDefaultModel = useSession(
		(state) => state.updateUserDefaultModel,
	);
	const [savingKey, setSavingKey] = useState<UserDefaultModelKey | null>(
		null,
	);

	const values: Record<UserDefaultModelKey, string> = {
		"text-generation-model": defaultTextGenerationModel,
		"code-generation-model": defaultCodeGenerationModel,
	};
	const isLoading =
		getModels.status === "INITIAL" || getModels.status === "LOADING";
	const isError = getModels.status === "ERROR";
	const models =
		getModels.status === "SUCCESS" ? readModels(getModels.data) : [];

	const handleChange = async (
		option: DefaultModelOption,
		engineId: string,
	) => {
		const previous = values[option.key];
		if (engineId === previous) {
			return;
		}
		const name = `Default ${option.label.toLowerCase()}`;
		setSavingKey(option.key);
		updateUserDefaultModel(option.key, engineId);
		try {
			await setUserDefaultModel(option.key, engineId);
			toast.success(engineId ? `${name} saved` : `${name} removed`);
		} catch (error) {
			updateUserDefaultModel(option.key, previous);
			toast.error(getErrorMessage(error, `${name} could not be saved`));
		} finally {
			setSavingKey(null);
		}
	};

	return (
		<div className="rounded-lg border bg-card px-6 py-5">
			<h2 className="mb-4 font-semibold text-base">
				Default AI models for your requests
			</h2>
			{isError ? (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>
						The models could not be read.
					</AlertDescription>
				</Alert>
			) : null}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{DEFAULT_MODELS.map((option) => (
					<DefaultModelField
						key={option.key}
						label={option.label}
						description={option.description}
						value={values[option.key]}
						onChange={(engineId) => handleChange(option, engineId)}
						engines={models}
						isLoading={isLoading}
						disabled={isError || savingKey === option.key}
					/>
				))}
			</div>
		</div>
	);
};
