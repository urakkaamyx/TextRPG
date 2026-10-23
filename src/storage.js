import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class StoryStore {
  constructor(directory) { this.directory = directory; this.locks = new Map(); }

  async initialize() { await mkdir(this.directory, { recursive: true }); }

  storyPath(storyId) {
    if (!/^[a-z0-9-]{6,80}$/i.test(storyId)) throw new Error('Invalid story id.');
    return join(this.directory, `${storyId}.json`);
  }

  async list() {
    await this.initialize();
    const files = (await readdir(this.directory)).filter(file => file.endsWith('.json'));
    const stories = await Promise.all(files.map(async file => {
      try {
        const story = JSON.parse(await readFile(join(this.directory, file), 'utf8'));
        return { id: story.id, name: story.name, genre: story.genre, updatedAt: story.updatedAt, revision: story.revision };
      } catch { return null; }
    }));
    return stories.filter(Boolean).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(storyId) { return JSON.parse(await readFile(this.storyPath(storyId), 'utf8')); }

  async save(story) {
    await this.initialize();
    const path = this.storyPath(story.id);
    const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(story, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    await rename(temporary, path);
  }

  async transact(storyId, operation) {
    const previous = this.locks.get(storyId) || Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    this.locks.set(storyId, current);
    try { return await current; }
    finally { if (this.locks.get(storyId) === current) this.locks.delete(storyId); }
  }
}
