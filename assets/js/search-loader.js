let useFallback = false;

function initDefaultSearch() {
  console.log('Falling back to default Chirpy search');
  
  if (typeof SimpleJekyllSearch === 'undefined') {
    console.error('SimpleJekyllSearch not loaded');
    return;
  }
  
  const algoliaLogo = document.getElementById('algolia-poweredby');
  if (algoliaLogo) algoliaLogo.style.display = 'none';
  
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  
  if (input) {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    newInput.addEventListener('input', function(e) {
      const query = e.target.value;
      if (query.length === 0) {
        resultsContainer.innerHTML = '';
        hideSearchUIFallback();
      } else if (query.length >= 3) {
        showSearchUIFallback();
      }
    });
  }
  
  SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('search-results'),
    json: window.searchConfig.jsonUrl,
    searchResultTemplate: window.searchConfig.resultTemplate,
    noResultsText: window.searchConfig.noResultsText,
    templateMiddleware: function(prop, value, template) {
      if (prop === 'categories') {
        return value === '' ? value : `<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>${value}</div>`;
      }
      if (prop === 'tags') {
        return value === '' ? value : `<div><i class="fa fa-tag fa-fw"></i>${value}</div>`;
      }
    }
  });
  
  console.log('SimpleJekyllSearch initialized');
}

function showSearchUIFallback() {
  const wrapper = document.getElementById('search-result-wrapper');
  const mainRows = document.querySelectorAll('#main-wrapper>.container>.row');
  if (wrapper) wrapper.classList.remove('d-none');
  mainRows.forEach(row => row.classList.add('d-none'));
}

function hideSearchUIFallback() {
  const wrapper = document.getElementById('search-result-wrapper');
  const mainRows = document.querySelectorAll('#main-wrapper>.container>.row');
  const hints = document.getElementById('search-hints');
  if (wrapper) wrapper.classList.add('d-none');
  mainRows.forEach(row => row.classList.remove('d-none'));
  if (hints && hints.classList.contains('d-none')) {
    hints.classList.remove('d-none');
  }
}

function initializeAlgoliaSearch() {
  const { appId, apiKey, indexName, baseUrl, noResultsText } = window.searchConfig;
  
  if (typeof algoliasearch === 'undefined' || typeof instantsearch === 'undefined') {
    setTimeout(initializeAlgoliaSearch, 100);
    return;
  }
  
  function showSearchUI() {
    const wrapper = document.getElementById('search-result-wrapper');
    const mainRows = document.querySelectorAll('#main-wrapper>.container>.row');
    if (wrapper) wrapper.classList.remove('d-none');
    mainRows.forEach(row => row.classList.add('d-none'));
  }

  function hideSearchUI() {
    const wrapper = document.getElementById('search-result-wrapper');
    const mainRows = document.querySelectorAll('#main-wrapper>.container>.row');
    const hints = document.getElementById('search-hints');
    if (wrapper) wrapper.classList.add('d-none');
    mainRows.forEach(row => row.classList.remove('d-none'));
    if (hints && hints.classList.contains('d-none')) {
      hints.classList.remove('d-none');
    }
  }
  
  if (!appId || !apiKey || !indexName) {
    console.error('Algolia credentials missing');
    return;
  }
  
  const baseSearchClient = algoliasearch(appId, apiKey);
  const searchClient = {
    ...baseSearchClient,
    search(requests) {
      if (useFallback) {
        return Promise.resolve({
          results: requests.map(() => ({
            hits: [],
            nbHits: 0,
            nbPages: 0,
            page: 0,
            processingTimeMS: 0,
            hitsPerPage: 0,
            exhaustiveNbHits: false,
            query: '',
            params: ''
          }))
        });
      }
      
      if (requests.every(({ params }) => !params.query || !params.query.trim())) {
        return Promise.resolve({
          results: requests.map(() => ({
            hits: [],
            nbHits: 0,
            nbPages: 0,
            page: 0,
            processingTimeMS: 0,
            hitsPerPage: 0,
            exhaustiveNbHits: false,
            query: '',
            params: ''
          }))
        });
      }
      return baseSearchClient.search(requests).catch(err => {
        console.error('Algolia search failed:', err);
        useFallback = true;
        initDefaultSearch();
        return Promise.resolve({
          results: requests.map(() => ({
            hits: [],
            nbHits: 0,
            nbPages: 0,
            page: 0,
            processingTimeMS: 0,
            hitsPerPage: 0,
            exhaustiveNbHits: false,
            query: '',
            params: ''
          }))
        });
      });
    }
  };
  
  const search = instantsearch({
    indexName: indexName,
    searchClient: searchClient,
  });

  const renderSearchBox = (renderOptions, isFirstRender) => {
    const { refine } = renderOptions;
    if (isFirstRender) {
      const input = document.getElementById('search-input');
      if (input) {
        let debounceTimer;
        
        input.addEventListener('input', (e) => {
          e.stopImmediatePropagation();
          const query = e.target.value;
          
          clearTimeout(debounceTimer);
          
          if (query.length === 0) {
            refine('');
            const container = document.getElementById('search-results');
            if (container) container.innerHTML = '';
            hideSearchUI();
            return;
          }
          
          if (query.length >= 3) {
            debounceTimer = setTimeout(() => {
              refine(query);
            }, 300);
          }
        }, true);
      }
    }
  };
  const customSearchBox = instantsearch.connectors.connectSearchBox(renderSearchBox);

  const renderHits = (renderOptions) => {
    const { hits } = renderOptions;
    const container = document.getElementById('search-results');
    if (!container) return;

    const input = document.getElementById('search-input');
    const query = input ? input.value.trim() : '';
    
    if (query.length === 0) {
      container.innerHTML = '';
      hideSearchUI();
      return;
    }

    showSearchUI();

    container.innerHTML = hits.length
      ? hits.map(hit => `
          <article class="px-1 px-sm-2 px-lg-4 px-xl-0">
            <header>
              <h2><a href="${baseUrl}${hit.url}">${instantsearch.highlight({ hit, attribute: 'title' })}</a></h2>
              <div class="post-meta d-flex flex-column flex-sm-row text-muted mt-1 mb-1">
                ${hit.categories && hit.categories.length ? `<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>${Array.isArray(hit.categories) ? hit.categories.join(', ') : hit.categories}</div>` : ''}
                ${hit.tags && hit.tags.length ? `<div><i class="fa fa-tag fa-fw"></i>${Array.isArray(hit.tags) ? hit.tags.join(', ') : hit.tags}</div>` : ''}
              </div>
            </header>
            <p>${instantsearch.snippet({ hit, attribute: 'content' }) || instantsearch.snippet({ hit, attribute: 'excerpt' }) || hit.content || hit.excerpt || ''}</p>
          </article>
        `).join('')
      : noResultsText;
  };
  const customHits = instantsearch.connectors.connectHits(renderHits);

  search.addWidgets([
    customSearchBox({}),
    customHits({}),
    instantsearch.widgets.poweredBy({
      container: '#algolia-poweredby',
      theme: document.documentElement.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'
    })
  ]);

  search.start();

  const observer = new MutationObserver(() => {
    const poweredBy = document.querySelector('#algolia-poweredby .ais-PoweredBy');
    if (poweredBy) {
      const isDark = document.documentElement.getAttribute('data-mode') === 'dark';
      document.getElementById('algolia-poweredby').classList.toggle('dark-theme', isDark);
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAlgoliaSearch);
} else {
  initializeAlgoliaSearch();
}
