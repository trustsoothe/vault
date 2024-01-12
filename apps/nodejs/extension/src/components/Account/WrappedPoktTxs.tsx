import type { ExternalTransferState } from "../Transfer";
import type { AmountStatus } from "../Transfer/Form/AmountFeeInputs";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { type SxProps, useTheme } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type PocketNetworkFee, SupportedProtocols } from "@poktscan/keyring";
import AppToBackground from "../../controllers/communication/AppToBackground";
import ToAddressAutocomplete from "../Transfer/Form/ToAddressAutocomplete";
import { getTruncatedText, roundAndSeparate } from "../../utils/ui";
import { TransferType } from "../../contexts/TransferContext";
import OperationFailed from "../common/OperationFailed";
import { useAppSelector } from "../../hooks/redux";
import { TRANSFER_PAGE } from "../../constants/routes";
import TooltipOverflow from "../common/TooltipOverflow";
import {
  explorerAccountUrlForWpoktSelector,
  explorerTransactionUrlSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  idOfMintsSentSelector,
  wPoktAssetSelector,
  wPoktBaseUrlSelector,
  wPoktVaultAddressSelector,
} from "../../redux/selectors/asset";
import { wPoktBalanceSelector } from "../../redux/selectors/account";
import MintTransactionModal, {
  MintTransactionModalProps,
} from "./MintTransactionModal";

export enum Status {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SIGNED = "signed",
  SUMBITTED = "submitted",
  SUCCESS = "success",
  FAILED = "failed",
}

interface BaseTransaction {
  _id: string;
  transaction_hash: string;
  confirmations: string;
  sender_address: string;
  sender_chain_id: string;
  recipient_address: string;
  recipient_chain_id: string;
  wpokt_address: string;
  amount: string;
  status: Status;
  signers: string[];
  created_at: string;
  updated_at: string;
}

interface MintTransaction extends BaseTransaction {
  height: string;
  vault_address: string;
  nonce: string;
  memo: {
    address: string;
    chain_id: string;
  };
  data: {
    recipient: string;
    amount: string;
    nonce: string;
  };
  signatures: string[];
  mint_tx_hash: string;
}

interface BurnTransaction extends BaseTransaction {
  log_index: string;
  block_number: string;
  return_tx: string;
  return_tx_hash: string;
}

type Transaction = BurnTransaction | MintTransaction;
type Response = BurnTransaction[] | MintTransaction[];

const addZeroIfOnlyOneDigit = (value: number) => {
  return value < 10 ? `0${value}` : value.toString();
};

const formatDate = (date: Date) => {
  const year = date.getFullYear().toString().substring(2);
  const month = addZeroIfOnlyOneDigit(date.getMonth() + 1);
  const day = addZeroIfOnlyOneDigit(date.getDate());
  const hour = addZeroIfOnlyOneDigit(date.getHours());
  const minutes = addZeroIfOnlyOneDigit(date.getMinutes());

  return `${month}/${day}/${year} ${hour}:${minutes}`;
};

const TransactionItemContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useTheme();
  return (
    <Stack
      width={1}
      height={30}
      minHeight={30}
      spacing={1.7}
      paddingX={0.5}
      direction={"row"}
      alignItems={"center"}
      sx={{
        "& p, a": {
          fontSize: 10,
          textAlign: "center",
          letterSpacing: "0.5px",
        },
        "& .MuiBox-root": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
      boxSizing={"border-box"}
      borderBottom={`1px solid ${theme.customColors.dark15}`}
    >
      {children}
    </Stack>
  );
};

interface TransactionItemProps {
  tx: Transaction;
  action: Action;
  txAllowedToMint?: string;
  onClickMint: (tx: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  tx,
  action,
  txAllowedToMint,
  onClickMint,
}) => {
  const theme = useTheme();
  const explorerTransactionUrl = useAppSelector(explorerTransactionUrlSelector);
  const explorerAccountUrl = useAppSelector(explorerAccountUrlForWpoktSelector);

  const dateCreated = new Date(tx.created_at);
  const createdAt = formatDate(dateCreated);

  const accountUrl = explorerAccountUrl?.replace(":address", tx.sender_address);

  const transactionHash =
    action === "burns"
      ? (tx as BurnTransaction).return_tx_hash
      : (tx as MintTransaction).mint_tx_hash;

  const transactionLink = explorerTransactionUrl?.replace(
    ":hash",
    transactionHash
  );
  return (
    <TransactionItemContainer>
      <TooltipOverflow
        text={createdAt}
        containerProps={{
          width: 77,
          minWidth: 77,
          justifyContent: "flex-start!important",
        }}
        textProps={{
          sx: {
            textAlign: "left!important",
          },
        }}
        linkProps={{
          sx: {
            textAlign: "left!important",
          },
        }}
      />
      <TooltipOverflow
        text={getTruncatedText(tx.sender_address, 3)}
        containerProps={{
          width: 50,
          minWidth: 50,
        }}
        textProps={{
          sx: {
            color: theme.customColors.primary500,
            fontWeight: 500,
            textAlign: "left!important",
          },
        }}
        linkProps={{
          href: accountUrl,
          target: "_blank",
          sx: {
            textDecoration: "underline",
            cursor: "pointer",
          },
        }}
      />
      <TooltipOverflow
        text={roundAndSeparate(Number(tx.amount) / 1e6, 2, "0")}
        containerProps={{
          width: 65,
          minWidth: 65,
        }}
      />
      <TooltipOverflow
        text={action === "burns" ? tx.status : (tx as MintTransaction).nonce}
        textProps={{
          textTransform: "capitalize",
        }}
        containerProps={{
          width: 40,
          minWidth: 40,
        }}
      />
      {tx.status === Status.SIGNED && action === "mints" ? (
        <Button
          variant={"contained"}
          sx={{
            height: 20,
            backgroundColor: theme.customColors.primary500,
            borderRadius: "4px",
            width: 56,
            minWidth: 56,
            fontSize: 10,
            fontWeight: 500,
            textTransform: "capitalize",
          }}
          disabled={tx._id !== txAllowedToMint}
          onClick={() => onClickMint(tx)}
        >
          {action.replace("s", "")}
        </Button>
      ) : (
        <TooltipOverflow
          text={
            tx.status === Status.SUCCESS
              ? getTruncatedText(transactionHash, 3).toLowerCase()
              : "-"
          }
          containerProps={{
            width: 60,
            minWidth: 60,
          }}
          textProps={{
            ...(tx.status === Status.SUCCESS && {
              sx: {
                color: theme.customColors.primary500,
                fontWeight: 500,
              },
            }),
          }}
          linkProps={{
            ...(tx.status === Status.SUCCESS && {
              component: "a",
              href: transactionLink,
              target: "_blank",
              sx: {
                textDecoration: "underline",
                cursor: "pointer",
              },
            }),
          }}
        />
      )}
    </TransactionItemContainer>
  );
};

const TransactionSkeleton: React.FC<{ action: Action }> = ({}) => {
  return (
    <TransactionItemContainer>
      <Skeleton variant={"rectangular"} height={12} width={77} />
      <Skeleton variant={"rectangular"} height={12} width={50} />
      <Skeleton variant={"rectangular"} height={12} width={65} />
      <Skeleton variant={"rectangular"} height={12} width={40} />
      <Skeleton variant={"rectangular"} height={12} width={60} />
    </TransactionItemContainer>
  );
};

interface TransferFormProps {
  action: Action;
  onClose?: () => void;
  address: string;
}

interface FormValues {
  toAddress: string;
  protocol: SupportedProtocols;
  from: string;
  amount: string;
}

const baseTextFieldSx: SxProps = {
  height: "35px!important",
  "& .MuiInputBase-root": {
    height: "35px!important",
    fontSize: "12px!important",
  },
  "& input": {
    height: "35px!important",
    fontSize: "12px!important",
  },
  "& .MuiFormLabel-root": {
    fontSize: "12px!important",
    "&.MuiInputLabel-shrink": {
      fontSize: "13px!important",
      top: 1,
      left: -4,
    },
  },
};

const TransferForm: React.FC<TransferFormProps> = ({
  action,
  onClose,
  address,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [poktFee, setPoktFee] = useState(0);
  const [poktFeeStatus, setPoktFeeStatus] =
    useState<AmountStatus>("not-fetched");

  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const wPoktAsset = useAppSelector(wPoktAssetSelector);

  const wPoktVaultAddress = useAppSelector(wPoktVaultAddressSelector);

  const methods = useForm<FormValues>({
    defaultValues: {
      protocol:
        selectedProtocol === SupportedProtocols.Pocket
          ? SupportedProtocols.Ethereum
          : SupportedProtocols.Pocket,
      toAddress: "",
      from: "",
      amount: "",
    },
  });
  const { setValue, clearErrors, handleSubmit } = methods;

  useEffect(() => {
    if (selectedProtocol === SupportedProtocols.Pocket) {
      setPoktFeeStatus("loading");
      AppToBackground.getNetworkFee({
        protocol: selectedProtocol,
        chainId: selectedChain,
      }).then((response) => {
        if (response.data) {
          setPoktFee(
            (response.data.networkFee as PocketNetworkFee)?.value || 0
          );
          setPoktFeeStatus("fetched");
        } else {
          setPoktFeeStatus("error");
        }
      });
    } else {
      setPoktFeeStatus("not-fetched");
    }
  }, [selectedProtocol, selectedChain]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      const state: ExternalTransferState = {
        asset: wPoktAsset,
        transferType:
          action === "mints" ? TransferType.burn : TransferType.bridge,
        transferData: {
          fromAddress: address,
          amount: data.amount,
          toAddress: data.toAddress,
          vaultAddress: action === "burns" ? wPoktVaultAddress : undefined,
        },
      };
      navigate(TRANSFER_PAGE, { state });
    },
    [address, action, wPoktAsset, wPoktVaultAddress]
  );

  const balance: number = useAppSelector(wPoktBalanceSelector);

  const minAmount = useAppSelector((state) => {
    if (selectedProtocol === SupportedProtocols.Pocket) {
      return state.app.networks.find(
        (network) =>
          network.protocol === selectedProtocol &&
          network.chainId === selectedChain
      )?.transferMinValue;
    }

    const asset = state.app.assets.find(
      (asset) =>
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain &&
        asset.symbol === "wPOKT"
    );

    if (asset) {
      return "0." + "0".repeat(asset.decimals - 1) + "1";
    }

    return "0";
  });

  const onClickAll = useCallback(() => {
    const transferFromBalance =
      selectedProtocol === SupportedProtocols.Pocket
        ? balance - poktFee
        : balance;

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [balance, setValue, clearErrors, poktFee]);

  return (
    <Stack
      spacing={0.8}
      height={90}
      paddingX={1}
      paddingTop={0.5}
      paddingBottom={1}
      boxSizing={"border-box"}
      bgcolor={theme.customColors.dark2}
      border={`1px solid ${theme.customColors.dark15}`}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography
          lineHeight={"26px"}
          fontSize={14}
          fontWeight={500}
          letterSpacing={"0.5px"}
        >
          {action === "burns" ? "Wrap POKT" : "Unwrap POKT"}
        </Typography>
        {onClose && (
          <IconButton onClick={onClose}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Stack>
      <Stack direction={"row"} spacing={1}>
        <FormProvider {...methods}>
          <ToAddressAutocomplete
            addressSize={10}
            truncatedAddressSize={10}
            nameSize={10}
            textFieldSxProps={baseTextFieldSx}
            autocompleteSxProps={{ marginTop: 0 }}
          />
        </FormProvider>
        <Controller
          name={"amount"}
          control={methods.control}
          rules={{
            required: "Required",
            validate: (value) => {
              const amountFromInput = Number(value);
              const fee =
                selectedProtocol === SupportedProtocols.Pocket
                  ? Number(poktFee)
                  : 0;

              if (isNaN(amountFromInput) || isNaN(fee)) {
                return "Invalid amount";
              }

              const min = Number(minAmount);
              if (amountFromInput < min) {
                return `Min is ${minAmount}`;
              }

              const total = amountFromInput + fee;
              return total > balance ? `Insufficient balance` : true;
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              size={"small"}
              type={"number"}
              label={"Amount"}
              InputLabelProps={{ shrink: !!field.value }}
              sx={{
                ...baseTextFieldSx,
                width: 100,
                minWidth: 100,
                order: 8,
                "& .MuiFormHelperText-root": {
                  bottom: "-14px",
                  left: 5,
                  width: "max-content",
                },
                "& .MuiInputBase-root": {
                  ...(baseTextFieldSx["& .MuiInputBase-root"] as {}),
                  fontWeight: 700,
                },
              }}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={onClickAll}
                    // disabled={disableAmountInput}
                    sx={{
                      minWidth: 0,
                      height: 20,
                      padding: 0,
                      color: theme.customColors.primary500,
                      fontSize: 12,
                      textDecoration: "underline",
                      "&:hover": {
                        textDecoration: "underline",
                        backgroundColor: theme.customColors.white,
                      },
                      marginRight: 1.2,
                    }}
                  >
                    All
                  </Button>
                ),
              }}
              error={!!error?.message}
              helperText={error?.message}
              {...field}
            />
          )}
        />
        <Button
          variant={"contained"}
          sx={{
            width: 56,
            height: 35,
            borderRadius: "4px",
            minWidth: 56,
            fontWeight: 700,
            fontSize: 12,
            order: 9,
          }}
          type={"submit"}
          disabled={
            !balance ||
            (poktFeeStatus === "not-fetched" &&
              selectedProtocol === SupportedProtocols.Pocket)
          }
        >
          {action === "burns" ? "Wrap" : "Unwrap"}
        </Button>
      </Stack>
    </Stack>
  );
};

type Action = "burns" | "mints";

interface WrappedPoktTxsProps {
  action: Action;
  address: string;
  showForm?: boolean;
  onCloseForm?: () => void;
}

const WrappedPoktTxs: React.FC<WrappedPoktTxsProps> = ({
  address,
  action,
  showForm = true,
  onCloseForm,
}) => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mintInfoOfModal, setMintInfoOfModal] =
    useState<MintTransactionModalProps["mintInfo"]>(null);
  const [fetchStatus, setFetchStatus] = useState<
    "loading" | "normal" | "error"
  >("loading");

  useEffect(() => {
    setTransactions([]);
  }, [action, address]);

  const navigate = useNavigate();
  const wPoktAsset = useAppSelector(wPoktAssetSelector);
  const idOfMintsSent = useAppSelector(idOfMintsSentSelector);
  const baseUrl = useAppSelector(wPoktBaseUrlSelector(action));

  const abortControllerRef = useRef<AbortController>(null);

  const fetchTransactions = useCallback(() => {
    abortControllerRef.current = new AbortController();
    setFetchStatus("loading");
    fetch(`${baseUrl}/${action}/active?recipient=${address}`, {
      signal: abortControllerRef.current.signal,
    })
      .then((res) => res.json())
      .then((items: Response) => {
        setTransactions(items);
        setFetchStatus("normal");
      })
      .catch(() => {
        setFetchStatus("error");
      })
      .finally(() => (abortControllerRef.current = null));
  }, [action, address]);

  useEffect(() => {
    fetchTransactions();

    const interval = setInterval(fetchTransactions, 30000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTransactions]);

  const onClickMint = useCallback(
    (tx: Transaction) => {
      if ("data" in tx) {
        if (idOfMintsSent.includes(tx._id)) {
          setMintInfoOfModal({
            mintId: tx._id,
            mintInfo: tx.data,
            signatures: tx.signatures,
          });
          return;
        }

        const state: ExternalTransferState = {
          asset: wPoktAsset,
          transferType: TransferType.mint,
          transferData: {
            amount: "",
            toAddress: "",
            mintId: tx._id,
            signatures: (tx as MintTransaction).signatures,
            mintInfo: (tx as MintTransaction).data,
          },
        };
        navigate(TRANSFER_PAGE, { state });
      }
    },
    [wPoktAsset, idOfMintsSent]
  );

  const txAllowedToMint = useMemo(() => {
    if (action === "burns") return null;

    return (
      orderBy(
        transactions
          .filter((tx) => tx.status === Status.SIGNED)
          .map((tx: MintTransaction) => ({
            ...tx,
            nonce: Number(tx.nonce),
          })),
        ["nonce"],
        ["asc"]
      )[0]?._id || null
    );
  }, [action, transactions]);

  return (
    <>
      <Stack spacing={1} marginX={-0.5} marginTop={showForm ? 1.5 : 2.2}>
        {showForm && (
          <TransferForm
            action={action}
            onClose={onCloseForm}
            address={address}
          />
        )}
        <Stack height={showForm ? 200 : 210} marginTop={1}>
          <Typography
            marginLeft={0.5}
            fontSize={12}
            lineHeight={"30px"}
            fontWeight={500}
            sx={{ textTransform: "capitalize" }}
          >
            {action}
          </Typography>
          <Stack
            width={transactions.length > 5 ? 362 : 370}
            height={24}
            minHeight={24}
            spacing={1.7}
            direction={"row"}
            alignItems={"center"}
            sx={{
              "& p": {
                fontSize: 10,
                fontWeight: 500,
                textAlign: "center",
                letterSpacing: "0.5px",
              },
            }}
            paddingX={0.5}
            boxSizing={"border-box"}
            bgcolor={theme.customColors.dark2}
            borderBottom={`1px solid ${theme.customColors.dark15}`}
          >
            <Typography
              width={77}
              minWidth={77}
              sx={{ textAlign: "left!important" }}
            >
              Created at
            </Typography>
            <Typography width={50} minWidth={50}>
              Sender
            </Typography>
            <Typography width={65} minWidth={65}>
              Amount
            </Typography>
            <Typography width={40} minWidth={40}>
              {action === "burns" ? "Status" : "Nonce"}
            </Typography>
            <Typography width={60} minWidth={60} textAlign={"right"}>
              {action === "burns" ? "Return TX" : "Mint TX"}
            </Typography>
          </Stack>
          <Stack
            width={370}
            flexGrow={1}
            sx={{
              overflowY: fetchStatus === "loading" ? "hidden" : "auto",
              overflowX: "hidden",
            }}
          >
            {fetchStatus === "error" ? (
              <OperationFailed
                text={"Transactions load failed."}
                onRetry={fetchTransactions}
                cancelBtnProps={{ sx: { display: "none" } }}
              />
            ) : !transactions.length && fetchStatus === "normal" ? (
              <Stack
                alignItems={"center"}
                justifyContent={"center"}
                height={145}
              >
                <Typography
                  fontSize={12}
                  fontWeight={500}
                  letterSpacing={"0.5px"}
                  color={theme.customColors.primary250}
                >
                  NO ACTIVITY
                </Typography>
              </Stack>
            ) : (
              <>
                {fetchStatus === "loading"
                  ? new Array(5)
                      .fill(null)
                      .map((_, index) => (
                        <TransactionSkeleton action={action} key={index} />
                      ))
                  : transactions.map((item) => (
                      <TransactionItem
                        tx={item}
                        key={item._id}
                        action={action}
                        txAllowedToMint={txAllowedToMint}
                        onClickMint={onClickMint}
                      />
                    ))}
              </>
            )}
          </Stack>
        </Stack>
      </Stack>
      <MintTransactionModal
        onClose={() => setMintInfoOfModal(null)}
        mintInfo={mintInfoOfModal}
      />
    </>
  );
};

export default WrappedPoktTxs;
