import fs from 'fs';
import path from 'path';

const repositoriesDir = path.join(__dirname, '..');

const repositoryFiles = fs
  .readdirSync(repositoriesDir)
  .filter((file) => file.endsWith('.ts') && !fs.statSync(path.join(repositoriesDir, file)).isDirectory());

describe('repository SQL queries', () => {
  it.each(repositoryFiles)('%s contains no interpolated SQL identifiers/values', (file) => {
    const source = fs.readFileSync(path.join(repositoriesDir, file), 'utf-8');

    // Flag any template literal passed to pool.query/query that interpolates a variable
    // (e.g. `SELECT * FROM members WHERE email = '${email}'`). Parameterized queries
    // (`$1`, `$2`, ...) passed via the second argument are the only safe pattern.
    const interpolatedSqlPattern = /query(?:<[^>]*>)?\(\s*`[^`]*\$\{[^}]*\}[^`]*`/g;

    expect(source).not.toMatch(interpolatedSqlPattern);
  });
});
