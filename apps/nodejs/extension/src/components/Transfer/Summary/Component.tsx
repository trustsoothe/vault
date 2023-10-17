import type { SerializedAccountReference } from "@poktscan/keyring";
import type { FormValues } from "../index";
import type { RootState } from "../../../redux/store";
import React, { useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { useFormContext } from "react-hook-form";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import {
  labelByChainID,
  labelByProtocolMap,
} from "../../../constants/protocols";
import RowSpaceBetween from "../../common/RowSpaceBetween";
import { roundAndSeparate } from "../../../utils/ui";
import { isPrivateKey } from "../../../utils";
import {
  getAddressFromPrivateKey,
  protocolsAreEquals,
} from "../../../utils/networkOperations";

interface SummaryProps {
  fromBalance: number;
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  compact?: boolean;
}

const Summary: React.FC<SummaryProps> = ({
  fromBalance,
  accounts,
  compact = false,
}) => {
  const theme = useTheme();
  const { watch } = useFormContext<FormValues>();
  const values = watch();
  const [fromLabel, setFromLabel] = useState("");

  useEffect(() => {
    let account: SerializedAccountReference;
    if (values.fromType === "saved_account") {
      account = accounts.find(
        (item) =>
          item.address === values.from &&
          protocolsAreEquals(item.protocol, values.asset.protocol)
      );

      if (account) {
        const { name, address } = account;
        setFromLabel(
          `${name} (${address.substring(0, 4)}...${address.substring(
            address.length - 4
          )})`
        );
      } else {
        setFromLabel(values.from);
      }
    } else {
      if (isPrivateKey(values.from)) {
        getAddressFromPrivateKey(values.from, values.asset.protocol).then(
          (address) => setFromLabel(address)
        );
      }
    }
  }, []);

  const rows = useMemo(() => {
    const total = Number(values.fee) + Number(values.amount);
    const res = fromBalance - total;

    const toAccount = accounts.find(
      (item) =>
        item.address === values.toAddress &&
        protocolsAreEquals(item.protocol, values.asset.protocol)
    );

    let toAddress = values.toAddress;

    if (toAccount) {
      const { name, address } = toAccount;
      toAddress = `${name} (${address.substring(0, 4)}...${address.substring(
        address.length - 4
      )})`;
    }

    return [
      {
        label: "From",
        value: fromLabel,
      },
      {
        label: "Protocol",
        value:
          labelByProtocolMap[values.asset.protocol.name] ||
          values.asset.protocol.name,
      },
      {
        label: "Chain ID",
        value:
          labelByChainID[values.asset.protocol.chainID] ||
          values.asset.protocol.chainID,
      },
      {
        label: "RPC",
        value: values.network.rpcUrl,
      },
      {
        label: "Amount",
        value: `${roundAndSeparate(Number(values.amount), 2, "0")} ${
          values.asset.symbol
        }`,
      },
      {
        label: "Fee",
        value: `${roundAndSeparate(Number(values.fee), 2, "0")} ${
          values.asset.symbol
        }`,
      },
      {
        label: "Total",
        value: `${roundAndSeparate(total, 2, "0")} ${values.asset.symbol}`,
      },
      {
        label: "Remaining",
        value: `${roundAndSeparate(res, 2, "0")} ${values.asset.symbol}`,
      },
      {
        label: "To",
        value: toAddress,
      },
      {
        label: "Memo",
        value: values.memo,
      },
    ];
  }, [values, accounts, fromLabel]);

  return (
    <Stack maxWidth={"100%"} width={1}>
      <Typography
        letterSpacing={"0.5px"}
        fontSize={14}
        fontWeight={500}
        color={theme.customColors.dark100}
      >
        Summary
      </Typography>
      <Stack
        width={360}
        paddingX={1}
        spacing={compact ? 0.4 : 0.5}
        paddingY={compact ? 0.5 : 1.2}
        marginTop={0.8}
        borderRadius={"4px"}
        boxSizing={"border-box"}
        border={`1px solid ${theme.customColors.dark15}`}
        sx={{
          "& p": {
            fontSize: "11px!important",
            lineHeight: "20px!important",
          },
        }}
      >
        {rows.map(({ label, value }, i) => (
          <RowSpaceBetween
            key={i}
            label={`${label}:`}
            value={value}
            labelProps={{ color: theme.customColors.dark75 }}
            containerProps={{ alignItems: "baseline", spacing: 0.5 }}
          />
        ))}
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(Summary);
