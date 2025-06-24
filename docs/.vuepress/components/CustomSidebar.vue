<template>
  <aside class="custom-sidebar" :class="{ 'dark-theme': isDark }">
    
    
    <nav class="sidebar-nav">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search page content..."
            class="search-input"
            @input="handleSearch"
            @keydown.enter="performSearch"
            @focus="handleSearchFocus"
          >
          <button class="search-button" @click="performSearch">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
        <div v-if="(searchResults.length > 0 || (searchQuery && searchResults.length === 0)) && showSearchResults" class="search-results">
          <div 
            v-if="searchResults.length > 0"
            v-for="result in searchResults" 
            :key="result.id"
            class="search-result-item"
            @click="scrollToResult(result)"
          >
            <div class="result-left">
              <div class="result-icon">{{ getPageIcon(result.path.split('#')[0]) }}</div>
              <div class="result-info">
                <div class="result-page">{{ result.pageName }}</div>
                <div class="result-title">{{ result.title }}</div>
                <div class="result-path">{{ result.path }}</div>
              </div>
            </div>
            <div class="result-preview" v-html="result.preview"></div>
          </div>
          <div v-if="searchQuery && searchResults.length === 0" class="no-results">
            No relevant content found
          </div>
        </div>
      </div>
      
      <!-- 当前页面目录 -->
      <div v-if="pageHeaders.length > 0" class="nav-section">
        <!-- <h4 class="section-title">页面目录</h4> -->
        <ul class="nav-list">
          <HeaderItem 
            v-for="header in pageHeaders" 
            :key="header.slug" 
            :header="header"
            :active-slug="activeHeaderSlug"
            :expanded-headers="expandedHeaders"
            @scroll-to="scrollToHeader"
            @toggle="toggleHeader"
          />
        </ul>
      </div>
      
    
    </nav>
    
   
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteData, usePageData } from '@vuepress/client'
import HeaderItem from './HeaderItem.vue'

