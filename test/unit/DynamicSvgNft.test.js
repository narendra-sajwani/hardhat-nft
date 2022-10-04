const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const {
    developmentChains,
    lowSVGImageuri,
    highSVGimageUri,
    highTokenUri,
    lowTokenUri,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dynamic SVG NFT Unit Tests", function () {
          let dynamicSvgNft, deployer, mockV3Aggregator
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["dynamicSvgNft", "mocks"])
              dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", function () {
              it("sets priceFeed address, lowSvg and highSvg correctly", async function () {
                  const priceFeed = await dynamicSvgNft.getPriceFeed()
                  const lowSVG = await dynamicSvgNft.getLowSVG()
                  const highSVG = await dynamicSvgNft.getHighSVG()
                  assert.equal(mockV3Aggregator.address, priceFeed)
                  assert.equal(lowSVG, lowSVGImageuri)
                  assert.equal(highSVG, highSVGimageUri)
              })
          })

          describe("mintNft", function () {
              it("emits MintedNft event, increases the token counter and mints an NFT with given highValue", async function () {
                  const highValue = ethers.utils.parseEther("1")
                  await expect(dynamicSvgNft.mintNft(highValue)).to.emit(dynamicSvgNft, "MintedNFT")
                  const tokenCounter = await dynamicSvgNft.getTokenCounter()
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenURI, highTokenUri)
              })
              it("changes the tokenURI to the one with lowImageUri when the current eth/usd price is less than highValue", async function () {
                  const highValue = ethers.utils.parseEther("1000000")
                  const tx = await dynamicSvgNft.mintNft(highValue)
                  await tx.wait(1)
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, lowTokenUri)
              })
          })
      })
