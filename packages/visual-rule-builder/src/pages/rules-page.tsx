import { Pencil } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { databaseStore } from "@/stores/database-store";
import { ruleStore } from "@/stores/rule-store";

interface Rule {
	rule_id: string;
	rule: string;
}

export const RulesPage = observer(() => {
	const navigate = useNavigate();
	const [rules, setRules] = useState<Rule[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedDatabaseId = databaseStore.selectedDatabaseId;

	const handleEditRule = (rule: Rule) => {
		ruleStore.setSelectedRule(rule);
		navigate(`/visualize-rules/${rule.rule_id}`);
	};

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
						// Handle both object format {type, value} and plain strings
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

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Rules</h1>
				<p className="text-muted-foreground">
					Manage and view rules from the selected database.
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
						Loading rules...
					</span>
				</div>
			) : (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Rule ID</TableHead>
								<TableHead>Rule</TableHead>
								<TableHead className="w-[100px]">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rules.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="h-24 text-center"
									>
										No rules found.
									</TableCell>
								</TableRow>
							) : (
								rules.map((rule) => (
									<TableRow key={rule.rule_id}>
										<TableCell className="font-medium">
											{rule.rule_id}
										</TableCell>
										<TableCell>{rule.rule}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleEditRule(rule)
												}
											>
												<Pencil className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
});
