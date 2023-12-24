import { SecretStorageKeyDescriptionAesV1 } from "matrix-js-sdk/lib/secret-storage";

const secretStorage = {} as Record<string, Uint8Array>;

export const storePrivateKey = (keyId: string, privateKey: Uint8Array) =>
  (secretStorage[keyId] = privateKey);

export const hasPrivateKey = (keyId: string) =>
  secretStorage[keyId] instanceof Uint8Array;

export const getPrivateKey = (keyId: string) => secretStorage[keyId];

export const deletePrivateKey = (keyId: string) => {
  delete secretStorage[keyId];
};

export const clearSecretStorageKeys = () => {
  for (const key of Object.keys(secretStorage)) {
    delete secretStorage[key];
  }
};

type Keys = {
  keys: Record<string, SecretStorageKeyDescriptionAesV1>;
};

const getSecretStorageKey = async (
  keys: Keys,
  name: string,
): Promise<null | [string, Uint8Array]> => {
  const keyIds = Object.keys(keys.keys);
  const keyId = keyIds.find(hasPrivateKey);

  if (!keyId) return null;

  const privateKey = getPrivateKey(keyId);
  if (!privateKey) return null;

  return [keyId, privateKey];
};

const cacheSecretStorageKey = (
  keyId: string,
  keyInfo: SecretStorageKeyDescriptionAesV1,
  privateKey: Uint8Array,
) => (secretStorage[keyId] = privateKey);

export const cryptoCallbacks = {
  getSecretStorageKey,
  cacheSecretStorageKey,
};
