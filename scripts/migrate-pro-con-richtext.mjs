/**
 * One-time migration: convert plain-text pro/con fields to ProseMirror documents.
 *
 * Run after changing supplement_pro.pro and supplement_con.con to Rich Text in Storyblok.
 *
 * Requires a Personal Access Token (Management API), not the preview/delivery token:
 *   Storyblok → Account → Personal access tokens → Generate new token
 *
 * Usage:
 *   STORYBLOK_MANAGEMENT_TOKEN=xxx node scripts/migrate-pro-con-richtext.mjs
 *   STORYBLOK_MANAGEMENT_TOKEN=xxx node scripts/migrate-pro-con-richtext.mjs --dry-run
 */

import StoryblokClient from 'storyblok-js-client';

const token =
  process.env.STORYBLOK_MANAGEMENT_TOKEN?.trim() ||
  process.env.STORYBLOK_TOKEN?.trim();
const dryRun = process.argv.includes('--dry-run');

if (!token) {
  console.error(
    'Missing STORYBLOK_MANAGEMENT_TOKEN.\n' +
      'Create one at Storyblok → Account → Personal access tokens (needs write access).\n' +
      'Add to .env as STORYBLOK_MANAGEMENT_TOKEN=... then re-run.',
  );
  process.exit(1);
}

if (!process.env.STORYBLOK_MANAGEMENT_TOKEN?.trim() && process.env.STORYBLOK_TOKEN?.trim()) {
  console.warn(
    'Using STORYBLOK_TOKEN — this usually fails (401). Use a Personal Access Token as STORYBLOK_MANAGEMENT_TOKEN.\n',
  );
}

const client = new StoryblokClient({
  oauthToken: token,
  endpoint: 'https://mapi.storyblok.com/v1',
  cache: { clear: 'auto', type: 'none' },
});

async function getSpaceId() {
  const previewToken =
    process.env.STORYBLOK_TOKEN?.trim() ||
    process.env.STORYBLOK_PREVIEW_TOKEN?.trim();

  if (previewToken) {
    const cdn = new StoryblokClient({
      accessToken: previewToken,
      cache: { clear: 'auto', type: 'none' },
    });
    const { data } = await cdn.get('/cdn/spaces/me');
    return data.space.id;
  }

  const { data } = await client.get('/spaces', { per_page: 1 });
  const space = data.spaces?.[0];
  if (!space?.id) throw new Error('Could not determine space ID');
  return space.id;
}

function isProsemirrorDoc(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.type === 'doc' &&
    Array.isArray(value.content)
  );
}

function textToProsemirrorDoc(text) {
  const trimmed = String(text ?? '').trim();
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: trimmed ? [{ type: 'text', text: trimmed }] : [],
      },
    ],
  };
}

function migrateField(blok, fieldName) {
  const value = blok[fieldName];
  if (value === undefined || value === null || value === '') return 0;
  if (isProsemirrorDoc(value)) return 0;
  if (typeof value !== 'string') {
    console.warn(
      `  skip ${blok.component} ${blok._uid}: ${fieldName} is ${typeof value}, not string`,
    );
    return 0;
  }

  blok[fieldName] = textToProsemirrorDoc(value);
  return 1;
}

function walkBloks(node, stats) {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const item of node) walkBloks(item, stats);
    return;
  }

  if (isProsemirrorDoc(node)) return;

  if (node.component === 'supplement_pro') {
    stats.pro += migrateField(node, 'pro');
  } else if (node.component === 'supplement_con') {
    stats.con += migrateField(node, 'con');
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') walkBloks(value, stats);
  }
}

async function fetchAllStories(spaceId) {
  const index = [];
  let page = 1;

  while (true) {
    const { data } = await client.get(`spaces/${spaceId}/stories`, {
      page,
      per_page: 100,
    });
    index.push(...data.stories.map(({ id, name, slug, full_slug }) => ({ id, name, slug, full_slug })));
    if (data.stories.length < 100) break;
    page += 1;
  }

  const stories = [];
  for (const entry of index) {
    const { data } = await client.get(`spaces/${spaceId}/stories/${entry.id}`);
    stories.push(data.story);
  }

  return stories;
}

async function main() {
  const spaceId = await getSpaceId();
  console.log(`Space ID: ${spaceId}`);
  if (dryRun) console.log('DRY RUN — no stories will be updated\n');

  const stories = await fetchAllStories(spaceId);
  console.log(`Found ${stories.length} stories\n`);

  let updatedStories = 0;

  for (const story of stories) {
    const content = structuredClone(story.content);
    const stats = { pro: 0, con: 0 };

    walkBloks(content, stats);
    const total = stats.pro + stats.con;
    if (total === 0) continue;

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${story.full_slug}: ${stats.pro} pro, ${stats.con} con`,
    );

    if (!dryRun) {
      await client.put(`spaces/${spaceId}/stories/${story.id}`, {
        story: {
          name: story.name,
          slug: story.slug,
          content,
        },
      });
    }

    updatedStories += 1;
  }

  console.log(
    `\nDone. ${updatedStories} ${updatedStories === 1 ? 'story' : 'stories'} ${dryRun ? 'would be ' : ''}updated.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
