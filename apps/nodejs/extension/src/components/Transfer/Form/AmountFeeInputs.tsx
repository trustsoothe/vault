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

export type AmountStatus = "not-fetched" | "loading" | "error" | "fetched";

interface AmountFeeInputsProps {
  feeStatus: AmountStatus;
  networkFee: PocketNetworkFee | EthereumNetworkFee;
  requestAmount?: number;
  getFee: () => void;
}

const AmountFeeInputs: React.FC<AmountFeeInputsProps> = ({
  feeStatus,
  networkFee,
  getFee,
  requestAmount,
}) => {
  const theme = useTheme();
  const { control, getValues, setValue, clearErrors, watch } =
    useFormContext<FormValues>();

  const [amountFromForm, toAddress, feeSpeed, protocol, chainId, fromAddress] =
    watch(["amount", "toAddress", "feeSpeed", "protocol", "chainId", "from"]);

  const {
    data: pricesByProtocolAndChain,
    isLoading,
    isUninitialized,
  } = useGetPrices();

  const loadingPrice = isLoading || isUninitialized;
  const selectedNetworkPrice: number =
    pricesByProtocolAndChain?.[protocol]?.[chainId] || 0;

  const accountBalances = useAppSelector((state) => state.app.accountBalances);
  const transferMinAmount = useAppSelector(
    (state) =>
      state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      )?.transferMinValue
  );

  const { amount, error, loading }: AccountBalanceInfo = useMemo(() => {
    // todo: handle asset (token: i.e. usdc)
    return accountBalances[protocol][chainId][fromAddress] || {};
  }, [accountBalances, protocol, chainId, fromAddress]);

  const symbol = useAppSelector((state) => {
    return (
      state.vault.entities.assets.list.find(
        (asset) => asset.protocol === protocol
      )?.symbol || ""
    );
  });

  const onClickAll = useCallback(() => {
    const feeFromForm = getValues("fee");
    const transferFromBalance = (amount || 0) - (Number(feeFromForm) || 0);

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [amount, setValue, clearErrors, getValues]);

  const isEth = SupportedProtocols.Ethereum === protocol;

  const disableAmountInput =
    !!requestAmount ||
    !amount ||
    (isEth && !isValidAddress(toAddress, protocol)) ||
    feeStatus !== "fetched";
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
            validate: (value, formValues: FormValues) => {
              const amountFromInput = Number(value);
              const fee = Number(formValues.fee);

              if (isNaN(amountFromInput) || isNaN(fee)) {
                return "Invalid amount";
              }

              if (loading || error || feeStatus !== "fetched") {
                return "";
              }

              const total = amountFromInput + fee;

              // todo: improve this. will require decimals on network and assets (token)
              const min = Number(transferMinAmount);
              if (amountFromInput < min) {
                return `Min is ${transferMinAmount}`;
              }

              return total > amount ? `Insufficient balance` : true;
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              label={symbol ? `Amount (${symbol})` : "Amount"}
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
                      {loadingPrice ? (
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
                          $
                          {returnNumWithTwoDecimals(
                            Number(amountFromForm) * selectedNetworkPrice,
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
              Fee (POKT)
            </Typography>
            {feeStatus === "loading" ? (
              <Skeleton variant={"rectangular"} width={40} height={20} />
            ) : feeStatus === "error" ? (
              <Button
                sx={{
                  color: theme.customColors.red100,
                  fontSize: 12,
                  paddingLeft: 0,
                }}
                onClick={getFee}
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
                disabled={!networkFee || feeStatus !== "fetched"}
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
              Fee (ETH / USD)
            </Typography>
            {!toAddress ? (
              <Typography fontSize={14} color={theme.customColors.red100}>
                Select recipient first
              </Typography>
            ) : feeStatus === "loading" ? (
              <>
                <Skeleton variant={"rectangular"} width={80} height={20} />
                <Divider
                  flexItem
                  orientation={"vertical"}
                  sx={{ marginX: 0.7, marginY: 0.5 }}
                />
                <Skeleton variant={"rectangular"} width={80} height={20} />
              </>
            ) : feeStatus === "error" ? (
              <Typography fontSize={14} color={theme.customColors.red100}>
                Error getting fee.{" "}
                <span
                  onClick={getFee}
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
