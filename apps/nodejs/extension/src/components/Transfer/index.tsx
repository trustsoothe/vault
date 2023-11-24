import type { SerializedAccountReference } from "@poktscan/keyring";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  WPOKTBridge,
} from "@poktscan/keyring";
import type { AmountStatus } from "./Form/AmountFeeInputs";
import type { ExternalTransferRequest } from "../../types/communication";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormProvider, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import TransferSubmittedStep from "./TransferSubmitted";
import { useAppSelector } from "../../hooks/redux";
import SummaryStep from "./Summary/Step";
import TransferForm from "./Form/index";
import {
  isTransferHealthyForNetwork,
  isValidAddress,
} from "../../utils/networkOperations";
import Requester from "../common/Requester";
import { IAsset } from "../../redux/slices/app";
import { AccountComponent } from "../Account/SelectedAccount";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import TransferContextProvider, {
  ExternalTransferData,
  TransferType,
} from "../../contexts/TransferContext";
import { SendTransferParam } from "../../redux/slices/vault";

export type FeeSpeed = "n/a" | "low" | "medium" | "high";

export interface AssetLocationState {
  asset: IAsset;
}

export interface ExternalTransferState {
  asset?: IAsset;
  transferType?: TransferType;
  transferData: ExternalTransferData;
  requestInfo?: {
    origin: string;
    tabId: number;
    sessionId: string;
    chainId: string;
    protocol: SupportedProtocols;
  };
}

type LocationState = AssetLocationState | ExternalTransferState;

export interface FormValues {
  from: string;
  toAddress: string;
  amount: string;
  memo?: string;
  rpcUrl: string | null;
  accountPassword: string;
  fee: string;
  feeSpeed: FeeSpeed;
  protocol: SupportedProtocols;
  chainId: string;
  asset?: IAsset;
}

type Status =
  | "loading"
  | "error"
  | "form"
  | "summary"
  | "submitted"
  | "invalid_network";

