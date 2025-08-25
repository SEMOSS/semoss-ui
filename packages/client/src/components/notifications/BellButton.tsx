import NotificationsIcon from "@mui/icons-material/Notifications";
import { observer } from "mobx-react-lite";
import type React from "react";
import { styled } from "@semoss/ui";

const Button = styled("button")(({ theme }) => ({
  position: "relative",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: theme.spacing(0.75),
  borderRadius: 10,
  "&:hover": { background: theme.palette.action.hover },
}));

const CountBubble = styled("span")(({ theme }) => ({
  position: "absolute",
  bottom: 20,
  left: 15,
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 9,
  background: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  fontSize: 10,
  lineHeight: "18px",
  textAlign: "center",
  fontWeight: 700,
}));

const StyledButton = styled(Button)({
  position: "relative",
});

const NotificationIcon = styled(NotificationsIcon)(({ theme }) => ({
  color: theme.palette.secondary.dark,
}));

export const BellButton: React.FC<{ onClick: () => void; hasUnread: number }> =
  observer(({ onClick, hasUnread }) => (
    <StyledButton onClick={onClick}>
      <NotificationIcon />
      {hasUnread > 0 && (
        <CountBubble>{hasUnread > 99 ? "99+" : hasUnread}</CountBubble>
      )}
    </StyledButton>
  ));
