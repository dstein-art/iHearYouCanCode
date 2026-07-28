/**
 * SuperDirt / Dirt-Samples browser UI
 */
(function () {
  const searchInput = document.getElementById('superdirt-search');
  const mainEl = document.getElementById('superdirt-main');
  const emptyEl = document.getElementById('superdirt-empty');
  const sidebarEl = document.getElementById('superdirt-sidebar-cats');
  const filterHint = document.getElementById('superdirt-filter-hint');

  let catalog = null;
  let activeAudio = null;
  let activeBtn = null;

  function slug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  /** Encode path segments so spaces, #, parens, etc. are safe in URLs. */
  function encodeSampleUrl(url) {
    var match = url.match(/^(https?:\/\/[^/]+)(\/.*)?$/);
    if (!match) return url;
    var base = match[1];
    var path = match[2] || '';
    var segments = path.split('/');
    var encoded = segments.map(function (seg) {
      if (!seg) return seg;
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch (e) {
        return encodeURIComponent(seg);
      }
    }).join('/');
    return base + encoded;
  }

  function stopAudio() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
    if (activeBtn) {
      activeBtn.classList.remove('is-playing');
      activeBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
      activeBtn = null;
    }
  }

  function playFile(url, btn) {
    if (activeBtn === btn) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(encodeSampleUrl(url));
    activeAudio = audio;
    activeBtn = btn;
    btn.classList.add('is-playing');
    btn.querySelector('.material-symbols-outlined').textContent = 'stop';
    audio.play().catch(function () {
      stopAudio();
    });
    audio.addEventListener('ended', stopAudio);
  }

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      const icon = btn.querySelector('.material-symbols-outlined');
      const prev = icon.textContent;
      icon.textContent = 'check';
      setTimeout(function () { icon.textContent = prev; }, 1400);
    } catch (e) {}
  }

  function renderFileRow(file) {
    const li = document.createElement('li');
    li.dataset.search = (file.name + ' ' + file.url).toLowerCase();

    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;
    name.title = file.name;

    const actions = document.createElement('div');
    actions.className = 'file-actions';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'file-btn';
    playBtn.title = 'Preview';
    playBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      playFile(file.url, playBtn);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'file-btn';
    copyBtn.title = 'Copy URL';
    copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
    copyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      copyText(encodeSampleUrl(file.url), copyBtn);
    });

    actions.appendChild(playBtn);
    actions.appendChild(copyBtn);
    li.appendChild(name);
    li.appendChild(actions);
    return li;
  }

  function renderFolder(folder) {
    const article = document.createElement('article');
    article.className = 'sample-folder';
    article.id = 'folder-' + slug(folder.id);
    article.dataset.folderId = folder.id;
    article.dataset.search = folder.id.toLowerCase();

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'folder-header';
    header.innerHTML =
      '<span class="folder-name">' + folder.id + '</span>' +
      '<span class="folder-count">' + folder.count + ' sample' + (folder.count === 1 ? '' : 's') + '</span>' +
      '<span class="material-symbols-outlined folder-chevron">expand_more</span>';

    const list = document.createElement('ul');
    list.className = 'file-list';
    folder.files.forEach(function (file) {
      list.appendChild(renderFileRow(file));
    });

    header.addEventListener('click', function () {
      article.classList.toggle('is-open');
    });

    article.appendChild(header);
    article.appendChild(list);
    return article;
  }

  function renderCategory(category) {
    const section = document.createElement('section');
    section.className = 'superdirt-category doc-section';
    section.id = 'cat-' + slug(category.name);

    const fileTotal = category.folders.reduce(function (n, f) { return n + f.count; }, 0);

    section.innerHTML =
      '<div class="superdirt-category-header">' +
        '<h2>' + category.name + '</h2>' +
        '<span class="superdirt-category-meta">' +
          category.folders.length + ' folders · ' + fileTotal + ' files' +
        '</span>' +
      '</div>';

    const grid = document.createElement('div');
    grid.className = 'superdirt-folder-grid';
    category.folders.forEach(function (folder) {
      grid.appendChild(renderFolder(folder));
    });
    section.appendChild(grid);
    return section;
  }

  function renderSidebar(categories) {
    sidebarEl.innerHTML = '';
    categories.forEach(function (cat) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#cat-' + slug(cat.name);
      a.textContent = cat.name;
      li.appendChild(a);
      sidebarEl.appendChild(li);
    });
  }

  function applyFilter(query) {
    const q = query.trim().toLowerCase();
    let visibleFolders = 0;

    mainEl.querySelectorAll('.sample-folder').forEach(function (folder) {
      const folderId = folder.dataset.folderId.toLowerCase();
      const files = folder.querySelectorAll('.file-list li');
      let folderMatch = !q || folderId.includes(q);
      let visibleFiles = 0;

      files.forEach(function (file) {
        const match = !q || file.dataset.search.includes(q) || folderMatch;
        file.classList.toggle('is-hidden', !match);
        if (match) visibleFiles++;
      });

      const show = visibleFiles > 0;
      folder.classList.toggle('is-hidden', !show);
      if (show) {
        visibleFolders++;
        if (q) folder.classList.add('is-open');
      }
    });

    mainEl.querySelectorAll('.superdirt-category').forEach(function (cat) {
      const visible = cat.querySelectorAll('.sample-folder:not(.is-hidden)').length;
      cat.style.display = visible ? '' : 'none';
    });

    emptyEl.classList.toggle('is-visible', visibleFolders === 0);
    filterHint.textContent = q
      ? visibleFolders + ' folder' + (visibleFolders === 1 ? '' : 's') + ' matched'
      : catalog.totalFolders + ' sample folders';
  }

  function renderStats(data) {
    document.getElementById('stat-folders').textContent = data.totalFolders;
    document.getElementById('stat-files').textContent = data.totalFiles.toLocaleString();
    document.getElementById('stat-categories').textContent = data.categories.length;
  }

  function catalogUrl() {
    var script = document.currentScript || document.querySelector('script[src*="superdirt.js"]');
    if (script && script.src) {
      return script.src.replace(/superdirt\.js(\?.*)?$/, 'superdirt-samples.json');
    }
    return 'superdirt-samples.json';
  }

  async function init() {
    try {
      catalog = await fetch(catalogUrl()).then(function (r) { return r.json(); });
    } catch (e) {
      mainEl.innerHTML = '<p class="doc-text">Could not load the sample catalog. Please serve this site over HTTP.</p>';
      return;
    }

    renderStats(catalog);
    renderSidebar(catalog.categories);
    catalog.categories.forEach(function (cat) {
      mainEl.appendChild(renderCategory(cat));
    });

    filterHint.textContent = catalog.totalFolders + ' sample folders';

    searchInput.addEventListener('input', function () {
      applyFilter(searchInput.value);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFilter('');
        stopAudio();
      }
    });
  }

  init();
})();
