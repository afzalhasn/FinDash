import { describe, it, expect } from 'vitest';
import { applyActivityToInvestor, applyActivityToInvestors } from '../adjustments';
import type { Investor } from '../../types';

const buildInvestor = (overrides: Partial<Investor> = {}): Investor => ({
  id: overrides.id ?? 'inv-1',
  name: overrides.name ?? 'Alice',
  totalInvested: overrides.totalInvested ?? 1000,
  totalWithdrawn: overrides.totalWithdrawn ?? 200,
  netInvestment: overrides.netInvestment ?? 800,
  lastActivityDate: overrides.lastActivityDate ?? new Date('2024-01-01T00:00:00Z'),
  investments: overrides.investments ?? [],
});

describe('investor activity adjustments', () => {
  it('increments invested and net totals for investments', () => {
    const investor = buildInvestor();
    const timestamp = new Date('2024-02-01T00:00:00Z');
    const updated = applyActivityToInvestor(
      investor,
      { type: 'investment', amount: 500, notes: 'Seed' },
      { activityId: 'activity-1', timestamp },
    );
    expect(updated.totalInvested).toBe(1500);
    expect(updated.totalWithdrawn).toBe(200);
    expect(updated.netInvestment).toBe(1300);
    expect(updated.lastActivityDate).toEqual(timestamp);
    expect(updated.investments).toHaveLength(1);
    expect(updated.investments[0]).toMatchObject({
      id: 'activity-1',
      type: 'investment',
      amount: 500,
      notes: 'Seed',
      date: timestamp,
    });
  });

  it('increments withdrawn totals and reduces net for withdrawals', () => {
    const investor = buildInvestor();
    const timestamp = new Date('2024-03-05T00:00:00Z');
    const updated = applyActivityToInvestor(
      investor,
      { type: 'withdrawal', amount: 300, notes: 'Payout' },
      { activityId: 'activity-2', timestamp },
    );
    expect(updated.totalInvested).toBe(1000);
    expect(updated.totalWithdrawn).toBe(500);
    expect(updated.netInvestment).toBe(500);
    expect(updated.lastActivityDate).toEqual(timestamp);
    expect(updated.investments[0]).toMatchObject({
      type: 'withdrawal',
      amount: 300,
    });
  });

  it('only mutates the targeted investor in a list', () => {
    const investors = [buildInvestor({ id: 'inv-1' }), buildInvestor({ id: 'inv-2' })];
    const updated = applyActivityToInvestors(
      investors,
      'inv-2',
      { type: 'investment', amount: 100 },
      { activityId: 'activity-3', timestamp: new Date('2024-04-01T00:00:00Z') },
    );
    expect(updated[0]).toBe(investors[0]);
    expect(updated[1].id).toBe('inv-2');
    expect(updated[1].totalInvested).toBe(1100);
    expect(updated[1].netInvestment).toBe(900);
    expect(updated[1].investments).toHaveLength(1);
  });
});
