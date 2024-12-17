import type {TextFieldProps} from "@mui/material";
import React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import {SupportedProtocols} from "@poktscan/vault";
import {networksSelector} from "../../redux/selectors/network";
import SelectedIcon from "../assets/img/check_icon.svg";
import {useAppSelector} from "../hooks/redux";
import {themeColors} from "../theme";
import {labelByProtocolMap} from "../../constants/protocols";

export interface ProtocolSelectorValue {
  id: string;
  protocol: SupportedProtocols;
  chainId: string;
  iconUrl: string;
  label: string;
  addressPrefix?: string;
}

const ProtocolSelector: React.ForwardRefRenderFunction<
  HTMLInputElement,
  Partial<TextFieldProps>
> = (props, ref) => {
  const networks = useAppSelector(networksSelector);
  const valueOptions: ProtocolSelectorValue[] = networks.filter((n) => {
    return (n.protocol !== SupportedProtocols.Cosmos && n.isProtocolDefault)
      || n.protocol === SupportedProtocols.Cosmos;
  }).map((n) => ({
    id: n.id,
    protocol: n.protocol,
    chainId: n.chainId,
    addressPrefix: n.addressPrefix,
    iconUrl: n.iconUrl,
    label: n.protocol === SupportedProtocols.Cosmos ? n.label : labelByProtocolMap[n.protocol],
  })).sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
  });

  return (
    <TextField
      select
      placeholder={"Protocol"}
      {...props}
      ref={ref}
      sx={{
        "& .MuiSelect-select": {
          display: "flex",
          columnGap: 0.8,
          marginLeft: -0.3,
          "& img": {
            marginTop: 0.2,
          },
          "& svg": { display: "none" },
        },
        "& .MuiSelect-icon": { top: 4 },
        ...props.sx,
      }}
    >
      {valueOptions.map(({id, protocol, iconUrl, label}) => {
        const isSelected = props.value === id;

        return (
          <MenuItem
            key={id}
            value={id}
            sx={{
              display: "flex",
              alignItems: "center",
              columnGap: 0.8,
              "& img": {
                marginTop: 0.2,
              },
              "& svg": {
                position: "absolute",
                right: 15,
              },
              paddingRight: 3,
              position: "relative",
              color: themeColors.black,
              backgroundColor: isSelected
                ? `${themeColors.bgLightGray}!important`
                : themeColors.white,
            }}
          >
            <img
              src={iconUrl}
              alt={`${protocol}-icon`}
              width={15}
              height={15}
            />
            {label}
            {isSelected && <SelectedIcon />}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default React.forwardRef(ProtocolSelector);
