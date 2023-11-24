import type { ExternalTransferState } from "../Transfer";
import type { AmountStatus } from "../Transfer/Form/AmountFeeInputs";
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
import React, { useCallback, useEffect, useRef, useState } from "react";
import { type PocketNetworkFee, SupportedProtocols } from "@poktscan/keyring";
import AppToBackground from "../../controllers/communication/AppToBackground";
import ToAddressAutocomplete from "../Transfer/Form/ToAddressAutocomplete";
import { getTruncatedText, roundAndSeparate } from "../../utils/ui";
import { TransferType } from "../../contexts/TransferContext";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import OperationFailed from "../common/OperationFailed";
import { useAppSelector } from "../../hooks/redux";
import { TRANSFER_PAGE } from "../../constants/routes";

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

interface BaseResponse {
  page: number;
  totalPages: number;
}

interface MintResponse extends BaseResponse {
  mints: MintTransaction[];
  totalMints: number;
}

interface BurnResponse extends BaseResponse {
  burns: BurnTransaction[];
  totalBurns: number;
}

type Transaction = BurnTransaction | MintTransaction;
type Response = BurnResponse | MintResponse;

const addZeroIfOnlyOneDigit = (value: number) => {
  return value < 10 ? `0${value}` : value.toString();
};

const formatDate = (date: Date) => {
  const year = date.getFullYear().toString().substring(2);
  const month = addZeroIfOnlyOneDigit(date.getMonth() + 1);
  const day = addZeroIfOnlyOneDigit(date.getDate());
  const hour = addZeroIfOnlyOneDigit(date.getHours());
  const minutes = addZeroIfOnlyOneDigit(date.getMinutes());

  return `${year}/${month}/${day} ${hour}:${minutes}`;
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
      }}
      boxSizing={"border-box"}
      borderBottom={`1px solid ${theme.customColors.dark15}`}
    >
      {children}
    </Stack>
  );
};

