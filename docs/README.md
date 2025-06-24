---
home: true
title: Coins APIs Documentation
heroText: Coins APIs
tagline: Comprehensive API documentation for Coins.ph trading platform
actions:
  - text: Get Started with REST API
    link: /rest-api
    type: primary
  - text: WebSocket Streams
    link: /web-socket-streams
    type: secondary
features:
  - title: REST API
    details: Complete REST API documentation with endpoints for trading, account management, and more
  - title: WebSocket Streams
    details: Real-time market data and order updates via WebSocket connections
  - title: User Data Stream
    details: Private user data streams for account and order updates
footer: Copyright © 2024 Coins.ph
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 自动跳转到 rest-api 页面
  router.push('/rest-api')
})
</script>

## 正在跳转到 REST API 文档...

如果页面没有自动跳转，请点击 [这里](/rest-api) 手动跳转到 REST API 文档。

### 📚 [REST API Documentation](/rest-api)
Complete guide to all REST API endpoints including authentication, trading, account management, and more.

### 🔌 [WebSocket Streams](/web-socket-streams)
Real-time market data, order book updates, and trade information via WebSocket connections.

### 👤 [User Data Stream](/user-data-stream)
Private data streams for account information, order updates, and position changes.

### ⚠️ [Error Codes](/errors)
Complete list of error codes and troubleshooting information. 