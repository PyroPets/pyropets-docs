---
title: Stoking Auction
published: true
date: 2021-12-15T04:04:20.528Z
editor: markdown
dateCreated: 2021-12-14T02:54:05.419Z
---

# Stoking auction

A built in stoking(breeding) auction contract for pyros.

![stoke_auction.png](/img/stoke_auction.png)
Here you can find another pyro with which you are interested in making a stoke, or you can start your own stoke auction

The person with the highest bid will get the pyro back and the future pyro, once the NextPyroGenesis cooldown finish, if you are outbid you will have your pyro back

## Bidding on a stoking auction

- Here you can see a list of all Pyros are in a stoking auction at the moment, or you can use the filter, in this case your Pyro will be the DonorA

![stoauc.png](/img/stoauc.png)

- Select the Pyro you want to bid, and see the details: - Minimun Bid - Current Bid - Bidding End, it is the time on your local browser

## Create Stoking Auction

You can create your own stoking auction to [stoke](/tokens/pyro/stoke) your Pyro, in this case your Pyro will be the DonorB

- Do Create Stoking Auction in stoking auction section or in the Pyro you want to stoke

![create_s_auction.png](/img/create_s_auction.png)

![create_s_auction_p.png](/img/create_s_auction_p.png)

- Confirm the pay fee, and wait for confirmation

- Fill the form

![sto_auction.png](/img/sto_auction.png)

- **Beneficiary Address** - The address to receive the winning bid, or the Pyro if there were no bidders.
- **Minimum Price** - The minimum starting bid for the auction
- **Bidding Time** - The amount of time in seconds to run the auction. Recommended minimum is 1200 seconds (20 minutes) (~13 blocks).
- **Note:** Auctions that are bid on cannot be ended until the bidding time expires.
