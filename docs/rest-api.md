---
title: "Rest-Api"

---


## Change log:


<!--more-->

**# Public Rest API for Coins (2025-06-19)

## General API Information

* The base endpoint is: **https://api.coins.co.th**
* All endpoints return data in either a JSON object or array format.
* Data is returned in **ascending** order, with the oldest records appearing first and the newest records appearing last.
* All time and timestamp related fields are expressed in milliseconds.

## HTTP Return Codes
* HTTP `4XX` return codes are used for malformed requests; the issue is on the sender's side.
* HTTP `403` return code is used when the WAF Limit (Web Application Firewall) has been violated.
* HTTP `429` return code is used when breaking a request rate limit.
* HTTP `418` return code is used when an IP has been auto-banned for continuing to send requests after receiving `429` codes.
* HTTP `5XX` return codes are used for internal errors; the issue is on exchange's side. It is important to **NOT** treat this as a failure operation; the execution status is UNKNOWN and could have been a success.

## Error Codes
* Any endpoint can return an ERROR; the error payload is as follows:

```javascript
{
  "code": -1000,
  "msg": "An unknown error occurred while processing the request."
}
```

* Specific error codes and messages are defined in another document.

## API Library

### Connectors

The following are lightweight libraries that work as connectors to the Coins public API, written in different languages:

* Python <a href="https://github.com/coins-docs/coins-connector-python">https://github.com/coins-docs/coins-connector-python</a> 

### Postman Collections


Postman collections are available, and they are recommended for new users seeking a quick and easy start with the API.

* Postman <a href="https://github.com/coins-docs/coins-api-postman">https://github.com/coins-docs/coins-api-postman</a> 


## General Information on Endpoints

* For `GET` endpoints, parameters must be sent as a `query string`.
* For `POST`, `PUT`, and `DELETE` endpoints, the parameters may be sent as a `query string` or in the `request body` with content type
  `application/x-www-form-urlencoded`. It is also possible to use a combination of parameters in both the query string and the request body if desired.
* Parameters can be sent in any order.
* If a parameter is included in both the `query string` and the `request body`, the value of the parameter from the `query string` will take precedence and be used.



### LIMITS

**General Info on Limits**

* `intervalNum` describes the amount of the interval. For example, `intervalNum 5` with `intervalLetter M` means "Every 5 minutes".

* An HTTP status code 429 will be returned when the rate limit is violated.



### IP Limits

* Each route has a `weight` which determines the number of requests each endpoint counts for. Endpoints with heavier operations or those that involve multiple symbols will have a higher `weight`.
* When a 429 response code is received, it is mandatory for the API user to back off and refrain from making further requests.
* **Repeated failure to comply with rate limits and a disregard for backing off after receiving 429 responses can result in an automated IP ban. The HTTP status code 418 is used for IP bans.**
* IP bans are tracked and their duration increases for repeat offenders, ranging **from 2 minutes to 3 days**.
* A `Retry-After` header is included in 418 or 429 responses, indicating the number of seconds that need to be waited in order to prevent a ban (for 429) or until the ban is lifted (for 418).
* **The limits imposed by the API are based on IP addresses rather than API keys.**



### Order Rate Limits

* When the order count exceeds the limit, you will receive a 429 error without the `Retry-After` header.

* The order rate limit is counted against each IP and UID.



### Websocket Limits

* A single connection can listen to a maximum of 1024 streams.



### /api/ Limit Introduction

* For endpoints related to `/api/*`:

  * There are two modes of limit enforcement: IP limit and UID limit. Each mode operates independently.

  * The IP limit allows a maximum of 1200 requests per minute across all endpoints within the `/api/*` namespace.



### Endpoint Security Type

* Each endpoint is associated with a security type, which indicates how you should interact with it. The security type is specified next to the name of the endpoint.
  * If no security type is mentioned, assume that the security type is NONE.
* API keys are passed to the Rest API via the `X-COINS-APIKEY` header.
* Both API keys and secret keys **are case sensitive**.
* API keys can be configured to have access only to specific types of secure endpoints. For example, one API key may be restricted to TRADE routes only, while another API key can have access to all routes except TRADE.
* By default, API keys have access to all secure routes.

Security Type | Additional parameter          | Description
------------ |-------------------------------| ------------
NONE | none                          | Endpoint can be accessed freely.
TRADE| `X-COINS-APIKEY`、`signature`、`timestamp` | Endpoint requires sending a valid API Key and signature and timing security. 
USER_DATA| `X-COINS-APIKEY`、`signature`、`timestamp`                         | Endpoint requires sending a valid API Key and signature and timing security.. 
USER_STREAM | `X-COINS-APIKEY`                         | Endpoint requires sending a valid API Key.               
MARKET_DATA | `X-COINS-APIKEY`                         | Endpoint requires sending a valid API Key.               

* `USER_DATA` endpoints are `SIGNED` endpoints.



### SIGNED (USER_DATA) Endpoint Security

* `SIGNED` endpoints require an additional parameter, `signature`, to be
  sent in the  `query string` or `form request body` or `header`.
* Endpoints use `HMAC SHA256` signatures. The `HMAC SHA256 signature` is a keyed `HMAC SHA256` operation.
  Use your `secretKey` as the key and `totalParams` as the value for the HMAC operation.
* The `signature` is **not case sensitive**.
* `totalParams` is defined as the `query string` concatenated with the
  `request body`(exclude `signature` parameters and values If signature parameters are in both).
* We recommend the use of the `query string` for GET requests and the `form request body` for POST requests.



