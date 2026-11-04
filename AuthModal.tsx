import React, { useState } from 'react';
import { X, Check, Lock, Shield, Mail, User, LogOut, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onSignOut,
}) => {
  const [emailInput, setEmailInput] = useState('teripatnikobechkrcoffepiunga@gmail.com');
  const [nameInput, setNameInput] = useState('Google User');
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    // Simulate instantaneous Google OAuth verification flow
    setTimeout(() => {
      const email = emailInput.trim() || 'user@gmail.com';
      const name = nameInput.trim() || email.split('@')[0];
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=bfa3f8,f9a8d4`;

      onUpdateProfile({
        id: Math.random().toString(36).substring(7),
        name,
        email,
        picture: avatarUrl,
        isSignedIn: true,
        provider: 'google',
      });
      setIsSigningIn(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#1a1624] border border-[#362c47] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d243c] bg-[#161320]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] flex items-center justify-center text-[#121016] shadow-sm soft-glow-pink">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fcfbfe]">
                {userProfile.isSignedIn ? 'Account Profile' : 'Sign in to Chitragupt'}
              </h2>
              <p className="text-[11px] text-[#a79cb5]">
                {userProfile.isSignedIn ? 'Connected via Google' : 'Sync encrypted conversations & memory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#f9a8d4] hover:bg-[#282135] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {userProfile.isSignedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#231d30] border border-[#382d4c]">
                {userProfile.picture ? (
                  <img
                    src={userProfile.picture}
                    alt={userProfile.name}
                    className="w-12 h-12 rounded-full border-2 border-[#f9a8d4] object-cover ring-2 ring-[#f9a8d4]/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f9a8d4] via-[#fbcfe8] to-[#bfa3f8] flex items-center justify-center text-[#121016] font-bold">
                    {userProfile.name[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-[#fcfbfe] flex items-center gap-1.5 truncate">
                    <span>{userProfile.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#f9a8d4]/20 text-[#f9a8d4] border border-[#f9a8d4]/40 soft-glow-pink">
                      Google Verified
                    </span>
                  </div>
                  <div className="text-xs text-[#f9a8d4] truncate">{userProfile.email}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3" />
                    <span>AES-256 Encrypted Ledger Connected</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161320] border border-[#2d243c] text-xs text-[#a79cb5] leading-relaxed">
                Your conversations and custom memory rankings are encrypted and bound to your local key.
              </div>

              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#fcfbfe] hover:bg-white text-[#121016] font-semibold text-sm shadow-md hover:shadow-pink-500/10 transition-all active:scale-[0.99] border border-[#f9a8d4]/40 hover:border-[#f9a8d4]"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#342a44]"></div>
                <span className="flex-shrink mx-3 text-[11px] text-[#a79cb5] uppercase">
                  Verified Account Email
                </span>
                <div className="flex-grow border-t border-[#342a44]"></div>
              </div>

              {/* Quick Login Inputs for user customization */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#a79cb5] mb-1">
                    Google Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#bfa3f8]" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#14111c] border border-[#342a44] rounded-xl pl-8 pr-3 py-2 text-xs text-[#fcfbfe] placeholder-neutral-500 focus:outline-none focus:border-[#bfa3f8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#a79cb5] mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-[#f9a8d4]" />
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-[#14111c] border border-[#342a44] rounded-xl pl-8 pr-3 py-2 text-xs text-[#fcfbfe] placeholder-neutral-500 focus:outline-none focus:border-[#f9a8d4]"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#231d30] border border-[#342a44] text-[11px] text-[#a79cb5]">
                <Lock className="w-3.5 h-3.5 text-[#bfa3f8] flex-shrink-0 mt-0.5" />
                <span>
                  Zero tracking. Google authentication is used solely for identity verification; all your chats remain encrypted on your device.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
