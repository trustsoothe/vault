import { styled } from "@mui/material";
import Divider, { DividerProps } from "@mui/material/Divider";
import { themeColors } from "../theme";

const MenuDivider = styled(Divider)<DividerProps>(() => ({
  borderColor: themeColors.borderLightGray,
  marginLeft: "-6px",
  marginRight: "-6px",
  marginTop: "6px!important",
  marginBottom: "6px!important",
}));

export default MenuDivider;
