const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const {
  interface,
  bytecode
} = require('../compile');

let lottery;
let accounts;


beforeEach(async () => {

  //Get a list of all accounts
  accounts = await web3.eth.getAccounts();

  //Use one of the accounts to deploy contract
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode
    })
    .send({
      from: accounts[0],
      gas: '1000000'
    });

  lottery.setProvider(provider);

});

describe('Lottery Contract', () => {
  it('Deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('Allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('Allows multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it('Requires a minimum amount of ether to enter', async () => {
    let e;
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('0.01', 'ether')
      });
    } catch (err) {
      e = err;
    }
    assert(e);
  });

  it('Only manager can call pickWinner', async () => {
    let error;

    try {
      await lottery.methods.pickWinner().send({
        from: accounts[0]
      });
    } catch (e) {
      error = e;
    }
    assert(error);
  });

  it('Sends money to the winner and resets players', async () => {

    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether')
    });
    const initialBalance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });
    const finalBalance = await web3.eth.getBalance(accounts[0]);

    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei('1.8', 'ether'));

  });

});