### Timing Security

* A `SIGNED` endpoint requires an additional parameter, `timestamp`, to be
  sent in the  `query string` or `form request body` or `header`(Not recommended). The `timestamp` should be in millisecond timestamp indicating when the request was created and sent.
* An optional parameter, `recvWindow`, can be included to specify the validity duration of the request in milliseconds after the timestamp. If `recvWindow` is not provided, **it will default to 5000 milliseconds**.
* The logic is as follows:

  ```javascript
  if (timestamp < (serverTime + 1000) && (serverTime - timestamp) <= recvWindow) {
    // process request
  } else {
    // reject request
  }
  ```

**Serious trading is about timing.** Networks can be unstable and unreliable,
which can lead to requests taking varying amounts of time to reach the
servers. With `recvWindow`, you can specify that the request must be
processed within a certain number of milliseconds or be rejected by the
server.

**To ensure optimal performance, it is recommended to use a `recvWindow` value of 5000 milliseconds or less. The maximum value allowed for `recvWindow` is 60,000 milliseconds and should not exceed this limit.**



### SIGNED Endpoint Examples for POST /openapi/convert/v1/get-quote

Here is a step-by-step example of how to send a valid signed payload from the
Linux command line using `echo`, `openssl`, and `curl`:

Key | Value
------------ | ------------
apiKey | tAQfOrPIZAhym0qHISRt8EFvxPemdBm5j5WMlkm3Ke9aFp0EGWC2CGM8GHV4kCYW
secretKey | lH3ELTNiFxCQTmi9pPcWWikhsjO04Yoqw3euoHUuOLC3GYBW64ZqzQsiOEHXQS76

Parameter | Value
------------ | ------------
sourceCurrency | BTC
targetCurrency | THB
recvWindow | 5000
timestamp | 1538323200000



#### Example 1: As a query string

* **queryString:** sourceCurrency=BTC&targetCurrency=THB&recvWindow=5000&timestamp=1538323200000
* **HMAC SHA256 signature:**

```shell
[linux]$ echo -n "sourceCurrency=BTC&targetCurrency=THB&recvWindow=5000&timestamp=1538323200000" | openssl dgst -sha256 -hmac "lH3ELTNiFxCQTmi9pPcWWikhsjO04Yoqw3euoHUuOLC3GYBW64ZqzQsiOEHXQS76"
(stdin)= 6a2cfc4f792ff338ed413ec2197540b46fead0e43c143eb5d04992a4d7d6622d
``` 

* **curl command:**

```shell
(HMAC SHA256)
[linux]$ curl -H "X-COINS-APIKEY: tAQfOrPIZAhym0qHISRt8EFvxPemdBm5j5WMlkm3Ke9aFp0EGWC2CGM8GHV4kCYW" -X POST 'https://$HOST/openapi/convert/v1/get-quote?sourceCurrency=BTC&targetCurrency=THB&recvWindow=5000&timestamp=1538323200000&signature=6a2cfc4f792ff338ed413ec2197540b46fead0e43c143eb5d04992a4d7d6622d'
```



#### Example 2: As a request body

* **requestBody:** sourceCurrency=BTC&targetCurrency=THB&recvWindow=5000&timestamp=1538323200000
* **HMAC SHA256 signature:**

```shell
[linux]$ echo -n "sourceCurrency=BTC&targetCurrency=THB&recvWindow=5000&timestamp=1538323200000" | openssl dgst -sha256 -hmac "lH3ELTNiFxCQTmi9pPcWWikhsjO04Yoqw3euoHUuOLC3GYBW64ZqzQsiOEHXQS76"
(stdin)= 6a2cfc4f792ff338ed413ec2197540b46fead0e43c143eb5d04992a4d7d6622d
```

* **curl command:**

```shell
(HMAC SHA256)
[linux]$ curl -H "X-COINS-APIKEY: tAQfOrPIZAhym0qHISRt8EFvxPemdBm5j5WMlkm3Ke9aFp0EGWC2CGM8GHV4kCYW" -X POST 'https://$HOST/openapi/convert/v1/get-quote' -d 'sourceCurrency=BTC&targetCurrency=THB&recvWindow=5000&timestamp=1538323200000&signature=6a2cfc4f792ff338ed413ec2197540b46fead0e43c143eb5d04992a4d7d6622d'
```



#### Example 3: Mixed query string and request body

* **queryString:** sourceCurrency=BTC&targetCurrency=THB
* **requestBody:** recvWindow=5000&timestamp=1538323200000
* **HMAC SHA256 signature:**

```shell
[linux]$ echo -n "sourceCurrency=BTC&targetCurrency=THBrecvWindow=5000&timestamp=1538323200000" | openssl dgst -sha256 -hmac "lH3ELTNiFxCQTmi9pPcWWikhsjO04Yoqw3euoHUuOLC3GYBW64ZqzQsiOEHXQS76"
(stdin)= ce922a44572e6433789c78f525738379ea0052551e4d65c1771ce8059c902b42
```

* **curl command:**

```shell
(HMAC SHA256)
[linux]$ curl -H "X-COINS-APIKEY: tAQfOrPIZAhym0qHISRt8EFvxPemdBm5j5WMlkm3Ke9aFp0EGWC2CGM8GHV4kCYW" -X POST 'https://$HOST/openapi/convert/v1/get-quote?sourceCurrency=BTC&targetCurrency=THB' -d 'recvWindow=5000&timestamp=1538323200000&signature=ce922a44572e6433789c78f525738379ea0052551e4d65c1771ce8059c902b42'
```

