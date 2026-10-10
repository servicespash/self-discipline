/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TaskRuleManager - System Rule Linking & In-Progress Lockdown Enforcement
 */

import React, { useState } from 'react';
import { DisciplineBridge } from '../DisciplineBridge';
import { ShieldAlert, Zap } from 'lucide-react';

interface TaskRuleManagerProps {
  taskId: string;
  currentRule?: string;
  onLinkRule: (rule: string) => void;
}

export default function TaskRuleManager({ taskId, currentRule, onLinkRule }: TaskRuleManagerProps) {
  const [selectedRule, setSelectedRule] = useState(currentRule || '');

  const handleRuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rule = e.target.value;
    setSelectedRule(rule);
    onLinkRule(rule);
  };

  return (
    <div className="flex items-center gap-2">
      <select 
        value={selectedRule} 
        onChange={handleRuleChange}
        className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-[10px] text-emerald-400 font-bold focus:outline-none"
      >
        <option value="">Select System Rule</option>
        <option value="social_media_block">Block Social Media & Apps</option>
        <option value="focus_tone">432Hz Focus Matrix</option>
        <option value="strict_lockdown">Full Device Lockdown</option>
      </select>
    </div>
  );
}
