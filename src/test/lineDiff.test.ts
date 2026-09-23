import assert from 'node:assert/strict';
import test from 'node:test';
import { computeLineDiff } from '../diff/lineDiff';

test('computeLineDiff with identical SQL produces only unchanged lines with matching numbers', () => {
    const query = 'SELECT id, name\nFROM users\nWHERE active = 1;';
    const result = computeLineDiff(query, query);

    assert.equal(result.hasChanges, false);
    assert.equal(result.addedCount, 0);
    assert.equal(result.removedCount, 0);
    assert.equal(result.isTruncated, false);
    assert.equal(result.lines.length, 3);

    assert.deepEqual(result.lines[0], {
        type: 'unchanged',
        beforeLineNumber: 1,
        afterLineNumber: 1,
        text: 'SELECT id, name',
    });
    assert.deepEqual(result.lines[1], {
        type: 'unchanged',
        beforeLineNumber: 2,
        afterLineNumber: 2,
        text: 'FROM users',
    });
    assert.deepEqual(result.lines[2], {
        type: 'unchanged',
        beforeLineNumber: 3,
        afterLineNumber: 3,
        text: 'WHERE active = 1;',
    });
});

test('computeLineDiff detects single added line in the middle', () => {
    const before = 'SELECT id\nFROM orders\nORDER BY id;';
    const after = 'SELECT id\nFROM orders\nWHERE status = \'paid\'\nORDER BY id;';

    const result = computeLineDiff(before, after);

    assert.equal(result.hasChanges, true);
    assert.equal(result.addedCount, 1);
    assert.equal(result.removedCount, 0);
    assert.equal(result.lines.length, 4);

    assert.equal(result.lines[0].type, 'unchanged');
    assert.equal(result.lines[0].beforeLineNumber, 1);
    assert.equal(result.lines[0].afterLineNumber, 1);

    assert.equal(result.lines[1].type, 'unchanged');
    assert.equal(result.lines[1].beforeLineNumber, 2);
    assert.equal(result.lines[1].afterLineNumber, 2);

    assert.equal(result.lines[2].type, 'added');
    assert.equal(result.lines[2].beforeLineNumber, undefined);
    assert.equal(result.lines[2].afterLineNumber, 3);
    assert.equal(result.lines[2].text, "WHERE status = 'paid'");

    assert.equal(result.lines[3].type, 'unchanged');
    assert.equal(result.lines[3].beforeLineNumber, 3);
    assert.equal(result.lines[3].afterLineNumber, 4);
});

test('computeLineDiff detects single removed line in the middle', () => {
    const before = 'SELECT id\nFROM orders\nWHERE status = \'paid\'\nORDER BY id;';
    const after = 'SELECT id\nFROM orders\nORDER BY id;';

    const result = computeLineDiff(before, after);

    assert.equal(result.hasChanges, true);
    assert.equal(result.addedCount, 0);
    assert.equal(result.removedCount, 1);
    assert.equal(result.lines.length, 4);

    assert.equal(result.lines[2].type, 'removed');
    assert.equal(result.lines[2].beforeLineNumber, 3);
    assert.equal(result.lines[2].afterLineNumber, undefined);
    assert.equal(result.lines[2].text, "WHERE status = 'paid'");

    assert.equal(result.lines[3].type, 'unchanged');
    assert.equal(result.lines[3].beforeLineNumber, 4);
    assert.equal(result.lines[3].afterLineNumber, 3);
});

test('computeLineDiff treats modified line as removed followed by added', () => {
    const before = 'SELECT total\nFROM orders\nLEFT JOIN users ON orders.user_id = users.id;';
    const after = 'SELECT total\nFROM orders\nINNER JOIN users ON orders.user_id = users.id;';

    const result = computeLineDiff(before, after);

    assert.equal(result.hasChanges, true);
    assert.equal(result.addedCount, 1);
    assert.equal(result.removedCount, 1);
    assert.equal(result.lines.length, 4);

    assert.equal(result.lines[2].type, 'removed');
    assert.equal(result.lines[2].beforeLineNumber, 3);
    assert.equal(result.lines[2].afterLineNumber, undefined);
    assert.equal(result.lines[2].text, 'LEFT JOIN users ON orders.user_id = users.id;');

    assert.equal(result.lines[3].type, 'added');
    assert.equal(result.lines[3].beforeLineNumber, undefined);
    assert.equal(result.lines[3].afterLineNumber, 3);
    assert.equal(result.lines[3].text, 'INNER JOIN users ON orders.user_id = users.id;');
});

test('computeLineDiff preserves empty lines accurately', () => {
    const before = 'SELECT 1;\n\nSELECT 2;';
    const after = 'SELECT 1;\n\n-- Comment\nSELECT 2;';

    const result = computeLineDiff(before, after);

    assert.equal(result.hasChanges, true);
    assert.equal(result.addedCount, 1);
    assert.equal(result.removedCount, 0);
    assert.equal(result.lines.length, 4);

    assert.equal(result.lines[1].type, 'unchanged');
    assert.equal(result.lines[1].text, '');
    assert.equal(result.lines[1].beforeLineNumber, 2);
    assert.equal(result.lines[1].afterLineNumber, 2);

    assert.equal(result.lines[2].type, 'added');
    assert.equal(result.lines[2].text, '-- Comment');
    assert.equal(result.lines[2].afterLineNumber, 3);
});

test('computeLineDiff preserves HTML and SQL special characters in line text without mutation', () => {
    const before = 'SELECT * FROM <table> WHERE x < 10 AND y > 20 AND label = "A & B";';
    const after = 'SELECT * FROM <table> WHERE x <= 10 AND y >= 20 AND label = \'A & B\';';

    const result = computeLineDiff(before, after);

    assert.equal(result.hasChanges, true);
    assert.equal(result.lines[0].text, 'SELECT * FROM <table> WHERE x < 10 AND y > 20 AND label = "A & B";');
    assert.equal(result.lines[1].text, "SELECT * FROM <table> WHERE x <= 10 AND y >= 20 AND label = 'A & B';");
});

test('computeLineDiff normalizes CRLF and LF consistently', () => {
    const before = 'SELECT 1;\r\nSELECT 2;\r\n';
    const after = 'SELECT 1;\nSELECT 2;\n';

    const result = computeLineDiff(before, after);
    assert.equal(result.hasChanges, false);
    assert.equal(result.addedCount, 0);
    assert.equal(result.removedCount, 0);
});

test('computeLineDiff handles empty strings cleanly', () => {
    const result = computeLineDiff('', '');
    assert.equal(result.hasChanges, false);
    assert.equal(result.lines.length, 0);
    assert.equal(result.addedCount, 0);
    assert.equal(result.removedCount, 0);
});

test('computeLineDiff caps diff lines when maxDiffLines is exceeded', () => {
    const linesA = Array.from({ length: 20 }, (_, i) => `LINE_${i}`);
    const linesB = Array.from({ length: 20 }, (_, i) => `CHANGED_${i}`);

    const result = computeLineDiff(linesA.join('\n'), linesB.join('\n'), { maxDiffLines: 5 });

    assert.equal(result.isTruncated, true);
    assert.equal(result.lines.length, 5);
    assert.equal(result.hasChanges, true);
});
