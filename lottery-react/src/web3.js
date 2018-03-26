import Web3 from 'web3';

//We want to use our version of Web3 instead of Metamask's
const web3 = new Web3(window.web3.currentProvider);

export default web3;