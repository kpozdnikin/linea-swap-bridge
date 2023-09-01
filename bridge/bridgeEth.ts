import { BigNumberish, ethers, utils } from "ethers";
import { delay, equalsIgnoreCase } from "../utils";
import type { BridgeChain, BridgeToken, ExpandMakerInfo, TransactionTransferOptions } from "./types";
import { CHAIN_CONFIG } from "./config";
import { BRIDGE_TOKENS } from "./constants";
import * as core from "./core";
import { makerList as makerList_mainnet } from "./maker_list.mainnet";
import { makerList as makerList_testnet } from "./maker_list.testnet";

const getMakerList = async (network: "Mainnet" | "Testnet") => {
  if (network === "Mainnet") {
    return makerList_mainnet;
  } else {
    return makerList_testnet;
  }
};

export const expandMakerInfo = (
  makerListItem: (typeof makerList_mainnet)[0] | (typeof makerList_testnet)[0],
): ExpandMakerInfo[] => [
  {
    makerAddress: makerListItem.makerAddress,
    fromChainId: makerListItem.c1ID,
    toChainId: makerListItem.c2ID,
    fromChainName: makerListItem.c1Name,
    toChainName: makerListItem.c2Name,
    fromTokenAddress: makerListItem.t1Address,
    toTokenAddress: makerListItem.t2Address,
    tokenName: makerListItem.tName,
    minPrice: makerListItem.c1MinPrice,
    maxPrice: makerListItem.c1MaxPrice,
    precision: makerListItem.precision,
    avalibleDeposit: makerListItem.c1AvalibleDeposit,
    tradingFee: makerListItem.c1TradingFee,
    gasFee: makerListItem.c1GasFee,
    avalibleTimes: makerListItem.c1AvalibleTimes,
  },
  {
    makerAddress: makerListItem.makerAddress,
    fromChainId: makerListItem.c2ID,
    toChainId: makerListItem.c1ID,
    fromChainName: makerListItem.c2Name,
    toChainName: makerListItem.c1Name,
    fromTokenAddress: makerListItem.t2Address,
    toTokenAddress: makerListItem.t1Address,
    tokenName: makerListItem.tName,
    minPrice: makerListItem.c2MinPrice,
    maxPrice: makerListItem.c2MaxPrice,
    precision: makerListItem.precision,
    avalibleDeposit: makerListItem.c2AvalibleDeposit,
    tradingFee: makerListItem.c2TradingFee,
    gasFee: makerListItem.c2GasFee,
    avalibleTimes: makerListItem.c2AvalibleTimes,
  },
];

export const getTargetMakerInfo = async (token: BridgeToken, fromChain: BridgeChain, toChain: BridgeChain) => {
  const makerList = await getMakerList("Mainnet");

  // Use map to maintain type deduction
  const targets = makerList
    .map((item) => {
      const expand = expandMakerInfo(item);

      // Normal
      if (
        expand[0].fromChainId === fromChain.id &&
        expand[0].toChainId === toChain.id &&
        equalsIgnoreCase(expand[0].fromTokenAddress, token.address)
      ) {
        return expand[0];
      }

      // Reverse
      if (
        expand[1].fromChainId === fromChain.id &&
        expand[1].toChainId === toChain.id &&
        equalsIgnoreCase(expand[1].fromTokenAddress, token.address)
      ) {
        return expand[1];
      }

      return undefined;
    })
    .filter((item) => item !== undefined);

  if (targets.length < 1) {
    return { success: false, error: "Orbiter cannot find target maker info!" };
  }

  // Only return first. Normally there is only one record here
  return { success: true, result: targets[0] };
};

async function waitForBridgeCompletion(destinationWallet: ethers.Wallet, expectedAmount: ethers.BigNumber) {
  let timeout = 1000 * 60 * 60; // 1 hour in milliseconds

  const checkInterval = 1000 * 60; // Check every 1 minute

  while (timeout > 0) {
    const balance = await destinationWallet.getBalance();
    if (balance.gte(expectedAmount)) {
      console.log("Tokens successfully bridged!");

      return;
    }

    await delay(checkInterval);

    timeout -= checkInterval;
  }

  return { success: false, error: "Timed out waiting for tokens to bridge" };
}

