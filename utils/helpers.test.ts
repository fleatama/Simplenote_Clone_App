import { describe, it, expect } from 'vitest';
import { getNoteTitle, formatDateTime } from './helpers';

describe('Helpers Utility Functions', () => {
  
  // getNoteTitle tests
  describe('getNoteTitle', () => {
    it('returns short single line text as is', () => {
      const input = 'Hello World';
      const result = getNoteTitle(input);
      expect(result).toBe('Hello World');
    });

    it('truncates text over 25 chars and adds ...', () => {
      const input = 'This is a very long note content that exceeds twenty five characters limit.';
      const result = getNoteTitle(input);
      // "This is a very long note " is 25 chars
      expect(result).toBe('This is a very long note ...');
    });

    it('ignores second line and below', () => {
      const input = 'Title Line\nSecond Line content';
      const result = getNoteTitle(input);
      expect(result).toBe('Title Line');
    });

    it('returns empty string for empty input', () => {
      expect(getNoteTitle('')).toBe('');
    });
  });

  // formatDateTime tests
  describe('formatDateTime', () => {
    it('converts ISO string to readable format', () => {
      const input = '2024-02-18T12:30:00Z';
      const result = formatDateTime(input);
      // Just check if it contains the main parts to avoid locale differences
      expect(result).toContain('2024');
      expect(result).toContain('02');
      expect(result).toContain('18');
    });

    it('returns empty string for empty input', () => {
      expect(formatDateTime('')).toBe('');
    });
  });

});
