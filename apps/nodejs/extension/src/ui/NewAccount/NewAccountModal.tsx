import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { SupportedProtocols } from "@poktscan/vault";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { selectedAccountSelector } from "../../redux/selectors/account";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import ProtocolSelector from "../components/ProtocolSelector";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import DialogButtons from "../components/DialogButtons";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import BaseDialog from "../components/BaseDialog";
import AccountCreated from "./AccountCreated";
import { themeColors } from "../theme";

interface FormValues {
  account_name: string;
  protocol: SupportedProtocols;
}

type FormStatus = "normal" | "loading" | "error" | "success";

export const nameRules = {
  required: "Required",
  maxLength: {
    value: 25,
    message: "The max amount of characters is 25.",
  },
  validate: (value: string) => {
    if (!value.trim()) {
      return "Required";
    }

    return true;
  },
};

interface NewAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewAccountModal({
  open,
  onClose,
}: NewAccountModalProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const protocol = useAppSelector(selectedProtocolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const [status, setStatus] = useState<FormStatus>("normal");

  const { reset, control, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      protocol,
    },
  });

  useDidMountEffect(() => {
    setValue("protocol", protocol);
  }, [protocol]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      reset({ account_name: "", protocol });
      setStatus("normal");
    }, 150);

    return () => clearTimeout(timeout);
  }, [open]);

  const onSubmit = async (data: FormValues) => {
    setStatus("loading");
    const result = await AppToBackground.answerNewAccount({
      rejected: false,
      accountData: {
        name: data.account_name,
        protocol: data.protocol,
      },
    });

    if (result.error) {
      setStatus("error");
    } else {
      Promise.all([
        ...(protocol !== data.protocol
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
            address: result.data.address,
          })
        ),
      ]).then(() => setStatus("success"));
    }
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
            <Typography
              variant={"body2"}
              marginBottom={2}
              color={themeColors.textSecondary}
            >
              This account won’t be linked to any HD Account (Recovery Phrase).
            </Typography>
            <Controller
              control={control}
              rules={nameRules}
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
              render={({ field, fieldState: { error } }) => (
                <TextField
                  placeholder={"Account Name"}
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Create",
                type: "submit",
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
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <AccountCreated account={selectedAccount} />
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
      title={"New Account"}
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
