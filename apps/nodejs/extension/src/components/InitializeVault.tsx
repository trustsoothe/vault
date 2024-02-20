import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import Button, { ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import AppToBackground from "../controllers/communication/AppToBackground";
import SootheLogoHeader from "./common/SootheLogoHeader";
import CircularLoading from "./common/CircularLoading";
import OperationFailed from "./common/OperationFailed";
import ImportModal from "./Vault/ImportModal";
import Password from "./common/Password";

interface InfoViewProps {
  onBack: () => void;
  show: boolean;
  children: React.ReactNode;
  title: string;
  submitButtonText: string;
  submitButtonProps?: ButtonProps;
  enableSubmitAfterTime?: boolean;
}

const InfoView: React.FC<InfoViewProps> = ({
  onBack,
  show,
  children,
  title,
  submitButtonText,
  submitButtonProps,
  enableSubmitAfterTime,
}) => {
  const theme = useTheme();
  const [hasReachBottom, setHasReachBottom] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (show && enableSubmitAfterTime) {
      timeout = setTimeout(() => setHasReachBottom(true), 2000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [show]);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const isInBottom =
      event.currentTarget.clientHeight + event.currentTarget.scrollTop + 1 >=
      event.currentTarget.scrollHeight;

    if (isInBottom) {
      setHasReachBottom(true);
    }
  }, []);

  return (
    <Fade
      in={show}
      style={{
        position: "absolute",
        top: 101,
        left: 0,
        zIndex: 100,
        backgroundColor: theme.customColors.white,
      }}
    >
      <Stack flexGrow={1} width={1}>
        <Typography
          marginTop={2}
          marginLeft={2}
          fontSize={18}
          fontWeight={700}
          lineHeight={"30px"}
          color={theme.customColors.primary999}
          sx={{
            userSelect: "none",
          }}
        >
          {title}
        </Typography>
        <Stack
          flexGrow={1}
          height={350}
          marginTop={1}
          paddingLeft={2}
          paddingRight={1}
          width={353}
          overflow={"auto"}
          sx={{
            "*": {
              color: theme.customColors.dark100,
              lineHeight: "19px",
            },
          }}
          onScroll={onScroll}
        >
          {children}
        </Stack>
        <Stack
          height={75}
          padding={2}
          spacing={1.5}
          direction={"row"}
          alignItems={"center"}
          boxSizing={"border-box"}
        >
          <Button
            variant={"outlined"}
            fullWidth
            sx={{
              height: 35,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              fontSize: 16,
              fontWeight: 700,
              marginTop: 0.3,
            }}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            variant={"contained"}
            fullWidth
            disabled={!hasReachBottom}
            type={"submit"}
            {...submitButtonProps}
            sx={{
              height: 35,
              backgroundColor: theme.customColors.primary500,
              fontSize: 16,
              fontWeight: 700,
              marginTop: 0.3,
              ...submitButtonProps?.sx,
            }}
          >
            {submitButtonText}
          </Button>
        </Stack>
      </Stack>
    </Fade>
  );
};

type CustomInfoViewProps = Omit<
  InfoViewProps,
  "children" | "title" | "submitButtonText"
>;

const SecurityAndPrivacyView: React.FC<CustomInfoViewProps> = (infoProps) => {
  return (
    <InfoView
      {...infoProps}
      title={"Security & Privacy"}
      submitButtonText={"Accept"}
    >
      <Typography fontSize={14} fontWeight={500}>
        About this policy
      </Typography>
      <Typography fontSize={13}>
        Lorem ipsum dolor sit amet consectetur. Amet amet ipsum a et. In
        faucibus at amet id ultrices in amet elit ut. Est vitae velit et
        vulputate elementum gravida. Morbi mauris nibh pharetra viverra amet.
        Volutpat nunc habitant at commodo non. Lobortis convallis vitae
        pellentesque sollicitudin. Magna diam odio auctor mauris nulla in.
        Sociis augue tincidunt urna lectus vulputate sem. Interdum morbi sed
        ullamcorper ultricies in consequat nec. Varius volutpat nisi integer
        netus nisl at. Diam morbi et viverra venenatis velit dignissim at. Morbi
        sed turpis consectetur eros volutpat eu enim sit.
      </Typography>
      <br />
      <br />
      <Typography fontSize={14} fontWeight={500}>
        Keeping your information secure
      </Typography>
      <Typography fontSize={13}>
        Cursus elementum facilisis accumsan ridiculus sit amet imperdiet. Nunc
        malesuada nisl ipsum risus ut. Condimentum tellus dignissim vestibulum
        erat dictumst velit pretium. Donec augue volutpat congue feugiat Varius
        volutpat nisi integer netus nisl at. Diam morbi et viverra venenatis
        velit dignissim at. Morbi sed turpis consectetur.
      </Typography>
    </InfoView>
  );
};

