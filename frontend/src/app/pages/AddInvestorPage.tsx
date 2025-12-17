import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useInvestorsFeature } from '../../features/investors/hooks/useInvestors';
import { ArrowLeft, UserPlus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatIST } from '../../shared/lib/timezone';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-gray-900">Investor Management</h1>
          <p className="text-gray-600">Track capital investments and withdrawals</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setMode('add')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    mode === 'add'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add New Investor</span>
                </button>

                <button
                  onClick={() => setMode('select')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    mode === 'select'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Manage Existing</span>
                </button>
              </div>

              {/* Selected Investor Quick Info */}
              {selectedInvestor && mode !== 'add' && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-600 mb-1">Selected Investor</p>
                  <p className="text-indigo-900">{selectedInvestor.name}</p>
                  <p className="text-sm text-indigo-700 mt-2">
                    Net Investment: ${selectedInvestor.netInvestment.toLocaleString()}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setMode('investment')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Add Investment
                    </button>
                    <button
                      onClick={() => setMode('withdrawal')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-gray-900 mb-6">Add New Investor</h2>
                <form onSubmit={handleAddInvestor}>
                  <div className="mb-6">
                    <label htmlFor="investorName" className="block text-gray-700 mb-2">
                      Investor Name
                    </label>
                    <input
                      id="investorName"
                      type="text"
                      value={newInvestorName}
                      onChange={(e) => setNewInvestorName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter investor name"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add Investor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('select');
                        setNewInvestorName('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Investment Form */}
            {mode === 'investment' && selectedInvestor && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-gray-900 mb-6">Add Investment</h2>
                <form onSubmit={handleAddInvestment}>
                  <div className="mb-6">
                    <label htmlFor="investAmount" className="block text-gray-700 mb-2">
                      Investment Amount
                    </label>
                    <input
                      id="investAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="investNotes" className="block text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="investNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
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
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Withdrawal Form */}
            {mode === 'withdrawal' && selectedInvestor && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-gray-900 mb-6">Add Withdrawal</h2>
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Available for withdrawal: ${selectedInvestor.netInvestment.toLocaleString()}
                  </p>
                </div>
                <form onSubmit={handleAddWithdrawal}>
                  <div className="mb-6">
                    <label htmlFor="withdrawAmount" className="block text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="withdrawNotes" className="block text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="withdrawNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
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
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Investor List/Table */}
            {mode === 'select' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-gray-900 mb-6">All Investors</h2>
                
                {investors.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No investors yet. Add your first investor to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700">Investor Name</th>
                          <th className="text-right py-3 px-4 text-gray-700">Total Invested</th>
                          <th className="text-right py-3 px-4 text-gray-700">Total Withdrawn</th>
                          <th className="text-right py-3 px-4 text-gray-700">Net Investment</th>
                          <th className="text-right py-3 px-4 text-gray-700">Last Activity</th>
                          <th className="text-center py-3 px-4 text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investors.map((investor) => (
                          <tr 
                            key={investor.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              selectedInvestorId === investor.id ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-gray-900">{investor.name}</td>
                            <td className="py-3 px-4 text-right text-green-600">
                              ₹{investor.totalInvested.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-red-600">
                              ₹{investor.totalWithdrawn.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-indigo-600">
                              ₹{investor.netInvestment.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600 text-sm">
                              {formatIST(investor.lastActivityDate)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setSelectedInvestorId(investor.id)}
                                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
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
      </main>
    </div>
  );
}
