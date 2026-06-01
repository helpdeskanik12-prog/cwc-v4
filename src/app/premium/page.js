'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

const PLANS = [
  {
    name: 'Premium Monthly',
    price: '$9.99',
    period: '/month',
    plan: 'premium_monthly',
    features: ['Ad-free streaming', 'Full HD quality', 'Early access to new releases', 'Download for offline viewing', 'Priority support'],
    popular: false,
  },
  {
    name: 'Premium Yearly',
    price: '$89.99',
    period: '/year',
    plan: 'premium_yearly',
    features: ['Everything in Monthly', 'Save 25%', 'Exclusive content', '2 months free', 'VIP badge'],
    popular: true,
  },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (plan) => {
    if (!user) {
      setError('Please login first');
      return;
    }
    setLoading(plan);
    setError('');
    try {
      const token = localStorage.getItem('cwc_token');
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const isPremium = user?.role === 'premium' || user?.role === 'superadmin';

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Unlock the full CINEWORLD experience — ad-free, HD streaming, early access, and more.
        </p>
        {isPremium && (
          <div className="mt-6 inline-block bg-green-600/20 text-green-400 px-6 py-2 rounded-full font-semibold">
            You're a Premium Member
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded mb-8 max-w-md mx-auto text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {PLANS.map(plan => (
          <div key={plan.plan} className={`bg-[#1f1f1f] rounded-xl p-8 border-2 transition ${plan.popular ? 'border-red-600' : 'border-transparent hover:border-[#333]'}`}>
            {plan.popular && (
              <div className="text-center -mt-11 mb-3">
                <span className="bg-red-600 text-white text-xs px-4 py-1 rounded-full font-bold uppercase tracking-wide">Most Popular</span>
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-gray-500">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.plan)}
              disabled={loading === plan.plan || isPremium}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                plan.popular
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#333] hover:bg-[#444] text-white'
              } disabled:opacity-50`}
            >
              {loading === plan.plan ? 'Redirecting...' : isPremium ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      {!user && (
        <p className="text-center text-gray-500 mt-8">
          Already have an account? <a href="/login" className="text-red-500 hover:underline">Sign in</a> to upgrade.
        </p>
      )}
    </div>
  );
}
