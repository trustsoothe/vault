import type { SerializedAccountReference } from "@poktscan/keyring";
import type { FormValues } from "../index";
import type { RootState } from "../../../redux/store";
import React, { useMemo } from "react";
import Typography from "@mui/material/Typography";
import { useFormContext } from "react-hook-form";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import {
  labelByChainID,
  labelByProtocolMap,
} from "../../../constants/protocols";

interface RowProps {
  row: { label: string; value?: string };
}

const Row = ({ row: { label, value } }: RowProps) => {
  return (
    <Stack direction={"row"} spacing={1.5}>
      <Typography
        width={80}
        textAlign={"right"}
        fontWeight={600}
        letterSpacing={"0.5px"}
        fontSize={12}
      >
        {label}:
      </Typography>
      <Typography
        width={"100%"}
        letterSpacing={"0.5px"}
        sx={{ wordBreak: "break-all" }}
        fontSize={12}
      >
        {value}
      </Typography>
    </Stack>
  );
};

interface SummaryProps {
  fromBalance: number;
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

const Summary: React.FC<SummaryProps> = ({ fromBalance, accounts }) => {
  const { watch } = useFormContext<FormValues>();
  const values = watch();

  const rows = useMemo(() => {
    const total = Number(values.fee) + Number(values.amount);
    const res = fromBalance - total;
    let account: SerializedAccountReference, from: string;

    if (values.fromType === "saved_account") {
      account = accounts.find(
        (item) =>
          item.address === values.from &&
          item.protocol.name === values.asset.protocol.name &&
          item.protocol.chainID === values.asset.protocol.chainID
      );

      if (account) {
        const { name, address } = account;
        from = `${name} (${address.substring(0, 4)}...${address.substring(
          address.length - 4
        )})`;
      } else {
        from = values.from.substring(0, 40);
      }
    } else {
      from = values.from.substring(0, 40);
    }

    return [
      {
        label: "From",
        value: from,
      },
      {
        label: "Protocol",
        value: labelByProtocolMap[values.asset.protocol.name],
      },
      {
        label: "Chain ID",
        value: labelByChainID[values.asset.protocol.chainID],
      },
      {
        label: "RPC",
        value: values.network.rpcUrl,
      },
      {
        label: "Amount",
        value: `${values.amount} ${values.asset.symbol}`,
      },
      {
        label: "Fee",
        value: `${values.fee} ${values.asset.symbol}`,
      },
      {
        label: "Total",
        value: `${total} ${values.asset.symbol}`,
      },
      {
        label: "Remain",
        value: `${res} ${values.asset.symbol}`,
      },
      {
        label: "To",
        value: values.toAddress,
      },
      {
        label: "Memo",
        value: values.memo,
      },
    ];
  }, [values, accounts]);

  return (
    <Stack
      borderBottom={`1px solid lightgray`}
      maxWidth={"100%"}
      paddingBottom={1}
      marginTop={0.5}
    >
      <Typography textAlign={"center"} letterSpacing={"0.5px"} fontSize={14}>
        Summary
      </Typography>
      <Divider sx={{ marginTop: 0.5, marginBottom: 1 }} />
      <Stack flexGrow={1} spacing={0.5}>
        {rows.map((row, i) => (
          <Row key={i} row={row} />
        ))}
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(Summary);
