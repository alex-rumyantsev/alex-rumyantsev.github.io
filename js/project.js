/**
 * Project page: shows the project selected by ?name=... from data/projects.json.
 */

const DATA_URL = 'data/projects.json';
const PLACEHOLDER_URL = 'assets/placeholder.svg';

let project = null;

/** Finds the project the visitor asked for, or null. */
async function loadProject(name) {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Cannot load projects (HTTP ${response.status})`);
  }
  const projects = await response.json();
  return projects.find((item) => item.name === name) ?? null;
}

/** Returns the HTML that the sync job rendered from the project's README. */
async function loadReadme(name) {
  const response = await fetch(`data/showcase/${encodeURIComponent(name)}/README.html`);
  return response.ok ? response.text() : '';
}

/** Language, stars and last update; redrawn when the language changes. */
function renderMeta() {
  const language = document.documentElement.lang;
  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: 'medium' });
  const items = [];

  if (project.language) items.push(project.language);
  if (project.stars > 0) items.push(`★ ${project.stars.toLocaleString(language)}`);
  items.push(dateFormat.format(new Date(project.pushed_at)));

  document.querySelector('.project-page__meta').replaceChildren(
    ...items.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }),
  );
}

function renderDownloads() {
  const section = document.querySelector('.project-page__downloads');
  const list = document.querySelector('.project-page__download-list');
  const folder = `data/showcase/${encodeURIComponent(project.name)}/downloads`;

  section.hidden = project.downloads.length === 0;
  list.replaceChildren(
    ...project.downloads.map((file) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${folder}/${encodeURIComponent(file)}`;
      link.download = file;
      link.textContent = file;
      item.append(link);
      return item;
    }),
  );
}

async function init() {
  const content = document.querySelector('.project-page__content');
  const message = document.querySelector('.project-page__message');

  document.addEventListener('site:language-change', () => {
    if (project) renderMeta();
  });

  try {
    const name = new URLSearchParams(window.location.search).get('name');
    project = await loadProject(name);
  } catch (error) {
    console.error(error);
  }

  if (!project) {
    message.hidden = false;
    return;
  }

  document.title = project.name;

  const preview = document.querySelector('.project-page__preview');
  preview.src = project.preview ?? PLACEHOLDER_URL;
  preview.addEventListener(
    'error',
    () => {
      preview.src = PLACEHOLDER_URL;
    },
    { once: true },
  );

  document.querySelector('.project-page__title').textContent = project.name;
  document.querySelector('.project-page__description').textContent = project.description ?? '';

  const repository = document.querySelector('.project-page__repository');
  if (project.repository) {
    repository.href = project.repository;
    repository.hidden = false;
  }

  if (project.readme) {
    // Trusted: rendered by GitHub from the README in your own repository.
    document.querySelector('.project-page__readme').innerHTML = await loadReadme(project.name);
  }

  renderMeta();
  renderDownloads();
  content.hidden = false;
}

init();