import {themeColors} from "../theme";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import {NetworkNotice as NetworkNoticeInterface, NetworkNoticeReference as NetworkNoticeReferenceInterface} from "../../redux/slices/app";
import Button from "@mui/material/Button";
import UrlIcon from "../assets/img/url_icon.svg";

export interface NetworkNoticeProps {
  notice: NetworkNoticeInterface;
}

interface NetworkNoticeReferenceProps {
  reference: NetworkNoticeReferenceInterface;
}

function NetworkNoticeReference({ reference} : Readonly<NetworkNoticeReferenceProps>) {
  return (
    <Stack
      direction={'row'}
      justifyContent={'flex-start'}
      alignItems={'center'}
      sx={{
        height: '41px',
        maxHeight: '41px',
        width: '100%',
        boxShadow: '0 -1px 0 0 #ebedef',
      }}
    >
      <Button
        variant={'text'}
        component={'a'}
        target={'_blank'}
        href={reference.url}
        sx={{
          padding: '0',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          textAlign: 'left',
        }}
      >
        <Stack
          direction={'row'}
          spacing={'7px'}
          justifyContent={'flex-start'}
          alignItems={'center'}
          sx={{
            width: '100%',
          }}
        >
          <UrlIcon
            style={{
              flexShrink: 0,
            }}
          />
          <Typography
            variant={'subtitle2'}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            color={themeColors.primary}
          >
            {reference.title}
          </Typography>
        </Stack>
      </Button>
    </Stack>
  );
}

export default function NetworkNotice({notice}: Readonly<NetworkNoticeProps>) {
  return (
    <>
    <div
      style={{
        borderRadius: "8px",
        textDecoration: "none",
        boxSizing: "border-box",
        backgroundColor: notice.color || themeColors.bgLightGray,
      }}
    >
      <Stack direction={"row"}
        style={{
          padding: "10px 15px",
        }}
      >
        <Stack flexGrow={1}>
          <Typography variant={"subtitle2"} color={themeColors.black}>
            {notice.descriptionTitle}
          </Typography>
          <Typography fontSize={11}>{notice.descriptionContent}</Typography>
        </Stack>
      </Stack>
      <Stack
        style={{
          padding: "0 15px",
        }}
      >
        {notice.references?.map((reference) => (
          <NetworkNoticeReference key={reference.url} reference={reference} />
        ))}
      </Stack>
    </div>
  </>
  );
}
