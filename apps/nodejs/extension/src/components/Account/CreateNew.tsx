import type { SerializedAsset } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { ExternalNewAccountRequest } from "../../types/communication";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AutocompleteAsset from "./AutocompleteAsset";
import { getAssetByProtocol } from "../../utils";
import Requester from "../common/Requester";
import { enqueueSnackbar } from "../../utils/ui";
import { useAppDispatch } from "../../hooks/redux";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import AccountAndVaultPasswords from "../common/AccountAndVaultPasswords";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface FormValues {
  account_name: string;
  vault_password: string;
  account_password: string;
  confirm_account_password: string;
  asset: SerializedAsset | null;
}

export const nameRules = {
  required: "Required",
  maxLength: {
    value: 50,
    message: "The max amount of characters is 50.",
  },
  validate: (value) => {
    if (!value.trim()) {
      return "Required";
    }

    return true;
  },
};

type FormStatus = "normal" | "loading" | "error";

interface CreateNewAccountProps {
  assets: RootState["vault"]["entities"]["assets"]["list"];
  passwordRemembered: RootState["vault"]["passwordRemembered"];
}

const CreateNewAccount: React.FC<CreateNewAccountProps> = ({
  assets,
  passwordRemembered,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordStep, setPasswordStep] = useState<"account" | "vault">(
    "account"
  );
  const currentRequest: ExternalNewAccountRequest = location?.state;

  const methods = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      vault_password: "",
      account_password: "",
      confirm_account_password: "",
      asset: null,
    },
  });

  const {
    register,
    formState,
    handleSubmit,
    getValues,
    control,
    setValue,
    watch,
  } = methods;
  const [asset, vaultPassword] = watch(["asset", "vault_password"]);

  useEffect(() => {
    if (currentRequest?.protocol) {
      const asset = getAssetByProtocol(assets, currentRequest.protocol);

      if (asset) {
        setValue("asset", asset);
      }
    }
  }, [currentRequest]);

  const [status, setStatus] = useState<FormStatus>("normal");
  const [wrongPassword, setWrongPassword] = useState(false);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [vaultPassword]);

  const onClickCancel = useCallback(async () => {
    if (passwordStep === "vault") {
      setPasswordStep("account");
      return;
    }

    if (currentRequest) {
      await AppToBackground.answerNewAccount({
        rejected: true,
        accountData: null,
        request: currentRequest || null,
      });
    } else {
      if (location.key !== "default") {
        navigate(-1);
      } else {
        navigate("/");
      }
    }
  }, [currentRequest, navigate, location, dispatch, passwordStep]);

  const onClickCreate = useCallback(
    async (data: FormValues) => {
      if (!passwordRemembered && passwordStep === "account") {
        setPasswordStep("vault");
        return;
      }

      setStatus("loading");
      const result = await AppToBackground.answerNewAccount({
        rejected: false,
        vaultPassword: !passwordRemembered ? data.vault_password : undefined,
        accountData: {
          name: data.account_name,
          asset: data.asset,
          password: data.account_password,
        },
        request: currentRequest || null,
      });

      if (result.error) {
        setStatus("error");
      } else {
        if (result?.data?.isPasswordWrong) {
          setWrongPassword(true);
          setStatus("normal");
        } else {
          enqueueSnackbar({
            message: `Account created successfully.`,
            variant: "success",
          });
          navigate(ACCOUNTS_PAGE);
        }
      }
    },
    [currentRequest, dispatch, passwordRemembered, navigate, passwordStep]
  );

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error creating the account."}
          onCancel={onClickCancel}
        />
      );
    }

    const { errors } = formState;

    return (
      <Stack height={1} width={1} justifyContent={"space-between"}>
        <Stack spacing={2} flexGrow={1}>
          {currentRequest && (
            <>
              <Typography
                color={theme.customColors.primary999}
                fontWeight={700}
                lineHeight={"30px"}
                textAlign={"center"}
                sx={{ userSelect: "none" }}
              >
                New Account request from:
              </Typography>
              <Requester
                request={currentRequest}
                containerProps={{
                  marginTop: "10px!important",
                  paddingX: 1.5,
                  paddingY: 0.5,
                  height: 40,
                  boxSizing: "border-box",
                }}
              />
            </>
          )}
          <AutocompleteAsset
            control={control}
            disabled={!!currentRequest?.protocol && !!asset}
          />
          <TextField
            label={"Account Name"}
            size={"small"}
            fullWidth
            autoComplete={"off"}
            error={!!errors?.account_name}
            helperText={errors?.account_name?.message}
            {...register("account_name", nameRules)}
          />
          <FormProvider {...methods}>
            <AccountAndVaultPasswords
              introduceVaultPassword={passwordStep === "vault"}
              vaultPasswordTitle={`To save the account, introduce the vault’s password:`}
              accountRandomKey={"new-acc"}
              vaultTitleProps={{
                marginTop: "20px!important",
                marginBottom: "5px!important",
              }}
              vaultPasswordIsWrong={wrongPassword}
            />
          </FormProvider>
        </Stack>
        <Stack direction={"row"} spacing={2} width={1}>
          <Button
            onClick={onClickCancel}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            variant={"outlined"}
            fullWidth
          >
            {!passwordRemembered && passwordStep === "vault"
              ? "Back"
              : "Cancel"}
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
          >
            {!passwordRemembered && passwordStep === "account"
              ? "Next"
              : "Create"}
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    status,
    onClickCancel,
    register,
    formState,
    getValues,
    methods,
    passwordRemembered,
    passwordStep,
  ]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={1}
      paddingX={currentRequest ? 2 : 0}
      spacing={"20px"}
      width={1}
      boxSizing={"border-box"}
      marginTop={2.5}
    >
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  assets: state.vault.entities.assets.list,
  passwordRemembered: state.vault.passwordRemembered,
});

export default connect(mapStateToProps)(CreateNewAccount);
