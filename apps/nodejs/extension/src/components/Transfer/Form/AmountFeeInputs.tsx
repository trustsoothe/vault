import type { FeeSpeed, FormValues } from "../index";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useCallback, useEffect, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
} from "@poktscan/keyring";
import { useAppSelector } from "../../../hooks/redux";
import { isValidAddress } from "../../../utils/networkOperations";
import { AccountBalanceInfo } from "../../../redux/slices/app";
import { returnNumWithTwoDecimals } from "../../../utils/ui";
import useGetPrices from "../../../hooks/useGetPrices";
import useGetAssetPrices from "../../../hooks/useGetAssetPrices";
import { useTransferContext } from "../../../contexts/TransferContext";
import {
  symbolOfNetworkSelector,
  transferMinAmountOfNetworkSelector,
} from "../../../redux/selectors/network";
import { accountBalancesSelector } from "../../../redux/selectors/account";

export type AmountStatus = "not-fetched" | "loading" | "error" | "fetched";

interface EthFeeInputsProps {
  networkPriceData: ReturnType<typeof useGetPrices>;
}

export const timeByFeeSpeedMap: Record<FeeSpeed, string> = {
  low: "1 min",
  medium: "30 secs",
  high: "15 secs",
  "n/a": "unknown",
  site: "unknown",
};

