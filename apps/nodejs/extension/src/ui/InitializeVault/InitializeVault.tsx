import Box from "@mui/material/Box";
import React, { useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormProvider, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import InitializeVaultForm from "./Form";
import ImportVaultModal from "./ImportVaultModal";

export interface InitializeVaultFormValues {
  password: string;
  confirmPassword: string;
  keepSessionActive: boolean;
}

export default function InitializeVault() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const methods = useForm<InitializeVaultFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
      keepSessionActive: true,
    },
  });
  const { handleSubmit } = methods;

  const toggleShowImportModal = () =>
    setShowImportModal((prevState) => !prevState);

  const onSubmit = (data: InitializeVaultFormValues) => {
    if (status !== "loading") {
      setStatus("loading");
      AppToBackground.initializeVault({
        password: data.password,
        sessionsMaxAge: {
          enabled: !data.keepSessionActive,
          maxAge: 3600,
        },
        requirePasswordForSensitiveOpts: false,
      }).then((result) => {
        setStatus(result.error ? "error" : "normal");
      });
    }
  };

  let content: React.ReactElement;

  switch (status) {
    case "normal":
      content = (
        <>
          <Box height={46} width={46} border={"1px solid black"}>
            logo
          </Box>
          <Typography variant={"h3"} textAlign={"center"} marginTop={2.7}>
            Let's Get Started
          </Typography>
          <Typography marginTop={1.4} textAlign={"center"} paddingX={1}>
            To begin, you need to initialize your vault by setting your
            password. Keep in mind that this password cannot be recovered.
          </Typography>
          <FormProvider {...methods}>
            <InitializeVaultForm />
          </FormProvider>
        </>
      );
      break;
    case "loading":
      content = <p>Loading...</p>;
      break;
    case "error":
      content = (
        <>
          <p>Error!</p>
          <button type={"submit"}>retry</button>
        </>
      );
      break;
  }

  return (
    <>
      <ImportVaultModal
        open={showImportModal}
        onClose={toggleShowImportModal}
      />
      <Box
        height={1}
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-between"}
      >
        <Box
          flexGrow={1}
          paddingX={2.4}
          paddingTop={4.8}
          display={"flex"}
          alignItems={"center"}
          flexDirection={"column"}
          sx={{
            "& .strength-bar": {
              marginTop: 1.3,
            },
            boxShadow: "0 1px 0 0 #eff1f4",
          }}
          component={"form"}
          onSubmit={handleSubmit(onSubmit)}
        >
          {content}
        </Box>
        <Box
          height={40}
          paddingX={2.4}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          borderTop={"1px solid #eff1f4"}
          bgcolor={"#fff"}
        >
          <Typography>Have a Vault Backup?</Typography>
          <Button onClick={toggleShowImportModal}>Import</Button>
        </Box>
      </Box>
    </>
  );
}
