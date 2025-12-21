import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useInvestorsFeature } from '../../features/investors/hooks/useInvestors';
import { ArrowLeft, UserPlus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatIST } from '../../shared/lib/timezone';
import { PageLayout } from '../../shared/ui/layout/PageLayout';

type ActionMode = 'select' | 'add' | 'investment' | 'withdrawal';

export function AddInvestorPage() {
  const { setCurrentPage } = useApp();
  const { investors, addInvestor, addInvestment, addWithdrawal } = useInvestorsFeature();
  const [mode, setMode] = useState<ActionMode>('select');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [newInvestorName, setNewInvestorName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const selectedInvestor = investors.find(inv => inv.id === selectedInvestorId);

  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestorName.trim()) return;
    const success = await addInvestor(newInvestorName.trim());
    if (success) {
      toast.success(`Investor "${newInvestorName}" added successfully!`);
      setNewInvestorName('');
      setMode('select');
    } else {
      toast.error('Failed to add investor. Please try again.');
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId || !amount) return;
    const success = await addInvestment(selectedInvestorId, Number(amount), notes || undefined);
    if (success) {
      toast.success('Investment added successfully!');
      setAmount('');
      setNotes('');
      setMode('select');
    } else {
      toast.error('Failed to add investment. Please try again.');
    }
  };

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId || !amount) return;
    
    const amountNum = Number(amount);
    if (selectedInvestor && amountNum > selectedInvestor.netInvestment) {
      toast.error('Withdrawal amount cannot exceed net investment!');
      return;
    }
    
    const success = await addWithdrawal(selectedInvestorId, amountNum, notes || undefined);
    if (success) {
      toast.success('Withdrawal processed successfully!');
      setAmount('');
      setNotes('');
      setMode('select');
    } else {
      toast.error('Failed to process withdrawal. Please try again.');
    }
  };

  return (
    <PageLayout
      header={{
        title: 'Investor Management',
        subtitle: 'Track capital investments and withdrawals',
        backButton: {
          label: 'Back to Dashboard',
          onClick: () => setCurrentPage('dashboard'),
          icon: ArrowLeft,
        },
      }}
      contentClassName="py-8"
    >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-foreground mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setMode('add')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    mode === 'add'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add New Investor</span>
                </button>

                <button
                  onClick={() => setMode('select')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    mode === 'select'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Manage Existing</span>
                </button>
              </div>

              {/* Selected Investor Quick Info */}
              {selectedInvestor && mode !== 'add' && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary mb-1">Selected Investor</p>
                  <p className="text-foreground">{selectedInvestor.name}</p>
                  <p className="text-sm text-primary/80 mt-2">
                    Net Investment: ${selectedInvestor.netInvestment.toLocaleString()}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setMode('investment')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Add Investment
                    </button>
                    <button
                      onClick={() => setMode('withdrawal')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                      <TrendingDown className="w-4 h-4" />
                      Add Withdrawal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Forms/Tables */}
          <div className="lg:col-span-2">
            {/* Add New Investor Form */}
            {mode === 'add' && (
              <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
                <h2 className="text-foreground mb-6">Add New Investor</h2>
                <form onSubmit={handleAddInvestor}>
                  <div className="mb-6">
                    <label htmlFor="investorName" className="block text-muted-foreground mb-2">
                      Investor Name
                    </label>
                    <input
                      id="investorName"
                      type="text"
                      value={newInvestorName}
                      onChange={(e) => setNewInvestorName(e.target.value)}
                      className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      placeholder="Enter investor name"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add Investor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('select');
                        setNewInvestorName('');
                      }}
                      className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Investment Form */}
            {mode === 'investment' && selectedInvestor && (
              <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
                <h2 className="text-foreground mb-6">Add Investment</h2>
                <form onSubmit={handleAddInvestment}>
                  <div className="mb-6">
                    <label htmlFor="investAmount" className="block text-muted-foreground mb-2">
                      Investment Amount
                    </label>
                    <input
                      id="investAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="investNotes" className="block text-muted-foreground mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="investNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add Investment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('select');
                        setAmount('');
                        setNotes('');
                      }}
                      className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Withdrawal Form */}
            {mode === 'withdrawal' && selectedInvestor && (
              <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
                <h2 className="text-foreground mb-6">Add Withdrawal</h2>
                <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-accent">
                    Available for withdrawal: ${selectedInvestor.netInvestment.toLocaleString()}
                  </p>
                </div>
                <form onSubmit={handleAddWithdrawal}>
                  <div className="mb-6">
                    <label htmlFor="withdrawAmount" className="block text-muted-foreground mb-2">
                      Withdrawal Amount
                    </label>
                    <input
                      id="withdrawAmount"
                      type="number"
                      min="0"
                      max={selectedInvestor.netInvestment}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="withdrawNotes" className="block text-muted-foreground mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="withdrawNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-destructive text-destructive-foreground py-3 rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                      Process Withdrawal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('select');
                        setAmount('');
                        setNotes('');
                      }}
                      className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Investor List/Table */}
            {mode === 'select' && (
              <div className="bg-card border border-border/70 rounded-xl shadow-sm p-6">
                <h2 className="text-foreground mb-6">All Investors</h2>
                
                {investors.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No investors yet. Add your first investor to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/70">
                          <th className="text-left py-3 px-4 text-muted-foreground">Investor Name</th>
                          <th className="text-right py-3 px-4 text-muted-foreground">Total Invested</th>
                          <th className="text-right py-3 px-4 text-muted-foreground">Total Withdrawn</th>
                          <th className="text-right py-3 px-4 text-muted-foreground">Net Investment</th>
                          <th className="text-right py-3 px-4 text-muted-foreground">Last Activity</th>
                          <th className="text-center py-3 px-4 text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investors.map((investor) => (
                          <tr 
                            key={investor.id} 
                            className={`border-b border-border/50 hover:bg-muted/40 ${
                              selectedInvestorId === investor.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-foreground">{investor.name}</td>
                            <td className="py-3 px-4 text-right text-primary">
                              ₹{investor.totalInvested.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-destructive">
                              ₹{investor.totalWithdrawn.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-primary">
                              ₹{investor.netInvestment.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground text-sm">
                              {formatIST(investor.lastActivityDate)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setSelectedInvestorId(investor.id)}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </PageLayout>
  );
}
