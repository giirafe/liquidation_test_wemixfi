// Import ethers from Hardhat package
const { ethers } = require("hardhat");
// Import custom logging tool from scriptTool.js
const { logSuccess, logError } = require('./scriptTool');

// Import the ABI using require
const cwemixJson = require('../contractABI/CWemix.json');
const wemixfiLendingViewJson = require('../contractABI/WemixfiLendingView.json');


async function main() {
    // Connect to the contract using its address and ABI
    const cwemixContractAddress = "0x34b9B18fDBE2aBC6DfB41A7f6d39B5E511ce3e23";
    const wemixfiLendingViewContractAddress = "0xE58955bBD9E05A47941C6b3eC05Bc8f60560e798";
    const liquidatorAddress = "0x07454C4d1d0A71F49926D68804CB6f65F2607723" // liquidatorAddress of Block : 36139991
    const liquidatedBorrowerAddress = "0x03C49C1907d2791c9096a109bc3D6720d4CcE825";

    const provider = ethers.provider;
    const cwemixContractInstance = new ethers.Contract(cwemixContractAddress, cwemixJson.abi, provider);
    const wemixfiLendingViewContractInstance = new ethers.Contract(wemixfiLendingViewContractAddress, wemixfiLendingViewJson.abi, provider);

    const [user1, user2, user3] = await ethers.getSigners();

    const impersonatedLiquidator = await ethers.getImpersonatedSigner(liquidatorAddress);

    // Example: Reading data from the contract
    try {
        const bbsData = await cwemixContractInstance.borrowBalanceStored(user1); // public function인 borrowBalanceStored()를 통해 Contract 연결된지 확인
        logSuccess("borrowBalanceStored in cwemix : ", bbsData)
        const accrualBlockNumber = await cwemixContractInstance.accrualBlockNumber;
        // logWithColor(COLORS.GREEN, ("accrualBlockNumber : ", accrualBlockNumber))
        logSuccess("accrualBlockNumber : ", accrualBlockNumber )
    } catch (error) {
        console.error("Error reading data from the 'cwemix' contract :", error);
    }

    try {
        const cwemixInfo = await wemixfiLendingViewContractInstance.getCTokenInfo(cwemixContractAddress); 
        logSuccess("cwemixInfo from Lending View Contract : " , cwemixInfo)

        // Next step, getLiquidationInfo(account address)
        const liqInfo = await wemixfiLendingViewContractInstance.getLiquidationInfo(liquidatedBorrowerAddress);
        logSuccess("liqInfo from Lending View Contract : " , liqInfo)
        logSuccess("isLiquidateTarget : " , liqInfo.isLiquidateTarget)
        
    } catch (error) {
        console.error("Error reading data from the 'WemixFi Lending View' contract :", error);
    }

    // Liquidate Attempt, reenacting Liquidation using impersonatedLiquidator

    // // Example: Sending a transaction to the contract
    // // Make sure you have a signer (account) with some test ETH for transactions
    // const [signer] = await ethers.getSigners();
    // try {
    //     const tx = await cwemixContractInstance.connect(signer).someOtherFunction(); // Replace with actual function and parameters
    //     await tx.wait();
    //     console.log("Transaction successful");
    // } catch (error) {
    //     console.error("Error sending transaction to the contract:", error);
    // }
}

main().catch((error) => {
    logWithColor(COLORS.RED, error);
    process.exitCode = 1;
});
