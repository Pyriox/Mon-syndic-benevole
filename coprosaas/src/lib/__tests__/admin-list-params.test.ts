import { describe, expect, it } from 'vitest';
import { appendAdminFrom, buildAdminListHref, buildAdminPath, resolveAdminBackHref } from '../admin-list-params';

describe('admin-list-params', () => {
  it('builds list hrefs without default values', () => {
    expect(buildAdminListHref('/admin/utilisateurs', {
      q: 'marie',
      role: 'all',
      page: '1',
      sort: 'created',
    }, {
      role: 'all',
      page: '1',
      sort: 'created',
    })).toBe('/admin/utilisateurs?q=marie');
  });

  it('preserves existing query params when appending a back link', () => {
    expect(appendAdminFrom('/admin/utilisateurs/123?logPage=2', '/admin/utilisateurs?q=test&page=3'))
      .toBe('/admin/utilisateurs/123?logPage=2&from=%2Fadmin%2Futilisateurs%3Fq%3Dtest%26page%3D3');
  });

  it('keeps only safe admin back links', () => {
    expect(resolveAdminBackHref('/admin/coproprietes?page=2', '/admin/utilisateurs')).toBe('/admin/coproprietes?page=2');
    expect(resolveAdminBackHref('https://evil.example', '/admin/utilisateurs')).toBe('/admin/utilisateurs');
    expect(buildAdminPath('/admin/utilisateurs/123', { from: '/admin/utilisateurs?q=test' }))
      .toBe('/admin/utilisateurs/123?from=%2Fadmin%2Futilisateurs%3Fq%3Dtest');
  });
});
