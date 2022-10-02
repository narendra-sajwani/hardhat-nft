const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "randomIpfsNft"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("constructor", function () {
              it("initializes the variables correctly", async function () {
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()
                  const dogTokenUriAtIndexZero = await randomIpfsNft.getDogTokenUris(0)
                  assert.equal(name, "Random IPFS NFT")
                  assert.equal(symbol, "RIN")
                  assert(dogTokenUriAtIndexZero.includes("ipfs://"))
              })
          })

          describe("requestNft", function () {
              it("reverts if requesting NFT without sending fee", async function () {
                  expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("reverts if not enough ETH sent for mint fee while requesting NFT", async function () {
                  const mintFee = await randomIpfsNft.getMintFee()
                  const sentValue = mintFee.sub(ethers.utils.parseEther("0.001"))
                  await expect(randomIpfsNft.requestNft({ value: sentValue })).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("emits an event indicating NFT is requested and random word request is kicked off", async function () {
                  const mintFee = await randomIpfsNft.getMintFee()
                  await expect(randomIpfsNft.requestNft({ value: mintFee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", function () {
              it("mints NFT once the random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert(tokenUri.toString().includes("ipfs://"))
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      try {
                          const mintFee = await randomIpfsNft.getMintFee()
                          const tx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
                          const txReceipt = await tx.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              txReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (error) {
                          console.log(error)
                          reject(error)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", function () {
              it("should return Pug if moddedRng < 10", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(8)
                  assert.equal(breed.toString(), "0")
              })
              it("should return Shiba Inu if moddedRng between 10 - 29", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(17)
                  assert.equal(breed.toString(), "1")
              })
              it("should return St. Bernard if moddedRng between 30 - 99", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(78)
                  assert.equal(breed.toString(), "2")
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng(108)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })
          })
      })
