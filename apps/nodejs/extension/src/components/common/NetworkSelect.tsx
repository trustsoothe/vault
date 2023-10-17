import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import React, { useCallback, useMemo } from "react";
import { SupportedProtocols } from "@poktscan/keyring";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";
import { useAppDispatch } from "../../hooks/redux";
import { changeSelectedNetwork } from "../../redux/slices/app";

interface NetworkSelectProps {
  selectedNetwork: RootState["app"]["selectedNetwork"];
  selectedChainByNetwork: RootState["app"]["selectedChainByNetwork"];
}

type Option = {
  network: SupportedProtocols;
  chainId: string;
};

const options: Option[] = [
  {
    network: SupportedProtocols.Pocket,
    chainId: "mainnet",
  },
  {
    network: SupportedProtocols.Pocket,
    chainId: "testnet",
  },
];

const NetworkSelect: React.FC<NetworkSelectProps> = ({
  selectedNetwork,
  selectedChainByNetwork,
}) => {
  const dispatch = useAppDispatch();
  const selectedOption: Option = useMemo(() => {
    return {
      network: selectedNetwork,
      chainId: selectedChainByNetwork[selectedNetwork],
    };
  }, [selectedNetwork, selectedChainByNetwork]);

  const handleChangeNetwork = useCallback(
    (_: React.SyntheticEvent, option: Option) => {
      dispatch(changeSelectedNetwork(option));
    },
    []
  );

  const getOptionLabel = useCallback((option: Option) => {
    const networkLabel = labelByProtocolMap[option.network] || option.network;
    const chainLabel = labelByChainID[option.chainId] || option.chainId;

    return `${networkLabel} - ${chainLabel}`;
  }, []);

  const isOptionEqualToValue = useCallback((option: Option, value: Option) => {
    return option.network === value.network && option.chainId === value.chainId;
  }, []);

  return (
    <Autocomplete
      fullWidth
      options={options}
      value={selectedOption}
      disableClearable={true}
      onChange={handleChangeNetwork}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => (
        <TextField
          fullWidth
          size={"small"}
          label={"network"}
          InputLabelProps={{
            shrink: false,
          }}
          {...params}
          sx={{
            "& input": {
              color: "white",
            },
          }}
        />
      )}
    />
  );
};

const mapStateToProps = (state: RootState) => ({
  networks: state.vault.entities.networks.list,
  selectedNetwork: state.app.selectedNetwork,
  selectedChainByNetwork: state.app.selectedChainByNetwork,
});

export default connect(mapStateToProps)(NetworkSelect);
