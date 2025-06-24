---
permalink: /user-data-stream/
title: "User-Data-Stream"
nav: sidebar/user-data-stream.html
layout: default
---


# Change Log:


# User Data Streams for Coins (2025-06-19)

## General WSS information

* The base endpoint is: **https://api.pro.coins.th**
* A User Data Stream `listenKey` is valid for 60 minutes after creation.
* Doing a `PUT` on a `listenKey` will extend its validity for 60 minutes.
* Doing a `DELETE` on a `listenKey` will close the stream and invalidate the listenKey.
* Doing a `POST` on an account with an active `listenKey` will return the currently active `listenKey` and extend its validity for 60 minutes.
* The base websocket endpoint is: **wss://wsapi.pro.coins.th**
* User Data Streams are accessed at **/openapi/ws/\<listenKey\>**
* A single connection to api endpoint is only valid for 24 hours; expect to be disconnected at the 24 hour mark

## API Endpoints

### Create a listenKey

```shell
POST /openapi/v1/userDataStream
```

Start a new user data stream. The stream will close after 60 minutes unless a keepalive is sent.that listenKey will be returned and its validity will be extended for 60 minutes.

**Weight:** 1

**Parameters:**

None

**Response:**

```javascript
{
  "listenKey": "1A9LWJjuMwKWYP4QQPw34GRm8gz3x5AephXSuqcDef1RnzoBVhEeGE963CoS1Sgj"
}
```

### Ping/Keep-alive a listenKey

```shell
PUT /openapi/v1/userDataStream
```

Keepalive a user data stream to prevent a time out. User data streams will close after 60 minutes. It's recommended to send a ping about every 30 minutes.

**Weight:** 1

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
listenKey | STRING | YES |

**Response:**

```javascript
{}
```

### Close a listenKey

```shell
DELETE /openapi/v1/userDataStream
```

Close out a user data stream.

**Weight:** 1

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
listenKey | STRING | YES |

**Response:**

```javascript
{}
```

## Web Socket Payloads

### Account Update

`outboundAccountPosition` is sent any time an account balance has changed and contains the assets that were possibly changed by the event that generated the balance change.

**Payload:**
balance snapshot

```javascript
{
  "e": "outboundAccountPosition", // Event Type
  "E": 1564034571105,             // Event Time
  "u": 1564034571073,             // Account Last Update time
  "B": [                          // Balance
    {
      "a": "ETH",                 // Asset
      "f": "10000.000000",        // Free
      "l": "0.000000"             // Locked
    }
  ],
  "em": "test@coins.th"          // Account email,This parameter will only be provided when the master account is whitelisted and there has been a balance change on the sub-account.
}
```


### Balance Update

`balanceUpdate`  is pushed upon non trading fund activities - transfer / deposit / withdrawal

**Payload:**
contains balance changed

```javascript
{
  "e": "balanceUpdate",         // Event Type
  "E": 1573200697110,           // Event Time
  "a": "ETH",                   // Asset
  "d": "100.00000000",          // Balance Delta
  "T": 1573200697068,           // Clear Time
  "BS": "CHAIN_DEPOSIT",        // Business Type (CHAIN_DEPOSIT, FIAT_DEPOSIT, TRADE, FEE, FIAT_WITHDRAWAL, CHAIN_WITHDRAWAL, CONVERT, DISTRIBUTION, P2P_TRANSFER, SPOT_TO_CREDIT, CREDIT_TO_SPOT, VIRTUAL_DISTRIBUTE, OTHERS)
  "em": "test@coins.th",        // Account email,This parameter will only be provided when the master account is whitelisted and there has been a balance change on the sub-account.
  "BI": "123456789"             // Business serial number,This parameter will only be provided when the master account is whitelisted and there has been a balance change on the sub-account.
}
```
