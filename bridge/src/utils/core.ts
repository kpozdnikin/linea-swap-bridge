import { BigNumber } from "bignumber.js";

const MAX_BITS = {
  eth: 256,
  arbitrum: 256,
  zksync: 35,
  starknet: 256,
  polygon: 256,
  optimism: 256,
  immutablex: 28,
  loopring: 256,
  metis: 256,
  dydx: 28,
  bnbchain: 256,
  nova: 256,
  arbitrum_nova: 256,
  polygon_zkevm: 256,
  linea: 256,
};

export const CHAIN_INDEX: Record<number, string> = {
  1: "eth",
  2: "arbitrum",
  22: "arbitrum",
  3: "zksync",
  33: "zksync",
  4: "starknet",
  44: "starknet",
  5: "eth",
  6: "polygon",
  66: "polygon",
  7: "optimism",
  77: "optimism",
  8: "immutablex",
  88: "immutablex",
  9: "loopring",
  99: "loopring",
  10: "metis",
  510: "metis",
  11: "dydx",
  511: "dydx",
  12: "zkspace",
  512: "zkspace",
  13: "boba",
  513: "boba",
  14: "zksync2", // mainnet
  514: "zksync2", // test net
  15: "bnbchain",
  515: "bnbchain",
  16: "arbitrum_nova",
  516: "arbitrum_nova",
  17: "polygon_zkevm",
  517: "polygon_zkevm",
};

export const SIZE_OP = {
  P_NUMBER: 4,
};

export function isLimitNumber(chain: string | number) {
  if (chain === 3 || chain === 33 || chain === "zksync") {
    return true;
  }
  if (chain === 8 || chain === 88 || chain === "immutablex") {
    return true;
  }
  if (chain === 11 || chain === 511 || chain === "dydx") {
    return true;
  }
  return false;
}

function isLPChain(chain) {
  if (chain === 9 || chain === 99 || chain === "loopring") {
    return true;
  }
  return false;
}

export function isAmountValid(chain, amount) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: "The chain did not support",
    };
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    };
  }

  const validDigit = AmountValidDigits(chain, amount); // 10 11
  const amountLength = amount.toString().length;
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: "Amount size must be greater than pNumberSize",
    };
  }

  let rAmount = amount;
  if (isLimitNumber(chain)) {
    rAmount = removeSidesZero(amount.toString());
  }
  if (!isAmountInRegion(rAmount, chain)) {
    return {
      state: false,
      error: "Amount exceeds the spending range",
    };
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    const zkAmount = amount.toString().slice(0, validDigit);
    const op_text = zkAmount.slice(-SIZE_OP.P_NUMBER);
    if (Number(op_text) === 0) {
      return {
        state: true,
      };
    }
    return {
      state: false,
      error: "Insufficient number of flag bits",
    };
  } else {
    const op_text = amount.toString().slice(-SIZE_OP.P_NUMBER);
    if (Number(op_text) === 0) {
      return {
        state: true,
      };
    }
    return {
      state: false,
      error: "Insufficient number of flag bits",
    };
  }
}

export function getToAmountFromUserAmount(userAmount, selectMakerInfo, isWei) {
  const toAmount_tradingFee = new BigNumber(userAmount).minus(new BigNumber(selectMakerInfo.tradingFee));
  // accessLogger.info('toAmount_tradingFee =', toAmount_tradingFee.toString())
  const gasFee = toAmount_tradingFee.multipliedBy(new BigNumber(selectMakerInfo.gasFee)).dividedBy(new BigNumber(1000));
  // accessLogger.info('gasFee =', gasFee.toString())
  const digit = selectMakerInfo.precision === 18 ? 5 : 2;
  // accessLogger.info('digit =', digit)
  const gasFee_fix = gasFee.decimalPlaces(digit, BigNumber.ROUND_UP);
  // accessLogger.info('gasFee_fix =', gasFee_fix.toString())
  const toAmount_fee = toAmount_tradingFee.minus(gasFee_fix);
  // accessLogger.info('toAmount_fee =', toAmount_fee.toString())
  if (!toAmount_fee || isNaN(Number(toAmount_fee))) {
    return 0;
  }
  if (isWei) {
    return toAmount_fee.multipliedBy(new BigNumber(10 ** selectMakerInfo.precision));
  } else {
    return toAmount_fee;
  }
}
export function getTAmountFromRAmount(chain, amount, pText) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: "The chain did not support",
    };
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    };
  }
  if (pText.length > SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: "the pText size invalid",
    };
  }

  const validDigit = AmountValidDigits(chain, amount); // 10 11
  const amountLength = amount.toString().length;
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: "Amount size must be greater than pNumberSize",
    };
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    const tAmount = amount.toString().slice(0, validDigit - pText.length) + pText + amount.toString().slice(validDigit);
    return {
      state: true,
      tAmount: tAmount,
    };
  } else if (isLPChain(chain)) {
    return {
      state: true,
      tAmount: amount + "",
    };
  } else {
    const tAmount = amount.toString().slice(0, amountLength - pText.length) + pText;
    return {
      state: true,
      tAmount: tAmount,
    };
  }
}

