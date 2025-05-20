import BaseDialog from "../../components/BaseDialog";
import DialogActions from "@mui/material/DialogActions";
import DialogButtons from "../../components/DialogButtons";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useAppSelector } from "../../hooks/redux";
import { selectedAccountAddressSelector } from "../../../redux/selectors/account";
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
  enqueueErrorSnackbar,
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
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
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
      shannonChainId: "",
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
          <Typography fontSize={11}>Its has already been migrated.</Typography>
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
            Its staked as an application with{" "}
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
            Its staked as a supplier with{" "}
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
      let faucet: string;

      if (shannonChainId === "pocket-beta") {
        faucet = "https://faucet.beta.testnet.pokt.network/";
      } else if (shannonChainId === "pocket") {
      }

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
  const [hash, setHash] = useState("");

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
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Transaction Failed",
          onRetry: () => onSubmit(data),
        });
        setStatus("form");
      } else if (response.data.isPasswordWrong) {
        wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
        setStatus("form");
      } else if (response.data.hash) {
        setStatus("success");
        setHash(response.data.hash);
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
        morseAccount.unstaked_balance.amount !== "0" &&
        morseAccount.application_stake.amount === "0" &&
        morseAccount.supplier_stake.amount === "0"
      );
    }

    return status !== "loading";
  })();

  let content: React.ReactNode;
  const isCosmos = currentProtocol === SupportedProtocols.Cosmos;

  if (status === "info") {
    content = (
      <>
        <Typography>
          You're about to migrate your tokens from Morse to Shannon.
        </Typography>
        <Typography>Before you continue, please make sure:</Typography>
        <Stack
          component={"ul"}
          sx={{
            paddingLeft: 2,
            marginY: 0,
          }}
        >
          <Typography component={"li"}>
            Your Morse account was included in the Morse-to-Shannon snapshot and
            only holds liquid (unstaked) tokens.
          </Typography>
          <Typography component={"li"}>
            It hasn't already been migrated.
          </Typography>
          <Typography component={"li"}>
            Your Shannon account needs to exists in the network. To exists, it
            needs to have balance (like MACT or POKT).
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

    content = (
      <>
        <SuccessActionBanner label={"Transaction Sent"} />
        <Summary
          rows={[
            ...rows,
            {
              type: "divider",
            },
            {
              type: "row",
              label: "Migrated",
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
        <Summary
          rows={[
            {
              type: "row",
              label: "Tx. Hash",
              value: (
                <Hash
                  protocol={SupportedProtocols.Cosmos}
                  chainId={shannonChainId}
                  hash={hash}
                />
              ),
            },
          ]}
        />
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
          overflowY: "auto",
          height: "100%",
          gap: status === "info" ? 1.2 : 1.6,
          padding: 1.6,
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
