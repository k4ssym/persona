import React, { useState, useEffect } from 'react';
import { Mic, Video, Wifi, Check, AlertTriangle } from 'lucide-react';

export default function HardwareHealth() {
  const [status, setStatus] = useState({ mic: false, cam: false, net: true });

  useEffect(() => {
    // Mock check
    setTimeout(() => setStatus({ mic: true, cam: true, net: true }), 1000);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Visualized in the main dashboard card, this component can be used for detailed list if needed */}
      <StatusItem icon={Mic} label="Microphone" active={status.mic} />
      <StatusItem icon={Video} label="Camera" active={status.cam} />
      <StatusItem icon={Wifi} label="Network" active={status.net} />
    </div>
  );
}

const StatusItem = ({ icon: Icon, label, active }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
    <div className="flex items-center gap-3">
       <Icon size={16} className="text-white/70" />
       <span className="text-sm text-white/90">{label}</span>
    </div>
    {active ? <Check size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-red-400" />}
  </div>
);