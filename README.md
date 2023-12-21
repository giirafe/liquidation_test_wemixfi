This project demonstrates a Liquidation Case in Wemix Fi service.
It is implemented by forking certain blocks before liquidation on Wemix network.
Liquidation function 'liquidateBorrow()' is implemented on CErc20.sol which inherits Initializable, CToken, CErc20Interface.
To get information about certain user's 'liquid-ability' approach /contracts/views/WemixfiLendingView.sol's 'getLiquidationInfo'. This function returns LiquidationInfo wihch has a structure of below.

```basic
LiquidationInfo(address payable account)
├── isLiquidateTarget: bool
└── tokenInfo: TokenInfo[]
    ├── underlyingTokenAddr: address
    ├── cTokenAddr: address
    ├── isCollateralAsset: bool
    ├── isBorrowAsset: bool
    ├── price: uint256
    ├── repayAmountMax: uint256
    └── collateralUnderlyingTokenAmount: uint256
```