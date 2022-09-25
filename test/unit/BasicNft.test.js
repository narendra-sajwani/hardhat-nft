const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft Unit Tests", function () {
          let deployer, basicNft

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", function () {
              it("Initializes the BasicNft Correctly", async function () {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("mintNft", function () {
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  const tokenCounterBeforeMint = await basicNft.getTokenCounter()
                  const mintTx = await basicNft.mintNft()
                  mintTx.wait(1)
                  const tokenCounterAfterMint = await basicNft.getTokenCounter()
                  const tokenURI = await basicNft.tokenURI(0)
                  assert.equal(
                      tokenCounterBeforeMint.add(1).toString(),
                      tokenCounterAfterMint.toString()
                  )
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })
          })
      })
