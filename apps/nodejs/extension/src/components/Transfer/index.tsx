import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
import type { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import type {
  SerializedAccountReference,
  SerializedAsset,
  SerializedNetwork,
} from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { AmountStatus } from "./Form/AmountFeeInputs";
import type { ExternalTransferRequest } from "../../types/communication";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormProvider, useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
} from "@poktscan/keyring";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { getAccountBalance, getProtocolFee } from "../../redux/slices/vault";
import { getAssetByProtocol, isAddress, isPrivateKey } from "../../utils";
import TransferSubmittedStep from "./TransferSubmitted";
import OperationFailed from "../common/OperationFailed";
import AccountFromRequest from "./AccountFromRequest";
import { useAppDispatch } from "../../hooks/redux";
import SummaryStep from "./Summary/Step";
import TransferForm from "./Form/index";
import {
  getAddressFromPrivateKey,
  isTransferHealthyForNetwork,
  protocolsAreEquals,
} from "../../utils/networkOperations";
import Requester from "../common/Requester";

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

type Status =
  | "loading"
  | "error"
  | "setData"
  | "summary"
  | "submitted"
  | "invalid_network";

export type FromAddressStatus = "is_account_saved" | "private_key_required";

const Transfer: React.FC<TransferProps> = ({ accounts, assets, networks }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const requesterInfo: ExternalTransferRequest = location.state;
  const [searchParams] = useSearchParams();
  const previousAsset = useRef<string>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [balanceStatus, setBalanceStatus] =
    useState<AmountStatus>("not-fetched");
  const [feeStatus, setFeeStatus] = useState<AmountStatus>("not-fetched");
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
    setFocus,
  } = methods;

  const [fromAddressStatus, setFromAddressStatus] =
    useState<FromAddressStatus>(null);
  const [accountFromAddress, setAccountFromAddress] =
    useState<SerializedAccountReference>(null);
  const [fromType, from, asset, accountPassword] = watch([
    "fromType",
    "from",
    "asset",
    "accountPassword",
  ]);
  const [wrongPassword, setWrongPassword] = useState(false);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [accountPassword]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatus("setData");
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

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
      const preferred = networks.find(
        (item) =>
          protocolsAreEquals(item.protocol, asset.protocol) && item.isPreferred
      );
      const networkToSelect = networks.find(
        (item) =>
          protocolsAreEquals(item.protocol, asset.protocol) && item.isDefault
      );

      if (networkToSelect) {
        setValue("network", preferred || networkToSelect);
        clearErrors("network");
      }
    }
  }, [asset, networks]);

  const [fromBalance, setFromBalance] = useState<number>(null);

  const getFromBalance = useCallback(async () => {
    if (from && asset && (isAddress(from) || isPrivateKey(from))) {
      setBalanceStatus("loading");
      let address: string;
      if (isPrivateKey(from)) {
        address = await getAddressFromPrivateKey(from, asset.protocol);
      } else {
        address = from;
      }
      dispatch(getAccountBalance({ address, protocol: asset.protocol }))
        .unwrap()
        .then((result) => {
          if (result) {
            setFromBalance(result.amount);
            setBalanceStatus("fetched");
          }
        })
        .catch(() => setBalanceStatus("error"));
    } else {
      setFromBalance(null);
      setBalanceStatus("not-fetched");
    }
  }, [from, dispatch, fromType, asset]);

  useEffect(() => {
    getFromBalance();
  }, [getFromBalance]);

  const [assetFee, setAssetFee] = useState<number>(null);

  const getAssetFee = useCallback(() => {
    if (asset?.id && asset.id !== previousAsset.current) {
      previousAsset.current = asset.id;
      setFeeStatus("loading");
      dispatch(getProtocolFee(asset.protocol))
        .unwrap()
        .then((result) => {
          setAssetFee(result.fee);
          setValue("fee", result.fee.toString());
          setFeeStatus("fetched");
        })
        .catch(() => setFeeStatus("error"));
    } else if (!asset) {
      setAssetFee(null);
      setFeeStatus("not-fetched");
      previousAsset.current = null;
    }
  }, [asset, networks, dispatch]);

  useEffect(() => {
    getAssetFee();
  }, [getAssetFee]);

  const fromInfo = useMemo(() => {
    return {
      fromAddress:
        searchParams?.get("fromAddress") || requesterInfo?.fromAddress,
      protocol: (searchParams?.get("protocol") ||
        requesterInfo?.protocol?.name) as Protocol["name"],
      chainID: (searchParams?.get("chainID") ||
        requesterInfo?.protocol?.chainID) as ChainID<SupportedProtocols>,
    };
  }, [searchParams, requesterInfo]);

  useEffect(() => {
    const { fromAddress: address, protocol, chainID } = fromInfo;

    const protocolObj = {
      name: protocol,
      chainID,
    } as Protocol;

    if (address) {
      const account = accounts.find(
        (account) =>
          account.address === address &&
          protocolsAreEquals(protocolObj, account.protocol)
      );
      if (account) {
        setValue("from", address);
        if (requesterInfo) {
          setFromAddressStatus("is_account_saved");
          setAccountFromAddress(account);
        }
      } else {
        setValue("fromType", "private_key");
        setFromAddressStatus("private_key_required");

        const asset = getAssetByProtocol(assets, protocolObj);

        if (asset) {
          setValue("asset", asset);
        }
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

        if (requesterInfo.fee) {
          setValue("fee", requesterInfo.fee.toString());
        }

        if (fromAddressStatus === "is_account_saved") {
          setStatus("summary");
        }
      }
    }, 100);
  }, [requesterInfo]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (balanceStatus !== "fetched" || feeStatus !== "fetched") return;

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

      const accountId = accounts.find(
        (item) =>
          item.address === data.from &&
          protocolsAreEquals(item.protocol, data.asset.protocol)
      )?.id;

      const response = await AppToBackground.sendRequestToAnswerTransfer({
        rejected: false,
        transferData: {
          amount: Number(data.amount),
          from: {
            type:
              data.fromType === "private_key"
                ? SupportedTransferOrigins.RawPrivateKey
                : SupportedTransferOrigins.VaultAccountId,
            passphrase: data.accountPassword,
            asset: data.asset,
            value: data.fromType === "private_key" ? data.from : accountId,
          },
          network: data.network,
          to: {
            type: SupportedTransferDestinations.RawAddress,
            value: data.toAddress,
          },
          transferArguments: {
            chainID: data.asset.protocol
              .chainID as ChainID<SupportedProtocols.Pocket>,
            memo: data.memo,
            fee: Number(data.fee),
          },
        },
        request: requesterInfo,
      });

      if (response.error) {
        setStatus("error");
      } else {
        if (response?.data?.isPasswordWrong) {
          setWrongPassword(true);
          setStatus("summary");
        } else {
          if (response.data && response.data.hash) {
            setTransferHash(response.data.hash);
            setStatus("submitted");
          } else {
            setStatus("setData");
          }
        }
      }
      setSendingStatus(null);
    },
    [requesterInfo, status, balanceStatus, feeStatus, accounts]
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
        <TransferSubmittedStep
          fromBalance={fromBalance}
          hash={transferHash}
          protocol={asset.protocol}
        />
      );
    }

    const settingAccount = status === "setData";

    const component = settingAccount ? (
      <TransferForm
        fromAddressStatus={fromAddressStatus}
        fromAddress={fromInfo.fromAddress}
        fee={assetFee}
        fromBalance={fromBalance}
        request={requesterInfo}
        getBalance={getFromBalance}
        getFee={getAssetFee}
        feeStatus={feeStatus}
        balanceStatus={balanceStatus}
      />
    ) : (
      <SummaryStep
        fromBalance={fromBalance}
        wrongPassword={wrongPassword}
        compact={!!requesterInfo}
      />
    );

    const secondaryBtnText = settingAccount ? "Cancel" : "Back";
    const primaryBtnText = settingAccount ? "Continue" : "Send";

    return (
      <>
        {requesterInfo && (
          <>
            <Typography
              color={theme.customColors.primary999}
              fontWeight={700}
              lineHeight={"30px"}
              textAlign={"center"}
              sx={{ userSelect: "none" }}
            >
              Transfer Request from:
            </Typography>
            <Requester
              request={requesterInfo}
              hideBlock={true}
              containerProps={{
                marginTop: "5px!important",
                marginBottom:
                  status === "setData"
                    ? fromType === "private_key"
                      ? 1.5
                      : 2
                    : 1,
                paddingX: 1.5,
                paddingY: 0.5,
                height: 40,
                boxSizing: "border-box",
              }}
            />
          </>
        )}
        <Stack
          flexGrow={1}
          sx={{
            overflowY:
              requesterInfo && fromAddressStatus === "is_account_saved"
                ? undefined
                : "auto",
            marginRight: -1,
            paddingRight: 1,
            position: "relative",

            boxSizing: "border-box",
          }}
          width={"calc(100% + 10px)"}
        >
          {fromAddressStatus === "is_account_saved" &&
            accountFromAddress?.address === from &&
            status === "setData" && (
              <AccountFromRequest account={accountFromAddress} />
            )}
          {component}
        </Stack>
        <Stack
          direction={"row"}
          spacing={2}
          marginTop={"20px!important"}
          width={1}
        >
          <Button
            onClick={onClickCancel}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            variant={"outlined"}
            fullWidth
          >
            {secondaryBtnText}
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            disabled={[balanceStatus, feeStatus].includes("error")}
            type={"submit"}
          >
            {primaryBtnText}
          </Button>
        </Stack>
      </>
    );
  }, [
    theme,
    accountFromAddress,
    wrongPassword,
    onClickOk,
    status,
    register,
    control,
    onClickCancel,
    formState,
    requesterInfo,
    fromBalance,
    assetFee,
    fromAddressStatus,
    fromInfo,
    fromType,
    accounts,
    navigate,
    balanceStatus,
    feeStatus,
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
        paddingX={requesterInfo ? 2 : 0}
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
            ? requesterInfo
              ? 1
              : 1.5
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
