import { Contract, ethers, providers, utils, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import { MIN_GAS_UNITS, WETH_DECIMALS, ZERO_ADDRESS } from "../constants";
import { EVMBasedAddress, OperationResult } from "../types";
import ERC20ABI from "./erc20Abi.json";

const POOL_NOT_EXISTS = "Pool does not exist";

// TODO - replace ANY, add error codes
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

  private async getTokenDecimals(tokenAddress): Promise<number> {
    const contract = new ethers.Contract(tokenAddress, ERC20ABI, this.signer);

    return contract.decimals();
  }

  private async wrapEth(tokenAmount: BigNumber): Promise<OperationResult> {
    const tokenAmountUint = ethers.utils.parseUnits(tokenAmount.toFixed(), WETH_DECIMALS);
    const contract = new ethers.Contract(this.wethAddress, ERC20ABI, this.signer);

    try {
      const result = await this.signer.sendTransaction({
        to: this.wethAddress,
        value: tokenAmountUint,
        gasLimit: MIN_GAS_UNITS,
      });

      const wethBalance = contract.balanceOf(this.account).then((x) => JSON.parse(JSON.stringify(x)));
      const amountBn = new BigNumber(tokenAmount);
      const wethBalaceBN = new BigNumber(wethBalance);

      if (!amountBn.eq(wethBalaceBN)) {
        return { success: false, error: "Not enough balance wrapped" };
      }

      return { success: true, result };
    } catch (e) {
      return { success: false, error: `wrap eth error ${e.toString()}` };
    }
  }

  private async swap(tokenInAddress: string, tokenOutAddress: string, value: BigNumber): Promise<OperationResult> {
    const classicPoolFactory = new Contract(this.classicPoolFactoryAddress, this.classicPoolFactoryAbi, this.signer);

    const poolAddress = await classicPoolFactory.getPool(
      tokenInAddress === ZERO_ADDRESS ? this.wethAddress : tokenInAddress,
      tokenOutAddress === ZERO_ADDRESS ? this.wethAddress : tokenOutAddress,
    );

    console.log("poolAddress", poolAddress);

    const decimals = tokenInAddress === ZERO_ADDRESS ? 18 : await this.getTokenDecimals(tokenInAddress);
    const valueUint = ethers.utils.parseUnits(value.toString(), decimals);

    if (poolAddress === ZERO_ADDRESS) {
      return { success: false, error: POOL_NOT_EXISTS };
    }

    const pool = new Contract(poolAddress, this.poolAbi, this.signer);
    const reserves: [BigNumber, BigNumber] = await pool.getReserves();
    const [reserveIn, reserveOut] = tokenInAddress < tokenOutAddress ? reserves : [reserves[1], reserves[0]];

    console.log("reserveIn", reserveIn.toString(), "reserveOut", reserveOut.toString());

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
        callback: ZERO_ADDRESS, // we don't have a callback
        callbackData: "0x",
      },
    ];

    // If we want to use the native ETH as the input token,
    // the `tokenInAddress` on path should be zero address.
    // Note: however we still have to encode the wETH address to pool's swap data.
    const paths = [
      {
        steps: steps,
        tokenIn: tokenInAddress,
        amountIn: valueUint,
      },
    ];

    const timestamp = ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800);

    try {
      const router: Contract = new Contract(this.routerAddress, this.routerAbi, this.signer);

      // TODO - correct amount with slippage
      const response = await router.swap(paths, 0, timestamp, {
        value: valueUint,
      });

      const result = await response.wait();

      return { success: true, result };
    } catch (e) {
      return { success: false, error: `Swap error ${e.toString()}` };
    }
  }

  public async swapTokens(tokenInAddress: string, tokenOutAddress: string, value: BigNumber): Promise<OperationResult> {
    // Ensure that not both addresses are ZERO_ADDRESS
    if (tokenInAddress === ZERO_ADDRESS && tokenOutAddress === ZERO_ADDRESS) {
      return { success: false, error: "Both token addresses cannot be ZERO_ADDRESS" };
    }

    return this.swap(tokenInAddress, tokenOutAddress, value);
  }
}
