import type { CustomRPC } from "../../redux/slices/app";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useForm, Controller } from "react-hook-form";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { SupportedProtocols } from "@poktscan/keyring";
import { enqueueSnackbar } from "../../utils/ui";
import { RPC_ALREADY_EXISTS } from "../../errors/rpc";
import { NETWORKS_PAGE } from "../../constants/routes";
import OperationFailed from "../common/OperationFailed";
import CircularLoading from "../common/CircularLoading";
import { labelByProtocolMap } from "../../constants/protocols";
import { saveCustomRpc } from "../../redux/slices/app/network";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { isNetworkUrlHealthy } from "../../utils/networkOperations";
import { customRpcsSelector } from "../../redux/selectors/network";

interface FormValues {
  url: string;
  protocol: SupportedProtocols;
  chainId: string;
  isPreferred: boolean;
}

interface HealthStatus {
  canSendTransaction: boolean;
  canProvideBalance: boolean;
  canProvideFee: boolean;
}

const defaultFormValues: FormValues = {
  url: "",
  protocol: SupportedProtocols.Pocket,
  chainId: "mainnet",
  isPreferred: false,
};

const protocols: { protocol: SupportedProtocols; label: string }[] =
  Object.values(SupportedProtocols).map((protocol) => ({
    protocol,
    label: labelByProtocolMap[protocol],
  }));

