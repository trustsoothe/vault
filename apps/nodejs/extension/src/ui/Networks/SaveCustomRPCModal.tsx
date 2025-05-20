import type { CustomRPC } from "../../redux/slices/app";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useMemo, useRef, useState } from "react";
import { SupportedProtocols } from "@soothe/vault";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import { isNetworkUrlHealthy } from "../../utils/networkOperations";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import TextFieldWithPaste from "../components/TextFieldWithPaste";
import { saveCustomRpc } from "../../redux/slices/app/network";
import useDidMountEffect from "../hooks/useDidMountEffect";
import ProtocolSelector from "../components/ProtocolSelector";
import DialogButtons from "../components/DialogButtons";
import { RPC_ALREADY_EXISTS } from "../../errors/rpc";
import CustomRPCFeedback from "./CustomRPCFeedback";
import BaseDialog from "../components/BaseDialog";
import {
  defaultSelectableProtocolSelector,
  networksSelector,
  selectedChainSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";

interface SaveRpcFormValues {
  url: string;
  protocol: SupportedProtocols;
  chainId: string;
  isPreferred: boolean;
}

const defaultFormValues: SaveRpcFormValues = {
  url: "",
  protocol: SupportedProtocols.Pocket,
  chainId: "mainnet",
  isPreferred: false,
};

interface SaveRpcModalProps {
  rpcToUpdate?: CustomRPC;
  open: boolean;
  onClose: () => void;
}

export default function SaveCustomRPCModal({
  rpcToUpdate,
  open,
  onClose,
}: SaveRpcModalProps) {
  const invalidSnackbarKey = useRef<SnackbarKey>();
  const errorSnackbarKey = useRef<SnackbarKey>();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<
    "normal" | "loading" | "already_exists" | "success"
  >("normal");
  const [rpcToShowInSummary, setRpcToShowInSummary] = useState<CustomRPC>(null);

  const allNetworks = useAppSelector((state) => state.app.networks);
  const selectedChainOnApp = useAppSelector(selectedChainSelector);
  const selectableNetwork = useAppSelector(defaultSelectableProtocolSelector());
  const selectableNetworkId = selectableNetwork?.id;
  const networks = useAppSelector(networksSelector);

  const { handleSubmit, control, reset, watch, clearErrors, setValue } =
    useForm<SaveRpcFormValues>({
      defaultValues: {
        ...defaultFormValues,
        protocol: selectableNetworkId,
        chainId: selectedChainOnApp,
        ...(rpcToUpdate && {
          url: rpcToUpdate.url,
          protocol: rpcToUpdate.protocol,
          chainId: rpcToUpdate.chainId,
          isPreferred: rpcToUpdate.isPreferred || false,
        }),
      },
    });

  const selectedProtocol = watch("protocol");

  useDidMountEffect(() => {
    setValue("chainId", "");
  }, [selectedProtocol]);

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }

    if (invalidSnackbarKey.current) {
      closeSnackbar(invalidSnackbarKey.current);
      invalidSnackbarKey.current = null;
    }
  };

  useDidMountEffect(() => {
    const timeout = setTimeout(() => {
      reset({
        ...defaultFormValues,
        protocol: selectableNetworkId,
        chainId: selectedChainOnApp,
        ...(rpcToUpdate && {
          url: rpcToUpdate.url,
          protocol: rpcToUpdate.protocol,
          chainId: rpcToUpdate.chainId,
          isPreferred: rpcToUpdate.isPreferred || false,
        }),
      });
      setStatus("normal");
    }, 150);

    closeSnackbars();

    return () => {
      closeSnackbars();
      clearTimeout(timeout);
    };
  }, [open]);

  const onSubmit = async (data: SaveRpcFormValues) => {
    setStatus("loading");

    const selectedNetwork = networks.find((n) => n.id === data.protocol);

    if (!rpcToUpdate || (rpcToUpdate && rpcToUpdate.url !== data.url)) {
      const healthResult = await isNetworkUrlHealthy({
        protocol: selectedNetwork.protocol,
        chainID: data.chainId as any,
        rpcUrl: data.url,
      });

      if (
        !healthResult.canProvideFee ||
        !healthResult.canSendTransaction ||
        !healthResult.canProvideBalance
      ) {
        let text = "The provided RPC URL didn't pass the following checks:";
        if (!healthResult?.canProvideFee) {
          text += "\n• Fee check.";
        }
        if (!healthResult?.canProvideBalance) {
          text += "\n• Balance check.";
        }
        if (!healthResult?.canSendTransaction) {
          text += "\n• Transaction check.";
        }

        text += "\nPlease provide a valid RPC URL.";

        invalidSnackbarKey.current = enqueueSnackbar({
          message: {
            title: "Invalid RPC",
            content: text,
          },
          variant: "error",
          persist: true,
        });
        setStatus("normal");
        return;
      }
    }

    dispatch(
      saveCustomRpc({
        idToReplace: rpcToUpdate?.id,
        rpc: {
          protocol: data.protocol,
          chainId: data.chainId,
          url: data.url,
          isPreferred: data.isPreferred,
        },
      })
    )
      .unwrap()
      .then(({ rpcSaved }) => {
        setRpcToShowInSummary(rpcSaved);
        setStatus("success");
      })
      .catch((error) => {
        if (error?.name === RPC_ALREADY_EXISTS.name) {
          setRpcToShowInSummary({
            id: "",
            ...data,
          });
          setStatus("already_exists");
        } else {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            message: "Failed to Save Custom RPC",
            onRetry: () => onSubmit(data),
          });
        }
      });
  };

  const networksOfProtocol = useMemo(() => {
    return allNetworks.filter(
      (network) => network.protocol === selectedProtocol
    );
  }, [selectedProtocol, allNetworks]);

  const isLoading = status === "loading";
  let content: React.ReactNode;

  switch (status) {
    case "loading":
    case "normal":
      content = (
        <>
          <DialogContent
            sx={{
              padding: "24px!important",
            }}
          >
            <Controller
              control={control}
              name={"protocol"}
              render={({ field }) => (
                <ProtocolSelector disabled={isLoading} {...field} />
              )}
            />
            <Controller
              name={"chainId"}
              control={control}
              rules={{ required: "Required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  size={"small"}
                  required
                  label={"Network"}
                  autoComplete={"off"}
                  disabled={
                    !selectedProtocol ||
                    !networksOfProtocol?.length ||
                    isLoading
                  }
                  select
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                  InputLabelProps={{ shrink: false }}
                  sx={{
                    marginTop: 1.6,
                    "& .MuiSelect-icon": {
                      top: 5,
                    },
                    "& .MuiFormLabel-root": {
                      color: "#8b93a0",
                      display: field.value ? "none" : undefined,
                    },
                  }}
                >
                  {networksOfProtocol.map((network) => (
                    <MenuItem key={network.chainId} value={network.chainId}>
                      {network.chainIdLabel}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name={"url"}
              control={control}
              rules={{ required: "Required" }}
              render={({ field, fieldState: { error } }) => (
                <TextFieldWithPaste
                  {...field}
                  sx={{
                    marginTop: 1.6,
                  }}
                  autoFocus
                  disabled={isLoading}
                  placeholder={"RPC URL"}
                  error={!!error}
                  helperText={error?.message}
                  autoComplete={"off"}
                  onPaste={(url) => {
                    setValue("url", url);
                    clearErrors("url");
                  }}
                />
              )}
            />
            <Stack
              width={1}
              height={21}
              marginTop={1.8}
              direction={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Typography variant={"subtitle2"}>Preferred RPC</Typography>
              <Controller
                control={control}
                name={"isPreferred"}
                render={({ field }) => (
                  <Switch
                    size={"small"}
                    {...field}
                    disabled={isLoading}
                    checked={field.value}
                  />
                )}
              />
            </Stack>
            <Typography
              width={295}
              marginTop={1.5}
              variant={"body2"}
              color={themeColors.textSecondary}
            >
              Use this RPC for all RPC calls for this network. If the call to
              this RPC fails the default RPC will be used.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 56 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Save",
                type: "submit",
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
    case "already_exists":
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <CustomRPCFeedback
              customRpc={rpcToShowInSummary}
              type={status === "success" ? "saved" : "already_exists"}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 56 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                onClick: onClose,
              }}
            />
          </DialogActions>
        </>
      );
      break;
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      title={rpcToUpdate ? "Update RPC" : "New RPC"}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
