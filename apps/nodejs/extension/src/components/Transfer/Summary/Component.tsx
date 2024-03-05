import type { FormValues } from "../index";
import React, { useEffect, useMemo } from "react";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { SupportedProtocols } from "@soothe/vault";
import RowSpaceBetween from "../../common/RowSpaceBetween";
import { getTruncatedText, returnNumWithTwoDecimals } from "../../../utils/ui";
import { useAppSelector } from "../../../hooks/redux";
import useGetPrices from "../../../hooks/useGetPrices";
import useGetAssetPrices from "../../../hooks/useGetAssetPrices";
import MaxFeeSelector from "./MaxFeeSelector";
import { useTransferContext } from "../../../contexts/TransferContext";
import TooltipOverflow from "../../common/TooltipOverflow";
import {
  symbolOfNetworkSelector,
  transferMinAmountOfNetworkSelector,
} from "../../../redux/selectors/network";
import {
  accountBalancesSelector,
  accountsSelector,
} from "../../../redux/selectors/account";

interface SummaryProps {
  compact?: boolean;
}

interface AmountWrapperProps {
  children: number | string;
}

const AmountValidationWrapper: React.FC<AmountWrapperProps> = ({
  children,
}) => {
  const theme = useTheme();
  const { watch, control } = useFormContext();
  const { feeSelected } = useTransferContext();
  const [protocol, chainId, asset, fromAddress] = watch([
    "protocol",
    "chainId",
    "asset",
    "from",
    "feeSpeed",
  ]);

  const accountBalances = useAppSelector(accountBalancesSelector);
  const transferMinAmount = useAppSelector(
    transferMinAmountOfNetworkSelector(protocol, chainId)
  );

  const amount = useMemo(() => {
    const chainBalanceMap = accountBalances?.[protocol]?.[chainId];

    if (asset) {
      return chainBalanceMap?.[asset.contractAddress]?.[fromAddress]?.amount;
    }
    return chainBalanceMap?.[fromAddress]?.amount;
  }, [accountBalances, protocol, chainId, asset, fromAddress]);

  return (
    <Controller
      control={control}
      name={"amount"}
      rules={{
        required: "Required",
        validate: (value) => {
          const amountFromInput = Number(value);
          const fee = Number(feeSelected);

          if (isNaN(amountFromInput) || isNaN(fee)) {
            return "Invalid amount";
          }

          const total = amountFromInput + (asset ? 0 : fee);

          const minString = asset
            ? "0." + "0".repeat(asset.decimals - 1) + "1"
            : transferMinAmount;
          const min = Number(minString);
          if (amountFromInput < min) {
            return `Min is ${minString}`;
          }

          return total > amount ? `Insufficient balance` : true;
        },
      }}
      render={({ fieldState: { error } }) => (
        <Stack
          minHeight={20}
          width={"min-content"}
          justifyContent={"center"}
          alignItems={"flex-end"}
          borderRadius={"4px"}
        >
          <TooltipOverflow
            text={children?.toString()}
            linkProps={{
              fontSize: "11px!important",
              fontWeight: "400!important",
              flexGrow: 1,
              textAlign: "right",
              color: theme.customColors.dark100 + "!important",
            }}
          />
          {(error || amount === 0) && (
            <Typography
              fontSize={10}
              color={theme.customColors.red100}
              textAlign={"right"}
              className={"error"}
            >
              {amount === 0 ? `Insufficient balance` : error.message}
            </Typography>
          )}
        </Stack>
      )}
    />
  );
};

const errorContainerProps = {
  sx: {
    "& p": {
      "&:not(.error)": {
        alignSelf: "flex-start",
      },
      "&.error": {
        lineHeight: "12px!important",
        fontSize: "10px!important",
      },
    },
  },
  height: "auto",
  minHeight: 20,
};

