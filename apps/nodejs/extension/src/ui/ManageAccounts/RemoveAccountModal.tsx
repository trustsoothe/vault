import Stack from "@mui/material/Stack";
import browser from "webextension-polyfill";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "react-router-dom";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  AccountType,
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  getAddressFromPrivateKey,
  getPrivateKeyFromPPK,
} from "../../utils/networkOperations";
import Summary, { SummaryRowItem } from "../components/Summary";
import { labelByProtocolMap } from "../../constants/protocols";
import useDidMountEffect from "../hooks/useDidMountEffect";
import { MANAGE_ACCOUNTS_PAGE } from "../../constants/routes";
import { INVALID_FILE_PASSWORD } from "../../errors/account";
import CopyAddressButton from "../Home/CopyAddressButton";
import DialogButtons from "../components/DialogButtons";
import PasswordInput from "../components/PasswordInput";
import ImportForm from "../ImportAccount/ImportForm";
import AccountInfo from "../components/AccountInfo";
import { useAppSelector } from "../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import useIsPopup from "../hooks/useIsPopup";
import {
  accountsImportedSelector,
  accountsSelector,
  seedsSelector,
} from "../../redux/selectors/account";
import { themeColors } from "../theme";
import {
  enqueueErrorSnackbar,
  enqueueSnackbar,
  readFile,
  wrongPasswordSnackbar,
} from "../../utils/ui";

interface FormValues {
  vault_password?: string;
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
  protocol?: SupportedProtocols;
}

const getPrivateKey = async (
  data: FormValues,
  protocol: SupportedProtocols
) => {
  try {
    let privateKey: string;

    if (data.json_file) {
      const contentFile = await readFile(data.json_file);

      privateKey = await getPrivateKeyFromPPK(
        contentFile,
        data.file_password,
        protocol
      );
    } else {
      privateKey = data.private_key;
    }

    return privateKey;
  } catch (e) {
    if (
      [
        "Cannot define property stack, object is not extensible",
        "Unsupported state or unable to authenticate data",
        "Key derivation failed - possibly wrong password",
      ].includes(e?.message)
    ) {
      throw INVALID_FILE_PASSWORD;
    }

    throw e;
  }
};

const defaultValues: FormValues = {
  vault_password: "",
  import_type: "private_key",
  private_key: "",
  json_file: null,
  file_password: "",
};

interface RemoveAccountModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

