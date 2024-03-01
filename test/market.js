const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Market", function () {
  let usdt, nft, market, account1, account2;

  beforeEach(async () => {
    [account1, account2] = await ethers.getSigners();
    const USDT = await ethers.getContractFactory("cUSDT");
    usdt = await USDT.deploy();

    const NFT = await ethers.getContractFactory("NFTM");
    nft = await NFT.deploy(account1.address);

    const Market = await ethers.getContractFactory("Market");
    market = await Market.deploy(usdt.target, nft.target);

    await nft.safeMint(account2.address);
    await nft.safeMint(account2.address);
    await nft.connect(account2).setApprovalForAll(account1.address, true);

    await usdt.approve(market.target, "10000000000000000000000");
  });

  it("its erc20 address should be usdt", async function () {
    expect(await market.erc20()).to.equal(usdt.target);
  });

  it("its erc721 address should be nft", async function () {
    expect(await market.erc721()).to.equal(nft.target);
  });

  it("account2 should have 2 nfts", async () => {
    expect(await nft.balanceOf(account2.address)).to.equal(2);
  });

  it("account1 should have usdt", async () => {
    expect(await usdt.balanceOf(account1.address)).to.equal(
      "100000000000000000000000000"
    );
  });

  it("account2 can list 2 nfts to market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account2.address,
        market.target,
        0,
        price
      )
    ).to.emit(market, "NewOrder");
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account2.address,
        market.target,
        1,
        price
      )
    ).to.emit(market, "NewOrder");

    expect(await nft.balanceOf(account2.address)).to.equal(0);
    expect(await nft.balanceOf(market.target)).to.equal(2);
    expect(await market.isListed(0)).to.equal(true);
    expect(await market.isListed(1)).to.equal(true);

    // expect((await market.getAllNFTs())[0][0]).to.equal(account1.address);
    // expect((await market.getAllNFTs())[0][1]).to.equal(0);
    // expect((await market.getAllNFTs())[0][2]).to.equal(price);
    // expect((await market.getAllNFTs())[1][0]).to.equal(account1.address);
    // expect((await market.getAllNFTs())[1][1]).to.equal(1);
    // expect((await market.getAllNFTs())[1][2]).to.equal(price);
    expect(await market.getOrderLength()).to.equal(2);

    expect((await market.connect(account2).getMyNFTs())[0][0]).to.equal(
      account2.address
    );
    expect((await market.connect(account2).getMyNFTs())[0][1]).to.equal(0);
    expect((await market.connect(account2).getMyNFTs())[0][2]).to.equal(price);
  });

  it("account1 can unlist one nft from market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    // let price = "0x0100"
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account1.address,
        market.target,
        0,
        price
      )
    ).to.emit(market, "NewOrder");
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account1.address,
        market.target,
        1,
        price
      )
    ).to.emit(market, "NewOrder");

    expect(await market.cancelOrder(0)).to.emit(market, "CancelOrder");
    expect(await market.getOrderLength()).to.equal(1);
    expect(await market.isListed(0)).to.equal(false);
    expect((await market.getMyNFTs()).length).to.equal(1);
  });

  it("account1 can change price of nft from market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account1.address,
        market.target,
        0,
        price
      )
    ).to.emit(market, "NewOrder");
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account1.address,
        market.target,
        1,
        price
      )
    ).to.emit(market, "NewOrder");

    expect(await market.changePrice(1, "10000000000000000000000")).to.emit(
      market,
      "ChangePrice"
    );
    expect((await market.getMyNFTs()).length).to.equal(2);
    expect((await market.getMyNFTs())[1][2]).to.equal(
      "10000000000000000000000"
    );
  });

  it("account2 can buy nft from market", async function () {
    const price =
      "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account1.address,
        market.target,
        0,
        price
      )
    ).to.emit(market, "NewOrder");
    expect(
      await nft["safeTransferFrom(address,address,uint256,bytes)"](
        account1.address,
        market.target,
        1,
        price
      )
    ).to.emit(market, "NewOrder");

    expect(await market.connect(account2).buy(1)).to.emit(market, "Deal");

    expect(await market.getOrderLength()).to.equal(1);
    expect(await usdt.balanceOf(account1.address)).to.equal(
      "99990000000500000000000000"
    );
    expect(await usdt.balanceOf(account2.address)).to.equal(
      "9999999500000000000000"
    );
    expect(await nft.ownerOf(1)).to.equal(account2.address);
  });
});
