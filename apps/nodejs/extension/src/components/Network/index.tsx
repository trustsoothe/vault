import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import TabList from "@mui/lab/TabList";
import Tab from "@mui/material/Tab";
import NetworkList from "./List";
import ListRPCs from "./ListRPCs";

enum NetworkTabs {
  defaults = "defaults",
  customs = "customs",
}

const Network = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(NetworkTabs.defaults);
  useEffect(() => {
    const tabOnQuery = searchParams.get("tab");

    if (tabOnQuery && tabOnQuery in NetworkTabs) {
      setTab(tabOnQuery as NetworkTabs);
    }
  }, []);
  const onChangeTab = useCallback(
    (_: React.SyntheticEvent, newTab: NetworkTabs) => {
      setTab(newTab);
    },
    []
  );

  return (
    <Stack
      flexGrow={1}
      height={1}
      marginTop={1.5}
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
              color: theme.customColors.dark50,
            },
            "& button.Mui-selected": {
              color: theme.customColors.primary500,
            },
          }}
        >
          <Tab label={"DEFAULTS"} value={NetworkTabs.defaults} />
          <Tab label={"CUSTOM RPCs"} value={NetworkTabs.customs} />
        </TabList>
        <TabPanel
          value={NetworkTabs.defaults}
          sx={{
            "&:has(*)": {
              flexGrow: 1,
            },
          }}
        >
          <NetworkList />
        </TabPanel>
        <TabPanel
          value={NetworkTabs.customs}
          sx={{
            "&:has(*)": {
              flexGrow: 1,
            },
          }}
        >
          <ListRPCs />
        </TabPanel>
      </TabContext>
    </Stack>
  );
};

export default Network;
