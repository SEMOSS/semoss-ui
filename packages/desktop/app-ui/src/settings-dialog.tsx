import type { Theme } from "@semoss/ui/next";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useTheme,
} from "@semoss/ui/next";
import { ConnectionsPage } from "./connections-page";
import { LocalFilesSettings } from "./local-fs/local-files-settings";

const THEME_OPTIONS: Theme[] = ["light", "dark", "system"];

export type SettingsTab = "appearance" | "localFiles" | "account";

export interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultTab?: SettingsTab;
}

export const SettingsDialog = ({
	open,
	onOpenChange,
	defaultTab = "appearance",
}: SettingsDialogProps) => {
	const { theme, setTheme } = useTheme();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue={defaultTab}>
					<TabsList>
						<TabsTrigger value="appearance">Appearance</TabsTrigger>
						<TabsTrigger value="localFiles">
							Local Files
						</TabsTrigger>
						<TabsTrigger value="account">Account</TabsTrigger>
					</TabsList>
					<TabsContent
						value="appearance"
						className="flex flex-col gap-4 pt-2"
					>
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-medium text-sm">Theme</p>
								<p className="text-muted-foreground text-xs">
									Choose how AI Core Playground looks.
								</p>
							</div>
							<div className="flex gap-1 rounded-md border border-border p-1">
								{THEME_OPTIONS.map((option) => (
									<Button
										key={option}
										size="sm"
										variant={
											theme === option
												? "default"
												: "ghost"
										}
										className="capitalize"
										onClick={() => setTheme(option)}
									>
										{option}
									</Button>
								))}
							</div>
						</div>
					</TabsContent>
					<TabsContent value="localFiles">
						<LocalFilesSettings />
					</TabsContent>
					<TabsContent value="account" className="pt-2">
						<ConnectionsPage variant="compact" />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
