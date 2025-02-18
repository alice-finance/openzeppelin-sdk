import ZWeb3 from '../artifacts/ZWeb3';
import Contracts from '../artifacts/Contracts';
import { toAddress } from '../utils/Addresses';
import Transactions from '../utils/Transactions';
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';

export default class Proxy {
  private contract: Contract;
  private txParams: TxParams;
  public address: string;

  public static at(contractOrAddress: string | Contract, txParams: TxParams = {}): Proxy {
    const ProxyContract = Contracts.getFromLib('AdminUpgradeabilityProxy');
    const contract = ProxyContract.at(toAddress(contractOrAddress));
    return new this(contract, txParams);
  }

  public static async deploy(
    implementation: string,
    admin: string,
    initData: string | Buffer | null,
    txParams: any = {},
  ): Promise<Proxy> {
    const ProxyContract = Contracts.getFromLib('AdminUpgradeabilityProxy');
    const contractParams = [toAddress(implementation), toAddress(admin), initData || Buffer.from('')];
    const contract = await Transactions.deployContract(ProxyContract, contractParams, txParams);
    return new this(contract, txParams);
  }

  public constructor(contract: Contract, txParams: TxParams = {}) {
    this.address = toAddress(contract);
    this.contract = contract;
    this.txParams = txParams;
  }

  public async upgradeTo(address: string, migrateData: string | null): Promise<any> {
    await this.checkAdmin();
    return migrateData
      ? Transactions.sendTransaction(
          this.contract.methods.upgradeToAndCall,
          [toAddress(address), migrateData],
          this.txParams,
        )
      : Transactions.sendTransaction(this.contract.methods.upgradeTo, [toAddress(address)], this.txParams);
  }

  public async changeAdmin(newAdmin: string): Promise<any> {
    await this.checkAdmin();
    return Transactions.sendTransaction(this.contract.methods.changeAdmin, [newAdmin], this.txParams);
  }

  public async implementation(): Promise<string> {
    return await this.contract.methods.implementation().call(this.txParams);
  }

  public async admin(): Promise<string> {
    return await this.contract.methods.admin().call(this.txParams);
  }

  public async getStorageAt(position: string): Promise<string> {
    return ZWeb3.getStorageAt(this.address, position);
  }

  private async checkAdmin(): Promise<void | never> {
    const currentAdmin: string = await this.admin();
    const { from }: { from?: string } = this.txParams;
    // TODO: If no `from` is set, load which is the default account and use it to compare against the current admin
    if (from && currentAdmin !== from)
      throw new Error(
        `Cannot modify proxy from non-admin account: current admin is ${currentAdmin} and sender is ${from}`,
      );
  }
}
