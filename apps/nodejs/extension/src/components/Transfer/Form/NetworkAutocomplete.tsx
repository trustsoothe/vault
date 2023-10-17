import type {
  AutocompleteRenderOptionState,
  FilterOptionsState,
} from "@mui/material";
import type { RootState } from "../../../redux/store";
import type { FormValues } from "../index";
import { useTheme } from "@mui/material";
import { connect } from "react-redux";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useCallback, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useFormContext } from "react-hook-form";
import { protocolsAreEquals } from "../../../utils/networkOperations";

type TNetwork = RootState["vault"]["entities"]["networks"]["list"];

interface NetworkAutocompleteProps {
  networks: TNetwork;
}

const NetworkAutocomplete: React.FC<NetworkAutocompleteProps> = ({
  networks,
}) => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();

  const [asset, fromType] = watch(["asset", "fromType"]);

  const allowedNetworks: TNetwork = useMemo(() => {
    if (!asset) {
      return [];
    }

    return orderBy(
      networks
        .filter((item) => protocolsAreEquals(item.protocol, asset.protocol))
        .map((item) => ({
          ...item,
          rank: item.isPreferred ? 1 : item.isDefault ? 2 : 3,
        })),
      ["rank"],
      ["asc"]
    );
  }, [networks, asset]);

  const filterOptions = useCallback(
    (options: TNetwork, state: FilterOptionsState<TNetwork[0]>) => {
      const value = state.inputValue.toLowerCase().trim();

      if (!value) return options.slice(0, 25);

      return options
        .filter((item) => {
          if (item.name.toLowerCase().includes(value)) {
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
      option: TNetwork[0],
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
              : option.isPreferred
              ? "(Preferred)"
              : ""}
          </Typography>
        </Stack>
      );
    },
    [theme]
  );

  const getOptionLabel = useCallback((option: TNetwork[0]) => {
    return option ? option.rpcUrl : "";
  }, []);

  const isOptionEqualToValue = useCallback(
    (option: TNetwork[0], value: TNetwork[0]) => {
      return option.id === value.id;
    },
    []
  );

  const disabled = !asset || allowedNetworks?.length === 1;

  return (
    <Controller
      name={"network"}
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
          onChange={(_, newValue) => onChange(newValue)}
          isOptionEqualToValue={isOptionEqualToValue}
          value={value || null}
          clearIcon={null}
          {...otherProps}
          sx={{
            width: 1,
            order: fromType === "private_key" ? 2 : 3,
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

const mapStateToNetworkProps = (state: RootState) => {
  return {
    networks: state.vault.entities.networks.list,
  };
};

export default connect(mapStateToNetworkProps)(NetworkAutocomplete);
