var StonksToken = artifacts.require("./StonksToken.sol");

contract('StonksToken', function(accounts) {
	var tokenInstance;

	it('initializes the contract with the correct values', function() {
		return StonksToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.name();
		}).then(function(name){
			assert.equal(name, 'StonksToken', 'has correct name');
			return tokenInstance.symbol();
		}).then(function(symbol){
			assert.equal(symbol, 'Stonk', 'has the correct symbol')
		});
	})

	it('allocates the initial supply upon deployment', function() {
		return StonksToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.totalSupply();
		}).then(function(totalSupply) {
			assert.equal(totalSupply.toNumber(), 100, 'sets the total supply to 100')
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(adminBalance) {
			assert.equal(adminBalance.toNumber(), 100, 'it allocates the initial supply to the admin')
			return tokenInstance.standard();
		}).then(function(standard){
			assert.equal(standard, 'StonksToken v1.0', 'has the correct standard')
		});
	});

	it('transfers token ownership', function() {
    	return StonksToken.deployed().then(function(instance) {
      		tokenInstance = instance;
      		return tokenInstance.transfer.call(accounts[1], 200);
    	}).then(assert.fail).catch(function(error) {
      		assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
      		return tokenInstance.transfer.call(accounts[1], 25, { from: accounts[0] });
    	}).then(function(success) {
  	  		assert.equal(success, true, 'it returns true');
      		return tokenInstance.transfer(accounts[1], 25, { from: accounts[0] });
    	}).then(function(receipt) {
      		assert.equal(receipt.logs.length, 1, 'triggers one event');
      		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      		assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
      		assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
      		assert.equal(receipt.logs[0].args._value, 25, 'logs the transfer amount');
      		return tokenInstance.balanceOf(accounts[1]);
    	}).then(function(balance) {
      		assert.equal(balance.toNumber(), 25, 'adds the amount to the receiving account');
      		return tokenInstance.balanceOf(accounts[0]);
    	}).then(function(balance) {
      		assert.equal(balance.toNumber(), 75, 'deducts the amount from the sending account');
    	});
  	});

	it('approve tokens for delegated transfer', function() {
		return StonksToken.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.approve.call(accounts[1], 5);
		}).then(function(success) {
			assert.equal(success, true, 'it returns true');
			return tokenInstance.approve(accounts[1], 5, { from: accounts[0] });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
      		assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
      		assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
      		assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
      		assert.equal(receipt.logs[0].args._value, 5, 'logs the transfer amount');
      		return tokenInstance.allowance(accounts[0], accounts[1]);
		}).then(function(allowance) {
			assert.equal(allowance.toNumber(), 5, 'stores the allowance for delegted transfer');
		});
	});

	 it('handles delegated token transfers', function() {
    	return StonksToken.deployed().then(function(instance) {
      	tokenInstance = instance;
      	fromAccount = accounts[2];
      	toAccount = accounts[3];
      	spendingAccount = accounts[4];
      	// Transfer some tokens to fromAccount
      	return tokenInstance.transfer(fromAccount, 10, { from: accounts[0] });
    }).then(function(receipt) {
      	// Approve spendingAccount to spend 10 tokens form fromAccount
      	return tokenInstance.approve(spendingAccount, 1, { from: fromAccount });
    }).then(function(receipt) {
      	// Try transferring something larger than the sender's balance
      	return tokenInstance.transferFrom(fromAccount, toAccount, 99, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      	assert(error.message.toString().indexOf('revert') >= 0, 'cannot transfer value larger than balance');
      	// Try transferring something larger than the approved amount
      	return tokenInstance.transferFrom(fromAccount, toAccount, 2, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      	assert(error.message.toString().indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
      	return tokenInstance.transferFrom.call(fromAccount, toAccount, 1, { from: spendingAccount });
    }).then(function(success) {
      	assert.equal(success, true);
      	return tokenInstance.transferFrom(fromAccount, toAccount, 1, { from: spendingAccount });
    }).then(function(receipt) {
      	assert.equal(receipt.logs.length, 1, 'triggers one event');
      	assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      	assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
      	assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
      	assert.equal(receipt.logs[0].args._value, 1, 'logs the transfer amount');
      	return tokenInstance.balanceOf(fromAccount);
    }).then(function(balance) {
      	assert.equal(balance.toNumber(), 9, 'deducts the amount from the sending account');
      	return tokenInstance.balanceOf(toAccount);
    }).then(function(balance) {
      	assert.equal(balance.toNumber(), 1, 'adds the amount from the receiving account');
      	return tokenInstance.allowance(fromAccount, spendingAccount);
    }).then(function(allowance) {
      	assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
    });
  });
});
