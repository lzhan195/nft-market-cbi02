const {expect} = require('chai');
const {ethers} = require('hardhat');

describe('Market', function(){
    let usdt, nft, market, account1, account2;
    
    beforeEach(async()=>{
        [account1, account2] = await ethers.getSigners();
        const USDT = await ethers.getContractFactory('cUSDT');
        usdt = await USDT.deploy();
    
        const NFT = await ethers.getContractFactory('NFTM');
        nft = await NFT.deploy(account1.address);
    
        const Market = await ethers.getContractFactory("Market");
        market = await Market.deploy(usdt.target, nft.target);
    
        await nft.safeMint(account2.address);
        await nft.safeMint(account2.address);
        await usdt.approve(market.target, "10000000000000000000000")
    })

    it('its erc20 address should be usdt', async function(){
        expect(await market.erc20()).to.equal(usdt.target);
    })

    it("its erc721 address should be nft", async function (){
        expect(await market.erc721()).to.equal(nft.target);
    })

    it("account2 should have 2 nfts", async() =>{
        expect(await nft.balanceOf(account2.address)).to.equal(2);
    })

    it("account1 should have usdt", async() =>{
        expect(await usdt.balanceOf(account1.address)).to.equal("100000000000000000000000000");
    })
})