const SavePasswordView: React.FC<CustomInfoViewProps> = (infoProps) => {
  return (
    <InfoView
      {...infoProps}
      title={"BACK UP YOUR VAULT REGULARLY!"}
      submitButtonText={"Next"}
    >
      <Typography fontSize={13}>
        We recommend you to backup (export) your vault everytime you make
        changes to your list of accounts. To help you with this, everytime your
        list of account changes we are going to display a toast to remind you to
        backup your vault.
        <br />
        <br />
        Exporting your vault will allow you to have a backup and allow you to
        import it in another PC or browser.
        <br />
        <br />
        We recommend you save your backup in another device or in a cloud
        storage service to prevent the case where you lose access to your vault
        because you cannot access anymore your PC.
      </Typography>
      <br />
      <br />
      <Typography fontSize={15} fontWeight={500}>
        Your vault is saved only in your PC
      </Typography>
      <Typography fontSize={13}>
        If you can't access your PC, you won't be able to access your vault
        unless you have a backup. For that reason, we encourage you to backup
        (export) your vault and to save the accounts private keys and portable
        wallet (PPK file).
      </Typography>
    </InfoView>
  );
};

const VaultPreferences: React.FC<CustomInfoViewProps> = (infoProps) => {
  const theme = useTheme();
  const { control, watch } = useFormContext<FormValues>();
  const [enabled] = watch(["sessionsMaxAge.enabled"]);
  return (
    <InfoView
      {...infoProps}
      title={"VAULT PREFERENCES"}
      submitButtonText={"Next"}
      enableSubmitAfterTime={true}
    >
      <Typography fontSize={13}>
        To help you secure your vault, we give you the following settings:
      </Typography>
      <Typography fontSize={13} fontWeight={500} marginTop={1.5}>
        Sessions Max Age
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={1.5}
        marginTop={"10px!important"}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
          <Typography fontSize={12}>Enabled:</Typography>
          <Controller
            control={control}
            name={"sessionsMaxAge.enabled"}
            render={({ field }) => (
              <Switch
                size={"small"}
                {...field}
                checked={field.value}
                sx={{
                  "& .Mui-checked": {
                    "& .MuiSwitch-thumb": {
                      color: `${theme.customColors.primary500}!important`,
                    },
                  },
                  "& .MuiSwitch-thumb": {
                    color: `${theme.customColors.white}`,
                  },
                }}
              />
            )}
          />
        </Stack>
        <Controller
          name={"sessionsMaxAge.maxAge"}
          control={control}
          rules={{
            validate: (value) => {
              const num = Number(value);

              if (isNaN(num)) {
                return "Invalid number";
              }

              // equals to 15 minutes
              if (num < 0.25) {
                return "Min amount allowed is 0.25";
              }

              // equals to 1 year
              if (num > 8760) {
                return "Max amount allowed is 8760";
              }

              return true;
            },
            required: "Required",
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              fullWidth
              required={enabled}
              label={"Amount (hours)"}
              sx={{
                height: 30,
                marginBottom: !!error?.message ? 0.5 : undefined,
                "& .MuiFormLabel-root": {
                  top: -4,
                },
                "& .MuiInputBase-root": {
                  height: 30,
                },
                "& input": {
                  height: "20px!important",
                  fontSize: "13px!important",
                },
              }}
              {...field}
              disabled={!enabled}
              error={!!error?.message}
              helperText={error?.message}
            />
          )}
        />
      </Stack>
      <Typography fontSize={10} color={theme.customColors.dark75}>
        When enabled the vault and websites will keep their sessions open for
        the hours you specify.
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={0.7}
        marginTop={1}
      >
        <Typography fontSize={13} fontWeight={500}>
          Ask for password on sensitive operations:{" "}
        </Typography>
        <Controller
          control={control}
          name={"requirePasswordForOpts"}
          render={({ field }) => (
            <Switch
              size={"small"}
              {...field}
              checked={field.value}
              sx={{
                "& .Mui-checked": {
                  "& .MuiSwitch-thumb": {
                    color: `${theme.customColors.primary500}!important`,
                  },
                },
                "& .MuiSwitch-thumb": {
                  color: `${theme.customColors.white}`,
                },
              }}
            />
          )}
        />
      </Stack>
      <Typography fontSize={10} color={theme.customColors.dark75}>
        When this is enabled you will be required to insert the vault password
        for the following operations: transactions and remove account.
      </Typography>
    </InfoView>
  );
};

interface FormValues {
  password: string;
  confirmPassword: string;
  sessionsMaxAge: {
    enabled: boolean;
    maxAge: number;
  };
  requirePasswordForOpts: boolean;
}

