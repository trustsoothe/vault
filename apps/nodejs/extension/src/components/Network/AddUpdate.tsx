import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useForm, Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import { enqueueSnackbar } from "notistack";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import {
  type NetworkOptions,
  SupportedProtocols,
  SerializedNetwork,
} from "@poktscan/keyring";
import { useAppDispatch } from "../../hooks/redux";
import { NETWORKS_PAGE } from "../../constants/routes";
import CircularLoading from "../common/CircularLoading";
import { saveNetwork } from "../../redux/slices/vault";
import {
  chainIDsByProtocol,
  labelByChainID,
  labelByProtocolMap,
} from "../../constants/protocols";
import OperationFailed from "../common/OperationFailed";
import { isNetworkUrlHealthy } from "../../utils/networkOperations";

interface FormValues {
  name: string;
  rpcUrl: string;
  protocol: {
    name: SupportedProtocols;
    chainID: ChainID<SupportedProtocols> | "";
  };
  isPreferred: boolean;
}

const defaultFormValues: FormValues = {
  name: "",
  rpcUrl: "",
  protocol: {
    name: SupportedProtocols.Pocket,
    chainID: "mainnet",
  },
  isPreferred: false,
};

const protocols: { protocol: SupportedProtocols; label: string }[] =
  Object.values(SupportedProtocols).map((protocol) => ({
    protocol,
    label: labelByProtocolMap[protocol],
  }));

interface AddUpdateNetworkProps {
  networks: SerializedNetwork[];
}

const AddUpdateNetwork: React.FC<AddUpdateNetworkProps> = ({ networks }) => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [networkToUpdate, setNetworkToUpdate] =
    useState<SerializedNetwork>(null);
  const [status, setStatus] = useState<
    "normal" | "loading" | "error" | "invalid_url"
  >("normal");
  const {
    register,
    handleSubmit,
    formState,
    control,
    reset,
    watch,
    setValue,
    setFocus,
  } = useForm<FormValues>({
    defaultValues: { ...defaultFormValues },
  });

  const selectedProtocol = watch("protocol.name");

  useEffect(() => {
    setValue("protocol.chainID", "");
  }, [selectedProtocol]);

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(NETWORKS_PAGE);
    }
  }, [navigate, location]);

  useEffect(() => {
    const id = searchParams.get("id");
    const networkFromStore = networks.find(
      (item) => item.id === id && !item.isDefault
    );
    if (networkFromStore && networkToUpdate?.id !== id) {
      setNetworkToUpdate(networkFromStore);
      return;
    }

    if (!networkFromStore) {
      setNetworkToUpdate(null);
    }
  }, [searchParams, networks]);

  useEffect(() => {
    if (networkToUpdate) {
      reset({
        name: networkToUpdate.name,
        rpcUrl: networkToUpdate.rpcUrl,
        protocol: networkToUpdate.protocol,
        isPreferred: networkToUpdate.isPreferred || false,
      });
    }
  }, [networkToUpdate]);

  const onSubmit = useCallback(
    async (data: NetworkOptions) => {
      setStatus("loading");

      if (
        !networkToUpdate ||
        (networkToUpdate && networkToUpdate.rpcUrl !== data.rpcUrl)
      ) {
        const isHealthy = await isNetworkUrlHealthy(data);

        if (!isHealthy) {
          setStatus("invalid_url");
          return;
        }
      }

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
          enqueueSnackbar({
            style: { width: 250, minWidth: "250px!important" },
            message: `Network ${
              networkToUpdate ? "updated" : "added"
            } successfully.`,
            variant: "success",
            autoHideDuration: 2500,
          });
          navigate(NETWORKS_PAGE);
        })
        .catch(() => setStatus("error"));
    },
    [networkToUpdate, navigate]
  );

  const onClickOk = useCallback(() => {
    setStatus("normal");
    setTimeout(() => setFocus("rpcUrl", { shouldSelect: true }), 25);
  }, [setFocus]);

  const chainIDs: string[] = useMemo(() => {
    return chainIDsByProtocol[selectedProtocol] || [];
  }, [selectedProtocol]);

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

    if (status === "invalid_url") {
      return (
        <OperationFailed
          text={
            "The provided RPC Url is not valid. Please introduce a valid one."
          }
          onCancel={onCancel}
          retryBtnText={"Ok"}
          retryBtnProps={{
            type: "button",
          }}
          onRetry={onClickOk}
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
        justifyContent={"space-between"}
        paddingTop={2}
      >
        <Stack spacing={"20px"}>
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
                    {labelByChainID[chainID] || chainID}
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
                  },
                  "& svg": {
                    fontSize: 20,
                  },
                  "& .MuiTypography-root": {
                    userSelect: "none",
                    marginLeft: 0.7,
                    fontSize: 14,
                    lineHeight: "20px",
                  },
                }}
              />
            )}
          />
        </Stack>

        <Stack direction={"row"} spacing={"20px"}>
          <Button
            variant={"outlined"}
            sx={{ height: 30 }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ height: 30, fontWeight: 600 }}
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
    onCancel,
    selectedProtocol,
    chainIDs,
    onClickOk,
  ]);

  return (
    <Stack flexGrow={1} boxSizing={"border-box"}>
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  networks: state.vault.entities.networks.list,
});

export default connect(mapStateToProps)(AddUpdateNetwork);
