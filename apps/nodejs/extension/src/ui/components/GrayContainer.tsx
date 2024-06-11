import { styled } from "@mui/material";
import Stack, { StackProps } from "@mui/material/Stack";
import { themeColors } from "../theme";

const GrayContainer = styled(Stack)<StackProps>(() => ({
  width: "100%",
  height: 250,
  paddingTop: "40px",
  paddingBottom: "24px",
  alignItems: "center",
  boxSizing: `border-box`,
  boxShadow: "0 1px 0 0 #eff1f4",
  borderBottom: `1px solid ${themeColors.borderLightGray}`,
}));

export default GrayContainer;
