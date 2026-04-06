import { CircleCheck, Eye, EyeOff, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { Env } from "@semoss/sdk/react";
import {
	Box,
	Button,
	IconButton,
	Input,
	InputAdornment,
	Modal,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";

interface StyledPasswordIndicatorProps {
	bgColor?: string;
}

const StyledModelContent = styled(Modal.Content)({
	paddingBottom: 0,
});

const StyledModalTitle = styled(Modal.Title)({
	"&.MuiDialogTitle-root": {
		padding: 0,
	},
	marginBottom: "12px",
});

const StyledTitleTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
	paddingBottom: "16px",
}));

const StyledDiv = styled("div")({
	display: "flex",
	gap: "4px",
	paddingTop: "16px",
	paddingBottom: "16px",
});

const StyledPasswordIndicator = styled("div")<StyledPasswordIndicatorProps>(
	({ bgColor }) => ({
		flex: 1,
		height: "4px",
		width: "106px",
		borderRadius: "8px",
		backgroundColor: bgColor,
		transition: "background-color 0.3s ease",
	}),
);

const StyledValidationBox = styled(Box)({
	mt: 2,
	mb: 2,
});

const StyledValidationTypography = styled(Typography)(({ theme }) => ({
	mb: 1,
	fontWeight: 400,
	color: theme.palette.text.primary,
	fontFamily: "Inter",
	fontSize: "16px",
	fontStyle: "normal",
	lineHeight: "24px",
	letterSpacing: "0.15px",
	paddingBottom: "14px",
}));

const StyledLineBox = styled(Box)(({ theme }) => ({
	borderTop: `1px solid ${theme.palette.divider}`,
	marginBottom: "16px",
}));

const StyledButton = styled(Button)(({ theme }) => ({
	color: theme.palette.text.primary,
	fontSize: "14px",
	fontStyle: "normal",
	fontWeight: 500,
	lineHeight: "20px",
	letterSpacing: "0.4px",
}));

const StyledBox = styled(Box)({
	display: "flex",
	flexDirection: "column",
	gap: "8px",
});

const StyledLabelTypography = styled(Typography)(({ theme }) => ({
	fontWeight: 400,
	color: theme.palette.text.secondary,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiOutlinedInput-root": {
		"&.Mui-error fieldset": { borderColor: theme.palette.error.main },
	},
	marginTop: 0,
}));

const StyledValidationMessage = styled(Typography)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	mb: 0.5,
	color: theme.palette.text.secondary,
	letterSpacing: "0.17px",
	fontSize: "14px",
	fontWeight: 400,
	marginBottom: "14px",
}));

const StyledInput = styled(Input)({
	display: "none",
});

const StyledFooterBox = styled(Box)({
	display: "flex",
	justifyContent: "flex-end",
	gap: 2,
	marginBottom: "16px",
	marginRight: "16px",
});

export const ChangePasswordModal = ({ open, onClose }) => {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [loading, setLoading] = useState(false);
	const notification = useNotification();

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
					headers: {
						"Content-Type": "application/json",
					},
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

			notification.add({
				message: data.message,
				color: "success",
			});

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setShowCurrent(false);
			setShowNew(false);
			setShowConfirm(false);
			onClose();
		} catch (e) {
			notification.add({
				message: e.message || "Network error. Please try again.",
				color: "error",
			});
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

	const renderPasswordField = (
		label: string,
		value: string,
		setValue: (val: string) => void,
		show: boolean,
		setShow: (val: boolean) => void,
		isError?: boolean,
	) => (
		<StyledBox>
			<StyledLabelTypography variant="body2">
				{label}
			</StyledLabelTypography>
			{/* Hidden dummy fields to prevent Chrome autofill */}
			<StyledInput type="text" autoComplete="off" />
			<StyledInput type="password" autoComplete="new-password" />
			<StyledTextField
				type={show ? "text" : "password"}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				fullWidth
				margin="normal"
				error={isError}
				helperText={
					isError
						? label === "New Password" && sameAsCurrent
							? "New password cannot be the same as current password"
							: "The passwords do not match"
						: ""
				}
				FormHelperTextProps={{ sx: { marginLeft: 0 } }}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<Lock color="#666" size={18} />
						</InputAdornment>
					),
					endAdornment: (
						<InputAdornment position="end">
							<IconButton
								onClick={() => setShow(!show)}
								edge="end"
							>
								{show ? (
									<Eye size={18} />
								) : (
									<EyeOff size={18} />
								)}
							</IconButton>
						</InputAdornment>
					),
				}}
			/>
		</StyledBox>
	);

	const renderValidationItem = (label: string, isValid: boolean) => (
		<StyledValidationMessage variant="body2">
			<CircleCheck
				color={isValid ? "green" : "gray"}
				size={16}
				style={{ marginRight: "8px" }}
			/>
			{label}
		</StyledValidationMessage>
	);

	return (
		<Modal open={open} fullWidth>
			<StyledModelContent>
				<StyledModalTitle>
					<Typography variant="h6">Change Password</Typography>
				</StyledModalTitle>
				<StyledTitleTypography variant="body1">
					Your new password must be different from previously used{" "}
					<br />
					passwords.
				</StyledTitleTypography>

				{renderPasswordField(
					"Current Password",
					currentPassword,
					setCurrentPassword,
					showCurrent,
					setShowCurrent,
				)}
				{renderPasswordField(
					"New Password",
					newPassword,
					setNewPassword,
					showNew,
					setShowNew,
					sameAsCurrent,
				)}
				{renderPasswordField(
					"Confirm New Password",
					confirmPassword,
					setConfirmPassword,
					showConfirm,
					setShowConfirm,
					confirmError,
				)}

				{/* Password Strength Indicator */}
				<StyledDiv>
					{["length", "upper", "lower", "number", "special"].map(
						(rule, i) => {
							let bgColor = "#D9D9D9";
							if (i < rulesPassed) {
								if (rulesPassed === 5) bgColor = "green";
								else if (rulesPassed >= 3) bgColor = "orange";
								else bgColor = "red";
							}
							return (
								<StyledPasswordIndicator
									key={rule}
									bgColor={bgColor}
								/>
							);
						},
					)}
				</StyledDiv>

				{/* Validations */}
				<StyledValidationBox>
					<StyledValidationTypography variant="body1">
						Password must contain:
					</StyledValidationTypography>
					{renderValidationItem(
						"8 or more characters",
						validations.length,
					)}
					{renderValidationItem(
						"At least 1 uppercase letter",
						validations.upper,
					)}
					{renderValidationItem(
						"At least 1 lowercase letter",
						validations.lower,
					)}
					{renderValidationItem(
						"At least 1 number",
						validations.number,
					)}
					{renderValidationItem(
						"At least 1 special character",
						validations.special,
					)}
				</StyledValidationBox>
			</StyledModelContent>

			{/* Footer */}
			<StyledLineBox />
			<StyledFooterBox>
				<StyledButton variant="text" size="medium" onClick={onCancel}>
					Cancel
				</StyledButton>
				<Button
					disabled={!allValid || loading}
					variant="contained"
					size="medium"
					onClick={onChangePassword}
					loading={loading}
				>
					Change Password
				</Button>
			</StyledFooterBox>
		</Modal>
	);
};