const TransactionItem: React.FC<{ tx: Transaction; action: Action }> = ({
  tx,
  action,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const explorerTransactionUrl = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    const selectedChain = state.app.selectedChainByNetwork[selectedNetwork];

    const expectedProtocol: SupportedProtocols =
      selectedNetwork === SupportedProtocols.Ethereum
        ? SupportedProtocols.Pocket
        : SupportedProtocols.Ethereum;
    const expectedChain =
      selectedNetwork === SupportedProtocols.Ethereum
        ? selectedChain === "1"
          ? "mainnet"
          : "testnet"
        : selectedChain === "mainnet"
        ? "1"
        : "5";

    return state.app.networks.find(
      (network) =>
        network.protocol === expectedProtocol &&
        network.chainId === expectedChain
    )?.explorerTransactionUrl;
  });
  const explorerAccountUrl = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    const selectedChain = state.app.selectedChainByNetwork[selectedNetwork];

    if (selectedNetwork === SupportedProtocols.Pocket) {
      const assetChain = selectedChain === "mainnet" ? "1" : "5";

      const asset = state.app.assets.find(
        (item) =>
          item.protocol === SupportedProtocols.Ethereum &&
          item.chainId === assetChain &&
          item.symbol === "wPOKT"
      );

      return state.app.networks
        .find(
          (network) =>
            network.protocol === SupportedProtocols.Ethereum &&
            network.chainId === assetChain
        )
        ?.explorerAccountWithAssetUrl?.replace(
          ":contractAddress",
          asset?.contractAddress
        );
    }

    const expectedChain = selectedChain === "1" ? "mainnet" : "testnet";

    return state.app.networks.find(
      (network) =>
        network.protocol === SupportedProtocols.Pocket &&
        network.chainId === expectedChain
    )?.explorerAccountUrl;
  });

  const wPoktAsset = useAppSelector((state) =>
    state.app.assets.find(
      (asset) =>
        asset.symbol === "wPOKT" &&
        asset.protocol === state.app.selectedNetwork &&
        asset.chainId ===
          state.app.selectedChainByNetwork[state.app.selectedNetwork]
    )
  );

  const onClickMint = useCallback(() => {
    const state: ExternalTransferState = {
      asset: wPoktAsset,
      transferType: TransferType.mint,
      transferData: {
        fromAddress: address,
        amount: "",
        toAddress: "",
        signatures: (tx as MintTransaction).signatures,
        mintInfo: (tx as MintTransaction).data,
      },
    };
    navigate(TRANSFER_PAGE, { state });
  }, [navigate, tx, wPoktAsset]);

  const dateCreated = new Date(tx.created_at);
  const createdAt = formatDate(dateCreated);

  const address = tx.recipient_address;
  const accountUrl = explorerAccountUrl?.replace(":address", address);

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
      <Typography
        width={77}
        sx={{ textAlign: "left!important", whiteSpace: "nowrap" }}
      >
        {createdAt}
      </Typography>
      <Typography
        width={50}
        sx={{
          color: theme.customColors.primary500,
          fontWeight: 500,
        }}
        component={"a"}
        href={accountUrl}
        target={"_blank"}
      >
        {getTruncatedText(address, 3)}
      </Typography>
      <Typography width={65}>
        {roundAndSeparate(Number(tx.amount) / 1e6, 2, "0")}
      </Typography>
      <Typography width={40} sx={{ textTransform: "capitalize" }}>
        {action === "burns" ? tx.status : (tx as MintTransaction).nonce}
      </Typography>
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
          onClick={onClickMint}
        >
          {action.replace("s", "")}
        </Button>
      ) : (
        <Typography
          width={60}
          maxWidth={60}
          minWidth={60}
          {...(tx.status === Status.SUCCESS && {
            sx: {
              color: theme.customColors.primary500,
              fontWeight: 500,
            },
            component: "a",
            href: transactionLink,
            target: "_blank",
          })}
        >
          {tx.status === Status.SUCCESS
            ? getTruncatedText(transactionHash).toLowerCase()
            : "-"}
        </Typography>
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

  const selectedProtocol = useAppSelector((state) => state.app.selectedNetwork);
  const selectedChain = useAppSelector(
    (state) => state.app.selectedChainByNetwork[selectedProtocol]
  );
  const wPoktAsset = useAppSelector((state) =>
    state.app.assets.find(
      (asset) =>
        asset.symbol === "wPOKT" &&
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain
    )
  );
  const wPoktVaultAddress = useAppSelector((state) => {
    return state.app.assets.find(
      (asset) =>
        asset.symbol === "wPOKT" &&
        asset.protocol === SupportedProtocols.Ethereum &&
        asset.chainId === (selectedChain === "mainnet" ? "1" : "5")
    )?.vaultAddress;
  });

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

  useDidMountEffect(() => {
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

  const balance: number = useAppSelector((state) => {
    const selectedAccountId =
      state.app.selectedAccountByNetwork[selectedProtocol];
    const selectedChain = state.app.selectedChainByNetwork[selectedProtocol];

    const chainBalanceMap =
      state.app.accountBalances?.[selectedProtocol]?.[selectedChain];
    const accountAddress = state.vault.entities.accounts.list.find(
      (account) => account.id === selectedAccountId
    )?.address;

    if (selectedProtocol === SupportedProtocols.Pocket) {
      return chainBalanceMap?.[accountAddress]?.amount || 0;
    } else {
      const assetContractAddress = state.app.assets.find(
        (asset) =>
          asset.symbol === "wPOKT" &&
          asset.protocol === selectedProtocol &&
          asset.chainId === selectedChain
      )?.contractAddress;
      return (
        chainBalanceMap?.[assetContractAddress]?.[accountAddress]?.amount || 0
      );
    }
  });

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
  }, [balance, setValue, clearErrors]);

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
              return /*total > balance ? `Insufficient balance` :*/ true;
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
          // disabled={
          //   !balance ||
          //   (poktFeeStatus === "not-fetched" &&
          //     selectedProtocol === SupportedProtocols.Pocket)
          // }
        >
          {action === "burns" ? "Wrap" : "Unwrap"}
        </Button>
      </Stack>
    </Stack>
  );
};

const MAINNET_BASE_API_URL = "https://wpokt-monitor.vercel.app/api";
const TESTNET_BASE_API_URL = "https://testnet-wpokt-monitor.vercel.app/api";

