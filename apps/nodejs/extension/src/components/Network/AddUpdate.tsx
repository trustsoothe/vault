import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import {
  type NetworkOptions,
  SupportedProtocols,
  SerializedNetwork,
} from "@poktscan/keyring";
import CircularLoading from "../common/CircularLoading";
import Button from "@mui/material/Button";
import { useAppDispatch } from "../../hooks/redux";
import { saveNetwork } from "../../redux/slices/vault";

const defaultFormValues: NetworkOptions = {
  name: "",
  chainId: "",
  rpcUrl: "",
  protocol: SupportedProtocols.POCKET_NETWORK,
};

const supportedChainIdsByProtocol: Record<SupportedProtocols, string[]> = {
  [SupportedProtocols.POCKET_NETWORK]: ["mainnet", "testnet"],
  [SupportedProtocols.UNKNOWN]: [],
};

const labelByProtocol: Record<SupportedProtocols, string> = {
  [SupportedProtocols.POCKET_NETWORK]: "Pocket Network",
  [SupportedProtocols.UNKNOWN]: "Unknown",
};

const protocols: { protocol: SupportedProtocols; label: string }[] =
  Object.values(SupportedProtocols).map((protocol) => ({
    protocol,
    label: labelByProtocol[protocol],
  }));

interface AddUpdateNetworkProps {
  onClose: () => void;
  networkToUpdate?: SerializedNetwork;
}

const AddUpdateNetwork: React.FC<AddUpdateNetworkProps> = ({
  onClose,
  networkToUpdate,
}) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<
    "normal" | "loading" | "saved" | "error"
  >("normal");
  const { register, handleSubmit, formState, control, reset, watch, setValue } =
    useForm<NetworkOptions>({
      defaultValues: { ...defaultFormValues },
    });

  const selectedProtocol = watch("protocol");

  useEffect(() => {
    reset({
      ...defaultFormValues,
      ...(networkToUpdate && {
        name: networkToUpdate.name,
        chainId: networkToUpdate.chainId,
        rpcUrl: networkToUpdate.rpcUrl,
        protocol: networkToUpdate.protocol,
      }),
    });
  }, [networkToUpdate]);

  useEffect(() => {
    setValue("chainId", "");
  }, [selectedProtocol]);

  const onSubmit = useCallback(
    (data: NetworkOptions) => {
      setStatus("loading");

      let id: string;

      if (networkToUpdate) {
        id = networkToUpdate.id;
      }

      dispatch(
        saveNetwork({
          id,
          options: data,
        })
      )
        .unwrap()
        .then(() => {
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    },
    [networkToUpdate]
  );

  const chainIDs: string[] = useMemo(() => {
    return supportedChainIdsByProtocol[selectedProtocol] || [];
  }, [selectedProtocol]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "saved") {
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          marginTop={"-40px"}
        >
          <Typography>Your network was saved successfully.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Network List
          </Button>
        </Stack>
      );
    }

    if (status === "error") {
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          marginTop={"-40px"}
          spacing={"10px"}
        >
          <Typography>There was an error saving the network.</Typography>
          <Stack direction={"row"} width={250} spacing={"15px"}>
            <Button
              variant={"outlined"}
              sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant={"contained"}
              sx={{ textTransform: "none", height: 30, fontWeight: 600 }}
              fullWidth
              type={"submit"}
            >
              Retry
            </Button>
          </Stack>
        </Stack>
      );
    }

    const { errors } = formState;

    return (
      <Stack
        flexGrow={1}
        component={"form"}
        onSubmit={handleSubmit(onSubmit)}
        boxSizing={"border-box"}
        paddingX={"20px"}
        justifyContent={"space-between"}
      >
        <Stack spacing={"20px"}>
          <Typography
            fontSize={18}
            textAlign={"center"}
            marginTop={"25px"}
            marginBottom={"10px"}
          >
            {networkToUpdate ? "Update" : "Add"} Network
          </Typography>

          <TextField
            autoFocus
            size={"small"}
            autoComplete={"off"}
            label={"Name"}
            {...register("name", { required: "Required" })}
            error={!!errors?.name}
            helperText={errors?.name?.message}
          />
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
                label={"ChainID"}
                disabled={!selectedProtocol || !chainIDs?.length}
                select
                {...field}
                error={!!error}
                helperText={error?.message}
              >
                {chainIDs.map((chainID) => (
                  <MenuItem key={chainID} value={chainID}>
                    {chainID}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            size={"small"}
            autoComplete={"off"}
            label={"RPC Url"}
            {...register("rpcUrl", { required: "Required" })}
            error={!!errors?.rpcUrl}
            helperText={errors?.rpcUrl?.message}
          />
        </Stack>

        <Stack direction={"row"} spacing={"20px"}>
          <Button
            variant={"outlined"}
            sx={{ textTransform: "none" }}
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ textTransform: "none", fontWeight: 600 }}
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
    register,
    handleSubmit,
    onSubmit,
    formState,
    onClose,
    networkToUpdate,
    selectedProtocol,
    chainIDs,
  ]);

  return (
    <Stack flexGrow={1} boxSizing={"border-box"}>
      {content}
    </Stack>
  );
};

export default AddUpdateNetwork;
