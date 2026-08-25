import { CircleCheck, Eye, EyeOff, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { Env } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Separator,
	toast,
} from "@semoss/ui/next";

interface PasswordFieldProps {
	label: string;
	value: string;
	setValue: (val: string) => void;
	show: boolean;
	setShow: (val: boolean) => void;
	isError?: boolean;
	errorMessage?: string;
}

const PasswordField = ({
	label,
	value,
	setValue,
	show,
	setShow,
	isError,
	errorMessage,
}: PasswordFieldProps) => (
	<div className="flex flex-col gap-1">
		<span className="text-muted-foreground text-sm">{label}</span>
		{/* Hidden dummy fields to prevent Chrome autofill */}
		<input type="text" autoComplete="off" className="hidden" />
		<input type="password" autoComplete="new-password" className="hidden" />
		<div className="relative">
			<Lock className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
			<Input
				type={show ? "text" : "password"}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className={`pr-9 pl-9 ${isError ? "border-destructive" : ""}`}
				autoComplete="new-password"
			/>
			<Button
				variant="ghost"
				size="icon"
				className="-translate-y-1/2 absolute top-1/2 right-1 size-7"
				onClick={() => setShow(!show)}
				type="button"
			>
				{show ? (
					<Eye className="size-4" />
				) : (
					<EyeOff className="size-4" />
				)}
			</Button>
		</div>
		{isError && errorMessage && (
			<span className="text-destructive text-xs">{errorMessage}</span>
		)}
	</div>
);

const ValidationItem = ({
	label,
	isValid,
}: {
	label: string;
	isValid: boolean;
}) => (
	<div className="mb-3 flex items-center gap-2 text-muted-foreground text-sm">
		<CircleCheck
			className={`size-4 shrink-0 ${isValid ? "text-green-500" : "text-muted-foreground"}`}
		/>
		{label}
	</div>
);

export const ChangePasswordModal = ({ open, onClose }) => {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [loading, setLoading] = useState(false);

	const confirmError =
		confirmPassword.length > 0 && newPassword !== confirmPassword;
	const sameAsCurrent =
		newPassword.length > 0 && currentPassword === newPassword;

	const validations = {
		length: newPassword.length >= 8,
		upper: /[A-Z]/.test(newPassword),
		lower: /[a-z]/.test(newPassword),
		number: /[0-9]/.test(newPassword),
		special: /[^A-Za-z0-9]/.test(newPassword),
		match:
			newPassword === confirmPassword &&
			newPassword.length > 0 &&
			!sameAsCurrent,
	};

	const onCancel = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setShowCurrent(false);
		setShowNew(false);
		setShowConfirm(false);
		onClose();
	};

	const onChangePassword = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${Env.MODULE}/api/auth/user/changePassword`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ currentPassword, newPassword }),
				},
			);

			if (!res.ok) {
				const errBody = await res.json().catch(() => ({}));
				throw new Error(
					errBody?.errorMessage ||
						errBody?.message ||
						"Password change failed",
				);
			}

			const data = await res.json();

			if (!data.success) {
				throw new Error(data.message || "Password change failed");
			}

			toast.success(data.message);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setShowCurrent(false);
			setShowNew(false);
			setShowConfirm(false);
			onClose();
		} catch (e) {
			toast.error(e.message || "Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const allValid =
		validations.length &&
		validations.upper &&
		validations.lower &&
		validations.number &&
		validations.special &&
		validations.match;

	const rulesPassed = useMemo(() => {
		const rules = {
			length: newPassword.length >= 8,
			upper: /[A-Z]/.test(newPassword),
			lower: /[a-z]/.test(newPassword),
			number: /[0-9]/.test(newPassword),
			special: /[^A-Za-z0-9]/.test(newPassword),
		};
		return Object.values(rules).filter(Boolean).length;
	}, [newPassword]);

	const getBarColor = (index: number) => {
		if (index >= rulesPassed) return "var(--border)";
		if (rulesPassed === 5) return "green";
		if (rulesPassed >= 3) return "orange";
		return "red";
	};

	return (
		<Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Change Password</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<p className="text-muted-foreground text-sm">
						Your new password must be different from previously used
						passwords.
					</p>

					<PasswordField
						label="Current Password"
						value={currentPassword}
						setValue={setCurrentPassword}
						show={showCurrent}
						setShow={setShowCurrent}
					/>
					<PasswordField
						label="New Password"
						value={newPassword}
						setValue={setNewPassword}
						show={showNew}
						setShow={setShowNew}
						isError={sameAsCurrent}
						errorMessage="New password cannot be the same as current password"
					/>
					<PasswordField
						label="Confirm New Password"
						value={confirmPassword}
						setValue={setConfirmPassword}
						show={showConfirm}
						setShow={setShowConfirm}
						isError={confirmError}
						errorMessage="The passwords do not match"
					/>

					{/* Password Strength Indicator */}
					<div className="flex gap-1 py-2">
						{["length", "upper", "lower", "number", "special"].map(
							(rule, i) => (
								<div
									key={rule}
									className="h-1 flex-1 rounded-full transition-colors duration-300"
									style={{ backgroundColor: getBarColor(i) }}
								/>
							),
						)}
					</div>

					{/* Validations */}
					<div>
						<p className="mb-3 font-medium text-sm">
							Password must contain:
						</p>
						<ValidationItem
							label="8 or more characters"
							isValid={validations.length}
						/>
						<ValidationItem
							label="At least 1 uppercase letter"
							isValid={validations.upper}
						/>
						<ValidationItem
							label="At least 1 lowercase letter"
							isValid={validations.lower}
						/>
						<ValidationItem
							label="At least 1 number"
							isValid={validations.number}
						/>
						<ValidationItem
							label="At least 1 special character"
							isValid={validations.special}
						/>
					</div>
				</div>

				<Separator />
				<DialogFooter>
					<Button variant="ghost" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						disabled={!allValid || loading}
						onClick={onChangePassword}
					>
						{loading ? "Changing..." : "Change Password"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