type Action = "burns" | "mints";

interface WrappedPoktTxsProps {
  action: Action;
  address: string;
  showForm?: boolean;
  onCloseForm?: () => void;
}

// const itemsLimit = 10;

const WrappedPoktTxs: React.FC<WrappedPoktTxsProps> = ({
  address,
  action,
  showForm = true,
  onCloseForm,
}) => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<
    "loading" | "normal" | "error"
  >("loading");

  useEffect(() => {
    setTransactions([]);
    setPage(1);
  }, [action, address]);

  const baseUrl = useAppSelector((state) => {
    const selectedChain =
      state.app.selectedChainByNetwork[state.app.selectedNetwork];
    if (action === "burns") {
      return selectedChain === "1"
        ? MAINNET_BASE_API_URL
        : TESTNET_BASE_API_URL;
    } else {
      return selectedChain === "mainnet"
        ? MAINNET_BASE_API_URL
        : TESTNET_BASE_API_URL;
    }
  });

  const abortControllerRef = useRef<AbortController>(null);

  const fetchTransactions = useCallback(() => {
    abortControllerRef.current = new AbortController();
    setFetchStatus("loading");
    fetch(
      `${baseUrl}/${action}/all?page=${page}&${
        action === "burns" ? "sender" : "recipient"
      }=${address}`,
      {
        signal: abortControllerRef.current.signal,
      }
    )
      .then((res) => res.json())
      .then((json: Response) => {
        let items: Transaction[];
        if (action === "burns") {
          items = (json as BurnResponse).burns;
        } else {
          items = (json as MintResponse).mints;
        }

        setTransactions((prevState) => [...prevState, ...items]);
        const hasNextPage = json.totalPages > page;
        setHasNextPage(hasNextPage);
        setFetchStatus("normal");
      })
      .catch((e) => {
        console.log(e);
        setFetchStatus("error");
      })
      .finally(() => (abortControllerRef.current = null));
  }, [action, page, address]);

  useDidMountEffect(() => {
    fetchTransactions();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTransactions]);

  return (
    <Stack spacing={1} marginX={-0.5} marginTop={showForm ? 1.5 : 2.2}>
      {showForm && (
        <TransferForm action={action} onClose={onCloseForm} address={address} />
      )}
      <Stack height={showForm ? 200 : 210} marginTop={1}>
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          height={30}
          minHeight={30}
          borderBottom={`1px solid ${theme.customColors.dark25}`}
          paddingX={1}
        >
          <Typography
            fontSize={12}
            fontWeight={500}
            sx={{ textTransform: "capitalize" }}
          >
            {action}
          </Typography>
        </Stack>
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
          <Typography width={77} sx={{ textAlign: "left!important" }}>
            Created at
          </Typography>
          <Typography width={50}>Recipient</Typography>
          <Typography width={65}>Amount</Typography>
          <Typography width={40}>
            {action === "burns" ? "Status" : "Nonce"}
          </Typography>
          <Typography width={60} textAlign={"right"}>
            Return TX
          </Typography>
        </Stack>
        <Stack overflow={"auto"} width={370}>
          {fetchStatus === "error" ? (
            <OperationFailed
              text={"Transactions load failed."}
              onRetry={fetchTransactions}
              cancelBtnProps={{ sx: { display: "none" } }}
            />
          ) : !transactions.length && fetchStatus === "normal" ? (
            <Stack alignItems={"center"} justifyContent={"center"} flexGrow={1}>
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
              {transactions.map((item) => (
                <TransactionItem tx={item} key={item._id} action={action} />
              ))}
              {fetchStatus === "loading" ? (
                new Array(5)
                  .fill(null)
                  .map((_, index) => (
                    <TransactionSkeleton action={action} key={index} />
                  ))
              ) : (
                <Stack
                  alignItems={"center"}
                  justifyContent={"center"}
                  display={hasNextPage ? "flex" : "none"}
                >
                  <Button
                    onClick={() => setPage((prevState) => prevState + 1)}
                    sx={{ fontSize: 12, width: 80 }}
                  >
                    Load More
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default WrappedPoktTxs;
