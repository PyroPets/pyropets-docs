---
sidebar_position: 5
title: Contracts
published: true
date: 2022-01-01T20:07:10.851Z
editor: markdown
dateCreated: 2021-12-10T00:14:17.669Z
---

# Contract Source

## Table of contents

1. [Auction](#Auction)
2. [BaseAuction](#BaseAuction)
3. [SaleAuction ](#SaleAuction)
4. [StokingAuction](#StokingAuction)
5. [IAuction](#IAuction)
6. [Pyro](#Pyro)
7. [PyroAuction](#PyroAuction)
8. [PyroBase](#PyroBase)
9. [PyroCore](#PyroCore)
10. [PyroGenesis](#PyroGenesis)
11. [Embers](#Embers)
12. [MRC20](#MRC20)
13. [MRC20Burnable](#MRC20Burnable)
14. [MRC721](#MRC721)

## Auction<a name="Auction"></a>

```ts
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

struct Auction {
    uint256 tokenId;
    uint256 winningBid;
    uint256 minimumBid;
    uint256 biddingTime;
    uint256 startTime;
    address winningBidder;
    address payable beneficiaryAddress;
    bool ended;
}
```

## BaseAuction<a name="BaseAuction"></a>

```ts
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import '../PyroAuction.sol';
import '../interface/IAuction.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

abstract contract BaseAuction is IAuction, ERC721Holder {
  using Address for address;
  event Canceled();

  event HighestBidIncreased(uint256 tokenId, address bidder, uint256 amount);

  event AuctionEnded(uint256 tokenId, address winner, uint256 amount);

  event AuctionCreated(
    uint256 tokenId,
    uint256 minimumBid,
    uint256 biddingTime,
    address payable beneficiaryAddress
  );

  // Errors that describe failures.

  // The triple-slash comments are so-called natspec
  // comments. They will be shown when the user
  // is asked to confirm a transaction or
  // when an error is displayed.

  /// The auction has already ended.
  error AuctionAlreadyEnded();
  /// There is already a higher or equal bid.
  error BidNotHighEnough(uint256 highestBid);
  /// The bid is below the minimum set at creation.
  error BidBelowMinimum();
  /// The auction has not ended yet.
  error AuctionNotYetEnded();
  /// The function auctionEnd has already been called.
  error AuctionEndAlreadyCalled();
  /// The function is not cancelable.
  error AuctionNotCancelable();

  PyroAuction public core;

  mapping(uint256 => Auction) public auctions;

  mapping(address => uint256) public pendingReturns;

  function createAuction(
    uint256 tokenId,
    uint256 minimumBid,
    uint256 biddingTime,
    address payable beneficiaryAddress
  ) external virtual override returns (bool success) {
    address owner = core.ownerOf(tokenId);
    require(owner == msg.sender || core.isApprovedForAll(owner, msg.sender));

    core.safeTransferFrom(owner, address(this), tokenId);

    if (auctions[tokenId].startTime != 0) revert('Token already on auction');
    Auction memory auction = Auction({
      tokenId: tokenId,
      winningBid: 0,
      minimumBid: minimumBid,
      biddingTime: biddingTime,
      startTime: block.timestamp,
      winningBidder: address(0x0),
      beneficiaryAddress: beneficiaryAddress,
      ended: false
    });
    auctions[tokenId] = auction;
    emit AuctionCreated(tokenId, minimumBid, biddingTime, beneficiaryAddress);
    return true;
  }

  /// Withdraw a bid that was overbid.
  function withdraw() external override returns (bool success) {
    uint256 amount = pendingReturns[msg.sender];
    if (amount > 0) {
      // It is important to set this to zero because the recipient
      // can call this function again as part of the receiving call
      // before `send` returns.
      pendingReturns[msg.sender] = 0;

      if (!payable(msg.sender).send(amount)) {
        // No need to call throw here, just reset the amount owing
        pendingReturns[msg.sender] = amount;
        return false;
      }
    }
    return true;
  }

  /// Cancel the auction only if it has not recieved any bids
  function cancelAuction(uint256 tokenId)
    external
    override
    returns (bool success)
  {
    Auction storage auction = auctions[tokenId];

    if (auction.startTime == 0) revert('Auction does not exist');
    if (auction.beneficiaryAddress != msg.sender) revert('Not beneficiary');
    if (auction.winningBid != 0 || auction.winningBidder != address(0x0)) {
      revert AuctionNotCancelable();
    }

    if (
      block.timestamp > auction.startTime + auction.biddingTime || auction.ended
    ) revert AuctionAlreadyEnded();

    auction.ended = true;
    emit Canceled();
    return true;
  }

  /// End the auction and send the highest bid
  /// to the beneficiary.
  function auctionEnd(uint256 tokenId) external override {
    // It is a good guideline to structure functions that interact
    // with other contracts (i.e. they call functions or send Ether)
    // into three phases:
    // 1. checking conditions
    // 2. performing actions (potentially changing conditions)
    // 3. interacting with other contracts
    // If these phases are mixed up, the other contract could call
    // back into the current contract and modify the state or cause
    // effects (ether payout) to be performed multiple times.
    // If functions called internally include interaction with external
    // contracts, they also have to be considered interaction with
    // external contracts.

    Auction storage auction = auctions[tokenId];

    // 1. Conditions
    if (auction.startTime == 0) revert('Auction does not exist');
    if (block.timestamp < auction.startTime + auction.biddingTime)
      revert AuctionNotYetEnded();
    if (auction.ended) revert AuctionEndAlreadyCalled();

    // 2. Effects
    auction.ended = true;
    emit AuctionEnded(tokenId, auction.winningBidder, auction.winningBid);

    // 3. Interaction
    auction.beneficiaryAddress.transfer(auction.winningBid);
  }

  function getAuction(uint256 _tokenId)
    external
    view
    override
    returns (
      uint256 tokenId,
      uint256 winningBid,
      uint256 minimumBid,
      uint256 biddingTime,
      uint256 startTime,
      address winningBidder,
      address payable beneficiaryAddress,
      bool ended
    )
  {
    Auction storage auction = auctions[_tokenId];
    return (
      auction.tokenId,
      auction.winningBid,
      auction.minimumBid,
      auction.biddingTime,
      auction.startTime,
      auction.winningBidder,
      auction.beneficiaryAddress,
      auction.ended
    );
  }
}
```

## SaleAuction<a name="SaleAuction"></a>

```ts
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import '../PyroAuction.sol';
import './BaseAuction.sol';
import '@openzeppelin/contracts/utils/Address.sol';

contract SaleAuction is BaseAuction {
  using Address for address;

  constructor(address _core) {
    require(_core != address(0x0));
    core = PyroAuction(_core);
  }

  function bid(uint256 tokenId) external payable {
    Auction storage auction = auctions[tokenId];

    // Revert the call if the bidding
    // period is over.
    if (
      block.timestamp > auction.startTime + auction.biddingTime || auction.ended
    ) revert AuctionAlreadyEnded();

    // If the bid is not higher, send the
    // money back (the revert statement
    // will revert all changes in this
    // function execution including
    // it having received the money).
    if (msg.value < auction.minimumBid || msg.value <= auction.winningBid)
      revert BidNotHighEnough(auction.winningBid);

    if (auction.winningBid != 0) {
      // Sending back the money by simply using
      // highestBidder.send(highestBid) is a security risk
      // because it could execute an untrusted contract.
      // It is always safer to let the recipients
      // withdraw their money themselves.
      pendingReturns[auction.winningBidder] += auction.winningBid;
    }
    auction.winningBidder = msg.sender;
    auction.winningBid = msg.value;
    emit HighestBidIncreased(tokenId, msg.sender, msg.value);
  }

  /// Claim the asset being auctioned
  function claim(uint256 tokenId) external override returns (bool success) {
    Auction storage auction = auctions[tokenId];
    if (auction.startTime == 0) revert('Auction does not exist');
    if (!auction.ended) revert AuctionNotYetEnded();
    if (msg.sender == auction.winningBidder) {
      core.safeTransferFrom(
        address(this),
        auction.winningBidder,
        auction.tokenId
      );
    } else if (auction.winningBidder == address(0x0)) {
      core.safeTransferFrom(
        address(this),
        auction.beneficiaryAddress,
        auction.tokenId
      );
    } else {
      revert('Not the winning bidder or the creator');
    }
    delete auctions[tokenId];
    return true;
  }
}
```

## StokingAuction<a name="StokingAuction"></a>

```ts
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import '../Pyro.sol';
import '../PyroAuction.sol';
import './BaseAuction.sol';
import '@openzeppelin/contracts/utils/Address.sol';

contract StokingAuction is BaseAuction {
  using Address for address;

  /// Invalid stoking donor
  error InvalidStokingPair();

  mapping(uint256 => uint256) public donors;

  constructor(address _core) {
    require(_core != address(0x0));
    core = PyroAuction(_core);
  }

  function createAuction(
    uint256 tokenId,
    uint256 minimumBid,
    uint256 biddingTime,
    address payable beneficiaryAddress
  ) external override returns (bool success) {
    if (!core.canStoke(tokenId)) revert('Pyro cannot stoke');
    address owner = core.ownerOf(tokenId);
    require(owner == msg.sender || core.isApprovedForAll(owner, msg.sender));
    core.safeTransferFrom(owner, address(this), tokenId);

    if (auctions[tokenId].startTime != 0) revert('Token already on auction');
    Auction memory auction = Auction({
      tokenId: tokenId,
      winningBid: 0,
      minimumBid: minimumBid,
      biddingTime: biddingTime,
      startTime: block.timestamp,
      winningBidder: address(0x0),
      beneficiaryAddress: beneficiaryAddress,
      ended: false
    });
    auctions[tokenId] = auction;
    emit AuctionCreated(tokenId, minimumBid, biddingTime, beneficiaryAddress);
    return true;
  }

  function stokingCost(uint256 tokenId, uint256 donor)
    public
    view
    returns (uint256 cost)
  {
    uint256 aGeneration = core.generationOfPyro(donor);

    uint256 bGeneration = core.generationOfPyro(tokenId);

    cost = aGeneration > bGeneration
      ? core.pyroGenesisCosts(aGeneration)
      : core.pyroGenesisCosts(bGeneration);
    return cost;
  }

  function bid(uint256 tokenId, uint256 donor) external payable {
    Auction storage auction = auctions[tokenId];

    // Revert the call if the bidding
    // period is over.
    if (
      block.timestamp > auction.startTime + auction.biddingTime || auction.ended
    ) revert AuctionAlreadyEnded();

    if (!core.isValidStokingPair(donor, tokenId)) revert InvalidStokingPair();

    uint256 amount = msg.value - stokingCost(donor, tokenId);

    // If the bid is not higher, send the
    // money back (the revert statement
    // will revert all changes in this
    // function execution including
    // it having received the money).
    if (
      amount < auction.minimumBid || amount <= auction.winningBid || amount < 1
    ) revert BidNotHighEnough(auction.winningBid);

    if (auction.winningBid != 0) {
      // Sending back the money by simply using
      // highestBidder.send(highestBid) is a security risk
      // because it could execute an untrusted contract.
      // It is always safer to let the recipients
      // withdraw their money themselves.
      pendingReturns[auction.winningBidder] += (auction.winningBid +
        stokingCost(donors[auction.tokenId], tokenId));
      core.safeTransferFrom(
        address(this),
        auction.winningBidder,
        donors[auction.tokenId]
      );
    }
    core.safeTransferFrom(msg.sender, address(this), donor);
    auction.winningBidder = msg.sender;
    auction.winningBid = amount;
    donors[auction.tokenId] = donor;
    emit HighestBidIncreased(tokenId, msg.sender, amount);
  }

  /// Claim the asset being auctioned
  function claim(uint256 tokenId) external override returns (bool success) {
    Auction storage auction = auctions[tokenId];
    if (auction.startTime == 0) revert('Auction does not exist');
    if (!auction.ended) revert AuctionNotYetEnded();
    uint256 donorB = auction.tokenId;
    if (
      msg.sender == auction.winningBidder ||
      msg.sender == auction.beneficiaryAddress
    ) {
      if (auction.winningBidder != address(0x0)) {
        uint256 donorA = donors[donorB];
        (bool stoked, ) = address(core).call{
          value: stokingCost(donorA, donorB)
        }(
          abi.encodeWithSignature('stokeWith(uint256,uint256)', donorA, donorB)
        );
        require(stoked, 'Stoking failed');
        core.safeTransferFrom(address(this), auction.winningBidder, donorA);
      }

      core.safeTransferFrom(address(this), auction.beneficiaryAddress, donorB);
    } else if (auction.winningBidder == address(0x0)) {
      core.safeTransferFrom(address(this), auction.beneficiaryAddress, donorB);
    } else {
      revert('Not the winning bidder or the creator');
    }
    delete auctions[tokenId];
    delete donors[tokenId];
    return true;
  }
}
```

## IAuction<a name="IAuction"></a>

```ts
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import '../auction/Auction.sol';

interface IAuction {
  function createAuction(
    uint256 tokenId,
    uint256 minimumBid,
    uint256 biddingTime,
    address payable beneficiaryAddress
  ) external returns (bool success);

  function withdraw() external returns (bool success);

  function claim(uint256 tokenId) external returns (bool success);

  function cancelAuction(uint256 tokenId) external returns (bool success);

  function auctionEnd(uint256 tokenId) external;

  function getAuction(uint256 _tokenId)
    external
    view
    returns (
      uint256 tokenId,
      uint256 winningBid,
      uint256 minimumBid,
      uint256 biddingTime,
      uint256 startTime,
      address winningBidder,
      address payable beneficiaryAddress,
      bool ended
    );
}
```

## Pyro<a name="Pyro"></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

struct Pyro {
    uint256 donorA;
    uint256 donorB;
    uint256 generation;
    string name;
    uint256 ignitionTime;
    uint256 nextPyroGenesis;
    uint256 pyroGenesisCount;
    uint256 stokingWith;
    uint8 hunger;
    uint8 eyes;
    uint8 snout;
    uint8 color;
}
```

## PyroAuction<a name="PyroAuction"></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import './PyroGenesis.sol';
import './auction/Auction.sol';
import './auction/SaleAuction.sol';
import './auction/StokingAuction.sol';

contract PyroAuction is PyroGenesis {
  SaleAuction public immutable saleAuction;
  StokingAuction public immutable stokingAuction;

  constructor(
    string memory _uri,
    uint256 _generationCost,
    uint256 _stokingBaseCost,
    uint256 _timeUnit
  ) PyroGenesis(_uri, _generationCost, _stokingBaseCost, _timeUnit) {
    saleAuction = new SaleAuction(address(this));
    stokingAuction = new StokingAuction(address(this));
  }

  function getSaleAuction(uint256 _tokenId)
    public
    view
    returns (
      uint256 tokenId,
      uint256 winningBid,
      uint256 minimumBid,
      uint256 biddingTime,
      uint256 startTime,
      address winningBidder,
      address payable beneficiaryAddress,
      bool ended
    )
  {
    return saleAuction.getAuction(_tokenId);
  }

  function getStokingAuction(uint256 _tokenId)
    public
    view
    returns (
      uint256 tokenId,
      uint256 winningBid,
      uint256 minimumBid,
      uint256 biddingTime,
      uint256 startTime,
      address winningBidder,
      address payable beneficiaryAddress,
      bool ended
    )
  {
    return stokingAuction.getAuction(_tokenId);
  }
}
```

## PyroBase <a name="PyroBase "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import './Pyro.sol';
import './token/Embers.sol';
import './token/MRC721.sol';

contract PyroBase is MRC721 {
  Embers public immutable embers;
  string public baseURI;

  uint32 public constant gen0Cap = 2**14;
  uint256 public generationCost;
  uint256 public stokingBaseCost;

  uint256[14] public pyroGenesisCosts;

  uint32[14] public pyroGenesisCooldowns;

  uint32 public gen0Count;

  Pyro[] public pyros;

  mapping(uint256 => address) public stokingAllowedToAddress;

  mapping(uint256 => uint256) public lastPlayed;

  mapping(uint256 => uint256) public lastAte;

  mapping(uint256 => uint256) public pyroLevel;

  event Ignition(
    uint256 tokenId,
    string name,
    uint256 donorA,
    uint256 donorB,
    address indexed owner
  );

  uint8[14] public emberRates = [
    uint8(70),
    uint8(47),
    uint8(35),
    uint8(28),
    uint8(23),
    uint8(20),
    uint8(18),
    uint8(16),
    uint8(14),
    uint8(13),
    uint8(12),
    uint8(11),
    uint8(10),
    uint8(9)
  ];

  constructor(
    string memory _uri,
    uint256 _generationCost,
    uint256 _stokingBaseCost,
    uint256 _timeUnit
  ) MRC721('PyroPets', 'PYRO') {
    baseURI = _uri;
    generationCost = _generationCost;
    stokingBaseCost = _stokingBaseCost;
    embers = new Embers(address(this));
    pyroGenesisCosts = [
      uint256(stokingBaseCost / 8),
      uint256(stokingBaseCost / 7),
      uint256(stokingBaseCost / 6),
      uint256(stokingBaseCost / 5),
      uint256(stokingBaseCost / 4),
      uint256(stokingBaseCost / 3),
      uint256(stokingBaseCost / 2),
      uint256(stokingBaseCost),
      uint256(stokingBaseCost * 2),
      uint256(stokingBaseCost * 3),
      uint256(stokingBaseCost * 4),
      uint256(stokingBaseCost * 5),
      uint256(stokingBaseCost * 6),
      uint256(stokingBaseCost * 7)
    ];
    pyroGenesisCooldowns = [
      uint32(35 * _timeUnit),
      uint32(28 * _timeUnit),
      uint32(23 * _timeUnit),
      uint32(20 * _timeUnit),
      uint32(18 * _timeUnit),
      uint32(16 * _timeUnit),
      uint32(14 * _timeUnit),
      uint32(13 * _timeUnit),
      uint32(12 * _timeUnit),
      uint32(11 * _timeUnit),
      uint32(10 * _timeUnit),
      uint32(9 * _timeUnit),
      uint32(8 * _timeUnit),
      uint32(7 * _timeUnit)
    ];
  }

  /**
   * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
   * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
   * by default, can be overriden in child contracts.
   */
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  function generationOfPyro(uint256 tokenId) public view returns (uint256) {
    require(ownerOf(tokenId) != address(0x0));
    return pyros[tokenId].generation;
  }

  function getPyro(uint256 id)
    public
    view
    returns (
      uint256 donorA,
      uint256 donorB,
      uint256 generation,
      string memory name,
      uint256 ignitionTime,
      uint256 nextPyroGenesis,
      uint256 pyroGenesisCount,
      uint256 stokingWith,
      uint8 hunger,
      uint8 eyes,
      uint8 snout,
      uint8 color
    )
  {
    Pyro memory pyro = pyros[id];
    return (
      pyro.donorA,
      pyro.donorB,
      pyro.generation,
      pyro.name,
      pyro.ignitionTime,
      pyro.nextPyroGenesis,
      pyro.pyroGenesisCount,
      pyro.stokingWith,
      pyro.hunger,
      pyro.eyes,
      pyro.snout,
      pyro.color
    );
  }

  function _createRootPyro(string memory _name, address _owner)
    internal
    returns (uint256)
  {
    uint8 eyes = 0;
    uint8 snout = 0;
    Pyro memory pyro = Pyro({
      donorA: 0,
      donorB: 0,
      generation: 0,
      name: _name,
      ignitionTime: block.timestamp,
      nextPyroGenesis: pyroGenesisCooldowns[0],
      pyroGenesisCount: 0,
      stokingWith: 0,
      hunger: 255,
      eyes: eyes,
      snout: snout,
      color: 0x00
    });

    pyros.push(pyro);
    uint256 tokenId = pyros.length - 1;
    emit Ignition(tokenId, _name, 0, 0, _owner);
    _safeMint(_owner, tokenId);
    gen0Count++;
    return tokenId;
  }

  function _createPyro(
    uint256 _donorA,
    uint256 _donorB,
    uint256 _generation,
    string memory _name,
    address _owner
  ) internal returns (uint256) {
    Pyro storage donorA = pyros[_donorA];
    Pyro storage donorB = pyros[_donorB];
    uint8 eyes = donorA.generation <= donorB.generation
      ? donorA.eyes
      : donorB.eyes;
    uint8 snout = donorB.generation <= donorA.generation
      ? donorB.snout
      : donorA.snout;
    if (_generation == 0) {
      require(gen0Count + 1 <= gen0Cap);
      gen0Count++;
      bytes32 genes = keccak256(
        abi.encodePacked(
          block.timestamp,
          block.difficulty,
          blockhash(block.number),
          _name,
          _owner,
          pyros.length
        )
      );

      eyes = uint8(genes[0]) % 32;
      snout = uint8(genes[31]) % 32;
    }

    Pyro memory pyro = Pyro({
      donorA: _donorA,
      donorB: _donorB,
      generation: _generation,
      name: _name,
      ignitionTime: block.timestamp,
      nextPyroGenesis: block.timestamp,
      pyroGenesisCount: 0,
      stokingWith: 0,
      hunger: 255,
      eyes: eyes,
      snout: snout,
      color: 0x00
    });

    pyros.push(pyro);

    uint256 tokenId = pyros.length - 1;
    lastAte[tokenId] = block.timestamp;
    emit Ignition(tokenId, _name, _donorA, _donorB, _owner);
    _safeMint(_owner, tokenId);
    return tokenId;
  }

  function burn(uint256 tokenId) public override {
    _burnPyro(tokenId);
    super.burn(tokenId);
  }

  function _burnPyro(uint256 tokenId) internal {
    Pyro storage pyro = pyros[tokenId];
    require(_isApprovedOrOwner(_msgSender(), tokenId));
    if (pyro.generation == 0) {
      gen0Count--;
    }
    uint8 emberRate = emberRates[pyro.generation > 13 ? 13 : pyro.generation];
    uint256 amount = ((emberRate * (pyroLevel[tokenId] + 1)) /
      (pyro.generation + 1)) * 10;
    (bool success, ) = address(embers).call(
      abi.encodeWithSignature(
        'generateEmbers(uint256,uint256)',
        tokenId,
        amount
      )
    );
    require(success);
    delete pyros[tokenId];
    delete lastAte[tokenId];
    delete lastPlayed[tokenId];
    delete pyroLevel[tokenId];
  }

  /**
   * @dev See {MRC721-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @dev See {MRC721-_beforeTokenTransfer}.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(MRC721) {
    super._beforeTokenTransfer(from, to, tokenId);
    delete stokingAllowedToAddress[tokenId];
  }

  function play(uint256 tokenId) public {
    Pyro storage pyro = pyros[tokenId];
    require(_isApprovedOrOwner(_msgSender(), tokenId));
    require(lastPlayed[tokenId] + 1 days <= block.timestamp);
    require(pyro.hunger > 0);
    (bool success, ) = address(embers).call{value: 0}(
      abi.encodeWithSignature(
        'generateEmbers(uint256,uint256)',
        tokenId,
        uint256(emberRates[pyro.generation > 13 ? 13 : pyro.generation])
      )
    );
    require(success);
    pyroLevel[tokenId] += 1;
    pyro.hunger -= 1;
    lastPlayed[tokenId] = block.timestamp;
  }

  function feed(uint256 tokenId, uint8 amount) public {
    Pyro storage pyro = pyros[tokenId];
    require(pyro.hunger < 255);
    require(_isApprovedOrOwner(_msgSender(), tokenId));

    uint256 allowance = embers.allowance(_msgSender(), address(this));
    require(allowance >= uint256(amount));
    uint256 balance = embers.balanceOf(_msgSender());
    require(balance >= uint256(amount));
    embers.burnFrom(_msgSender(), uint256(amount));
    require(embers.balanceOf(_msgSender()) == balance - uint256(amount));
    pyroLevel[tokenId] += 1;
    pyro.hunger += uint8(amount > 0xff ? 0xff : amount);
  }

  function setColor(uint256 tokenId, uint8 color) public {
    Pyro storage pyro = pyros[tokenId];
    require(_isApprovedOrOwner(_msgSender(), tokenId));
    require(color <= 7);
    uint256 allowance = embers.allowance(_msgSender(), address(this));
    require(allowance >= 100);
    uint256 balance = embers.balanceOf(_msgSender());
    require(balance >= 100);
    embers.burnFrom(_msgSender(), 100);
    require(embers.balanceOf(_msgSender()) == balance - 100);
    pyro.color = color;
  }

  function setName(uint256 tokenId, string calldata name) public {
    Pyro storage pyro = pyros[tokenId];
    require(_isApprovedOrOwner(_msgSender(), tokenId));
    uint256 allowance = embers.allowance(_msgSender(), address(this));
    require(allowance >= 100);
    uint256 balance = embers.balanceOf(_msgSender());
    require(balance >= 100);
    embers.burnFrom(_msgSender(), 100);
    require(embers.balanceOf(_msgSender()) == balance - 100);
    pyro.name = name;
  }

  function levelUp(uint256 tokenId, uint256 amount) public {
    require(_isApprovedOrOwner(_msgSender(), tokenId));
    uint256 allowance = embers.allowance(_msgSender(), address(this));
    require(allowance >= amount);
    uint256 balance = embers.balanceOf(_msgSender());
    require(balance >= amount);
    embers.burnFrom(_msgSender(), amount);
    require(embers.balanceOf(_msgSender()) == balance - amount);
    pyroLevel[tokenId] += amount;
  }
}
```

## PyroCore <a name="PyroCore "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import './token/Embers.sol';
import './PyroAuction.sol';

contract PyroCore is PyroAuction {
  constructor(
    string memory _uri,
    uint256 _generationCost,
    uint256 _stokingBaseCost,
    uint256 _timeUnit
  ) PyroAuction(_uri, _generationCost, _stokingBaseCost, _timeUnit) {
    _createRootPyro('Agni', address(this));
  }
}
```

## PyroGenesis <a name="PyroGenesis "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import './PyroBase.sol';

contract PyroGenesis is PyroBase {
  event FlareUp(address owner, uint256 donorA, uint256 donorB);

  mapping(address => uint256) public lastGen0Mints;

  constructor(
    string memory _uri,
    uint256 _generationCost,
    uint256 _stokingBaseCost,
    uint256 _timeUnit
  ) PyroBase(_uri, _generationCost, _stokingBaseCost, _timeUnit) {}

  function generationZero(string calldata name) public payable {
    require(msg.value >= generationCost);
    require(
      block.timestamp >= lastGen0Mints[_msgSender()] + pyroGenesisCooldowns[0]
    );
    (bool burned, ) = payable(address(0x0)).call{value: generationCost}('');
    require(burned);
    if (msg.value - generationCost > 0) {
      (bool refunded, ) = payable(address(_msgSender())).call{
        value: msg.value - generationCost
      }('');
      require(refunded);
    }
    _createPyro(0, 0, 0, name, _msgSender());
    lastGen0Mints[_msgSender()] = block.timestamp;
  }

  function generationZeroForAddress(string calldata name, address owner)
    public
    payable
  {
    require(msg.value >= generationCost);
    require(
      block.timestamp >= lastGen0Mints[_msgSender()] + pyroGenesisCooldowns[0]
    );
    payable(address(0x0)).transfer(generationCost);
    if (msg.value - generationCost > 0) {
      payable(address(_msgSender())).transfer(msg.value - generationCost);
    }
    _createPyro(0, 0, 0, name, owner);
    lastGen0Mints[owner] = block.timestamp;
  }

  function _triggerCooldown(Pyro storage pyro) internal {
    pyro.nextPyroGenesis = uint64(
      block.timestamp +
        pyroGenesisCooldowns[
          pyro.pyroGenesisCount >= 13 ? 13 : pyro.pyroGenesisCount
        ]
    );
    pyro.pyroGenesisCount += 1;
    pyro.hunger = 127;
  }

  function approveStoking(address addr, uint256 donor) public {
    require(ownerOf(donor) == _msgSender());
    stokingAllowedToAddress[donor] = addr;
  }

  function canStokeWith(uint256 _donorA, uint256 _donorB)
    public
    view
    returns (bool)
  {
    require(_donorA > 0);
    require(_donorB > 0);
    Pyro storage donorA = pyros[_donorA];
    Pyro storage donorB = pyros[_donorB];
    return
      _isValidStokingPair(donorA, _donorA, donorB, _donorB) &&
      _isStokingPermitted(_donorB, _donorA);
  }

  function isValidStokingPair(uint256 _donorAId, uint256 _donorBId)
    public
    view
    returns (bool)
  {
    Pyro storage _donorA = pyros[_donorAId];
    Pyro storage _donorB = pyros[_donorBId];
    return _isValidStokingPair(_donorA, _donorAId, _donorB, _donorBId);
  }

  function _isValidStokingPair(
    Pyro storage _donorA,
    uint256 _donorAId,
    Pyro storage _donorB,
    uint256 _donorBId
  ) private view returns (bool) {
    // same pyro
    if (_donorAId == _donorBId) {
      return false;
    }

    //  donorB parent of donorA
    if (_donorA.donorA == _donorBId || _donorA.donorB == _donorBId) {
      return false;
    }
    //  donorA parent of donorB
    if (_donorB.donorA == _donorAId || _donorB.donorB == _donorAId) {
      return false;
    }
    //   gen0 donors parent
    if ((_donorA.donorB == 0 && _donorA.donorA == 0)) {
      return true;
    }

    //  siblings
    if (_donorB.donorA == _donorA.donorA || _donorB.donorA == _donorA.donorB) {
      return false;
    }
    if (_donorB.donorB == _donorA.donorA || _donorB.donorB == _donorA.donorB) {
      return false;
    }

    return true;
  }

  function _isStokingPermitted(uint256 donorA, uint256 donorB)
    internal
    view
    returns (bool)
  {
    address aOwner = ownerOf(donorA);
    address bOwner = ownerOf(donorB);
    return (aOwner == bOwner || stokingAllowedToAddress[donorB] == aOwner);
  }

  function _isReadyToStoke(Pyro storage _pyro) internal view returns (bool) {
    return
      (_pyro.hunger == 0xff) &&
      (_pyro.stokingWith == 0) &&
      (_pyro.nextPyroGenesis <= block.timestamp);
  }

  function _isReadyToIgnite(Pyro storage _pyro) private view returns (bool) {
    return
      (_pyro.hunger == 0xff) &&
      (_pyro.stokingWith != 0) &&
      (_pyro.nextPyroGenesis <= block.timestamp);
  }

  function _stokeWith(uint256 _donorA, uint256 _donorB) internal {
    Pyro storage donorA = pyros[_donorA];
    Pyro storage donorB = pyros[_donorB];

    donorA.stokingWith = _donorB;

    _triggerCooldown(donorA);
    _triggerCooldown(donorB);

    delete stokingAllowedToAddress[_donorA];

    emit FlareUp(ownerOf(_donorA), _donorA, _donorB);
  }

  function stokeWith(uint256 _donorA, uint256 _donorB) public payable {
    require(
      (ownerOf(_donorA) == _msgSender() ||
        stokingAllowedToAddress[_donorA] == msg.sender) &&
        ownerOf(_donorB) == _msgSender()
    );

    require(_isStokingPermitted(_donorA, _donorB));

    Pyro storage donorA = pyros[_donorA];

    require(_isReadyToStoke(donorA));

    Pyro storage donorB = pyros[_donorB];

    require(_isReadyToStoke(donorB));

    require(_isValidStokingPair(donorA, _donorA, donorB, _donorB));

    uint256 generation = donorA.generation > donorB.generation
      ? donorA.generation
      : donorB.generation;
    uint256 cost = pyroGenesisCosts[generation > 13 ? 13 : generation];
    require(msg.value >= cost);

    (bool burned, ) = payable(address(0x0)).call{value: cost}('');
    require(burned);
    if (msg.value - cost > 0) {
      (bool refunded, ) = payable(address(msg.sender)).call{
        value: msg.value - cost
      }('');
      require(refunded);
    }
    _stokeWith(_donorA, _donorB);
  }

  function canStoke(uint256 tokenId) public view returns (bool) {
    Pyro storage pyro = pyros[tokenId];
    return _isReadyToStoke(pyro);
  }

  function ignite(uint256 _pyro, string calldata _name)
    public
    returns (uint256)
  {
    Pyro storage donorA = pyros[_pyro];
    require(donorA.ignitionTime != 0);

    require(_isReadyToIgnite(donorA));

    uint256 _donorB = donorA.stokingWith;
    Pyro storage donorB = pyros[_donorB];

    uint256 gen = donorA.generation > donorB.generation
      ? donorA.generation + 1
      : donorB.generation + 1;

    address owner = ownerOf(_pyro);
    uint256 pyroId = _createPyro(_pyro, _donorB, gen, _name, owner);

    delete donorA.stokingWith;

    return pyroId;
  }
}
```

## Embers <a name="Embers "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../PyroBase.sol";
import "./MRC20.sol";
import "./MRC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Embers is MRC20, MRC20Burnable {
    uint256 public constant minBurn = 1e11;

    address public immutable base;

    constructor(address _base) MRC20("Embers", "MBRS") {
        base = _base;
    }

    function createEmbers() public payable {
        require(msg.value >= minBurn);
        uint256 amount = msg.value / 1e11;
        require(amount > 0);
        payable(address(0x0)).transfer(msg.value);
        _mint(msg.sender, amount);
    }

    function generateEmbers(uint256 id, uint256 amount) external {
        require(msg.sender == base);
        PyroBase _base = PyroBase(base);
        address owner = _base.ownerOf(id);
        _mint(owner, amount);
    }

    receive() external payable {
        createEmbers();
    }

    fallback() external payable {
        createEmbers();
    }

    function mint() public payable {
        createEmbers();
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}
```

## MRC20 <a name="MRC20  "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MRC20 is ERC20 {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {}
}

```

## MRC20Burnable <a name="MRC20Burnable  "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./MRC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev Extension of {MRC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
abstract contract MRC20Burnable is Context, MRC20 {
    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {MRC20-_burn}.
     */
    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {MRC20-_burn} and {MRC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public virtual {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(
            currentAllowance >= amount,
            "MRC20: burn amount exceeds allowance"
        );
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
    }
}
```

## MRC721 <a name="MRC721   "></a>

```ts
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract MRC721 is ERC721Burnable, ERC721Enumerable {
    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```
