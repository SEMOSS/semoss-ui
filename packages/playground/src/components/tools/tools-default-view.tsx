/** biome-ignore-all lint/suspicious/noExplicitAny: unknown values for json */
import { observer } from "mobx-react-lite";
import type React from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";

export interface MCPTool {
	name: string;
	description?: string;
	inputSchema?: {
		type: "object";
		properties?: {
			[key: string]: {
				type?: string;
				description?: string;
				enum?: string[];
				items?: any;
				minimum?: number;
				maximum?: number;
				minLength?: number;
				maxLength?: number;
				pattern?: string;
				format?: string;
				default?: any;
			};
		};
		required?: string[];
		additionalProperties?: boolean;
	};
}

interface DynamicFormProps {
	tool: MCPTool;
	formData: Record<string, any>;
	onFormDataChange: (data: Record<string, unknown>) => void;
	handleSubmission: (data: Record<string, unknown>) => void;
}

export const DynamicForm = observer(
	({
		tool,
		formData,
		onFormDataChange,
		handleSubmission,
	}: DynamicFormProps) => {
		const properties = tool.inputSchema?.properties || {};
		const required = tool.inputSchema?.required || [];

		const handleChange = (field: string, value: unknown) => {
			onFormDataChange({ ...formData, [field]: value });
		};

		const handleSubmit = (e: React.FormEvent) => {
			e.preventDefault();
			handleSubmission(formData);
		};

		const capitalizeWords = (str: string) => {
			return str
				.split(/[_\s]+/) // Split by underscores or spaces
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" "); // Join with spaces for better readability
		};

		const renderField = (fieldName: string, fieldSchema: any) => {
			const isRequired = required.includes(fieldName);
			const value = formData[fieldName] ?? "";
			const displayName = capitalizeWords(fieldName); // Capitalize fieldName

			switch (fieldSchema.type) {
				case "string":
					if (fieldSchema.enum) {
						return (
							<div key={fieldName} className="space-y-1">
								<div className="mb-2 flex items-center gap-2">
									<Label
										htmlFor={fieldName}
										className="font-semibold"
									>
										{displayName}
										{isRequired && (
											<span className="text-red-500">
												{" "}
												*
											</span>
										)}
									</Label>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{fieldSchema.type}
									</Badge>
								</div>
								<Select
									value={value}
									onValueChange={(value) =>
										handleChange(fieldName, value)
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={`Select ${displayName}`}
										/>
									</SelectTrigger>
									<SelectContent>
										{fieldSchema.enum.map(
											(option: string) => (
												<SelectItem
													key={option}
													value={option}
												>
													{capitalizeWords(option)}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
								{fieldSchema.description && (
									<p className="text-muted-foreground text-sm">
										{fieldSchema.description}
									</p>
								)}
							</div>
						);
					}
					if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
						return (
							<div key={fieldName} className="space-y-1">
								<div className="mb-2 flex items-center gap-2">
									<Label
										htmlFor={fieldName}
										className="font-semibold"
									>
										{displayName}
										{isRequired && (
											<span className="text-red-500">
												{" "}
												*
											</span>
										)}
									</Label>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{fieldSchema.type}
									</Badge>
								</div>
								<Textarea
									id={fieldName}
									value={value}
									onChange={(e) =>
										handleChange(fieldName, e.target.value)
									}
									placeholder={`Enter ${displayName}`}
									rows={4}
									className="w-full"
								/>
								{fieldSchema.description && (
									<p className="text-muted-foreground text-sm">
										{fieldSchema.description}
									</p>
								)}
							</div>
						);
					}
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-red-500"> *</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type}
								</Badge>
							</div>
							<Input
								id={fieldName}
								value={value}
								onChange={(e) =>
									handleChange(fieldName, e.target.value)
								}
								placeholder={`Enter ${displayName}`}
								className="w-full"
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);

				case "number":
				case "integer":
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-red-500"> *</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type}
								</Badge>
							</div>
							<Input
								id={fieldName}
								type="number"
								value={value}
								onChange={(e) =>
									handleChange(
										fieldName,
										Number.parseFloat(e.target.value),
									)
								}
								placeholder={`Enter ${displayName}`}
								min={fieldSchema.minimum}
								max={fieldSchema.maximum}
								className="w-full"
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);

				case "boolean":
					return (
						<div
							key={fieldName}
							className="flex items-center space-x-2"
						>
							<Checkbox
								id={fieldName}
								checked={value || false}
								onCheckedChange={(checked) =>
									handleChange(fieldName, checked)
								}
							/>
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Label
										htmlFor={fieldName}
										className="font-semibold"
									>
										{displayName}
										{isRequired && (
											<span className="text-red-500">
												{" "}
												*
											</span>
										)}
									</Label>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{fieldSchema.type}
									</Badge>
								</div>
								{fieldSchema.description && (
									<p className="text-muted-foreground text-sm">
										{fieldSchema.description}
									</p>
								)}
							</div>
						</div>
					);

				case "array":
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-red-500"> *</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type}
								</Badge>
							</div>
							<Textarea
								id={fieldName}
								value={
									Array.isArray(value)
										? value.join(", ")
										: value
								}
								onChange={(e) =>
									handleChange(
										fieldName,
										e.target.value
											.split(",")
											.map((s) => s.trim()),
									)
								}
								placeholder="Enter comma-separated values"
								rows={2}
								className="w-full"
							/>
							{fieldSchema.description && (
								<p className="text-muted-foreground text-sm">
									{fieldSchema.description}
								</p>
							)}
						</div>
					);

				default:
					return (
						<div key={fieldName} className="space-y-1">
							<div className="mb-2 flex items-center gap-2">
								<Label
									htmlFor={fieldName}
									className="font-semibold"
								>
									{displayName}
									{isRequired && (
										<span className="text-red-500"> *</span>
									)}
								</Label>
								<Badge variant="outline" className="text-xs">
									{fieldSchema.type || "unknown"}
								</Badge>
							</div>
							<Input
								id={fieldName}
								value={value}
								onChange={(e) =>
									handleChange(fieldName, e.target.value)
								}
								placeholder={`Enter ${displayName}`}
								className="w-full"
							/>
						</div>
					);
			}
		};

		return (
			<div className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
				<Card className="h-full w-full">
					<CardHeader>
						<CardTitle className="font-semibold text-xl">
							{tool.description && (
								<p className="text-muted-foreground text-sm">
									{tool.description}
								</p>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-4">
								{Object.entries(properties).map(
									([fieldName, fieldSchema]) =>
										renderField(fieldName, fieldSchema),
								)}
							</div>
							<Button type="submit" className="w-full" size="lg">
								Execute
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	},
);
