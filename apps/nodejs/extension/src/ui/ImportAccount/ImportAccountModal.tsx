import type { SupportedProtocols } from "@poktscan/vault";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import ImportForm from "./ImportForm";
import { themeColors } from "../theme";
import { getPrivateKey } from "./utils";
import BaseDialog from "../components/BaseDialog";
import AccountAdded from "../components/AccountAdded";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import DialogButtons from "../components/DialogButtons";
import { nameRules } from "../NewAccount/NewAccountModal";
import { INVALID_FILE_PASSWORD } from "../../errors/account";
import ProtocolSelector from "../components/ProtocolSelector";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { selectedAccountSelector } from "../../redux/selectors/account";
import { getAddressFromPrivateKey } from "../../utils/networkOperations";
import AppToBackground from "../../controllers/communication/AppToBackground";

export interface ImportAccountFormValues {
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
  account_name: string;
  protocol?: SupportedProtocols;
}

type FormStatus = "normal" | "loading" | "error" | "account_exists" | "success";

interface ImportAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportAccountModal({
  open,
  onClose,
}: ImportAccountModalProps) {
  const dispatch = useAppDispatch();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const navigate = useNavigate();
  const [status, setStatus] = useState<FormStatus>("normal");
  const [wrongFilePassword, setWrongFilePassword] = useState(false);

  const methods = useForm<ImportAccountFormValues>({
    defaultValues: {
      import_type: "private_key",
      private_key: "",
      json_file: null,
      file_password: "",
      account_name: "",
      protocol: selectedProtocol,
    },
  });
  const {
    control,
    handleSubmit,
    formState: { isValidating },
    watch,
    clearErrors,
    setValue,
    getValues,
    reset,
  } = methods;

  const [type, file_password] = watch(["import_type", "file_password"]);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
    setValue("protocol", selectedProtocol);
    setWrongFilePassword(false);
  }, [type, selectedProtocol]);

  useEffect(() => {
    if (wrongFilePassword) {
      setWrongFilePassword(false);
    }
  }, [file_password]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      reset({
        import_type: "private_key",
        private_key: "",
        json_file: null,
        file_password: "",
        account_name: "",
        protocol: selectedProtocol,
      });
      setStatus("normal");
    }, 150);

    return () => clearTimeout(timeout);
  }, [open]);
  const onSubmit = async (data: ImportAccountFormValues) => {
    setStatus("loading");

    let privateKey: string;
    try {
      privateKey = await getPrivateKey(data, data.protocol);
    } catch (e) {
      if (e?.name === INVALID_FILE_PASSWORD.name) {
        setWrongFilePassword(true);
        setStatus("normal");
      } else {
        setStatus("error");
      }
      return;
    }

    AppToBackground.importAccount({
      protocol: data.protocol,
      name: data.account_name,
      privateKey,
    }).then(async (response) => {
      if (response.error) {
        setStatus("error");
      } else {
        if (response.data.accountAlreadyExists) {
          setStatus("account_exists");
        } else {
          const address = await getAddressFromPrivateKey(
            privateKey,
            data.protocol
          );
          Promise.all([
            ...(selectedProtocol !== data.protocol
              ? [
                  dispatch(
                    changeSelectedNetwork({
                      network: data.protocol,
                      chainId: selectedChainByProtocol[data.protocol],
                    })
                  ),
                ]
              : []),
            dispatch(
              changeSelectedAccountOfNetwork({
                protocol: data.protocol,
                address: address,
              })
            ).unwrap(),
          ])
            .then(() => {
              setStatus("success");
            })
            .catch(() => setStatus("error"));
        }
      }
    });
  };

  const onClickOkAccountExists = () => {
    setStatus("normal");
    reset({
      import_type: getValues("import_type"),
      account_name: "",
      json_file: null,
      private_key: "",
      file_password: "",
      protocol: getValues("protocol"),
    });
  };

  let content: React.ReactNode;

  switch (status) {
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
              render={({ field }) => <ProtocolSelector {...field} />}
            />
            <Typography
              variant={"body2"}
              marginTop={0.8}
              marginBottom={2}
              color={themeColors.textSecondary}
            >
              You’ll be able to use this account for every network of the
              protocol selected.
            </Typography>
            <Controller
              control={control}
              name={"account_name"}
              rules={nameRules}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  autoComplete={"off"}
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
              <ImportForm wrongFilePassword={wrongFilePassword} />
            </FormProvider>
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Import",
                type: "submit",
                disabled: isValidating,
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    case "loading":
      content = "Loading...";
      break;
    case "error":
      content = "Error...";
      break;
    case "account_exists":
      content = "Account exists...";
      break;
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <AccountAdded
              account={selectedAccount}
              successLabel={"Account Imported"}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                onClick: () => {
                  navigate(ACCOUNTS_PAGE);
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
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