// 接收props
const props = defineProps({
  isDark: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()
const siteData = useSiteData()
const pageData = usePageData()

const activeHeaderSlug = ref('')
const searchQuery = ref('')
const searchResults = ref([])
const showSearchResults = ref(false) // 控制搜索结果框的显示
const isSearching = ref(false) // 搜索状态
const expandedHeaders = ref(new Set()) // 管理展开的标题
const isScrollingToHeader = ref(false) // 控制是否正在滚动到指定标题

// 页面标题映射
const pageTitleMap = {
  '/': '首页',
  '/web-socket-streams': 'WebSocket 流',
  '/user-data-stream': '用户数据流',
  '/errors': '错误代码'
}

// 页面图标映射
const pageIconMap = {
  '/': '🏠',
  '/rest-api': '📡',
  '/web-socket-streams': '🔗',
  '/user-data-stream': '👤',
  '/errors': '⚠️'
}

// 标题级别图标映射
const headerIconMap = {
  1: 'icon-h1',
  2: 'icon-h2', 
  3: 'icon-h3',
  4: 'icon-h4',
  5: 'icon-h5',
  6: 'icon-h6'
}

// 当前页面标题
const currentPageTitle = computed(() => {
  return pageData.value?.title || pageTitleMap[route.path] || '文档'
})

// 当前页面的标题结构
const pageHeaders = computed(() => {
  const headers = pageData.value?.headers || []
  return headers
})

// 侧边栏页面导航
const sidebarPages = computed(() => {
  const sidebar = siteData.value?.themeConfig?.sidebar || []
  
  if (!sidebar.length) {
    return [
      { link: '/', text: '首页' },
      { link: '/web-socket-streams', text: 'WebSocket 流' },
      { link: '/user-data-stream', text: '用户数据流' },
      { link: '/errors', text: '错误代码' }
    ]
  }
  // 扁平化所有页面
  const pages = []
  sidebar.forEach(section => {
    if (section.children) {
      section.children.forEach(child => {
        const link = typeof child === 'string' ? child : child.link || child
        const text = typeof child === 'object' && child.text 
          ? child.text 
          : pageTitleMap[link] || getPageTitle(link)
        
        pages.push({ link, text })
      })
    }
  })
  
  return pages
})

// 获取页面标题
const getPageTitle = (path) => {
  // 首先检查预定义的标题映射
  if (pageTitleMap[path]) {
    return pageTitleMap[path]
  }
  
  try {
    const pages = router.getRoutes()
    const page = pages.find(p => p.path === path)
    
    // 尝试多种方式获取页面标题
    if (page) {
      if (page.meta?.title) {
        return page.meta.title
      }
      if (page.name) {
        return page.name
      }
    }
  } catch (error) {
    console.warn('Error getting page title:', error)
  }
  
  // 从路径生成标题
  if (path === '/') return '首页'
  const pathParts = path.split('/').filter(Boolean)
  const lastPart = pathParts[pathParts.length - 1] || 'page'
  return lastPart.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// 获取页面图标
const getPageIcon = (link) => {
  return pageIconMap[link] || '📄'
}

// 获取标题图标
const getHeaderIcon = (level) => {
  return headerIconMap[level] || 'icon-header'
}

// 判断页面是否激活
const isActivePage = (link) => {
  return route.path === link
}

// 判断标题是否激活
const isActiveHeader = (slug) => {
  return activeHeaderSlug.value === slug
}

// 滚动到指定标题
const scrollToHeader = (slug) => {
  const element = document.getElementById(slug)
  if (element) {
    // 设置标志，临时禁用 Intersection Observer 的自动更新
    isScrollingToHeader.value = true
    
    // 立即设置活跃标题
    activeHeaderSlug.value = slug
    
    // 获取导航栏高度
    const navbar = document.querySelector('.navbar')
    const navbarHeight = navbar ? navbar.offsetHeight : 60
    
    // 计算滚动位置，确保标题显示在导航栏下方，留出足够间距
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset
    const scrollToPosition = elementTop - navbarHeight - 20 // 标题距离导航栏20px
    
    window.scrollTo({
      top: scrollToPosition,
      behavior: 'smooth'
    })
    
    // 滚动完成后重新启用 Intersection Observer
    // 使用较长的延迟确保滚动动画完成
    setTimeout(() => {
      isScrollingToHeader.value = false
    }, 1000)
  }
}

// 切换标题展开状态
const toggleHeader = (slug) => {
  const expanded = expandedHeaders.value
  const header = findHeaderBySlug(pageHeaders.value, slug)
  
  if (!header) return
  
  if (expanded.has(slug)) {
    // 如果当前是展开状态，则收起
    expanded.delete(slug)
    closeAllChildren(header)
  } else {
    // 如果当前是收起状态，则展开
    expanded.add(slug)
    
    // 手风琴效果：如果是顶级菜单，收起其他同级的顶级菜单
    const minLevel = Math.min(...pageHeaders.value.map(h => h.level))
    if (header.level === minLevel) {
      // 当前是顶级菜单，收起其他同级的顶级菜单
      const topLevelHeaders = pageHeaders.value.filter(h => h.level === minLevel)
      topLevelHeaders.forEach(h => {
        if (h.slug !== slug && expanded.has(h.slug)) {
          expanded.delete(h.slug)
          closeAllChildren(h)
        }
      })
    }
  }
}

// 递归关闭所有子菜单
const closeAllChildren = (header) => {
  const expanded = expandedHeaders.value
  if (header.children) {
    header.children.forEach(child => {
      expanded.delete(child.slug)
      closeAllChildren(child)
    })
  }
}

// 根据slug查找标题
const findHeaderBySlug = (headers, slug) => {
  for (const header of headers) {
    if (header.slug === slug) {
      return header
    }
    if (header.children) {
      const found = findHeaderBySlug(header.children, slug)
      if (found) return found
    }
  }
  return null
}

// 检查标题是否展开
const isHeaderExpanded = (slug) => {
  return expandedHeaders.value.has(slug)
}

// 搜索当前页面内容
const searchCurrentPage = async (query, results, seenResults) => {
  const pageInfo = {
    path: route.path,
    name: currentPageTitle.value,
    icon: getPageIcon(route.path)
  }
  
  // 1. 搜索页面标题
  const allHeaders = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  
  allHeaders.forEach((header, headerIndex) => {
    const headerText = header.textContent.toLowerCase()
    
    // 简单的完整字符串匹配（不区分大小写）
    const headerMatches = headerText.includes(query.toLowerCase())
    
    if (headerMatches) {
      const title = header.textContent.trim()
      const headerSlug = header.id || generateId()
      const resultKey = `${pageInfo.path}#${headerSlug}`
      
      if (!seenResults.has(resultKey)) {
        seenResults.add(resultKey)
        
        // 计算匹配分数
        let score = 90
        if (headerText === query.toLowerCase()) {
          score = 100 // 完全匹配
        } else if (headerText.startsWith(query.toLowerCase())) {
          score = 95 // 开头匹配
        }
        
        results.push({
          id: `header-${headerSlug}-${headerIndex}`, // 添加header前缀和索引确保唯一性
          title: title,
          pageName: pageInfo.name,
          path: `${pageInfo.path}#${headerSlug}`,
          preview: getTextPreview(header.textContent, query),
          element: header,
          score: score
        })
      }
    }
  })
  
  // 2. 搜索段落内容
  const paragraphs = document.querySelectorAll('p, li, td, div, span, code, pre')
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const text = paragraph.textContent
    
    // 简单的完整字符串匹配（不区分大小写）
    const contentMatches = text && text.toLowerCase().includes(query.toLowerCase())
    
    if (contentMatches) {
      // 跳过不相关的元素
      if (paragraph.closest('.search-section') || 
          paragraph.closest('.navbar') || 
          paragraph.closest('.sidebar') ||
          paragraph.closest('.custom-sidebar') ||
          paragraph.closest('script') ||
          paragraph.closest('style') ||
          text.trim().length < 10) return // 最小文本长度要求
      
      // 找到最近的标题
      let nearestHeader = null
      let currentElement = paragraph
      
      // 向上查找最近的标题
      while (currentElement && currentElement.parentElement) {
        // 查找前面的兄弟元素中的标题
        let sibling = currentElement.previousElementSibling
        while (sibling) {
          if (sibling.matches && sibling.matches('h1, h2, h3, h4, h5, h6')) {
            nearestHeader = sibling
            break
          }
          sibling = sibling.previousElementSibling
        }
        
        if (nearestHeader) break
        currentElement = currentElement.parentElement
      }
      
      // 如果没找到，使用页面第一个标题
      if (!nearestHeader) {
        nearestHeader = document.querySelector('h1, h2')
      }
      
      const title = nearestHeader ? nearestHeader.textContent.trim() : '页面内容'
      const headerSlug = nearestHeader ? (nearestHeader.id || generateId()) : 'content'
      const preview = getTextPreview(text, query)
      const resultKey = `${pageInfo.path}#${headerSlug}-${preview.substring(0, 30)}`
      
      if (!seenResults.has(resultKey) && preview.length > 10) {
        seenResults.add(resultKey)
        
        // 计算匹配分数
        let score = 70
        const lowerText = text.toLowerCase()
        const lowerQuery = query.toLowerCase()
        
        if (lowerText.startsWith(lowerQuery)) {
          score = 80 // 开头匹配
        }
        
        results.push({
          id: `content-${headerSlug}-${paragraphIndex}`, // 添加content前缀和索引确保唯一性
          title: title,
          pageName: pageInfo.name,
          path: `${pageInfo.path}#${headerSlug}`,
          preview: preview,
          element: nearestHeader || paragraph,
          score: score
        })
      }
    }
  })
}

// 搜索其他页面
const performSearch = async () => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    searchResults.value = []
    showSearchResults.value = false
    isSearching.value = false
    return
  }
  
  const results = []
  const seenResults = new Set()
  
  // 使用预定义的页面列表而不是动态路由
  const predefinedPages = [
    { path: '/', title: '首页' },
    { path: '/rest-api', title: 'Rest API' },
    { path: '/web-socket-streams', title: 'Web Socket Streams' },
    { path: '/user-data-stream', title: 'User Data Stream' },
    { path: '/errors', title: 'Errors' }
  ]
  
  // 过滤掉当前页面
  const otherPages = predefinedPages.filter(page => page.path !== route.path)
  
  console.log('Predefined pages:', predefinedPages)
  console.log('Other pages to search:', otherPages)
  console.log('Current route:', route.path)
  
  // 添加当前页面搜索
  await searchCurrentPage(query, results, seenResults)
  console.log('After current page search:', results.length)
  
  // 搜索其他页面（使用预定义列表）
  await searchOtherPagesFromList(query, results, seenResults, otherPages)
  console.log('After other pages search:', results.length)
  
  // 按相关性排序
  results.sort((a, b) => (b.score || 0) - (a.score || 0))
  
  // 不过滤评分，显示所有匹配结果
  const filteredResults = results
  
  if (filteredResults.length > 0) {
    searchResults.value = filteredResults.slice(0, 50) // 增加到50个结果
  } else {
    searchResults.value = [] // 没有结果时清空之前的记录
  }
  
  showSearchResults.value = true // 始终显示搜索结果框（包括无结果时）
  isSearching.value = false // 搜索完成
}

