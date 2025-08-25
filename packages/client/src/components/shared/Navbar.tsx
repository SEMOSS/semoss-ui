import { Search as SearchIcon } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
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

// Prime check helper
function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Fixed sequence to test polling visually
const sequence = [10, 13, 16, 17, 18, 19, 20];
let seqIndex = 0;

async function fetchHasUnreadNotifications(): Promise<{
  number: number;
  isPrime: boolean;
}> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const num = sequence[seqIndex];
  seqIndex = (seqIndex + 1) % sequence.length;
  return { number: num, isPrime: isPrime(num) };
}

export const Navbar: React.FC = observer(() => {
  const { page } = usePage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(0);
  const [_lastNumber, setLastNumber] = useState<number | null>(null);
  const [_lastTimestamp, setLastTimestamp] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!mounted) return;
      try {
        const { number, isPrime } = await fetchHasUnreadNotifications();
        if (mounted) {
          setHasUnread(isPrime ? number : 0);
          setLastNumber(number);
          setLastTimestamp(new Date().toLocaleTimeString());
          console.log(
            `Polling: number=${number}, isPrime=${isPrime}`,
            `lastTimestamp=${new Date().toLocaleTimeString()}`
          );
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }

    poll();
    const pollInterval = setInterval(poll, 60000); // 1 min

    return () => {
      mounted = false;
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
        <BellButton onClick={handleBellClick} hasUnread={hasUnread} />
        <NotificationDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </Stack>
    </StyledNavbar>
  );
});