const AddUpdateNetwork: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [rpcToUpdate, setRpcToUpdate] = useState<CustomRPC>(null);
  const [rpcHealthResult, setRpcHealthResult] = useState<HealthStatus>(null);
  const [status, setStatus] = useState<
    "normal" | "loading" | "error" | "invalid_url" | "already_exists"
  >("normal");
  const { register, handleSubmit, control, reset, watch, setValue, setFocus } =
    useForm<FormValues>({
      defaultValues: { ...defaultFormValues },
    });

  const selectedProtocol = watch("protocol");
  const customRpcs = useAppSelector(customRpcsSelector);

  useEffect(() => {
    setValue("chainId", "");
  }, [selectedProtocol]);

  const onCancel = useCallback(() => {
    navigate(`${NETWORKS_PAGE}?tab=customs`);
  }, [navigate]);

  useEffect(() => {
    const id = searchParams.get("id");
    const rpcFromStore = customRpcs.find((item) => item.id === id);
    if (rpcFromStore && rpcToUpdate?.id !== id) {
      setRpcToUpdate(rpcFromStore);
      return;
    }

    if (!rpcFromStore) {
      setRpcToUpdate(null);
    }
  }, [searchParams, customRpcs]);

  useEffect(() => {
    if (rpcToUpdate) {
      reset({
        url: rpcToUpdate.url,
        protocol: rpcToUpdate.protocol,
        chainId: rpcToUpdate.chainId,
        isPreferred: rpcToUpdate.isPreferred || false,
      });
    }
  }, [rpcToUpdate]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setStatus("loading");

      if (!rpcToUpdate || (rpcToUpdate && rpcToUpdate.url !== data.url)) {
        const healthResult = await isNetworkUrlHealthy({
          protocol: data.protocol,
          chainID: data.chainId as any,
          rpcUrl: data.url,
        });

        if (
          !healthResult.canProvideFee ||
          !healthResult.canSendTransaction ||
          !healthResult.canProvideBalance
        ) {
          setRpcHealthResult(healthResult);
          setStatus("invalid_url");
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
        .then(() => {
          enqueueSnackbar({
            message: `Network ${
              rpcToUpdate ? "updated" : "added"
            } successfully.`,
            variant: "success",
          });

          navigate(`${NETWORKS_PAGE}?tab=customs`);
        })
        .catch((error) => {
          if (error?.name === RPC_ALREADY_EXISTS.name) {
            setStatus("already_exists");
          } else {
            setStatus("error");
          }
        });
    },
    [rpcToUpdate, navigate]
  );

  const onClickOk = useCallback(() => {
    setRpcHealthResult(null);
    setStatus("normal");
    setTimeout(() => setFocus("url", { shouldSelect: true }), 25);
  }, [setFocus]);

  const allNetworks = useAppSelector((state) => state.app.networks);

  const networksOfProtocol = useMemo(() => {
    return allNetworks.filter(
      (network) => network.protocol === selectedProtocol
    );
  }, [selectedProtocol, allNetworks]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error saving the network."}
          onCancel={onCancel}
        />
      );
    }

    if (status === "invalid_url" || status === "already_exists") {
      let text: string;

      if (status === "already_exists") {
        text = "The provided RPC already exists. Please introduce another one.";
      } else {
        text =
          "The provided RPC url did not passed all the checks.\nHere are the checks it dit not passed:\n";
        if (!rpcHealthResult?.canProvideFee) {
          text += "\n- Fee check.";
        }
        if (!rpcHealthResult?.canProvideBalance) {
          text += "\n- Balance check.";
        }
        if (!rpcHealthResult?.canSendTransaction) {
          text += "\n- Transaction check.";
        }

        text += "\n\nPlease introduce a valid RPC url.";
      }

      return (
        <OperationFailed
          text={text}
          onCancel={onCancel}
          retryBtnText={"Ok"}
          textProps={{
            fontSize: 13,
            whiteSpace: "pre-line",
            textAlign: status === "invalid_url" ? "left" : "center",
            marginBottom: status === "invalid_url" ? "10px!important" : 0,
          }}
          retryBtnProps={{
            type: "button",
          }}
          onRetry={onClickOk}
        />
      );
    }

    return (
      <Stack
        flexGrow={1}
        component={"form"}
        onSubmit={handleSubmit(onSubmit)}
        boxSizing={"border-box"}
        justifyContent={"space-between"}
        paddingTop={2}
      >
        <Stack spacing={1.8}>
          <Controller
            name={"protocol"}
            control={control}
            rules={{ required: "Required" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                size={"small"}
                autoComplete={"off"}
                label={"Protocol"}
                select
                {...field}
                error={!!error}
                helperText={error?.message}
                sx={{
                  "& .MuiSelect-icon": {
                    top: 5,
                  },
                }}
              >
                {protocols.map(({ protocol, label }) => (
                  <MenuItem key={protocol} value={protocol}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name={"chainId"}
            control={control}
            rules={{ required: "Required" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                size={"small"}
                autoComplete={"off"}
                label={"Chain ID"}
                disabled={!selectedProtocol || !networksOfProtocol?.length}
                select
                {...field}
                error={!!error}
                helperText={error?.message}
                sx={{
                  "& .MuiSelect-icon": {
                    top: 5,
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
              <TextField
                size={"small"}
                autoComplete={"off"}
                label={"RPC url"}
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{
                  shrink: !!field.value,
                }}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name={"isPreferred"}
            render={({ field }) => (
              <FormControlLabel
                {...field}
                onChange={(_, checked) => {
                  field.onChange(checked);
                }}
                checked={field.value}
                control={<Checkbox />}
                label="Preferred"
                sx={{
                  marginTop: "15px!important",
                  "& .MuiButtonBase-root": {
                    padding: 0,
                    transform: "scale(0.85)",
                  },
                  "& svg": {
                    fontSize: 20,
                  },
                  "& .MuiTypography-root": {
                    userSelect: "none",
                    marginLeft: 0.7,
                    fontSize: 12,
                    lineHeight: "20px",
                  },
                }}
              />
            )}
          />
          <Typography
            fontSize={10}
            color={theme.customColors.dark50}
            marginTop={"5px!important"}
          >
            When Preferred is marked, this RPC will be used for all the RPC
            calls of this network (combination of protocol and chain ID).
          </Typography>
          <Typography
            fontSize={10}
            color={theme.customColors.dark50}
            marginTop={"5px!important"}
          >
            If the call to this RPC fail, then the default RPC will be used.
          </Typography>
        </Stack>
        <Stack direction={"row"} spacing={2} width={1}>
          <Button
            onClick={onCancel}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    status,
    theme,
    register,
    handleSubmit,
    onSubmit,
    onCancel,
    selectedProtocol,
    networksOfProtocol,
    onClickOk,
    rpcHealthResult,
    control,
  ]);

  return (
    <Stack flexGrow={1} boxSizing={"border-box"}>
      {content}
    </Stack>
  );
};

export default AddUpdateNetwork;