Note that in Example 3, the signature is different from the previous examples. Specifically, there should be no `&` character between `THB` and `recvWindow=5000`.


## Public API Endpoints

### Terminology

These terms will be used throughout the documentation, so new users are encouraged to read them to help their understanding of the API.

* `base asset` refers to the asset that is the `quantity` of a symbol. For the symbol BTCTHB, BTC would be the `base asset`.
* `quote asset` refers to the asset that is the `price` of a symbol. For the symbol BTCTHB, THB would be the `quote asset`.



### General endpoints

#### Test connectivity

```shell
GET /openapi/v1/ping
```

Test connectivity to the Rest API.

**Weight:** 1

**Parameters:** NONE

**Response:**

```javascript
{}
```



#### Check server time

```shell
GET /openapi/v1/time
```

Test connectivity to the Rest API and get the current server time.

**Weight:** 1

**Parameters:** NONE

**Response:**

```javascript
{
  "serverTime": 1538323200000
}
```



#### Get user ip

```shell
GET /openapi/v1/user/ip
```

Get the user ip.

**Weight:** 1

**Parameters:** NONE

**Response:**

```javascript
{
  "ip": "57.181.16.43"
}
```



### Wallet endpoints

#### All Coins' Information (USER_DATA)

```shell
GET /openapi/wallet/v1/config/getall  (HMAC SHA256)
```

Get information on coins (available for deposit and withdrawal) for the user.

**Weight(IP):** 10

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
recvWindow | LONG | NO |
timestamp | LONG | YES |

**Response:**

```javascript
[
    {
        "coin": "ETH",
        "name": "ETH",
        "depositAllEnable": true,
        "withdrawAllEnable": true,
        "free": "1.9144",
        "locked": "0.0426",
        "networkList": [
            {
                "addressRegex": "0x([0-9a-fA-F]){40}",
                "memoRegex": "^[0-9A-Za-z\\-_]{1,120}$",
                "network": "ETH",
                "name": "ERC20",
                "depositEnable": true,
                "minConfirm": 8,
                "unLockConfirm": 12,
                "withdrawDesc": "1234567890",
                "withdrawEnable": true,
                "withdrawFee": "0",
                "withdrawIntegerMultiple": "0.00000001",
                "withdrawMax": "1",
                "withdrawMin": "0.001",
                "sameAddress": false
            }
        ],
        "legalMoney": false
    }
  ]
```



#### Deposit Address (USER_DATA)

```shell
GET /openapi/wallet/v1/deposit/address  (HMAC SHA256)
```

Fetch a deposit address along with its network.

**Weight(IP):** 10

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
coin | STRING | YES | The value is from All Coins' Information API
network | STRING | YES | The value is from All Coins' Information API
recvWindow | LONG | NO |
timestamp | LONG | YES |

**Response:**

```javascript
{
    "coin": "ETH",
    "address": "0xfe98628173830bf79c59f04585ce41f7de168784",
    "addressTag": ""
}
```



#### Withdraw (USER_DATA)

```shell
POST /openapi/wallet/v1/withdraw/apply  (HMAC SHA256)
```

Submit a withdrawal request.

**Weight(UID):** 100

**Parameters:**

| Name            | Type    | Mandatory | Description                                              |
| --------------- | ------- | --------- | -------------------------------------------------------- |
| coin            | STRING  | YES       |                                                          |
| network         | STRING  | YES       |                                                          |
| address         | STRING  | YES       |                                                          |
| addressTag      | STRING  | NO        | Secondary address identifier for coins like XRP,XMR etc. |
| amount          | DECIMAL | YES       |                                                          |
| withdrawOrderId | STRING  | NO        | client id for withdraw, length is limited to 30.         |
| recvWindow      | LONG    | NO        |                                                          |
| timestamp       | LONG    | YES       |                                                          |

* Please note that the `coin`/`network`/`address`/`addressTag` combination **MUST** be in the withdrawal address whitelist. You must set up the withdrawal address whitelist before making this API call.

**Response:**

```javascript
{
  "id":"459165282044051456"
}
```



#### Deposit History (USER_DATA)

```shell
GET /openapi/wallet/v1/deposit/history  (HMAC SHA256)
```

Fetch deposit history.

**Weight(IP):** 2

**Parameters:**

| Name       | Type   | Mandatory | Description                                                  |
| ---------- | ------ | --------- | ------------------------------------------------------------ |
| coin       | STRING | NO        |                                                              |
| txId       | STRING | NO        |                                                              |
| status     | INT    | NO        | 0-PROCESSING, 1-SUCCESS, 2-FAILED, 3-NEED_FILL_DATA(travel rule info) |
| statuses   | STRING | NO        | Specify multiple statuses using commas, for example: statuses=1,3 |
| startTime  | LONG   | NO        | Default: 90 days from current timestamp                      |
| endTime    | LONG   | NO        | Default: current timestamp                                   |
| offset     | INT    | NO        | Default:0                                                    |
| limit      | LONG   | NO        | Default:1000, Max:1000                                       |
| recvWindow | LONG   | NO        |                                                              |
| timestamp  | LONG   | YES       |                                                              |

* Please note the default `startTime` and `endTime` to ensure the time interval is within 0-90 days.

* If both `startTime` and `endTime` are sent, time between `startTime` and `endTime` must be less than 90 days.

* Please note you can send either `status` or `statuses`, but not both.


**Response:**

