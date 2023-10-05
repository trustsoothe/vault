import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import {
  Network,
  SerializedAsset,
  SerializedNetwork,
  SupportedProtocols,
} from "@poktscan/keyring";
import CircularLoading from "../common/CircularLoading";
import Button from "@mui/material/Button";
import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { saveAsset } from "../../redux/slices/vault";

interface FormValues {
  name: string;
  protocol: SupportedProtocols;
  chainId: ChainID<SupportedProtocols>;
  symbol: string;
}

const defaultFormValues: FormValues = {
  name: "",
  symbol: "",
  protocol: SupportedProtocols.Pocket,
  chainId: "mainnet",
};

interface AddUpdateAssetProps {
  onClose: () => void;
  assetToUpdate?: SerializedAsset;
  customNetworks: SerializedNetwork[];
  loadingNetworks: boolean;
}

const AddUpdateAsset: React.FC<AddUpdateAssetProps> = ({
  onClose,
  assetToUpdate,
  customNetworks,
  loadingNetworks,
}) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<
    "normal" | "loading" | "saved" | "error"
  >("normal");
  const { register, handleSubmit, formState, control, reset } =
    useForm<FormValues>({
      defaultValues: { ...defaultFormValues },
    });

  useEffect(() => {
    reset({
      ...defaultFormValues,
      ...(assetToUpdate && {
        name: assetToUpdate.name,
        symbol: assetToUpdate.symbol,
        protocol: assetToUpdate.protocol.name,
        chainID: assetToUpdate.protocol.chainID,
      }),
    });
  }, [assetToUpdate]);

  const allNetworks: Network[] = useMemo(() => {
    return [...customNetworks.map((item) => Network.deserialize(item))];
  }, [customNetworks]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      setStatus("loading");

      let id: string;

      if (assetToUpdate) {
        id = assetToUpdate.id;
      }

      const options = {
        name: data.name,
        symbol: data.symbol,
        protocol: {
          name: data.protocol,
          chainID: data.chainId,
        },
      };

      // @ts-ignore
      dispatch(saveAsset({ options, id }))
        .unwrap()
        .then(() => {
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    },
    [assetToUpdate, allNetworks, dispatch]
  );

  const content = useMemo(() => {
    if (status === "loading" || loadingNetworks) {
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
          <Typography>Your asset was saved successfully.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Asset List
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
          <Typography>There was an error saving the asset.</Typography>
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
            {assetToUpdate ? "Update" : "Add"} Asset
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
                label={"Network"}
                select
                {...field}
                error={!!error}
                helperText={error?.message}
              >
                {Object.values(SupportedProtocols).map((protocol) => (
                  <MenuItem key={protocol} value={protocol}>
                    {protocol}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            size={"small"}
            autoComplete={"off"}
            label={"Symbol"}
            {...register("symbol", { required: "Required" })}
            error={!!errors?.symbol}
            helperText={errors?.symbol?.message}
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
    assetToUpdate,
    loadingNetworks,
  ]);

  return (
    <Stack flexGrow={1} boxSizing={"border-box"}>
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    customNetworks: state.vault.entities.networks.list,
    loadingNetworks: state.vault.entities.networks.loading,
  };
};

export default connect(mapStateToProps)(AddUpdateAsset);