// 新的搜索其他页面函数，使用预定义列表
const searchOtherPagesFromList = async (query, results, seenResults, pageList) => {
  console.log('searchOtherPagesFromList called with:', { query, pageListLength: pageList.length })
  
  pageList.forEach(pageItem => {
    const path = pageItem.path
    const pageName = pageItem.title
    
    console.log(`Checking page: ${path}, pageName: ${pageName}`)
    
    // 搜索页面标题 - 简单的完整字符串匹配（不区分大小写）
    const titleMatches = pageName.toLowerCase().includes(query.toLowerCase())
    
    console.log(`Title match for "${pageName}": ${titleMatches}`)
    
    if (titleMatches) {
      const resultKey = `${path}-title`
      if (!seenResults.has(resultKey)) {
        seenResults.add(resultKey)
        
        // 计算匹配分数
        let score = 85
        if (pageName.toLowerCase() === query.toLowerCase()) {
          score = 95 // 完全匹配
        } else if (pageName.toLowerCase().startsWith(query.toLowerCase())) {
          score = 90 // 开头匹配
        }
        
        console.log(`Adding title result for ${path}: ${pageName}`)
        
        results.push({
          id: `page-${path.replace(/\//g, '-')}`,
          title: pageName,
          pageName: pageName,
          path: path,
          preview: `Page: ${pageName}`,
          element: null,
          score: score
        })
      }
    }
    
    // 搜索页面路径 - 简单的完整字符串匹配（不区分大小写）
    const pathMatches = path.toLowerCase().includes(query.toLowerCase())
    
    console.log(`Path match for "${path}": ${pathMatches}`)
    
    if (pathMatches) {
      const resultKey = `${path}-path`
      if (!seenResults.has(resultKey)) {
        seenResults.add(resultKey)
        
        console.log(`Adding path result for ${path}`)
        
        results.push({
          id: `path-${path.replace(/\//g, '-')}`,
          title: pageName,
          pageName: pageName,
          path: path,
          preview: `Path: ${path}`,
          element: null,
          score: 75
        })
      }
    }
  })
  
  console.log('searchOtherPagesFromList results:', results.length)
}