```javascript
[
    {
        "id": "d_769800519366885376",
        "amount": "0.001",
        "coin": "BTC",
        "network": "BTC",
        "status": 0,
        "address": "15g7UoRTVjAdUnHyRMCt4RrZ4m1Aib61rr",
        "addressTag": "",
        "txId": "98A3EA560C6B3336D348B6C83F0F95ECE4F1F5919E94BD006E5BF3BF264FACFC",
        "insertTime": 1661493146000,
        "confirmNo": 10,
    },
    {
        "id": "d_769754833590042625",
        "amount":"0.5",
        "coin":"ETH",
        "network":"ETH",
        "status":1,
        "address":"0x386AE30AE2dA293987B5d51ddD03AEb70b21001F",
        "addressTag":"",
        "txId":"0x4ae2fed36a90aada978fc31c38488e8b60d7435cfe0b4daed842456b4771fcf7",
        "insertTime":1599620082000,
        "confirmNo": 20,
    }
]
```



#### Withdraw History (USER_DATA)

```shell
GET /openapi/wallet/v1/withdraw/history  (HMAC SHA256)
```

Fetch withdrawal history.

**Weight(IP):** 2

**Parameters:**

| Name       | Type   | Mandatory | Description                                                  |
| ---------- | ------ | --------- | ------------------------------------------------------------ |
| coin       | STRING | NO        |                                                              |
| withdrawOrderId       | STRING | NO      |                                                              |
| status     | INT    | NO        | 0-PROCESSING, 1-SUCCESS, 2-FAILED |
| startTime  | LONG   | NO        | Default: 90 days from current timestamp                      |
| endTime    | LONG   | NO        | Default: current timestamp                                   |
| offset     | INT    | NO        | Default:0                                                    |
| limit      | LONG   | NO        | Default:1000, Max:1000                                       |
| recvWindow | LONG   | NO        |                                                              |
| timestamp  | LONG   | YES       |                                                              |

* Please note the default `startTime` and `endTime` to ensure the time interval is within 0-90 days.

* If both `startTime` and `endTime` are sent, time between `startTime` and `endTime` must be less than 90 days.

* If `withdrawOrderId` is sent, time between `startTime` and `endTime` must be less than 7 days.

* If `withdrawOrderId` is sent and `startTime` and `endTime` are not provided, the API will return records from the last 7 days by default.


**Response:**

```javascript
[
    {
        "id": "459890698271244288",
        "amount": "0.01",
        "transactionFee": "0",
        "coin": "ETH",
        "status": 1,
        "address": "0x386AE30AE2dA293987B5d51ddD03AEb70b21001F",
        "addressTag": "",
        "txId": "0x4ae2fed36a90aada978fc31c38488e8b60d7435cfe0b4daed842456b4771fcf7",
        "applyTime": 1673601139000,
        "network": "ETH",
        "withdrawOrderId": "thomas123",
        "info": "",
        "confirmNo": 100
    },
    {
        "id": "451899190746456064",
        "amount": "0.00063",
        "transactionFee": "0.00037",
        "coin": "ETH",
        "status": 1,
        "address": "0x386AE30AE2dA293987B5d51ddD03AEb70b21001F",
        "addressTag": "",
        "txId": "0x62690ca4f9d6a8868c258e2ce613805af614d9354dda7b39779c57b2e4da0260",
        "applyTime": 1671695815000,
        "network": "ETH",
        "withdrawOrderId": "",
        "info": "",
        "confirmNo": 100
    }
]
```



#### Transfers (USER_DATA)

```shell
POST /openapi/transfer/v3/transfers
```
This endpoint is used to transfer funds between two accounts.

**Weight:** 50

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
client_transfer_id | STRING | NO | Client Transfer ID, cannot send duplicate ID
account      | STRING | YES    | Either the token (e.g. THB, BTC, ETH) or the Balance ID (e.g. `1447779051242545455`) to be transferred.
target_address   | STRING | YES    | The phone number or email for recipient account (e.g. `+63 9686490252` or `testsub@gmail.com`)
amount      | BigDecimal | YES    | The amount being transferred
recvWindow | LONG  | NO    | This value cannot be greater than `60000`
timestamp     | LONG  | YES    | A point in time when the transfer is performed
message     | STRING  | NO    | The message sent to the recipient account

If the client_transfer_id or id parameter is passed in, the type parameter is invalid.

**Request:**
```javascript
{
  "account": "1451431230880900352",
  "target_address": "christina@coins.ph",
  "amount": "1232"
}
```

**Response:**
```javascript
{
  "transfer":
    {
      "id": "1451431230880900352",
      "status": "success",//status enum: pending,success,failed
      "account": "90dfg03goamdf02fs",
      "target_address": "testsub@gmail.com",
      "amount": "1",
      "exchange": "1",
      "payment": "23094j0amd0fmag9agjgasd",
      "client_transfer_id": "1487573639841995271",
      "message": "example",
      "errorMessage":""//Error message returned when transfer fails, eg: Insufficient balance
     }
}
```



#### Account information (USER_DATA)

```shell
GET /openapi/v1/account (HMAC SHA256)
```

GET current account information.

**Weight:** 10

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
recvWindow | LONG | NO |The value cannot be greater than `60000`
timestamp | LONG | YES |

**Response:**

