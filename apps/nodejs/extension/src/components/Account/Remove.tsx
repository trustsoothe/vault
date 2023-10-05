import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { enqueueSnackbar } from "notistack";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { ACCOUNTS_DETAIL_PAGE, ACCOUNTS_PAGE } from "../../constants/routes";
import { DetailComponent } from "./AccountDetail";
import Password from "../common/Password";
import { useAppDispatch } from "../../hooks/redux";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface FormValues {
  vault_password: string;
}

interface RemoveAccountProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
}

const RemoveAccount: React.FC<RemoveAccountProps> = ({ accounts }) => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState<SerializedAccountReference>(null);
  const [wrongPassword, setWrongPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const methods = useForm<FormValues>({
    defaultValues: {
      vault_password: "",
    },
  });
  const { handleSubmit, watch } = methods;
  const pass = watch("vault_password");

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [pass]);

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${account?.id}`);
    }
  }, [navigate, location, account]);

  useEffect(() => {
    const id = searchParams.get("id");
    const accountFromStore = accounts.find((item) => item.id === id);
    if (accountFromStore && account?.id !== id) {
      setAccount(accountFromStore);
      return;
    }

    if (!accountFromStore) {
      onCancel();
    }
  }, [searchParams, accounts]);

  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const removeAccount = useCallback(
    (data: FormValues) => {
      setStatus("loading");
      AppToBackground.removeAccount({
        serializedAccount: account,
        vaultPassword: data.vault_password,
      }).then((response) => {
        if (response.error) {
          setStatus("error");
        } else {
          if (response.data.isPasswordWrong) {
            setStatus("normal");
            setWrongPassword(true);
          } else {
            enqueueSnackbar({
              style: { width: 225, minWidth: "225px!important" },
              message: `Account removed successfully.`,
              variant: "success",
              autoHideDuration: 3000,
            });
            navigate(ACCOUNTS_PAGE);
          }
        }
      });
    },
    [navigate, dispatch, account]
  );

  return useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error removing the account."}
          onCancel={onCancel}
        />
      );
    }

    return (
      <Stack
        flexGrow={1}
        spacing={"23px"}
        marginTop={2}
        component={"form"}
        onSubmit={handleSubmit(removeAccount)}
      >
        <Typography fontSize={14} width={1}>
          Are you sure you want to remove the following account?
        </Typography>
        <DetailComponent
          account={account}
          containerProps={{
            my: "10px!important",
            sx: {
              transform: "scale(0.9)",
              border: "1px solid lightgray",
              padding: 1,
              boxSizing: "border-box",
              borderRadius: "6px",
            },
          }}
        />
        <Typography fontSize={14} width={1} marginTop={"0!important"}>
          To continue, introduce the vault's password:
        </Typography>
        <FormProvider {...methods}>
          <Password
            passwordName={"vault_password"}
            labelPassword={"Vault Password"}
            canGenerateRandom={false}
            justRequire={true}
            hidePasswordStrong={true}
            containerProps={{
              marginTop: "10px!important",
              spacing: 0.5,
            }}
            errorPassword={wrongPassword ? "Wrong password" : undefined}
          />
        </FormProvider>

        <Stack
          direction={"row"}
          width={1}
          paddingX={5}
          spacing={"15px"}
          alignItems={"center"}
          justifyContent={"center"}
          boxSizing={"border-box"}
        >
          <Button
            variant={"outlined"}
            sx={{ height: 30, fontWeight: 500 }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ height: 30, fontWeight: 600 }}
            type={"submit"}
            fullWidth
          >
            Remove
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    status,
    removeAccount,
    handleSubmit,
    methods,
    account,
    onCancel,
    wrongPassword,
  ]);
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
});

export default connect(mapStateToProps)(RemoveAccount);