// 搜索页面内容
let searchTimeout = null
const handleSearch = () => {
  // 清除之前的搜索定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }
  
  // 立即清除旧结果，避免显示不匹配的内容
  // searchResults.value = []
  showSearchResults.value = true
  isSearching.value = true
  
  // 防抖：300ms后执行搜索
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

// 获取文本预览
const getTextPreview = (text, query) => {
  // 清理文本，移除多余的空白字符
  const cleanText = text.replace(/\s+/g, ' ').trim()
  
  // 找到查询字符串的位置
  const queryIndex = cleanText.toLowerCase().indexOf(query.toLowerCase())
  
  if (queryIndex === -1) return cleanText.substring(0, 100) + '...'
  
  const start = Math.max(0, queryIndex - 40)
  const end = Math.min(cleanText.length, queryIndex + query.length + 40)
  let preview = cleanText.substring(start, end)
  
  if (start > 0) preview = '...' + preview
  if (end < cleanText.length) preview = preview + '...'
  
  // 高亮查询字符串（完整匹配）
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  preview = preview.replace(regex, '<mark>$1</mark>')
  
  return preview
}

// 生成唯一ID
const generateId = () => {
  return 'search-result-' + Math.random().toString(36).substr(2, 9)
}

// 滚动到搜索结果
const scrollToResult = (result) => {
  const targetPath = result.path.split('#')[0]
  const hash = result.path.includes('#') ? result.path.split('#')[1] : ''
  
  // 隐藏搜索结果框
  showSearchResults.value = false
  
  if (targetPath === route.path) {
    // 当前页面，直接滚动
    if (result.element) {
      // 临时禁用 Intersection Observer 的自动更新
      isScrollingToHeader.value = true
      
      // 使用与左侧菜单一致的滚动逻辑
      const navbar = document.querySelector('.navbar')
      const navbarHeight = navbar ? navbar.offsetHeight : 60
      const elementTop = result.element.getBoundingClientRect().top + window.pageYOffset
      const scrollToPosition = elementTop - navbarHeight - 20 // 标题距离导航栏20px
      
      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
      })
      
      // 高亮元素
      result.element.style.backgroundColor = '#fff3cd'
      setTimeout(() => {
        result.element.style.backgroundColor = ''
      }, 2000)
      
      // 重新启用 Intersection Observer
      setTimeout(() => {
        isScrollingToHeader.value = false
      }, 1000)
    }
  } else {
    // 跨页面导航
    if (hash) {
      router.push(result.path)
    } else {
      router.push(targetPath)
    }
  }
}

