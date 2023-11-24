import type { FormValues } from "../index";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useCallback, useMemo } from "react";
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
import useDidMountEffect from "../../../hooks/useDidMountEffect";
import { useTransferContext } from "../../../contexts/TransferContext";

export type AmountStatus = "not-fetched" | "loading" | "error" | "fetched";

const AmountFeeInputs: React.FC = () => {
  const theme = useTheme();
  const { networkFee, getNetworkFee, feeFetchStatus, disableInputs } =
    useTransferContext();
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

  const {
    data: pricesByProtocolAndChain,
    isLoading,
    isUninitialized,
  } = useGetPrices();

  const loadingNetworkPrice = isLoading || isUninitialized;
  const selectedNetworkPrice: number =
    pricesByProtocolAndChain?.[protocol]?.[chainId] || 0;

  const assetUsdPrice = asset
    ? priceByContractAddress?.[asset.contractAddress] || 0
    : 0;

  useDidMountEffect(() => {
    if (asset) {
      setTimeout(refetchAssetsPrice, 0);
    }
  }, [asset]);

  const accountBalances = useAppSelector((state) => state.app.accountBalances);
  const transferMinAmount = useAppSelector(
    (state) =>
      state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      )?.transferMinValue
  );

  const nativeBalance: AccountBalanceInfo = useMemo(() => {
    return accountBalances[protocol][chainId][fromAddress] || {};
  }, [accountBalances, protocol, chainId, fromAddress]);

  const assetBalance: AccountBalanceInfo = useMemo(() => {
    if (asset) {
      return (
        accountBalances[protocol]?.[chainId]?.[asset.contractAddress]?.[
          fromAddress
        ] || {}
      );
    }
  }, [accountBalances, protocol, chainId, fromAddress]);

  const symbol = useAppSelector((state) => {
    return (
      state.vault.entities.assets.list.find(
        (asset) => asset.protocol === protocol
      )?.symbol || ""
    );
  });

  const amount = asset ? assetBalance?.amount : nativeBalance?.amount;
  const loadingBalances = nativeBalance?.loading || assetBalance?.loading;
  const errorBalances = nativeBalance?.error || assetBalance?.error;
  const loadingAmountUsdPrice = asset
    ? isLoadingAssetsPrice
    : loadingNetworkPrice;

  const onClickAll = useCallback(() => {
    const feeFromForm = getValues("fee");
    const transferFromBalance = asset
      ? amount || 0
      : (amount || 0) - (Number(feeFromForm) || 0);

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [amount, setValue, clearErrors, getValues, asset]);

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
              label={symbol ? `Amount (${asset?.symbol || symbol})` : "Amount"}
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
                amount === 0
                  ? "This account doesn't have balance."
                  : error?.message
              }
              {...field}
            />
          )}
        />
        {!isEth && (
          <Stack
            position={"relative"}
            borderRadius={"2px"}
            borderBottom={`1px solid ${theme.customColors.dark25}`}
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
            {feeFetchStatus === "loading" ? (
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
        )}
      </Stack>
      {isEth && (
        <Stack
          direction={"row"}
          width={1}
          marginTop={"25px!important"}
          spacing={1}
        >
          <Controller
            control={control}
            name={"feeSpeed"}
            render={({ field }) => (
              // <Stack
              //   position={"relative"}
              //   borderRadius={"2px"}
              //   border={`1px solid ${theme.customColors.dark25}`}
              //   height={40}
              //   alignItems={"center"}
              //   boxSizing={"border-box"}
              //   direction={"row"}
              //   width={170}
              //   minWidth={170}
              //   maxWidth={170}
              // >
              //   <Typography
              //     fontSize={10}
              //     color={theme.customColors.dark50}
              //     position={"absolute"}
              //     bgcolor={theme.customColors.dark2}
              //     whiteSpace={"nowrap"}
              //     top={-10}
              //     left={2}
              //     paddingX={0.6}
              //     zIndex={2}
              //   >
              //     Transfer Speed
              //   </Typography>
              //   {(["low", "medium", "high"] as const).map((speed, index) => {
              //     const isSelected = speed === field.value;
              //     const borderLeft =
              //       index !== 0
              //         ? `1px solid ${theme.customColors.dark15}`
              //         : undefined;
              //     return (
              //       <Button
              //         sx={{
              //           textTransform: "capitalize",
              //           borderLeft,
              //           minWidth: 50,
              //           paddingX: 1,
              //           fontSize: 12,
              //           fontWeight: isSelected ? 700 : undefined,
              //           color: isSelected
              //             ? `${theme.customColors.primary500}!important`
              //             : theme.customColors.dark75,
              //           borderRadius: 0,
              //           height: 40,
              //           pointerEvents: isSelected ? "none" : undefined,
              //         }}
              //         disabled={isSelected || feeStatus !== "fetched"}
              //         onClick={() => {
              //           if (!isSelected) {
              //             field.onChange(speed);
              //           }
              //         }}
              //       >
              //         {speed}
              //       </Button>
              //     );
              //   })}
              // </Stack>
              <TextField
                select
                size={"small"}
                label={"Tx Speed"}
                disabled={!networkFee || feeFetchStatus !== "fetched"}
                SelectProps={{
                  MenuProps: {
                    sx: {
                      "& .MuiMenuItem-root": {
                        // fontSize: 12,
                      },
                    },
                  },
                }}
                sx={{
                  width: 90,
                  "& .MuiSelect-icon": { top: 5, right: -2 },
                  // backgroundColor: theme.customColors.dark2,
                  "& .MuiSelect-select": {
                    paddingRight: "27px!important",
                  },
                  // "& .MuiInputBase-root": {
                  //   paddingTop: 0.3,
                  // },
                }}
                {...field}
              >
                <MenuItem value={"low"}>Low</MenuItem>
                <MenuItem value={"medium"}>Medium</MenuItem>
                <MenuItem value={"high"}>High</MenuItem>
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
              Fee ({symbol} / USD)
            </Typography>
            {!toAddress ? (
              <Typography fontSize={14} color={theme.customColors.red100}>
                Select recipient first
              </Typography>
            ) : feeFetchStatus === "loading" ? (
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
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  letterSpacing={"0.3px"}
                >
                  {(networkFee as EthereumNetworkFee)?.[feeSpeed]?.amount}
                </Typography>
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
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default AmountFeeInputs;
