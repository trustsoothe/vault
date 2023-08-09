import type { RootState } from "../../redux/store";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo } from "react";
import { useAppDispatch } from "../../hooks/redux";
import { getBlockedSites } from "../../redux/slices/app";
import { UNBLOCK_SITE_PAGE } from "../../constants/routes";

interface BlockedListProps {
  blockedList: RootState["app"]["blockedSites"]["list"];
  loaded: RootState["app"]["blockedSites"]["loaded"];
}

const BlockedList: React.FC<BlockedListProps> = ({ blockedList, loaded }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
              onClick={() => navigate(`${UNBLOCK_SITE_PAGE}?site=${site}`)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Unblock
            </Button>
          </Stack>
        ))}
      </Stack>
    );
  }, [blockedList]);

  return (
    <>
      <Stack flexGrow={1}>{content}</Stack>
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
