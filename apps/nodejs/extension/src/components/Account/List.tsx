import React, { useCallback, useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import { useNavigate } from "react-router-dom";
import {
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
} from "../../constants/routes";
import { Skeleton } from "@mui/material";

const mockAccounts = [
  "2b758f936e45aaebc87db14a9f0e51b51b6653b6",
  "266c4fc7c61a7a73dbfe04e0e67cc923848dea21",
  "25879ff86bd06d2cb34316d8380dd0ef20266dd0",
  "1d72b77c04a4a4301dc644e8d3b2710bcd53a4fa",
  "1cf01f48a52970c71caefb8b44b6de08bfd16c28",
  "1b5419bf1149a5de10f986918912aa1aa85f3cf2",
  "17fea60985c0a37b46adc8cadec5c1d70a78db94",
];

const AccountList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoadingTokens(false), 3000);

    return () => clearTimeout(timeout);
  }, []);

  const onChangeSearchText = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    },
    []
  );

  const onClickImport = useCallback(() => {
    navigate(IMPORT_ACCOUNT_PAGE);
  }, [navigate]);

  const onClickNew = useCallback(() => {
    navigate(CREATE_ACCOUNT_PAGE);
  }, [navigate]);

  return (
    <Stack height={1}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        marginY={"5px"}
      >
        <Typography variant={"h6"}>Accounts</Typography>
        <Stack direction={"row"} sx={{ "& button": { textTransform: "none" } }}>
          <Button onClick={onClickImport}>Import</Button>
          <Button onClick={onClickNew}>New</Button>
        </Stack>
      </Stack>
      <TextField
        fullWidth
        size={"small"}
        value={searchText}
        onChange={onChangeSearchText}
        placeholder={"Search by name / address"}
        sx={{
          "& .MuiInputBase-root": {
            height: 35,
            minHeight: 35,
            maxHeight: 35,
          },
          "& input": {
            fontSize: 14,
          },
        }}
      />
      <Stack
        flexGrow={1}
        // border={"1px solid lightgray"}
        overflow={"auto"}
        paddingX={"5px"}
        marginTop={"10px"}
        boxSizing={"border-box"}
        sx={{
          "& p": {
            fontSize: "12px!important",
          },
        }}
      >
        {mockAccounts.map((address, index) => {
          return (
            <Stack
              paddingY={"10px"}
              paddingX={"5px"}
              spacing={"5px"}
              key={address}
              borderTop={index === 0 ? undefined : "1px solid lightgray"}
              width={1}
              boxSizing={"border-box"}
            >
              <Stack
                direction={"row"}
                spacing={"5px"}
                alignItems={"center"}
                // justifyContent={"space-between"}
                width={1}
              >
                <Typography fontWeight={600}>Account {index + 1}</Typography>
                <Typography fontWeight={600} marginX={"3px"}>
                  •
                </Typography>
                {isLoadingTokens ? (
                  <Skeleton height={15} width={75} variant={"rectangular"} />
                ) : (
                  <Typography
                    sx={{ fontSize: "10px!important" }}
                    component={"span"}
                    color={"dimgrey"}
                    fontWeight={600}
                  >
                    2 POKT
                  </Typography>
                )}
              </Stack>
              <Typography>{address}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default AccountList;
