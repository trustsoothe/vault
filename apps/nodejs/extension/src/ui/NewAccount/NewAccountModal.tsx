import { shallowEqual } from "react-redux";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { AccountType, SupportedProtocols } from "@poktscan/vault";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  accountsSelector,
  selectedAccountSelector,
} from "../../redux/selectors/account";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import ProtocolSelector from "../components/ProtocolSelector";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import DialogButtons from "../components/DialogButtons";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import AccountAdded from "../components/AccountAdded";
import MenuDivider from "../components/MenuDivider";
import AccountInfo from "../components/AccountInfo";
import BaseDialog from "../components/BaseDialog";
import { themeColors } from "../theme";

interface FormValues {
  type: "standalone" | string;
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
  const accounts = useAppSelector(accountsSelector);
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
      type: "",
    },
  });

  useDidMountEffect(() => {
    setValue("protocol", protocol);
  }, [protocol]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      reset({ account_name: "", protocol, type: "" });
      setStatus("normal");
    }, 150);

    return () => clearTimeout(timeout);
  }, [open]);

  const onSubmit = async (data: FormValues) => {
    setStatus("loading");

    const updateSelection = (address: string) => {
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
            address,
          })
        ),
      ]).then(() => setStatus("success"));
    };

    if (data.type === "standalone") {
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
        updateSelection(result.data.address);
      }
    } else {
      const result = await AppToBackground.createAccountFromHdSeed({
        seedAccountId: data.type,
        protocol: data.protocol,
        name: data.account_name,
      });

      if (result.error) {
        setStatus("error");
      } else {
        updateSelection(result.data.account.address);
      }
    }
  };

  const seedAccounts = useMemo(() => {
    return accounts.filter(
      (account) => account.accountType === AccountType.HDSeed
    );
  }, [accounts]);

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
              name={"type"}
              control={control}
              rules={{
                required: "Required",
              }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  select
                  required
                  error={!!error}
                  label={"Account Type"}
                  helperText={error?.message}
                  {...field}
                  InputLabelProps={{ shrink: false }}
                  sx={{
                    marginBottom: error ? 1 : 0,
                    "& .MuiFormLabel-root": {
                      marginTop: -0.5,
                      color: "#8b93a0",
                      display: field.value ? "none" : undefined,
                    },
                  }}
                >
                  {seedAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      <AccountInfo address={account.id} name={account.name} />
                    </MenuItem>
                  ))}
                  {seedAccounts.length > 0 && <MenuDivider />}
                  <MenuItem value={"standalone"}>Standalone</MenuItem>
                </TextField>
              )}
            />
            <Typography
              variant={"body2"}
              marginBottom={2}
              marginTop={0.8}
              color={themeColors.textSecondary}
            >
              Select an existing seed if you want an account linked to your Seed
              Phrase.{" "}
            </Typography>
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
            <AccountAdded
              account={selectedAccount}
              successLabel={"Account Created"}
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