```javascript
{
   "canDeposit":true,
   "canTrade":true,
   "canWithdraw":true,
   "balances":[
      {
         "asset":"ETH",
         "free":"0.1",
         "locked":"0"
      },
      {
         "asset":"BTC",
         "free":"0.00005",
         "locked":"0"
      }
   ],
   "token":"THB",
   "daily":{
      "cashInLimit":"500000",
      "cashInRemaining":"499994",
      "cashOutLimit":"500000",
      "cashOutRemaining":"500000",
      "totalWithdrawLimit":"500000",
      "totalWithdrawRemaining":"500000"
   },
   "monthly":{
      "cashInLimit":"10000000",
      "cashInRemaining":"9999157",
      "cashOutLimit":"10000000",
      "cashOutRemaining":"10000000",
      "totalWithdrawLimit":"10000000",
      "totalWithdrawRemaining":"10000000"
   },
   "annually":{
      "cashInLimit":"120000000",
      "cashInRemaining":"119998577",
      "cashOutLimit":"120000000",
      "cashOutRemaining":"119999488",
      "totalWithdrawLimit":"120000000",
      "totalWithdrawRemaining":"119998487.97"
   },
   "updateTime":1707273549694
}
```



### Convert endpoints
#### Get supported trading pairs (TRADE)
```shell
POST /openapi/convert/v1/get-supported-trading-pairs
```

This continuously updated endpoint returns a list of all available trading pairs. 

**Weight:** 1

**Parameters:**

 N/A



**Response:**

Field name	| Description
----|---
sourceCurrency	| Source token.
targetCurrency	| Target token.
minSourceAmount	| amount range min value.
maxSourceAmount	| amount range max value.
precision	| The level of precision in decimal places used.

```javascript
{
  "status":0, 
  "error":"OK",
  "data":[
     {
      "sourceCurrency":"THB",
      "targetCurrency":"BTC",
      "minSourceAmount":"1000",
      "maxSourceAmount":"15000",
      "precision":"2"
    },
    {
      "sourceCurrency":"BTC",
      "targetCurrency":"THB",
      "minSourceAmount":"0.0001",
      "maxSourceAmount":"0.1",
      "precision":"8"
    },
    {
      "sourceCurrency":"THB",
      "targetCurrency":"ETH",
      "minSourceAmount":"1000",
      "maxSourceAmount":"18000",
      "precision":"2"
    },
    {
      "sourceCurrency":"ETH",
      "targetCurrency":"THB",
      "minSourceAmount":"0.003",
      "maxSourceAmount":"4.2",
      "precision":"8"
    }
  ]
}
```



#### Fetch a quote (TRADE)

```shell
POST /openapi/convert/v1/get-quote
```

This endpoint returns a quote for a specified source currency (sourceCurrency) and target currency (targetCurrency) pair.

**Weight:** 1

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ |-----------| ------------
sourceCurrency | STRING | YES       |The currency the user holds
targetCurrency | STRING | YES       |The currency the user would like to obtain
sourceAmount | STRING | NO        |The amount of sourceCurrency. You only need to fill in either the source amount or the target amount. If both are filled, it will result in an error.
targetAmount | STRING | NO        |The amount of targetCurrency. You only need to fill in either the source amount or the target amount. If both are filled, it will result in an error.

**Response:**

Field name	| Description
----|---
quoteId	| Quote unique id.
sourceCurrency	| Source token.
targetCurrency	| Target token.
sourceAmount	| Source token amount.
price	| Trading pairs price.
targetAmount	| Targe token amount.
expiry	| Quote expire time seconds.

```javascript
{
  "status": 0, 
  "error": "OK", 
  "data": {
            "quoteId": "2182b4fc18ff4556a18332245dba75ea",
            "sourceCurrency": "BTC",
            "targetCurrency": "THB",
            "sourceAmount": "0.1",
            "price": "59999",             //1BTC=59999THB
            "targetAmount": "5999",       //The amount of THB the user holds
            "expiry": "10"
  }
}
```

#### Accept the quote (TRADE)


```shell
POST /openapi/convert/v1/accept-quote
```

Use this endpoint to accept the quote and receive the result instantly.

**Weight:** 1

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
quoteId | STRING | YES |The ID assigned to the quote


**Response:**

Field name	| Description
----|---
status	| 0 mean order are created. 
data.orderId	| Order ID generated by the server.
data.status	| The order status is an enumeration with values `SUCCESS`, `PROCESSING`;PROCESSING mean that the server is processing,SUCCESS means the order is successful.

```javascript
{
  "status": 0, 
  "data": {
         "orderId" : "49d10b74c60a475298c6bbed08dd58fa",
         "status": "SUCCESS"
  },
  "error": "ok"
}
```

***Error code description:***

status code           | Description
----------------| ------------
0 | means that the call is processed normally.(Applicable to other endpoint if there is a status structure)
10000003 | Failed to fetch account verification information.
10000003 | Quote expired.
10000003 | Unable to fetch account information.
10000003 | The price has changed! Please confirm the updated rate to complete the transaction.
10000003 | Insufficient balance.
10000003 | Failed to fetch liquidity. Try again later.

#### Retrieve order history (USER_DATA)


```shell
POST /openapi/convert/v1/query-order-history
```
This endpoint retrieves order history with the option to define a specific time period using start and end times.

**Weight:** 1

**Parameters:**

Name | Type   | Mandatory | Description
------------ |--------|---------| ------------
startTime | STRING | No | Numeric string representing milliseconds. The starting point of the required period. If no period is defined, the entire order history is returned.
endTime | STRING | No |Numeric string representing milliseconds. The end point of the required period. If no period is defined, the entire order history is returned.
status | STRING | No | deliveryStatus, If this field is available, use it with startTime. `TODO`, `SUCCESS`, `FAILED`, `PROCESSING`
page | int    | No |
size | int    | No |


