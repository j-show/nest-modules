class Converter {
  private srcAlphabet: string;
  private dstAlphabet: string;

  constructor(src: string, dest: string) {
    if (!src.length || !dest.length) throw new Error('Bad alphabet');

    this.srcAlphabet = src;
    this.dstAlphabet = dest;
  }

  /** 检查每个字符是否存在于源字母表中。 */
  public isValid(chars: string) {
    for (let i = 0; i < chars.length; ++i) {
      if (this.srcAlphabet.indexOf(chars[i]) === -1) return false;
    }

    return true;
  }

  /** 将源字母表中的数字字符串转换为目标字母表。 */
  public convert(number: string) {
    const numberMap: Record<string, number> = {};
    const fromBase = this.srcAlphabet.length;
    const toBase = this.dstAlphabet.length;

    if (!this.isValid(number)) {
      throw new Error(
        `Number "${number}" contains of non-alphabetic digits (${this.srcAlphabet})`
      );
    }

    if (this.srcAlphabet === this.dstAlphabet) {
      return number;
    }

    let length = number.length;
    let result = '';
    for (let i = 0; i < length; i++)
      numberMap[i.toString()] = this.srcAlphabet.indexOf(number[i]);

    let newlen = 0;
    do {
      let divide = 0;

      // 反复除法在任意进制间转换，无需大整数运算。
      for (let i = 0; i < length; i++) {
        divide = divide * fromBase + (numberMap[i.toString()] ?? 0);

        if (divide >= toBase) {
          numberMap[newlen.toString()] = Math.floor(divide / toBase);
          newlen++;
          divide = divide % toBase;
        } else if (newlen > 0) {
          numberMap[newlen.toString()] = 0;
          newlen++;
        }
      }

      length = newlen;
      result = this.dstAlphabet.slice(divide, divide + 1).concat(result);
    } while (newlen !== 0);

    return result;
  }
}

/** `anyBase` 支持的内置源字母表。 */
export const ANY_BASE = {
  BIN: '01',
  OCT: '01234567',
  DEC: '0123456789',
  HEX: '0123456789abcdef'
} as const;

/**
 * 创建从内置字母表到自定义目标字母表的转换器。
 *
 * @param type 内置源字母表键。
 * @param dstAlphabet 转换输出使用的目标字母表。
 * @returns 将源字母表字符串转为小写目标文本的函数。
 * @throws Error 字母表为空或输入含源字母表外字符时。
 */
export const anyBase = (type: keyof typeof ANY_BASE, dstAlphabet: string) => {
  const converter = new Converter(ANY_BASE[type], dstAlphabet);

  return (chars: string) => converter.convert(chars) as Lowercase<string>;
};
