import { useId, useState } from "react";
import {
	Alert,
	AlertDescription,
	Card,
	H2,
	H3,
	Label,
	P,
	RadioGroup,
	RadioGroupItem,
	useTheme,
} from "@semoss/ui/next";
import {
	saveTypeface,
	TYPEFACES,
	type Typeface,
	useTypeface,
} from "@/lib/typeface";

const TYPEFACE_OPTIONS: Record<
	Typeface,
	{ label: string; description: string }
> = {
	calm: {
		label: "Calm",
		description: "Serif headings with a soft sans for reading.",
	},
	standard: {
		label: "Standard",
		description: "The standard SEMOSS font.",
	},
};

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
							description: "A light background.",
						},
						{
							value: "dark",
							label: "Dark",
							description: "A dark background.",
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
				<TypefaceSettings />
			</Card>
		</section>
	);
}

/** The font is one switch so it can go back to the standard font without a code change. */
function TypefaceSettings() {
	const typeface = useTypeface();
	const [error, setError] = useState("");
	const id = useId();
	return (
		<div className="mt-6 border-t pt-4">
			<H3 id={`${id}-title`} className="font-medium text-base">
				Font
			</H3>
			<RadioGroup
				aria-labelledby={`${id}-title`}
				value={typeface}
				className="gap-0 divide-y divide-border"
				onValueChange={(value) => {
					if (!TYPEFACES.includes(value as Typeface)) return;
					try {
						saveTypeface(value as Typeface);
						setError("");
					} catch {
						setError(
							"Your font could not be saved in this browser. Allow browser storage and try again.",
						);
					}
				}}
			>
				{TYPEFACES.map((value) => (
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
								{TYPEFACE_OPTIONS[value].label}
							</span>
							<span
								id={`${id}-${value}-description`}
								className="block font-normal text-base text-muted-foreground"
							>
								{TYPEFACE_OPTIONS[value].description}
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
		</div>
	);
}