**Response:**

Field name	| Description
----|---
orderId	| Order ID generated by the server.
quoteId	| Order reference quote Id.
userId	| user id.
sourceCurrency	| source currency.
targetCurrency	| target currency.
sourceAmount	| source currency amount.
targetAmount	| target currency amount.
price	| price.
status	| Order status.`TODO`, `SUCCESS`, `FAILED`, `PROCESSING`
createdAt	| Order create time.
errorMessage	| Error message if order failed.



```javascript
{
  "status": 0,
   "error": "OK",
   "data": [
    {
      "id":"",
      "orderId": "25a9b92bcd4d4b2598c8be97bc65b466",
      "quoteId": "1ecce9a7265a4a329cce80de46e2c583",
      "userId":"",
      "sourceCurrency": "BTC",
      "sourceCurrencyIcon":"",
      "targetCurrency": "THB",
      "targetCurrencyIcon":"",
      "sourceAmount": "0.11",
      "targetAmount": "4466.89275956",
      "price": "40608.115996",
      "status": "SUCCESS",
      "createdAt": "1671797993000",
      "errorCode": "",
      "errorMessage": "",
      "inversePrice": "3306.115996"
    }
  ],
  "total": 23
}
```



### User data stream endpoints

Specifics on how user data streams work is in another document(user-data-stream.md).



#### Start user data stream (USER_STREAM)

```shell
POST /openapi/v1/userDataStream
```

Start a new user data stream. The stream will close after 60 minutes unless a keepalive is sent.

**Weight:** 1

**Parameters:**

None

**Response:**

```javascript
{
  "listenKey": "xDqtskqOciCzRashthgjTHBcymasBBShEEzPiXgOGEujviYWCuyYwcPDVPeezJOT"
}
```



#### Keepalive user data stream (USER_STREAM)

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



#### Close user data stream (USER_STREAM)

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



## Sub-account endpoints

### Query Sub-account List (For Master Account)

Applies to master accounts only.

```shell
GET /openapi/v1/sub-account/list
```

**Weight:** 1

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
email      | STRING | NO    | Sub account email
page    | INT | NO | Current page, default value: 1
limit    | INT | NO | Quantity per page, default value 10, maximum `200`
recvWindow | LONG  | NO    | This value cannot be greater than `60000`
timestamp     | LONG  | YES    | A point in time for which transfers are being queried.


**Response:**
```json
{
  "subAccounts": [
    {
      "createTime": "1689744671462",
      "email": "testsub@gmail.com",
      "isFreeze": false
    },
    {
      "createTime": "1689744700710",
      "email": "testsub2@gmail.com",
      "isFreeze": false
    }
  ],
 "total": 2
}
```

### Create a Virtual Sub-account(For Master Account)

This interface currently supports the creation of virtual sub-accounts (maximum 30).

```shell
POST /openapi/v1/sub-account/create
```

**Weight:** 1

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
accountName      | STRING | YES       | Sub account email
recvWindow | LONG  | NO        | This value cannot be greater than `60000`
timestamp     | LONG  | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "email": "testsub@gmail.com",
  "createTime": 1689744700710,
  "isFreeze": false
}
```


### Query Sub-account Assets (For Master Account)

Query detailed balance information of a sub-account via the master account (applies to master accounts only).

```shell
GET /openapi/v1/sub-account/asset
```

**Weight:** 1

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
email      | STRING | YES       | Sub account email
recvWindow | LONG  | NO        | This value cannot be greater than `60000`
timestamp     | LONG  | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "balances": [
    {
      "asset": "BTC",
      "free": "0.1",
      "locked": "0"
    },
    {
      "asset": "ETH",
      "free": "0.1",
      "locked": "0"
    }
  ]
}
```



### Universal Transfer (For Master Account)

Master account can initiate a transfer from any of its sub-accounts to the master account, or from the master account to any sub-account.

```shell
POST /openapi/v1/sub-account/transfer/universal-transfer
```

**Weight:** 1

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
fromEmail      | STRING | NO        | 
toEmail      | STRING | NO        | 
clientTranId      | STRING | NO        | Must be unique
asset      | STRING | YES       | 
amount      | DECIMAL | YES        | 
recvWindow | LONG  | NO        | This value cannot be greater than `60000`
timestamp     | LONG  | YES       | A point in time for which transfers are being queried.

- Transfer from master account by default if fromEmail is not sent.
- Transfer to master account by default if toEmail is not sent.
- Specify at least one of fromEmail and toEmail.
- Supported transfer scenarios:
  - Master account transfer to sub-account 
  - Sub-account transfer to master account 
  - Sub-account transfer to Sub-account


**Response:**
```json
{
  "clientTransferId": "1487573639841995271",
  "result": true//true:success,false:failed
}
```

### Transfer to Master (For Sub-account)

Sub-account can initiate a transfer from itself to the master account.

```shell
POST /openapi/v1/sub-account/transfer/sub-to-master
```

