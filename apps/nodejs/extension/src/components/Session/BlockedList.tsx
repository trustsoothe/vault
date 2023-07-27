import type { RootState } from "../../redux/store";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo } from "react";
import { useAppDispatch } from "../../hooks/redux";
import { getBlockedSites } from "../../redux/slices/app";

interface BlockedListProps {
  blockedList: RootState["app"]["blockedSites"]["list"];
  loaded: RootState["app"]["blockedSites"]["loaded"];
  toggleBlockSite: (site: string, toBlockList?: boolean) => void;
  onClose: () => void;
}

const BlockedList: React.FC<BlockedListProps> = ({
  blockedList,
  loaded,
  toggleBlockSite,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!loaded) {
      dispatch(getBlockedSites());
    }
  }, []);

  const content = useMemo(() => {
    if (!blockedList?.length) {
      return (
        <Stack justifyContent={"center"} alignItems={"center"} flexGrow={1}>
          <Typography mt={"-50px"}>
            You don't have any website blocked.
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack marginTop={"15px"}>
        {blockedList.map((site, index) => (
          <Stack
            key={site}
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            padding={"5px"}
            borderTop={index !== 0 ? "1px solid lightgray" : undefined}
          >
            <Typography>{site}</Typography>
            <Button
              onClick={() => toggleBlockSite(site, true)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Unblock
            </Button>
          </Stack>
        ))}
      </Stack>
    );
  }, [blockedList, toggleBlockSite]);

  return (
    <>
      <Stack flexGrow={1}>
        <Stack
          marginTop={"15px"}
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          width={1}
        >
          <Typography variant={"h5"}>Blocked Sites</Typography>
          <Button
            onClick={onClose}
            variant={"contained"}
            sx={{ textTransform: "none", height: 30, width: 60 }}
          >
            Close
          </Button>
        </Stack>
        {content}
      </Stack>
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    blockedList: state.app.blockedSites.list,
    loaded: state.app.blockedSites.loaded,
  };
};

export default connect(mapStateToProps)(BlockedList);
