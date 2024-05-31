import { useForm } from "react-hook-form";
import React, { useCallback, useEffect, useState } from "react";
import { ZodIssue } from "zod";
import { enqueueSnackbar, readFile } from "../../utils/ui";
import { VaultBackupSchema } from "../../redux/slices/vault/backup";
import AppToBackground from "../../controllers/communication/AppToBackground";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

interface ImportVaultForm {
  password: string;
  file?: File | null;
}

export default function ImportVaultModal() {
  const methods = useForm<ImportVaultForm>({
    defaultValues: {
      password: "",
    },
  });
  const { handleSubmit, control, watch } = methods;
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [wrongPassword, setWrongPassword] = useState(false);
  const [fileErrors, setFileErrors] = useState<ZodIssue[]>([]);
  const [password, file] = watch(["password", "file"]);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [password]);

  useEffect(() => {
    if (fileErrors.length) {
      setFileErrors([]);
    }
  }, [file]);

  const onSubmit = async (data: ImportVaultForm) => {
    try {
      setStatus("loading");

      const vaultContent = await readFile(data.file);
      const vault = VaultBackupSchema.parse(JSON.parse(vaultContent));

      AppToBackground.importVault({
        vault,
        password: data.password,
      }).then((res) => {
        if (res.error) {
          setStatus("error");
        } else {
          if (res?.data?.isPasswordWrong) {
            setWrongPassword(true);
          } else {
            enqueueSnackbar({
              variant: "success",
              message: "Vault was imported successfully!",
              persist: true,
            });
          }
          setStatus("normal");
        }
      });

      setStatus("normal");
    } catch (e) {
      setStatus("error");
    }
  };

  let content: React.ReactElement;

  const title = (
    <Stack
      width={1}
      height={80}
      position={"relative"}
      alignItems={"center"}
      justifyContent={"center"}
      borderBottom={"1px solid #eff1f4"}
    >
      <Typography variant={"subtitle2"} textAlign={"center"}>
        Import Vault
      </Typography>
    </Stack>
  );
}
