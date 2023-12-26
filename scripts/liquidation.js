// Import ethers from Hardhat package
const { ethers } = require("hardhat");
// Import custom logging tool from scriptTool.js
const { logSuccess, logError,startNewScript } = require('./scriptTool');

// Import the ABI using require
const cwemixJson = require('../contractABI/CWemix.json');
const cwemixDollarJson = require('../contractABI/CWemixDollar.json');
const wemixfiLendingViewJson = require('../contractABI/WemixfiLendingView.json');


async function main() {
    // Connect to the contract using its address and ABI
    const cwemixContractAddress = "0x34b9B18fDBE2aBC6DfB41A7f6d39B5E511ce3e23";
    const cwemixDollarContractAddress = "0x04dC57f9675e9a620f2566eAE20d44ACDa890802";
    const wemixfiLendingViewContractAddress = "0xE58955bBD9E05A47941C6b3eC05Bc8f60560e798";
    const liquidatorAddress = "0x07454C4d1d0A71F49926D68804CB6f65F2607723" // liquidatorAddress of Block : 36139991
    const liquidatedBorrowerAddress = "0x03C49C1907d2791c9096a109bc3D6720d4CcE825";
    const wemixRepayAmount = 0.03;

    const provider = ethers.provider;
    const cwemixContractInstance = new ethers.Contract(cwemixContractAddress, cwemixJson.abi, provider);
    const cwemixDollarContractInstance = new ethers.Contract(cwemixDollarContractAddress,cwemixDollarJson.abi,provider )
    const wemixfiLendingViewContractInstance = new ethers.Contract(wemixfiLendingViewContractAddress, wemixfiLendingViewJson.abi, provider);

    // Set up Users
    const [user1, user2, user3] = await ethers.getSigners();

    const impersonatedLiquidator = await ethers.getImpersonatedSigner(liquidatorAddress);
    const impersonatedBorrower = await ethers.getImpersonatedSigner(liquidatedBorrowerAddress);

    // Set up an event filter for the LiquidateBorrow event
    // const liquidateBorrowEventFilter = cwemixContractInstance.filters.LiquidateBorrow();

    // Function to handle the LiquidateBorrow event
    function handleLiquidateBorrowEvent(liquidator, borrower, actualRepayAmount, cTokenCollateral, seizeTokens, underlying) {
        console.log(`LiquidateBorrow Event: Liquidator: ${liquidator}, Borrower: ${borrower}, Repay Amount: ${actualRepayAmount}, Collateral: ${cTokenCollateral}, Seize Tokens: ${seizeTokens}, Underlying: ${underlying}`);
        // logSuccess(`LiquidateBorrow Event: Liquidator: ${liquidator}, Borrower: ${borrower}, Repay Amount: ${actualRepayAmount}, Collateral: ${cTokenCollateral}, Seize Tokens: ${seizeTokens}, Underlying: ${underlying}`);
    }

    // Listen for the LiquidateBorrow event
    cwemixContractInstance.on("LiquidateBorrow", handleLiquidateBorrowEvent);


    // Example: Reading data from the contract
    try {
        startNewScript("Reading Data from the contract");
        const bbsData = await cwemixContractInstance.borrowBalanceStored(user1); // public function인 borrowBalanceStored()를 통해 Contract 연결된지 확인
        logSuccess("borrowBalanceStored in cwemix : ", bbsData)
        const accrualBlockNumber = await cwemixContractInstance.accrualBlockNumber;
        // logWithColor(COLORS.GREEN, ("accrualBlockNumber : ", accrualBlockNumber))
        logSuccess("accrualBlockNumber : ", accrualBlockNumber )
    } catch (error) {
        console.error("Error reading data from the 'cwemix' contract :", error);
    }

    try {
        startNewScript("Check liquidation target of certain user");
        const cwemixInfo = await wemixfiLendingViewContractInstance.getCTokenInfo(cwemixContractAddress); 
        logSuccess("cwemixInfo from Lending View Contract : " , cwemixInfo)

        // Next step, getLiquidationInfo(account address)
        const liqInfo = await wemixfiLendingViewContractInstance.getLiquidationInfo(liquidatedBorrowerAddress);
        logSuccess("isLiquidateTarget : " , liqInfo.isLiquidateTarget)
        logSuccess("isLiquidateTarget Token idx 0 : " , liqInfo.tokenInfo[0])
        logSuccess("repayAmountMax : " , liqInfo.tokenInfo[0].repayAmountMax)
        
    } catch (error) {
        console.error("Error reading data from the 'WemixFi Lending View' contract :", error);
    }

    // Liquidate Attempt, reenacting Liquidation using impersonatedLiquidator
    try {
        startNewScript("Actual liquidation proceeding");
        var liquidatorWemixDollarBalance = await cwemixDollarContractInstance.balanceOf(liquidatorAddress)
        logSuccess("Liquidator Wemix Dollar balance BEFORE liquidation : ",liquidatorWemixDollarBalance)

        // Next step, getLiquidationInfo(account address)
        var liqInfo = await wemixfiLendingViewContractInstance.getLiquidationInfo(liquidatedBorrowerAddress);
        // logSuccess("liqInfo from Lending View Contract : " , liqInfo)
        logSuccess("isLiquidateTarget : " , liqInfo.isLiquidateTarget)
        logSuccess("isLiquidateTarget of Token idx 0 : " , liqInfo.tokenInfo[0])
        logSuccess("Token idx 0 Oracle Price : " , liqInfo.tokenInfo[0].price)
        logSuccess("Token idx 0 repayAmountMax : " , liqInfo.tokenInfo[0].repayAmountMax)
        const liquidatorCost =  liqInfo.tokenInfo[0].repayAmountMax * liqInfo.tokenInfo[0].price
        logSuccess("Estimated Cost for liquidator on Max Repay", liquidatorCost)
        
        // Case1 : Liquidating with Max Repay Amount
        const maxWemixRepayAmountBN = liqInfo.tokenInfo[0].repayAmountMax; // No need to adjust units since the value came from Smart Contract

        // Case2 : Liquidating with Manual Repay Amount
        // Convert wemixRepayAmount to a BigNumber
        const manualWemixRepayAmountBN = ethers.parseUnits(wemixRepayAmount.toString(), 'ether'); // Adjust 'ether' for the correct number of decimals if needed

        // Execute the liquidateBorrow function with the impersonated liquidator
        const liquidateBorrowResult = await cwemixContractInstance.connect(impersonatedLiquidator).liquidateBorrow(
            liquidatedBorrowerAddress,
            cwemixDollarContractAddress,
            {
                value: maxWemixRepayAmountBN // Set the transaction value here
            }
        );
        await liquidateBorrowResult.wait();  // Wait for the transaction to be mined
        logSuccess("Liquidation Result : ", liquidateBorrowResult);

        liqInfo =  await wemixfiLendingViewContractInstance.getLiquidationInfo(liquidatedBorrowerAddress);
        logSuccess("Checking Liquidation Availability of same User Address isLiquidateTarget : " , liqInfo.isLiquidateTarget)

        liquidatorWemixDollarBalance = await cwemixDollarContractInstance.balanceOf(liquidatorAddress)
        logSuccess("Liquidator Wemix Dollar balance AFTER liquidation : ",liquidatorWemixDollarBalance)

    } catch (error) {
        logError("Error attempting liquidation : ", error);
    }

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

    // Remove all listeners after test scripts
    cwemixContractInstance.removeAllListeners()
}

main().catch((error) => {
    logWithColor(COLORS.RED, error);
    process.exitCode = 1;
});
