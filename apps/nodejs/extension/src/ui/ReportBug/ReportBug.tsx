import type { AppRequests } from "../../types/communications";
import React from "react";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { OpenInNew } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { SupportedProtocols } from "@soothe/vault";
import { AccountInfoFromAddress } from "../components/AccountInfo";
import { networksSelector } from "../../redux/selectors/network";
import Summary, { SummaryRowItem } from "../components/Summary";
import { getNetworkRow } from "../Transaction/BaseSummary";
import ErrorExpand from "../components/ErrorExpand";
import { useAppSelector } from "../hooks/redux";
import { themeColors } from "../theme";
import ReportLink from "../components/ReportLink";

export interface ReportBugMetadata {
  path?: string;
  protocol: SupportedProtocols;
  chainId: string;
  address: string;
  publicKey: string;
  error: unknown;
  transactionData: object;
  transactionType: string;
  request?: AppRequests;
}

interface ReportBugProps {
  bugMetadata: ReportBugMetadata;
}

function ReportBug({ bugMetadata }: ReportBugProps) {
  const networks = useAppSelector(networksSelector);

  const network = networks.find(
    (n) =>
      n.chainId === bugMetadata.chainId && n.protocol === bugMetadata.protocol
  );

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Operation",
      value: `${bugMetadata.transactionType} Transaction`,
    },
    {
      type: "row",
      label: "From",
      value: (
        <AccountInfoFromAddress
          address={bugMetadata.address}
          protocol={bugMetadata.protocol}
        />
      ),
    },
    getNetworkRow(network),
  ];

  const errorInfo = JSON.stringify(bugMetadata, null, 2);

  const href = `https://github.com/trustsoothe/vault/issues/new?template=bug_report.md&labels=user-bug-reports,bug&title=[BUG] ${bugMetadata.transactionType} Transaction Error`;

  return (
    <>
      <Typography variant={"subtitle2"}>
        Would like to report this bug?
      </Typography>
      <Summary rows={rows} />
      <ErrorExpand errorString={errorInfo} />
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <ReportLink href={href} />
      </Stack>
    </>
  );
}

export function ReportBugPage() {
  const bugMetadata: ReportBugMetadata = useLocation().state;
  const navigate = useNavigate();

  return (
    <>
      <Stack
        bgcolor={themeColors.white}
        flexGrow={1}
        flexBasis={"1px"}
        minHeight={0}
        padding={2.4}
        gap={1.2}
      >
        <ReportBug bugMetadata={bugMetadata} />
      </Stack>
      <Stack
        width={1}
        spacing={1.2}
        paddingX={2.4}
        direction={"row"}
        alignItems={"center"}
        boxSizing={"border-box"}
        sx={{
          height: 86,
          marginTop: 0,
          backgroundColor: themeColors.bgLightGray,
          borderTop: `1px solid ${themeColors.borderLightGray}`,
          button: {
            height: 37,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <Button variant={"contained"} fullWidth onClick={() => navigate("/")}>
          Done
        </Button>
      </Stack>
    </>
  );
}
