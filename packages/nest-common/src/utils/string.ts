/**
 * 从给定字符集生成指定长度的随机字符串。
 *
 * @param length 字符数量。
 * @param chars 用于选取的字符集。
 * @returns 指定长度的随机字符串。
 */
export const randomString = (
  length: number,
  chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
) => {
  const maxPos = chars.length;
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
};
