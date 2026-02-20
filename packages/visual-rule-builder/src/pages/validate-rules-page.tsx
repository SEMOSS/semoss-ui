import jsonLogic from "json-logic-js";
import {
	AlertCircle,
	CheckCircle,
	Code2,
	PlayCircle,
	XCircle,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { databaseStore } from "@/stores/database-store";

interface Rule {
	rule_id: string;
	rule: string;
}

interface ValidationResult {
	rule_id: string;
	rule: string;
	passed: boolean;
	result: unknown;
	error?: string;
}

/**
 * Recursively extracts all variable names from a JSON Logic rule
 */
function extractVariables(
	obj: unknown,
	variables: Set<string> = new Set(),
): Set<string> {
	if (obj === null || obj === undefined) {
		return variables;
	}

	if (typeof obj === "object") {
		if (Array.isArray(obj)) {
			// Process each array element
			for (const item of obj) {
				extractVariables(item, variables);
			}
		} else {
			// Check if this object has a "var" key
			const objRecord = obj as Record<string, unknown>;
			if ("var" in objRecord && typeof objRecord.var === "string") {
				variables.add(objRecord.var);
			}

			// Recursively process all object values
			for (const value of Object.values(objRecord)) {
				extractVariables(value, variables);
			}
		}
	}

	return variables;
}

export const ValidateRulesPage = observer(() => {
	const [rules, setRules] = useState<Rule[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [variables, setVariables] = useState<string[]>([]);
	const [formData, setFormData] = useState<Record<string, string>>({});
	const [isValidating, setIsValidating] = useState(false);
	const [validationResults, setValidationResults] = useState<
		ValidationResult[]
	>([]);
	const [showResults, setShowResults] = useState(false);

	const selectedDatabaseId = databaseStore.selectedDatabaseId;

	// Fetch rules from database
	useEffect(() => {
		const fetchRules = async () => {
			if (!selectedDatabaseId) {
				setError("Please select a database from the Dashboard first.");
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const query = `Database(database = "${selectedDatabaseId}")|Query("<encode> SELECT rule_id, rule FROM rule </encode>")|Collect(-1);`;
				const response = await runPixel(query);

				if (response.pixelReturn?.[0]) {
					const { operationType, output } = response.pixelReturn[0];

					if (operationType.includes("ERROR")) {
						const errorMessage =
							typeof output === "object" &&
							output !== null &&
							"message" in output
								? String(output.message)
								: "Failed to fetch rules";
						throw new Error(errorMessage);
					}

					// Extract data from output
					let data: Array<
						Array<{ type?: string; value: string } | string>
					> = [];

					if (
						output &&
						typeof output === "object" &&
						"data" in output &&
						output.data &&
						typeof output.data === "object" &&
						"values" in output.data &&
						Array.isArray(
							(output.data as { values?: unknown }).values,
						)
					) {
						data = (
							output.data as {
								values: Array<
									Array<
										| { type?: string; value: string }
										| string
									>
								>;
							}
						).values;
					}

					// Transform the data into Rule objects
					const rulesData: Rule[] = data.map((row) => {
						const getRuleValue = (
							cell: { type?: string; value: string } | string,
						): string => {
							if (typeof cell === "string") return cell;
							if (
								cell &&
								typeof cell === "object" &&
								"value" in cell
							) {
								return String(cell.value);
							}
							return "";
						};

						return {
							rule_id: getRuleValue(row[0]),
							rule: getRuleValue(row[1]),
						};
					});

					setRules(rulesData);

					// Extract all unique variables from all rules
					const allVariables = new Set<string>();
					for (const rule of rulesData) {
						try {
							const parsedRule = JSON.parse(rule.rule);
							extractVariables(parsedRule, allVariables);
						} catch (err) {
							console.error(
								`Failed to parse rule ${rule.rule_id}:`,
								err,
							);
						}
					}

					const sortedVariables = Array.from(allVariables).sort();
					setVariables(sortedVariables);

					// Initialize form data with empty strings
					const initialFormData: Record<string, string> = {};
					for (const variable of sortedVariables) {
						initialFormData[variable] = "";
					}
					setFormData(initialFormData);
				}
			} catch (err) {
				console.error("Error fetching rules:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch rules",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRules();
	}, [selectedDatabaseId]);

	const handleInputChange = (variable: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[variable]: value,
		}));
	};

	const handleValidateRules = () => {
		setIsValidating(true);
		const results: ValidationResult[] = [];

		// Convert form data to proper data structure for JSON Logic
		// Handle nested paths like "field.HeadachesMigrainesMigraineVeryProstratingProlongedAttacks"
		const dataForValidation: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(formData)) {
			const parts = key.split(".");
			let current = dataForValidation;

			// Build nested structure
			for (let i = 0; i < parts.length - 1; i++) {
				if (!(parts[i] in current)) {
					current[parts[i]] = {};
				}
				current = current[parts[i]] as Record<string, unknown>;
			}

			// Try to parse value as JSON, number, or keep as string
			let parsedValue: unknown = value;
			if (value === "true") parsedValue = true;
			else if (value === "false") parsedValue = false;
			else if (value && !Number.isNaN(Number(value))) {
				parsedValue = Number(value);
			}

			current[parts[parts.length - 1]] = parsedValue;
		}

		// Validate each rule
		for (const rule of rules) {
			try {
				const parsedRule = JSON.parse(rule.rule);
				const result = jsonLogic.apply(parsedRule, dataForValidation);

				results.push({
					rule_id: rule.rule_id,
					rule: rule.rule,
					passed: Boolean(result),
					result: result,
				});
			} catch (err) {
				results.push({
					rule_id: rule.rule_id,
					rule: rule.rule,
					passed: false,
					result: null,
					error:
						err instanceof Error
							? err.message
							: "Validation failed",
				});
			}
		}

		setValidationResults(results);
		setShowResults(true);
		setIsValidating(false);
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="font-bold text-3xl tracking-tight">
					Validate Rules
				</h1>
				<p className="text-muted-foreground">
					Enter values for all variables and test rules against them.
				</p>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{isLoading ? (
				<div className="flex items-center gap-2 rounded-lg border p-8">
					<Spinner className="h-4 w-4" />
					<span className="text-muted-foreground text-sm">
						Loading rules and extracting variables...
					</span>
				</div>
			) : rules.length === 0 ? (
				<Alert>
					<AlertDescription>
						No rules found. Please add rules from the Rules page
						first.
					</AlertDescription>
				</Alert>
			) : (
				<>
					<div className="rounded-lg border bg-card shadow-sm">
						<div className="border-b bg-muted/50 px-6 py-4">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="font-semibold text-lg">
										Test Data
									</h2>
									<p className="text-muted-foreground text-sm">
										Found {variables.length} unique
										variable(s) across {rules.length}{" "}
										rule(s)
									</p>
								</div>
								<div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5">
									<Code2 className="h-4 w-4 text-primary" />
									<span className="font-medium text-primary text-sm">
										{variables.length} Fields
									</span>
								</div>
							</div>
						</div>

						<div className="p-6">
							{variables.length === 0 ? (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										No variables found in the rules.
									</AlertDescription>
								</Alert>
							) : (
								<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
									{variables.map((variable) => (
										<div
											key={variable}
											className="space-y-2"
										>
											<Label
												htmlFor={variable}
												className="font-medium text-sm"
											>
												<span className="font-mono text-muted-foreground text-xs">
													{variable}
												</span>
											</Label>
											<Input
												id={variable}
												value={formData[variable] || ""}
												onChange={(e) =>
													handleInputChange(
														variable,
														e.target.value,
													)
												}
												placeholder="Enter value..."
												className="font-mono"
											/>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{variables.length > 0 && (
						<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
							<div className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">
									Ready to validate {rules.length} rule(s)
								</span>
							</div>
							<Button
								onClick={handleValidateRules}
								disabled={isValidating}
								size="lg"
								className="shadow-sm"
							>
								{isValidating ? (
									<>
										<Spinner className="mr-2 h-4 w-4" />
										Validating...
									</>
								) : (
									<>
										<PlayCircle className="mr-2 h-4 w-4" />
										Validate All Rules
									</>
								)}
							</Button>
						</div>
					)}
				</>
			)}

			{/* Results Dialog */}
			<Dialog open={showResults} onOpenChange={setShowResults}>
				<DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden p-0">
					<DialogHeader className="border-b px-6 py-4">
						<DialogTitle className="text-xl">
							Validation Results
						</DialogTitle>
						<DialogDescription>
							Results of validating {validationResults.length}{" "}
							rule(s) against the provided values
						</DialogDescription>
					</DialogHeader>

					<div className="overflow-auto px-6 py-4">
						<div className="mb-6 grid gap-4 md:grid-cols-2">
							<div className="flex items-center gap-3 rounded-lg border bg-green-50 p-4 shadow-sm">
								<div className="rounded-full bg-green-100 p-2">
									<CheckCircle className="h-5 w-5 text-green-600" />
								</div>
								<div>
									<p className="font-semibold text-2xl text-green-900">
										{
											validationResults.filter(
												(r) => r.passed,
											).length
										}
									</p>
									<p className="text-green-700 text-sm">
										Passed
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-lg border bg-red-50 p-4 shadow-sm">
								<div className="rounded-full bg-red-100 p-2">
									<XCircle className="h-5 w-5 text-red-600" />
								</div>
								<div>
									<p className="font-semibold text-2xl text-red-900">
										{
											validationResults.filter(
												(r) => !r.passed,
											).length
										}
									</p>
									<p className="text-red-700 text-sm">
										Failed
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-lg border shadow-sm">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/50">
										<TableHead className="w-[120px] font-semibold">
											Status
										</TableHead>
										<TableHead className="w-[250px] font-semibold">
											Rule ID
										</TableHead>
										<TableHead className="font-semibold">
											Rule Output
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{validationResults.map((result, index) => (
										<TableRow
											key={result.rule_id}
											className={
												index % 2 === 0
													? "bg-background"
													: "bg-muted/20"
											}
										>
											<TableCell>
												{result.passed ? (
													<div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-green-700">
														<CheckCircle className="h-3.5 w-3.5" />
														<span className="font-medium text-xs">
															Passed
														</span>
													</div>
												) : (
													<div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-red-700">
														<XCircle className="h-3.5 w-3.5" />
														<span className="font-medium text-xs">
															Failed
														</span>
													</div>
												)}
											</TableCell>
											<TableCell className="font-medium font-mono text-sm">
												{result.rule_id}
											</TableCell>
											<TableCell>
												{result.error ? (
													<div className="flex items-start gap-2 rounded-md bg-red-50 p-3">
														<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
														<span className="text-red-700 text-sm">
															{result.error}
														</span>
													</div>
												) : (
													<div className="rounded-lg bg-primary/10 px-4 py-3">
														<span className="font-semibold text-lg text-primary">
															{typeof result.result ===
															"string"
																? result.result
																: JSON.stringify(
																		result.result,
																	)}
														</span>
													</div>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
});