export function getPTextFromTAmount(chain, amount) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: "",
    };
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    };
  }
  //Get the effective number of digits
  const validDigit = AmountValidDigits(chain, amount); // 10 11
  const amountLength = amount.toString().length;
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: "Amount size must be greater than pNumberSize",
    };
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    const zkAmount = amount.toString().slice(0, validDigit);
    const op_text = zkAmount.slice(-SIZE_OP.P_NUMBER);
    return {
      state: true,
      pText: op_text,
    };
  } else {
    const op_text = amount.toString().slice(-SIZE_OP.P_NUMBER);
    return {
      state: true,
      pText: op_text,
    };
  }
}

export function getRAmountFromTAmount(chain, amount) {
  let pText = "";
  for (let index = 0; index < SIZE_OP.P_NUMBER; index++) {
    pText = pText + "0";
  }
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: "The chain did not support",
    };
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    };
  }

  const validDigit = AmountValidDigits(chain, amount); // 10 11
  const amountLength = amount.toString().length;
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: "Amount size must be greater than pNumberSize",
    };
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    const rAmount = amount.slice(0, validDigit - SIZE_OP.P_NUMBER) + pText + amount.slice(validDigit);
    return {
      state: true,
      rAmount: rAmount,
    };
  } else {
    const rAmount = amount.slice(0, amountLength - SIZE_OP.P_NUMBER) + pText;
    return {
      state: true,
      rAmount: rAmount,
    };
  }
}

function isChainSupport(chain) {
  if (parseInt(chain) == chain) {
    if (CHAIN_INDEX[chain] && MAX_BITS[CHAIN_INDEX[chain]]) {
      return true;
    }
  } else {
    if (MAX_BITS[chain.toLowerCase()]) {
      return true;
    }
  }
  return false;
}

/**
 * 0 ~ (2 ** N - 1)
 * @param { any } chain
 * @returns { any }
 */
function AmountRegion(chain: string | number): any {
  if (!isChainSupport(chain)) {
    return {
      error: "The chain did not support",
    };
  }
  if (typeof chain === "number") {
    const max = new BigNumber(2 ** MAX_BITS[CHAIN_INDEX[chain]] - 1);
    return {
      min: new BigNumber(0),
      max: max,
    };
  } else if (typeof chain === "string") {
    const max = new BigNumber(2 ** MAX_BITS[chain.toLowerCase()] - 1);
    return {
      min: new BigNumber(0),
      max: max,
    };
  }
}

function AmountMaxDigits(chain) {
  const amountRegion = AmountRegion(chain);
  if (amountRegion?.error) {
    return amountRegion;
  }
  return amountRegion.max.toFixed().length;
}

function AmountValidDigits(chain, amount) {
  const amountMaxDigits = AmountMaxDigits(chain);
  if (amountMaxDigits.error) {
    return amountMaxDigits.error;
  }
  const amountRegion = AmountRegion(chain);

  const ramount = removeSidesZero(amount.toString());

  if (ramount.length > amountMaxDigits) {
    return "amount is inValid";
  }
  if (ramount > amountRegion.max.toFixed()) {
    return amountMaxDigits - 1;
  } else {
    return amountMaxDigits;
  }
}

function removeSidesZero(param) {
  if (typeof param !== "string") {
    return "param must be string";
  }
  return param.replace(/^0+(\d)|(\d)0+$/gm, "$1$2");
}

function isAmountInRegion(amount: number, chain: string | number) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: "The chain did not support",
    };
  }
  const amountRegion = AmountRegion(chain);
  if (amountRegion.error) {
    return false;
  }
  //   accessLogger.info('amountRegion_min', amountRegion.min.toString())
  //   accessLogger.info('amountRegion_max', amountRegion.max.toString())
  if (new BigNumber(amount).gte(amountRegion.min) && new BigNumber(amount).lte(amountRegion.max)) {
    return true;
  }
  return false;
}
