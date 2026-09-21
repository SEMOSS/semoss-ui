interface UndoBannerProps {
	onUndo: () => void;
	onDismiss: () => void;
}

export function UndoBanner({ onUndo, onDismiss }: UndoBannerProps) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs dark:bg-amber-900/20">
			<span className="text-amber-700 dark:text-amber-400">
				AI updated your automation.
			</span>
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onUndo}
					className="font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-400"
				>
					Undo
				</button>
				<button
					type="button"
					onClick={onDismiss}
					className="text-amber-600 hover:text-amber-900 dark:text-amber-400"
					aria-label="Dismiss"
				>
					✕
				</button>
			</div>
		</div>
	);
}
