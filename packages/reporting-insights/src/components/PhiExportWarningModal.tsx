import { ShieldAlert } from "lucide-react";
import { createPortal } from "react-dom";

interface PhiExportWarningModalProps {
	onConfirm: () => void;
	onCancel: () => void;
}

export function PhiExportWarningModal({
	onConfirm,
	onCancel,
}: PhiExportWarningModalProps) {
	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onCancel}
			/>

			{/* Dialog */}
			<div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
				{/* Warning header */}
				<div className="flex items-start gap-4 border-red-100 border-b bg-red-50 px-6 py-5">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
						<ShieldAlert className="h-5 w-5 text-red-600" />
					</div>
					<div>
						<h2 className="font-semibold text-base text-red-900">
							Sensitive Data Warning
						</h2>
						<p className="mt-0.5 text-red-700 text-sm">
							This visualization is flagged as containing PHI /
							PII.
						</p>
					</div>
				</div>

				{/* Body */}
				<div className="px-6 py-5">
					<p className="text-sm text-stone-600 leading-relaxed">
						Downloading this file will export potentially sensitive
						patient or personal information. Only proceed if you are
						authorized to handle this data in accordance with your
						organization's data privacy policies.
					</p>
				</div>

				{/* Actions */}
				<div className="flex gap-3 px-6 pb-5">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 rounded-lg bg-stone-100 px-4 py-2 font-semibold text-sm text-stone-700 transition-colors hover:bg-stone-200"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-red-700"
					>
						Download Anyway
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
