import { styled } from "@mui/material";
import Stack, { StackProps } from "@mui/material/Stack";

const WordPhraseContainer = styled(Stack)<StackProps>(() => ({
  width: "100%",
  rowGap: "8px",
  columnGap: "8px",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
}));

export default WordPhraseContainer;
