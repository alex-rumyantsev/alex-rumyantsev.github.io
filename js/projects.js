/**
 * Projects list: loads public repositories from the GitHub REST API and
 * renders them as cards before the placeholder card.
 */

const DATA_URL = 'data/projects.json';
const PLACEHOLDER_URL = 'assets/placeholder.svg';

let repositories = [];
let query = '';

/** True when the repository name, description or language contains the typed text. */
function matchesQuery(repository) {
  const text = [repository.name, repository.description, repository.language]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

/** Builds one project card from a repository object. */
function createCard(repository, dateFormat) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.dataset.repository = repository.name;

  const preview = document.createElement('img');
  preview.className = 'project-card__preview';
  preview.src = repository.preview ?? PLACEHOLDER_URL;
  preview.alt = '';
  preview.loading = 'lazy';
  preview.addEventListener(
    'error',
    () => {
      preview.src = PLACEHOLDER_URL;
    },
    { once: true },
  );
  card.append(preview);

  const body = document.createElement('div');
  body.className = 'project-card__body';

  const title = document.createElement('h3');
  if (repository.url) {
    const link = document.createElement('a');
    link.href = repository.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = repository.name;
    title.append(link);
  } else {
    title.textContent = repository.name;
  }
  body.append(title);

  if (repository.description) {
    const description = document.createElement('p');
    description.textContent = repository.description;
    body.append(description);
  }

  if (repository.language) {
    const tags = document.createElement('ul');
    tags.className = 'project-card__tags';
    const tag = document.createElement('li');
    tag.textContent = repository.language;
    tags.append(tag);
    body.append(tags);
  }

  const updated = document.createElement('time');
  updated.className = 'project-card__updated';
  updated.dateTime = repository.pushed_at;
  updated.textContent = dateFormat.format(new Date(repository.pushed_at));
  body.append(updated);

  card.append(body);
  return card;
}

/** Replaces the rendered cards, newest push first. */
function render() {
  const grid = document.querySelector('.projects__grid');
  if (!grid || repositories.length === 0) return;

  const dateFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
    dateStyle: 'medium',
  });
  const cards = [...repositories]
    .filter(matchesQuery)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .map((repository) => createCard(repository, dateFormat));

  grid.querySelectorAll('[data-repository]').forEach((card) => card.remove());
  grid.prepend(...cards);
}

/** Opens and closes the search field and filters the cards while typing. */
function initSearch() {
  const button = document.querySelector('[data-action="search"]');
  const input = document.querySelector('.projects__search');
  if (!button || !input) return;

  button.addEventListener('click', () => {
    input.hidden = !input.hidden;
    if (input.hidden) {
      input.value = '';
      query = '';
      render();
    } else {
      input.focus();
    }
  });

  input.addEventListener('input', () => {
    query = input.value;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      button.click();
      button.focus();
    }
  });
}

async function init() {
  initSearch();
  
  // Re-render so the dates follow the selected language.
  document.addEventListener('site:language-change', render);

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Cannot load projects (HTTP ${response.status})`);
    }
    repositories = await response.json();
  } catch (error) {
    // The placeholder card stays as the fallback.
    console.error(error);
    return;
  }

  render();
}

init();