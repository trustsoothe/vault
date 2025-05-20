import type { AppPersonalSignReq } from "../../types/communications/personalSign";
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
import { SiwpMessage } from "@poktscan/vault-siwp";
import Summary, { SummaryRowItem } from "../components/Summary";
import { AccountInfoFromAddress } from "../components/AccountInfo";
import { useAppSelector } from "../hooks/redux";
import { networksSelector } from "../../redux/selectors/network";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandIcon from "../assets/img/expand_select_icon.svg";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

function getDateIfValid(str: string): string {
  let date: Date | null = null;

  try {
    date = new Date(str);
  } catch {}

  return date ? dateFormatter.format(date) : str;
}

export default function PersonalSign() {
  const networks = useAppSelector(networksSelector);
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

  let messageToSign = signRequest.challenge,
    siwpMessage: SiwpMessage;

  if (signRequest.protocol === SupportedProtocols.Ethereum) {
    try {
      messageToSign = hexToString(signRequest.challenge);
    } catch (e) {}
  }

  if (signRequest.protocol === SupportedProtocols.Cosmos) {
    try {
      siwpMessage = SiwpMessage.fromString(signRequest.challenge);
    } catch (e) {}
  }

  let content: React.ReactNode;

  const rawMessage = (
    <Typography
      variant={"subtitle2"}
      fontWeight={300}
      sx={{ wordBreak: "break-word", whiteSpace: "pre-line" }}
    >
      {messageToSign}
    </Typography>
  );

  if (siwpMessage) {
    const network = networks.find(
      (n) =>
        n.protocol === signRequest.protocol && n.chainId === siwpMessage.chainId
    );

    const summaryRows: Array<SummaryRowItem> = [
      {
        type: "row",
        label: siwpMessage.statement || `Sign in at ${siwpMessage.domain}`,
        value: null,
        containerProps: {
          marginLeft: "-4px!important",
          sx: {
            "& p": {
              color: themeColors.black,
            },
          },
        },
      },
      {
        type: "row",
        label: "Account",
        value: (
          <AccountInfoFromAddress
            address={siwpMessage.address}
            protocol={signRequest.protocol}
          />
        ),
      },
      {
        type: "row",
        label: "Network",
        value: network ? (
          <Stack direction={"row"} alignItems={"center"} gap={0.4}>
            {network.iconUrl && (
              <img
                width={18}
                height={18}
                src={network.iconUrl}
                alt={`${network.protocol}-${network.chainIdLabel}-icon`}
              />
            )}
            <Typography variant={"subtitle2"}>{network.label}</Typography>
          </Stack>
        ) : (
          siwpMessage.chainId
        ),
      },
      {
        type: "row",
        label: "Website URL",
        value: siwpMessage.uri,
      },
      {
        type: "divider",
      },
    ];

    if (siwpMessage.resources) {
      summaryRows.push({
        containerProps: {
          alignItems: "flex-start",
          sx: {
            "& p": {
              overflow: "unset",
            },
          },
        },
        type: "row",
        label: "Resources",
        value: (
          <Stack width={1} marginTop={2.4} marginBottom={0.4} marginLeft={-5.6}>
            {siwpMessage.resources.map((resource) => (
              <Typography
                fontSize={12}
                color={"black"}
                key={resource}
                whiteSpace={"nowrap"}
                textOverflow={"ellipsis"}
                overflow={"hidden!important"}
              >
                {resource}
              </Typography>
            ))}
          </Stack>
        ),
      });
    }

    if (siwpMessage.requestId) {
      summaryRows.push({
        type: "row",
        label: "Request ID",
        value: siwpMessage.requestId,
      });
    }

    if (siwpMessage.issuedAt) {
      summaryRows.push({
        type: "row",
        label: "Issued At",
        value: (
          <Typography fontSize={12} color={"black"}>
            {getDateIfValid(siwpMessage.issuedAt)}
          </Typography>
        ),
      });
    }

    if (siwpMessage.expirationTime) {
      summaryRows.push({
        type: "row",
        label: "Issued At",
        value: (
          <Typography fontSize={12} color={"black"}>
            {getDateIfValid(siwpMessage.expirationTime)}
          </Typography>
        ),
      });
    }

    if (siwpMessage.notBefore) {
      summaryRows.push({
        type: "row",
        label: "Valid From",
        value: (
          <Typography fontSize={12} color={"black"}>
            {getDateIfValid(siwpMessage.notBefore)}
          </Typography>
        ),
      });
    }

    summaryRows.push({
      containerProps: {
        alignItems: "flex-start",
      },
      type: "row",
      label: "Nonce",
      value: (
        <Typography
          width={280}
          fontSize={11}
          color={"black"}
          marginTop={0.2}
          textAlign={"right"}
          sx={{
            wordBreak: "break-all",
          }}
        >
          {siwpMessage.nonce}
        </Typography>
      ),
    });

    content = (
      <>
        <Typography variant={"subtitle2"}>
          Sign In With Pocket Message
        </Typography>
        <Typography fontSize={11} fontWeight={300}>
          Signing this message will allow you to sign in in the website.
        </Typography>

        <Summary
          containerProps={{
            marginTop: 1.2,
            border: `1px solid ${themeColors.light_gray1}`,
          }}
          rows={summaryRows}
        />

        <Accordion
          sx={{
            borderRadius: "8px",
            border: `1px solid ${themeColors.light_gray1}`,
            marginBottom: "6px!important",
            marginTop: "16px!important",
            "&::before": {
              display: "none",
            },
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
            <Typography color={themeColors.black}>Raw Message</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              paddingTop: 0,
              paddingX: 1.2,
              paddingBottom: 1.2,
              "& h6": {
                fontSize: "11px!important",
              },
            }}
          >
            {rawMessage}
          </AccordionDetails>
        </Accordion>
      </>
    );
  } else {
    content = (
      <Stack
        padding={"10px 14px 11px"}
        borderRadius={"8px"}
        bgcolor={themeColors.bgLightGray}
      >
        <Typography variant={"subtitle2"}>Message</Typography>
        {rawMessage}
      </Stack>
    );
  }

  return (
    <Stack flexGrow={1}>
      <RequestInfo
        title={"Signature Request"}
        description={"Only sign requests from trusted websites."}
        origin={signRequest.origin}
      />
      <Stack
        bgcolor={themeColors.white}
        padding={1.6}
        flexGrow={1}
        minHeight={0}
        flexBasis={"1px"}
        overflow={"auto"}
      >
        {content}
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
