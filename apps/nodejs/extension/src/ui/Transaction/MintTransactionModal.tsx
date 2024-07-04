import type { SendTransactionParams } from "../../redux/slices/vault/account";
import { MintTransaction, TxStatus } from "../../redux/slices/wpokt";
import Stack from "@mui/material/Stack";
import capitalize from "lodash/capitalize";
import React, { useEffect, useRef } from "react";
import Typography from "@mui/material/Typography";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { Controller, useFormContext } from "react-hook-form";
import {
  EthereumNetworkFeeRequestOptions,
  EthereumNetworkFee,
  SerializedAccountReference,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  WPOKTBridge,
} from "@poktscan/vault";
import BaseTransaction, { type TransactionFormValues } from "./BaseTransaction";
import SuccessActionBanner from "../components/SuccessActionBanner";
import WarningActionBanner from "../components/WarningActionBanner";
import { contactsSelector } from "../../redux/selectors/contact";
import Summary, { SummaryRowItem } from "../components/Summary";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import { AmountWithUsd, getNetworkRow } from "./BaseSummary";
import AccountInfo from "../components/AccountInfo";
import { useAppSelector } from "../hooks/redux";
import useGetBalance from "../hooks/useGetBalance";
import BaseDialog from "../components/BaseDialog";
import TransactionHash from "./TransactionHash";
import useUsdPrice from "../hooks/useUsdPrice";
import EthFeeSelect from "./EthFeeSelect";
import {
  networksSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import { themeColors } from "../theme";
import DialogButtons from "../components/DialogButtons";

interface BaseSummaryProps {
  amount: number;
  fee?: number;
  date: Date;
  from: string;
  status?: TxStatus;
}

function BaseSummary({ amount, from, date, status, fee }: BaseSummaryProps) {
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);

  const asset = useSelectedAsset();
  const protocol = useAppSelector(selectedProtocolSelector);
  const chainId = useAppSelector(selectedChainSelector);
  const fromAddress = useAppSelector(selectedAccountAddressSelector);

  const { usdPrice, coinSymbol, isLoading } = useUsdPrice({
    protocol,
    chainId,
    asset,
  });

  const networks = useAppSelector(networksSelector);
  const currentNetwork = networks.find(
    (network) => network.protocol === protocol && network.chainId === chainId
  );
  const fromNetwork = networks.find(
    (network) =>
      network.protocol === SupportedProtocols.Pocket &&
      network.chainId === (chainId === "1" ? "mainnet" : "testnet")
  );

  let fromAccount: SerializedAccountReference,
    recipientAccount: SerializedAccountReference;

  for (const account of accounts) {
    if (
      account.address === from &&
      account.protocol === SupportedProtocols.Pocket
    ) {
      fromAccount = account;
      continue;
    }

    if (account.address === fromAddress && account.protocol === protocol) {
      recipientAccount = account;
    }
  }

  const fromContact = contacts.find(
    (contact) =>
      contact.address === from && contact.protocol === SupportedProtocols.Pocket
  );

  const secondSummaryRows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Date",
      value: date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      type: "row",
      label: "Amount",
      value: (
        <AmountWithUsd
          symbol={coinSymbol}
          balance={amount}
          usdBalance={usdPrice * amount}
          isLoadingUsdPrice={isLoading}
          decimals={asset.decimals}
        />
      ),
    },
  ];

  if (status) {
    secondSummaryRows.unshift({
      type: "row",
      label: "Status",
      value: capitalize(status),
    });
  }

  if (fee) {
    secondSummaryRows.push({
      type: "row",
      label: "Fee",
      value: (
        <AmountWithUsd
          symbol={currentNetwork.currencySymbol}
          balance={fee}
          usdBalance={usdPrice * amount}
          isLoadingUsdPrice={isLoading}
          decimals={currentNetwork.decimals}
        />
      ),
    });
  }

  return (
    <>
      <Summary
        rows={[
          {
            type: "row",
            label: "From",
            value: (
              <AccountInfo
                address={from}
                name={fromContact?.name || fromAccount?.name}
                type={fromContact ? "contact" : "account"}
              />
            ),
          },
          getNetworkRow(fromNetwork),
          { type: "divider" },
          {
            type: "row",
            label: "To",
            value: (
              <AccountInfo
                address={fromAddress}
                name={recipientAccount?.name}
              />
            ),
          },
          getNetworkRow(currentNetwork),
        ]}
      />
      <Summary rows={secondSummaryRows} />
    </>
  );
}

