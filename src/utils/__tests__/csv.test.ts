import { toCsv } from '../csv';

describe('toCsv', () => {
  it('joins headers and rows with CRLF line endings', () => {
    const csv = toCsv(['id', 'name'], [[1, 'Alice'], [2, 'Bob']]);
    expect(csv).toBe('id,name\r\n1,Alice\r\n2,Bob\r\n');
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    const csv = toCsv(['name', 'note'], [['Smith, John', 'He said "hi"\nagain']]);
    expect(csv).toBe('name,note\r\n"Smith, John","He said ""hi""\nagain"\r\n');
  });

  it('renders null/undefined fields as empty strings', () => {
    const csv = toCsv(['a', 'b'], [[null, undefined]]);
    expect(csv).toBe('a,b\r\n,\r\n');
  });
});
