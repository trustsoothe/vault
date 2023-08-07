import type {
  SerializedAccountReference,
  SerializedAsset,
  SerializedNetwork,
} from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { ExternalTransferRequest } from "../../types/communication";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm, FormProvider } from "react-hook-form";
import RequestFrom from "../common/RequestFrom";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import AccountStep from "./AccountStep";
import OperationFailed from "../common/OperationFailed";
import {
  getAssetByProtocol,
  getFee,
  isAddress,
  isTransferHealthyForNetwork,
} from "../../utils";
import { useAppDispatch } from "../../hooks/redux";
import { getAccountBalance } from "../../redux/slices/vault";
import SummaryStep from "./Summary/Step";
import TransferSubmittedStep from "./TransferSubmitted";

export interface FormValues {
  fromType: "saved_account" | "private_key";
  from: string;
  toAddress: string;
  amount: string;
  memo?: string;
  asset: SerializedAsset | null;
  network: SerializedNetwork | null;
  accountPassword: string;
  fee: string;
}

interface TransferProps {
  accounts: SerializedAccountReference[];
  assets: SerializedAsset[];
  networks: SerializedNetwork[];
}

const Transfer: React.FC<TransferProps> = ({ accounts, assets, networks }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const requesterInfo: ExternalTransferRequest = location.state;
  const [searchParams] = useSearchParams();
  const previousAsset = useRef<string>(null);

  const [status, setStatus] = useState<
    | "loading"
    | "error"
    | "setData"
    | "summary"
    | "submitted"
    | "invalid_network"
  >("setData");
  const [transferHash, setTransferHash] = useState<string>(null);
  const [sendingStatus, setSendingStatus] = useState<
    "check_network" | "sending"
  >(null);
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
      fee: "",
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
    setFocus,
  } = methods;

  const [fromAddressStatus, setFromAddressStatus] = useState<string>(null);
  const [fromType, from, asset] = watch(["fromType", "from", "asset"]);

  useEffect(() => {
    setValue("from", "");
    setValue("amount", "");
    setValue("fee", "");
    setValue("accountPassword", "");
    setValue("network", null);
    clearErrors("from");
    clearErrors("amount");
    clearErrors("fee");
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
    if (from && isAddress(from) && fromType === "saved_account") {
      const account = accounts.find((value) => value.address === from);

      if (account) {
        const asset = getAssetByProtocol(assets, account.protocol);

        setValue("asset", asset || null);
      }
    }
  }, [from]);

  useEffect(() => {
    if (asset) {
      const networkToSelect = networks.find(
        (item) =>
          item.protocol.chainID === asset.protocol.chainID &&
          item.protocol.name === asset.protocol.name &&
          item.isDefault
      );

      if (networkToSelect) {
        setValue("network", networkToSelect);
      }
    }
  }, [asset, networks]);

  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [fromBalance, setFromBalance] = useState<number>(null);
  const [errorBalance, setErrorBalance] = useState(false);

  const getFromBalance = useCallback(() => {
    const fromState = getFieldState("from");
    if (from && asset && !fromState.invalid) {
      setIsLoadingBalance(true);
      const address = fromType === "saved_account" ? from : from.slice(0, 40);
      dispatch(getAccountBalance({ address, protocol: asset.protocol }))
        .unwrap()
        .then((result) => {
          if (result) {
            setFromBalance(result.amount);
            setErrorBalance(false);
          }
        })
        .catch((e) => setErrorBalance(true))
        .finally(() => setIsLoadingBalance(false));
    } else {
      setFromBalance(null);
    }
  }, [from, getFieldState, dispatch, fromType, asset]);

  useEffect(() => {
    getFromBalance();
  }, [getFromBalance]);

  const [isLoadingFee, setIsLoadingFee] = useState<boolean>(false);
  const [assetFee, setAssetFee] = useState<number>(null);
  const [errorFee, setErrorFee] = useState(false);

  const getAssetFee = useCallback(() => {
    if (asset?.id && asset.id !== previousAsset.current) {
      previousAsset.current = asset.id;
      setIsLoadingFee(true);
      getFee(asset.protocol, networks)
        .then((result) => {
          setAssetFee(result);
          setValue("fee", result.toString());
          setErrorFee(false);
        })
        .catch((e) => setErrorFee(true))
        .finally(() => setIsLoadingFee(false));
    } else if (!asset) {
      setAssetFee(null);
    }
  }, [asset, networks]);

  useEffect(() => {
    getAssetFee();
  }, [getAssetFee]);

  const fromInfo = useMemo(() => {
    return {
      fromAddress:
        searchParams?.get("fromAddress") || requesterInfo?.fromAddress,
      protocol: searchParams?.get("protocol") || requesterInfo?.protocol?.name,
      chainID: searchParams?.get("chainID") || requesterInfo?.protocol?.chainID,
    };
  }, [searchParams, requesterInfo]);

  useEffect(() => {
    const { fromAddress: address, protocol, chainID } = fromInfo;

    if (address) {
      const account = accounts.find(
        (account) =>
          account.address === address &&
          account.protocol.name === protocol &&
          account.protocol.chainID === chainID
      );
      if (account) {
        setValue("from", address);
        setFromAddressStatus("is_account_saved");
      } else {
        setValue("fromType", "private_key");
        setFromAddressStatus("private_key_required");
      }
    } else {
      setFromAddressStatus(null);
    }
  }, [accounts, fromInfo]);

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
      if (isLoadingFee || isLoadingBalance || errorFee || errorBalance) return;

      if (status === "setData") {
        setStatus("summary");
        return;
      }

      setStatus("loading");
      setSendingStatus("check_network");
      const isHealthy = await isTransferHealthyForNetwork(data.network);

      if (!isHealthy) {
        setStatus("invalid_network");
        setSendingStatus(null);
        return;
      }
      setSendingStatus("sending");

      // todo: remove when transfer is integrated
      await new Promise((resolve) => setTimeout(resolve, 500));

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

      if (response.data && response.data.hash) {
        setTransferHash(response.data.hash);
      }
      setStatus(response.error ? "error" : "submitted");
      setSendingStatus(null);
    },
    [
      requesterInfo,
      status,
      errorFee,
      errorBalance,
      isLoadingFee,
      isLoadingBalance,
    ]
  );

  const onClickOk = useCallback(() => {
    setStatus("setData");
    setValue("network", null);
    setTimeout(() => setFocus("network"), 25);
  }, [setFocus, setValue]);

  const onClickCancel = useCallback(async () => {
    if (status === "summary") {
      setStatus("setData");
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
      let text: string;
      if (sendingStatus === "check_network") {
        text = "Checking RPC...";
      } else if (sendingStatus === "sending") {
        text = "Packing and sending...";
      }
      return <CircularLoading text={text} />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error sending the transaction."}
          onCancel={onClickCancel}
        />
      );
    }

    if (status === "invalid_network") {
      return (
        <OperationFailed
          text={
            "The provided network is unhealthy at the moment. Please select another one."
          }
          onCancel={onClickCancel}
          retryBtnText={"Ok"}
          retryBtnProps={{
            type: "button",
          }}
          onRetry={onClickOk}
        />
      );
    }

    if (status === "submitted") {
      return (
        <>
          <TransferSubmittedStep
            fromBalance={fromBalance}
            hash={transferHash}
          />
          <Button
            fullWidth
            variant={"contained"}
            sx={{
              height: 30,
              width: 120,
              marginTop: 0.5,
              backgroundColor: "rgb(29, 138, 237)",
              fontWeight: 600,
            }}
            onClick={() => navigate("/")}
          >
            Accept
          </Button>
        </>
      );
    }

    const settingAccount = status === "setData";

    const component = settingAccount ? (
      <AccountStep
        fromAddressStatus={fromAddressStatus}
        fromAddress={fromInfo.fromAddress}
        fee={assetFee}
        isLoadingFee={isLoadingFee}
        fromBalance={fromBalance}
        isLoadingBalance={isLoadingBalance}
        request={requesterInfo}
        errorBalance={errorBalance}
        errorFee={errorFee}
        getBalance={getFromBalance}
        getFee={getAssetFee}
      />
    ) : (
      <SummaryStep fromBalance={fromBalance} />
    );

    const secondaryBtnText = settingAccount ? "Cancel" : "Back";
    const primaryBtnText = settingAccount ? "Continue" : "Send";

    return (
      <>
        {requesterInfo && (
          <RequestFrom
            title={"Transfer Request from:"}
            origin={requesterInfo.origin}
            faviconUrl={requesterInfo.faviconUrl}
            containerProps={{
              spacing: 0,
              mt: 0.5,
            }}
          />
        )}
        <Stack flexGrow={1} sx={{ overflowY: "auto" }}>
          {component}
        </Stack>
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
              height: 30,
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
              height: 30,
              backgroundColor: "rgb(29, 138, 237)",
              fontWeight: 600,
            }}
            disabled={errorFee || errorBalance}
            type={"submit"}
          >
            {primaryBtnText}
          </Button>
        </Stack>
      </>
    );
  }, [
    onClickOk,
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
    fromInfo,
    fromType,
    accounts,
    navigate,
    errorBalance,
    errorFee,
    getFromBalance,
    getAssetFee,
    transferHash,
    sendingStatus,
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
        justifyContent={
          ["setData", "summary", "submitted"].includes(status)
            ? "flex-start"
            : "center"
        }
        alignItems={"center"}
        marginTop={
          ["setData", "summary", "submitted"].includes(status)
            ? "10px"
            : undefined
        }
      >
        {content}
      </Stack>
    </FormProvider>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
  assets: state.vault.entities.assets.list,
  networks: state.vault.entities.networks.list,
});

export default connect(mapStateToProps)(Transfer);
