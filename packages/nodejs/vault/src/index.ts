export * from "./lib/VaultTeller";
export * from "./lib/core/common/values";
export * from "./lib/core/vault";
export * from "./lib/core/session";
export * from "./lib/core/network";
export * from "./lib/core/asset";
export * from "./lib/core/common/permissions";
export * from "./lib/core/common/protocols";
export * from "./lib/core/common/storage/AssetStorage";
export * from "./lib/core/common/storage/NetworkStorage";
export * from "./lib/errors";
export * from "./lib/constants";
export * from "./lib/core/common/protocols/Bridges";
export * from "./lib/core/vault/entities/RecoveryPhrase";

import type { IEncryptionService } from "./lib/core/common/encryption/IEncryptionService";
import type IVaultStore from "./lib/core/common/storage/IVaultStorage";
import type IStorage from "./lib/core/common/storage/IStorage";
import type IEntity from "./lib/core/common/IEntity";
import type { INetwork } from "./lib/core/common/protocols/INetwork";
import type { IAsset } from "./lib/core/common/protocols/IAsset";
import type { INetworkOptions } from "./lib/core/network/INetworkOptions";
import type { VaultOptions } from "./lib/VaultTeller";
import type {SignPersonalDataRequest, SignTypedDataRequest} from "./lib/core/common/protocols";
import type { AddHDWalletAccountExternalRequest } from "./lib/VaultTeller";
import {
  PocketNetworkProtocolTransaction,
  CosmosFeeRequestOption,
} from "./lib/core/common/protocols";

export type {
  IEncryptionService,
  IVaultStore,
  IStorage,
  IEntity,
  INetworkOptions,
  INetwork,
  IAsset,
  VaultOptions,
  SignTypedDataRequest,
  SignPersonalDataRequest,
  AddHDWalletAccountExternalRequest,
  PocketNetworkProtocolTransaction,
  CosmosFeeRequestOption,
};
