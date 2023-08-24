import { Contract, ethers, providers, utils, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import { MIN_GAS_UNITS, WETH_DECIMALS, ZERO_ADDRESS } from "../constants";
import { EVMBasedAddress } from "../types";
import ERC20ABI from "./erc20Abi.json";

// TODO - replace ANY
export class SwapService {
  private account: EVMBasedAddress;
  private provider: providers.JsonRpcProvider;
  private signer: Wallet;
  private classicPoolFactoryAddress: EVMBasedAddress;
  private classicPoolFactoryAbi: any[];
  private poolAbi: any[];
  private routerAddress: EVMBasedAddress;
  private routerAbi: any[];
  private wethAddress: EVMBasedAddress;

  constructor(
    provider: providers.JsonRpcProvider,
    signer: Wallet,
    sender: EVMBasedAddress,
    classicPoolFactoryAddress: EVMBasedAddress,
    classicPoolFactoryAbi: any[],
    poolAbi: any[],
    routerAddress: EVMBasedAddress,
    routerAbi: any[],
    wethAddress: EVMBasedAddress,
  ) {
    this.account = sender;
    this.provider = provider;
    this.signer = signer;
    this.classicPoolFactoryAddress = classicPoolFactoryAddress;
    this.classicPoolFactoryAbi = classicPoolFactoryAbi;
    this.poolAbi = poolAbi;
    this.routerAddress = routerAddress;
    this.routerAbi = routerAbi;
    this.wethAddress = wethAddress;
  }

  private async wrapEth(tokenAmount: BigNumber): Promise<void> {
    const tokenAmountUint = ethers.utils.parseUnits(tokenAmount.toFixed(), WETH_DECIMALS);
    const contract = new ethers.Contract(this.wethAddress, ERC20ABI, this.signer);

    try {
      await this.signer.sendTransaction({
        to: this.wethAddress,
        value: tokenAmountUint,
        gasLimit: MIN_GAS_UNITS,
      });

      const wethBalance = contract.balanceOf(this.account).then((x) => JSON.parse(JSON.stringify(x)));
      const amountBn = new BigNumber(tokenAmount);
      const wethBalaceBN = new BigNumber(wethBalance);

      console.log("amount", tokenAmount, "wethBalance", wethBalance);

      if (!amountBn.eq(wethBalaceBN)) {
        throw Error("wrap eth error - balance not equal");
      }
    } catch (e) {
      throw Error(`wrap eth error ${e.toString()}`);
    }
  }

  private async swap(tokenInAddress: string, tokenOutAddress: string, value: BigNumber): Promise<void> {
    const classicPoolFactory = new Contract(this.classicPoolFactoryAddress, this.classicPoolFactoryAbi, this.provider);
    const poolAddress = await classicPoolFactory.getPool(tokenInAddress, tokenOutAddress);

    console.log("classicPoolFactory", classicPoolFactory, "poolAddress", poolAddress);

    if (poolAddress === ZERO_ADDRESS) {
      throw Error("Pool does not exist");
    }

    const pool = new Contract(poolAddress, this.poolAbi, this.provider);
    const reserves: [BigNumber, BigNumber] = await pool.getReserves();
    const [reserveIn, reserveOut] = tokenInAddress < tokenOutAddress ? reserves : [reserves[1], reserves[0]];

    console.log("reserveIn", reserveIn, "reserveOut", reserveOut);

    const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet
    const signerAddress = await this.signer.getAddress();
    const swapData = utils.defaultAbiCoder.encode(
      ["address", "address", "uint8"],
      [tokenInAddress, signerAddress, withdrawMode],
    );

    const steps = [
      {
        pool: poolAddress,
        data: swapData,
        callback: ZERO_ADDRESS,
        callbackData: "0x",
      },
    ];

    const paths = [
      {
        steps: steps,
        tokenIn: tokenInAddress,
        amountIn: value,
      },
    ];

    const router = new Contract(this.routerAddress, this.routerAbi, this.provider);
    const response = await router.swap(paths, 0, new BigNumber(Math.floor(Date.now() / 1000)).plus(1800), {
      value: value,
    });

    await response.wait();
  }

  public async swapTokens(tokenInAddress: string, tokenOutAddress: string, value: BigNumber): Promise<void> {
    // Ensure that not both addresses are ZERO_ADDRESS
    if (tokenInAddress === ZERO_ADDRESS && tokenOutAddress === ZERO_ADDRESS) {
      throw Error("Both token addresses cannot be ZERO_ADDRESS");
    }

    if (tokenInAddress === ZERO_ADDRESS) {
      await this.wrapEth(value);
    }

    await this.swap(tokenInAddress, tokenOutAddress, value);
  }
}
