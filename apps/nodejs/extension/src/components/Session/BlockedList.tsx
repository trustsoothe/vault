import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getBlockedSites, unblockAllWebsites } from "../../redux/slices/app";
import { UNBLOCK_SITE_PAGE } from "../../constants/routes";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { enqueueSnackbar } from "../../utils/ui";
import {
  blockedListLoadedSelector,
  blockedListSelector,
} from "../../redux/selectors/session";

const BlockedList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const blockedList = useAppSelector(blockedListSelector);
  const loaded = useAppSelector(blockedListLoadedSelector);

  useEffect(() => {
    if (!loaded) {
      dispatch(getBlockedSites());
    }
  }, []);

  const onClickUnblockAll = useCallback(() => {
    setStatus("loading");
    dispatch(unblockAllWebsites())
      .unwrap()
      .then(() => {
        setStatus("normal");
        enqueueSnackbar({
          message: `All websites have been unblocked.`,
          variant: "success",
        });
      })
      .catch(() => setStatus("error"));
  }, [dispatch]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error unblocking all websites"}
          onCancel={() => setStatus("normal")}
          onRetry={onClickUnblockAll}
          retryBtnProps={{ type: "button" }}
          containerProps={{
            marginTop: -3,
          }}
        />
      );
    }

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
      <Stack flexGrow={1} spacing={2} justifyContent={"space-between"}>
        <Stack
          flexGrow={1}
          overflow={"auto"}
          boxSizing={"border-box"}
          spacing={1.5}
          height={384}
        >
          {blockedList.map((site) => (
            <Stack
              key={site}
              height={40}
              minHeight={40}
              paddingX={1}
              paddingY={0.5}
              direction={"row"}
              borderRadius={"4px"}
              alignItems={"center"}
              boxSizing={"border-box"}
              justifyContent={"space-between"}
              bgcolor={theme.customColors.dark2}
              border={`1px  solid ${theme.customColors.dark15}`}
              maxWidth={1}
            >
              <Typography
                fontSize={14}
                fontWeight={500}
                letterSpacing={"0.5px"}
                maxWidth={270}
                whiteSpace={"nowrap"}
                textOverflow={"ellipsis"}
                overflow={"hidden"}
              >
                {site}
              </Typography>
              <Typography
                fontSize={13}
                fontWeight={500}
                sx={{
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => navigate(`${UNBLOCK_SITE_PAGE}?site=${site}`)}
                color={theme.customColors.primary500}
              >
                Unblock
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Button
          variant={"contained"}
          fullWidth
          sx={{
            backgroundColor: theme.customColors.primary500,
            height: 35,
            fontWeight: 700,
            fontSize: 16,
          }}
          onClick={onClickUnblockAll}
        >
          Unblock All
        </Button>
      </Stack>
    );
  }, [blockedList, onClickUnblockAll, theme, navigate, status]);

  return (
    <>
      <Stack flexGrow={1}>{content}</Stack>
    </>
  );
};

export default BlockedList;