// 监听滚动，更新活跃的标题
let observer = null

const initIntersectionObserver = () => {
  // 清理之前的observer
  if (observer) {
    observer.disconnect()
  }
  
  const headers = flattenHeaders(pageHeaders.value)
  if (!headers.length) return
  
  // 获取导航栏高度作为根边距
  const navbar = document.querySelector('.navbar')
  const navbarHeight = navbar ? navbar.offsetHeight : 60
  
  const options = {
    root: null,
    rootMargin: `-${navbarHeight + 20}px 0px -80% 0px`,
    threshold: 0
  }
  
  observer = new IntersectionObserver((entries) => {
    // 如果正在手动滚动到指定标题，忽略 Observer 的更新
    if (isScrollingToHeader.value) {
      return
    }
    
    // 找到第一个可见的标题
    const visibleEntries = entries.filter(entry => entry.isIntersecting)
    
    if (visibleEntries.length > 0) {
      // 按照在页面中的顺序排序
      visibleEntries.sort((a, b) => {
        const aRect = a.target.getBoundingClientRect()
        const bRect = b.target.getBoundingClientRect()
        return aRect.top - bRect.top
      })
      
      const firstVisible = visibleEntries[0]
      const slug = firstVisible.target.id
      
      if (slug && activeHeaderSlug.value !== slug) {
        activeHeaderSlug.value = slug
      }
    }
  }, options)
  
  // 观察所有扁平化的标题元素（用于滚动高亮）
  headers.forEach(header => {
    const element = document.getElementById(header.slug)
    if (element) {
      observer.observe(element)
    }
  })
}

