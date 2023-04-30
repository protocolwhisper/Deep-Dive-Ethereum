import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import {MerkleTree} from "merkletreejs";
import keccack256 from "keccak256"


function encodeLeaf(address:string , spots: number){
  //Same as "abi.encodePacked" in SOlidity 

  return ethers.utils.defaultAbiCoder.encode(["address", "uint64"],[address , spots])
}
describe("Merkle Trees", function () {
    it("Should de able to verify if address is in whitelist or not", async function () {
      const testAddresses = await ethers.getSigners();

      const list = [
        encodeLeaf(testAddresses[0].address , 2),
        encodeLeaf(testAddresses[1].address , 2),
        encodeLeaf(testAddresses[2].address , 2),
        encodeLeaf(testAddresses[3].address , 2),
        encodeLeaf(testAddresses[4].address , 2),
        encodeLeaf(testAddresses[5].address , 2),
        
      ]

      const merkleTree = new MerkleTree(list, keccack256,{
        hashLeaves: true,
        sortPairs: true,
        sortLeaves: true,
      })

      const root = merkleTree.getHexRoot();

      //Let's deploy the Whitelist Contract
      const whitelist = await ethers.getContractFactory("Whitelist");
      const Whitelist = await whitelist.deploy(root);
      await Whitelist.deployed();

      //Check for valid addresses
      for (let index = 0; index < 6; index++) {
        const leaf = keccack256(list[index]);
        const proof = merkleTree.getHexProof(leaf)

        const connectedWallet = await Whitelist.connect(testAddresses[index]);

        const verified = await connectedWallet.checkInWhitelist(proof , 2);

        expect(verified).to.equal(true);
        
      }

      //Check for invalid addresses 

      const verifiedInvalid = await Whitelist.checkInWhitelist([],2)
      expect(verifiedInvalid).to.equal(false);
    });

   
});
