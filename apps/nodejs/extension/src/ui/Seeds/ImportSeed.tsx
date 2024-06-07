import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DialogButtons from "../components/DialogButtons";
import NameAndWordsInput from "./NameAndWordsInput";
import { SEEDS_PAGE } from "../../constants/routes";
import PassphraseInput from "./PassphraseInput";
import FillSeedPhrase from "./FillSeedPhrase";
import { themeColors } from "../theme";
import SeedAdded from "./SeedAdded";
import Info from "./Info";

type Status = "form" | "error" | "loading" | "success" | "seed_exists";

interface ImportSeedFormValues {
  name: string;
  wordList: Array<{ word: string }>;
  phraseSize: "12" | "15" | "18" | "21" | "24";
  passphrase: string;
}

export default function ImportSeed() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("form");

  const methods = useForm<ImportSeedFormValues>({
    defaultValues: {
      name: "",
      passphrase: "",
      phraseSize: "12",
      wordList: new Array(12).fill(null).map(() => ({ word: "" })),
    },
  });
  const { watch, setValue, clearErrors, handleSubmit } = methods;
  const [phraseSize, name, wordList] = watch([
    "phraseSize",
    "name",
    "wordList",
  ]);

  const canSubmitForm = !!name && wordList.every(({ word }) => !!word);

  useEffect(() => {
    setValue(
      "wordList",
      new Array(Number(phraseSize)).fill(null).map(() => ({ word: "" }))
    );
    clearErrors("wordList");
  }, [phraseSize]);

  const onSubmit = (data: ImportSeedFormValues) => {
    console.log(data);
    setStatus("success");
  };

  let content: React.ReactNode;

  switch (status) {
    case "form":
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
                "Provide your Seed Phrase. You’ll be able to use this seed to create/import accounts for multiple networks."
              }
            />
            <NameAndWordsInput />
            <FillSeedPhrase canPaste={true} />
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
              children: "Import",
              disabled: !canSubmitForm,
              type: "submit",
            }}
          />
        </>
      );
      break;
    case "error":
      content = "Error...";
      break;
    case "loading":
      content = "Loading...";
      break;
    case "success":
      content = <SeedAdded type={"imported"} />;
      break;
    case "seed_exists":
      content = "Seed exists...";
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