onMounted(() => {
  // 延迟初始化，确保DOM已渲染
  setTimeout(() => {
    initIntersectionObserver()
  }, 500)
  
  // 添加全局点击事件监听器
  document.addEventListener('click', handleClickOutside)
})

// 处理点击外部区域
const handleClickOutside = (event) => {
  const searchSection = document.querySelector('.search-section')
  if (searchSection && !searchSection.contains(event.target)) {
    showSearchResults.value = false
  }
}

// 处理搜索框获得焦点时显示结果
const handleSearchFocus = () => {
  if (searchResults.value.length > 0) {
    showSearchResults.value = true
  }
}

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  
  // 移除全局点击事件监听器
  document.removeEventListener('click', handleClickOutside)
})

// 监听页面数据变化，重新初始化observer
watch(pageData, () => {
  setTimeout(() => {
    initIntersectionObserver()
  }, 300)
}, { deep: true })

// 监听活跃标题变化，自动展开相关路径
watch(activeHeaderSlug, (newSlug) => {
  if (newSlug) {
    // 找到当前活跃标题的所有父级标题并展开
    const expandPath = (headers, targetSlug, path = []) => {
      for (const header of headers) {
        const currentPath = [...path, header.slug]
        if (header.slug === targetSlug) {
          // 展开路径上的所有父级
          path.forEach(slug => expandedHeaders.value.add(slug))
          
          // 找到顶级父菜单（path中的第一个，也就是最顶层的）
          if (path.length > 0) {
            const topLevelSlug = path[0]
            // 收起其他顶级菜单
            const minLevel = Math.min(...pageHeaders.value.map(h => h.level))
            const topLevelHeaders = pageHeaders.value.filter(h => h.level === minLevel)
            topLevelHeaders.forEach(h => {
              if (h.slug !== topLevelSlug) {
                expandedHeaders.value.delete(h.slug)
                closeAllChildren(h)
              }
            })
          }
          return true
        }
        if (header.children) {
          if (expandPath(header.children, targetSlug, currentPath)) {
            return true
          }
        }
      }
      return false
    }
    
    expandPath(pageHeaders.value, newSlug)
  }
}, { immediate: true })

// 扁平化标题（用于Intersection Observer）
const flattenHeaders = (headers) => {
  const flattened = []
  const stack = [...headers]
  
  while (stack.length > 0) {
    const header = stack.pop()
    flattened.push(header)
    
    if (header.children) {
      stack.push(...header.children)
    }
  }
  
  return flattened.reverse()
}
</script>

