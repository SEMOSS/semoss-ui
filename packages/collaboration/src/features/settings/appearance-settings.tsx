import { useId, useState } from "react";
import {
	Alert,
	AlertDescription,
	Card,
	H2,
	Label,
	P,
	RadioGroup,
	RadioGroupItem,
	useTheme,
} from "@semoss/ui/next";

/** Uses the app's existing persisted theme, including the system preference. */
export function AppearanceSettings() {
	const { theme, setTheme } = useTheme();
	const [error, setError] = useState("");
	const id = useId();
	return (
		<section className="min-w-0" aria-labelledby={`${id}-title`}>
			<Card className="gap-0 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={`${id}-title`} className="font-medium text-xl">
						Appearance
					</H2>
					<P className="text-base text-muted-foreground">
						Choose how Collaboration looks. Changes apply
						immediately and are saved in this browser.
					</P>
				</header>
				<RadioGroup
					aria-label="Theme"
					value={theme}
					className="gap-0 divide-y divide-border"
					onValueChange={(value) => {
						if (
							value !== "light" &&
							value !== "dark" &&
							value !== "system"
						)
							return;
						try {
							setTheme(value);
							setError("");
						} catch {
							setError(
								"Your theme could not be saved in this browser. Allow browser storage and try again.",
							);
						}
					}}
				>
					{[
						{
							value: "light",
							label: "Light",
							description:
								"A light background for your workspace.",
						},
						{
							value: "dark",
							label: "Dark",
							description:
								"A dark background for your workspace.",
						},
						{
							value: "system",
							label: "System",
							description:
								"Follow your device’s appearance setting.",
						},
					].map(({ value, label, description }) => (
						<Label
							key={value}
							htmlFor={`${id}-${value}`}
							className="flex min-h-16 cursor-pointer items-center gap-4 py-4"
						>
							<RadioGroupItem
								className="border-muted-foreground"
								id={`${id}-${value}`}
								value={value}
								aria-labelledby={`${id}-${value}-label`}
								aria-describedby={`${id}-${value}-description`}
							/>
							<span className="min-w-0 space-y-1">
								<span
									id={`${id}-${value}-label`}
									className="block font-medium text-base"
								>
									{label}
								</span>
								<span
									id={`${id}-${value}-description`}
									className="block font-normal text-base text-muted-foreground"
								>
									{description}
								</span>
							</span>
						</Label>
					))}
				</RadioGroup>
				{error && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</Card>
		</section>
	);
}
