import type { SerializedRecoveryPhraseReference } from "@soothe/vault";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { accountsImportedSelector } from "../../redux/selectors/account";
import AvatarByString from "../components/AvatarByString";
import DialogButtons from "../components/DialogButtons";
import PasswordInput from "../components/PasswordInput";
import { useAppSelector } from "../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import PassphraseInput from "./PassphraseInput";
import FillSeedPhrase from "./FillSeedPhrase";
import Summary from "../components/Summary";
import { themeColors } from "../theme";
import {
  enqueueErrorSnackbar,
  enqueueSnackbar,
  wrongPasswordSnackbar,
} from "../../utils/ui";

interface RemoveSeedFormValues {
  wordList: Array<{ word: string }>;
  phraseSize: "12" | "15" | "18" | "21" | "24";
  passphrase: string;
  vaultPassword: string;
}

const defaultValues: RemoveSeedFormValues = {
  passphrase: "",
  phraseSize: "12",
  vaultPassword: "",
  wordList: new Array(12).fill(null).map(() => ({ word: "" })),
};

interface RemoveModalProps {
  recoveryPhrase?: SerializedRecoveryPhraseReference;
  onClose: () => void;
}

export default function RemoveSeedModal({
  recoveryPhrase,
  onClose,
}: RemoveModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>();
  const lastRecoveryPhraseRef = useRef<SerializedRecoveryPhraseReference>(null);
  const lastMustImportRef = useRef<boolean>(null);

  const requirePassword = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );
  const accountsImported = useAppSelector(accountsImportedSelector);
  const [status, setStatus] = useState<"form" | "loading" | "invalid_seed">(
    "form"
  );

  const methods = useForm<RemoveSeedFormValues>({
    defaultValues: {
      ...defaultValues,
    },
  });
  const { watch, reset, control, setValue, clearErrors, handleSubmit } =
    methods;
  const [phraseSize, wordList, vaultPassword] = watch([
    "phraseSize",
    "wordList",
    "vaultPassword",
  ]);

  useEffect(() => {
    setValue(
      "wordList",
      new Array(Number(phraseSize)).fill(null).map(() => ({ word: "" }))
    );
    clearErrors("wordList");
  }, [phraseSize]);

  const phrase = recoveryPhrase || lastRecoveryPhraseRef.current;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (recoveryPhrase) {
      lastRecoveryPhraseRef.current = recoveryPhrase;
      lastMustImportRef.current = !accountsImported.includes(recoveryPhrase.id);
      reset({
        ...defaultValues,
      });
    } else {
      timeout = setTimeout(() => {
        reset({
          ...defaultValues,
        });
        setStatus("form");
        lastMustImportRef.current = true;
        lastRecoveryPhraseRef.current = undefined;
      }, 150);
    }

    closeSnackbars();

    return () => {
      closeSnackbars();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [recoveryPhrase]);

  const closeSnackbars = () => {
    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }

    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  const isLoading = status === "loading";

  const mustProvideSeed =
    !accountsImported.includes(phrase?.id) || lastMustImportRef.current;

  const onSubmit = async (data: RemoveSeedFormValues) => {
    if (!phrase) return;

    setStatus("loading");

    if (mustProvideSeed) {
      const res = await AppToBackground.getRecoveryPhraseId({
        recoveryPhrase: data.wordList.map(({ word }) => word).join(" "),
        passphrase: data.passphrase,
      });

      if (res.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Remove Seed Failed",
          onRetry: () => onSubmit(data),
        });
      } else {
        closeSnackbars();

        if (res.data.recoveryPhraseId !== phrase.id) {
          setStatus("invalid_seed");

          return;
        }
      }
    }

    AppToBackground.removeRecoveryPhrase({
      recoveryPhraseId: phrase.id,
      vaultPassword: requirePassword ? data.vaultPassword : undefined,
    }).then((res) => {
      if (res.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Remove Seed Failed",
          onRetry: () => onSubmit(data),
        });
        setStatus("form");
      } else {
        if (res.data.isPasswordWrong) {
          wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
          setStatus("form");
        } else {
          closeSnackbars();
          onClose();
          enqueueSnackbar({
            message: "Seed Removed Successfully!",
            variant: "success",
          });
        }
      }
    });
  };

  const canRemove =
    (!mustProvideSeed || wordList.every(({ word }) => !!word)) &&
    (!requirePassword || !!vaultPassword);

  return (
    <BaseDialog
      open={!!recoveryPhrase}
      onClose={onClose}
      title={"Remove Seed"}
      isLoading={isLoading}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      <FormProvider {...methods}>
        <DialogContent sx={{ padding: "18px!important" }}>
          <Summary
            rows={[
              {
                type: "row",
                label: "Name",
                value: (
                  <Stack
                    spacing={0.7}
                    direction={"row"}
                    alignItems={"center"}
                    justifyContent={"flex-end"}
                  >
                    <AvatarByString string={phrase?.id} type={"square"} />
                    <Typography variant={"subtitle2"}>
                      {phrase?.name}
                    </Typography>
                  </Stack>
                ),
              },
              {
                type: "row",
                label: "Seed Type",
                value: phrase?.length,
              },
            ]}
          />
          {mustProvideSeed ? (
            <>
              <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
                To remove this seed, please provide its seed phrase and
                passphrase. Soothe needs to make sure you saved your access to
                this seed.
              </Typography>
              <FillSeedPhrase canPaste={true} disabled={isLoading} />
              <PassphraseInput disabled={isLoading} />
              {status === "invalid_seed" && (
                <Typography
                  fontSize={11}
                  marginTop={0.8}
                  marginBottom={0.8}
                  lineHeight={"16px"}
                  color={themeColors.red}
                >
                  The provided seed phrase and/or passphrase does not correspond
                  to the selected seed to remove.
                </Typography>
              )}
            </>
          ) : (
            <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
              As you imported this seed in your vault, we understand that you
              have its seed phrase saved somewhere to restore it in case its
              needed.
            </Typography>
          )}
          {requirePassword && (
            <>
              <Divider flexItem={true} sx={{ marginTop: 1.6 }} />
              <Typography fontSize={11} lineHeight={"16px"} marginTop={1.6}>
                To continue, please enter the vault’s password:
              </Typography>
              <Controller
                control={control}
                name={"vaultPassword"}
                render={({ field, fieldState: { error } }) => (
                  <PasswordInput
                    required
                    {...field}
                    disabled={isLoading}
                    placeholder={"Vault Password"}
                    error={!!error}
                    helperText={error?.message}
                    sx={{
                      marginTop: 1.2,
                      marginBottom: !!error ? 1 : 0,
                      "& .MuiFormHelperText-root": {
                        fontSize: 10,
                      },
                    }}
                  />
                )}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ height: 85, padding: 0 }}>
          <DialogButtons
            primaryButtonProps={{
              variant: "text",
              sx: {
                backgroundColor: themeColors.white,
                color: themeColors.red,
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
              },
              children: "Remove Seed",
              disabled: !canRemove,
              type: "submit",
              isLoading,
            }}
          />
        </DialogActions>
      </FormProvider>
    </BaseDialog>
  );
}