const InitializeVault: React.FC = () => {
  const theme = useTheme();
  const [status, setStatus] = useState<
    | "normal"
    | "sec_and_priv"
    | "loading"
    | "error"
    | "preferences"
    | "sec_and_priv_to_submit"
    | "passwords_warning"
  >("normal");
  const [showImportModal, setShowImportModal] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
      sessionsMaxAge: {
        enabled: false,
        maxAge: 1,
      },
      requirePasswordForOpts: true,
    },
  });
  const { handleSubmit } = methods;

  const onShowSecurityAndPrivacy = useCallback(() => {
    setStatus("sec_and_priv");
  }, []);

  const closeSecurityAndPrivacy = useCallback(() => {
    setStatus("normal");
  }, []);

  const onSubmit = useCallback(
    (data: FormValues) => {
      if (status === "sec_and_priv_to_submit") {
        setStatus("loading");
        AppToBackground.initializeVault({
          password: data.password,
          sessionsMaxAge: {
            enabled: data.sessionsMaxAge.enabled,
            maxAge: data.sessionsMaxAge.maxAge * 3600,
          },
          requirePasswordForSensitiveOpts: data.requirePasswordForOpts,
        }).then((result) => setStatus(result.error ? "error" : "normal"));
      } else if (status === "normal") {
        setStatus("preferences");
      } else if (status === "preferences") {
        setStatus("passwords_warning");
      } else if (status === "passwords_warning") {
        setStatus("sec_and_priv_to_submit");
      } else if (status === "sec_and_priv") {
        setStatus("normal");
      }
    },
    [status]
  );

  const onBack = useCallback(() => {
    setStatus((prevState) => {
      switch (prevState) {
        case "sec_and_priv_to_submit": {
          return "passwords_warning";
        }
        case "passwords_warning": {
          return "preferences";
        }
        default: {
          return "normal";
        }
      }
    });
  }, []);

  const toggleShowImportDialog = useCallback(
    () => setShowImportModal((prevState) => !prevState),
    []
  );

  const formContent = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error trying to initialize the vault."}
        />
      );
    }

    return (
      <Stack
        flexGrow={1}
        width={1}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Stack flexGrow={1} width={1} alignItems={"center"}>
          <Stack
            height={150}
            width={350}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Typography
              color={theme.customColors.primary999}
              fontSize={18}
              fontWeight={700}
              lineHeight={"40px"}
            >{`Let's Get Started`}</Typography>
            <Typography
              fontSize={14}
              lineHeight={"20px"}
              color={theme.customColors.dark100}
              textAlign={"center"}
            >
              To begin you need to initialize your vault by setting your
              password. Keep in mind that the password cannot be recovered.
            </Typography>
          </Stack>
          <Password
            autofocusPassword={true}
            passwordName={"password"}
            confirmPasswordName={"confirmPassword"}
            containerProps={{
              width: 360,
              spacing: "5px",
            }}
          />
        </Stack>
        <Stack spacing={1.5}>
          <Button
            sx={{
              marginX: "20px!important",
              marginTop: "30px!important",
              fontWeight: 700,
              width: 340,
              height: 50,
              fontSize: 20,
              borderRadius: "25px",
              backgroundColor: theme.customColors.primary500,
            }}
            variant={"contained"}
            type={"submit"}
            disabled={status !== "normal"}
          >
            Initialize Vault
          </Button>
          <Typography lineHeight={"20px"} fontSize={13} textAlign={"center"}>
            Already have a vault?{" "}
            <span
              onClick={toggleShowImportDialog}
              style={{
                fontWeight: 500,
                color: theme.customColors.primary500,
                textDecoration: "underline",
                userSelect: "none",
                cursor: "pointer",
              }}
            >
              Import it
            </span>
          </Typography>
          <Typography
            color={theme.customColors.primary500}
            lineHeight={"20px"}
            fontSize={12}
            fontWeight={500}
            textAlign={"center"}
            onClick={onShowSecurityAndPrivacy}
            sx={{
              textDecoration: "underline",
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            Security & Privacy
          </Typography>
        </Stack>
      </Stack>
    );
  }, [
    status,
    theme,
    closeSecurityAndPrivacy,
    onShowSecurityAndPrivacy,
    toggleShowImportDialog,
  ]);

  return (
    <>
      <Stack
        spacing={"10px"}
        alignItems={"center"}
        component={"form"}
        flexGrow={1}
        onSubmit={handleSubmit(onSubmit)}
        position={"relative"}
      >
        <SootheLogoHeader
          compact={false}
          containerProps={{
            display: "flex",
          }}
        />
        <SecurityAndPrivacyView
          show={
            status === "sec_and_priv_to_submit" || status === "sec_and_priv"
          }
          submitButtonProps={{
            sx: {
              display: status === "sec_and_priv_to_submit" ? undefined : "none",
            },
          }}
          onBack={onBack}
        />
        <SavePasswordView
          show={status === "passwords_warning"}
          onBack={onBack}
        />
        <FormProvider {...methods}>
          <VaultPreferences show={status === "preferences"} onBack={onBack} />

          {formContent}
        </FormProvider>
      </Stack>
      {showImportModal && (
        <ImportModal onClose={toggleShowImportDialog} open={showImportModal} />
      )}
    </>
  );
};

export default InitializeVault;
