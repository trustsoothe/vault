import Tab from "@mui/material/Tab";
import TabList from "@mui/lab/TabList";
import Stack from "@mui/material/Stack";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import NetworkList from "./NetworkList";
import { themeColors } from "../theme";
import CustomRPCs from "./CustomRPCs";

enum NetworkTabs {
  defaults = "defaults",
  customs = "customs",
}

export default function Networks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<NetworkTabs>(
    searchParams.get("tab") &&
      Object.values(NetworkTabs).includes(
        searchParams.get("tab") as NetworkTabs
      )
      ? (searchParams.get("tab") as NetworkTabs)
      : NetworkTabs.defaults
  );

  useEffect(() => {
    const tabOnQuery = searchParams.get("tab");

    if (tabOnQuery && tabOnQuery in NetworkTabs) {
      setTab(tabOnQuery as NetworkTabs);
    }
  }, []);

  const onChangeTab = (_: React.SyntheticEvent, newTab: NetworkTabs) => {
    setTab(newTab);
    setSearchParams((prev) => {
      prev.set("tab", newTab);
      return prev;
    });
  };

  return (
    <Stack
      bgcolor={themeColors.white}
      flexGrow={1}
      flexBasis={"1px"}
      minHeight={0}
      padding={2.4}
    >
      <TabContext value={tab}>
        <TabList
          variant={"fullWidth"}
          onChange={onChangeTab}
          sx={{
            height: 37,
            minHeight: 37,
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTabs-flexContainer": {
              height: 37,
              padding: 0.3,
              minHeight: 37,
              borderRadius: "9px",
              backgroundColor: themeColors.light_gray1,
              boxSizing: "border-box",
            },
            "& button": {
              height: 31,
              minHeight: 31,
              fontWeight: 400,
              fontSize: 12,
              color: themeColors.textSecondary,
              textTransform: "none",
            },
            "& button.Mui-selected": {
              fontWeight: 500,
              color: themeColors.black,
              borderRadius: "6px",
              backgroundColor: themeColors.white,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.12)",
            },
          }}
        >
          <Tab label={"Networks"} value={NetworkTabs.defaults} />
          <Tab label={"Custom RPC"} value={NetworkTabs.customs} />
        </TabList>
        <TabPanel
          value={NetworkTabs.defaults}
          sx={{
            padding: "0 !important",
          }}
        >
          <NetworkList />
        </TabPanel>
        <TabPanel
          value={NetworkTabs.customs}
          sx={{
            padding: "0 !important",
          }}
        >
          <CustomRPCs />
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
