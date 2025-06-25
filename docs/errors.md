---
title: "Errors"

---
# Error codes for Coins (2025-06-20)

Errors consist of two parts: an error code and a message. Codes are universal,
 but messages can vary. Here is the error JSON payload:

```javascript
{
  "code": -1000,
  "msg": "An unknown error occurred while processing the request."
}
```

## 10xx - General Server or Network issues

### -1000 UNKNOWN_ERROR

* An unknown error occurred while processing the request.

### -1001 DISCONNECTED

* Internal error.

### -1002 UNAUTHORIZED

* You are not authorized to execute this request
* How to resolve: Put X-COINS-APIKEY in http header, refer to api doc "Endpoint Security Type" part.

### -1003 TOO_MANY_REQUESTS

* Too many requests, current limit is %s requests per %s.
* How to resolve: Your request is breaking our rate limit, if you need higher rate limit, please contact us.

### -1010 BAD_REQUEST

* Bad request

### -1015 TOO_MANY_ORDERS

* Too many new orders; current limit is %s orders per %s.

### -1020 UNSUPPORTED_OPERATION

* This operation is not supported.
* How to resolve: Please create and use functional API key instead of using read-only API key.

### -1021 TIMESTAMP_OUT_OF_WINDOW

* Timestamp for this request is outside of the recv window.
* How to resolve: The request is valid if server timestamp <= (recvWindow + timestamp), refer to API doc "Timing Security" part.

### -1022 INVALID_SIGNATURE

* Signature for this request is not valid.
* How to resolve: Your signature is not valid, refer to API doc "SIGNED Endpoint Examples for POST /openapi/v1/order" part.

### -1023 BIND_IP_WHITE_LIST_FIRST

* set ip white_list before use
* How to resolve: You need to set up IP white list for your api key.

### -1024 MISS_HEADER_ERROR

* Header '%s' is required.
* How to resolve: Missing parameter in http header.

### -1025 INVALID_PARAMETER

* Parameter '%s' is not valid.
* How to resolve: The parameter passed is not valid.
  
### -1026 CREATE_LISTEN_KEY_RATE_LIMIT

* Create listenKey rate limited(%s per hour), please try again next hour
* How to resolve: Create listenKey request is breaking our rate limit.

### -1027 INVALID_ORG_ID

* This api only support for coins.ph.
* How to resolve: This api is not supported in coins.xyz.

  
## 11xx - Request issues

### -1103 UNKNOWN_PARAM

* Required param not found, please ensure the parameters being sent correctly, more information please refer to the openapi documentation 'SIGNED Endpoint Examples' section.

### -1105 MISS_PARAMETER

* Parameter '%s' is required.

### -1106 PARAMETER_NOT_REQUIRED

* Parameter '%s' sent when not required

### -1107 CONFLICT_PARAMETER_ERROR

* Parameter '%s' should not be both set.

### -1108 ORDER_CANCEL_REPLACE_PARAMETER_ERROR

* Either the cancelOrigClientOrderId or cancelOrderId must be provided

### -1125 LISTEN_KEY_EXPIRED

* This listenKey does not exist

### -1126 CREATE_LISTEN_KEY_FAILED

* Create listenKey failed, please try again later

### -1131 INSUFFICIENT_BALANCE

* Balance insufficient

### -1132 ORDER_CANCEL_REPLACE_FAILED

* Order cancel-replace failed.

### -1133 ORDER_CANCEL_REPLACE_PARTIALLY_FAILED

* Order cancel-replace partially failed.

### -1150 MERCHANT_AUTHENTICATION_FAIL

* merchant authentication failed.

### -1151 USER_NOT_FOUND

* merchant user not found

### -1152 NO_PERMISSION

* Unauthorized to operate this API.

### -2015 API_KEY_NOT_ENABLE

* API-key is not enabled.
* How to resolve: Cannot find the api key or the api key is not enabled.

### -2017 IP_NOT_IN_WHITELIST

* Request ip is not in the whitelist
* How to resolve: The request IP is not in the IP white list of your api key, please update your api key. You can get your current IP by endpoint openapi/v1/user/ip.

### -2018 API_KEY_NOT_EXIST

* API-key does not exist.
* How to resolve: Cannot find the api key.

### -2019 API_KEY_TYPE_WRONG

* API-key type is wrong.
