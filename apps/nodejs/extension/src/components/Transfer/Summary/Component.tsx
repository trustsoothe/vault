import type { FormValues } from "../index";
import React, { useMemo } from "react";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { SupportedProtocols } from "@poktscan/keyring";
import RowSpaceBetween from "../../common/RowSpaceBetween";
import { returnNumWithTwoDecimals } from "../../../utils/ui";
import { useAppSelector } from "../../../hooks/redux";
import useGetPrices from "../../../hooks/useGetPrices";
import useGetAssetPrices from "../../../hooks/useGetAssetPrices";
import useDidMountEffect from "../../../hooks/useDidMountEffect";
import MaxFeeSelector from "./MaxFeeSelector";
import { useTransferContext } from "../../../contexts/TransferContext";

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
  const [protocol, chainId, asset, fromAddress, feeSpeed] = watch([
    "protocol",
    "chainId",
    "asset",
    "from",
    "feeSpeed",
  ]);

  const transferMinAmount = useAppSelector(
    (state) =>
      state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      )?.transferMinValue
  );

  const amount = useAppSelector((state) => {
    const chainBalanceMap = state.app.accountBalances?.[protocol]?.[chainId];

    if (asset) {
      return chainBalanceMap?.[asset.contractAddress]?.[fromAddress]?.amount;
    }
    return chainBalanceMap?.[fromAddress]?.amount;
  });

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
          <Typography
            fontSize={12}
            letterSpacing={"0.5px"}
            whiteSpace={"nowrap"}
            fontWeight={500}
          >
            {children}
          </Typography>
          {error && (
            <Typography
              fontSize={10}
              color={theme.customColors.red100}
              textAlign={"right"}
              className={"error"}
            >
              {error.message}
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
  const { feeSelected, isPokt, transferType } = useTransferContext();
  const accounts = useAppSelector(
    (state) => state.vault.entities.accounts.list
  );

  const symbol = useAppSelector((state) => {
    return (
      state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      )?.currencySymbol || ""
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
      toAddress = `${name} (${address.substring(0, 4)}...${address.substring(
        address.length - 4
      )})`;
    }

    const amountText = `${transferAmount} ${
      values.asset ? values.asset.symbol : symbol
    } / $${returnNumWithTwoDecimals(
      transferAmount * (values.asset ? assetUsdPrice : selectedNetworkPrice),
      "0"
    )} USD`;

    const rows: any[] = [
      {
        label: !isPokt ? "Max Fee" : "Fee",
        value: !isPokt ? (
          <MaxFeeSelector networkPrice={selectedNetworkPrice} />
        ) : (
          `${feeSelected} ${symbol}`
        ),
        containerProps: !isPokt ? errorContainerProps : undefined,
      },
    ];

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
        rows.push({
          label: !isPokt ? "Max Total" : "Total",
          value: (
            <AmountValidationWrapper>{`${total} ${symbol} / $${returnNumWithTwoDecimals(
              total * selectedNetworkPrice,
              "0"
            )} USD`}</AmountValidationWrapper>
          ),
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
