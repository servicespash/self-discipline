import React, { useState } from 'react';
import { Shield, ShieldAlert, Wifi, Mic, Bell, ChevronRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const permissions: Permission[] = [
  {
    id: 'location',
    title: 'Precision Location Service',
    description: 'Required to synchronize institutional resonance with local facility environmental markers. Policy: Location data is used for local context only and never exported.',
    icon: <Wifi size={24} />,
  },
  {
    id: 'microphone',
    title: 'Resonance Microphone Input',
    description: 'Enables "Hi Rama" wake word detection and voice interaction. Policy: Audio processing is performed locally on-device. No voice data is uploaded.',
    icon: <Mic size={24} />,
  },
  {
    id: 'notifications',
    title: 'Discipline Notification Feed',
    description: 'Allows alerts for task deadlines, lockdown alerts, and schedule changes. Policy: Notifications are prioritized for educational discipline and integrity.',
    icon: <Bell size={24} />,
  },
];

export const OnboardingPermissions: React.FC = () => {
  const { setOnboardingComplete } = useSession();
  const [currentStep, setCurrentStep] = useState(0);

  const handleGrant = () => {
    if (currentStep < permissions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOnboardingComplete(true);
    }
  };

  const permission = permissions[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            {permission.icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{permission.title}</h2>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
              Permission Step {currentStep + 1} of {permissions.length}
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          {permission.description}
        </p>

        <button
          onClick={handleGrant}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          Authorize Permission <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
