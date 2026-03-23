import { describe, it, expect } from 'vitest';
import { hasMagicBytes, MAGIC_SIGNATURES } from '../utils-file';

function makeBuffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe('hasMagicBytes', () => {
  it('reconnaît un PDF valide', () => {
    // %PDF = 0x25 0x50 0x44 0x46
    const buf = makeBuffer(0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34);
    expect(hasMagicBytes(buf, 'application/pdf')).toBe(true);
  });

  it('rejette un fichier PDF avec de mauvais bytes', () => {
    const buf = makeBuffer(0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07);
    expect(hasMagicBytes(buf, 'application/pdf')).toBe(false);
  });

  it('reconnaît un JPEG valide', () => {
    const buf = makeBuffer(0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46);
    expect(hasMagicBytes(buf, 'image/jpeg')).toBe(true);
  });

  it('rejette un fichier JPEG avec de mauvais bytes', () => {
    const buf = makeBuffer(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
    expect(hasMagicBytes(buf, 'image/jpeg')).toBe(false);
  });

  it('reconnaît un PNG valide', () => {
    const buf = makeBuffer(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
    expect(hasMagicBytes(buf, 'image/png')).toBe(true);
  });

  it('reconnaît GIF87a', () => {
    const buf = makeBuffer(0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00);
    expect(hasMagicBytes(buf, 'image/gif')).toBe(true);
  });

  it('reconnaît GIF89a', () => {
    const buf = makeBuffer(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00);
    expect(hasMagicBytes(buf, 'image/gif')).toBe(true);
  });

  it('retourne true pour text/plain (pas de signature)', () => {
    const buf = makeBuffer(0x48, 0x65, 0x6C, 0x6C, 0x6F); // "Hello"
    expect(hasMagicBytes(buf, 'text/plain')).toBe(true);
  });

  it('retourne true pour text/csv (pas de signature)', () => {
    const buf = makeBuffer(0x22, 0x6E, 0x6F, 0x6D, 0x22); // '"nom"'
    expect(hasMagicBytes(buf, 'text/csv')).toBe(true);
  });

  it('reconnaît un fichier DOCX (ZIP header)', () => {
    const buf = makeBuffer(0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00);
    expect(hasMagicBytes(buf, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
  });

  it('MAGIC_SIGNATURES est exporté et contient application/pdf', () => {
    expect(MAGIC_SIGNATURES['application/pdf']).toBeDefined();
    expect(MAGIC_SIGNATURES['application/pdf'][0]).toEqual([0x25, 0x50, 0x44, 0x46]);
  });
});
