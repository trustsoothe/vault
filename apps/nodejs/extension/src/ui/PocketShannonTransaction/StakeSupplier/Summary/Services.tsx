import {
  ConfigOptions,
  RPCType,
  SupplierServiceConfig,
} from "../../BaseTransaction";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import Button from "@mui/material/Button";
import { themeColors } from "../../../theme";
import ExpandIcon from "../../../assets/img/expand_select_icon.svg";
import { AccountInfoFromAddress } from "../../../components/AccountInfo";
import { SupportedProtocols } from "@soothe/vault";

function getRpcLabel(rpcType: RPCType) {
  switch (rpcType) {
    case RPCType.GRPC:
      return "gRPC";
    case RPCType.WEBSOCKET:
      return "WebSocket";
    case RPCType.JSON_RPC:
      return "JSON-RPC";
    case RPCType.REST:
      return "REST";
    default:
      return "Unknown";
  }
}

function getConfigLabel(config: ConfigOptions) {
  switch (config) {
    case ConfigOptions.TIMEOUT:
      return "Timeout";
    default:
      return "Unknown";
  }
}

interface SupplierServiceItemProps {
  service: SupplierServiceConfig;
}

function SupplierServiceItem({ service }: SupplierServiceItemProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Stack
      borderBottom={`1px solid ${themeColors.light_gray1}`}
      paddingY={0.5}
      sx={{
        paddingX: 0.8,
      }}
    >
      <Button
        disableRipple={true}
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          height: 24,
          gap: 0.5,
          alignItems: "center",
          justifyContent: "space-between",
          padding: 0,
          color: themeColors.black,
          "& path": {
            fill: themeColors.black,
          },
          "& svg": {
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.1s ease-in-out",
          },
          "&:hover": {
            backgroundColor: themeColors.bgLightGray,
          },
        }}
      >
        <span>{service.serviceId}</span>
        <ExpandIcon />
      </Button>
      {expanded && (
        <Stack
          border={`1px solid ${themeColors.light_gray}`}
          padding={1}
          borderRadius={1}
          marginTop={0.4}
        >
          <Typography fontSize={11}>Endpoints</Typography>
          <Stack component={"ul"} margin={0} paddingLeft={1.2}>
            {service.endpoints.map((endpoint) => (
              <Stack margin={0} component={"li"} key={endpoint.url} width={1}>
                <Stack
                  direction={"row"}
                  alignItems={"center"}
                  spacing={0.6}
                  width={1}
                >
                  <Typography>-</Typography>
                  <Stack
                    width={1}
                    direction={"row"}
                    alignItems={"center"}
                    spacing={1.2}
                  >
                    <Typography fontSize={10} noWrap={true}>
                      {endpoint.url}
                    </Typography>
                    <Stack
                      paddingX={0.4}
                      paddingY={0.2}
                      border={`1px solid ${themeColors.light_gray}`}
                      borderRadius={"4px"}
                      marginRight={"5px!important"}
                    >
                      <Typography fontSize={9} whiteSpace={"nowrap"}>
                        {getRpcLabel(endpoint.rpcType)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
                {endpoint.configs.length > 0 && (
                  <>
                    <Typography fontSize={10} marginLeft={1.2}>
                      Config
                    </Typography>
                    <Stack component={"ul"} margin={0} paddingLeft={2.4}>
                      {endpoint.configs.map((config) => (
                        <Stack margin={0} component={"li"} key={config.key}>
                          <Stack
                            direction={"row"}
                            alignItems={"center"}
                            spacing={0.6}
                            width={1}
                          >
                            <Typography>-</Typography>
                            <Stack
                              width={1}
                              spacing={0.6}
                              direction={"row"}
                              alignItems={"center"}
                            >
                              <Typography fontSize={10}>
                                {getConfigLabel(config.key)}:
                              </Typography>
                              <Typography fontSize={10} noWrap={true}>
                                {config.value}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            ))}
          </Stack>
          {service.revShare.length > 0 && (
            <>
              <Typography fontSize={11} marginY={0.4}>
                Rev Share
              </Typography>
              <Stack component={"ul"} margin={0} paddingLeft={1.2}>
                {service.revShare.map((revShare) => (
                  <Stack margin={0} component={"li"} key={revShare.address}>
                    <Stack
                      direction={"row"}
                      alignItems={"center"}
                      spacing={0.6}
                      width={1}
                    >
                      <Typography>-</Typography>
                      <Stack
                        width={1}
                        spacing={0.6}
                        direction={"row"}
                        alignItems={"center"}
                      >
                        <Stack
                          sx={{
                            transform: "scale(0.8)",
                            marginLeft: "-8px!important",
                          }}
                        >
                          <AccountInfoFromAddress
                            address={revShare.address}
                            protocol={SupportedProtocols.Cosmos}
                          />
                        </Stack>
                        <Stack
                          paddingX={0.4}
                          paddingY={0.2}
                          border={`1px solid ${themeColors.light_gray}`}
                          borderRadius={"4px"}
                          marginRight={"5px!important"}
                        >
                          <Typography fontSize={9} whiteSpace={"nowrap"}>
                            {revShare.revSharePercentage}%
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}

interface SupplierServicesSummaryProps {
  services: Array<SupplierServiceConfig>;
}

export default function SupplierServicesSummary({
  services,
}: SupplierServicesSummaryProps) {
  return (
    <Stack width={1} marginLeft={-9} marginTop={1.8}>
      {services.map((service) => (
        <SupplierServiceItem key={service.serviceId} service={service} />
      ))}
    </Stack>
  );
}
