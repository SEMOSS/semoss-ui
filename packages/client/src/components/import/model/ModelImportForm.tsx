import { useEffect } from "react";
import { Controller as RHFController, useForm } from "react-hook-form";
import {
	Button,
	Select,
	Stack,
	Switch,
	TextArea,
	TextField,
	Typography,
} from "@semoss/ui";
import type { FieldDefinition } from "./model-import.constants";

interface ModelImportFormProps {
	/** Optional model name being configured */
	name?: string;
	/**
	 * Fields to be rendered in the form
	 */
	fields: FieldDefinition[];
	/**
	 * advanced Fields to be rendered in the form (collapsible section)
	 */
	advanced: FieldDefinition[];
	/**
	 * react-hook-form control passed from parent
	 */
	/**
	 * callback invoked when form is submitted with values
	 */
	onComplete?: (data: Record<string, unknown>) => void;
}

export const ModelImportForm = (props: ModelImportFormProps) => {
	const { name, fields, advanced, onComplete } = props;

	// prepare default values from fields + advanced
	const { control, handleSubmit, reset } = useForm({
		defaultValues: [...fields, ...advanced].reduce<Record<string, unknown>>(
			(acc, f) => {
				acc[f.key] =
					f.default ?? f.value ?? (f.type === "boolean" ? false : "");
				return acc;
			},
			{},
		),
	});

	// reset defaults when fields change
	useEffect(() => {
		const defaults: Record<string, unknown> = {};
		[...fields, ...advanced].forEach((f) => {
			defaults[f.key] =
				f.default ?? f.value ?? (f.type === "boolean" ? false : "");
		});
		reset(defaults);
	}, [fields, advanced, reset]);

	const onSubmit = (data: Record<string, unknown>) => {
		console.log("Submission Pixel")
		console.log(data)

		// TODO: move to DEFAULT VALUE in react hook form
		const details = {
			"MODEL": name
		}
		
		console.log(details)
		// CreateModelEngine(
        //     model=["CATALOG_NAME"], 
        //     modelDetails=[
		// 		{
		// 			"NAME":"getet",
		// 			"MODEL_TYPE":"OPEN_AI",
		// 			"OPEN_AI_KEY":"w898398931",
		// 			"MODEL":"gpt-3.5-turbo",
		// 			"VAR_NAME":"hdhd",
		// 			"CHAT_TYPE":"chat-completion",
		// 			"INIT_MODEL_ENGINE":"import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
		// 			"KEEP_CONVERSATION_HISTORY":"false",
		// 			"KEEP_INPUT_OUTPUT":"false",
		// 			"MAX_TOKENS":"",
		// 			"MAX_INPUT_TOKENS":""
		// 		}
		// 	]
    	// )

		if (onComplete) onComplete(data);
	};

	const renderField = (f: FieldDefinition) => {
		const defaultVal =
			f.default ?? f.value ?? (f.type === "boolean" ? false : "");

		// TODO: add rules here based on field.key

		if (f.type === "hidden") {
			return (
				<RHFController
					key={f.key}
					name={f.key}
					control={control}
					defaultValue={defaultVal}
					rules={{ required: f.required }}
					render={({ field }) => (
						<input
							type="hidden"
							name={field.name}
							value={String(field.value ?? "")}
							onChange={(e) =>
								field.onChange(
									(e.target as HTMLInputElement).value,
								)
							}
							ref={field.ref}
						/>
					)}
				/>
			);
		}

		return (
			<RHFController
				key={f.key}
				name={f.key}
				control={control}
				defaultValue={defaultVal}
				rules={{ required: f.required }}
				render={({ field }) => {
					switch (f.type) {
						case "text":
						case "url":
							return (
								<TextField
									label={f.label}
									variant="outlined"
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
								/>
							);
						case "password":
							return (
								<TextField
									label={f.label}
									variant="outlined"
									type="password"
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
								/>
							);
						case "number":
							return (
								<TextField
									label={f.label}
									variant="outlined"
									type="number"
									value={String(field.value ?? "")}
									onChange={(v) => {
										const asNumber = Number(v);
										field.onChange(
											Number.isNaN(asNumber)
												? v
												: asNumber,
										);
									}}
								/>
							);
						case "textarea":
							return (
								<TextArea
									label={f.label}
									variant="outlined"
									value={field.value ?? ""}
									onChange={(v) => field.onChange(v)}
									rows={4}
								/>
							);
						case "select":
							return (
								<Select
									fullWidth
									size="small"
									value={field.value ?? ""}
									onChange={(e: unknown) =>
										field.onChange(
											(
												e as {
													target?: {
														value?: unknown;
													};
												}
											).target?.value ?? e,
										)
									}
								>
									{(f.options || []).map((opt) => (
										<Select.Item key={opt} value={opt}>
											{opt}
										</Select.Item>
									))}
								</Select>
							);
						case "boolean":
							return (
								<Stack
									direction="row"
									alignItems="center"
									spacing={2}
								>
									<Switch
										checked={!!field.value}
										onChange={(e: unknown) => {
											const checked = Boolean(
												(
													e as {
														target?: {
															checked?: unknown;
														};
													}
												).target?.checked ?? e,
											);
											field.onChange(checked);
										}}
									/>
									<Typography variant="body1">
										{f.label}
									</Typography>
								</Stack>
							);
						default:
							return null;
					}
				}}
			/>
		);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Stack spacing={2}>
				<Typography variant="h6">
					{name ? `Configure ${name}` : "Configure Model"}
				</Typography>

				<Stack spacing={1}>
					<Typography variant="subtitle2">Fields</Typography>
					<Stack spacing={1}>
						{fields.map((f) => renderField(f))}
					</Stack>
				</Stack>

				<Stack spacing={1}>
					<Typography variant="subtitle2">Advanced</Typography>
					<Stack spacing={1}>
						{advanced.map((f) => renderField(f))}
					</Stack>
				</Stack>

				<Button type="submit" variant="contained">
					Connect
				</Button>
			</Stack>
		</form>
	);
};
