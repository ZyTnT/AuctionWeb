import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import AuctionArtifact from '../artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import { Provider } from '../utils/provider';
import { SectionDivider } from './SectionDivider';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils'



const StyledDeployContractButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
  margin-left: 3rem;
  margin-right: 3rem;
`;

const StyledGreetingDiv = styled.div`
  display: inline-block;
  margin-top : 1rem;
  margin-bottom : 1rem; 
  place-self: center;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
  width: 50rem;
`;

const StyledInput = styled.input`
  margin-left: 1rem;
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  margin-left: 3rem;
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function Auction(): ReactElement {

  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [auctionContract, setAuctionContract] = useState<Contract>();
  const [auctionContractAddr, setAuctionContractAddr] = useState<string>('');
  const [auctionContractAddrInput, setAuctionContractAddrInput] = useState<string>('');
  const [judgeAddress, setJudgeAddress] = useState<string>('')
  const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] = useState<number>();
  const [judgeAddressInput, setJudgeAddressInput] = useState<string>('')
  const [reservePriceInput, setReservePriceInput] = useState<number>();
  const [numBlocksAuctionOpenInput, setNumBlocksAuctionOpenInput] = useState<number>();
  const [offerPriceDecrementInput, setOfferPriceDecrementInput] = useState<number>();
  const [ownerAddress, setOwnerAddress] = useState<string>('')
  const [BidPrice,setBidPrice] = useState<number>();

  const provider = new Web3.providers.HttpProvider('http://localhost:8545');
  const web3 = new Web3(provider);



  const contractAbi = AuctionArtifact.abi;

  

   useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);


  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the Greeter contract one time, when a signer is defined
    if (auctionContract || !signer) {
      return;
    }

    async function deployAuctionContract(signer: Signer): Promise<void> {
      const Auction = new ethers.ContractFactory(
        AuctionArtifact.abi,
        AuctionArtifact.bytecode,
        signer
      );

      try {

        const auctionContract = await Auction.deploy(reservePriceInput, judgeAddressInput, numBlocksAuctionOpenInput, offerPriceDecrementInput);

        await auctionContract.deployed();

        setAuctionContract(auctionContract);

        window.alert(`Auction deployed to: ${auctionContract.address}`);

        setAuctionContractAddr(auctionContract.address);

      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployAuctionContract(signer);
  }

  function handleReversePriceChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setReservePriceInput(parseInt(event.target.value));
  }
  function handleJudgeAddressChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setJudgeAddressInput(event.target.value);
  }
  function handleOpenBlockNumChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setNumBlocksAuctionOpenInput(parseInt(event.target.value));
  }
  function handlePriceDecrementChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setOfferPriceDecrementInput(parseInt(event.target.value));
  }
  function handleSearchAddressChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setAuctionContractAddrInput(event.target.value);
  }
  function handleBidPriceChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setBidPrice(parseInt(event.target.value));
  }

  
  function handleSearchContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

      async function getInformation(): Promise<void>{
        const contractInstance = new web3.eth.Contract(contractAbi as AbiItem[], auctionContractAddrInput)

        const ownerAddress = await contractInstance.methods.ownerAddress().call();
        const judgeAddress = await contractInstance.methods.judgeAddress().call();
        const blockNum = await contractInstance.methods.numBlocksActionOpen().call();
        
        setJudgeAddress(judgeAddress);
        setNumBlocksAuctionOpen(blockNum);
        setOwnerAddress(ownerAddress);
      }


    getInformation();
  }

  function handleSubmitBid(event: MouseEvent<HTMLButtonElement>){
    event.preventDefault();

    async function submitBid(): Promise<void>{
      const contractInstance = await new web3.eth.Contract(contractAbi as AbiItem[], auctionContractAddrInput)
      const currentAddress = await web3.eth.getAccounts();
      try{
      await contractInstance.methods.bid().send({from: currentAddress[0], value: BidPrice}).then(console.log);
      }catch(error){console.log(error)}
      const winnerAddress = await contractInstance.methods.winnerAddress().call();
      await console.log(winnerAddress);
      console.log(currentAddress[0])

      if(winnerAddress === currentAddress[0]){
        window.alert('You are the winner!');
      }else{
        window.alert('Your bid is failed!');
      }
    }

    submitBid();
  }

  function handleFinalize(event: MouseEvent<HTMLButtonElement>){
    event.preventDefault();

    async function submitFinalize(): Promise<void> {
      const contractInstance = new web3.eth.Contract(contractAbi as AbiItem[], auctionContractAddrInput)
      const currentAddress = await web3.eth.getAccounts();
      try{
        await contractInstance.methods.finalize().send({from: currentAddress[0]})
      }catch(error){
        console.log(error);
      }

      const finalized = await contractInstance.methods.finalized().call();
      if(finalized === true){
        window.alert('This contract is finalized!')
      }else{
        window.alert('This contract is not finalized!')
      }
    }

    submitFinalize();
  }
  
  return (
    <>
        <StyledLabel htmlFor="reversePriceInput">Set reverse price</StyledLabel>
        <StyledInput
          id="reversePriceInput"
          type="text"
          placeholder='Please input reverse price.'
          onChange={handleReversePriceChange}
          style={{ fontStyle: 'normal'}}
        ></StyledInput>

        <StyledLabel htmlFor="judegeAddressInput">Set judege address</StyledLabel>
        <StyledInput
          id="judgeAddressInput"
          type="text"
          placeholder='Please input judge address.'
          onChange={handleJudgeAddressChange}
          style={{ fontStyle: 'normal'}}
        ></StyledInput>

        <StyledLabel htmlFor="openBlockNumInput">Set open block number</StyledLabel>
        <StyledInput
          id="openBlockNumInput"
          type="text"
          placeholder='Please input open block number.'
          onChange={handleOpenBlockNumChange}
          style={{ fontStyle: 'normal'}}
        ></StyledInput> 

        <StyledLabel htmlFor="priceDecrementInput">Set price decrement</StyledLabel>
        <StyledInput
          id="priceDecrementInput"
          type="text"
          placeholder='Please input price decrement.'
          onChange={handlePriceDecrementChange}
          style={{ fontStyle: 'normal'}}
        ></StyledInput> 
        
      <StyledDeployContractButton
        disabled={!active || auctionContract ? true : false}
        style={{
          cursor: !active || auctionContract ? 'not-allowed' : 'pointer',
          borderColor: !active || auctionContract ? 'unset' : 'blue'
        }}
        onClick={handleDeployContract}
      >
        Deploy Auction Contract
      </StyledDeployContractButton>
      <SectionDivider />
      <StyledGreetingDiv>
        <StyledLabel>Contract addr</StyledLabel>
        <div>
          {auctionContractAddr ? (
            auctionContractAddr
          ) : (
            <em>{`<Contract not yet deployed>`}</em>
          )}
        </div>
      
      <SectionDivider />
      <StyledGreetingDiv>
        <StyledLabel htmlFor="searchAddress">Set search address:</StyledLabel>
        <StyledInput
            id="searchAddress"
            type="text"
            placeholder='Input contract address.'
            onChange={handleSearchAddressChange}
            style={{ fontStyle: 'normal'}}
        ></StyledInput> 

        <StyledDeployContractButton
          onClick={handleSearchContract}
        >
          Search Information
        </StyledDeployContractButton>

        <StyledLabel htmlFor="bidPriceInput">Set bid price:</StyledLabel>
        <StyledInput
          id="bidPriceInput"
          type="text"
          placeholder='Please input bid price.'
          onChange={handleBidPriceChange}
          style={{ fontStyle: 'normal'}}
        ></StyledInput> 

        <StyledDeployContractButton
          onClick={handleSubmitBid}
        >
          Submit Bid
        </StyledDeployContractButton>
        </StyledGreetingDiv>
        <SectionDivider />
        <StyledGreetingDiv>
        <StyledLabel>Owner addr</StyledLabel>
          <div>
            {ownerAddress ? (
              ownerAddress
            ) : (
              <em>{`<No Owner Address>`}</em>
            )}
          </div>
        <StyledLabel>judege addr</StyledLabel>
          <div>
            {judgeAddress ? (
              judgeAddress
            ) : (
              <em>{`<No judge Address>`}</em>
            )}
          </div>

        <StyledLabel>Open Block Number</StyledLabel>
          <div>
            {numBlocksAuctionOpen ? (
              numBlocksAuctionOpen
            ) : (
              <em>{`<No Open Block Number>`}</em>
            )}
          </div>
        </StyledGreetingDiv>
        <SectionDivider></SectionDivider>
        <StyledDeployContractButton
        style={{
          marginLeft: '30rem',
          marginTop: '1rem'
        }}

          onClick={handleFinalize}
        >
          Finalize
        </StyledDeployContractButton>

      </StyledGreetingDiv>
    </>
  );
}
