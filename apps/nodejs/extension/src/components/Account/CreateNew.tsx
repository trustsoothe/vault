import type { SerializedAsset } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { ExternalNewAccountRequest } from "../../types/communication";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { enqueueSnackbar } from "notistack";
import { FormProvider, useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import { useNavigate, useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AutocompleteAsset from "./AutocompleteAsset";
import RequestFrom from "../common/RequestFrom";
import { getAssetByProtocol } from "../../utils";
import { useAppDispatch } from "../../hooks/redux";
import AppToBackground from "../../controllers/communication/AppToBackground";
import Password from "../common/Password";
import { ACCOUNTS_DETAIL_PAGE } from "../../constants/routes";

interface FormValues {
  account_name: string;
  vault_password: string;
  password: string;
  confirm_password: string;
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRequest: ExternalNewAccountRequest = location?.state;

  const methods = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      vault_password: "",
      password: "",
      confirm_password: "",
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
  }, [currentRequest, navigate, location, dispatch]);

  const onClickCreate = useCallback(
    async (data: FormValues) => {
      setStatus("loading");
      const result = await AppToBackground.answerNewAccount({
        rejected: false,
        vaultPassword: !passwordRemembered ? data.vault_password : undefined,
        accountData: {
          name: data.account_name,
          asset: data.asset,
          password: data.password,
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
            style: { width: 200, minWidth: "200px!important" },
            message: `Account created successfully.`,
            variant: "success",
            autoHideDuration: 2500,
          });
          navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${result.data.accountId}`);
        }
      }
    },
    [currentRequest, dispatch, passwordRemembered, navigate]
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
      <Stack height={1} width={1} spacing={2} mt={2}>
        {currentRequest && (
          <RequestFrom
            title={"New Account Request from:"}
            containerProps={{
              marginTop: "-10px!important",
            }}
            {...currentRequest}
          />
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
          <Password
            passwordName={"password"}
            confirmPasswordName={"confirm_password"}
            containerProps={{
              width: 1,
              marginTop: "10px!important",
              spacing: 0.5,
            }}
            inputsContainerProps={{
              spacing: "18px",
            }}
            randomKey={"new-acc"}
          />
          {!passwordRemembered && (
            <Password
              passwordName={"vault_password"}
              canGenerateRandom={false}
              justRequire={true}
              canShowPassword={true}
              labelPassword={"Vault Password"}
              hidePasswordStrong={true}
              errorPassword={wrongPassword ? "Wrong password" : undefined}
              containerProps={{
                marginTop: "10px!important",
                spacing: 0.5,
              }}
            />
          )}
        </FormProvider>
        <Stack
          direction={"row"}
          spacing={"20px"}
          width={1}
          marginTop={"25px!important"}
        >
          <Button
            onClick={onClickCancel}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "gray",
              borderColor: "gray",
              height: 30,
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{
              textTransform: "none",
              fontWeight: 600,
              height: 30,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
          >
            Create
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
  ]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={1}
      paddingX={"5px"}
      spacing={"20px"}
      width={1}
      boxSizing={"border-box"}
      marginTop={2}
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
