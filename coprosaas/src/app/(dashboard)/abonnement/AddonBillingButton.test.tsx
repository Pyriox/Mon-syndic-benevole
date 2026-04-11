// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AddonBillingButton from './AddonBillingButton';

describe('AddonBillingButton', () => {
  const fetchMock = vi.fn();
  const assignMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    assignMock.mockReset();

    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        assign: assignMock,
      },
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('requires an explicit confirmation before enabling the add-on', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <AddonBillingButton
        coproprieteid="copro-1"
        coproName="Résidence Test"
        enabled={false}
        priceHeadline="60 €/an"
        priceSubline="soit 5 €/mois"
        priceNote="Ajoutée à l’abonnement principal"
        currentPeriodEnd="2030-12-31T00:00:00.000Z"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Activer l’option/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Tarif de l’option/i)).toBeTruthy();

    const confirmButton = screen.getByRole('button', { name: /Confirmer l’ajout/i }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(confirmButton.disabled).toBe(false);

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/stripe/addons/charges-speciales',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });

  it('shows the current pricing recap before confirming a stop at renewal', () => {
    render(
      <AddonBillingButton
        coproprieteid="copro-1"
        coproName="Résidence Test"
        enabled={true}
        priceHeadline="60 €/an"
        priceSubline="soit 5 €/mois"
        priceNote="Ajoutée à l’abonnement principal"
        currentPeriodEnd="2030-12-30T23:00:00.000Z"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Arrêter à l’échéance/i }));

    expect(screen.getByText(/Tarif actuel de l’option/i)).toBeTruthy();
    expect(screen.getByText(/60 €\/an/i)).toBeTruthy();
    expect(screen.getByText(/soit 5 €\/mois/i)).toBeTruthy();
    expect(screen.getByText(/31 décembre 2030/i)).toBeTruthy();
  });
});
