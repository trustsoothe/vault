import type { AppBulkPersonalSignReq } from "../../types/communications/personalSign";
import { hexToString } from "web3-utils";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import { SupportedProtocols } from "@soothe/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandIcon from "../assets/img/expand_select_icon.svg";

function Message({
  title,
  message,
  protocol,
}: {
  title: string;
  protocol: SupportedProtocols;
  message: string;
}) {
  let messageToSign = message;

  if (protocol === SupportedProtocols.Ethereum) {
    try {
      messageToSign = hexToString(message);
    } catch (e) {}
  }

  return (
    <Accordion
      sx={{
        marginBottom: "6px!important",
        marginTop: "0!important",
        // ...accordionSxProps,
      }}
      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        sx={{
          minHeight: "36px!important",
          height: "36px!important",
          paddingX: 1.2,
          "& .MuiAccordionSummary-content": {
            marginY: "0px!important",
          },
        }}
      >
        <Typography variant={"subtitle2"}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          paddingY: 0.4,
          paddingX: 2,
        }}
      >
        <Typography
          variant={"subtitle2"}
          fontWeight={300}
          sx={{ wordBreak: "break-word" }}
        >
          {messageToSign}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}

export default function BulkPersonalSign() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const signRequest: AppBulkPersonalSignReq = location.state;

  console.log(signRequest);

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
    AppToBackground.answerBulkPersonalSign({
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
        <Typography variant={"subtitle2"}>Messages</Typography>
        <Stack
          padding={"10px 14px 11px"}
          borderRadius={"8px"}
          bgcolor={themeColors.bgLightGray}
        >
          {signRequest.challenges.map((item, index) => (
            <Message
              key={item.id || index}
              title={`Message #${index + 1}`}
              protocol={signRequest.protocol}
              message={item.challenge}
            />
          ))}
        </Stack>
      </Stack>
      <Stack height={56}>
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
