import type { SerializedAccountReference } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { roundAndSeparate } from "../../utils/ui";
import RowSpaceBetween from "../common/RowSpaceBetween";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface AccountFromRequestProps {
  account: SerializedAccountReference;
  balancesMapById: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
  selectedChainByNetwork: RootState["app"]["selectedChainByNetwork"];
  balancesAreLoading: boolean;
}

const AccountFromRequest: React.FC<AccountFromRequestProps> = ({
  balancesMapById,
  account,
  balancesAreLoading,
  selectedChainByNetwork,
}) => {
  const theme = useTheme();
  const symbol = account.asset.symbol;

  const accountBalance = balancesMapById[account?.id]?.amount || 0;
  const protocol = account?.asset?.protocol;

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
        value={labelByProtocolMap[protocol] || protocol}
      />
      <RowSpaceBetween
        label={"Chain ID"}
        value={
          labelByChainID[selectedChainByNetwork[protocol]] ||
          selectedChainByNetwork[protocol]
        }
      />
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  balancesMapById: state.vault.entities.accounts.balances.byId,
  balancesAreLoading: state.vault.entities.accounts.balances.loading,
  selectedChainByNetwork: state.app.selectedChainByNetwork,
});

export default connect(mapStateToProps)(AccountFromRequest);
