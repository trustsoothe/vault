import type { SerializedAccountReference } from "@soothe/vault";
import { shallowEqual } from "react-redux";
import browser from "webextension-polyfill";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
  NetworkFeature,
} from "../../redux/slices/app";
import {
  defaultSelectableProtocolSelector,
  networksSelector,
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import ImportForm from "./ImportForm";
import { themeColors } from "../theme";
import { getPrivateKey } from "./utils";
import useIsPopup from "../hooks/useIsPopup";
import BaseDialog from "../components/BaseDialog";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import AccountFeedback from "../components/AccountFeedback";
import DialogButtons from "../components/DialogButtons";
import { nameRules } from "../NewAccount/NewAccountModal";
import { INVALID_FILE_PASSWORD } from "../../errors/account";
import ProtocolSelector from "../components/ProtocolSelector";
import useDidMountEffect from "../hooks/useDidMountEffect";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
  accountsSelector,
  selectedAccountSelector,
} from "../../redux/selectors/account";
import { getAddressFromPrivateKey } from "../../utils/networkOperations";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import NetworkNotice from "../components/NetworkNotice";

export interface ImportAccountFormValues {
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
  account_name: string;
  protocol?: string;
}

type FormStatus = "normal" | "loading" | "account_exists" | "success";

interface ImportAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportAccountModal({
  open,
  onClose,
}: ImportAccountModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isPopup = useIsPopup();
  const navigate = useNavigate();
  const [status, setStatus] = useState<FormStatus>("normal");
  const [wrongFilePassword, setWrongFilePassword] = useState(false);
  const [accountAlreadyExists, setAccountAlreadyExists] =
    useState<SerializedAccountReference>(null);
  const networks = useAppSelector(networksSelector);
  const selectableNetwork = useAppSelector(defaultSelectableProtocolSelector());
  const selectableProtocolId = selectableNetwork?.id;

  const methods = useForm<ImportAccountFormValues>({
    defaultValues: {
      import_type: "private_key",
      private_key: "",
      json_file: null,
      file_password: "",
      account_name: "",
      protocol: selectableProtocolId,
    },
  });
  const {
    control,
    handleSubmit,
    formState: { isValidating },
    watch,
    clearErrors,
    setValue,
    reset,
  } = methods;

  const [type, file_password] = watch(["import_type", "file_password"]);

  useDidMountEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
    setValue("protocol", selectableProtocolId);
    setWrongFilePassword(false);
  }, [type, selectableProtocolId]);

  useDidMountEffect(() => {
    if (isPopup && type === "json_file") {
      browser.tabs.create({
        active: true,
        url: `home.html#${location.pathname}?openToImportFile=true`,
      });
    }
  }, [type]);

  useEffect(() => {
    const openImport = searchParams.get("openToImportFile") === "true";

    if (openImport) {
      setTimeout(() => setValue("import_type", "json_file"), 200);

      enqueueSnackbar({
        variant: "info",
        message:
          "This page was open because you cannot import files in the popup.",
      });
      setSearchParams((prev) => {
        prev.delete("openToImportFile");

        return prev;
      });
    }
  }, []);

  useEffect(() => {
    if (wrongFilePassword) {
      setWrongFilePassword(false);
    }
  }, [file_password]);

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      reset({
        import_type: "private_key",
        private_key: "",
        json_file: null,
        file_password: "",
        account_name: "",
        protocol: selectableProtocolId,
      });
      setStatus("normal");
    }, 150);
    closeSnackbars();

    return () => {
      closeSnackbars();
      clearTimeout(timeout);
    };
  }, [open]);

  const isCreateAccountDisabled = useMemo(() => {
    const selectedNetwork = networks.find((n) => n.id === watch("protocol"));
    return !!selectedNetwork?.notices?.find((notice) =>
      notice.disables?.includes(NetworkFeature.CreateAccount)
    );
  }, [watch("protocol"), networks]);

  const createAccountDisablingNotice = useMemo(() => {
    const selectedNetwork = networks.find((n) => n.id === watch("protocol"));
    return selectedNetwork?.notices?.find((notice) =>
      notice.disables?.includes(NetworkFeature.CreateAccount)
    );
  }, [isCreateAccountDisabled]);

  const onSubmit = async (data: ImportAccountFormValues) => {
    setStatus("loading");
    const selectedNetwork = networks.find((n) => n.id === data.protocol);

    let privateKey: string;
    try {
      privateKey = await getPrivateKey(data, selectedNetwork.protocol);
    } catch (e) {
      if (e?.name === INVALID_FILE_PASSWORD.name) {
        setWrongFilePassword(true);
        setStatus("normal");
      } else {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Import Account Failed",
          onRetry: () => onSubmit(data),
        });
      }
      return;
    }

    AppToBackground.importAccount({
      protocol: selectedNetwork.protocol,
      name: data.account_name,
      addressPrefix: selectedNetwork.addressPrefix,
      privateKey,
    }).then(async (response) => {
      if (response.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Import Account Failed",
          onRetry: () => onSubmit(data),
        });
      } else {
        const address = await getAddressFromPrivateKey(
          privateKey,
          selectedNetwork.protocol,
          selectedNetwork.addressPrefix
        );

        if (response.data.accountAlreadyExists) {
          const account = accounts.find(
            (a) =>
              a.address === address && a.protocol === selectedNetwork.protocol
          );

          if (account) {
            setAccountAlreadyExists(account);
            setStatus("account_exists");
          }
        } else {
          Promise.all([
            ...(selectedProtocol !== selectedNetwork.protocol
              ? [
                  dispatch(
                    changeSelectedNetwork({
                      network: selectedNetwork.protocol,
                      chainId: selectedChainByProtocol[data.protocol],
                    })
                  ),
                ]
              : []),
            dispatch(
              changeSelectedAccountOfNetwork({
                protocol: selectedNetwork.protocol,
                address: address,
              })
            ).unwrap(),
          ]).then(() => {
            closeSnackbars();

            setStatus("success");
          });
        }
      }
    });
  };

  const isLoading = status === "loading";
  let content: React.ReactNode;

  switch (status) {
    case "loading":
    case "normal":
      content = (
        <>
          <DialogContent
            sx={{
              paddingTop: "20px!important",
              paddingX: 2.4,
              paddingBottom: 2.4,
            }}
          >
            <Controller
              control={control}
              name={"protocol"}
              render={({ field }) => (
                <ProtocolSelector disabled={isLoading} {...field} />
              )}
            />
            <Typography
              variant={"body2"}
              marginTop={0.8}
              marginBottom={2}
              color={themeColors.textSecondary}
            >
              {isCreateAccountDisabled
                ? "Account creation is disabled for this network."
                : "You’ll be able to use this account for every network of the protocol selected."}
            </Typography>
            {!isCreateAccountDisabled && (
              <>
                <Controller
                  control={control}
                  name={"account_name"}
                  rules={nameRules}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      autoFocus
                      autoComplete={"off"}
                      disabled={isLoading}
                      placeholder={"Account Name"}
                      {...field}
                      error={!!error}
                      helperText={error?.message}
                      sx={{
                        marginBottom: error ? 3 : 1.6,
                      }}
                    />
                  )}
                />
                <FormProvider {...methods}>
                  <ImportForm
                    disableInputs={isLoading}
                    wrongFilePassword={wrongFilePassword}
                    infoText={
                      "Import your account using your private key or your portable wallet (file)."
                    }
                  />
                </FormProvider>
              </>
            )}
            {isCreateAccountDisabled && createAccountDisablingNotice && (
              <NetworkNotice notice={createAccountDisablingNotice} />
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Import",
                type: "submit",
                disabled: isValidating || isCreateAccountDisabled,
                isLoading,
              }}
              secondaryButtonProps={{
                children: "Cancel",
                onClick: onClose,
                disabled: isLoading,
              }}
            />
          </DialogActions>
        </>
      );
      break;
    case "account_exists":
    case "success":
      const isSuccess = status === "success";
      const account = isSuccess ? selectedAccount : accountAlreadyExists;
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            {account && (
              <AccountFeedback
                account={account}
                label={
                  isSuccess ? "Account Imported" : "Account Already Exists"
                }
                type={isSuccess ? "success" : "warning"}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                onClick: () => {
                  if (isSuccess) {
                    navigate(ACCOUNTS_PAGE);
                  }
                  onClose();
                },
              }}
            />
          </DialogActions>
        </>
      );
      break;
  }

  return (
    <BaseDialog
      title={"Import Account"}
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
