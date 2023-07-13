import type { RootState } from "../../redux/store";
import type { TransferRequest } from "../../redux/slices/app";
import type {
  SerializedAccountReference,
  SerializedAsset,
} from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import RequestFrom from "../common/RequestFrom";
import AmountHelperText from "./AmountHelperText";
import CircularLoading from "../common/CircularLoading";
import AutocompleteAsset from "../Account/AutocompleteAsset";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface FormValues {
  fromType: "saved_account" | "private_key";
  from: string;
  toAddress: string;
  amount: string;
  asset: SerializedAsset | null;
  accountPassword: string;
}

export const isHex = (str: string) => {
  return str.match(/^[0-9a-fA-F]+$/g);
};

export const byteLength = (str: string) => new Blob([str]).size;

const isAddress = (str: string) => isHex(str) && byteLength(str) === 40;

//todo: validate private key?
const isPrivateKey = (str: string) => isHex(str) && byteLength(str) === 128;

interface TransferProps {
  accounts: SerializedAccountReference[];
}

const Transfer: React.FC<TransferProps> = ({ accounts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const requesterInfo: TransferRequest = location.state;
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<
    "loading" | "error" | "normal" | "submitted"
  >("normal");
  const {
    control,
    watch,
    register,
    setValue,
    clearErrors,
    handleSubmit,
    formState,
    getFieldState,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      fromType: "saved_account",
      asset: null,
      from: "",
      toAddress: "",
      amount: "",
      accountPassword: "",
    },
  });

  const [fromAddressStatus, setFromAddressStatus] = useState<string>(null);
  const [fromType, from, asset] = watch(["fromType", "from", "asset"]);

  useEffect(() => {
    setValue("from", "");
    setValue("amount", "");
    setValue("accountPassword", "");
    setValue("asset", null);
    clearErrors("from");
    clearErrors("amount");
    clearErrors("accountPassword");
    clearErrors("asset");
  }, [fromType]);

  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [fromBalance, setFromBalance] = useState<number>(null);

  const getFromBalance = useCallback(() => {
    const fromState = getFieldState("from");
    if (from && !fromState.invalid) {
      setIsLoadingBalance(true);
      //todo: add logic to fetch from balance
      setTimeout(() => {
        setFromBalance(502.31);
        setIsLoadingBalance(false);
      }, 1000);
    } else {
      setFromBalance(null);
    }
  }, [from, getFieldState]);

  useEffect(() => {
    getFromBalance();
  }, [getFromBalance]);

  const [isLoadingFee, setIsLoadingFee] = useState<boolean>(false);
  const [assetFee, setAssetFee] = useState<number>(null);

  const getAssetFee = useCallback(() => {
    if (asset?.id) {
      setIsLoadingFee(true);
      //todo: add logic to fetch fee
      setTimeout(() => {
        setAssetFee(0.01);
        setIsLoadingFee(false);
      }, 1000);
    } else {
      setAssetFee(null);
    }
  }, [asset]);

  useEffect(() => {
    getAssetFee();
  }, [getAssetFee]);

  useEffect(() => {
    if (isAddress(from)) {
      if (accounts.some((account) => account.address === from)) {
        setValue("asset", null);
      }
    }
  }, [from]);

  const fromAddress = useMemo(() => {
    return searchParams?.get("fromAddress") || requesterInfo?.fromAddress;
  }, [searchParams, requesterInfo]);

  useEffect(() => {
    const address = fromAddress;

    if (address) {
      if (accounts.some((account) => account.address === address)) {
        setValue("from", address);
        setFromAddressStatus("is_account_saved");
      } else {
        setValue("fromType", "private_key");
        setFromAddressStatus("private_key_required");
      }
    } else {
      setFromAddressStatus(null);
    }
  }, [accounts, fromAddress]);

  useEffect(() => {
    if (requesterInfo) {
      setValue("amount", requesterInfo.amount.toString());
      setValue("toAddress", requesterInfo.toAddress);
    }
  }, [requesterInfo]);

  const onClickAll = useCallback(() => {
    const transferFromBalance = (fromBalance || 0) - (assetFee || 0);

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [fromBalance, setValue, clearErrors, assetFee]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setStatus("loading");
      try {
        const response = await AppToBackground.sendRequestToAnswerTransfer({
          rejected: false,
          transferData: {
            asset: data.asset,
            amount: data.amount,
            toAddress: data.toAddress,
            from:
              data.fromType === "saved_account"
                ? {
                    address: data.from,
                    password: data.accountPassword,
                  }
                : data.from,
          },
          request: requesterInfo,
        });

        if (!requesterInfo) {
          setStatus("submitted");
        }
      } catch (e) {
        if (!requesterInfo) {
          setStatus("error");
        }
      }
    },
    [requesterInfo]
  );

  const onClickCancel = useCallback(async () => {
    if (requesterInfo) {
      await AppToBackground.sendRequestToAnswerTransfer({
        rejected: true,
        transferData: null,
        request: requesterInfo,
      });
    } else {
      if (location.key !== "default") {
        navigate(-1);
      } else {
        navigate("/");
      }
    }
  }, [requesterInfo]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <>
          <Typography>There was an error sending the transaction.</Typography>
          <Stack direction={"row"} spacing={"20px"}>
            <Button
              variant={"outlined"}
              sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
              fullWidth
              onClick={onClickCancel}
            >
              Cancel
            </Button>
            <Button
              variant={"contained"}
              sx={{ textTransform: "none", height: 30, fontWeight: 600 }}
              fullWidth
              type={"submit"}
            >
              Retry
            </Button>
          </Stack>
        </>
      );
    }

    if (status === "submitted") {
      return (
        <>
          <Typography textAlign={"center"}>
            The transaction was sent successfully!
          </Typography>
          <Button sx={{ textTransform: "none" }} onClick={() => navigate("/")}>
            Accept
          </Button>
        </>
      );
    }

    return (
      <>
        {requesterInfo ? (
          <RequestFrom
            title={"Transfer Request from:"}
            origin={requesterInfo.origin}
            faviconUrl={requesterInfo.faviconUrl}
          />
        ) : (
          <Typography variant={"h6"} marginY={"10px"} textAlign={"center"}>
            {"New Transfer"}
          </Typography>
        )}
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          mb={"15px"}
          display={fromAddressStatus ? "none" : "flex"}
          width={1}
        >
          <Typography>From type</Typography>
          <Controller
            name={"fromType"}
            control={control}
            render={({ field }) => (
              <TextField
                select
                size={"small"}
                placeholder={"Type"}
                sx={{
                  "& .MuiInputBase-root": {
                    minHeight: 30,
                    maxHeight: 30,
                    height: 30,
                  },
                }}
                {...field}
              >
                <MenuItem value={"saved_account"}>Saved Account</MenuItem>
                <MenuItem value={"private_key"}>Private Key</MenuItem>
              </TextField>
            )}
          />
        </Stack>

        <Typography
          fontSize={10}
          color={"gray"}
          component={"span"}
          display={
            fromAddressStatus === "private_key_required" ? "block" : "none"
          }
        >
          Introduce the private key of the following wallet:
          <br /> <b>{fromAddress}</b>.
        </Typography>

        {fromType === "private_key" ? (
          <TextField
            label={"Private Key"}
            fullWidth
            size={"small"}
            {...register("from", {
              required: "Required",
              validate: (value, formValues) => {
                if (formValues.fromType === "private_key") {
                  // todo: when fromAddress presented, the private key should be the private key of fromAddress wallet
                  if (!isPrivateKey(value)) {
                    return "Invalid Private Key";
                  }
                }
                return true;
              },
            })}
            error={!!formState?.errors?.from}
            helperText={formState?.errors?.from?.message}
          />
        ) : (
          <Controller
            name={"from"}
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label={"From"}
                fullWidth
                size={"small"}
                select
                sx={{
                  "& input": {
                    fontSize: 14,
                  },
                }}
                disabled={!!fromAddressStatus}
                error={!!error}
                helperText={error?.message}
                {...field}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.address}>
                    <Typography fontSize={14}> {account.address}</Typography>
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}
        {fromType === "private_key" ? (
          <AutocompleteAsset control={control} />
        ) : (
          <TextField
            label={"Account Password"}
            fullWidth
            size={"small"}
            type={"password"}
            {...register("accountPassword", {
              required: "Required",
            })}
            error={!!formState?.errors?.accountPassword}
            helperText={formState?.errors?.accountPassword?.message}
          />
        )}

        <Divider sx={{ width: 1, my: "15px" }} />

        <Controller
          control={control}
          name={"amount"}
          rules={{
            required: "Required",
            min: {
              value: 0.01,
              message: "Min is 0.01",
            },
            max: fromBalance
              ? {
                  value: fromBalance,
                  message: `Max is ${fromBalance}`,
                }
              : undefined,
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              label={"Amount"}
              fullWidth
              size={"small"}
              type={"number"}
              disabled={!!requesterInfo?.amount}
              error={!!error?.message}
              InputLabelProps={{ shrink: !!field.value }}
              helperText={
                <AmountHelperText
                  isLoadingBalance={isLoadingBalance}
                  accountBalance={fromBalance}
                  disableAll={!!requesterInfo?.amount}
                  transferFee={assetFee}
                  isLoadingFee={isLoadingFee}
                  onClickAll={onClickAll}
                />
              }
              {...field}
            />
          )}
        />

        <TextField
          label={"To Address"}
          fullWidth
          size={"small"}
          disabled={!!requesterInfo?.toAddress}
          {...register("toAddress", {
            required: "Required",
            validate: (value) => {
              if (!isAddress(value)) {
                return "Invalid Address";
              }

              return true;
            },
          })}
          error={!!formState?.errors?.toAddress}
          helperText={formState?.errors?.toAddress?.message}
        />

        <Stack
          direction={"row"}
          spacing={"15px"}
          marginTop={"15px!important"}
          width={1}
        >
          <Button
            fullWidth
            variant={"outlined"}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={onClickCancel}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant={"contained"}
            sx={{
              textTransform: "none",
              backgroundColor: "rgb(29, 138, 237)",
              fontWeight: 600,
            }}
            type={"submit"}
          >
            Accept
          </Button>
        </Stack>
      </>
    );
  }, [
    status,
    register,
    control,
    onClickAll,
    onClickCancel,
    formState,
    requesterInfo,
    isLoadingBalance,
    fromBalance,
    isLoadingFee,
    assetFee,
    fromAddressStatus,
    fromAddress,
    fromType,
    accounts,
  ]);

  return (
    <Stack
      width={1}
      height={1}
      maxWidth={1}
      boxSizing={"border-box"}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
      spacing={"15px"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(Transfer);
