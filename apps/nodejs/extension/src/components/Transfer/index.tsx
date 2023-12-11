import type { SerializedAccountReference } from "@poktscan/keyring";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  WPOKTBridge,
} from "@poktscan/keyring";
import type { IAsset } from "../../redux/slices/app";
import type { AmountStatus } from "./Form/AmountFeeInputs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import merge from "lodash/merge";
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
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import TransferContextProvider, {
  ExternalTransferData,
  Status,
  TransferType,
} from "../../contexts/TransferContext";
import AccountInfo from "../Account/AccountInfo";
import {
  customRpcsSelector,
  networksSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountBalancesSelector,
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import { assetsIdByAccountSelector } from "../../redux/selectors/asset";
import NetworkAndAccount from "./NetworkAndAccount";

export type FeeSpeed = "n/a" | "low" | "medium" | "high" | "site";

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
    requestId: string;
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

type NetworkFeeParam = Parameters<typeof AppToBackground.getNetworkFee>[0];
type SendTransferParam = Parameters<
  typeof AppToBackground.sendRequestToAnswerTransfer
>[0]["transferData"];

const parseHexToNumber = (str: string, radix = 16) => {
  if (str) {
    return parseInt(str.substring(2), radix);
  }
};

const Transfer: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const networks = useAppSelector(networksSelector);
  const customRpcs = useAppSelector(customRpcsSelector);

  const accounts = useAppSelector(accountsSelector);
  const accountBalances = useAppSelector(accountBalancesSelector);
  const selectedChainOnApp = useAppSelector(selectedChainSelector);
  const selectedProtocolOnApp = useAppSelector(selectedProtocolSelector);
  const assetsIdByAccount = useAppSelector(assetsIdByAccountSelector);
  const addressOfSelectedAccountOnApp = useAppSelector(
    selectedAccountAddressSelector
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

  const useSiteFee =
    externalTransferData &&
    (externalTransferData.gasLimit ||
      externalTransferData.maxPriorityFeePerGas ||
      externalTransferData.maxFeePerGas);

  const methods = useForm<FormValues>({
    defaultValues: {
      rpcUrl: null,
      memo: externalTransferData?.memo || "",
      from: externalTransferData?.fromAddress || addressOfSelectedAccountOnApp,
      toAddress: externalTransferData?.toAddress || "",
      amount: externalTransferData?.amount || "",
      fee: "",
      accountPassword: "",
      feeSpeed: useSiteFee
        ? "site"
        : (externalRequestInfo?.protocol || selectedProtocolOnApp) ===
          SupportedProtocols.Pocket
        ? "n/a"
        : "medium",
      protocol: externalRequestInfo?.protocol || selectedProtocolOnApp,
      chainId: externalRequestInfo?.chainId || selectedChainOnApp,
      asset:
        "asset" in externalTransferState ? externalTransferState.asset : null,
    },
  });
  const { watch, setValue, clearErrors, handleSubmit, getValues, reset } =
    methods;

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

  const checkedNetwork = useRef(false);

  useEffect(() => {
    if (protocol) {
      const preferredRpc = customRpcs.find(
        (item) =>
          item.protocol === protocol &&
          item.chainId === chainId &&
          item.isPreferred
      );

      const defaultNetwork = networks.find(
        (item) => item.protocol === protocol && item.chainId === chainId
      );

      setTimeout(() => {
        setValue("rpcUrl", preferredRpc?.url || defaultNetwork?.rpcUrl);
        clearErrors("rpcUrl");
      }, 0);

      if (transferType !== "normal" && checkedNetwork.current) {
        navigate(ACCOUNTS_PAGE);
      }
      checkedNetwork.current = true;
    }
  }, [protocol, chainId]);

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
      callback = (account) => account.address === addressOfSelectedAccountOnApp;
    }

    return accounts.find(callback);
  }, [
    accounts,
    externalRequestInfo?.protocol,
    externalTransferData?.fromAddress,
    addressOfSelectedAccountOnApp,
  ]);

  useDidMountEffect(() => {
    if (
      asset &&
      !(assetsIdByAccount[selectedAccount?.address] || []).includes(asset.id)
    ) {
      navigate(ACCOUNTS_PAGE);
    }
  }, [selectedAccount, assetsIdByAccount]);

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
      feeSpeed: useSiteFee
        ? "site"
        : (externalRequestInfo?.protocol || selectedProtocolOnApp) ===
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
      // to prevent possibles race conditions
      setTimeout(() => setFeeStatus("loading"), 0);

      const baseParam = {
        protocol,
        chainId,
      };

      let networkFeeParam: NetworkFeeParam;

      if (transferType === "burn") {
        const burnTx = WPOKTBridge.createBurnTransaction({
          amount: (
            Number(getValues("amount")) *
            10 ** asset.decimals
          ).toString(),
          from: getValues("from"),
          to: toAddress,
          contractAddress: asset.contractAddress,
        });

        networkFeeParam = {
          ...baseParam,
          toAddress: asset.contractAddress,
          data: burnTx.data,
          from: burnTx.from,
        };
      } else if (transferType === "mint") {
        const mintTx = WPOKTBridge.createMintTransaction({
          contractAddress: asset.mintContractAddress,
          signatures: externalTransferData?.signatures,
          mintInfo: externalTransferData?.mintInfo,
        });

        networkFeeParam = {
          ...baseParam,
          toAddress: asset.mintContractAddress,
          data: mintTx.data,
          from: getValues("from"),
        };
      } else {
        networkFeeParam = {
          ...baseParam,
          toAddress,
          asset,
          data: externalTransferData?.data,
          gasLimit: parseHexToNumber(externalTransferData?.gasLimit),
          maxFeePerGas: externalTransferData?.maxFeePerGas,
          maxPriorityFeePerGas: externalTransferData?.maxPriorityFeePerGas,
        };
      }

      AppToBackground.getNetworkFee(networkFeeParam).then((response) => {
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
    chainId,
    toAddress,
    getValues,
    setValue,
    asset,
    transferType,
    externalTransferData,
  ]);

  useEffect(() => {
    let interval;

    if (status === "form" || status === "summary") {
      getNetworkFee();

      if (protocol === SupportedProtocols.Ethereum) {
        interval = setInterval(() => {
          previousChain.current = null;
          getNetworkFee();
        }, 30000);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [chainId, protocol, status]);

  useEffect(() => {
    if (transferType !== "normal" || externalRequestInfo) {
      setTimeout(() => setStatus("summary"), 0);
    }
  }, [transferType, externalRequestInfo]);

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
          }).memo;
        } else {
          memo = externalTransferData.memo;
        }
        setValue("memo", memo);
      }
    }
  }, [externalTransferData]);

  useDidMountEffect(() => {
    if (protocol === SupportedProtocols.Ethereum) {
      setFeeStatus("not-fetched");
      setNetworkFee(null);
      previousChain.current = null;
      setTimeout(getNetworkFee, 0);
    }
  }, [toAddress]);

  useDidMountEffect(() => {
    if (asset) {
      if (previousChainForAsset.current !== chainId) {
        setValue("asset", null);
      }
    }

    if (!externalTransferData) {
      setValue("amount", "");
      clearErrors("amount");
    }
  }, [chainId]);

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
        setStatus("error");
        setSendingStatus(null);
        return;
      }
      setSendingStatus("sending");

      const accountId = accounts.find(
        (item) => item.address === data.from && item.protocol === data.protocol
      )?.id;

      const baseTransferParam = {
        from: {
          type: SupportedTransferOrigins.VaultAccountId,
          passphrase: data.accountPassword,
          value: accountId,
        },
        network,
      };

      let transferParam: SendTransferParam;

      if (data.protocol === SupportedProtocols.Pocket) {
        let bridgeResult: ReturnType<
          typeof WPOKTBridge.createBridgeTransaction
        >;
        if (transferType === "bridge") {
          bridgeResult = WPOKTBridge.createBridgeTransaction({
            from: data.from,
            amount: data.amount,
            chainID: data.chainId,
            ethereumAddress: data.toAddress,
            vaultAddress: externalTransferData.vaultAddress,
          });
        }

        transferParam = {
          ...baseTransferParam,
          to: {
            type: SupportedTransferDestinations.RawAddress,
            value: bridgeResult?.to || data.toAddress,
          },
          amount: Number(data.amount),
          transactionParams: {
            fee: Number(data.fee),
            memo: bridgeResult?.memo || data.memo,
          },
        };
      } else {
        const assetParam = data.asset
          ? {
              protocol: data.protocol,
              chainID: data.chainId,
              contractAddress: data.asset.contractAddress,
              decimals: data.asset.decimals,
            }
          : undefined;

        const feeInfo = (networkFee as EthereumNetworkFee)[data.feeSpeed];

        const networkBaseTransferParam = {
          ...baseTransferParam,
          to: {
            type: SupportedTransferDestinations.RawAddress,
            value: data.toAddress,
          },
          asset: assetParam,
          amount: Number(data.amount),
          transactionParams: {
            maxFeePerGas: feeInfo.suggestedMaxFeePerGas,
            maxPriorityFeePerGas: feeInfo.suggestedMaxPriorityFeePerGas,
            gasLimit: (networkFee as EthereumNetworkFee).estimatedGas,
          },
        };

        if (transferType === "burn") {
          const burnTx = WPOKTBridge.createBurnTransaction({
            from: data.from,
            amount: (
              Number(data.amount) *
              10 ** data.asset.decimals
            ).toString(),
            to: data.toAddress,
            contractAddress: data.asset.contractAddress,
          });

          transferParam = merge(networkBaseTransferParam, {
            to: {
              value: data.asset.contractAddress,
            },
            asset: null,
            amount: 0,
            transactionParams: {
              data: burnTx.data,
            },
          });
        } else if (transferType === "mint") {
          const mintTx = WPOKTBridge.createMintTransaction({
            contractAddress: data.asset.mintContractAddress,
            signatures: externalTransferData.signatures,
            mintInfo: externalTransferData.mintInfo,
          });

          transferParam = merge(networkBaseTransferParam, {
            to: {
              value: data.asset.mintContractAddress,
            },
            amount: 0,
            asset: null,
            transactionParams: {
              data: mintTx.data,
            },
          });
        } else {
          transferParam = networkBaseTransferParam;

          if (externalTransferData) {
            transferParam = merge(transferParam, {
              amount: Number(data.amount || "0") * 1e18,
              transactionParams: {
                data: externalTransferData.data,
                maxFeePerGas: parseHexToNumber(
                  externalTransferData.maxFeePerGas
                ),
                maxPriorityFeePerGas: parseHexToNumber(
                  externalTransferData.maxPriorityFeePerGas
                ),
                gasLimit: parseHexToNumber(externalTransferData.gasLimit),
              },
            });
          }
        }
      }

      const response = await AppToBackground.sendRequestToAnswerTransfer({
        rejected: false,
        transferData: {
          ...transferParam,
          isRawTransaction:
            ["mint", "burn"].includes(transferType) ||
            (!!externalRequestInfo &&
              data.protocol === SupportedProtocols.Ethereum),
        },
        request: externalRequestInfo
          ? {
              origin: externalRequestInfo.origin,
              tabId: externalRequestInfo.tabId,
              protocol: externalRequestInfo.protocol || data.protocol,
              requestId: externalRequestInfo.requestId,
            }
          : undefined,
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
      externalRequestInfo,
      networkFee,
    ]
  );

  const onClickCancel = useCallback(async () => {
    if (transferType !== "normal") {
      return navigate(`${ACCOUNTS_PAGE}${asset ? `?asset=${asset.id}` : ""}`);
    }

    if (status === "summary" && !externalRequestInfo) {
      setStatus("form");
      return;
    }

    if (externalRequestInfo) {
      await AppToBackground.sendRequestToAnswerTransfer({
        rejected: true,
        transferData: null,
        request: {
          tabId: externalRequestInfo.tabId,
          origin: externalRequestInfo.origin,
          protocol: externalRequestInfo.protocol,
          requestId: externalRequestInfo.requestId,
        },
      });
    } else {
      navigate(`${ACCOUNTS_PAGE}${asset ? `?asset=${asset.id}` : ""}`);
    }
  }, [externalRequestInfo, status, navigate, asset, transferType]);

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
      secondaryBtnText =
        transferType === "normal" && !externalRequestInfo ? "Back" : "Cancel";
      primaryBtnText = "Send";
    }

    return (
      <>
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
              disabled={(!networkFee && feeStatus !== "fetched") || !amount}
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
    status,
    onClickCancel,
    navigate,
    feeStatus,
    transferHash,
    sendingStatus,
    networkFee,
    amount,
    externalRequestInfo,
  ]);

  return (
    <FormProvider {...methods}>
      {externalRequestInfo && <NetworkAndAccount />}
      <TransferContextProvider
        transferType={transferType}
        networkFee={networkFee}
        getNetworkFee={getNetworkFee}
        externalTransferData={externalTransferData}
        feeFetchStatus={feeStatus}
        status={status}
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
          marginBottom={externalRequestInfo ? -0.5 : undefined}
        >
          {selectedAccount && (
            <AccountInfo
              account={selectedAccount}
              asset={asset}
              protocol={protocol}
              chainId={chainId}
            />
          )}
          {content}
        </Stack>
      </TransferContextProvider>
    </FormProvider>
  );
};

export default Transfer;
