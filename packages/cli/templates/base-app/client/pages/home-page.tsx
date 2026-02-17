import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Button } from "@/components/button";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
} from "@/components/field";
import { Input } from "@/components/input";
import { toast } from "@/components/sonner";
import { Spinner } from "@/components/spinner";

/**
 * Renders the home page, currently displaying an example component.
 *
 * @component
 */
export const HomePage = () => {
	useEffect(() => {
		const setContext = async () => {
			try {
				const { insightId: iId } = await runPixel(
					`SetContext("${import.meta.env.APP}")`,
					"new",
				);
				setInsightId(iId);
			} catch (error) {
				toast.error(`Error setting context: ${error.message}`);
			}
		};
		setContext();
	}, []);

	const [insightId, setInsightId] = useState<string>("");
	const [input, setInput] = useState<string>("");
	const [response, setResponse] = useState<string>("");
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [greeting, setGreeting] = useState<string>("");
	const [isLoadingGreeting, setIsLoadingGreeting] = useState<boolean>(false);

	const handleFetchGreeting = async () => {
		if (!insightId) {
			toast.error("Context not set yet");
			return;
		}

		setIsLoadingGreeting(true);
		try {
			const result = await runPixel<[string]>("HelloUser()", insightId);
			setGreeting(result.pixelReturn[0].output ?? "");
		} catch (error) {
			toast.error(`Error calling HelloUser pixel: ${error.message}`);
		} finally {
			setIsLoadingGreeting(false);
		}
	};

	const handleRunFibonacci = async () => {
		if (!input) {
			toast.error("Please enter a number");
			return;
		}

		setIsRunning(true);
		try {
			const { pixelReturn } = await runPixel<[string]>(
				`CallPython(numValue=["${input}"])`,
				insightId,
			);

			setResponse(pixelReturn[0].output ?? "");
		} catch (error) {
			toast.error(
				`Error running Fibonacci calculation. ${error.message}`,
			);
		} finally {
			setIsRunning(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
			<div className="w-full max-w-2xl space-y-8">
				{/* Header Section */}
				<div className="space-y-4 text-center">
					<h1 className="font-bold text-5xl text-foreground">
						Welcome to SEMOSS
					</h1>
					<p className="text-lg text-muted-foreground">
						A powerful starting point for your SEMOSS application
					</p>
				</div>

				{/* Main Content Cards */}
				<div className="space-y-6">
					{/* HelloUser Card */}
					<div className="rounded-lg border border-border bg-card p-6">
						<div className="space-y-4">
							<div>
								<h2 className="mb-2 font-semibold text-card-foreground text-xl">
									Pixel Example: HelloUser()
								</h2>
								<p className="text-muted-foreground text-sm">
									Click to fetch a personalized greeting from
									the HelloUser pixel
								</p>
							</div>
							<div className="flex items-center justify-between">
								<Button
									onClick={handleFetchGreeting}
									disabled={isLoadingGreeting}
								>
									{isLoadingGreeting ? (
										<div className="flex items-center gap-2">
											<Spinner className="h-4 w-4" />
											Loading...
										</div>
									) : (
										"Fetch Greeting"
									)}
								</Button>
								{greeting && (
									<p className="font-medium text-black">
										✓ {greeting}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Fibonacci Card */}
					<div className="rounded-lg border border-border bg-card p-6">
						<div className="space-y-4">
							<div>
								<h2 className="mb-2 font-semibold text-card-foreground text-xl">
									Calculate Fibonacci
								</h2>
								<p className="text-muted-foreground text-sm">
									Enter a number and calculate its Fibonacci
									value using Python
								</p>
							</div>
							<div className="flex items-end gap-3">
								<Field className="flex-1">
									<FieldLabel htmlFor="fibonacci-input">
										Enter Number
									</FieldLabel>
									<FieldDescription>
										Provide a number to calculate its
										Fibonacci value
									</FieldDescription>
									<FieldContent>
										<Input
											id="fibonacci-input"
											value={input}
											onChange={(e) =>
												setInput(
													e.target.value?.replace(
														/\D/g,
														"",
													),
												)
											}
											placeholder="e.g., 10"
											disabled={isRunning}
										/>
									</FieldContent>
								</Field>
								<Button
									onClick={handleRunFibonacci}
									disabled={isRunning || !input}
								>
									{isRunning ? (
										<div className="flex items-center gap-2">
											<Spinner className="h-4 w-4" />
											Computing...
										</div>
									) : (
										"Calculate"
									)}
								</Button>
							</div>
							{response && (
								<div className="mt-4 rounded-lg border border-border bg-secondary p-4">
									<p className="text-secondary-foreground text-sm">
										Result:
									</p>
									<p className="font-mono font-semibold text-lg text-secondary-foreground">
										{response}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
