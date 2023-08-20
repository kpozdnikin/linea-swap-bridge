import { Contract, BigNumber, providers, utils } from 'ethers';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

class SwapService {
  private provider: providers.JsonRpcProvider;
  private signer: providers.JsonRpcSigner;
  private classicPoolFactoryAddress: string;
  private classicPoolFactoryAbi: any[];
  private poolAbi: any[];
  private routerAddress: string;
  private routerAbi: any[];

  constructor(
    provider: providers.JsonRpcProvider,
    signer: providers.JsonRpcSigner,
    classicPoolFactoryAddress: string,
    classicPoolFactoryAbi: any[],
    poolAbi: any[],
    routerAddress: string,
    routerAbi: any[]
  ) {
    this.provider = provider;
    this.signer = signer;
    this.classicPoolFactoryAddress = classicPoolFactoryAddress;
    this.classicPoolFactoryAbi = classicPoolFactoryAbi;
    this.poolAbi = poolAbi;
    this.routerAddress = routerAddress;
    this.routerAbi = routerAbi;
  }

  public async swapETHForToken(tokenAddress: string, value: BigNumber): Promise<void> {
    await this.swap(ZERO_ADDRESS, tokenAddress, value);
  }

  public async swapTokenForETH(tokenAddress: string, value: BigNumber): Promise<void> {
    await this.swap(tokenAddress, ZERO_ADDRESS, value);
  }

  private async swap(tokenInAddress: string, tokenOutAddress: string, value: BigNumber): Promise<void> {
    const classicPoolFactory = new Contract(this.classicPoolFactoryAddress, this.classicPoolFactoryAbi, this.provider);
    const poolAddress = await classicPoolFactory.getPool(tokenInAddress, tokenOutAddress);

    if (poolAddress === ZERO_ADDRESS) {
      throw Error('Pool does not exist');
    }

    const pool = new Contract(poolAddress, this.poolAbi, this.provider);
    const reserves: [BigNumber, BigNumber] = await pool.getReserves();
    const [reserveIn, reserveOut] = tokenInAddress < tokenOutAddress ? reserves : [reserves[1], reserves[0]];

    const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet
    const swapData = utils.defaultAbiCoder.encode(
      ["address", "address", "uint8"],
      [tokenInAddress, this.signer._address, withdrawMode]
    );

    const steps = [{
      pool: poolAddress,
      data: swapData,
      callback: ZERO_ADDRESS,
      callbackData: '0x',
    }];

    const paths = [{
      steps: steps,
      tokenIn: tokenInAddress === ZERO_ADDRESS ? tokenInAddress : tokenOutAddress,
      amountIn: value,
    }];

    const router = new Contract(this.routerAddress, this.routerAbi, this.provider);
    const response = await router.swap(
      paths,
      0,
      BigNumber.from(Math.floor(Date.now() / 1000)).add(1800),
      { value: value }
    );

    await response.wait();
  }
}