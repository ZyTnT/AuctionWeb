pragma solidity ^0.8.0;

contract DutchAuction
{
    address payable public ownerAddress;
    address public judgeAddress;
    address payable public winnerAddress;
    uint reservePrice;
    uint public numBlocksActionOpen;
    uint offerPriceDecrement;
    uint startBlockNumber;
    uint winnerBid;
    bool isEnd;
    bool public finalized;
    bool refunded;

    constructor(uint256 _reservePrice, address _judgeAddress, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) public
    {
        reservePrice = _reservePrice;
        judgeAddress = _judgeAddress;
        numBlocksActionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        ownerAddress = payable(msg.sender);
        startBlockNumber = block.number;
        isEnd = false;
    }

    function bid() public payable returns(address)
    {
        require(!isEnd);
        //require(block.number < (startBlockNumber + numBlocksActionOpen));
        require(msg.value >= (reservePrice + (offerPriceDecrement * (startBlockNumber + numBlocksActionOpen - block.number))));

        isEnd = true;
        if(judgeAddress == 0x0000000000000000000000000000000000000000)
        {
            winnerAddress = payable(msg.sender);
            ownerAddress.transfer(msg.value);
            finalized = true;
        }else{
            winnerAddress = payable(msg.sender);
            winnerBid = msg.value;
        }
        
        return winnerAddress;
    }

    function finalize() public
    {
        require(isEnd && !finalized && !refunded);
        require(msg.sender == judgeAddress || msg.sender == winnerAddress);
        finalized = true;
        ownerAddress.transfer(winnerBid);
    }

    function refund(uint256 refundAmount) public
    {
        require(isEnd && !finalized && !refunded);
        require(msg.sender == judgeAddress);
        require(winnerAddress != judgeAddress);

        refunded = true;
        winnerAddress.transfer(refundAmount);
    }

    //for testing framework
    function nop() public returns(bool)
    {
        return true;
    }
}