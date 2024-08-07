import { styled } from "@mui/material";
import Stack, { StackProps } from "@mui/material/Stack";
import { themeColors } from "../theme";

const SmallGrayContainer = styled(Stack)<StackProps>(() => ({
  width: "100%",
  height: 56,
  padding: "11px 16px",
  flexDirection: "row",
  borderRadius: "8px",
  alignItems: "center",
  boxSizing: "border-box",
  backgroundColor: themeColors.bgLightGray,
  columnGap: "12px",
}));

export default SmallGrayContainer;