const Summary: React.FC<SummaryProps> = ({ compact = false }) => {
  const theme = useTheme();
  const { watch } = useFormContext<FormValues>();
  const values = watch();
  const { protocol, chainId, asset } = values;
  const { feeSelected, isPokt, transferType, feeFetchStatus, getNetworkFee } =
    useTransferContext();
  const accounts = useAppSelector(accountsSelector);

  const symbol = useAppSelector(symbolOfNetworkSelector(protocol, chainId));

  const { data: priceByContractAddress, refetch: refetchAssetsPrice } =
    useGetAssetPrices(false);
  const { data: pricesByProtocolAndChain } = useGetPrices();

  useEffect(() => {
    if (asset) {
      setTimeout(refetchAssetsPrice, 0);
    }
  }, [asset]);

  const assetUsdPrice = priceByContractAddress[asset?.contractAddress] || 0;
  const selectedNetworkPrice: number =
    pricesByProtocolAndChain?.[protocol]?.[chainId];

  const rows = useMemo(() => {
    const transferAmount = Number(values.amount);
    const total = feeSelected + transferAmount;

    let toProtocol = values.protocol;

    if (transferType === "bridge") {
      toProtocol = SupportedProtocols.Ethereum;
    } else if (transferType === "burn") {
      toProtocol = SupportedProtocols.Pocket;
    }

    const toAccount = accounts.find(
      (item) =>
        item.address === values.toAddress && item.protocol === toProtocol
    );

    let toAddress = values.toAddress;

    if (toAccount) {
      const { name, address } = toAccount;
      toAddress = `${name} (${getTruncatedText(address)})`;
    }

    let amountText = `${transferAmount} ${
      values.asset ? values.asset.symbol : symbol
    }`;

    const usdPrice = values.asset ? assetUsdPrice : selectedNetworkPrice;
    if (typeof usdPrice === "number") {
      amountText += ` / $${returnNumWithTwoDecimals(
        transferAmount * usdPrice,
        "0"
      )} USD`;
    }

    const rows = [];

    if (isPokt) {
      let value: React.ReactNode;

      if (feeFetchStatus === "fetched" || feeSelected) {
        value = `${feeSelected} ${symbol}`;
      } else if (feeFetchStatus === "loading") {
        value = <Skeleton variant={"rectangular"} width={50} height={15} />;
      } else {
        value = (
          <Typography>
            Error getting fee.{" "}
            <Button
              sx={{
                fontSize: 12,
                height: 20,
                padding: 0,
                minWidth: 35,
                justifyContent: "flex-end",
              }}
              onClick={getNetworkFee}
            >
              Retry
            </Button>
          </Typography>
        );
      }

      rows.push({
        label: "Fee",
        value,
        containerProps: errorContainerProps,
      });
    } else {
      rows.push({
        label: "Max Fee",
        value: <MaxFeeSelector networkPrice={selectedNetworkPrice} />,
        containerProps: errorContainerProps,
      });
    }

    if (transferType !== "mint") {
      rows.unshift(
        {
          label: "To",
          value: toAddress,
        },
        {
          label: "Amount",
          value: asset ? (
            <AmountValidationWrapper>{amountText}</AmountValidationWrapper>
          ) : (
            amountText
          ),
          containerProps: asset ? errorContainerProps : undefined,
        }
      );

      if (!asset) {
        let text = `${total} ${symbol}`;

        if (typeof selectedNetworkPrice === "number") {
          text += ` / $${returnNumWithTwoDecimals(
            total * selectedNetworkPrice,
            "0"
          )} USD`;
        }

        rows.push({
          label: !isPokt ? "Max Total" : "Total",
          value: <AmountValidationWrapper>{text}</AmountValidationWrapper>,
          containerProps: errorContainerProps,
        });
      }

      if (isPokt && values.memo) {
        rows.push({
          label: "Memo",
          value: values.memo,
        });
      }
    }

    return rows;
  }, [
    values,
    accounts,
    symbol,
    selectedNetworkPrice,
    feeSelected,
    isPokt,
    transferType,
    assetUsdPrice,
    getNetworkFee,
    feeFetchStatus,
  ]);

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
        paddingY={compact ? 0.5 : !isPokt ? 1.2 : 0.7}
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
        {rows.map(({ label, value, containerProps }, i) => (
          <RowSpaceBetween
            key={i}
            label={`${label}:`}
            value={value}
            labelProps={{ color: theme.customColors.dark75 }}
            containerProps={{
              width: 338,
              alignItems: "center",
              spacing: 0.5,
              ...containerProps,
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export default Summary;
