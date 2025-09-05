import CloseIcon from "@mui/icons-material/Close";
import {
	IconButton,
	DialogTitle as MuiModalTitle,
	type SxProps,
	styled,
} from "@mui/material";

export interface ModalTitleProps {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;

  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps;

  onClose?: (() => void) | undefined;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: 8,
  top: 8,
  color: theme.palette.grey[900],
}));

export const ModalTitle: React.FC<ModalTitleProps> = ({
  sx,
  children,
  onClose,
  ...otherProps
}) => {
  return (
    <MuiModalTitle sx={{ padding: "8px 16px", ...(sx || {}) }} {...otherProps}>
      {children}
      {onClose && (
        <StyledIconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </StyledIconButton>
      )}
    </MuiModalTitle>
  );
};