**Weight:** 1

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
asset      | STRING | YES       |
amount      | DECIMAL | YES        |
clientTranId      | STRING | NO        | Must be unique
recvWindow | LONG  | NO        | This value cannot be greater than `60000`
timestamp     | LONG  | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "clientTransferId": "1487573639841995271",
  "result": true//true:success,false:failed
}
```

### Query Universal Transfer History (For Master Account)

Applies to master accounts only.
If startTime and endTime are not sent, this will return records of the last 30 days by default.

```shell
GET /openapi/v1/sub-account/transfer/universal-transfer-history
```

**Weight:** 1

**Parameters:**

Name       | Type  | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
fromEmail      | STRING | NO        |
toEmail      | STRING | NO        |
clientTranId      | STRING | NO        | 
tokenId      | STRING | NO        | 
startTime      | LONG | NO        | Millisecond timestamp
endTime      | LONG | NO        | Millisecond timestamp,Data excluding the endTime.
page      | INT | NO        | Current page, default value: 1
limit      | INT | NO        | Quantity per page, default value `500`, maximum `500`
recvWindow | LONG  | NO        | This value cannot be greater than `60000`
timestamp     | LONG  | YES       | A point in time for which transfers are being queried.


- fromEmail and toEmail cannot be sent at the same time.
- Return fromEmail equal master account email by default.
- The query time period must be less than 30 days. 
- If startTime and endTime not sent, return records of the last 30 days by default.

**Response:**
```json
{
  "result": [
    {
      "clientTranId": "1",
      "fromEmail": "testsub@gmail",
      "toEmail": "testsub1@gmail",
      "asset": "BTC",
      "amount": "0.1",
      "createdAt": 1689744700710,
      "status": "success"//success,pending,failed
    }
  ],
  "total": 1
}
```


### Sub-account Transfer History (For Sub-account)

Applies to sub-accounts only.
If startTime and endTime are not sent, this will return records of the last 30 days by default.

```shell
GET /openapi/v1/sub-account/transfer/sub-history
```

**Weight:** 1

**Parameters:**

Name       | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
asset      | STRING | NO        |
type      | INT | NO        | 1: transfer in, 2: transfer out. If the type parameter is not provided or provided incorrectly, the data returned will be for transfer out.
startTime      | LONG   | NO        | Millisecond timestamp
endTime      | LONG   | NO        | Millisecond timestamp,Data excluding the endTime.
page      | INT    | NO        | Current page, default value: 1
limit      | INT | NO        | Quantity per page, default value `500`, maximum `500`
recvWindow | LONG   | NO        | This value cannot be greater than `60000`
timestamp     | LONG   | YES       | A point in time for which transfers are being queried.
clientTranId     | STRING   | NO       |

- If type is not sent, the records of type 2: transfer out will be returned by default.
- If startTime and endTime are not sent, the recent 30-day data will be returned.

**Response:**
```json
{
  "result": [
    {
      "clientTranId": "1",
      "fromEmail": "testsub@gmail",
      "toEmail": "testsub1@gmail",
      "asset": "BTC",
      "amount": "0.1",
      "createdAt": 1689744700710,
      "status": "success"//success,pending,failed
    }
  ],
  "total": 1
}
```


### Get IP Restriction for a Sub-account API Key (For Master Account)

Query detailed IPs for a sub-account API key.

```shell
GET /openapi/v1/sub-account/apikey/ip-restriction
```

**Weight:** 1

**Parameters:**

Name       | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
apikey      | STRING | YES        | 
email      | STRING | YES        | 	Sub account email
recvWindow | LONG   | NO        | This value cannot be greater than `60000`
timestamp     | LONG   | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "apikey": "k5V49ldtn4tszj6W3hystegdfvmGbqDzjmkCtpTvC0G74WhK7yd4rfCTo4lShf",
  "ipList": [
    "8.8.8.8"
  ],
  "ipRestrict": true,
  "role": "2,3,4,5,6",//0:READ_ONLY, 2:TRADE_ONLY, 3:CONVERT_ONLY, 4:CRYPTO_WALLET_ONLY, 5:FIAT_ONLY, 6:ACCOUNT_ONLY
  "updateTime": 1689744700710
}
```

###  Add IP Restriction for Sub-Account API key (For Master Account)

```shell
POST /openapi/v1/sub-account/apikey/add-ip-restriction
```

**Weight:** 1

**Parameters:**

Name       | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
apikey      | STRING | YES       |
email      | STRING | YES       | 	Sub account email
ipAddress      | STRING | NO        | 	Can be added in batches, separated by commas
ipRestriction      | STRING | YES       | 	IP Restriction status. 2 = IP Unrestricted. 1 = Restrict access to trusted IPs only.
recvWindow | LONG   | NO        | This value cannot be greater than `60000`
timestamp     | LONG   | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "apikey": "k5V49ldtn4tszj6W3hystegdfvmGbqDzjmkCtpTvC0G74WhK7yd4rfCTo4lShf",
  "ipList": [
    "8.8.8.8"
  ],
  "ipRestrict": true,
  "role": "2,3,4,5,6",//0:READ_ONLY, 2:TRADE_ONLY, 3:CONVERT_ONLY, 4:CRYPTO_WALLET_ONLY, 5:FIAT_ONLY, 6:ACCOUNT_ONLY
  "updateTime": 1689744700710
}
```

###  Delete IP List For a Sub-account API Key (For Master Account)

```shell
POST /openapi/v1/sub-account/apikey/delete-ip-restriction
```

**Weight:** 1

**Parameters:**

Name       | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
apikey      | STRING | YES       |
email      | STRING | YES       | 	Sub account email
ipAddress      | STRING | YES       | 	Can be added in batches, separated by commas
recvWindow | LONG   | NO        | This value cannot be greater than `60000`
timestamp     | LONG   | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "apikey": "k5V49ldtn4tszj6W3hystegdfvmGbqDzjmkCtpTvC0G74WhK7yd4rfCTo4lShf",
  "ipList": [
    "8.8.8.8"
  ],
  "ipRestrict": true,
  "role": "2,3,4,5,6",//0:READ_ONLY, 2:TRADE_ONLY, 3:CONVERT_ONLY, 4:CRYPTO_WALLET_ONLY, 5:FIAT_ONLY, 6:ACCOUNT_ONLY
  "updateTime": 1689744700710
}
```


