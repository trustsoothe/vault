import type {
  SerializedAccountReference,
  SerializedAsset,
  SerializedNetwork,
} from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { ExternalTransferRequest } from "../../types/communication";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useForm, FormProvider } from "react-hook-form";
import RequestFrom from "../common/RequestFrom";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import AccountStep from "./AccountStep";
import TransferInfoStep from "./TransferInfoStep";
import OperationFailed from "../common/OperationFailed";
import { getAssetByProtocol } from "../../utils";

export interface FormValues {
  fromType: "saved_account" | "private_key";
  from: string;
  toAddress: string;
  amount: string;
  memo?: string;
  asset: SerializedAsset | null;
  network: SerializedNetwork | null;
  accountPassword: string;
}

interface TransferProps {
  accounts: SerializedAccountReference[];
  assets: SerializedAsset[];
}

const Transfer: React.FC<TransferProps> = ({ accounts, assets }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const requesterInfo: ExternalTransferRequest = location.state;
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<
    "loading" | "error" | "setAccount" | "setTransferData" | "submitted"
  >("setAccount");
  const methods = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      fromType: "saved_account",
      asset: null,
      network: null,
      memo: "",
      from: "",
      toAddress: "",
      amount: "",
      accountPassword: "",
    },
  });
  const {
    control,
    watch,
    register,
    setValue,
    clearErrors,
    handleSubmit,
    formState,
    getFieldState,
  } = methods;

  const [fromAddressStatus, setFromAddressStatus] = useState<string>(null);
  const [fromType, from, asset] = watch(["fromType", "from", "asset"]);

  useEffect(() => {
    setValue("from", "");
    setValue("amount", "");
    setValue("accountPassword", "");
    setValue("network", null);
    clearErrors("from");
    clearErrors("amount");
    clearErrors("accountPassword");
    clearErrors("network");

    if (fromType === "private_key" && requesterInfo?.protocol) {
      const asset = getAssetByProtocol(assets, requesterInfo.protocol);

      if (asset) {
        setValue("asset", asset);
      }
    } else {
      setValue("asset", null);
    }

    clearErrors("asset");
  }, [fromType]);

  useEffect(() => {
    const fromState = getFieldState("from");
    if (from && !fromState.invalid && fromType === "saved_account") {
      const account = accounts.find((value) => value.address === from);

      if (account) {
        const asset = getAssetByProtocol(assets, account.protocol);

        setValue("asset", asset || null);
      }
    }
  }, [from]);

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
    setTimeout(() => {
      if (requesterInfo) {
        setValue("amount", requesterInfo.amount.toString());
        setValue("toAddress", requesterInfo.toAddress);
        if (requesterInfo.memo) {
          setValue("memo", requesterInfo.memo);
        }
      }
    }, 100);
  }, [requesterInfo]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (status === "setAccount") {
        setStatus("setTransferData");
        return;
      }

      setStatus("loading");
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

      setStatus(response.error ? "error" : "submitted");
    },
    [requesterInfo, status]
  );

  const onClickCancel = useCallback(async () => {
    if (status === "setTransferData") {
      setStatus("setAccount");
      return;
    }

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
  }, [requesterInfo, status, navigate]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error sending the transaction."}
          onCancel={onClickCancel}
        />
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

    const settingAccount = status === "setAccount";

    const component = settingAccount ? (
      <AccountStep
        fromAddressStatus={fromAddressStatus}
        fromAddress={fromAddress}
        request={requesterInfo}
      />
    ) : (
      <TransferInfoStep
        fee={assetFee}
        isLoadingFee={isLoadingFee}
        fromBalance={fromBalance}
        isLoadingBalance={isLoadingBalance}
        request={requesterInfo}
      />
    );

    const secondaryBtnText = settingAccount ? "Cancel" : "Back";
    const primaryBtnText = settingAccount ? "Continue" : "Send";

    return (
      <>
        {requesterInfo ? (
          <RequestFrom
            title={"Transfer Request from:"}
            origin={requesterInfo.origin}
            faviconUrl={requesterInfo.faviconUrl}
            containerProps={{
              mb: "15px",
            }}
          />
        ) : (
          <Typography
            variant={"h6"}
            marginTop={"10px"}
            mb={"15px"}
            textAlign={"center"}
          >
            {"New Transfer"}
          </Typography>
        )}
        {component}
        <Stack
          direction={"row"}
          spacing={"15px"}
          marginTop={"20px!important"}
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
            {secondaryBtnText}
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
            {primaryBtnText}
          </Button>
        </Stack>
      </>
    );
  }, [
    status,
    register,
    control,
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
    navigate,
  ]);

  return (
    <FormProvider {...methods}>
      <Stack
        width={1}
        height={1}
        maxWidth={1}
        boxSizing={"border-box"}
        component={"form"}
        onSubmit={handleSubmit(onSubmit)}
        justifyContent={"center"}
        alignItems={"center"}
      >
        {content}
      </Stack>
    </FormProvider>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
  assets: state.vault.entities.assets.list,
});

export default connect(mapStateToProps)(Transfer);
