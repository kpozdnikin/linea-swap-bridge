import { Contract, providers, utils, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import { ZERO_ADDRESS } from "../constants";

export class SwapService {
  private provider: providers.JsonRpcProvider;
  private signer: Wallet;
  private classicPoolFactoryAddress: string;
  private classicPoolFactoryAbi: any[];
  private poolAbi: any[];
  private routerAddress: string;
  private routerAbi: any[];

  constructor(
    provider: providers.JsonRpcProvider,
    signer: Wallet,
    classicPoolFactoryAddress: string,
    classicPoolFactoryAbi: any[],
    poolAbi: any[],
    routerAddress: string,
    routerAbi: any[],
  ) {
    this.provider = provider;
    this.signer = signer;
    this.classicPoolFactoryAddress = classicPoolFactoryAddress;
    this.classicPoolFactoryAbi = classicPoolFactoryAbi;
    this.poolAbi = poolAbi;
    this.routerAddress = routerAddress;
    this.routerAbi = routerAbi;
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
    await this.swap(tokenInAddress, tokenOutAddress, value);
  }
}
