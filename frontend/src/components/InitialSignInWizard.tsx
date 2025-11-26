import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { getApiBase } from '../utils/apiBase';

interface TroopData {
  number: string;
  charter_org: string;
  meeting_location: string;
  meeting_day: string;
  notes: string;
}

/**
 * InitialSignInWizard
 * Multi-step wizard for first-time sign-in.
 * Steps:
 * 1. Collect phone, emergency contact, optional YPT date
 * 2. (Admins only) Configure troops/patrols
 * 3. Redirect to Family Setup page
 */
const InitialSignInWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    yptDate: '',
  });
  const [troops, setTroops] = useState<TroopData[]>([{ number: '', charter_org: '', meeting_location: '', meeting_day: '', notes: '' }]);
  const [yptWarning, setYptWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useUser();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTroopChange = (index: number, field: keyof TroopData, value: string) => {
    const newTroops = [...troops];
    newTroops[index][field] = value;
    setTroops(newTroops);
  };

  const addTroop = () => {
    setTroops([...troops, { number: '', charter_org: '', meeting_location: '', meeting_day: '', notes: '' }]);
  };

  const removeTroop = (index: number) => {
    if (troops.length > 1) {
      setTroops(troops.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    setError(null);
    setLoading(true);

    try {
      if (step === 1) {
        if (!form.phone || !form.emergencyContactName || !form.emergencyContactPhone) {
          setError('Please fill out all required fields.');
          setLoading(false);
          return;
        }
        
        if (!form.yptDate) {
          setYptWarning(true);
        } else {
          setYptWarning(false);
        }

        // Update user contact information
        const response = await fetch(`${getApiBase()}/auth/me/contact`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to update contact information');
        }

        const contactData = {
          phone: form.phone,
          emergency_contact_name: form.emergencyContactName,
          emergency_contact_phone: form.emergencyContactPhone,
          youth_protection_expiration: form.yptDate || null,
        };

        const updateResponse = await fetch(`${getApiBase()}/auth/me/contact`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(contactData),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to save contact information');
        }

        if (isAdmin) {
          setStep(2);
        } else {
          navigate('/family-setup');
        }
      } else if (step === 2 && isAdmin) {
        // Save troops and patrols
        for (const troop of troops) {
          if (troop.number) {
            const troopResponse = await fetch(`${getApiBase()}/troops`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(troop),
            });

            if (!troopResponse.ok) {
              throw new Error(`Failed to create troop ${troop.number}`);
            }
          }
        }

        navigate('/family-setup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow border border-gray-200">
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Initial Sign-In Setup
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {step === 1 && (
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleNext(); }}>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone" style={{ color: 'var(--text-primary)' }}>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="emergencyContactName" style={{ color: 'var(--text-primary)' }}>
              Emergency Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              id="emergencyContactName"
              name="emergencyContactName"
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              value={form.emergencyContactName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="emergencyContactPhone" style={{ color: 'var(--text-primary)' }}>
              Emergency Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              value={form.emergencyContactPhone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="yptDate" style={{ color: 'var(--text-primary)' }}>
              Youth Protection Training Date (optional)
            </label>
            <input
              id="yptDate"
              name="yptDate"
              type="date"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              value={form.yptDate}
              onChange={handleChange}
            />
            {yptWarning && (
              <div className="mt-2 text-yellow-700 bg-yellow-100 border-l-4 border-yellow-400 p-2 rounded">
                <strong>Warning:</strong> You must complete Youth Protection Training (YPT) before attending outings. Visit{' '}
                <a href="https://my.scouting.org" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">my.scouting.org</a> to complete YPT.
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-2 px-4 rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)] focus:outline-none focus:ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isAdmin ? 'Next: Configure Troops' : 'Continue'}
          </button>
        </form>
      )}
      
      {step === 2 && isAdmin && (
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleNext(); }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Configure troops for your organization. You can add more troops later from the admin panel.
          </p>
          
          {troops.map((troop, index) => (
            <div key={index} className="p-4 border rounded space-y-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Troop {index + 1}
                </h3>
                {troops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTroop(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Troop Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  value={troop.number}
                  onChange={(e) => handleTroopChange(index, 'number', e.target.value)}
                  placeholder="e.g., 123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Charter Organization
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  value={troop.charter_org}
                  onChange={(e) => handleTroopChange(index, 'charter_org', e.target.value)}
                  placeholder="e.g., First United Methodist Church"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Meeting Location
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  value={troop.meeting_location}
                  onChange={(e) => handleTroopChange(index, 'meeting_location', e.target.value)}
                  placeholder="e.g., Church Fellowship Hall"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Meeting Day
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  value={troop.meeting_day}
                  onChange={(e) => handleTroopChange(index, 'meeting_day', e.target.value)}
                  placeholder="e.g., Tuesday"
                />
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addTroop}
            className="w-full py-2 px-4 rounded border-2 border-dashed text-[var(--text-secondary)] hover:border-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-bg)] transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            + Add Another Troop
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 rounded border text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              style={{ borderColor: 'var(--border-color)' }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)] focus:outline-none focus:ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue to Family Setup'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InitialSignInWizard;