interface MintTransactionDetailProps {
  mintTransaction: MintTransaction;
}

function MintTransactionDetail({
  mintTransaction,
}: MintTransactionDetailProps) {
  const asset = useSelectedAsset();

  const baseSummaryProps: BaseSummaryProps = {
    amount: Number(mintTransaction.amount) / 10 ** asset.decimals,
    date: new Date(mintTransaction.created_at),
    from: mintTransaction.sender_address,
  };

  return (
    <DialogContent
      sx={{
        padding: "20px!important",
        rowGap: 1.6,
        display: "flex",
        flexDirection: "column",
        "& h6": {
          fontWeight: 500,
        },
      }}
    >
      <WarningActionBanner label={"Pending Mint"} withCheckIcon={true} />
      <BaseSummary {...baseSummaryProps} status={mintTransaction.status} />
    </DialogContent>
  );
}

function MintSummary(baseSummaryProps: BaseSummaryProps) {
  const { control, watch } = useFormContext<TransactionFormValues>();

  const [fromAddress, protocol, chainId, amount, fee, txSpeed] = watch([
    "fromAddress",
    "protocol",
    "chainId",
    "amount",
    "fee",
    "txSpeed",
  ]);

  const { balance: nativeBalance } = useGetBalance({
    address: fromAddress,
    protocol,
    chainId,
  });

  const amountNum = Number(amount);
  const feeOfTx = Number(
    fee
      ? fee.protocol === SupportedProtocols.Pocket
        ? fee.value
        : fee[txSpeed].amount
      : 0
  );

  return (
    <Controller
      control={control}
      name={"amount"}
      rules={{
        required: "Required",
        validate: () => {
          if (isNaN(amountNum) || isNaN(feeOfTx) || isNaN(nativeBalance)) {
            return "";
          }

          if (amountNum > nativeBalance || feeOfTx > nativeBalance) {
            return "Insufficient balance";
          }

          return true;
        },
      }}
      render={({ fieldState: { error } }) => (
        <DialogContent
          sx={{
            padding: "20px!important",
          }}
        >
          <Stack
            sx={{
              rowGap: 1.6,
              "& h6": {
                fontWeight: 500,
              },
            }}
          >
            <BaseSummary {...baseSummaryProps} />
          </Stack>

          <EthFeeSelect isUnwrapping={true} marginTop={1.6} />
          {error && (
            <Typography
              fontSize={11}
              marginTop={0.8}
              textAlign={"right"}
              lineHeight={"16px"}
              color={themeColors.red}
            >
              {error.message}
            </Typography>
          )}
        </DialogContent>
      )}
    />
  );
}

function Success(baseSummaryProps: BaseSummaryProps) {
  const { watch } = useFormContext<TransactionFormValues>();
  const [fee, txSpeed] = watch(["fee", "txSpeed"]);

  const feeAmount = Number((fee as EthereumNetworkFee)[txSpeed].amount);

  return (
    <DialogContent
      sx={{
        padding: "20px!important",
        rowGap: 1.6,
        display: "flex",
        flexDirection: "column",
        "& h6": {
          fontWeight: 500,
        },
      }}
    >
      <SuccessActionBanner label={"Transaction Minted"} />
      <BaseSummary {...baseSummaryProps} fee={feeAmount} />
      <Summary
        rows={[
          {
            type: "row",
            label: "Tx. Hash",
            value: <TransactionHash />,
          },
        ]}
      />
    </DialogContent>
  );
}

interface ModalContentProps {
  mintTransaction: MintTransaction;
  onClose: () => void;
}

