import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { roundAndSeparate } from "../../utils/ui";
import RowSpaceBetween from "../common/RowSpaceBetween";
import { protocolsAreEquals } from "../../utils/networkOperations";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface AccountFromRequestProps {
  account: SerializedAccountReference;
  assets: RootState["vault"]["entities"]["assets"]["list"];
  balancesMapById: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
  balancesAreLoading: boolean;
}

const AccountFromRequest: React.FC<AccountFromRequestProps> = ({
  balancesMapById,
  account,
  balancesAreLoading,
  assets,
}) => {
  const theme = useTheme();
  const symbol = account
    ? assets.find((asset) =>
        protocolsAreEquals(asset.protocol, account.protocol)
      )?.symbol || ""
    : "";

  const accountBalance = balancesMapById[account?.id]?.amount || 0;

  return (
    <Stack
      height={100}
      paddingX={1}
      paddingTop={1.1}
      paddingBottom={0.5}
      boxSizing={"border-box"}
      marginTop={"0px!important"}
      borderTop={`1px solid ${theme.customColors.dark25}`}
    >
      <RowSpaceBetween label={"From Account"} value={account?.name} />
      <RowSpaceBetween
        label={`Balance ${symbol}`}
        value={
          account ? (
            balancesAreLoading ? (
              <Skeleton variant={"rectangular"} width={75} height={15} />
            ) : (
              roundAndSeparate(accountBalance, 2, "0")
            )
          ) : (
            "-"
          )
        }
      />
      <RowSpaceBetween
        label={"Protocol"}
        value={
          labelByProtocolMap[account?.protocol?.name] || account?.protocol?.name
        }
      />
      <RowSpaceBetween
        label={"Chain ID"}
        value={
          labelByChainID[account?.protocol?.chainID] ||
          account?.protocol?.chainID
        }
      />
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  assets: state.vault.entities.assets.list,
  balancesMapById: state.vault.entities.accounts.balances.byId,
  balancesAreLoading: state.vault.entities.accounts.balances.loading,
});
export default connect(mapStateToProps)(AccountFromRequest);
