import config from 'config';

/**
 * 检查 `config` 包是否包含指定键的值。
 *
 * @param key 配置键路径。
 * @returns 键已配置时为 `true`。
 */
export const hasConfig = (key: string) => config.has(key);

/**
 * 读取配置值，支持默认值与可选校验。
 *
 * @param key 配置键路径。
 * @param defaultValue 键缺失或校验失败时返回的默认值。
 * @param verify 可选谓词，用于接受或拒绝解析后的值。
 * @returns 配置值或 `defaultValue`。
 */
export const getConfig = <T = string>(
  key: string,
  defaultValue?: T,
  verify?: (value: unknown) => boolean
): T => {
  let value = config.has(key) ? config.get<T>(key) : defaultValue;
  if (verify && !verify(value)) value = defaultValue;

  return (value ?? defaultValue) as T;
};
