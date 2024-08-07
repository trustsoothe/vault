import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import WordPhraseContainer from "./WordPhraseContainer";
import { recoveryPhraseIsValid } from "../../utils";
import { themeColors } from "../theme";

interface FillSeedPhraseProps {
  canPaste?: boolean;
  disabled?: boolean;
}

export default function FillSeedPhrase({
  canPaste,
  disabled,
}: FillSeedPhraseProps) {
  const { control, watch, setValue } = useFormContext<{
    wordList: Array<{ word: string }>;
    phraseSize: string;
    phrase?: string;
    requiredWords?: Array<number>;
  }>();

  const [wordList, phraseSize, requiredWords] = watch([
    "wordList",
    "phraseSize",
    "requiredWords",
  ]);

  const pastePhrase = (phrase: string, index?: number) => {
    const words = phrase.split(" ");

    if ([12, 15, 18, 21, 24].includes(words.length)) {
      setValue("phraseSize", words.length.toString() as "12");

      // setTimeout is required here to update the state after the phraseSize has been updated
      setTimeout(() => {
        for (let i = 0; i < words.length; i++) {
          setValue(`wordList.${i}.word`, words[i]);
        }
      }, 0);
    } else if (typeof index === "number") {
      if (words.length > 1) {
        const phraseSizeNum = Number(phraseSize);

        for (let i = index; i < phraseSizeNum; i++) {
          const wordsIndex = i - index;
          const word = words[wordsIndex];

          if (word) setValue(`wordList.${i}.word`, word);
        }
      }
    }
  };

  return (
    <Stack
      padding={1.4}
      spacing={1.4}
      marginTop={1.6}
      borderRadius={"8px"}
      bgcolor={themeColors.bgLightGray}
    >
      <Controller
        control={control}
        name={"wordList"}
        rules={{
          validate: (value, formValues) => {
            if (!value.every((value) => !!value.word)) return true;

            const isValid = recoveryPhraseIsValid(
              value.map(({ word }) => word).join(" ")
            );

            if (!isValid) {
              return "Invalid recovery phrase";
            }

            if (formValues.phrase) {
              return (
                value.map(({ word }) => word).join(" ") === formValues.phrase ||
                "Some of the words are wrong, please verify"
              );
            }

            return true;
          },
        }}
        render={({ field: { value: fields }, fieldState: { error } }) => (
          <>
            <WordPhraseContainer
              gridTemplateRows={`repeat(${Math.ceil(
                Number(wordList.length) / 4
              )}, 28px)`}
            >
              {fields.map((_, i) => (
                <Controller
                  key={i}
                  control={control}
                  rules={{
                    required: "Required",
                  }}
                  name={`wordList.${i}.word`}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      required
                      {...field}
                      error={!!error}
                      disabled={disabled}
                      InputProps={{
                        readOnly: requiredWords && !requiredWords.includes(i),
                      }}
                      inputProps={{
                        tabIndex:
                          requiredWords && !requiredWords.includes(i)
                            ? -1
                            : undefined,
                      }}
                      onPaste={(event) => {
                        if (canPaste) {
                          event.preventDefault();
                          pastePhrase(event.clipboardData.getData("Text"), i);
                        }
                      }}
                      placeholder={`Word ${i + 1}`}
                      autoComplete={"off"}
                      sx={{
                        height: 28,
                        borderRadius: "6px",
                        "& .MuiInputBase-root": {
                          height: 28,
                          paddingRight: "10px!important",
                        },
                        "& input": {
                          paddingLeft: "10px!important",
                          paddingRight: "0px!important",
                          fontSize: 11,
                        },
                      }}
                    />
                  )}
                />
              ))}
              {error && (
                <Typography
                  color={"error"}
                  variant={"body2"}
                  sx={{ gridColumn: "auto / 4 span", marginLeft: 0.5 }}
                >
                  {error.message}
                </Typography>
              )}
            </WordPhraseContainer>
          </>
        )}
      />
      {canPaste && (
        <Button
          fullWidth
          disabled={disabled}
          sx={{
            height: 38,
            borderRadius: "8px",
            backgroundColor: themeColors.white,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
          }}
          onClick={() => {
            navigator.clipboard.readText().then((text) => pastePhrase(text, 0));
          }}
        >
          Paste Seed
        </Button>
      )}
    </Stack>
  );
}
