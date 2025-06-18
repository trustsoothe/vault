import React from "react";
import type { TextFieldProps } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { SupportedProtocols } from "@soothe/vault";
import {
    selectableNetworksSelector
} from "../../redux/selectors/network";
import SelectedIcon from "../assets/img/check_icon.svg";
import { useAppSelector } from "../hooks/redux";
import { themeColors } from "../theme";
import { labelByProtocolMap } from "../../constants/protocols";
import {Network} from "../../redux/slices/app";

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
  const selectableNetworks: Network[]  = useAppSelector(selectableNetworksSelector);

  const valueOptions: ProtocolSelectorValue[] = selectableNetworks.filter((n) => n.isProtocolDefault).map((n) => ({
      ...n,
      label: labelByProtocolMap[n.protocol],
  })).sort((a, b) => a.label.localeCompare(b.label));

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
      {valueOptions.map(({ id, protocol, iconUrl, label }) => {
        const isSelected = props.value === protocol;

        return (
          <MenuItem
            key={protocol}
            value={protocol}
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
