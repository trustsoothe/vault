import type { ReportBugMetadata } from "../../ReportBug/ReportBug";
import BaseDialog from "../../components/BaseDialog";
import { useNavigate } from "react-router-dom";
import DialogActions from "@mui/material/DialogActions";
import DialogButtons from "../../components/DialogButtons";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useAppSelector } from "../../hooks/redux";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../../redux/selectors/account";
import { SupportedProtocols } from "@soothe/vault";
import {
  networksSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../../redux/selectors/network";
import RecipientAutocomplete from "../../Transaction/RecipientAutocomplete";
import Stack from "@mui/material/Stack";
import {
  CosmosAccount,
  MorseClaimableAccount,
  useLazyGetMorseClaimableAccountQuery,
  useLazyGetShannonAccountQuery,
} from "../../../redux/slices/pokt";
import Typography from "@mui/material/Typography";
import { themeColors } from "../../theme";
import SuccessIcon from "../../assets/img/success_icon.svg";
import ErrorIcon from "../../assets/img/error_icon.svg";
import Button from "@mui/material/Button";
import {
  enqueueErrorReportSnackbar,
  roundAndSeparate,
  wrongPasswordSnackbar,
} from "../../../utils/ui";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import Divider from "@mui/material/Divider";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import Summary, { SummaryRowItem } from "../../components/Summary";
import { Network } from "../../../redux/slices/app";
import CircularProgress from "@mui/material/CircularProgress";
import { requirePasswordForSensitiveOptsSelector } from "../../../redux/selectors/preferences";
import { TransactionStatus } from "../../../controllers/datasource/Transaction";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import FailedActionBanner from "../../components/FailedActionBanner";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
import { REPORT_BUG_PAGE } from "../../../constants/routes";
import useUsdPrice from "../../hooks/useUsdPrice";
import SuccessActionBanner from "../../components/SuccessActionBanner";
import { Hash } from "../../Transaction/TransactionHash";
import { closeSnackbar, SnackbarKey } from "notistack";
import AppToBackground from "../../../controllers/communication/AppToBackground";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

function convertToPokt(upokt: string | number): string {
  return roundAndSeparate(Number(upokt) / 1e6, 2);
}

function getMorseChain(
  currentProtocol: SupportedProtocols,
  currentChain: string
) {
  if (currentProtocol === SupportedProtocols.Pocket) {
    return currentChain;
  }

  return currentChain === "pocket" ? "mainnet" : "testnet";
}

function getDefaultValues(
  currentProtocol: SupportedProtocols,
  currentSelectedAccount: string,
  currentChainId: string
): MigrateAccountFormValues {
  if (currentProtocol === SupportedProtocols.Pocket) {
    return {
      morseAddress: currentSelectedAccount,
      shannonAddress: "",
      vaultPassword: "",
      shannonChainId: "pocket",
    };
  }

  return {
    morseAddress: "",
    shannonAddress: currentSelectedAccount,
    vaultPassword: "",
    shannonChainId: currentChainId,
  };
}

function getNetworkRows(
  networks: Network[],
  morseChainId: string,
  shannonChainId: string,
  morseAddress: string,
  shannonAddress: string
): Array<SummaryRowItem> {
  let morseNetwork: Network, shannonNetwork: Network;

  for (const network of networks) {
    if (
      network.protocol === SupportedProtocols.Pocket &&
      network.chainId === morseChainId
    ) {
      morseNetwork = network;
    }

    if (
      network.protocol === SupportedProtocols.Cosmos &&
      network.chainId === shannonChainId
    ) {
      shannonNetwork = network;
    }

    if (morseNetwork && shannonNetwork) {
      break;
    }
  }

  const commonProps = {
    containerProps: {
      paddingLeft: 1,
      width: "calc(100% - 10px)",
    },
  };

  return [
    {
      type: "row",
      label: "Morse",
      value: null,
    },
    {
      type: "row",
      label: "Account",
      value: (
        <AccountInfoFromAddress
          address={morseAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
      ...commonProps,
    },
    {
      type: "row",
      label: "Network",
      value: (
        <Stack direction={"row"} alignItems={"center"} spacing={0.4}>
          <img
            width={18}
            height={18}
            src={morseNetwork?.iconUrl}
            alt={`${morseNetwork?.protocol}-${morseNetwork?.chainId}-img`}
          />
          <Typography variant={"subtitle2"}>{morseNetwork?.label}</Typography>
        </Stack>
      ),
      ...commonProps,
    },
    {
      type: "divider",
    },
    {
      type: "row",
      label: "Shannon",
      value: null,
    },
    {
      type: "row",
      label: "Account",
      value: (
        <AccountInfoFromAddress
          address={shannonAddress}
          protocol={SupportedProtocols.Cosmos}
        />
      ),
      ...commonProps,
    },
    {
      type: "row",
      label: "Network",
      value: (
        <Stack direction={"row"} alignItems={"center"} spacing={0.4}>
          <img
            width={18}
            height={18}
            src={shannonNetwork?.iconUrl}
            alt={`${shannonNetwork?.protocol}-${shannonNetwork?.chainId}-img`}
          />
          <Typography variant={"subtitle2"}>{shannonNetwork?.label}</Typography>
        </Stack>
      ),
      ...commonProps,
    },
  ];
}

type AccountQueryResult<T> = {
  currentData?: T;
  isLoading: boolean;
  isFetching: boolean;
  isUninitialized: boolean;
  isError: boolean;
};

function ErrorIconLarger() {
  return (
    <Stack
      sx={{
        marginTop: 0.2,
        height: "17px!important",
        width: "17px!important",
        "& svg": {
          transform: "scale(1.1)",
        },
      }}
    >
      <ErrorIcon />
    </Stack>
  );
}

interface AccountsVerificationProps {
  shannonChainId: string;
  morseAccountProps: AccountQueryResult<
    MorseClaimableAccount["morseClaimableAccount"]
  >;
  shannonAccountProps: AccountQueryResult<CosmosAccount["account"]>;
  fetchMorseAccount: () => void;
  fetchShannonAccount: () => void;
}

function AccountsVerification({
  shannonAccountProps,
  morseAccountProps,
  fetchMorseAccount,
  fetchShannonAccount,
  shannonChainId,
}: AccountsVerificationProps) {
  const networks = useAppSelector(networksSelector);
  const morseAccount = morseAccountProps.currentData;
  const isLoadingMorseAccount =
    morseAccountProps.isLoading ||
    morseAccountProps.isFetching ||
    morseAccountProps.isUninitialized;
  const morseAccountError = morseAccountProps.isError;

  const shannonAccount = shannonAccountProps.currentData;
  const isLoadingShannonAccount =
    shannonAccountProps.isLoading ||
    shannonAccountProps.isFetching ||
    shannonAccountProps.isUninitialized;
  const shannonAccountError = shannonAccountProps.isError;

  let morseAccountRow: React.ReactNode,
    shannonAccountRow: React.ReactNode,
    cantProceed = false;

  if (isLoadingMorseAccount) {
    morseAccountRow = (
      <Stack
        gap={1}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        sx={{
          "& circle": {
            strokeWidth: 5,
          },
        }}
      >
        <CircularProgress size={18} sx={{ color: themeColors.primary }} />
        <Typography color={themeColors.black}>
          Verifying your Morse account...
        </Typography>
      </Stack>
    );
  } else if (morseAccountError) {
    morseAccountRow = (
      <Stack gap={0.3}>
        <Stack
          gap={0.6}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <ErrorIconLarger />
          <Typography color={themeColors.black}>
            Error verifying your Morse account
          </Typography>
        </Stack>
        <Button
          sx={{
            height: 26,
          }}
          onClick={fetchMorseAccount}
        >
          Try again
        </Button>
      </Stack>
    );
  } else {
    if (!morseAccount) {
      cantProceed = true;
      morseAccountRow = (
        <Stack
          gap={0.6}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <ErrorIconLarger />
          <Typography color={themeColors.black}>
            Your Morse account was not found.
          </Typography>
        </Stack>
      );
    } else if (morseAccount.shannon_dest_address !== "") {
      cantProceed = true;
      morseAccountRow = (
        <Stack gap={0.3} alignItems={"center"}>
          <Stack gap={0.6} direction={"row"} justifyContent={"center"}>
            <ErrorIconLarger />
            <Typography color={themeColors.black}>
              Your Morse account cannot be migrated.
            </Typography>
          </Stack>
          <Typography fontSize={11}>It's has already been migrated.</Typography>
        </Stack>
      );
    } else if (morseAccount.application_stake.amount !== "0") {
      cantProceed = true;
      morseAccountRow = (
        <Stack gap={0.3} alignItems={"center"}>
          <Stack gap={0.6} direction={"row"} justifyContent={"center"}>
            <ErrorIconLarger />
            <Typography color={themeColors.black}>
              Your Morse account cannot be migrated.
            </Typography>
          </Stack>
          <Typography fontSize={11}>
            It's staked as an application with{" "}
            {convertToPokt(morseAccount.application_stake.amount)} POKT
          </Typography>
        </Stack>
      );
    } else if (morseAccount.supplier_stake.amount !== "0") {
      cantProceed = true;
      morseAccountRow = (
        <Stack gap={0.3} alignItems={"center"}>
          <Stack gap={0.6} direction={"row"} justifyContent={"center"}>
            <ErrorIconLarger />
            <Typography color={themeColors.black}>
              Your Morse account cannot be migrated.
            </Typography>
          </Stack>
          <Typography fontSize={11}>
            It's staked as a supplier with{" "}
            {convertToPokt(morseAccount.supplier_stake.amount)} POKT
          </Typography>
        </Stack>
      );
    } else {
      morseAccountRow = (
        <Stack gap={0.3} alignItems={"center"}>
          <Stack
            gap={0.6}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <SuccessIcon />
            <Typography color={themeColors.black}>
              Your Morse account is ready.
            </Typography>
          </Stack>
          <Typography fontSize={11}>
            It can be migrated with{" "}
            {convertToPokt(morseAccount.unstaked_balance.amount)} POKT
          </Typography>
        </Stack>
      );
    }
  }

  if (isLoadingShannonAccount) {
    shannonAccountRow = (
      <Stack
        gap={1}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        sx={{
          "& circle": {
            strokeWidth: 5,
          },
        }}
      >
        <CircularProgress size={18} sx={{ color: themeColors.primary }} />
        <Typography color={themeColors.black}>
          Verifying your Shannon account...
        </Typography>
      </Stack>
    );
  } else if (shannonAccountError) {
    shannonAccountRow = (
      <Stack gap={0.3}>
        <Stack
          gap={0.6}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <ErrorIconLarger />
          <Typography color={themeColors.black}>
            Error verifying your Shannon account
          </Typography>
        </Stack>
        <Button sx={{ height: 26 }} onClick={fetchShannonAccount}>
          Try again
        </Button>
      </Stack>
    );
  } else {
    if (!shannonAccount) {
      const faucet = networks.find(
        (n) =>
          n.protocol === SupportedProtocols.Cosmos &&
          n.chainId === shannonChainId
      )?.faucet;

      cantProceed = true;
      shannonAccountRow = (
        <Stack gap={0.3} alignItems={"center"}>
          <Stack gap={0.6} direction={"row"} justifyContent={"center"}>
            <ErrorIconLarger />
            <Typography color={themeColors.black}>
              Your Shannon account was not found.
            </Typography>
          </Stack>
          {faucet && (
            <Typography fontSize={11}>
              Get some coins{" "}
              <a href={faucet} target={"_blank"}>
                here
              </a>
              . After you have received your coins, try again.
            </Typography>
          )}
        </Stack>
      );
    } else {
      shannonAccountRow = (
        <Stack
          gap={0.6}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <SuccessIcon />
          <Typography color={themeColors.black} textAlign={"right"}>
            Your Shannon account exists.
          </Typography>
        </Stack>
      );
    }
  }

  return (
    <>
      <Summary
        containerProps={{
          border: `1px solid ${themeColors.light_gray1}`,
          sx: {
            "& hr": {
              border: `1px solid ${themeColors.light_gray1}!important`,
            },
          },
        }}
        rows={[
          {
            type: "row",
            label: "",
            value: morseAccountRow,
            containerProps: {
              sx: {
                "& div": {
                  width: 1,
                },
              },
            },
          },
          {
            type: "divider",
          },
          {
            type: "row",
            label: "",
            value: shannonAccountRow,
            containerProps: {
              sx: {
                "& div": {
                  width: 1,
                },
              },
            },
          },
        ]}
      />
      {cantProceed && (
        <Typography color={themeColors.black} fontSize={11}>
          Can't proceed with migration. Please make sure your Morse and Shannon
          accounts are ready.
        </Typography>
      )}
    </>
  );
}

export interface MigrateAccountFormValues {
  morseAddress: string;
  shannonAddress: string;
  shannonChainId: string;
  vaultPassword?: string;
}

interface MigrateAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MigrateAccountDialog({
  open,
  onClose,
}: MigrateAccountDialogProps) {
  const navigate = useNavigate();

  const errorSnackbarKey = useRef<SnackbarKey>(null);
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>(null);

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }

    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }
  };

  const accounts = useAppSelector(accountsSelector);
  const networks = useAppSelector(networksSelector);
  const currentProtocol = useAppSelector(selectedProtocolSelector);
  const currentAccount = useAppSelector(selectedAccountAddressSelector);
  const currentChain = useAppSelector(selectedChainSelector);
  const requirePassword = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );

  const methods = useForm<MigrateAccountFormValues>({
    defaultValues: getDefaultValues(
      currentProtocol,
      currentAccount,
      currentChain
    ),
  });
  const { handleSubmit, reset, watch, control } = methods;

  const [shannonAddress, morseAddress, shannonChainId] = watch([
    "shannonAddress",
    "morseAddress",
    "shannonChainId",
  ]);

  const morseChainId = getMorseChain(currentProtocol, currentChain);

  const { coinSymbol, usdPrice, isLoading } = useUsdPrice({
    protocol: SupportedProtocols.Cosmos,
    chainId: shannonChainId,
  });

  const shannonNetworks =
    currentProtocol === SupportedProtocols.Pocket
      ? networks.filter(
          (network) => network.protocol === SupportedProtocols.Cosmos
        )
      : [];

  const [getMorseAccount, morseAccountQueryResult] =
    useLazyGetMorseClaimableAccountQuery();
  const [getShannonAccount, shannonAccountQueryResult] =
    useLazyGetShannonAccountQuery();

  const [status, setStatus] = useState<"info" | "form" | "success" | "loading">(
    "info"
  );
  const [txResponse, setTxResponse] = useState<{
    hash: string;
    status: TransactionStatus;
    details?: object;
  }>(null);

  useDidMountEffect(() => {
    onClose();
  }, [currentProtocol, currentAccount, currentChain]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        reset(getDefaultValues(currentProtocol, currentAccount, currentChain));
        setStatus("info");
      }, 150);
    } else {
      reset(getDefaultValues(currentProtocol, currentAccount, currentChain));
    }

    closeSnackbars();

    return closeSnackbars;
  }, [open]);

  const onSubmit = async (data: MigrateAccountFormValues) => {
    if (status === "loading") {
      return;
    }

    if (status === "info") {
      getMorseAccount({
        address: data.morseAddress,
        chainId: data.shannonChainId,
      });
      getShannonAccount({
        address: data.shannonAddress,
        chainId: data.shannonChainId,
      });

      setStatus("form");
    }

    if (status === "form") {
      closeSnackbars();
      setStatus("loading");
      const response = await AppToBackground.migrateMorseAccount(data);

      if (response.error) {
        errorSnackbarKey.current = enqueueErrorReportSnackbar({
          message: "Transaction Failed",
          onRetry: () => onSubmit(data),
          onReport: () => {
            const txData = { ...data };
            let morsePublicKey = "",
              shannonPublicKey = "";

            for (const account of accounts) {
              if (
                account.address === txData.morseAddress &&
                account.protocol === SupportedProtocols.Pocket
              ) {
                morsePublicKey = account.publicKey;
              }

              if (
                account.address === txData.shannonAddress &&
                account.protocol === SupportedProtocols.Cosmos
              ) {
                shannonPublicKey = account.publicKey;
              }

              if (morsePublicKey !== "" && shannonPublicKey !== "") {
                break;
              }
            }

            delete txData.vaultPassword;

            const bugMetadata: ReportBugMetadata = {
              address: txData.shannonAddress,
              publicKey: shannonPublicKey,
              protocol: currentProtocol,
              chainId: currentChain,
              transactionType: "Migration",
              error: response.error,
              transactionData: {
                ...txData,
                morsePublicKey,
              },
            };

            navigate(REPORT_BUG_PAGE, {
              state: bugMetadata,
            });
          },
        });
        setStatus("form");
      } else if (response.data.isPasswordWrong) {
        wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
        setStatus("form");
      } else if (response.data.hash) {
        setTxResponse({
          status: response.data.status,
          hash: response.data.hash,
          details: response.data.details,
        });
        setStatus("success");
      }
    }

    if (status === "success") {
      onClose();
    }
  };

  const canNext = (() => {
    if (status === "info") {
      return !!morseAddress && !!shannonAddress;
    } else if (status === "form") {
      const { currentData: morseAccount } = morseAccountQueryResult;
      const { currentData: shannonAccount } = shannonAccountQueryResult;

      return (
        !!shannonAccount &&
        !!morseAccount &&
        morseAccount.shannon_dest_address === "" &&
        morseAccount.application_stake.amount === "0" &&
        morseAccount.supplier_stake.amount === "0"
      );
    }

    return status !== "loading";
  })();

  let content: React.ReactNode;
  const isCosmos = currentProtocol === SupportedProtocols.Cosmos;

  if (status === "info") {
    const faucet = networks.find(
      (n) =>
        n.protocol === SupportedProtocols.Cosmos &&
        // here we want to show the mainnet faucet when starting the migration from morse side
        n.chainId === (!isCosmos ? "pocket" : shannonChainId)
    )?.faucet;

    content = (
      <>
        <Typography>
          You're about to migrate your tokens from Morse to Shannon.
        </Typography>
        <Typography marginTop={-0.6}>
          Before you continue, please make sure:
        </Typography>
        <Stack
          component={"ul"}
          sx={{
            paddingLeft: 2,
            marginBottom: 0,
            marginTop: -0.4,
          }}
        >
          <Typography component={"li"}>
            Your Morse account is included in the official Morse-to-Shannon
            snapshot.
          </Typography>
          <Typography component={"li"}>
            Your Morse account is only a wallet. Node/Application accounts are
            not allowed to be migrated this way.
          </Typography>
          <Typography component={"li"}>
            Your Morse account has not been migrated in a previous attempt or
            process.
          </Typography>
          <Typography component={"li"}>
            Your corresponding Shannon account exists on the network. This will
            be accomplished by having POKT or minting a MACT token{" "}
            {faucet && (
              <a href={faucet} target={"_blank"}>
                here
              </a>
            )}
            .
          </Typography>
        </Stack>

        <Divider flexItem />

        <Stack gap={0.3}>
          <Typography>
            Select your {isCosmos ? "Morse" : "Shannon"} account:
          </Typography>

          <RecipientAutocomplete
            protocol={
              isCosmos ? SupportedProtocols.Pocket : SupportedProtocols.Cosmos
            }
            label={isCosmos ? "Morse" : "Shannon" + " Account"}
            fieldName={isCosmos ? "morseAddress" : "shannonAddress"}
            canSelectContact={false}
            acceptPublicKey={false}
            canTypeNotSavedAddress={false}
            canPaste={false}
          />
        </Stack>
        {currentProtocol === SupportedProtocols.Pocket && (
          <Stack gap={0.3}>
            <Typography>Select the Shannon network:</Typography>
            <Controller
              name={"shannonChainId"}
              control={control}
              rules={{ required: "Required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  size={"small"}
                  required
                  label={"Network"}
                  autoComplete={"off"}
                  disabled={isLoading}
                  select
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                  InputLabelProps={{ shrink: false }}
                  sx={{
                    "& .MuiSelect-icon": {
                      top: 5,
                    },
                    "& .MuiFormLabel-root": {
                      color: "#8b93a0",
                      display: field.value ? "none" : undefined,
                    },
                  }}
                >
                  {shannonNetworks.map((network) => (
                    <MenuItem key={network.chainId} value={network.chainId}>
                      {network.chainIdLabel}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        )}
      </>
    );
  } else if (status === "success") {
    const rows = getNetworkRows(
      networks,
      morseChainId,
      shannonChainId,
      morseAddress,
      shannonAddress
    );

    const migratedPokt =
      Number(morseAccountQueryResult.currentData!.unstaked_balance.amount) /
      1e6;

    let actionBanner: React.ReactNode;

    if (txResponse?.status === TransactionStatus.Successful) {
      actionBanner = <SuccessActionBanner label={"Transaction Sent"} />;
    } else {
      actionBanner = (
        <FailedActionBanner label={"Transaction Sent with Errors"} />
      );
    }

    const txSummaryItems: Array<SummaryRowItem> = [
      {
        type: "row",
        label: "Tx. Hash",
        value: (
          <Hash
            protocol={SupportedProtocols.Cosmos}
            chainId={shannonChainId}
            hash={txResponse.hash}
          />
        ),
      },
    ];

    const details = txResponse?.details as {
      hash: string;
      rpcUrl: string;
      code: number;
      codespace?: string;
      log?: string;
    };

    if (txResponse?.status === TransactionStatus.Invalid) {
      txSummaryItems.push({
        type: "row",
        label: "Code",
        value: details?.code?.toString() || "0",
      });

      if (details?.codespace) {
        txSummaryItems.push({
          type: "row",
          label: "Codespace",
          value: details?.codespace || "0",
        });
      }

      if (details?.log) {
        txSummaryItems.push({
          type: "row",
          label: "Raw Log",
          containerProps: {
            sx: {
              alignItems: "flex-start",
            },
          },
          value: (
            <Stack width={1} marginLeft={-9} marginTop={2.8}>
              <Typography
                fontSize={11}
                marginLeft={0.6}
                color={themeColors.black}
              >
                {details?.log}
              </Typography>
            </Stack>
          ),
        });
      }
    }

    content = (
      <>
        {actionBanner}
        <Summary
          rows={[
            ...rows,
            {
              type: "divider",
            },
            {
              type: "row",
              label:
                txResponse.status === TransactionStatus.Successful
                  ? "Migrated"
                  : "Tried Migrating",
              value: (
                <AmountWithUsd
                  symbol={coinSymbol}
                  balance={migratedPokt}
                  usdBalance={migratedPokt * usdPrice}
                  isLoadingUsdPrice={isLoading}
                  decimals={2}
                />
              ),
            },
          ]}
        />
        <Summary rows={txSummaryItems} />
      </>
    );
  } else {
    const rows = getNetworkRows(
      networks,
      morseChainId,
      shannonChainId,
      morseAddress,
      shannonAddress
    );

    content = (
      <>
        <Summary
          containerProps={{
            spacing: 0.2,
          }}
          rows={rows}
        />

        <AccountsVerification
          shannonChainId={shannonChainId}
          shannonAccountProps={shannonAccountQueryResult}
          morseAccountProps={morseAccountQueryResult}
          fetchMorseAccount={() => {
            getMorseAccount({
              address: morseAddress,
              chainId: shannonChainId,
            });
          }}
          fetchShannonAccount={() => {
            getShannonAccount({
              address: shannonAddress,
              chainId: shannonChainId,
            });
          }}
        />

        {requirePassword && (canNext || status === "loading") && (
          <Stack
            marginTop={-1.4}
            sx={{
              "& div": {
                marginTop: "4px!important",
              },
            }}
          >
            <VaultPasswordInput />
          </Stack>
        )}
      </>
    );
  }

  return (
    <BaseDialog open={open} onClose={onClose} title={"Migrate Account"}>
      <Stack
        component={"form"}
        id={"migrate-form"}
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          overflowY: status === "info" ? "hidden" : "auto",
          height: "100%",
          gap: status === "info" ? 1.2 : 1.6,
          paddingX: 1.6,
          paddingY: status === "info" ? 0.8 : 1.6,
        }}
      >
        <FormProvider {...methods}>{content}</FormProvider>
      </Stack>
      <DialogActions sx={{ padding: 0, height: 56 }}>
        <DialogButtons
          secondaryButtonProps={{
            children: status === "info" ? "Close" : "Back",
            onClick: () => {
              if (status === "loading") return;

              if (status === "info") {
                onClose();
              } else {
                setStatus("info");
              }
            },
            sx: {
              display: status === "success" ? "none" : undefined,
            },
          }}
          primaryButtonProps={{
            disabled: !canNext,
            children:
              status === "success"
                ? "Done"
                : status === "info"
                ? "Next"
                : "Migrate",
            type: "submit",
            form: "migrate-form",
            isLoading: status === "loading",
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