function ModalContent({ mintTransaction, onClose }: ModalContentProps) {
  const accounts = useAppSelector(accountsSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const asset = useSelectedAsset();

  const getFeeOptions = (): Partial<EthereumNetworkFeeRequestOptions> => {
    const mintTx = WPOKTBridge.createMintTransaction({
      contractAddress: asset.mintContractAddress,
      signatures: mintTransaction.signatures,
      mintInfo: mintTransaction.data,
    });

    return {
      to: asset.mintContractAddress,
      data: mintTx.data,
    };
  };

  const getTransaction = (
    data: TransactionFormValues
  ): SendTransactionParams => {
    const mintTx = WPOKTBridge.createMintTransaction({
      contractAddress: asset.mintContractAddress,
      signatures: mintTransaction.signatures,
      mintInfo: mintTransaction.data,
    });

    const accountId = accounts.find(
      (item) =>
        item.address === data.fromAddress && item.protocol === data.protocol
    )?.id;

    const feeInfo = (data.fee as EthereumNetworkFee)[data.txSpeed];

    return {
      from: {
        type: SupportedTransferOrigins.VaultAccountId,
        passphrase: data.vaultPassword || "",
        value: accountId,
      },
      asset: null,
      network: {
        protocol: data.protocol,
        chainID: data.chainId,
      },
      to: {
        type: SupportedTransferDestinations.RawAddress,
        value: asset.mintContractAddress,
      },
      amount: 0,
      transactionParams: {
        maxFeePerGas: feeInfo.suggestedMaxFeePerGas,
        maxPriorityFeePerGas: feeInfo.suggestedMaxPriorityFeePerGas,
        gasLimit: (data.fee as EthereumNetworkFee).estimatedGas,
        data: mintTx.data,
      },
      isRawTransaction: true,
      metadata: {},
    };
  };

  const baseSummaryProps: BaseSummaryProps = {
    amount: Number(mintTransaction.amount) / 10 ** asset.decimals,
    date: new Date(mintTransaction.created_at),
    from: mintTransaction.sender_address,
  };

  return (
    <BaseTransaction
      nextLabel={"Mint"}
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
      getFeeOptions={getFeeOptions}
      getTransaction={getTransaction}
      hideCancelBtn={true}
      defaultFormValue={{
        recipientAddress: asset.mintContractAddress,
        amount: "0",
        txSpeed: "medium",
      }}
      onCancel={onClose}
      onDone={onClose}
      form={<MintTransactionDetail mintTransaction={mintTransaction} />}
      success={<Success {...baseSummaryProps} />}
      summary={<MintSummary {...baseSummaryProps} />}
    />
  );
}

interface MintTransactionModalProps {
  mintTransaction?: MintTransaction;
  onClose: () => void;
  idOfTxToMint?: string;
}

export default function MintTransactionModal({
  mintTransaction: mintTransactionFromProps,
  onClose,
}: MintTransactionModalProps) {
  const lastTxRef = useRef<MintTransaction>(null);

  useEffect(() => {
    if (mintTransactionFromProps) {
      lastTxRef.current = mintTransactionFromProps;
    } else {
      setTimeout(() => {
        lastTxRef.current = null;
      }, 150);
    }
  }, [mintTransactionFromProps]);

  const mintTransaction = mintTransactionFromProps || lastTxRef.current;

  return (
    <BaseDialog
      open={!!mintTransactionFromProps}
      onClose={onClose}
      title={"Mint"}
    >
      {mintTransaction && mintTransaction.status === TxStatus.SIGNED ? (
        <ModalContent mintTransaction={mintTransaction} onClose={onClose} />
      ) : (
        <>
          <MintTransactionDetail mintTransaction={mintTransaction} />
          <DialogActions sx={{ height: 85, padding: 0 }}>
            <DialogButtons
              primaryButtonProps={{ children: "Done", onClick: onClose }}
            />
          </DialogActions>
        </>
      )}
    </BaseDialog>
  );
}
