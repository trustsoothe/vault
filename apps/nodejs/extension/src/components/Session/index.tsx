import React, { useCallback, useEffect, useState } from "react";
import Tab from "@mui/material/Tab";
import TabList from "@mui/lab/TabList";
import Stack from "@mui/material/Stack";
import TabPanel from "@mui/lab/TabPanel";
import { useTheme } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import { useSearchParams } from "react-router-dom";
import BlockedList from "./BlockedList";
import ListSessions from "./List";

enum SitesTabs {
  connected = "connected",
  blocked = "blocked",
}

const Sites: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(SitesTabs.connected);

  useEffect(() => {
    const tabOnQuery = searchParams.get("tab");

    if (tabOnQuery && tabOnQuery in SitesTabs) {
      setTab(tabOnQuery as SitesTabs);
    }
  }, []);

  const onChangeTab = useCallback(
    (_: React.SyntheticEvent, newTab: SitesTabs) => {
      setTab(newTab);
    },
    []
  );

  return (
    <Stack
      flexGrow={1}
      marginTop={2}
      sx={{
        "& .MuiTabPanel-root": {
          padding: 0,
          display: "flex",
        },
      }}
    >
      <TabContext value={tab}>
        <TabList
          variant={"fullWidth"}
          onChange={onChangeTab}
          sx={{
            height: 40,
            minHeight: 40,
            borderBottom: `1px solid ${theme.customColors.dark15}`,
            "& .MuiTabs-flexContainer": {
              paddingX: 2,
            },
            "& .MuiTabs-flexContainer, button": {
              height: 40,
              minHeight: 40,
            },
            "& button": {
              fontWeight: 700,
              fontSize: 12,
              color: theme.customColors.dark25,
            },
            "& button.Mui-selected": {
              color: theme.customColors.primary500,
            },
          }}
        >
          <Tab label={"CONNECTED"} value={SitesTabs.connected} />
          <Tab label={"BLOCKED"} value={SitesTabs.blocked} />
        </TabList>
        <TabPanel
          value={SitesTabs.connected}
          sx={{
            ...(tab === SitesTabs.connected && {
              height: 1,
              paddingTop: "20px!important",
            }),
          }}
        >
          <ListSessions />
        </TabPanel>
        <TabPanel
          value={SitesTabs.blocked}
          sx={{
            ...(tab === SitesTabs.blocked && {
              height: 1,
              paddingTop: "20px!important",
            }),
          }}
        >
          <BlockedList />
        </TabPanel>
      </TabContext>
    </Stack>
  );
};

export default Sites;
