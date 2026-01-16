import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	RotateCcw,
	Trash2,
} from "lucide-react";
import React, { memo } from "react";
import { Button, Card, Input, Label, Textarea } from "@semoss/ui/next";
import type { FunctionCardProps } from "./types";

const TYPE_OPTIONS = [
	{ value: "string", label: "String" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "array", label: "Array" },
	{ value: "object", label: "Object" },
];

export const FunctionCard = memo<FunctionCardProps>(
	({
		tool,
		actualIdx,
		isExpanded,
		isDeleted,
		onToggleExpand,
		onDelete,
		onRestore,
		onUpdateTool,
		onUpdateToolProp,
		onRequiredToggle,
		onTypeChange,
		onDefaultChange,
		onJsonTextChange,
		getJsonTextValue,
		jsonErrors,
		showDelete = true,
		showRestore = true,
	}) => {
		const handleHeaderClick = (e: React.MouseEvent) => {
			// Prevent toggle when clicking on delete/restore buttons
			if (
				(e.target as HTMLElement).closest(
					'button[data-action="delete"], button[data-action="restore"]',
				)
			) {
				return;
			}
			onToggleExpand(tool.name);
		};

		return (
			<Card className="mb-5 w-full gap-0 rounded-lg py-0 transition-all">
				<button
					type="button"
					onClick={handleHeaderClick}
					className={`flex w-full cursor-pointer items-center justify-between p-2 text-left ${
						isDeleted ? "bg-muted" : "bg-secondary"
					} ${
						isExpanded ? "rounded-t-lg" : "rounded-lg"
					} transition-colors hover:bg-accent`}
				>
					<div className="flex items-center gap-2">
						<div className="rounded p-1">
							{isExpanded ? (
								<ChevronUp
									size={18}
									className="text-muted-foreground"
								/>
							) : (
								<ChevronDown
									size={18}
									className="text-muted-foreground"
								/>
							)}
						</div>
						<span
							className={`font-bold text-base ${
								isDeleted
									? "text-muted-foreground line-through"
									: "text-foreground"
							}`}
						>
							{tool.title || tool.name}
						</span>
					</div>
					<div className="flex gap-2">
						{!isDeleted && showDelete ? (
							<Button
								variant="ghost"
								size="sm"
								color="error"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(actualIdx);
								}}
								data-action="delete"
								className="flex items-center gap-1 text-destructive hover:bg-transparent hover:text-destructive/90"
							>
								<Trash2 size={14} />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						) : isDeleted && showRestore ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									onRestore(actualIdx);
								}}
								data-action="restore"
								className="flex items-center gap-1 text-destructive hover:bg-transparent hover:text-destructive/90"
							>
								<RotateCcw size={14} />
								<span className="hidden sm:inline">
									Restore
								</span>
							</Button>
						) : null}
					</div>
				</button>

				{isExpanded && (
					<div className="p-4">
						<div className="mb-3">
							<Label className="mb-1 block text-foreground text-sm">
								Description:
							</Label>
							<Textarea
								value={tool.description ?? ""}
								onChange={(e) =>
									onUpdateTool(actualIdx, {
										description: e.target.value,
									})
								}
								disabled={isDeleted}
								rows={2}
								style={{ height: "4rem" }}
								className={`w-full resize-y overflow-y-auto px-2 py-1 text-foreground text-sm ${
									isDeleted
										? "cursor-not-allowed bg-muted opacity-60"
										: ""
								}`}
								placeholder="Describe function purpose and parameters..."
							/>
						</div>

						<div className="w-full overflow-x-auto">
							<div
								className="min-w-full overflow-hidden rounded-lg border"
								style={{
									display: "grid",
									gridTemplateColumns:
										"10% 13% 28% 11% 10% 28%",
									fontSize: "0.813rem",
								}}
							>
								{/* Header Row */}
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Name
								</div>
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Title
								</div>
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Description
								</div>
								<div className="flex items-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Type
								</div>
								<div className="flex items-center justify-center border-border border-r border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Required
								</div>
								<div className="flex items-center border-border border-b bg-muted px-2 py-2 font-semibold text-foreground">
									Default Value
								</div>

								{/* Data Rows */}
								{Object.entries(
									tool.inputSchema.properties,
								).map(([k, p]) => {
									const textKey = `${actualIdx}-${k}`;
									const hasError = jsonErrors[textKey];
									const isRequired =
										tool.inputSchema.required?.includes(
											k,
										) || false;

									return (
										<React.Fragment key={k}>
											<div className="flex w-full items-center border-border border-r border-b bg-card px-2 py-2">
												<div className="min-w-0 flex-1">
													<span
														className="block truncate text-foreground"
														title={k}
													>
														{k}
													</span>
												</div>
											</div>
											<div className="flex items-center border-border border-r border-b bg-card px-2 py-2">
												<Input
													value={p.title}
													onChange={(e) =>
														onUpdateToolProp(
															actualIdx,
															k,
															{
																title: e.target
																	.value,
															},
														)
													}
													disabled={isDeleted}
													className={`w-full px-1.5 py-1 text-foreground text-sm ${
														isDeleted
															? "cursor-not-allowed bg-muted opacity-60"
															: ""
													}`}
												/>
											</div>
											<div className="border-border border-r border-b bg-card px-2 py-2">
												<Textarea
													value={p.description ?? ""}
													onChange={(e) =>
														onUpdateToolProp(
															actualIdx,
															k,
															{
																description:
																	e.target
																		.value,
															},
														)
													}
													disabled={isDeleted}
													rows={2}
													style={{
														height: "3rem",
													}}
													className={`w-full resize-y overflow-y-auto px-1.5 py-1 text-foreground text-xs ${
														isDeleted
															? "cursor-not-allowed bg-muted opacity-60"
															: ""
													}`}
													placeholder="Parameter description..."
												/>
											</div>
											<div className="flex items-center border-border border-r border-b bg-card px-2 py-2">
												<select
													value={p.type}
													onChange={(e) =>
														onTypeChange(
															actualIdx,
															k,
															e.target.value,
														)
													}
													disabled={isDeleted}
													className={`h-[34px] w-full rounded border border-border bg-card px-1.5 text-foreground text-sm ${
														isDeleted
															? "cursor-not-allowed opacity-60"
															: ""
													}`}
												>
													{TYPE_OPTIONS.map((opt) => (
														<option
															key={opt.value}
															value={opt.value}
														>
															{opt.label}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center justify-center border-border border-r border-b bg-card px-2 py-2">
												<label className="flex cursor-pointer items-center gap-2">
													<input
														type="checkbox"
														checked={isRequired}
														onChange={(e) =>
															onRequiredToggle(
																actualIdx,
																k,
																e.target
																	.checked,
															)
														}
														disabled={isDeleted}
														className={`h-4 w-4 rounded border border-border text-primary accent-primary focus:ring-2 focus:ring-ring ${
															isDeleted
																? "cursor-not-allowed opacity-60"
																: "cursor-pointer"
														}`}
													/>
													<span
														className={`text-xs ${
															isRequired
																? "font-semibold text-primary"
																: "text-muted-foreground"
														} ${
															isDeleted
																? "opacity-60"
																: ""
														}`}
													>
														{isRequired
															? "Required"
															: "Optional"}
													</span>
												</label>
											</div>
											{p.type === "array" ||
											p.type === "object" ? (
												<div className="border-border border-b bg-card px-2 py-2">
													<Textarea
														value={getJsonTextValue(
															actualIdx,
															k,
															p.default,
														)}
														onChange={(e) =>
															onJsonTextChange(
																actualIdx,
																k,
																e.target.value,
															)
														}
														disabled={isDeleted}
														rows={3}
														style={{
															height: "4.5rem",
														}}
														className={`w-full resize-y overflow-y-auto px-1.5 py-1 font-mono text-foreground text-xs ${
															hasError
																? "border-destructive ring-destructive/20 focus:border-destructive"
																: "border-border"
														} ${
															isDeleted
																? "cursor-not-allowed bg-muted opacity-60"
																: ""
														}`}
														placeholder={
															p.type === "array"
																? '["item1", "item2"]'
																: '{"key": "value"}'
														}
													/>
													{hasError && (
														<div className="mt-1 flex items-start gap-1 text-destructive text-xs">
															<AlertCircle
																size={12}
																className="mt-0.5 flex-shrink-0"
															/>
															<span>
																{hasError}
															</span>
														</div>
													)}
													{!hasError &&
														p.default !==
															undefined && (
															<div className="mt-1 flex items-center gap-1 text-[color:var(--chart-2)] text-xs">
																<CheckCircle
																	size={12}
																	className="flex-shrink-0"
																/>
																<span>
																	Valid JSON
																</span>
															</div>
														)}
												</div>
											) : (
												<div className="flex items-center border-border border-b bg-card px-2 py-2">
													{p.type === "boolean" ? (
														<select
															value={String(
																p.default,
															)}
															onChange={(e) =>
																onDefaultChange(
																	actualIdx,
																	k,
																	e.target
																		.value,
																	p.type,
																)
															}
															disabled={isDeleted}
															className={`h-[34px] w-full rounded border border-border bg-card px-1.5 text-foreground text-sm ${
																isDeleted
																	? "cursor-not-allowed opacity-60"
																	: ""
															}`}
														>
															<option value="true">
																True
															</option>
															<option value="false">
																False
															</option>
														</select>
													) : (
														<Input
															type={
																p.type ===
																"number"
																	? "number"
																	: "text"
															}
															value={String(
																p.default ?? "",
															)}
															onChange={(e) =>
																onDefaultChange(
																	actualIdx,
																	k,
																	e.target
																		.value,
																	p.type,
																)
															}
															disabled={isDeleted}
															className={`w-full px-1.5 py-1 text-foreground text-sm ${
																isDeleted
																	? "cursor-not-allowed bg-muted opacity-60"
																	: ""
															}`}
														/>
													)}
												</div>
											)}
										</React.Fragment>
									);
								})}
							</div>
						</div>
					</div>
				)}
			</Card>
		);
	},
);

FunctionCard.displayName = "FunctionCard";
