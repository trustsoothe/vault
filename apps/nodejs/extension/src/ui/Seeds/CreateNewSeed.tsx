import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { SEEDS_PAGE } from "../../constants/routes";
import { Controller, FormProvider, useForm } from "react-hook-form";
import SuccessIcon from "../assets/img/success_icon.svg";
import DialogButtons from "../components/DialogButtons";
import WordPhraseContainer from "./WordPhraseContainer";
import { generateRecoveryPhrase } from "../../utils";
import NameAndWordsInput from "./NameAndWordsInput";
import PassphraseInput from "./PassphraseInput";
import FillSeedPhrase from "./FillSeedPhrase";
import { themeColors } from "../theme";
import SeedAdded from "./SeedAdded";
import Info from "./Info";

type Status =
  | "form"
  | "error"
  | "loading"
  | "success"
  | "seed_exists"
  | "confirmation";

interface NewSeedFormValues {
  name: string;
  phrase: string;
  wordList: Array<{ word: string }>;
  phraseSize: "12" | "15" | "18" | "21" | "24";
  passphrase: string;
  requiredWords: Array<number>;
  understandPhraseWarning: boolean;
}

export default function CreateNewSeed() {
  const navigate = useNavigate();
  const [showSeedWasCopied, setShowSeedWasCopied] = useState(false);
  const [status, setStatus] = useState<Status>("form");

  const methods = useForm<NewSeedFormValues>({
    defaultValues: {
      name: "",
      phrase: "",
      passphrase: "",
      phraseSize: "12",
      wordList: [],
      requiredWords: [],
      understandPhraseWarning: false,
    },
  });
  const { watch, control, handleSubmit, setValue } = methods;
  const [name, phraseSize, phrase, acceptPhraseWarning, wordList] = watch([
    "name",
    "phraseSize",
    "phrase",
    "understandPhraseWarning",
    "wordList",
  ]);

  useEffect(() => {
    const phraseSizeNum = Number(phraseSize);
    const newPhrase = generateRecoveryPhrase(phraseSizeNum);

    setValue("phrase", newPhrase);

    const amountOfRequiredWords = Math.ceil(phraseSizeNum * 0.3);

    const requiredWords = new Array(amountOfRequiredWords).fill(null);

    for (let i = 0; i < requiredWords.length; i++) {
      let indexRequired =
        Math.floor(Math.random() * (phraseSizeNum - 1) + 1) - 1;

      while (requiredWords.includes(indexRequired)) {
        indexRequired = Math.floor(Math.random() * (phraseSizeNum - 1) + 1) - 1;
      }

      requiredWords[i] = indexRequired;
    }

    const wordsToComplete = newPhrase
      .split(" ")
      .map((word, i) => ({ word: requiredWords.includes(i) ? "" : word }));

    setValue("wordList", wordsToComplete);
    setValue("requiredWords", requiredWords);
  }, [phraseSize]);

  const copySeed = () => {
    navigator.clipboard.writeText(phrase).then(() => {
      setShowSeedWasCopied(true);
      setTimeout(() => setShowSeedWasCopied(false), 2000);
    });
  };

  const onSubmit = (data: NewSeedFormValues) => {
    if (status === "form") {
      return setStatus("confirmation");
    }

    setStatus("success");
  };

  let content: React.ReactNode;

  switch (status) {
    case "form": {
      const wordList = phrase.split(" ");

      content = (
        <>
          <Stack
            flexGrow={1}
            flexBasis={"1px"}
            minHeight={0}
            overflow={"auto"}
            padding={2.4}
          >
            <Info
              text={
                "Write down your Seed Phrase. You’ll be able to use this seed to create/import accounts for multiple networks."
              }
            />
            <NameAndWordsInput />
            <Stack
              padding={1.4}
              spacing={1.4}
              marginTop={1.6}
              borderRadius={"8px"}
              bgcolor={themeColors.bgLightGray}
            >
              <WordPhraseContainer
                gridTemplateRows={`repeat(${Math.ceil(
                  Number(wordList.length) / 4
                )}, 28px)`}
              >
                {wordList.map((word) => (
                  <Typography
                    key={word}
                    sx={{ userSelect: "none" }}
                    paddingY={0.7}
                    paddingX={1}
                    lineHeight={"14px"}
                    borderRadius={"6px"}
                    border={`1px dashed ${themeColors.light_gray}`}
                    variant={"body2"}
                  >
                    {word}
                  </Typography>
                ))}
              </WordPhraseContainer>
              <Button
                sx={{
                  width: 1,
                  backgroundColor: themeColors.white,
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
                }}
                onClick={!showSeedWasCopied ? copySeed : undefined}
              >
                {!showSeedWasCopied ? (
                  "Copy Seed"
                ) : (
                  <>
                    <SuccessIcon style={{ marginRight: "7px" }} />
                    Seed Copied
                  </>
                )}
              </Button>
            </Stack>
            <PassphraseInput />
          </Stack>
          <DialogButtons
            containerProps={{
              sx: {
                height: 85,
              },
            }}
            secondaryButtonProps={{
              children: "Cancel",
              onClick: () => navigate(SEEDS_PAGE),
            }}
            primaryButtonProps={{
              children: "Next",
              disabled: !name,
              type: "submit",
            }}
          />
        </>
      );
      break;
    }
    case "error":
      content = "Error...";
      break;
    case "loading":
      content = "Loading...";
      break;
    case "success":
      content = <SeedAdded type={"created"} />;
      break;
    case "seed_exists":
      content = "Seed exists...";
      break;
    case "confirmation":
      content = (
        <>
          <Stack
            flexGrow={1}
            flexBasis={"1px"}
            minHeight={0}
            overflow={"auto"}
            padding={2.4}
          >
            <Info
              text={
                "Complete your Seed Phrase. To validate that you have saved your seed, please enter the missing words."
              }
            />
            <FillSeedPhrase canPaste={false} />
            <Typography
              marginTop={2}
              variant={"body2"}
              color={themeColors.textSecondary}
            >
              Your Seed Phrase needs to be stored safely (ideally offline). Do
              you understand Soothe cannot help you recover this Seed Phrase in
              case of loss?
            </Typography>
            <Stack
              width={1}
              height={16}
              marginTop={2.4}
              direction={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Typography variant={"subtitle2"} lineHeight={"16px"}>
                Yes, I Understand
              </Typography>
              <Controller
                control={control}
                name={"understandPhraseWarning"}
                render={({ field }) => (
                  <Switch size={"small"} {...field} checked={field.value} />
                )}
              />
            </Stack>
          </Stack>
          <DialogButtons
            containerProps={{
              sx: {
                height: 85,
              },
            }}
            secondaryButtonProps={{
              children: "Back",
              onClick: () => setStatus("form"),
            }}
            primaryButtonProps={{
              children: "Create",
              disabled:
                !acceptPhraseWarning || wordList.some(({ word }) => !word),
              type: "submit",
            }}
          />
        </>
      );
      break;
  }

  return (
    <Stack
      flexGrow={1}
      component={"form"}
      bgcolor={themeColors.white}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormProvider {...methods}>{content}</FormProvider>
    </Stack>
  );
}
