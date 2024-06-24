import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
import { closeSnackbar, SnackbarKey } from "notistack";
import { FormProvider, useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../controllers/communication/AppToBackground";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import NameAndWordsInput from "./NameAndWordsInput";
import { SEEDS_PAGE } from "../../constants/routes";
import PassphraseInput from "./PassphraseInput";
import FillSeedPhrase from "./FillSeedPhrase";
import { themeColors } from "../theme";
import SeedAdded from "./SeedAdded";
import Info from "./Info";

type Status = "form" | "loading" | "success" | "seed_exists";

interface ImportSeedFormValues {
  name: string;
  wordList: Array<{ word: string }>;
  phraseSize: "12" | "15" | "18" | "21" | "24";
  passphrase: string;
}

export default function ImportSeed() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("form");
  const [seedId, setSeedId] = useState<string>(null);

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

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    return closeSnackbars;
  }, []);

  useEffect(() => {
    setValue(
      "wordList",
      new Array(Number(phraseSize)).fill(null).map(() => ({ word: "" }))
    );
    clearErrors("wordList");
  }, [phraseSize]);

  const onSubmit = (data: ImportSeedFormValues) => {
    setStatus("loading");

    AppToBackground.importHdWallet({
      recoveryPhrase: data.wordList.map(({ word }) => word).join(" "),
      recoveryPhraseName: data.name,
      imported: true,
      passphrase: data.passphrase,
    }).then((res) => {
      if (res.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          onRetry: () => onSubmit(data),
          message: {
            title: "Phrase import failed ",
            content: "There was an error while importing your phrase.",
          },
        });
        setStatus("form");
      } else {
        closeSnackbars();
        if (res.data.phraseAlreadyExists) {
          setSeedId(res.data.phraseId);
          setStatus("seed_exists");
        } else {
          setSeedId(res.data.phrase.id);
          setStatus("success");
        }
      }
    });
  };

  const isLoading = status === "loading";
  let content: React.ReactNode;

  switch (status) {
    case "loading":
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
            <NameAndWordsInput disabled={isLoading} />
            <FillSeedPhrase canPaste={true} disabled={isLoading} />
            <PassphraseInput disabled={isLoading} />
          </Stack>
          <DialogButtons
            containerProps={{
              sx: {
                height: 85,
              },
            }}
            secondaryButtonProps={{
              children: "Cancel",
              disabled: isLoading,
              onClick: () => navigate(SEEDS_PAGE),
            }}
            primaryButtonProps={{
              isLoading,
              children: "Import",
              disabled: !canSubmitForm,
              type: "submit",
            }}
          />
        </>
      );
      break;
    case "success":
      content = <SeedAdded type={"imported"} id={seedId} />;
      break;
    case "seed_exists":
      content = <SeedAdded type={"already_exists"} id={seedId} />;
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