###  Get Sub-account Deposit Address(For Master Account)

```shell
GET /openapi/v1/sub-account/wallet/deposit/address
```

Fetch sub account deposit address with network.


**Weight:** 10

**Parameters:**

Name       | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
email      | STRING | YES       | Sub account email
coin      | STRING | YES       | 	 The value is from All Coins' Information api
network      | STRING | YES       | 	The value is from All Coins' Information api
recvWindow | LONG   | NO        | This value cannot be greater than `60000`
timestamp     | LONG   | YES       | A point in time for which transfers are being queried.


**Response:**
```json
{
  "coin": "ETH",
  "address": "0xfe98628173830bf79c59f04585ce41f7de168784",
  "addressTag": ""
}
```

###  Get Sub-account Deposit History(For Master Account)

```shell
GET /openapi/v1/sub-account/wallet/deposit/history
```

Fetch deposit history.


**Weight(IP):** 2

**Parameters:**

| Name       | Type   | Mandatory | Description                                                  |
|------------| ------ |-----------| ------------------------------------------------------------ |
| email      | STRING | YES       | Sub account email                                                             |
| coin       | STRING | NO        |                                                              |
| txId       | STRING | NO        |                                                              |
| depositId  | STRING | NO        |                                                              |
| status     | INT    | NO        | 0-PROCESSING, 1-SUCCESS, 2-FAILED, 3-NEED_FILL_DATA(travel rule info) |
| startTime  | LONG   | NO        | Default: 90 days from current timestamp                      |
| endTime    | LONG   | NO        | Default: current timestamp                                   |
| offset     | INT    | NO        | Default:0                                                    |
| limit      | LONG   | NO        | Default:1000, Max:1000                                       |
| recvWindow | LONG   | NO        |                                                              |
| timestamp  | LONG   | YES       |                                                              |

* Please note the default `startTime` and `endTime` to ensure the time interval is within 0-90 days.

* If both `startTime` and `endTime` are sent, time between `startTime` and `endTime` must be less than 90 days.


**Response:**

```javascript
[
    {
        "id": "d_769800519366885376",
        "amount": "0.001",
        "coin": "BNB",
        "network": "BNB",
        "status": 0,
        "address": "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23",
        "addressTag": "101764890",
        "txId": "98A3EA560C6B3336D348B6C83F0F95ECE4F1F5919E94BD006E5BF3BF264FACFC",
        "insertTime": 1661493146000,
        "confirmNo": 10,
    },
    {
        "id": "d_769754833590042625",
        "amount":"0.5",
        "coin":"IOTA",
        "network":"IOTA",
        "status":1,
        "address":"SIZ9VLMHWATXKV99LH99CIGFJFUMLEHGWVZVNNZXRJJVWBPHYWPPBOSDORZ9EQSHCZAMPVAPGFYQAUUV9DROOXJLNW",
        "addressTag":"",
        "txId":"ESBFVQUTPIWQNJSPXFNHNYHSQNTGKRVKPRABQWTAXCDWOAKDKYWPTVG9BGXNVNKTLEJGESAVXIKIZ9999",
        "insertTime":1599620082000,
        "confirmNo": 20,
    }
]
```

#### Collect sub-account assets (For Master Account)
```shell
POST /openapi/v1/fund-collect/collect-from-sub-account
```

If there are tasks with a status of INIT, resubmission is not allowed. This interface will return `{'code': -10324, 'msg': 'Request repeated.'}`.

**Weight:** 1

**Parameters:**

Name              | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
clientRequestId            | STRING | YES       | Request ID, must be unique, Maximum length: 200
remark | LONG   | NO        |  


**Response:**

```javascript
{
  "clientRequestId": "777d3f71-4715-4150-9fd1-d13246d7e02b",
  "status": "INIT",
  "comment": ""
}
```
**Response Description**

Name              | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
clientRequestId            | STRING | YES       | Request ID
status            | STRING | YES        | Collection Task Status: `INIT`, `SUCCESS`, `PARTIAL_SUCCESS`, `PROCESSING`,`FAILED`
remark | LONG   | NO        |




#### Retrieve asset collection records (USER_DATA)

```shell
GET /openapi/v1/fund-collect/get-fund-record
```
Retrieve asset collection records.

**Weight:** 1

**Parameters:**

Name              | Type   | Mandatory | Description
-----------------|--------|-----------|--------------------------------------------------------------------------------------
clientRequestId            | STRING | NO        | Request ID, must be unique
page | INT   | NO        |  Page number 
size | INT   | NO        |  Page size (default:100,max:100)

**Response:**

```javascript
[
  {
    "clientRequestId": "09533266-1fea-11f0-8ff9-2a3efdea066c",
    "comment": "",
    "status": "SUCCESS"
  },
  {
    "clientRequestId": "09533266-1fea-11f0-8ff9-2a3efdea066b",
    "comment": "",
    "status": "SUCCESS"
  }
]
```
 Collection Task Status: `INIT`, `SUCCESS`, `PARTIAL_SUCCESS`, `PROCESSING`,`FAILED`