const EthFeeInputs: React.FC<EthFeeInputsProps> = ({ networkPriceData }) => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();
  const [toAddress, protocol, chainId, feeSpeed] = watch([
    "toAddress",
    "protocol",
    "chainId",
    "feeSpeed",
  ]);
  const { networkFee, feeFetchStatus, getNetworkFee, feeSelected } =
    useTransferContext();
  const { data } = networkPriceData;
  const selectedNetworkPrice: number = data?.[protocol]?.[chainId] || 0;
  const symbol = useAppSelector(symbolOfNetworkSelector(protocol, chainId));

  const canShowUsd = !!data;

  return (
    <Stack direction={"row"} width={1} marginTop={"25px!important"} spacing={1}>
      <Controller
        control={control}
        name={"feeSpeed"}
        render={({ field }) => (
          <TextField
            select
            size={"small"}
            label={"Tx Speed"}
            disabled={!networkFee || feeFetchStatus !== "fetched"}
            SelectProps={{
              MenuProps: {
                sx: {
                  "& .MuiList-root": {
                    paddingY: 0.5,
                  },
                  "& .MuiMenuItem-root": {
                    height: 30,
                    minHeight: 30,
                    fontSize: 13,
                    paddingX: 1,
                  },
                },
              },
            }}
            sx={{
              width: 90,
              "& .MuiSelect-icon": { top: 5, right: -2 },
              "& .MuiSelect-select": {
                paddingRight: "27px!important",
              },
              "& .MuiFormHelperText-root": {
                bottom: "-18px!important",
                left: "10px!important",
                color: theme.customColors.dark75,
              },
            }}
            {...field}
            helperText={`Est. ${timeByFeeSpeedMap[field.value]}`}
          >
            <MenuItem value={"low"}>Low</MenuItem>
            <MenuItem value={"medium"}>Medium</MenuItem>
            <MenuItem value={"high"}>High</MenuItem>
            {(field.value === "site" ||
              !!(networkFee as EthereumNetworkFee)?.site) && (
              <MenuItem value={"site"}>Site</MenuItem>
            )}
          </TextField>
        )}
      />
      <Stack
        position={"relative"}
        borderRadius={"2px"}
        border={`1px solid ${theme.customColors.dark25}`}
        height={40}
        alignItems={"center"}
        paddingLeft={0.7}
        flexGrow={1}
        boxSizing={"border-box"}
        direction={"row"}
        width={160}
      >
        <Typography
          fontSize={10}
          color={theme.customColors.dark50}
          position={"absolute"}
          bgcolor={theme.customColors.dark2}
          whiteSpace={"nowrap"}
          top={-10}
          left={2}
          paddingX={0.6}
        >
          Fee ({symbol}
          {canShowUsd ? " / USD" : ""})
        </Typography>
        {!toAddress || !isValidAddress(toAddress, protocol) ? (
          <Typography fontSize={14} color={theme.customColors.red100}>
            {!toAddress
              ? "Select recipient first"
              : "Invalid recipient address"}
          </Typography>
        ) : feeFetchStatus === "loading" && !networkFee ? (
          <>
            <Skeleton variant={"rectangular"} width={80} height={20} />
            <Divider
              flexItem
              orientation={"vertical"}
              sx={{ marginX: 0.7, marginY: 0.5 }}
            />
            <Skeleton variant={"rectangular"} width={80} height={20} />
          </>
        ) : feeFetchStatus === "error" ? (
          <Typography fontSize={14} color={theme.customColors.red100}>
            Error getting fee.{" "}
            <span
              onClick={getNetworkFee}
              style={{ textDecoration: "underline", cursor: "pointer" }}
            >
              Retry
            </span>
          </Typography>
        ) : (
          <>
            <Typography fontSize={14} fontWeight={600} letterSpacing={"0.3px"}>
              {(networkFee as EthereumNetworkFee)?.[feeSpeed]?.amount}
            </Typography>

            {canShowUsd && (
              <>
                <Divider
                  flexItem
                  orientation={"vertical"}
                  sx={{ marginX: 0.7, marginY: 0.5 }}
                />
                <Typography
                  fontSize={12}
                  color={theme.customColors.dark90}
                  width={"min-content"}
                  textOverflow={"ellipsis"}
                  overflow={"hidden"}
                  whiteSpace={"nowrap"}
                >
                  $
                  {returnNumWithTwoDecimals(
                    Number(feeSelected) * selectedNetworkPrice,
                    "0"
                  )}
                </Typography>
              </>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
};

interface PoktFeeProps {
  symbol: string;
}

const PoktFee: React.FC<PoktFeeProps> = ({ symbol }) => {
  const theme = useTheme();
  const { networkFee, feeFetchStatus, getNetworkFee } = useTransferContext();

  return (
    <Stack
      position={"relative"}
      borderRadius={"2px"}
      border={`1px solid ${theme.customColors.dark25}`}
      height={40}
      justifyContent={"center"}
      paddingLeft={0.7}
      width={80}
      minWidth={80}
      maxWidth={80}
      boxSizing={"border-box"}
    >
      <Typography
        fontSize={10}
        color={theme.customColors.dark50}
        position={"absolute"}
        bgcolor={theme.customColors.dark2}
        whiteSpace={"nowrap"}
        top={-10}
        left={2}
        paddingX={0.6}
      >
        Fee ({symbol})
      </Typography>
      {feeFetchStatus === "loading" && !networkFee ? (
        <Skeleton variant={"rectangular"} width={40} height={20} />
      ) : feeFetchStatus === "error" ? (
        <Button
          sx={{
            color: theme.customColors.red100,
            fontSize: 12,
            paddingLeft: 0,
          }}
          onClick={getNetworkFee}
        >
          Error. Retry
        </Button>
      ) : (
        <Typography fontSize={16} fontWeight={600}>
          0.01
        </Typography>
      )}
    </Stack>
  );
};

const AmountFeeInputs: React.FC = () => {
  const theme = useTheme();
  const { networkFee, feeFetchStatus, disableInputs } = useTransferContext();
  const { control, getValues, setValue, clearErrors, watch } =
    useFormContext<FormValues>();
  const {
    data: priceByContractAddress,
    isError: isAssetsPriceError,
    isLoading: isLoadingAssetsPrice,
    refetch: refetchAssetsPrice,
  } = useGetAssetPrices(false);

  const [
    amountFromForm,
    toAddress,
    feeSpeed,
    protocol,
    chainId,
    fromAddress,
    asset,
  ] = watch([
    "amount",
    "toAddress",
    "feeSpeed",
    "protocol",
    "chainId",
    "from",
    "asset",
  ]);

  const networkPriceData = useGetPrices();
  const {
    data: pricesByProtocolAndChain,
    isLoading,
    isError: isNativePriceError,
    isUninitialized,
  } = networkPriceData;

  const loadingNetworkPrice = isLoading || isUninitialized;
  const selectedNetworkPrice: number =
    pricesByProtocolAndChain?.[protocol]?.[chainId] || 0;

  const assetUsdPrice = asset
    ? priceByContractAddress?.[asset.contractAddress] || 0
    : 0;

  useEffect(() => {
    if (asset) {
      setTimeout(refetchAssetsPrice, 0);
    }
  }, [asset]);

  const accountBalances = useAppSelector(accountBalancesSelector);
  const symbol = useAppSelector(symbolOfNetworkSelector(protocol, chainId));
  const transferMinAmount = useAppSelector(
    transferMinAmountOfNetworkSelector(protocol, chainId)
  );

  const nativeBalance = useMemo(() => {
    return (accountBalances[protocol][chainId][fromAddress] ||
      {}) as AccountBalanceInfo;
  }, [accountBalances, protocol, chainId, fromAddress]);

  const assetBalance: AccountBalanceInfo = useMemo(() => {
    if (asset) {
      return (
        accountBalances[protocol]?.[chainId]?.[asset.contractAddress]?.[
          fromAddress
        ] || {}
      );
    }
  }, [accountBalances, protocol, chainId, fromAddress, asset]);

  const amount = asset ? assetBalance?.amount : nativeBalance?.amount;
  const loadingBalances = nativeBalance?.loading || assetBalance?.loading;
  const errorBalances = nativeBalance?.error || assetBalance?.error;
  const loadingAmountUsdPrice = asset
    ? isLoadingAssetsPrice
    : loadingNetworkPrice;
  const errorLoadingUsdPrice = asset ? isAssetsPriceError : isNativePriceError;

  const onClickAll = useCallback(() => {
    const feeSpeed = getValues("feeSpeed");
    const protocol = getValues("protocol");

    let fee: number;

    if (protocol === SupportedProtocols.Ethereum) {
      fee = Number((networkFee as EthereumNetworkFee)?.[feeSpeed]?.amount || 0);
    } else {
      fee = (networkFee as PocketNetworkFee)?.value || 0;
    }

    const transferFromBalance = asset ? amount || 0 : (amount || 0) - fee;

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [amount, setValue, clearErrors, getValues, asset, networkFee]);

  const isEth = SupportedProtocols.Ethereum === protocol;

  const disableAmountInput =
    !!disableInputs ||
    !amount ||
    (isEth && !isValidAddress(toAddress, protocol)) ||
    feeFetchStatus !== "fetched";

  const feeSelected =
    protocol === SupportedProtocols.Ethereum
      ? (networkFee as EthereumNetworkFee)?.[feeSpeed]?.amount
      : (networkFee as PocketNetworkFee)?.value;

  return (
    <Stack
      direction={isEth ? "column" : "row"}
      alignItems={"center"}
      sx={{
        order: 2,
        "& .MuiFormHelperText-root": {
          left: 10,
          bottom: "-24px",
          width: "calc(100% - 30px)",
        },
      }}
      width={1}
      maxWidth={1}
      spacing={2}
      marginTop={isEth ? "20px!important" : 0}
    >
      <Stack direction={"row"} alignItems={"center"} spacing={1} width={1}>
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

              if (
                loadingBalances ||
                errorBalances ||
                feeFetchStatus !== "fetched"
              ) {
                return "";
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
          render={({ field, fieldState: { error } }) => (
            <TextField
              label={`Amount (${asset?.symbol || symbol})`}
              required
              size={"small"}
              type={"number"}
              disabled={disableAmountInput}
              InputLabelProps={{ shrink: !!field.value }}
              sx={{
                width: isEth ? 1 : 248,
                "& .MuiFormHelperText-root": {
                  bottom: "-16px",
                },
                "& .MuiInputBase-root": {
                  fontSize: 16,
                  fontWeight: 700,
                },
                "& input[type=number]": {
                  "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
                    {
                      WebkitAppearance: "none",
                      margin: 0,
                    },
                  MozAppearance: "textfield",
                },
              }}
              InputProps={{
                endAdornment: (
                  <Stack
                    direction={"row"}
                    height={40}
                    alignItems={"center"}
                    paddingRight={1}
                  >
                    <Button
                      onClick={onClickAll}
                      disabled={disableAmountInput}
                      sx={{
                        minWidth: 0,
                        height: 20,
                        padding: 0,
                        color: theme.customColors.primary500,
                        marginTop: 0.2,
                        fontSize: 13,
                        textDecoration: "underline",
                        "&:hover": {
                          textDecoration: "underline",
                          backgroundColor: theme.customColors.white,
                        },
                      }}
                    >
                      All
                    </Button>
                    <Divider
                      flexItem
                      orientation={"vertical"}
                      sx={{ marginX: 1, marginY: 0.5 }}
                    />
                    <Stack
                      position={"relative"}
                      height={40}
                      justifyContent={"center"}
                      minWidth={30}
                      display={errorLoadingUsdPrice ? "none" : "flex"}
                    >
                      <Typography
                        fontSize={14}
                        color={
                          theme.customColors[
                            disableAmountInput ? "dark15" : "dark75"
                          ]
                        }
                        position={"absolute"}
                        bgcolor={theme.customColors.dark2}
                        whiteSpace={"nowrap"}
                        top={-11}
                        left={-12}
                        paddingX={0.8}
                        zIndex={2}
                        sx={{
                          transform: "scale(0.74)",
                        }}
                      >
                        USD
                      </Typography>
                      {loadingAmountUsdPrice ? (
                        <Skeleton
                          height={15}
                          width={30}
                          variant={"rectangular"}
                        />
                      ) : (
                        <Typography
                          fontSize={12}
                          color={
                            theme.customColors[
                              disableAmountInput ? "dark15" : "dark75"
                            ]
                          }
                          width={"min-content"}
                          textOverflow={"ellipsis"}
                          overflow={"hidden"}
                          whiteSpace={"nowrap"}
                          maxWidth={150}
                        >
                          {"$" +
                            returnNumWithTwoDecimals(
                              Number(amountFromForm) *
                                (asset ? assetUsdPrice : selectedNetworkPrice),
                              "0"
                            )}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                ),
              }}
              error={amount === 0 || !!error?.message}
              helperText={
                amount === 0 && !errorBalances && !loadingBalances
                  ? "This account doesn't have balance."
                  : error?.message
              }
              {...field}
            />
          )}
        />
        {!isEth && <PoktFee symbol={symbol} />}
      </Stack>
      {isEth && <EthFeeInputs networkPriceData={networkPriceData} />}
    </Stack>
  );
};

export default AmountFeeInputs;
