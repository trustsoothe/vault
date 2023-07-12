import type { RootState } from "../../redux/store";
import React, { useCallback, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import { Permission } from "@poktscan/keyring";
import { useAppDispatch } from "../../hooks/redux";
import { ConnectionRequest } from "../../redux/slices/app";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { useLocation } from "react-router-dom";

const mockAccounts = [
  "2b758f936e45aaebc87db14a9f0e51b51b6653b6",
  "266c4fc7c61a7a73dbfe04e0e67cc923848dea21",
  "25879ff86bd06d2cb34316d8380dd0ef20266dd0",
  "1d72b77c04a4a4301dc644e8d3b2710bcd53a4fa",
  "1cf01f48a52970c71caefb8b44b6de08bfd16c28",
  "1b5419bf1149a5de10f986918912aa1aa85f3cf2",
  "17fea60985c0a37b46adc8cadec5c1d70a78db94",
];

const Request: React.FC = () => {
  const currentRequest: ConnectionRequest = useLocation()?.state;
  const [selectedAccountsMap, setSelectedAccountsMap] = useState<
    Record<string, boolean>
  >({});
  const [selectedCreateAccounts, setSelectedCreateAccounts] = useState(false);

  const toggleSelectCreateAccount = useCallback(() => {
    setSelectedCreateAccounts((prevState) => !prevState);
  }, []);

  const toggleSelectAccount = useCallback((address: string) => {
    setSelectedAccountsMap((prevState) => {
      const newAddressValue = prevState[address] ? undefined : true;
      return { ...prevState, [address]: newAddressValue };
    });
  }, []);

  const isAllSelected = useMemo(() => {
    const selectedAccountsCount = Object.keys(selectedAccountsMap).filter(
      (item) => item
    ).length;
    return (
      selectedCreateAccounts && selectedAccountsCount === mockAccounts.length
    );
  }, [selectedCreateAccounts, selectedAccountsMap]);

  const toggleSelectAll = useCallback(() => {
    setSelectedCreateAccounts(!isAllSelected);
    setSelectedAccountsMap(() => {
      if (isAllSelected) {
        return {};
      } else {
        return mockAccounts.reduce(
          (acc, address) => ({ ...acc, [address]: true }),
          {}
        );
      }
    });
  }, [isAllSelected]);

  const sendResponse = useCallback(
    async (accepted: boolean) => {
      if (currentRequest) {
        const permissions: Permission[] = [];

        if (accepted) {
          if (selectedCreateAccounts) {
            permissions.push({
              resource: "account",
              action: "create",
              identities: ["*"],
            });
          }

          const identities: string[] = [];

          for (const address in selectedAccountsMap) {
            if (selectedAccountsMap[address]) {
              identities.push(address);
            }
          }

          if (identities.length) {
            permissions.push({
              resource: "account",
              action: "read",
              identities,
            });

            permissions.push({
              resource: "transaction",
              action: "sign",
              identities,
            });
          }
        }

        await AppToBackground.answerConnection({
          accepted,
          request: currentRequest,
          permissions: accepted ? permissions : null,
        });
      }
    },
    [currentRequest, selectedCreateAccounts, selectedAccountsMap]
  );

  if (!currentRequest) {
    return null;
  }

  return (
    <Stack
      spacing={"10px"}
      height={1}
      flexGrow={1}
      // pb={"15px"}
    >
      <Typography fontSize={20} textAlign={"center"}>
        Connection Request from:
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"10px"}
        width={1}
      >
        <img
          width={24}
          height={24}
          alt={"favicon-ico"}
          src={currentRequest.faviconUrl}
        />
        <Typography
          fontSize={16}
          fontWeight={500}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
          overflow={"hidden"}
          maxWidth={300}
          sx={{ textDecoration: "underline" }}
        >
          {currentRequest.origin}
        </Typography>
      </Stack>
      <Typography fontSize={12} marginTop={"15px!important"}>
        Select the permissions and accounts you want to grant:
      </Typography>
      <Stack direction={"row"} alignItems={"center"} height={18}>
        <Checkbox
          size={"small"}
          checked={isAllSelected}
          onClick={toggleSelectAll}
        />
        <Typography fontSize={12}>Select All</Typography>
      </Stack>
      <Stack
        flexGrow={1}
        border={"1px solid lightgray"}
        overflow={"auto"}
        padding={"5px"}
        mb={"10px"}
        borderRadius={"6px"}
        boxSizing={"border-box"}
        sx={{
          "& p": {
            fontSize: "12px!important",
          },
        }}
      >
        <Stack
          padding={"5px"}
          spacing={"10px"}
          direction={"row"}
          alignItems={"center"}
          height={50}
          width={1}
          boxSizing={"border-box"}
        >
          <Checkbox
            size={"small"}
            sx={{ paddingX: 0 }}
            checked={selectedCreateAccounts}
            onClick={toggleSelectCreateAccount}
          />
          <Stack width={1}>
            <Typography fontWeight={600}>Create new Accounts</Typography>
            <Typography
              sx={{ fontSize: "10px!important" }}
              component={"span"}
              color={"dimgrey"}
            >
              Allow the site to request for the creation of new accounts.
            </Typography>
          </Stack>
        </Stack>
        {mockAccounts.map((address, index) => {
          return (
            <Stack
              padding={"5px"}
              spacing={"10px"}
              key={address}
              borderTop={"1px solid lightgray"}
              direction={"row"}
              alignItems={"center"}
              height={50}
              width={1}
              boxSizing={"border-box"}
            >
              <Checkbox
                size={"small"}
                sx={{ paddingX: 0 }}
                checked={selectedAccountsMap[address] || false}
                onClick={() => toggleSelectAccount(address)}
              />
              <Stack width={1}>
                <Stack
                  direction={"row"}
                  spacing={"5px"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  width={1}
                >
                  <Typography fontWeight={600}>Account {index + 1}</Typography>
                  <Typography
                    sx={{ fontSize: "10px!important" }}
                    component={"span"}
                    color={"dimgrey"}
                  >
                    2 POKT
                  </Typography>
                </Stack>
                <Typography>{address}</Typography>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
      <Typography fontSize={10}>
        This site will be able to see the address and suggest transactions of
        the selected accounts. Before doing any operation, you will need to
        confirm it.
      </Typography>
      <Stack direction={"row"} spacing={"15px"} marginTop={"15px!important"}>
        <Button
          fullWidth
          variant={"outlined"}
          sx={{
            textTransform: "none",
            fontWeight: 600,
          }}
          onClick={() => sendResponse(false)}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant={"contained"}
          sx={{
            textTransform: "none",
            backgroundColor: "rgb(29, 138, 237)",
            fontWeight: 600,
          }}
          onClick={() => {
            sendResponse(true);
          }}
        >
          Accept
        </Button>
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    sessionId: state.vault.vaultSession.id,
    externalRequests: state.app.externalRequests,
  };
};

export default connect(mapStateToProps)(Request);
