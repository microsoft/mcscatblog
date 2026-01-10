# Algolia Search Debugging Guide

## Overview
Comprehensive debugging has been added to the Algolia search integration to help diagnose configuration and connectivity issues.

## What Was Added

### 1. Network Request Monitoring
- **Location**: [_includes/search-loader.html](_includes/search-loader.html)
- **Purpose**: Intercepts all fetch and XMLHttpRequest calls to Algolia
- **What it logs**:
  - All network requests to Algolia endpoints
  - Request methods and URLs
  - Response status codes
  - Error messages

### 2. Initialization Debugging
Detailed console logging throughout the Algolia initialization process:

- **Script Loading**: Confirms when the search-loader script executes
- **DOM State**: Reports document ready state
- **Configuration**: Displays:
  - Application ID (visible)
  - API Key (last 4 characters only for security)
  - Index Name
  - Whether each credential is present
- **Library Loading**: Tracks whether algoliasearch and instantsearch libraries load successfully
- **Client Creation**: Confirms search client instantiation
- **Widget Setup**: Logs each step of widget configuration
- **Element Detection**: Verifies DOM elements (#search-input, #search-results) exist
- **Search Events**: Logs every search query as it's typed

## How to Use

### Step 1: Open Browser Developer Tools
1. Navigate to your live site
2. Open Developer Tools (F12 or right-click > Inspect)
3. Go to the **Console** tab

### Step 2: Look for Debug Messages
All debug messages are prefixed with `[Algolia Debug]` or `[Algolia Network Debug]`.

### Step 3: Check the Initialization Sequence
You should see messages in this order:

```
[Algolia Network Debug] Initializing network monitoring...
[Algolia Network Debug] Network monitoring active
[Algolia Debug] Script loaded, waiting for DOM...
[Algolia Debug] DOM already ready, initializing now
  (or: DOM loading, adding event listener)
[Algolia Debug] Initialization started
[Algolia Debug] Document ready state: interactive
[Algolia Debug] Configuration: { appId: 'BI7UJK9MV3', apiKey: '***XXXX', indexName: 'mcscatblog', ... }
[Algolia Debug] Libraries loaded successfully: { algoliasearch: 'function', instantsearch: 'object' }
[Algolia Debug] Creating search client...
[Algolia Debug] Search client created successfully
[Algolia Debug] Creating InstantSearch instance...
[Algolia Debug] InstantSearch instance created
[Algolia Debug] Search box first render
[Algolia Debug] Search input element: <input...>
[Algolia Debug] Event listener attached to search input
[Algolia Debug] Adding widgets...
[Algolia Debug] Widgets added, starting search...
[Algolia Debug] Search started successfully!
[Algolia Debug] Theme observer initialized
```

### Step 4: Test Search Functionality
1. Click the search icon or focus on the search input
2. Type a query
3. Watch for:
   - `[Algolia Debug] Search query: your-query`
   - `[Algolia Network Debug] Fetch request to: https://...algolia.net/...`
   - `[Algolia Debug] Rendering hits: { count: X, hits: [...] }`

## Common Issues and What to Look For

### Issue: No Network Requests to Algolia

**Expected Log Messages:**
- `[Algolia Network Debug] Fetch request to: ...algolia.net...`

**If Missing:**
- Check if search API key is configured in `_config.yml`
- Look for error: `[Algolia Debug] Missing required credentials`

### Issue: Libraries Not Loading

**Expected Log Message:**
- `[Algolia Debug] Libraries loaded successfully: { algoliasearch: 'function', instantsearch: 'object' }`

**If You See:**
- `[Algolia Debug] Libraries not loaded yet, retrying...`

**Check:**
1. Network tab in DevTools for failed CDN requests
2. Look for: `https://cdn.jsdelivr.net/combine/npm/algoliasearch@4.24.0/...`
3. Check for Content Security Policy (CSP) blocking the CDN

### Issue: DOM Elements Not Found

**Look For:**
- `[Algolia Debug] Search input element not found!`
- `[Algolia Debug] Search results container not found!`

**This means:**
- The search UI elements aren't present on the page
- Check if you're on a page that includes the search interface

### Issue: Network Errors

**Look For:**
- `[Algolia Network Debug] Fetch error: ...`
- `[Algolia Network Debug] XHR error for: ...`

**Possible Causes:**
- Invalid API key
- CORS issues
- Network connectivity problems
- Firewall blocking Algolia endpoints

## Configuration Check

Your current configuration (from `_config.yml`):
```yaml
algolia:
  application_id: 'BI7UJK9MV3'
  index_name: 'mcscatblog'
  # search_only_api_key: Should be set in environment variable or config
```

**Note**: If you see `apiKey: '***'` (no characters after ***), the search_only_api_key is missing!

## Network Tab Analysis

In addition to console logs, check the **Network** tab:

1. Filter by "algolia"
2. Look for requests to:
   - `https://{APP_ID}-dsn.algolia.net/1/indexes/{INDEX_NAME}/query`
3. Check response:
   - Status 200 = Success
   - Status 403 = Invalid API key
   - Status 404 = Index not found

## Next Steps After Debugging

Once you identify the issue:
1. **Missing API Key**: Set `search_only_api_key` in `_config.yml`
2. **Invalid Credentials**: Verify in Algolia dashboard
3. **No Index**: Run `bundle exec jekyll algolia` to index your content
4. **Library Loading Issues**: Check CDN availability or consider self-hosting

## Removing Debug Code

Once you've resolved the issue, you can remove the debug logging by:
1. Removing console.log statements from [_includes/search-loader.html](_includes/search-loader.html)
2. Removing the network monitoring script (lines 8-72 in the file)
