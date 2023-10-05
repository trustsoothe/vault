import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { FormProvider, useForm } from "react-hook-form";
import { enqueueSnackbar } from "notistack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import OperationFailed from "../common/OperationFailed";
import { nameRules } from "./CreateNew";
import Password from "../common/Password";
import { DetailComponent } from "./AccountDetail";
import { ACCOUNTS_DETAIL_PAGE } from "../../constants/routes";

interface FormValues {
  account_name: string;
  vault_password?: string;
}

interface UpdateAccountProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  passwordRemembered: RootState["vault"]["passwordRemembered"];
}

const UpdateAccount: React.FC<UpdateAccountProps> = ({
  accounts,
  passwordRemembered,
}) => {
  const [wrongPassword, setWrongPassword] = useState(false);
  const [account, setAccount] = useState<SerializedAccountReference>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${account?.id}`);
    }
  }, [navigate, location, account]);

  const methods = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      vault_password: "",
    },
  });
  const { handleSubmit, register, formState, setValue, watch } = methods;
  const pass = watch("vault_password");

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [pass]);

  useEffect(() => {
    const id = searchParams.get("id");
    const accountFromStore = accounts.find((item) => item.id === id);
    if (accountFromStore && account?.id !== id) {
      setAccount(accountFromStore);
      setValue("account_name", accountFromStore.name);
      return;
    }

    if (!accountFromStore) {
      onCancel();
    }
  }, [searchParams, accounts]);

  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const onSubmit = useCallback(
    (data: FormValues) => {
      setStatus("loading");
      AppToBackground.updateAccount({
        id: account.id,
        name: data.account_name,
        vaultPassword: !passwordRemembered ? data?.vault_password : undefined,
      }).then((result) => {
        if (result.error) {
          setStatus("error");
          return;
        }

        if (result.data?.isPasswordWrong) {
          setWrongPassword(true);
          setStatus("normal");
        } else {
          enqueueSnackbar({
            style: { width: 250, minWidth: "250px!important" },
            message: `Account name updated successfully.`,
            variant: "success",
            autoHideDuration: 3000,
          });
          navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${account?.id}`);
        }
      });
    },
    [account, passwordRemembered, navigate]
  );

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error saving the account."}
          onCancel={onCancel}
        />
      );
    }

    return (
      <>
        <DetailComponent
          account={account}
          hideName={true}
          containerProps={{ marginTop: 2 }}
        />
        <TextField
          autoFocus
          label={"Account Name"}
          size={"small"}
          fullWidth
          {...register("account_name", nameRules)}
          error={!!formState?.errors?.account_name}
          helperText={formState?.errors?.account_name?.message}
        />
        {!passwordRemembered && (
          <FormProvider {...methods}>
            <Password
              passwordName={"vault_password"}
              labelPassword={"Vault Password"}
              justRequire={true}
              canGenerateRandom={false}
              hidePasswordStrong={true}
              containerProps={{
                width: 1,
                marginTop: "5px!important",
              }}
              errorPassword={wrongPassword ? "Wrong password" : undefined}
            />
          </FormProvider>
        )}
        <Stack direction={"row"} spacing={"20px"} width={1}>
          <Button
            variant={"outlined"}
            sx={{ height: 30 }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ height: 30, fontWeight: 600 }}
            fullWidth
            type={"submit"}
          >
            Save
          </Button>
        </Stack>
      </>
    );
  }, [
    onCancel,
    register,
    account,
    formState,
    passwordRemembered,
    methods,
    wrongPassword,
  ]);

  return (
    <Stack
      component={"form"}
      flexGrow={1}
      alignItems={"center"}
      justifyContent={status === "normal" ? "flex-start" : "center"}
      onSubmit={handleSubmit(onSubmit)}
      spacing={2.3}
    >
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    passwordRemembered: state.vault.passwordRemembered,
    accounts: state.vault.entities.accounts.list,
  };
};

export default connect(mapStateToProps)(UpdateAccount);
