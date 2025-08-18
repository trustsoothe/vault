import type { SupportedProtocols } from "@soothe/vault";
import { shallowEqual } from "react-redux";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useForm, Controller } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  defaultSelectableProtocolSelector,
  networksSelector,
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
  NetworkFeature,
} from "../../redux/slices/app";
import { ACCOUNTS_PAGE, REQUEST_CONNECTION_PAGE } from "../../constants/routes";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  seedsSelector,
  selectedAccountSelector,
} from "../../redux/selectors/account";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import ProtocolSelector from "../components/ProtocolSelector";
import useDidMountEffect from "../hooks/useDidMountEffect";
import DialogButtons from "../components/DialogButtons";
import AccountFeedback from "../components/AccountFeedback";
import { enqueueErrorSnackbar } from "../../utils/ui";
import MenuDivider from "../components/MenuDivider";
import AccountInfo from "../components/AccountInfo";
import BaseDialog from "../components/BaseDialog";
import { themeColors } from "../theme";
import NetworkNotice from "../components/NetworkNotice";

interface FormValues {
  type: "standalone" | string;
  account_name: string;
  protocol: string;
}

type FormStatus = "normal" | "loading" | "success";

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

    if (value.includes(".")) {
      return "Dots are not allowed";
    }

    return true;
  },
};

interface NewAccountModalProps {
  open: boolean;
  onClose: () => void;
  protocol?: SupportedProtocols;
}

export default function NewAccountModal({
  open,
  onClose,
  protocol: protocolFromProps,
}: NewAccountModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigateToAccountsPage =
    location.pathname === "/accounts" ||
    location.pathname === REQUEST_CONNECTION_PAGE;
  const networks = useAppSelector(networksSelector);

  const seeds = useAppSelector(seedsSelector);
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const protocol = useAppSelector(selectedProtocolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );

  const [status, setStatus] = useState<FormStatus>("normal");

  const selectableNetwork = useAppSelector(
    defaultSelectableProtocolSelector(protocolFromProps)
  );
  const selectedProtocol = selectableNetwork?.protocol;

  const { reset, control, handleSubmit, setValue, getValues } =
    useForm<FormValues>({
      defaultValues: {
        account_name: "",
        protocol: selectedProtocol,
        type: "standalone",
      },
    });

  useDidMountEffect(() => {
    setValue("protocol", selectedProtocol);
  }, [selectedProtocol]);

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      reset({
        account_name: "",
        protocol: selectedProtocol,
        type: "standalone",
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
    const selectedNetwork = networks.find(
      (n) => n.protocol === getValues("protocol") && n.isProtocolDefault
    );
    return !!selectedNetwork?.notices?.find((notice) =>
      notice.disables?.includes(NetworkFeature.CreateAccount)
    );
  }, [getValues("protocol"), networks]);

  const createAccountDisablingNotice = useMemo(() => {
    const selectedNetwork = networks.find(
      (n) => n.protocol === getValues("protocol") && n.isProtocolDefault
    );
    return selectedNetwork?.notices?.find((notice) =>
      notice.disables?.includes(NetworkFeature.CreateAccount)
    );
  }, [isCreateAccountDisabled]);

  const onSubmit = async (data: FormValues) => {
    setStatus("loading");
    const selectedNetwork = networks.find(
      (n) => n.protocol === data.protocol && n.isProtocolDefault
    );

    const updateSelection = (address: string) => {
      return Promise.all([
        ...(protocol !== selectedNetwork.protocol
          ? [
              dispatch(
                changeSelectedNetwork({
                  network: selectedNetwork.protocol,
                  chainId: selectedChainByProtocol[selectedNetwork.protocol],
                })
              ).unwrap(),
            ]
          : []),
        dispatch(
          changeSelectedAccountOfNetwork({
            protocol: selectedNetwork.protocol,
            address,
          })
        ).unwrap(),
      ]).then(() => {
        closeSnackbars();
        setStatus("success");
      });
    };

    if (data.type === "standalone") {
      const result = await AppToBackground.answerNewAccount({
        rejected: false,
        accountData: {
          name: data.account_name,
          protocol: selectedNetwork.protocol,
          addressPrefix: selectedNetwork.addressPrefix,
        },
      });

      if (result.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Add New Account Failed",
          onRetry: () => onSubmit(data),
        });
        return;
      } else {
        await updateSelection(result.data.address);
      }
    } else {
      const result = await AppToBackground.createAccountFromHdSeed({
        recoveryPhraseId: data.type,
        protocol: selectedNetwork.protocol,
        name: data.account_name,
        addressPrefix: selectedNetwork.addressPrefix,
      });

      if (result.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Add New Account Failed",
          onRetry: () => onSubmit(data),
        });
        return;
      } else {
        await updateSelection(result.data.account.address);
      }
    }
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
                  disabled={isLoading}
                  label={"Account Type"}
                  helperText={error?.message}
                  {...field}
                  InputLabelProps={{ shrink: false }}
                  sx={{
                    "& .MuiFormLabel-asterisk": {
                      display: "none",
                    },
                    marginBottom: error ? 1 : 0,
                    "& .MuiFormLabel-root": {
                      marginTop: -0.5,
                      color: "#8b93a0",
                      display: field.value ? "none" : undefined,
                    },
                  }}
                >
                  {seeds.map((seed) => (
                    <MenuItem key={seed.id} value={seed.id}>
                      <AccountInfo
                        address={seed.id}
                        name={seed.name}
                        type={"seed"}
                      />
                    </MenuItem>
                  ))}
                  {seeds.length > 0 && <MenuDivider />}
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
              Phrase.
            </Typography>
            {!protocolFromProps && (
              <>
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
              </>
            )}
            {!isCreateAccountDisabled && (
              <Controller
                control={control}
                name={"account_name"}
                rules={nameRules}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    disabled={isLoading}
                    autoComplete={"off"}
                    placeholder={"Account Name"}
                    {...field}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            )}
            {isCreateAccountDisabled && createAccountDisablingNotice && (
              <NetworkNotice notice={createAccountDisablingNotice} />
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 56 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Create",
                type: "submit",
                disabled: isCreateAccountDisabled,
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
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            {selectedAccount && (
              <AccountFeedback
                account={selectedAccount}
                label={"Account Created"}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 56 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                onClick: () => {
                  if (!navigateToAccountsPage) {
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
      title={"New Account"}
      open={open}
      onClose={onClose}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
      isLoading={isLoading}
    >
      {content}
    </BaseDialog>
  );
}
