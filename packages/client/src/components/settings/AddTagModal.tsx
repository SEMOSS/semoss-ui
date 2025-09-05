import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Button,
	CircularProgress,
	Modal,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { addGitTag } from "@/api";
import { useWorkspace } from "@/hooks";
import type { AddTagModalProps } from "@/types/types";

// Styled Components
const StyledModal = styled(Modal)(() => ({
	// Ensure modal doesn't shift on validation errors
	minHeight: "300px",
}));

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
	width: "400px",
	minHeight: "200px", // Reserve space for validation messages
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const StyledForm = styled("form")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	flex: 1,
}));

const StyledLoadingRow = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
}));

/**
 * Modal component for adding tags to application versions
 * @param props - Component props
 * @param props.open - Controls modal visibility
 * @param props.onClose - Callback function when modal closes
 * @param props.version - Version object containing commit information
 * @param props.projectId - ID of the project to add tag to
 * @param props.existingTags - Array of existing tags for duplicate validation
 * @param props.onTagAdded - Callback function when tag is successfully added
 * @returns React functional component
 */
export const AddTagModal: React.FC<AddTagModalProps> = ({
	open,
	onClose,
	version,
	projectId,
	existingTags,
	onTagAdded,
}) => {
	const { workspace } = useWorkspace();
	const notification = useNotification();

	const [isLoading, setIsLoading] = useState(false);
	const [tagName, setTagName] = useState("");
	const [hasUserInteracted, setHasUserInteracted] = useState(false);

	/**
	 * Effect to reset form state when modal opens/closes
	 * Clears the tag name input when modal is opened
	 */
	// Reset form when modal opens/closes
	useEffect(() => {
		if (open) {
			setTagName("");
			setHasUserInteracted(false);
		}
	}, [open]);

	/**
	 * Checks if the provided tag name already exists (case-insensitive comparison)
	 */
	const isTagDuplicate = useCallback(
		(tagName: string): boolean => {
			if (!tagName.trim()) return false;
			const isDuplicate = existingTags.some(
				(existingTag) =>
					existingTag.toLowerCase() === tagName.toLowerCase(),
			);
			return isDuplicate;
		},
		[existingTags],
	);

	/**
	 * Comprehensive validation function for tag names
	 */
	const validateTag = useCallback(
		(tagName: string): { isValid: boolean; errors: string[] } => {
			const trimmed = tagName?.trim();
			const errors: string[] = [];

			if (!trimmed) {
				// Show required message for empty input
				errors.push("Tag name is required");
				return { isValid: false, errors };
			}

			// Length validation
			if (trimmed.length < 2) {
				errors.push("Tag must be at least 2 characters long");
			}

			if (trimmed.length > 50) {
				errors.push("Tag must be less than 50 characters");
			}

			// Pattern validation - only alphanumeric, hyphens, underscores
			const validPattern = /^[a-zA-Z0-9_-]+$/;
			if (!validPattern.test(trimmed)) {
				errors.push(
					"Tag can only contain letters, numbers, hyphens, and underscores",
				);
			}

			// Duplicate validation
			if (isTagDuplicate(trimmed)) {
				errors.push("This tag already exists for this app");
			}

			return { isValid: errors.length === 0, errors };
		},
		[isTagDuplicate],
	);

	// Check if form is valid for submission
	const isFormValid = useMemo(() => {
		const { isValid } = validateTag(tagName);
		return isValid;
	}, [tagName, validateTag]);

	// Get current validation message for display
	const getValidationMessage = useCallback(
		(value: string): string => {
			// Only show validation errors if user has interacted with the field
			if (!hasUserInteracted && !value.trim()) {
				return ""; // Don't show required message until user has tried to type
			}

			const { errors } = validateTag(value);
			return errors[0] || ""; // Show first error only
		},
		[validateTag, hasUserInteracted],
	);

	/**
	 * Handles the tag addition process including API call and error handling
	 */
	const handleAddTagClick = async () => {
		const trimmedTagName = tagName?.trim();

		if (!trimmedTagName) {
			return;
		}

		if (isTagDuplicate(trimmedTagName)) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await addGitTag(
				projectId,
				version.commitId,
				trimmedTagName,
				workspace.insightId,
			);

			if (response.hasError) {
				notification.add({
					color: "error",
					message: `Failed to add tag "${trimmedTagName}"`,
				});
			} else {
				notification.add({
					color: "success",
					message: `Successfully added tag "${trimmedTagName}"`,
				});
				onTagAdded(trimmedTagName);
				onClose();
			}
		} catch {
			notification.add({
				color: "error",
				message: `Failed to add tag "${trimmedTagName}"`,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			onClose();
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isFormValid && !isLoading) {
			handleAddTagClick();
		}
	};

	return (
		<StyledModal open={open} onClose={handleClose} maxWidth="sm">
			<Modal.Title>
				<Typography variant="h6">Add Tag</Typography>
			</Modal.Title>

			<StyledModalContent>
				<Typography variant="body2" color="text.secondary">
					Adding tag to commit: {version.commitId}
				</Typography>

				<StyledForm onSubmit={handleFormSubmit}>
					<TextField
						label="Tag Name"
						variant="outlined"
						fullWidth
						value={tagName}
						onChange={(e) => {
							setTagName(e.target.value);
							if (!hasUserInteracted) {
								setHasUserInteracted(true);
							}
						}}
						disabled={isLoading}
						error={!!getValidationMessage(tagName)}
						helperText={getValidationMessage(tagName) || " "} // Reserve space with non-breaking space
						placeholder="Enter tag name..."
					/>
				</StyledForm>
			</StyledModalContent>

			<Modal.Actions>
				<Button
					variant="outlined"
					onClick={handleClose}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleAddTagClick}
					disabled={!isFormValid || isLoading}
					startIcon={
						isLoading ? <CircularProgress size="1em" /> : undefined
					}
				>
					{isLoading ? (
						<StyledLoadingRow>Adding...</StyledLoadingRow>
					) : (
						"Add Tag"
					)}
				</Button>
			</Modal.Actions>
		</StyledModal>
	);
};