<style lang="scss" scoped>
.custom-sidebar {
  width: 300px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 60px;
  padding-bottom: 60px;
  z-index: 100;
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 32px 24px 24px;
  text-align: left;
  border-bottom: 1px solid #f5f5f5;
  background: white;
  
  .sidebar-logo {
    width: 32px;
    height: 32px;
    margin-bottom: 12px;
  }
  
  .sidebar-title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1a1a1a;
    letter-spacing: -0.01em;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 24px 0;
  overflow-y: auto;
  
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.search-section {
  padding: 0 24px 24px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 24px;
  
  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    background: #fafafa;
    border: 1px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
    
    &:focus-within {
      // background: white;
      // border-color: #e0e0e0;
    }
    
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      padding: 12px 16px;
      font-size: 14px;
      background: transparent;
      color: #1a1a1a;
      font-weight: 400;
      
      &::placeholder {
        color: #999999;
        font-weight: 400;
      }
      
      &::selection {
        background: #f0f0f0;
        color: #1a1a1a;
      }
      
      &::-moz-selection {
        background: #f0f0f0;
        color: #1a1a1a;
      }
    }
    
    .search-button {
      background: none;
      border: none;
      padding: 12px 16px;
      cursor: pointer;
      color: #999999;
      transition: color 0.2s ease;
      
      &:hover {
        color: #666666;
      }
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
  
  .search-results {
    position: fixed;
    top: 140px;
    left: 20px;
    z-index: 1001;
    max-height: 600px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    width: 480px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    
    /* 隐藏滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
    
    .search-result-item {
      display: flex;
      padding: 20px 24px;
      border-bottom: 1px solid #f8f8f8;
      cursor: pointer;
      transition: background-color 0.15s ease;
      gap: 16px;
      align-items: flex-start;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background-color: #fafafa;
      }
      
      .result-left {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;
        min-width: 200px;
      }
      
      .result-icon {
        font-size: 16px;
        color: #666666;
        margin-top: 2px;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .result-info {
        flex: 1;
        min-width: 0;
      }
      
      .result-page {
        font-size: 11px;
        color: #999999;
        margin-bottom: 4px;
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      
      .result-title {
        font-weight: 500;
        color: #1a1a1a;
        font-size: 14px;
        margin-bottom: 4px;
        line-height: 1.4;
      }
      
      .result-path {
        font-size: 11px;
        color: #999999;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        background: #f8f8f8;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
      }
      
      .result-preview {
        font-size: 13px;
        color: #666666;
        line-height: 1.5;
        flex: 1;
        min-width: 200px;
        padding-left: 16px;
        border-left: 1px solid #f0f0f0;
        
        :deep(mark) {
          background: #f0f0f0;
          color: #1a1a1a;
          padding: 1px 2px;
          border-radius: 2px;
          font-weight: 500;
        }
      }
    }
  }
  
  .no-results {
    text-align: center;
    padding: 40px 24px;
    color: #999999;
    font-size: 14px;
    font-weight: 400;
  }
}

.nav-section {
  margin-bottom: 32px;
  padding: 0 16px 0 12px;
  .section-title {
    font-size: 12px;
    font-weight: 500;
    color: #999999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 16px 24px;
    padding: 0;
  }
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-sublist {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-left: 24px;
}

.sidebar-footer {
  padding: 24px;
  border-top: 1px solid #f5f5f5;
  background: white;
  
  .version-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999999;
    font-weight: 400;
    
    .version-number {
      background-color: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      color: #666666;
    }
  }
}

// 暗色主题 - 极简风格
.custom-sidebar.dark-theme {
  background: #1a1a1a;
  border-right-color: #2a2a2a;
  
  .sidebar-header {
    background: #1a1a1a;
    border-bottom-color: #2a2a2a;
    
    .sidebar-title {
      color: #ffffff;
    }
  }
  
  .search-section {
    border-bottom-color: #2a2a2a;
    
    .search-box {
      background: #2a2a2a;
      
      &:focus-within {
        // background: #333333;
        // border-color: #404040;
      }
      
      .search-input {
        color: #ffffff;
        
        &::placeholder {
          color: #999999;
        }
        
        &::selection {
          background: #404040;
          color: #ffffff;
        }
        
        &::-moz-selection {
          background: #404040;
          color: #ffffff;
        }
      }
      
      .search-button {
        color: #999999;
        
        &:hover {
          color: #cccccc;
        }
      }
    }
    
    .search-results {
      background: #1a1a1a;
      border-color: #2a2a2a;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      
      .search-result-item {
        border-bottom-color: #2a2a2a;
        
        &:hover {
          background-color: #2a2a2a;
        }
        
        .result-icon {
          color: #999999;
        }
        
        .result-page {
          color: #999999;
        }
        
        .result-title {
          color: #ffffff;
        }
        
        .result-path {
          color: #999999;
          background: #2a2a2a;
        }
        
        .result-preview {
          color: #cccccc;
          border-left-color: #2a2a2a;
          
          :deep(mark) {
            background: #404040;
            color: #ffffff;
          }
        }
      }
    }
    
    .no-results {
      color: #999999;
    }
  }
  
  .section-title {
    color: #999999;
  }
  
  .sidebar-footer {
    background: #1a1a1a;
    border-top-color: #2a2a2a;
    
    .version-info {
      color: #999999;
      
      .version-number {
        background-color: #2a2a2a;
        color: #cccccc;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .custom-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.open {
      transform: translateX(0);
    }
  }
}
</style>

