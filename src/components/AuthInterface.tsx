import React, { useState, useEffect } from 'react';
import { 
  auth,
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  logoutUser,
  sendPasswordReset,
  updateUserProfile,
  getUserProfile,
  saveUserProfile,
  onAuthStateChanged,
  FirebaseUser
} from '../utils/firebase.js';
import { DbUser } from '../types.js';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  KeyRound, 
  Loader2, 
  Chrome, 
  CheckCircle, 
  AlertCircle,
  Award,
  Edit2,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthInterfaceProps {
  onUserSynced: (user: FirebaseUser | null, profile: DbUser | null) => void;
  currentStats: {
    totalScore: number;
    maxStreak: number;
  };
}

export const AuthInterface: React.FC<AuthInterfaceProps> = ({ onUserSynced, currentStats }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<DbUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);

  // Form State
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isResetMode, setIsResetMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  
  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [newDisplayName, setNewDisplayName] = useState<string>('');

  // Notifications State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const maxStreakRef = React.useRef(currentStats.maxStreak);
  maxStreakRef.current = currentStats.maxStreak;

  const onUserSyncedRef = React.useRef(onUserSynced);
  onUserSyncedRef.current = onUserSynced;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // Fetch or Initialize Profile in Firestore
        try {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            // New User Registration Setup
            const newProfile: Partial<DbUser> = {
              name: firebaseUser.displayName || 'Anonymous Candidate',
              email: firebaseUser.email || '',
              examTarget: ['BCS'],
              currentRank: 99,
              totalGames: 0,
              bestStreak: maxStreakRef.current || 0,
              totalScore: 0,
              fastestResponse: 99.99,
              friends: [],
              lastActiveAt: new Date().toISOString(),
              createdAt: new Date()
            };
            await saveUserProfile(firebaseUser.uid, newProfile);
            profile = {
              id: firebaseUser.uid,
              name: newProfile.name!,
              email: newProfile.email!,
              examTarget: newProfile.examTarget!,
              currentRank: newProfile.currentRank!,
              totalGames: newProfile.totalGames!,
              bestStreak: newProfile.bestStreak!,
              totalScore: newProfile.totalScore!,
              fastestResponse: newProfile.fastestResponse!,
              friends: newProfile.friends!,
              lastActiveAt: newProfile.lastActiveAt!,
              createdAt: newProfile.createdAt!
            };
          }
          setUserProfile(profile);
          onUserSyncedRef.current(firebaseUser, profile);
        } catch (err) {
          console.error("Error setting up user profile snapshot:", err);
          showFeedback('error', 'Profile synced offline. Analytics storage might be restricted.');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        onUserSyncedRef.current(null, null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    setFeedback(null);

    try {
      if (isResetMode) {
        if (!email) throw new Error("Email address is required for password retrieval");
        await sendPasswordReset(email);
        showFeedback('success', 'Instructions sent successfully! Check your inbox.');
        setIsResetMode(false);
      } else if (isSignUp) {
        if (!email || !password || !displayName) throw new Error("Please complete all signup fields");
        if (password.length < 6) throw new Error("Password must be at least 6 characters long");
        await signupWithEmail(email, password, displayName);
        showFeedback('success', `Welcome commander, profile registered!`);
      } else {
        if (!email || !password) throw new Error("Please enter both credentials");
        await loginWithEmail(email, password);
        showFeedback('success', 'Logged in successfully!');
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Authentication service failed. Please check parameters.';
      if (err.code === 'auth/user-not-found') errorMsg = 'No candidate corresponds to this email address.';
      else if (err.code === 'auth/wrong-password') errorMsg = 'The password credential provided is incorrect.';
      else if (err.code === 'auth/email-already-in-use') errorMsg = 'This email profile has already been registered.';
      else if (err.message) errorMsg = err.message;
      showFeedback('error', errorMsg);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleGoogleLoginTrigger = async () => {
    setIsSubmitLoading(true);
    setFeedback(null);
    try {
      await loginWithGoogle();
      showFeedback('success', 'Logged in via Google profile!');
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Google Auth Popup was closed. Retry authenticating.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleLogoutTrigger = async () => {
    setIsSubmitLoading(true);
    try {
      await logoutUser();
      showFeedback('success', 'Safely signed out. Your profile remains persisted on our servers.');
    } catch (err: any) {
      showFeedback('error', 'Logout failed.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleUpdateProfileTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) return;
    setIsSubmitLoading(true);
    try {
      await updateUserProfile(newDisplayName);
      if (currentUser && userProfile) {
        const updated = { ...userProfile, name: newDisplayName };
        await saveUserProfile(currentUser.uid, updated);
        setUserProfile(updated);
        onUserSynced(currentUser, updated);
        showFeedback('success', 'Display profile customized!');
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to sync profile change.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-center min-h-[140px] font-mono text-xs">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-slate-500">Retrieving Cloud Candidate Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      
      {/* Background flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {currentUser && userProfile ? (
        // LOGGED IN COMPANION VIEW
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 border border-cyan-400/20 flex items-center justify-center text-slate-950 font-black text-sm uppercase font-mono shadow-md">
                {userProfile.name ? userProfile.name.slice(0, 2) : 'CD'}
              </div>
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-100 uppercase tracking-tight leading-none">
                    {userProfile.name}
                  </span>
                  <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> SECURE CANDIDATE
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block leading-none font-mono">
                  Registered: {userProfile.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn_edit_profile"
                onClick={() => {
                  setNewDisplayName(userProfile.name);
                  setIsEditingProfile(!isEditingProfile);
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono py-1.5 px-3 rounded text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition"
              >
                <Edit2 className="w-3 h-3" /> Customize Profile
              </button>
              
              <button
                id="btn_logout_auth"
                onClick={handleLogoutTrigger}
                className="bg-rose-950/15 hover:bg-rose-950/30 border border-rose-900/30 hover:border-rose-800/40 text-[10px] font-mono py-1.5 px-3 rounded text-rose-400 flex items-center gap-1.5 cursor-pointer transition"
                disabled={isSubmitLoading}
              >
                {isSubmitLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                Sign Out
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isEditingProfile ? (
              <motion.form 
                key="edit-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 space-y-3"
                onSubmit={handleUpdateProfileTrigger}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block text-left">Custom Display Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 flex-1"
                      placeholder="Enter displayed alias Name"
                      required
                    />
                    <button 
                      type="submit"
                      className="bg-cyan-500 text-slate-950 font-bold font-mono text-xs px-3 rounded hover:bg-cyan-400 transition cursor-pointer"
                      disabled={isSubmitLoading}
                    >
                      {isSubmitLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="profile-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono"
              >
                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase font-black">Best Streak</span>
                  <div className="flex items-center gap-1 text-slate-100 font-bold text-xs">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{userProfile.bestStreak} Runs</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase font-black">National Est.</span>
                  <div className="flex items-center gap-1 text-slate-150 font-bold text-xs text-cyan-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>#{userProfile.currentRank}%ile</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase font-black">History Count</span>
                  <div className="flex items-center gap-1 text-slate-100 font-bold text-xs">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{userProfile.totalGames} Matches</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase font-black">Synced Status</span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold pt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Cloud Active
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // NOT LOGGED IN AUTH FORMS
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <h4 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" />
              {isResetMode ? 'Recover Competior Profile' : isSignUp ? 'Register Candidate Profile' : 'Authenticate Session'}
            </h4>
            
            <button
              id="btn_toggle_auth_mode"
              onClick={() => {
                setFeedback(null);
                if (isResetMode) {
                  setIsResetMode(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
            >
              {isResetMode ? 'Back to Login' : isSignUp ? 'Have an account? Login' : 'Register Account'}
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3 font-sans">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isSignUp && !isResetMode && (
                <div className="flex flex-col gap-1 text-left sm:col-span-2">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Candidate Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                      placeholder="e.g. Farhan Kabir"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Email Profile</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full font-mono"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              {!isResetMode && (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Lock Pin (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full font-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 items-stretch sm:items-center justify-between">
              {!isResetMode ? (
                <button
                  type="button"
                  id="btn_forgot_password"
                  onClick={() => setIsResetMode(true)}
                  className="text-[10px] text-slate-500 hover:text-slate-400 text-left underline font-mono cursor-pointer"
                >
                  Forgot your secret pin?
                </button>
              ) : (
                <div />
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  id="btn_submit_auth"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-mono text-xs py-2 px-5 rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                  disabled={isSubmitLoading}
                >
                  {isSubmitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  {isResetMode ? 'Send Reset Request' : isSignUp ? 'Initiate Survival Profile' : 'Access Analytics'}
                </button>

                {!isResetMode && (
                  <button
                    type="button"
                    id="btn_google_auth"
                    onClick={handleGoogleLoginTrigger}
                    className="bg-slate-900 hover:bg-slate-850 text-white font-mono text-xs py-2 px-4 rounded-xl border border-slate-800 cursor-pointer transition flex items-center justify-center gap-2"
                    disabled={isSubmitLoading}
                    title="Authenticative login using linked Google account"
                  >
                    <Chrome className="w-3.5 h-3.5 text-cyan-400" />
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Notifications and errors boundary messages */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mt-4 p-3 rounded-lg border text-xs text-left font-sans flex items-start gap-2.5 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed">{feedback.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
