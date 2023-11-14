import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
} from "@mui/material";
import type { FormValues } from "../index";
import type { Network } from "../../../redux/slices/app";
import { useTheme } from "@mui/material";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useCallback, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useFormContext } from "react-hook-form";
import { useAppSelector } from "../../../hooks/redux";

const NetworkAutocomplete: React.FC = () => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();

  const [protocol, chainId, rpcUrl] = watch(["protocol", "chainId", "rpcUrl"]);
  const networks = useAppSelector((state) => state.app.networks);
  const allowedNetworks: Network[] = useMemo(() => {
    return orderBy(
      networks
        .filter(
          (item) => item.protocol === protocol && item.chainId === chainId
        )
        .map((item) => ({
          ...item,
          // todo: add rpcs and consider is preferred
          rank: /*item.isPreferred ? 1 :*/ item.isDefault ? 2 : 3,
        })),
      ["rank"],
      ["asc"]
    );
  }, [networks, protocol, chainId]);
  const selectedNetwork = useMemo(() => {
    return allowedNetworks.find(
      (item) =>
        item.rpcUrl === rpcUrl &&
        item.chainId === chainId &&
        item.protocol === protocol
    );
  }, [allowedNetworks]);

  const filterOptions = useCallback(
    (options: Network[], state: FilterOptionsState<Network>) => {
      const value = state.inputValue.toLowerCase().trim();

      if (!value) return options.slice(0, 25);

      return options
        .filter((item) => {
          if (item.label.toLowerCase().includes(value)) {
            return true;
          }
        })
        .slice(0, 25);
    },
    []
  );

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<unknown>,
      option: Network,
      state: AutocompleteRenderOptionState
    ) => {
      return (
        <Stack
          {...props}
          sx={{
            paddingY: "5px!important",
            paddingX: "10px!important",
            borderTop:
              state.index !== 0
                ? `1px solid ${theme.customColors.dark15}`
                : undefined,
            py: "5px",
            alignItems: "flex-start!important",
            "& p": {
              fontSize: "12px!important",
            },
          }}
          direction={"row"}
          spacing={"5px"}
        >
          <Typography fontWeight={500}>{option.rpcUrl}</Typography>
          <Typography color={theme.customColors.dark90}>
            {option.isDefault
              ? "(Default)"
              : // todo: when rpcs are enabled
                // : option.isPreferred
                // ? "(Preferred)"
                ""}
          </Typography>
        </Stack>
      );
    },
    [theme]
  );

  const getOptionLabel = useCallback((option: Network) => {
    return option ? option.rpcUrl : "";
  }, []);

  const isOptionEqualToValue = useCallback(
    (option: Network, value: Network) => {
      return option.id === value.id;
    },
    []
  );

  const disabled = allowedNetworks?.length === 1;

  return (
    <Controller
      name={"rpcUrl"}
      control={control}
      rules={{ required: "Required" }}
      render={({
        field: { onChange, value, ref, ...otherProps },
        fieldState: { error },
      }) => (
        <Autocomplete
          options={allowedNetworks}
          filterOptions={filterOptions}
          renderOption={renderOption}
          getOptionLabel={getOptionLabel}
          onChange={(_, newValue) => onChange(newValue.rpcUrl)}
          isOptionEqualToValue={isOptionEqualToValue}
          value={
            allowedNetworks.find(
              (item) => item.protocol === protocol && selectedNetwork
            ) || null
          }
          clearIcon={null}
          {...otherProps}
          sx={{
            width: 1,
            order: 2,
            marginTop: 2,
          }}
          openOnFocus
          ListboxProps={{
            sx: {
              maxHeight: 225,
            },
          }}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={ref}
              label={"RPC Endpoint"}
              fullWidth
              size={"small"}
              disabled={disabled}
              error={!!error}
              helperText={error?.message}
              sx={{
                "& label:not(.MuiInputLabel-shrink)": {
                  fontSize: 12,
                  top: 3,
                },
                "& input": {
                  fontSize: "12px!important",
                  color: theme.customColors.dark90,
                },
              }}
            />
          )}
        />
      )}
    />
  );
};

export default NetworkAutocomplete;
