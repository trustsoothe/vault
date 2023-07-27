import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
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
import {
  chainIDsByProtocol,
  labelByProtocolMap,
} from "../../constants/protocols";
import OperationFailed from "../common/OperationFailed";

interface FormValues {
  name: string;
  rpcUrl: string;
  protocol: {
    name: SupportedProtocols;
    chainID: ChainID<SupportedProtocols> | "";
  };
}

const defaultFormValues: FormValues = {
  name: "",
  rpcUrl: "",
  protocol: {
    name: SupportedProtocols.Pocket,
    chainID: "mainnet",
  },
};

const protocols: { protocol: SupportedProtocols; label: string }[] =
  Object.values(SupportedProtocols).map((protocol) => ({
    protocol,
    label: labelByProtocolMap[protocol],
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
    useForm<FormValues>({
      defaultValues: { ...defaultFormValues },
    });

  const selectedProtocol = watch("protocol.name");

  useEffect(() => {
    setValue("protocol.chainID", "");
  }, [selectedProtocol]);

  useEffect(() => {
    reset({
      ...defaultFormValues,
      ...(networkToUpdate && {
        name: networkToUpdate.name,
        rpcUrl: networkToUpdate.rpcUrl,
        protocol: networkToUpdate.protocol,
      }),
    });
  }, [networkToUpdate]);

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
    return chainIDsByProtocol[selectedProtocol] || [];
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
        <OperationFailed
          text={"There was an error saving the network."}
          onCancel={onClose}
        />
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
            name={"protocol.name"}
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
            name={"protocol.chainID"}
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