export default function RemoveAccountModal({
  account,
  onClose,
}: RemoveAccountModalProps) {
  const lastAccountRef = useRef<SerializedAccountReference>(null);
  const lastCheckPkRef = useRef<boolean>(null);
  const errorSnackbarKey = useRef<SnackbarKey>();
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>();
  const accounts = useAppSelector(accountsSelector);
  const seeds = useAppSelector(seedsSelector);
  const isPopup = useIsPopup();
  const [status, setStatus] = useState<"form" | "invalid_pk" | "loading">(
    "form"
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const requirePassword = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );
  const accountsImported = useAppSelector(accountsImportedSelector);

  const methods = useForm<FormValues>({
    defaultValues: {
      ...defaultValues,
      protocol: account?.protocol,
    },
  });

  const { handleSubmit, control, clearErrors, setValue, watch, reset } =
    methods;
  const [file_password, importType, privateKey, jsonFile, vaultPassword] =
    watch([
      "file_password",
      "import_type",
      "private_key",
      "json_file",
      "vault_password",
    ]);
  const [wrongFilePassword, setWrongFilePassword] = useState(false);

  useEffect(() => {
    if (wrongFilePassword) {
      setWrongFilePassword(false);
    }
  }, [file_password]);

  useDidMountEffect(() => {
    if (status === "invalid_pk") {
      setStatus("form");
    }
  }, [privateKey, jsonFile]);

  useDidMountEffect(() => {
    if (isPopup && importType === "json_file") {
      browser.tabs.create({
        active: true,
        url: `home.html#${MANAGE_ACCOUNTS_PAGE}?toRemoveWithFile=${account.id}`,
      });
    }
  }, [importType]);

  useEffect(() => {
    const toRemoveWithFile = searchParams.get("toRemoveWithFile");

    if (toRemoveWithFile && account?.id === toRemoveWithFile) {
      setTimeout(() => setValue("import_type", "json_file"), 100);
      enqueueSnackbar({
        variant: "info",
        message:
          "This page was open because you cannot import files in the popup.",
      });
      setSearchParams((prev) => {
        prev.delete("toRemoveWithFile");

        return prev;
      });
    }
  }, [account]);

  const closeSnackbars = () => {
    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }

    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  const shouldCheckPk = !accountsImported.includes(
    (account || lastAccountRef.current)?.address
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (account) {
      lastAccountRef.current = account;
      lastCheckPkRef.current = shouldCheckPk;
      reset({
        ...defaultValues,
        protocol: account?.protocol,
      });
    } else {
      timeout = setTimeout(() => {
        reset({
          ...defaultValues,
          protocol: account?.protocol,
        });
        setStatus("form");
        lastCheckPkRef.current = true;
        lastAccountRef.current = undefined;
      }, 150);
    }

    closeSnackbars();

    return () => {
      closeSnackbars();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [account]);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
    setValue("protocol", account?.protocol);
    setWrongFilePassword(false);
  }, [importType]);

  const removeAccount = async (data: FormValues) => {
    setStatus("loading");

    if (shouldCheckPk && account.accountType === AccountType.Individual) {
      let privateKey: string;
      try {
        privateKey = await getPrivateKey(data, account.protocol);
      } catch (e) {
        if (e?.name === INVALID_FILE_PASSWORD.name) {
          setWrongFilePassword(true);
        } else {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            message: "Remove Account Failed",
            onRetry: () => removeAccount(data),
          });
        }
        setStatus("form");
        return;
      }

      const addressOfPk = await getAddressFromPrivateKey(
        privateKey,
        account.protocol
      );

      if (addressOfPk !== account.address) {
        setStatus("invalid_pk");
        return;
      }
    }

    AppToBackground.removeAccount({
      serializedAccount: account,
      vaultPassword: requirePassword ? data.vault_password : undefined,
    }).then((response) => {
      if (response.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Remove Account Failed",
          onRetry: () => removeAccount(data),
        });
      } else {
        if (response.data.isPasswordWrong) {
          wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
          setStatus("form");
        } else {
          closeSnackbars();
          onClose();
          enqueueSnackbar({
            message: "Account Removed Successfully!",
            variant: "success",
          });
        }
      }
    });
  };

  const isLoading = status === "loading";
  const accountOrRef = account || lastAccountRef.current;
  const accountSummaryRows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Name",
      value: (
        <AccountInfo
          address={accountOrRef?.address}
          name={accountOrRef?.name}
        />
      ),
    },
    {
      type: "row",
      label: "Address",
      value: (
        <CopyAddressButton
          address={accountOrRef?.address}
          sxProps={{
            fontWeight: 500,
            boxShadow: "none",
            marginRight: -0.8,
            color: themeColors.black,
            backgroundColor: "transparent",
          }}
        />
      ),
    },
    {
      type: "row",
      label: "Protocol",
      value: labelByProtocolMap[accountOrRef?.protocol],
    },
  ];

  if (accountOrRef?.accountType === AccountType.HDChild) {
    const accountSeed = accounts.find(
      (account) => account.id === accountOrRef?.parentId
    );

    const seed = seeds.find((seed) => seed.id === accountSeed?.seedId);

    if (seed) {
      accountSummaryRows.unshift(
        {
          type: "row",
          label: "Seed",
          value: (
            <AccountInfo address={seed.id} name={seed.name} type={"seed"} />
          ),
        },
        {
          type: "divider",
        }
      );
    }
  }

  const accountIsChild = accountOrRef?.accountType === AccountType.HDChild;

  const canRemove =
    (accountIsChild ||
      !shouldCheckPk ||
      (importType === "private_key" ? !!privateKey : !!jsonFile)) &&
    (!requirePassword || !!vaultPassword);

  const dontShowImportForm = !shouldCheckPk || !lastCheckPkRef.current;

  return (
    <BaseDialog
      open={!!account}
      onClose={onClose}
      isLoading={isLoading}
      title={"Remove Account"}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(removeAccount),
      }}
    >
      <DialogContent sx={{ padding: "24px!important" }}>
        <Summary rows={accountSummaryRows} />
        {accountOrRef?.accountType === AccountType.HDChild ||
        dontShowImportForm ? (
          <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
            {accountOrRef?.accountType === AccountType.HDChild
              ? "You will be able to restore this account from your seed at anytime."
              : "As you imported this account in your vault, we understand that you have its private key or portable wallet (json) somewhere saved to restore this account in case its needed."}
          </Typography>
        ) : (
          <Stack marginTop={1.6}>
            <FormProvider {...methods}>
              <ImportForm
                wrongFilePassword={wrongFilePassword}
                disableInputs={isLoading}
                infoText={
                  "To remove this account, please provide your private key or your portable wallet (file). Soothe needs to make sure you saved your access to this account, given it is not linked to a seed."
                }
              />
              {status === "invalid_pk" && (
                <Typography
                  fontSize={11}
                  marginTop={0.8}
                  marginBottom={0.8}
                  lineHeight={"16px"}
                  color={themeColors.red}
                >
                  The provided{" "}
                  {importType === "private_key"
                    ? "private key"
                    : "portable wallet"}{" "}
                  does not correspond to the selected account to remove.
                </Typography>
              )}
            </FormProvider>
          </Stack>
        )}
        {requirePassword && (
          <>
            <Divider flexItem={true} sx={{ marginTop: 1.6 }} />
            <Typography fontSize={11} lineHeight={"16px"} marginTop={1.6}>
              To continue, please enter the vault’s password:
            </Typography>
            <Controller
              control={control}
              name={"vault_password"}
              render={({ field, fieldState: { error } }) => (
                <PasswordInput
                  required
                  {...field}
                  disabled={status !== "form" || isLoading}
                  placeholder={"Vault Password"}
                  error={!!error}
                  helperText={error?.message}
                  sx={{
                    marginTop: 1.2,
                    marginBottom: !!error ? 1 : 0,
                    "& .MuiFormHelperText-root": {
                      fontSize: 10,
                    },
                  }}
                />
              )}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ height: 85, padding: 0 }}>
        <DialogButtons
          primaryButtonProps={{
            variant: "text",
            sx: {
              backgroundColor: themeColors.white,
              color: themeColors.red,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            },
            children: "Remove Account",
            disabled: !canRemove,
            type: "submit",
            isLoading,
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
