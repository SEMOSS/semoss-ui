import { Close } from "@mui/icons-material";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  styled,
  Tab,
  Tabs,
  Typography,
} from "@semoss/ui";

// Dummy Notification type
interface Notification {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
}

// Dummy API to fetch notifications
const getNotifications = async (): Promise<Notification[]> => {
  // Simulate network delay and data
  await new Promise((res) => setTimeout(res, 200));
  return [
    {
      id: "1",
      title: "Mansoor has requested Author permissions on Chatmeapp",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: "2",
      title: "Ramesh has requested Editor permissions on Aegis Assistant",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: "3",
      title: "Surya has requested Author permissions on AI Force N7 Boy",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: "4",
      title: "Pranalee has been added as Author to AR Diet App by Ramesh",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ];
};

const Backdrop = styled("div")({
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 1200,
  display: "flex",
  justifyContent: "flex-end",
});

const Panel = styled("div")(({ theme }) => ({
  width: 537,
  maxWidth: "90vw",
  height: "100%",
  background: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
}));

const Header = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 0, 1, 0),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  margin: theme.spacing(0, 3, 0, 3),
}));

const List = styled("div")(({ theme }) => ({
  flex: 1,
  overflow: "auto",
  height: "60px",
  margin: theme.spacing(1, 3, 1, 3),
}));

// const Item = styled("div")(({ theme }) => ({
//   padding: theme.spacing(1.5, 2),
//   background: theme.palette.background.paper,
//   cursor: "pointer",
//   "&:hover": { background: theme.palette.action.hover },
// }));
const Item = styled("div")(({ theme }) => ({
  height: 76,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: 16,
  fontSize: 14,
  marginBottom: 8,
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper, // default (unread)
  cursor: "pointer",

  // when read=true
  '&[data-read="true"]': {
    background: "#F5F9FE",
  },

  "&:hover": {
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
}));

const StyledIconButton = styled(IconButton)({
  "& .MuiSvgIcon-root": {
    width: "20px",
    height: "20px",
  },
});

const Wrap = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: "#fff",
  padding: theme.spacing(1, 0, 1, 0),
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  margin: theme.spacing(0, 3, 0, 3),
}));

const SegmentedTabs = styled(Tabs)(({ theme }) => ({
  height: 36,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 1.5 || 12,
  overflow: "hidden",
  minHeight: 36,
  "& .MuiTabs-indicator": { display: "none" },
  "& .MuiTabs-flexContainer": {
    height: "100%",
  },
}));

// Figma (each pill): width fit-content, height 36, padding 6px 16px
const PillTab = styled(Tab)(({ theme }) => ({
  minWidth: "auto", // let it shrink to content (fit-content behavior)
  width: "auto",
  height: 36,
  minHeight: 36,
  padding: "6px 16px",
  textTransform: "none",
  fontWeight: 500,
  lineHeight: 1,
  color: theme.palette.text.secondary,
  borderRight: `1px solid ${theme.palette.divider}`, // divider between pills
  borderRadius: 0, // rounded only on the group’s outer edges
  "&:last-of-type": { borderRight: "none" },
  "&:hover": { backgroundColor: theme.palette.action.hover },
  "&.Mui-selected": {
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.action.selected,
  },
  transition: theme.transitions.create(["background-color", "color"], {
    duration: theme.transitions.duration.shorter,
  }),
}));

const ClearButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 600,
  color: theme.palette.primary.main,
  minWidth: 0,
  "&:hover": { backgroundColor: "transparent" },
}));

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(2),
}));

export const NotificationDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedTab, setSelectedTab] = useState<"all" | "read" | "unread">(
    "all"
  );

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    getNotifications().then((data) => {
      if (mounted) setNotifications(data);
    });
    return () => {
      mounted = false;
    };
  }, [open]);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const displayedNotifications =
    selectedTab === "all"
      ? notifications
      : selectedTab === "unread"
      ? unreadNotifications
      : readNotifications;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue as "all" | "unread" | "read");
  };

  const markAllRead = () => {
    setNotifications((nots) => nots.map((n) => ({ ...n, read: true })));
  };

  if (!open) return null;

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          <Stack direction="row" spacing={1}>
            <StyledIconButton onClick={onClose}>
              <Close />
            </StyledIconButton>
          </Stack>
        </Header>
        <Wrap>
          <SegmentedTabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="Notification filters"
          >
            <PillTab label="All" value="all" />
            <PillTab label="Read" value="read" />
            <PillTab
              label="Unread(3)"
              // {`Unread${unreadCount ? `(${unreadCount})` : ""}`}
              value="unread"
            />
          </SegmentedTabs>

          <ClearButton size="small" onClick={markAllRead} variant="outlined">
            Clear All
          </ClearButton>
        </Wrap>
        <List>
          {displayedNotifications.length === 0 ? (
            <Box>
            <strong>Mansoor</strong> has requested <strong>Author</strong> permissions on <strong>ChatApp</strong> <br />Today, 10:30 AM
            </Box>
          ) : (
            displayedNotifications.map((n, i) => (
              <Item key={n.id ?? i} data-read={!n.read}>
                <Typography variant="body1" fontWeight={n.read ? 400 : 700}>
                  {n.title}
                </Typography>
                {n.body && <Typography variant="body2">{n.body}</Typography>}
                {n.createdAt && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.createdAt).toLocaleString()}
                  </Typography>
                )}
              </Item>
            ))
          )}
        </List>
      </Panel>
    </Backdrop>
  );
};