const Transfer: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const networks = useAppSelector((state) => state.app.networks);
  const selectedProtocolOnApp = useAppSelector(
    (state) => state.app.selectedNetwork
  );
  const selectedChainOnApp = useAppSelector(
    (state) => state.app.selectedChainByNetwork[state.app.selectedNetwork]
  );
  const idOfSelectedAccountOnApp = useAppSelector(
    (state) => state.app.selectedAccountByNetwork[state.app.selectedNetwork]
  );
  const accounts = useAppSelector(
    (state) => state.vault.entities.accounts.list
  );

  const externalTransferState: LocationState = location.state || {};
  const externalTransferData =
    "transferData" in externalTransferState
      ? externalTransferState.transferData
      : undefined;
  const externalRequestInfo =
    "requestInfo" in externalTransferState
      ? externalTransferState?.requestInfo
      : undefined;

  const transferType: TransferType =
    "transferType" in externalTransferState
      ? externalTransferState?.transferType
      : TransferType.normal;

  const methods = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      rpcUrl: null,
      memo: externalTransferData?.memo || "",
      from: externalTransferData?.fromAddress || "",
      toAddress: externalTransferData?.toAddress || "",
      amount: externalTransferData?.amount || "",
      fee: "",
      accountPassword: "",
      feeSpeed:
        (externalRequestInfo?.protocol || selectedProtocolOnApp) ===
        SupportedProtocols.Pocket
          ? "n/a"
          : "low",
      protocol: externalRequestInfo?.protocol || selectedProtocolOnApp,
      chainId: externalRequestInfo?.chainId || selectedChainOnApp,
      asset:
        "asset" in externalTransferState ? externalTransferState.asset : null,
    },
  });
  const {
    watch,
    setValue,
    clearErrors,
    handleSubmit,
    setFocus,
    getValues,
    reset,
  } = methods;

  const [status, setStatus] = useState<Status>("form");
  const [feeStatus, setFeeStatus] = useState<AmountStatus>("not-fetched");
  const [transferHash, setTransferHash] = useState<string>(null);
  const [sendingStatus, setSendingStatus] = useState<
    "check_network" | "sending"
  >(null);
  const [protocol, chainId, accountPassword, fromAddress, toAddress, asset] =
    watch([
      "protocol",
      "chainId",
      "accountPassword",
      "from",
      "toAddress",
      "asset",
    ]);
  const previousProtocolRef = useRef<SupportedProtocols>(protocol);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [networkFee, setNetworkFee] = useState<
    PocketNetworkFee | EthereumNetworkFee
  >(null);
  const previousChain = useRef<string>(null);
  const previousChainForAsset = useRef<string>(chainId);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [accountPassword]);

  useEffect(() => {
    if (protocol) {
      const preferred = networks.find(
        // todo: fix when rpcs are enabled
        (item) =>
          // @ts-ignore
          item.protocol === protocol && item.chainId === chainId && 1 === 0 //&& item.isPreferred
      );
      // todo: add to networks that come from CDN a flag indicating it, to difference it from RPCs saved by user
      const networkToSelect = networks.find(
        (item) => item.protocol === protocol && item.chainId === chainId
      );

      if (networkToSelect) {
        setTimeout(() => {
          setValue("rpcUrl", preferred?.rpcUrl || networkToSelect.rpcUrl);
          clearErrors("rpcUrl");
        }, 0);
      }
    }
  }, [protocol, networks]);

  useDidMountEffect(() => {
    setValue(
      "protocol",
      externalRequestInfo?.protocol || selectedProtocolOnApp
    );
    setValue("chainId", externalRequestInfo?.chainId || selectedChainOnApp);
  }, [selectedProtocolOnApp, selectedChainOnApp, externalRequestInfo]);

  const selectedAccount = useMemo(() => {
    let callback: (account: SerializedAccountReference) => boolean;
    if (externalRequestInfo?.protocol && externalTransferData?.fromAddress) {
      callback = (account) =>
        account.protocol === externalRequestInfo.protocol &&
        account.address === externalTransferData?.fromAddress;
    } else {
      callback = (account) => account.id === idOfSelectedAccountOnApp;
    }

    return accounts.find(callback);
  }, [
    accounts,
    externalRequestInfo?.protocol,
    externalTransferData?.fromAddress,
    idOfSelectedAccountOnApp,
  ]);

  useDidMountEffect(() => {
    if (previousProtocolRef.current === protocol) return;
    previousProtocolRef.current = protocol;

    reset({
      rpcUrl: null,
      memo: "",
      from: selectedAccount?.address || "",
      toAddress: "",
      amount: "",
      fee: "",
      accountPassword: "",
      feeSpeed:
        (externalRequestInfo?.protocol || selectedProtocolOnApp) ===
        SupportedProtocols.Pocket
          ? "n/a"
          : "low",
      protocol: externalRequestInfo?.protocol || selectedProtocolOnApp,
      chainId: externalRequestInfo?.chainId || selectedChainOnApp,
    });
    setStatus("form");
    setNetworkFee(null);
    previousChain.current = null;
    setFeeStatus("not-fetched");
  }, [protocol]);
  //
  useEffect(() => {
    if (selectedAccount) {
      setTimeout(() => setValue("from", selectedAccount.address), 0);
    }
  }, [selectedAccount]);

  const getNetworkFee = useCallback(() => {
    const isPokt = protocol === SupportedProtocols.Pocket;
    if (
      protocol &&
      chainId &&
      previousChain.current !== chainId &&
      (isPokt ||
        (isValidAddress(toAddress, protocol) && transferType === "normal") ||
        transferType === "mint" ||
        transferType === "burn")
    ) {
      previousChain.current = chainId;
      setFeeStatus("loading");

      let data: string;

      if (transferType === "burn") {
        data = WPOKTBridge.createBurnTransaction({
          amount: getValues("amount"),
          from: getValues("from"),
          to: toAddress,
          contractAddress: asset.contractAddress,
        }).data;
      } else if (transferType === "mint") {
        data = WPOKTBridge.createMintTransaction({
          contractAddress: asset.contractAddress,
          signatures: externalTransferData?.signatures,
          mintInfo: externalTransferData?.mintInfo,
        }).data;
      }

      AppToBackground.getNetworkFee({
        protocol,
        chainId,
        toAddress:
          transferType === "burn" || transferType === "mint"
            ? asset?.contractAddress
            : toAddress,
        asset:
          transferType === "burn" || transferType === "mint"
            ? undefined
            : asset,
        data,
        from:
          transferType === "burn" || transferType === "mint"
            ? getValues("from")
            : undefined,
      }).then((response) => {
        if (response.data) {
          const fee = response.data.networkFee;
          setNetworkFee(fee);
          setValue("feeSpeed", isPokt ? "n/a" : getValues("feeSpeed"));
          setValue(
            "fee",
            isPokt
              ? (fee as PocketNetworkFee).value.toString()
              : (fee as EthereumNetworkFee).low.amount
          );
          setFeeStatus("fetched");
        } else {
          previousChain.current = null;
          setFeeStatus("error");
        }
      });
    } else if (!protocol) {
      setNetworkFee(null);
      setFeeStatus("not-fetched");
      previousChain.current = null;
    }
  }, [
    protocol,
    networks,
    chainId,
    toAddress,
    getValues,
    asset,
    transferType,
    externalTransferData,
  ]);

  useEffect(() => {
    getNetworkFee();

    let interval;
    if (protocol === SupportedProtocols.Ethereum) {
      interval = setInterval(() => {
        previousChain.current = null;
        getNetworkFee();
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    chainId,
    protocol,
    protocol === SupportedProtocols.Ethereum ? toAddress : undefined,
  ]);

  useDidMountEffect(() => {
    if (transferType !== "normal") {
      setTimeout(() => setStatus("summary"), 0);
    }
  }, [transferType]);

  useEffect(() => {
    if (externalTransferData) {
      setValue("amount", externalTransferData.amount.toString());
      setValue("toAddress", externalTransferData.toAddress);
      if (transferType === "bridge" || externalTransferData.memo) {
        let memo;

        if (transferType === "bridge") {
          memo = WPOKTBridge.createBridgeTransaction({
            amount: externalTransferData.amount,
            chainID: chainId,
            from: fromAddress,
            vaultAddress: externalTransferData.vaultAddress,
            ethereumAddress: externalTransferData.toAddress,
          });
        } else {
          memo = externalTransferData.memo;
        }
        setValue("memo", memo);
      }
    }
  }, [externalTransferData]);

  useEffect(() => {
    if (protocol === SupportedProtocols.Ethereum) {
      setFeeStatus("not-fetched");
      setNetworkFee(null);
      previousChain.current = null;
    }
  }, [toAddress]);

  useDidMountEffect(() => {
    if (asset) {
      if (previousChainForAsset.current !== chainId) {
        setValue("asset", null);
      }
    }
  }, [chainId]);

  useDidMountEffect(() => {
    if (!externalTransferData) {
      setValue("amount", "");
      clearErrors("amount");
    }
  }, [chainId]);

  const accountBalances = useAppSelector((state) => state.app.accountBalances);

  const nativeBalance = useMemo(() => {
    return accountBalances[protocol][chainId][fromAddress]?.amount || 0;
  }, [accountBalances, protocol, chainId, fromAddress, asset]);

  const amount = useMemo(() => {
    const chainBalanceMap = accountBalances[protocol][chainId];

    if (asset && protocol === SupportedProtocols.Ethereum) {
      return (
        chainBalanceMap?.[asset.contractAddress]?.[fromAddress]?.amount || 0
      );
    }

    return chainBalanceMap[fromAddress]?.amount || 0;
  }, [accountBalances, protocol, chainId, fromAddress, asset]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!amount || !nativeBalance || feeStatus !== "fetched") return;

      if (status === "form") {
        setStatus("summary");
        return;
      }

      setStatus("loading");
      setSendingStatus("check_network");
      const network = {
        protocol: data.protocol,
        chainID: data.chainId,
        rpcUrl: data.rpcUrl,
      };
      const isHealthy = await isTransferHealthyForNetwork(network);

      if (!isHealthy) {
        setStatus("invalid_network");
        setSendingStatus(null);
        return;
      }
      setSendingStatus("sending");

      const accountId = accounts.find(
        (item) => item.address === data.from && item.protocol === data.protocol
      )?.id;

      let dataTransactionParam: string,
        bridgeParams: {
          to: string;
          memo: string;
        };

      if (transferType === "bridge") {
        const result = WPOKTBridge.createBridgeTransaction({
          amount: data.amount,
          chainID: data.chainId,
          from: data.from,
          vaultAddress: "",
          ethereumAddress: data.toAddress,
        });

        bridgeParams = {
          to: result.to,
          memo: result.memo,
        };
      } else if (transferType === "burn") {
        dataTransactionParam = WPOKTBridge.createBurnTransaction({
          from: data.from,
          amount: (Number(data.amount) * 10 ** data.asset.decimals).toString(),
          to: data.toAddress,
          contractAddress: data.asset.contractAddress,
        }).data;
      } else if (transferType === "mint") {
        dataTransactionParam = WPOKTBridge.createMintTransaction({
          contractAddress: data.asset.contractAddress,
          signatures: externalTransferData.signatures,
          mintInfo: externalTransferData.mintInfo,
        }).data;
      }

      const response = await AppToBackground.sendRequestToAnswerTransfer({
        rejected: false,
        transferData: {
          from: {
            type: SupportedTransferOrigins.VaultAccountId,
            passphrase: data.accountPassword,
            value: accountId,
          },
          to: {
            type: SupportedTransferDestinations.RawAddress,
            value:
              transferType === "burn" || transferType === "mint"
                ? data.asset.contractAddress
                : bridgeParams?.to || data.toAddress,
          },
          amount:
            transferType === "burn" || transferType === "mint"
              ? 0
              : Number(data.amount),
          network,
          asset:
            data.asset && !dataTransactionParam
              ? {
                  protocol: data.protocol,
                  chainID: data.chainId,
                  contractAddress: asset.contractAddress,
                  decimals: asset.decimals,
                }
              : undefined,
          transactionParams: {
            maxFeePerGas:
              data.protocol === SupportedProtocols.Ethereum
                ? (networkFee as EthereumNetworkFee)[data.feeSpeed]
                    .suggestedMaxFeePerGas
                : undefined,
            maxPriorityFeePerGas:
              data.protocol === SupportedProtocols.Ethereum
                ? (networkFee as EthereumNetworkFee)[data.feeSpeed]
                    .suggestedMaxPriorityFeePerGas
                : undefined,
            fee:
              data.protocol === SupportedProtocols.Ethereum
                ? undefined
                : Number(data.fee),
            memo: bridgeParams?.memo || data.memo,
            data: dataTransactionParam,
          },
        },
        // todo: pass this when present
        request: undefined,
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
            setStatus("form");
          }
        }
      }
      setSendingStatus(null);
    },
    [
      status,
      feeStatus,
      accounts,
      amount,
      nativeBalance,
      transferType,
      externalTransferData,
    ]
  );

  const onClickOk = useCallback(() => {
    setStatus("form");
    setValue("rpcUrl", null);
    setTimeout(() => setFocus("rpcUrl"), 25);
  }, [setFocus, setValue]);

  const onClickCancel = useCallback(async () => {
    if (status === "summary") {
      setStatus("form");
      return;
    }

    if (externalRequestInfo) {
      await AppToBackground.sendRequestToAnswerTransfer({
        rejected: true,
        transferData: null,
        // todo: pass this when present
        request: undefined,
      });
    } else {
      navigate(ACCOUNTS_PAGE);
    }
  }, [externalRequestInfo, status, navigate]);

  const content = useMemo(() => {
    const isSubmitted = status === "submitted";
    const isLoading = status === "loading";
    const settingAccount = status === "form";

    let component: React.ReactNode,
      onClickPrimary: () => void,
      secondaryBtnText: string,
      primaryBtnText: string;

    if (isSubmitted) {
      component = <TransferSubmittedStep hash={transferHash} />;
      onClickPrimary = () => navigate(ACCOUNTS_PAGE);
      primaryBtnText = "Done";
    } else if (isLoading) {
      let text: string;
      if (sendingStatus === "check_network") {
        text = "Checking RPC...";
      } else if (sendingStatus === "sending") {
        text = "Packing and sending...";
      }
      component = <CircularLoading text={text} />;
    } else if (status === "error") {
      // todo: add warning (exclamation) icon
      component = (
        <Stack alignItems={"center"} justifyContent={"center"} flexGrow={1}>
          <Typography textAlign={"center"}>
            There was an error sending the transfer.
          </Typography>
        </Stack>
      );
      secondaryBtnText = "Cancel";
      primaryBtnText = "Retry";
    } else if (status === "invalid_network") {
      component = (
        <Stack alignItems={"center"} justifyContent={"center"} flexGrow={1}>
          <Typography textAlign={"center"}>
            The provided network is unhealthy at the moment. Please select
            another one.
          </Typography>
        </Stack>
      );
      onClickPrimary = onClickOk;
      secondaryBtnText = "Cancel";
      primaryBtnText = "Ok";
    } else if (settingAccount) {
      component = <TransferForm />;
      secondaryBtnText = "Cancel";
      primaryBtnText = "Continue";
    } else {
      component = (
        <SummaryStep
          wrongPassword={wrongPassword}
          compact={!!externalRequestInfo}
        />
      );
      secondaryBtnText = "Back";
      primaryBtnText = "Send";
    }

    return (
      <>
        {externalRequestInfo && (
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
              // todo: fix this
              //@ts-ignore
              request={externalRequestInfo}
              hideBlock={true}
              containerProps={{
                marginTop: "5px!important",
                marginBottom: settingAccount ? 2 : 1,
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
            position: "relative",
            boxSizing: "border-box",
          }}
          width={1}
        >
          {component}
        </Stack>
        {!isLoading && (
          <Stack direction={"row"} spacing={2} width={1}>
            {!isSubmitted && (
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
            )}
            <Button
              sx={{
                fontWeight: 700,
                height: 36,
                fontSize: 16,
              }}
              variant={"contained"}
              fullWidth
              disabled={feeStatus !== "fetched" || !amount}
              type={onClickPrimary ? "button" : "submit"}
              onClick={onClickPrimary}
            >
              {primaryBtnText}
            </Button>
          </Stack>
        )}
      </>
    );
  }, [
    theme,
    wrongPassword,
    onClickOk,
    status,
    onClickCancel,
    navigate,
    feeStatus,
    transferHash,
    sendingStatus,
  ]);

  return (
    <FormProvider {...methods}>
      <TransferContextProvider
        transferType={transferType}
        networkFee={networkFee}
        getNetworkFee={getNetworkFee}
        externalTransferData={externalTransferData}
        feeFetchStatus={feeStatus}
      >
        <Stack
          width={1}
          height={1}
          maxWidth={1}
          paddingX={externalRequestInfo ? 2 : 0}
          boxSizing={"border-box"}
          component={"form"}
          justifyContent={"flex-start"}
          onSubmit={handleSubmit(onSubmit)}
          alignItems={"center"}
          marginTop={1}
        >
          {selectedAccount && (
            <AccountComponent account={selectedAccount} asset={asset} />
          )}
          {content}
        </Stack>
      </TransferContextProvider>
    </FormProvider>
  );
};

export default Transfer;