export const getAmounts = async (token, fromChain, toChain, amountHm) => {
  const targetMakerInfo = await getTargetMakerInfo(token, fromChain, toChain);

  if (!targetMakerInfo?.success) {
    return { success: false, error: "Cannot fetch target maker info" };
  }

  const { tradingFee, precision, minPrice, maxPrice } = targetMakerInfo.result;
  // Check minPrice, maxPrice
  if (amountHm < minPrice) {
    return {
      success: false,
      error: `Orbiter get amounts failed: amount less than minPrice(${minPrice}), token: ${token.name}, fromChain: ${fromChain.name}, toChain: ${toChain.name}`,
    };
  }

  if (amountHm > maxPrice) {
    return {
      success: false,
      error: `Orbiter get amounts failed: amount greater than maxPrice(${maxPrice}), token: ${token.name}, fromChain: ${fromChain.name}, toChain: ${toChain.name}`,
    };
  }

  const amount = utils.parseUnits(Number(amountHm).toFixed(precision), precision);
  const userAmount = amount.add(utils.parseUnits(tradingFee + "", precision));

  const receiveAmountHm = core
    .getToAmountFromUserAmount(utils.formatUnits(userAmount, precision), targetMakerInfo, false)
    .toString();

  const payText = 9000 + Number(toChain.id) + "";
  const result = core.getTAmountFromRAmount(fromChain.id, userAmount, payText);

  if (!result.state) {
    return {
      success: false,
      error: `Obirter get total amount failed! Please check if the amount matches the rules! ${result.error || ""}`,
    };
  }

  const payAmount = ethers.BigNumber.from(result.tAmount + "");
  const payAmountHm = utils.formatUnits(payAmount, precision);

  return { payText, payAmount, payAmountHm, receiveAmountHm };
};

export const getTransGasPrice = async (
  estimator: () => Promise<ethers.BigNumber>,
  defaultGasPrice: BigNumberish = 1,
) => {
  let gasPrice = defaultGasPrice;

  try {
    gasPrice = await estimator();
  } catch (err) {
    console.error("getTransGasPrice error: ", err);
  }

  return gasPrice;
};

export const getTransferGasLimit = async (
  estimator: () => Promise<ethers.BigNumber>,
  defaultGasLimit: BigNumberish = 55000,
) => {
  let gasLimit = ethers.BigNumber.from(defaultGasLimit);

  try {
    gasLimit = await estimator();
  } catch (err) {
    console.error("getTransferGasLimit error: ", err);
  }

  return gasLimit;
};

// TODO - show amounts and fee
export const bridgeEth = async (fromChainName: string, toChainName: string, amount: string, privateKey: string) => {
  const fromChain = CHAIN_CONFIG[fromChainName];
  const toChain = CHAIN_CONFIG[toChainName];

  if (!fromChain || !toChain) {
    return { success: false, error: "Invalid chain names provided" };
  }

  const token = BRIDGE_TOKENS.find((item) => item.name === "ETH");

  if (!token) {
    return { success: false, error: "Invalid token provided" };
  }

  try {
    const providerFrom = new ethers.providers.JsonRpcProvider(fromChain.mainnet);
    const walletFrom = new ethers.Wallet(privateKey, providerFrom);
    const signerFrom = walletFrom.connect(providerFrom);
    const providerTo = new ethers.providers.JsonRpcProvider(toChain.mainnet);
    const walletTo = new ethers.Wallet(privateKey, providerFrom);
    const signerTo = walletTo.connect(providerTo);

    const amounts = await getAmounts(token, fromChain, toChain, amount);
    const transferOptions: TransactionTransferOptions = {
      amount: amounts.payAmount,
      tokenAddress: token.address,
      toAddress: token.makerAddress,
    };

    const accountAddress = await signerFrom.getAddress();

    if (!accountAddress) {
      return { success: false, error: "Invalid address provided" };
    }

    const amountHex = ethers.BigNumber.from(transferOptions.amount).toHexString();

    const gasPrice = await getTransGasPrice(() => signerFrom.getGasPrice());

    const params = {
      to: transferOptions.toAddress,
      value: amountHex,
      gasPrice: ethers.utils.hexlify(gasPrice),
    };

    const gasLimit = await getTransferGasLimit(() => {
      return signerFrom.estimateGas(params);
    }, transferOptions.defaultGasLimit);

    const transferResult = await signerFrom.sendTransaction({
      ...params,
      gasLimit: gasLimit,
    });

    const { receiveAmountHm } = amounts;

    // Ожидание завершения перехода по мосту
    // передаем signer сети назначения
    await waitForBridgeCompletion(signerTo, ethers.utils.parseEther(receiveAmountHm));

    console.log("Transfer successful:", transferResult);

    return { success: true, transferResult };
  } catch (error) {
    console.error("Transfer failed:", error);

    return { success: false, error };
  }
};
