import { Search as SearchIcon } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
  Container,
  InputAdornment,
  Stack,
  styled,
  TextField,
} from "@semoss/ui";
import { usePage } from "@/hooks";
import { BellButton } from "../notifications/BellButton";
import { NotificationDrawer } from "../notifications/NotificationDrawer";
import { Search } from "./Search";

const StyledNavbar = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "0",
  height: theme.spacing(7),
  width: "100%",
  borderBottom: "1px solid #EAEAEE",
  background: "#FAFAFA", //"var(--Background-Paper-2, #FAFAFA)",
  color: theme.palette.text.primary,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 0,
  padding: theme.spacing(0, 4),
}));

const StyledLeft = styled(Stack) ({
  minWidth: 0,
});

const StyledContainer = styled(Container) ({
  maxWidth: "720px"
});

const StyledTextField = styled(TextField)(() => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  alignSelf: "center",
  "& .MuiOutlinedInput-root": {
    padding: "0px 12px",
    borderRadius: "8px",
    //border: "1px solid  #C4C4C4",
  },
  "& .MuiOutlinedInput-root > input": {
    paddingLeft: "0px",
    paddingRight: "0px",
  },
}));


export const Navbar: React.FC = observer(() => {
  const { page } = usePage();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<number>(0);

useEffect(() => {
  async function poll() {
    try {
      const pixel = `PollingNotifications()`;
      const res = await runPixel(pixel);
      const num = res.pixelReturn[0].output;
      setHasUnread(num as number);
    } catch (e) {
      console.error("Pixel call failed:", e);
    }
  }

  poll(); // initial call
  const pollInterval = setInterval(poll, 60000); // every 1 min

  return () => {
    clearInterval(pollInterval);
  };
}, []);


  const handleBellClick = () => {
    setDrawerOpen(true);
    setHasUnread(0);
  };

  return (
    <StyledNavbar ref={(n) => page.setNavbarElement(n)}>
      <StyledLeft
        id={"navbar--left"}
        direction="row"
        alignItems={"center"}
        justifyContent={"flex-start"}
        spacing={1}
        flex={"1 1 0"}
      ></StyledLeft>
      <StyledContainer maxWidth={false}>
        {page.navbar?.search ? (
          <Search
            renderInput={(params) => (
              <StyledTextField
                {...params}
                variant="outlined"
                size="small"
                placeholder="Search"
                label=""
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                // sx={{
                //   "& .MuiOutlinedInput-root": {
                //     height: "40px !important",
                //     border: "none",
                //     "& input": {
                //       height: "40px !important",
                //     },
                //   },
                // }}
              />
            )}
          />
        ) : (
          <>&nbsp;</>
        )}
      </StyledContainer>
      <Stack
        id={"navbar--right"}
        direction="row"
        alignItems={"center"}
        justifyContent={"flex-end"}
        spacing={1}
        flex={"1 1 0"}
      >
        <BellButton onClick={handleBellClick} hasUnread={hasUnread} data-testid="notification-button"/>
        <NotificationDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          data-testid="notification-drawer"
        />
      </Stack>
    </StyledNavbar>
  );
});
