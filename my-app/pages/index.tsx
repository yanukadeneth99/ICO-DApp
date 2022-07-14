import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import { BigNumber, Contract, providers, utils } from "ethers";
import Core from "web3modal";
import Web3Modal from "web3modal";
import {
  ICO_CONTRACT_ADDRESS,
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  ICO_CONTRACT_ABI,
} from "../constants/index";
import BGImage from "../public/wallpaper.jpg";

const Home: NextPage = () => {
  const zero = BigNumber.from(0);
  const [walletConnect, setWalletConnected] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [balanceMemeTokens, setBalanceMemeTokens] = useState(zero);
  const [tokensToBeMinted, setTokensToBeMinted] = useState(zero);
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef<Core>();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef?.current?.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the Network to Rinkeby");
      throw new Error("Change the network to Rinkeby");
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }
    return web3Provider;
  };

  const getBalanceMemeTokens = async () => {
    try {
      const signer: providers.JsonRpcSigner = (await getProviderOrSigner(
        true
      )) as providers.JsonRpcSigner;
      const NftContract = await new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const balance = await NftContract.balanceOf(signer.getAddress());
      setBalanceMemeTokens(balance);
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      await getBalanceMemeTokens();
      await getBalanceOfICO();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!walletConnect) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnect]);

  const getBalanceOfICO = async () => {
    try {
      const signer: providers.JsonRpcSigner = (await getProviderOrSigner(
        true
      )) as providers.JsonRpcSigner;
      const IcoContract = await new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );
      const balance = await IcoContract.balanceOf(signer.getAddress());
      setTokensMinted(balance);
    } catch (error) {
      console.error(error);
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      const signer: providers.JsonRpcSigner = (await getProviderOrSigner(
        true
      )) as providers.JsonRpcSigner;
      const NftContract = await new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const IcoContract = await new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );
      const balance = await NftContract.balanceOf(signer.getAddress());
      if (balance === zero) {
        console.log("zero");
        setTokensToBeMinted(zero);
      } else {
        let amount = 0;
        for (let i = 0; i < balance; i++) {
          const tokenId = await NftContract.tokenOfOwnerByIndex(
            signer.getAddress(),
            i
          );
          const claimed = await IcoContract.tokensIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeMinted(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeMinted(zero);
    }
  };

  const mintICO = async (amount: BigNumber) => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);
      const IcoContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );
      const value = (amount as any) * 0.01;
      const tx = await IcoContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      tx.wait();
      setLoading(false);
      window.alert("Successfully Minted!");
      await getBalanceOfICO();
      await getTokensToBeClaimed();
      await getBalanceMemeTokens();
    } catch (error) {
      console.error(error);
    }
  };

  const claimTokens = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);
      const IcoContract = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );
      const tx = await IcoContract.claim();
      await tx.wait();
      setLoading(false);
      window.alert("Successfully claimed!");
      await getBalanceMemeTokens();
      await getBalanceOfICO();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const renderButton = () => {
    if (!walletConnect) {
      return (
        <button
          className="bg-gray-700 p-4 w-1/3 shadow-sm mx-auto hover:bg-gray-800 hover:text-gray-200 hover:shadow-xl rounded-xl"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      );
    } else {
      if (loading) {
        return (
          <h1 className="font-5xl text-center text-gray-200 font-medium">
            Loading.....
          </h1>
        );
      } else if (!tokensToBeMinted.isZero()) {
        return (
          <>
            <button
              onClick={claimTokens}
              className="backdrop-blur-lg px-6 border-2 border-gray-800/20 text-gray-200 uppercase p-4 w-1/3 shadow-sm mx-auto hover:bg-gray-800/30 hover:text-gray-100 hover:scale-105 hover:shadow-xl rounded-xl"
            >
              Claim {(tokensToBeMinted as any) * 10} tokens
            </button>
          </>
        );
      } else {
        return (
          <div className="flex flex-row justify-center items-center space-x-3">
            <input
              type="number"
              placeholder="Amount of Tokens to Mint"
              className="border-2 p-4"
              onChange={(e) => {
                if (e.target.value == "") {
                  setTokenAmount(BigNumber.from(0));
                } else {
                  setTokenAmount(BigNumber.from(e.target.value));
                }
              }}
            />
            <button
              disabled={!(tokenAmount > BigNumber.from(0))}
              onClick={() => mintICO(tokenAmount)}
              className="backdrop-blur-lg px-6 border-2 border-gray-800/20 text-gray-200 uppercase p-4 w-1/3 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm mx-auto hover:bg-gray-800/30 hover:text-gray-100 hover:scale-105 hover:shadow-xl rounded-xl"
            >
              Mint
            </button>
          </div>
        );
      }
    }
  };

  return (
    <>
      <Head>
        <title>Meme NFT ICO</title>
        <meta name="description" content="Meme NFT ICO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className="flex w-screen h-screen justify-center items-center"
        style={{
          background: `url(${BGImage.src})`,
          backgroundSize: "cover",
        }}
      >
        {walletConnect ? (
          <div className="w-1/2 flex flex-col justify-center items-center space-y-10 backdrop-blur-md p-12 border-2 border-gray-200/30 shadow-lg">
            <h1 className="text-4xl text-gray-200">
              {utils.formatEther(tokensMinted)}/10,000 tokens Minted
            </h1>
            <h1 className="text-4xl text-gray-200">
              You have {balanceMemeTokens.toString()} NFT token(s).
            </h1>
            {renderButton()}
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <h1 className="text-4xl text-gray-800">
              You have not connected wallet
            </h1>
            {renderButton()}
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
