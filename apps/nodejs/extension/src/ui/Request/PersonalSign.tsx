import type { AppPersonalSignReq } from "../../types/communications/personalSign";
import { toUtf8 } from "web3-utils";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../controllers/communication/AppToBackground";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";

export default function PersonalSign() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const signRequest: AppPersonalSignReq = location.state;

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    return closeSnackbars;
  }, []);

  const sendResponse = (accepted: boolean) => {
    setIsLoading(true);
    AppToBackground.answerPersonalSign({
      request: signRequest,
      accepted,
    })
      .then((res) => {
        if (res.error) {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            variant: "error",
            message: {
              title: "Failed to answer the request",
              content: `There was an error trying to ${
                accepted ? "accept" : "reject"
              } the signature request.`,
            },
            onRetry: () => sendResponse(accepted),
          });
        } else {
          closeSnackbars();
        }
      })
      .catch(() => {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          message: {
            title: "Failed to answer the request",
            content: `There was an error trying to ${
              accepted ? "accept" : "reject"
            } the signature request.`,
          },
          onRetry: () => sendResponse(accepted),
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Stack flexGrow={1}>
      <RequestInfo
        title={"Signature Request"}
        description={"Only sign requests from trusted websites."}
        origin={signRequest.origin}
      />
      <Stack
        bgcolor={themeColors.white}
        padding={2.4}
        flexGrow={1}
        minHeight={0}
        flexBasis={"1px"}
        overflow={"auto"}
      >
        <Stack
          padding={"10px 14px 11px"}
          borderRadius={"8px"}
          bgcolor={themeColors.bgLightGray}
        >
          <Typography variant={"subtitle2"}>Message</Typography>
          <Typography
            variant={"subtitle2"}
            fontWeight={300}
            sx={{ wordBreak: "break-word" }}
          >
            {toUtf8(signRequest.challenge)}
          </Typography>
        </Stack>
      </Stack>
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            isLoading,
            children: "Sign",
            onClick: () => sendResponse(true),
          }}
          secondaryButtonProps={{
            children: "Cancel",
            disabled: isLoading,
            onClick: () => sendResponse(false),
          }}
        />
      </Stack>
    </Stack>
  );
}
