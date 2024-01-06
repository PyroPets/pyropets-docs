---
sidebar_position: 2
title: mbrs.exchange
published: true
date: 2024-01-06T12:00:00.000Z
editor: markdown
dateCreated: 2024-01-06T12:00:00.000Z
---

# mbrs.exchange

The Pyro DAO's token buyback mechanism for MBRS.

You can get started exchanging your MBRS for MRX on [mbrs.exchange](https://mbrs.exchange)

![mbrs-exchange.png](/img/mbrs-exchange.png)

## How does mbrs.exchange work?

The system is made up of two smart contracts which utilizes the Metrix DGP system and an AutoGovernor to automatically generate MRX from governance rewards to exchange for MBRS. In addition to the the PyroPets Digital Art Collaborative (PDAC) raises funds for this initiative through the sales of PyroPets related NFTs.

The system is active as long as the AutoGovernor is enrolled in the DGP Governance contract and the balance of the TokenBuyback contract is greater than 1 MRX.

## How is the value of MBRS determined?

The MBRS to MRX exchange rate is determined by the total supply of MBRS and the MRX balance of the TokenBuyback smart contract relative to the amount of MBRS held in the TokenBuyback smart contract.

`MBRS per MRX = ((Total Supply - Locked) * 1e8) / Vault`

## Who controls mbrs.exchange?

This system is currently controlled by the PyroPets developers, and will be transferred to the PyroDAO in the future.
