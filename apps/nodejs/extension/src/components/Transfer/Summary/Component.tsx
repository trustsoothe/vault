import type { EthereumNetworkFee, PocketNetworkFee } from "@poktscan/keyring";
import type { FormValues } from "../index";
import React, { useMemo } from "react";
import Typography from "@mui/material/Typography";
import { useFormContext } from "react-hook-form";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { SupportedProtocols } from "@poktscan/keyring";
import RowSpaceBetween from "../../common/RowSpaceBetween";
import { returnNumWithTwoDecimals } from "../../../utils/ui";
import { useAppSelector } from "../../../hooks/redux";
import useGetPrices from "../../../hooks/useGetPrices";
import useGetAssetPrices from "../../../hooks/useGetAssetPrices";
import useDidMountEffect from "../../../hooks/useDidMountEffect";

interface SummaryProps {
  compact?: boolean;
  networkFee: PocketNetworkFee | EthereumNetworkFee;
}

const Summary: React.FC<SummaryProps> = ({ compact = false, networkFee }) => {
  const theme = useTheme();
  const { watch } = useFormContext<FormValues>();
  const values = watch();
  const { protocol, chainId, asset } = values;

  const accounts = useAppSelector(
    (state) => state.vault.entities.accounts.list
  );

  const symbol = useAppSelector((state) => {
    return (
      state.vault.entities.assets.list.find(
        (asset) => asset.protocol === protocol
      )?.symbol || ""
    );
  });

  const {
    data: priceByContractAddress,
    isError: isAssetsPriceError,
    isLoading: isLoadingAssetsPrice,
    refetch: refetchAssetsPrice,
  } = useGetAssetPrices(false);
  const { data: pricesByProtocolAndChain } = useGetPrices();

  useDidMountEffect(() => {
    if (asset) {
      setTimeout(refetchAssetsPrice, 0);
    }
  }, [asset]);

  const assetUsdPrice = priceByContractAddress[asset?.contractAddress] || 0;
  const selectedNetworkPrice: number =
    pricesByProtocolAndChain?.[protocol]?.[chainId] || 0;
  const isEth = values.protocol === SupportedProtocols.Ethereum;

  const rows = useMemo(() => {
    const fee = Number(
      isEth ? networkFee[values.feeSpeed]?.amount : values.fee
    );
    const transferAmount = Number(values.amount);
    const total = fee + transferAmount;

    const toAccount = accounts.find(
      (item) =>
        item.address === values.toAddress && item.protocol === values.protocol
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
        label: isEth ? "Max Fee" : "Fee",
        value: `${fee} ${symbol}`,
      },
      {
        label: "Amount",
        value: `${transferAmount} ${
          values.asset ? values.asset.symbol : symbol
        } / $${returnNumWithTwoDecimals(
          transferAmount *
            (values.asset ? assetUsdPrice : selectedNetworkPrice),
          "0"
        )} USD`,
      },
      {
        label: isEth ? (values.asset ? "Max Fee" : "Max Total") : "Total",
        value: `${
          values.asset ? fee : total
        } ${symbol} / $${returnNumWithTwoDecimals(
          (values.asset ? fee : total) * selectedNetworkPrice,
          "0"
        )} USD`,
      },
      {
        label: "To",
        value: toAddress,
      },
      ...(isEth || !values.memo
        ? []
        : [
            {
              label: "Memo",
              value: values.memo,
            },
          ]),
    ];
  }, [values, accounts, symbol, selectedNetworkPrice, networkFee, isEth]);

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
        paddingY={compact ? 0.5 : isEth ? 1.2 : 0.7}
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

export default Summary;
