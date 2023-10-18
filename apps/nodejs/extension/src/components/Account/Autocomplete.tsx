import type {
  AutocompleteProps,
  AutocompleteRenderOptionState,
  FilterOptionsState,
  TextFieldProps,
  Theme,
} from "@mui/material";
import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { AccountWithBalance } from "../../types";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import orderBy from "lodash/orderBy";
import { connect } from "react-redux";
import { useTheme } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import Stack, { StackProps } from "@mui/material/Stack";
import { filterAccounts } from "./List";
import { roundAndSeparate } from "../../utils/ui";
import { useAppDispatch } from "../../hooks/redux";
import RowSpaceBetween from "../common/RowSpaceBetween";
import { getAllBalances } from "../../redux/slices/vault";

export const renderAutocompleteOption = (
  props: React.HTMLAttributes<HTMLLIElement>,
  account: AccountWithBalance,
  state: AutocompleteRenderOptionState,
  theme: Theme,
  balancesAreLoading: boolean
) => {
  const symbol = account.asset?.symbol || "";

  return (
    <Stack
      component={"li"}
      {...props}
      sx={{
        paddingX: "10px!important",
        paddingY: "5px!important",
        "& p": {
          fontSize: 12,
          lineHeight: "20px",
        },
        "& span": {
          color: `${theme.customColors.dark100}!important`,
        },
      }}
      alignItems={"flex-start!important"}
      borderTop={
        state.index === 0 ? undefined : `1px solid ${theme.customColors.dark15}`
      }
    >
      <Typography fontWeight={500} color={theme.customColors.dark100}>
        {account.name}
      </Typography>
      <Typography>{account.address}</Typography>
      <Typography color={theme.customColors.dark50}>
        Balance {symbol}:{" "}
        <span>
          {balancesAreLoading ? (
            <Skeleton
              sx={{ display: "inline-flex" }}
              variant={"rectangular"}
              width={75}
              height={12}
            />
          ) : (
            roundAndSeparate(account.balance, 2, "0")
          )}
        </span>
      </Typography>
    </Stack>
  );
};

interface AccountsAutocompleteProps {
  accounts: SerializedAccountReference[];
  balancesMapById: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
  balancesAreLoading: boolean;
  selectedAccount: SerializedAccountReference | null;
  onChangeSelectedAccount: (account: SerializedAccountReference) => void;
  textFieldProps?: TextFieldProps;
  autocompleteProps?: Partial<AutocompleteProps<any, any, any, any>>;
  containerProps?: StackProps;
}

const AccountsAutocomplete: React.FC<AccountsAutocompleteProps> = ({
  selectedAccount,
  onChangeSelectedAccount,
  accounts,
  balancesAreLoading,
  balancesMapById,
  textFieldProps,
  autocompleteProps,
  containerProps,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const balanceLoadedRef = useRef(false);

  useEffect(() => {
    if (!balanceLoadedRef.current) {
      balanceLoadedRef.current = true;
      dispatch(getAllBalances());
    }
  }, []);

  const accountsWithBalance: AccountWithBalance[] = useMemo(() => {
    return orderBy(
      accounts.map(
        (account) =>
          ({
            ...account,
            balance: balancesMapById[account.id]?.amount || 0,
          } as AccountWithBalance)
      ),
      ["balance"],
      ["desc"]
    );
  }, [accounts, balancesMapById]);

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<HTMLLIElement>,
      account: AccountWithBalance,
      state: AutocompleteRenderOptionState
    ) => {
      return renderAutocompleteOption(
        props,
        account,
        state,
        theme,
        balancesAreLoading
      );
    },
    [theme, balancesAreLoading]
  );

  const filterOptions = useCallback(
    (_: never, state: FilterOptionsState<AccountWithBalance>) => {
      const value = state.inputValue.toLowerCase().trim();

      return filterAccounts(value, accountsWithBalance).slice(0, 25);
    },
    [accounts]
  );

  const getOptionLabel = useCallback((account: SerializedAccountReference) => {
    const { address, name } = account;
    const firstCharacters = address.substring(0, 4);
    const lastCharacters = address.substring(address.length - 4);

    return address ? `${name} (${firstCharacters}...${lastCharacters})` : "";
  }, []);

  const isOptionEqualToValue = useCallback(
    (option: AccountWithBalance, value: AccountWithBalance) =>
      option.id === value.id,
    []
  );

  const symbolSelectedAccount = selectedAccount
    ? selectedAccount.asset?.symbol || ""
    : "";

  const selectedAccountBalance =
    balancesMapById[selectedAccount?.id]?.amount || 0;

  return (
    <Stack spacing={0.7} width={1} {...containerProps}>
      <Autocomplete
        disableClearable={true}
        value={selectedAccount}
        renderOption={renderOption}
        options={accountsWithBalance}
        filterOptions={filterOptions}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        onChange={(_, newValue) => onChangeSelectedAccount(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={"Account"}
            fullWidth
            size={"small"}
            placeholder={"Select an account"}
            InputLabelProps={{
              shrink: true,
            }}
            {...textFieldProps}
          />
        )}
        ListboxProps={{
          sx: {
            maxHeight: 150,
          },
        }}
        {...autocompleteProps}
      />
      <Stack paddingX={1}>
        <RowSpaceBetween
          label={`Balance ${symbolSelectedAccount}`}
          value={
            selectedAccount ? (
              balancesAreLoading ? (
                <Skeleton variant={"rectangular"} width={75} height={15} />
              ) : (
                roundAndSeparate(selectedAccountBalance, 2, "0")
              )
            ) : (
              "-"
            )
          }
        />
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
  balancesMapById: state.vault.entities.accounts.balances.byId,
  balancesAreLoading: state.vault.entities.accounts.balances.loading,
});

export default connect(mapStateToProps)(AccountsAutocomplete);
