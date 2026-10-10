import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lottie from 'lottie-web';
import cuteBabyGirlAnimation from './assets/cute-baby-girl.json';
import {
  Folder, Home, Calendar, BarChart2, Users, MessageSquare, Settings, User, LogOut,
  Search, Bell, Clock, Plus, ArrowUpRight, TrendingUp, ArrowRight, Edit3, Cloud,
  CheckCircle2, Sparkles, Send, Download, FileText, Check, ShieldCheck,
  Upload, Shield, AlertTriangle, Mic, X, RefreshCw
} from 'lucide-react';
import './dashbord1.css';

// ─────────────────────────────────────────────────────────────────────────────
// FRAUD DEMO MAP — controlled demonstration results matched by filename.
// The 99% figure is a DEMO REFERENCE SCORE, not measured ML accuracy.
// No genuine audio classifier is connected; results are predefined for the
// three known recordings only.
// ─────────────────────────────────────────────────────────────────────────────
const FRAUD_DEMO_MAP = {};

// Pension fraud — exact verbatim message as specified by project owner
FRAUD_DEMO_MAP['pension fraud.wav'] = {
  detection: 'Fraud Detected',
  risk: 'Critical',
  confidence: 99,
  scoreLabel: '99% — Demo Reference Score',
  explanation:
    'This is fraud related coversation . This girl who is talking with user scams with user . Becuase a pension officer doesnot tell that please give your basic details like atm cvv number or any other of bank details and the girl is taking users personal data which is illegal could you complain the cyber crime cell for your security? ',
};
FRAUD_DEMO_MAP['pension-fraud.wav'] = FRAUD_DEMO_MAP['pension fraud.wav'];
FRAUD_DEMO_MAP['pension fraud .wav'] = FRAUD_DEMO_MAP['pension fraud.wav'];

// Scholarship fraud — exact verbatim message as specified by project owner
FRAUD_DEMO_MAP['scholarship fraud.wav'] = {
  detection: 'Fraud Detected',
  risk: 'Critical',
  confidence: 99,
  scoreLabel: '99% — Demo Reference Score',
  explanation:
    'This is fraud related coversation . the boy which named as somya sir at GIET college From Ghangapatana scams the girl student user because a college faculty didnot ask any urgency money need like in this voice soumya sir will ask to give him urgently 9000 rupees to claim the scholarship amount which credited your bank account and also 9000 amount also refundable which seems totaly fraud conversation could you complain the cyber crime cell for your security? ',
};
FRAUD_DEMO_MAP['scholarship-fraud.wav'] = FRAUD_DEMO_MAP['scholarship fraud.wav'];
FRAUD_DEMO_MAP['scholarship fraud .wav'] = FRAUD_DEMO_MAP['scholarship fraud.wav'];

// Bank OTP fraud — exact verbatim message as specified by project owner
FRAUD_DEMO_MAP['bankotp.wav'] = {
  detection: 'Fraud Detected',
  risk: 'Critical',
  confidence: 99,
  scoreLabel: '99% — Demo Reference Score',
  explanation:
    'This is fraud related coversation . the girl asking the verfication code to user ,all banks costumer doesnot ask any type of otp to giving the bank. after blocking the account their is no way to unfreeze your account through online mode and user also crosscheck that she/he opening a bank account in the pnb bank which seems totaly fraud conversation could you complain the cyber crime cell for your security? ',
};
FRAUD_DEMO_MAP['bankotp .wav'] = FRAUD_DEMO_MAP['bankotp.wav'];

function getFraudResult(file) {
  if (!file) return null;
  // Normalize: lowercase and collapse multiple spaces, trim
  const key = file.name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (FRAUD_DEMO_MAP[key]) return FRAUD_DEMO_MAP[key];
  // Unknown file — genuine classifier not connected
  return {
    detection: 'Unable to Classify',
    risk: 'Unknown',
    confidence: null,
    scoreLabel: 'N/A — No classifier connected',
    explanation:
      'This recording does not match any of the three known demonstration files. No genuine audio classifier or speech-analysis backend is currently connected to this dashboard, so a real fraud determination cannot be made. If you suspect this call is fraudulent, please report it to the Cyber Crime Cell or your bank through official channels.',
  };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

const PROCESSING_STEPS = [
  'Uploading audio file...',
  'Extracting voice patterns...',
  'Checking fraud indicators...',
  'Generating AI explanation...',
  'Analysis complete.',
];

// ─────────────────────────────────────────────────────────────────────────────
// Lottie baby animation (header decoration — unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function CuteBabyGirlAnimation() {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: cuteBabyGirlAnimation,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    return () => { anim.destroy(); };
  }, []);
  return <div ref={containerRef} className="cute-baby-animation" title="Cute Baby Girl" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  // ── Core nav/UI state ────────────────────────────────────────────────────
  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarHeight, setSidebarHeight] = useState(() =>
    typeof window !== 'undefined' ? Math.max(window.innerHeight - 16, 600) : 780
  );
  const [scoopY, setScoopY] = useState(136);
  const [toastMessage, setToastMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Sarah Miller', text: 'Hey Thomas! The new bento dashboard looks incredible', time: '10:25 AM', fromMe: false },
    { id: 2, sender: 'Thomas', text: 'Thanks Sarah! Just refined the liquid spring sidebar.', time: '10:30 AM', fromMe: true },
    { id: 3, sender: 'Alex Chen', text: 'Are the weekly task statistics updated for March?', time: '10:34 AM', fromMe: false },
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [settingsForm, setSettingsForm] = useState({
    name: 'Thomas Anderson',
    email: 'thomas@codexr.design',
    role: 'Lead UI/UX Designer',
    notifications: true,
    soundEffects: false,
    weeklyDigest: true,
  });

  // ── Fraud detection state ────────────────────────────────────────────────
  const [fraudModeActive, setFraudModeActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  // 'idle' | 'processing' | 'done' | 'error'
  const [analysisState, setAnalysisState] = useState('idle');
  const [processingStep, setProcessingStep] = useState(0);
  const [fraudResult, setFraudResult] = useState(null);
  const [efficiencyScore, setEfficiencyScore] = useState('98.4%');
  const [efficiencyLabel, setEfficiencyLabel] = useState('Top 5% across organization');
  const [audioDuration, setAudioDuration] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const analysisTimerRef = useRef(null);
  const sidebarRef = useRef(null);
  const navItemRefs = useRef({});

  // ── Nav items ────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'folder',   icon: Folder,        label: 'Projects'  },
    { id: 'home',     icon: Home,          label: 'Home'      },
    { id: 'calendar', icon: Calendar,      label: 'Calendar'  },
    { id: 'chart',    icon: BarChart2,     label: 'Analytics' },
    { id: 'users',    icon: Users,         label: 'Team'      },
    { id: 'chat',     icon: MessageSquare, label: 'Messages'  },
    { id: 'settings', icon: Settings,      label: 'Settings'  },
  ];

  // ── Sidebar geometry ─────────────────────────────────────────────────────
  const updatePositions = () => {
    if (!sidebarRef.current) return;
    const h = sidebarRef.current.offsetHeight;
    if (h > 0) setSidebarHeight(h);
    const activeEl = navItemRefs.current[activeNav];
    if (activeEl) {
      const parentRect = sidebarRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const center = activeRect.top - parentRect.top + activeRect.height / 2;
      if (center > 0) setScoopY(center);
    }
  };

  useLayoutEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [activeNav]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (analysisTimerRef.current) clearInterval(analysisTimerRef.current); };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'Thomas', text: newMsg, time: '10:38 AM', fromMe: true }]);
    setNewMsg('');
  };

  const getSidebarPath = (h, y) => {
    const w = 76, sd = 20, ss = 44;
    const yT = Math.max(30, y - ss);
    const yB = Math.min(h - 30, y + ss);
    return `M 36,0 L ${w},0 L ${w},${yT} C ${w},${y - 22} ${sd},${y - 24} ${sd},${y} C ${sd},${y + 24} ${w},${y + 22} ${w},${yB} L ${w},${h} L 36,${h} A 36,36 0 0,1 0,${h - 36} L 0,36 A 36,36 0 0,1 36,0 Z`;
  };

  const chartDays = [
    { day: 'Mon', value: 62, topLabel: '62' },
    { day: 'Tue', value: 78, topLabel: '78' },
    { day: 'Wed', value: 48, topLabel: '48' },
    { day: 'Thu', value: 91, topLabel: '91' },
    { day: 'Fri', value: 70, topLabel: '70' },
    { day: 'Sat', value: 56, topLabel: '56' },
    { day: 'Sun', value: 84, topLabel: '84' },
  ];

  // ── Fraud handlers ───────────────────────────────────────────────────────
  const resetFraudState = () => {
    if (analysisTimerRef.current) { clearInterval(analysisTimerRef.current); analysisTimerRef.current = null; }
    setSelectedFile(null);
    setAnalysisState('idle');
    setFraudResult(null);
    setProcessingStep(0);
    setAudioDuration(null);
    setEfficiencyScore('98.4%');
    setEfficiencyLabel('Top 5% across organization');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFraudModeActivate = () => {
    resetFraudState();
    setFraudModeActive(true);
  };

  const handleFraudModeDeactivate = () => {
    resetFraudState();
    setFraudModeActive(false);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['mp3', 'mp4', 'wav', 'aac', 'm4a', 'ogg'].includes(ext)) {
      showToast('Unsupported format. Please use MP3, MP4, WAV or AAC.');
      return;
    }
    // Stop any running analysis before accepting the new file
    if (analysisTimerRef.current) { clearInterval(analysisTimerRef.current); analysisTimerRef.current = null; }

    // Clear prior result immediately so old answer never lingers
    setSelectedFile(file);
    setAnalysisState('idle');
    setFraudResult(null);
    setProcessingStep(0);
    setAudioDuration(null);
    setEfficiencyScore('98.4%');
    setEfficiencyLabel('Top 5% across organization');

    // Try to read audio duration
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      if (isFinite(d)) setAudioDuration(`${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleAnalyze = () => {
    if (!selectedFile || analysisState === 'processing') return;
    // Snapshot file now so mid-analysis file changes cannot corrupt result
    const fileSnapshot = selectedFile;
    setAnalysisState('processing');
    setProcessingStep(0);
    setFraudResult(null);

    let step = 0;
    analysisTimerRef.current = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= PROCESSING_STEPS.length - 1) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
        setTimeout(() => {
          const r = getFraudResult(fileSnapshot);
          setFraudResult(r);
          setAnalysisState('done');
          if (r.confidence !== null && r.confidence >= 95) {
            setEfficiencyScore('99%');
            setEfficiencyLabel(r.scoreLabel);
          } else {
            setEfficiencyScore('N/A');
            setEfficiencyLabel(r.scoreLabel);
          }
        }, 500);
      }
    }, 700);
  };

  const handleReset = () => resetFraudState();

  const isCritical = fraudResult && fraudResult.risk === 'Critical';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-viewport">
      <div className="dashboard-container">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="sidebar-wrapper" ref={sidebarRef}>
          <svg className="sidebar-svg-bg" viewBox={`0 0 76 ${sidebarHeight}`} preserveAspectRatio="none">
            <motion.path
              d={getSidebarPath(sidebarHeight, scoopY)}
              initial={false}
              animate={{ d: getSidebarPath(sidebarHeight, scoopY) }}
              transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.8 }}
              fill="#0e0f12"
            />
          </svg>
          <div className="sidebar-content">
            <motion.div
              className="sidebar-logo"
              title="Codexr Dashboard"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveNav('home'); showToast('Returned to Dashboard Home'); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="12" y="2"  width="8" height="8" transform="rotate(45 12 2)"  fill="#ffffff" rx="1.5" />
                <rect x="12" y="12" width="8" height="8" transform="rotate(45 12 12)" fill="#ffffff" rx="1.5" />
              </svg>
            </motion.div>
            <nav className="sidebar-nav">
              {navItems.map((item) => {
                const Ic = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <motion.button
                    key={item.id}
                    ref={el => (navItemRefs.current[item.id] = el)}
                    className={`sidebar-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveNav(item.id)}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <motion.div
                      animate={{ scale: isActive ? 1.15 : 1, color: isActive ? '#0e0f12' : '#ffffff' }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                    >
                      <Ic size={19} strokeWidth={isActive ? 2.6 : 1.8} fill={isActive ? '#0e0f12' : 'none'} />
                    </motion.div>
                  </motion.button>
                );
              })}
            </nav>
            <div className="sidebar-bottom">
              <motion.button
                className={`sidebar-avatar-btn ${activeNav === 'profile' ? 'active' : ''}`}
                title="User Profile"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => { setActiveNav('profile'); showToast('Viewing Thomas Anderson Profile'); }}
              >
                <User size={18} strokeWidth={2.4} />
              </motion.button>
              <motion.button
                className="sidebar-logout-btn"
                title="Log Out"
                whileHover={{ scale: 1.1, color: '#ff5e5e' }}
                whileTap={{ scale: 0.94 }}
                onClick={() => showToast('User logged out')}
              >
                <LogOut size={17} strokeWidth={2} />
              </motion.button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="header-user-welcome">
              <h1 className="header-greeting">Hi Thomas <CuteBabyGirlAnimation /></h1>
              <p className="header-subtext">Glad to see you again!</p>
            </div>
            <div className="header-actions">
              <div className="nav-pills-group">
                <button className={`nav-pill-btn ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('home'); setActiveNav('home'); }}>
                  <Home size={13} /> Home
                </button>
                <button className={`nav-pill-btn ${activeTab === 'add' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('add'); showToast('+ Add Task modal opened'); }}>
                  <Plus size={13} /> Add tasks
                </button>
              </div>
              <div className="header-search">
                <Search size={14} />
                <input type="text" placeholder="Search" />
              </div>
              <button className="header-icon-btn" title="Notifications"
                onClick={() => showToast('You have 3 unread notifications')}>
                <Bell size={17} />
                <span className="notification-dot"></span>
              </button>
              <div className="header-time-pill">10:37 AM</div>
              <div className="header-weather">
                <span className="weather-date">29 May, Monday</span>
                <span className="weather-temp">Cloudy <Cloud size={13} fill="#111114" /> 21°C</span>
              </div>
            </div>
          </header>

          <div className="view-container">
            <AnimatePresence mode="wait">

              {/* ── HOME VIEW ─────────────────────────────────────────────── */}
              {activeNav === 'home' && (
                <motion.div key="home-view" className="home-view"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

                  <section className="top-bento-grid">
                    <motion.div className="bento-card-hours" whileHover={{ scale: 1.02 }} onClick={() => setActiveNav('chart')}>
                      <div className="card-top-badge badge-lime"><Clock size={18} strokeWidth={2.4} /></div>
                      <svg className="card-wavy-art" viewBox="0 0 160 160" fill="none">
                        <path d="M45 0C70 42 42 70 82 102C122 132 160 108 160 160V0H45Z" fill="#eafcb0" opacity="0.8" />
                        <path d="M82 0C106 32 90 60 118 82C144 102 160 90 160 138V0H82Z" fill="#d4fb34" opacity="0.7" />
                      </svg>
                      <div className="card-main-stat">
                        <h2 className="stat-value">1.42M</h2>
                        <p className="stat-label">Total Events</p>
                      </div>
                      <div className="card-drag-cursor">👆</div>
                    </motion.div>

                    <motion.div className="bento-card-tasks" whileHover={{ scale: 1.02, y: -2 }} onClick={() => setActiveNav('folder')}>
                      <div className="card-top-badge badge-orange"><Folder size={18} strokeWidth={2.4} fill="#ffffff" /></div>
                      <svg className="card-wavy-art" viewBox="0 0 160 160" fill="none">
                        <path d="M38 0C60 45 46 76 86 106C126 136 160 115 160 160V0H38Z" fill="#ffe5d6" opacity="0.85" />
                        <path d="M72 0C95 34 84 62 114 84C140 104 160 92 160 138V0H72Z" fill="#ffb285" opacity="0.65" />
                      </svg>
                      <div className="card-main-stat">
                        <h2 className="stat-value">47</h2>
                        <p className="stat-label">active threats</p>
                      </div>
                    </motion.div>

                    <motion.div className="bento-card-add" whileHover={{ scale: 1.02 }}
                      onClick={() => showToast('Select files or paste a phishing link')}>
                      <h3 className="add-widget-title">AI Dropzone /<br />Threat Uploader</h3>
                      <div className="add-widget-plus-btn"><Plus size={24} strokeWidth={2.8} /></div>
                      <p className="uploader-subtext">Upload documents, MP3, JPG, or paste phishing links.</p>
                    </motion.div>

                    <motion.div className="bento-card-premium" whileHover={{ scale: 1.02 }}
                      onClick={() => showToast('Voice impersonation detected')}>
                      <svg className="premium-topo-bg" viewBox="0 0 200 200" fill="none">
                        <path d="M-20 55 Q 60 15, 140 65 T 260 45"  stroke="#ffffff" strokeWidth="1.2" fill="none" />
                        <path d="M-20 95 Q 70 55, 150 105 T 270 85"  stroke="#ffffff" strokeWidth="1.2" fill="none" />
                        <path d="M-20 135 Q 80 95, 160 145 T 280 125" stroke="#ffffff" strokeWidth="1.2" fill="none" />
                        <path d="M-20 175 Q 90 135, 170 185 T 290 165" stroke="#ffffff" strokeWidth="1.2" fill="none" />
                      </svg>
                      <div className="premium-top-arrow"><ArrowUpRight size={17} strokeWidth={2.6} /></div>
                      <div className="premium-text">
                        <h2 className="premium-title">CRITICAL: Digital impersonation</h2>
                        <p className="premium-price">Voice impersonation detected</p>
                      </div>
                      <div className="premium-tags"><span className="premium-tag-pill">CRITICAL ALERT</span></div>
                      <div className="card-drag-cursor">👆</div>
                    </motion.div>
                  </section>

                  <section className="middle-grid">
                    <div className="chart-card">
                      <div className="threat-chart-heading">
                        <div>
                          <h2 className="threat-chart-title">Threat Activity</h2>
                          <p className="threat-chart-subtitle">Events detected this week</p>
                        </div>
                        <span className="threat-chart-total">500 events</span>
                      </div>
                      <div className="threat-chart-plot">
                        <div className="threat-chart-gridlines" aria-hidden="true">
                          {[0, 1, 2, 3].map(l => <span key={l} />)}
                        </div>
                        <div className="threat-chart-y-axis">
                          <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                        </div>
                        <div className="threat-chart-bars">
                          {chartDays.map((col, i) => (
                            <div className="threat-bar-column" key={col.day}>
                              <div className="threat-bar-track">
                                <div
                                  className={`threat-bar ${col.day === 'Thu' ? 'active' : ''}`}
                                  style={{ '--bar-height': `${col.value}%`, '--bar-delay': `${i * 75}ms` }}
                                >
                                  <span className="threat-bar-tooltip">{col.topLabel} events</span>
                                </div>
                              </div>
                              <span className="threat-bar-label">{col.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="stats-card-lime">
                      <div className="stats-card-header">
                        <div className="stats-icon-badge"><TrendingUp size={18} strokeWidth={2.5} /></div>
                        <h2 className="stats-card-title">AI Detection Scenarios</h2>
                      </div>
                      <p className="risk-scores-label">User Risk Scores</p>
                      <div className="stats-months-list">
                        <div className="month-stat-row">
                          <span className="month-label">High Risk <small>12 users</small></span>
                          <div className="month-progress-capsule"><div className="month-indicator-pill" style={{ width: '45%' }}></div></div>
                        </div>
                        <div className="month-stat-row">
                          <span className="month-label">Medium Risk <small>23 users</small></span>
                          <div className="month-progress-capsule active-green"><div className="month-indicator-pill" style={{ width: '70%' }}></div></div>
                        </div>
                        <div className="month-stat-row">
                          <span className="month-label">Low Risk <small>12 users</small></span>
                          <div className="month-progress-capsule"><div className="month-indicator-pill" style={{ width: '35%' }}></div></div>
                        </div>
                      </div>
                      <div className="stats-card-footer" onClick={() => setActiveNav('chart')}>
                        <span className="stats-footer-text">Review risk scenarios</span>
                        <div className="stats-arrow-circle"><ArrowRight size={14} strokeWidth={2.4} /></div>
                      </div>
                    </div>
                  </section>

                  <section className="bottom-grid">
                    <div className="notes-card">
                      <div className="notes-card-header">
                        <div className="notes-title-group"><Calendar size={16} /><h3 className="notes-title">Last notes</h3></div>
                        <div className="notes-actions">
                          <button className="notes-edit-btn" title="Edit notes" onClick={() => showToast('Editing notes...')}><Edit3 size={13} /></button>
                          <div className="notes-avatars-group" onClick={() => setActiveNav('users')} title="View Team">
                            <div className="avatar-circle avatar-lime">😊</div>
                            <div className="avatar-circle avatar-black"><User size={12} strokeWidth={2.4} /></div>
                          </div>
                        </div>
                      </div>
                      <table className="notes-table">
                        <thead><tr><th>Type</th><th>Date</th><th>Status</th><th>Duration</th></tr></thead>
                        <tbody>
                          <tr>
                            <td><div className="note-type-cell"><span className="type-icon-box design"><Sparkles size={12} /></span><span>Design</span></div></td>
                            <td>28.05.2023</td>
                            <td><span className="status-badge"><Clock size={12} /> 43%</span></td>
                            <td>12 hours</td>
                          </tr>
                          <tr>
                            <td><div className="note-type-cell"><span className="type-icon-box dev"><CheckCircle2 size={12} /></span><span>Development</span></div></td>
                            <td>29.05.2023</td>
                            <td><span className="status-badge"><Clock size={12} /> 86%</span></td>
                            <td>18 hours</td>
                          </tr>
                          <tr>
                            <td><div className="note-type-cell"><span className="type-icon-box marketing"><TrendingUp size={12} /></span><span>Marketing</span></div></td>
                            <td>30.05.2023</td>
                            <td><span className="status-badge"><Clock size={12} /> 92%</span></td>
                            <td>6 hours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="teamwork-card" onClick={() => setActiveNav('users')} style={{ cursor: 'pointer' }}>
                      <div className="teamwork-header">
                        <div className="teamwork-badge"><BarChart2 size={18} strokeWidth={2.5} /></div>
                        <h3 className="teamwork-title">Teamwork<br />overview</h3>
                      </div>
                      <div className="teamwork-illustration-area">
                        <svg width="150" height="85" viewBox="0 0 180 110" fill="none">
                          <ellipse cx="90" cy="80" rx="75" ry="26" fill="#ffd4c0" opacity="0.5" />
                          <ellipse cx="90" cy="80" rx="52" ry="18" fill="#ffbfa2" opacity="0.6" />
                          <g transform="translate(42, 30)">
                            <rect x="16" y="0" width="16" height="36" rx="8" fill="#ffe5d6" />
                            <rect x="14" y="26" width="20" height="12" rx="4" fill="#ffffff" />
                            <path d="M 8 36 C 8 34, 18 34, 28 34 C 36 34, 44 38, 44 44 C 44 50, 6 50, 6 44 C 6 40, 8 36, 8 36 Z" fill="#ff7830" />
                            <rect x="4" y="46" width="42" height="8" rx="4" fill="#ffffff" />
                          </g>
                          <g transform="translate(90, 30)">
                            <rect x="16" y="0" width="16" height="36" rx="8" fill="#ffe5d6" />
                            <rect x="14" y="26" width="20" height="12" rx="4" fill="#ffffff" />
                            <path d="M 40 36 C 40 34, 30 34, 20 34 C 12 34, 4 38, 4 44 C 4 50, 42 50, 42 44 C 42 40, 40 36, 40 36 Z" fill="#d4fb34" />
                            <rect x="2" y="46" width="42" height="8" rx="4" fill="#ffffff" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {/* ── FOLDER VIEW ───────────────────────────────────────────── */}
              {activeNav === 'folder' && (
                <motion.div key="folder-view" className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="subview-header">
                    <h2 className="subview-title">Projects &amp; Workspaces</h2>
                    <div className="subview-filters">
                      <button className="filter-btn active">All Projects (6)</button>
                      <button className="filter-btn">In Progress (4)</button>
                      <button className="filter-btn">Completed (2)</button>
                      <button className="filter-btn" style={{ background: 'var(--color-lime)', color: '#0e0f12' }}
                        onClick={() => showToast('New Project created!')}>+ New Project</button>
                    </div>
                  </div>
                  <div className="projects-grid">
                    {[
                      { tag: 'Design System', tc: 'lime',   name: 'Codexr UI Kit 2.0',     desc: 'Liquid organic dashboard tokens & icons', pct: 85, fc: 'lime'   },
                      { tag: 'Mobile App',    tc: 'orange', name: 'Forex Review App',       desc: 'Interactive trading analytics & charts',  pct: 62, fc: 'orange' },
                      { tag: 'Marketing',     tc: 'purple', name: 'Summer Campaign 2026',   desc: 'Bento promotional page & landing',         pct: 94, fc: 'purple' },
                    ].map(p => (
                      <div key={p.name} className="project-bento-card">
                        <div className="project-card-top">
                          <span className={`project-tag ${p.tc}`}>{p.tag}</span>
                          <ArrowUpRight size={18} color="#7c828d" />
                        </div>
                        <div>
                          <h3 className="project-name">{p.name}</h3>
                          <p className="project-desc">{p.desc}</p>
                          <div className="project-progress-track">
                            <div className={`project-progress-fill ${p.fc}`} style={{ width: `${p.pct}%` }}></div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{p.pct}% Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="notes-card" style={{ flex: 1, minHeight: '140px' }}>
                    <div className="notes-card-header">
                      <h3 className="notes-title">Recent Project Assets</h3>
                      <button className="notes-edit-btn" onClick={() => showToast('Uploading asset...')}><Plus size={14} /></button>
                    </div>
                    <table className="notes-table">
                      <thead><tr><th>File Name</th><th>Workspace</th><th>Modified</th><th>Action</th></tr></thead>
                      <tbody>
                        <tr>
                          <td><div className="note-type-cell"><span className="type-icon-box design"><FileText size={12} /></span><span>dashboard-v2-components.fig</span></div></td>
                          <td>Codexr UI Kit</td><td>Today, 10:15 AM</td>
                          <td><button onClick={() => showToast('Downloading file...')} style={{ color: 'var(--color-orange)', cursor: 'pointer' }}><Download size={14} /></button></td>
                        </tr>
                        <tr>
                          <td><div className="note-type-cell"><span className="type-icon-box dev"><FileText size={12} /></span><span>liquid-scoop-sidebar.svg</span></div></td>
                          <td>Core Components</td><td>Yesterday</td>
                          <td><button onClick={() => showToast('Downloading file...')} style={{ color: 'var(--color-orange)', cursor: 'pointer' }}><Download size={14} /></button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── CALENDAR VIEW ─────────────────────────────────────────── */}
              {activeNav === 'calendar' && (
                <motion.div key="calendar-view" className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="subview-header">
                    <h2 className="subview-title">Weekly Schedule &amp; Events</h2>
                    <button className="filter-btn active" onClick={() => showToast('New event added')}>+ Schedule Meeting</button>
                  </div>
                  <div className="calendar-view-grid">
                    <div className="calendar-days-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>May 2026</span>
                        <span style={{ fontSize: '12px', color: '#7c828d' }}>Week 22</span>
                      </div>
                      <div className="calendar-week-pills">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                          <div key={day} className={`cal-day-pill ${selectedDay === day ? 'active' : ''}`} onClick={() => setSelectedDay(day)}>
                            <span>{day}</span><span style={{ fontSize: '13px' }}>{25 + i}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '12px', padding: '12px', background: '#f5f7fa', borderRadius: '16px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 6px' }}>Day Overview ({selectedDay})</h4>
                        <p style={{ fontSize: '11px', color: '#7c828d', margin: 0 }}>4 events scheduled · 6 hours total work</p>
                      </div>
                    </div>
                    <div className="schedule-events-list">
                      <div className="schedule-event-card">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8e94a0', fontWeight: 600 }}>09:30 AM – 10:30 AM</span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>Design System Sync</h4>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>Room A · with Sarah &amp; Alex</span>
                        </div>
                        <span className="status-badge" style={{ color: 'var(--color-orange)' }}>Upcoming</span>
                      </div>
                      <div className="schedule-event-card lime-border">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8e94a0', fontWeight: 600 }}>11:00 AM – 01:00 PM</span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>Bento Dashboard Refinement</h4>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>Figma workspace</span>
                        </div>
                        <span className="status-badge" style={{ color: '#557500' }}>In Progress</span>
                      </div>
                      <div className="schedule-event-card">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8e94a0', fontWeight: 600 }}>03:00 PM – 04:00 PM</span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>Client Product Demo</h4>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>Google Meet link</span>
                        </div>
                        <span className="status-badge">Scheduled</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ANALYTICS / CHART VIEW ────────────────────────────────── */}
              {activeNav === 'chart' && (
                <motion.div key="chart-view" className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

                  <div className="subview-header">
                    <h2 className="subview-title">Performance Analytics</h2>
                    <div className="subview-filters">
                      <button className="filter-btn active">This Month</button>
                      <button className="filter-btn">Last Quarter</button>
                    </div>
                  </div>

                  {/* ── Three metric cards ───────────────────────────────── */}
                  <div className="projects-grid">

                    {/* CARD 1 — Real-Time Fraud Detection (replaces Total Productive Hours) */}
                    <motion.div
                      className="project-bento-card"
                      style={{ background: '#ddf876', cursor: fraudModeActive ? 'default' : 'pointer', position: 'relative', overflow: 'hidden' }}
                      whileHover={{ scale: fraudModeActive ? 1 : 1.02 }}
                      onClick={!fraudModeActive ? handleFraudModeActivate : undefined}
                    >
                      {/* decorative wavy art */}
                      <svg style={{ position: 'absolute', top: 0, right: 0, width: '90px', height: '90px', opacity: 0.22, pointerEvents: 'none' }} viewBox="0 0 160 160" fill="none">
                        <path d="M45 0C70 42 42 70 82 102C122 132 160 108 160 160V0H45Z" fill="#7fb300" />
                        <path d="M82 0C106 32 90 60 118 82C144 102 160 90 160 138V0H82Z" fill="#4a7a00" />
                      </svg>
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#2d4a00' }}>Real-Time Fraud Detection</span>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={13} strokeWidth={2.4} color="#2d4a00" />
                          </div>
                        </div>
                        {fraudModeActive ? (
                          <>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 2px', color: '#1a3000', letterSpacing: '-0.3px' }}>
                              {analysisState === 'done' ? efficiencyScore : 'Active'}
                            </h2>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#3a5a00', margin: 0 }}>
                              {analysisState === 'done' && fraudResult ? fraudResult.detection : 'Fraud Analysis Mode'}
                            </p>
                            <button
                              onClick={e => { e.stopPropagation(); handleFraudModeDeactivate(); }}
                              style={{ marginTop: '8px', fontSize: '10px', fontWeight: 700, color: '#3a5a00', background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '20px', padding: '3px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <X size={10} /> Deactivate
                            </button>
                          </>
                        ) : (
                          <>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 2px', color: '#1a3000', letterSpacing: '-0.3px' }}>Start Analysis</h2>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#3a5a00', margin: 0 }}>Click to activate fraud detection</p>
                          </>
                        )}
                      </div>
                    </motion.div>

                    {/* CARD 2 — Tasks Completed */}
                    <div className="project-bento-card" style={{ background: '#ffe8dc' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Tasks Completed</span>
                      <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0' }}>38 tasks</h2>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>94% on-time delivery</span>
                    </div>

                    {/* CARD 3 — Efficiency Score (animates when fraud result arrives) */}
                    <div className="project-bento-card">
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Efficiency Score</span>
                      <motion.h2
                        key={efficiencyScore}
                        style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0' }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      >
                        {efficiencyScore}
                      </motion.h2>
                      <motion.span
                        key={efficiencyLabel}
                        style={{ fontSize: '11px', color: '#7c828d' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {efficiencyLabel}
                      </motion.span>
                    </div>
                  </div>

                  {/* ── Weekly Trend ↔ Fraud Audio Analysis (in-place morph) ─ */}
                  <div className="notes-card" style={{ flex: 1, minHeight: '200px', overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">

                      {/* Normal state: Weekly Output Trend */}
                      {!fraudModeActive && (
                        <motion.div key="weekly-trend"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ duration: 0.26, ease: 'easeInOut' }}>
                          <div className="notes-card-header">
                            <h3 className="notes-title">Weekly Output Trend</h3>
                            <span style={{ fontSize: '12px', color: '#7c828d' }}>Target: 40h/week</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', padding: '0 20px' }}>
                            {[{ label: 'W1', h: '65%', val: '38h' }, { label: 'W2', h: '80%', val: '42h' }, { label: 'W3', h: '95%', val: '46h' }, { label: 'W4 (Current)', h: '88%', val: '44h' }].map(bar => (
                              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700 }}>{bar.val}</span>
                                <div style={{ width: '48px', height: bar.h, background: 'var(--color-dark)', borderRadius: '12px' }}></div>
                                <span style={{ fontSize: '11px', color: '#7c828d' }}>{bar.label}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Fraud mode: Audio upload + analysis panel */}
                      {fraudModeActive && (
                        <motion.div key="fraud-analysis"
                          initial={{ opacity: 0, scale: 0.98, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97, y: -8 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                          {/* Panel header */}
                          <div className="notes-card-header" style={{ marginBottom: '12px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <Shield size={15} strokeWidth={2.2} color="var(--color-dark)" />
                              <h3 className="notes-title">Fraud Audio Analysis</h3>
                            </div>
                            <span style={{ fontSize: '11px', color: '#7c828d' }}>
                              Upload a suspicious conversation to detect fraud indicators
                            </span>
                          </div>

                          {/* Two-column layout */}
                          <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0 }}>

                            {/* LEFT — upload zone */}
                            <div style={{ flexShrink: 0, width: '190px' }}>
                              <div
                                className={`fd-upload-zone${isDragging ? ' dragging' : ''}${selectedFile ? ' has-file' : ''}`}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => !selectedFile && fileInputRef.current?.click()}
                                style={{ cursor: selectedFile ? 'default' : 'pointer' }}
                              >
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".mp3,.mp4,.wav,.aac,.m4a,audio/*,video/mp4"
                                  style={{ display: 'none' }}
                                  onChange={e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }}
                                />

                                {!selectedFile ? (
                                  <div className="fd-upload-empty">
                                    <div className="fd-upload-icon"><Upload size={20} strokeWidth={1.8} /></div>
                                    <p className="fd-upload-title">Drop audio here</p>
                                    <p className="fd-upload-sub">MP3 · MP4 · WAV · AAC</p>
                                    <button className="fd-browse-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                      Browse file
                                    </button>
                                  </div>
                                ) : (
                                  <div className="fd-file-info">
                                    <div className="fd-file-icon"><Mic size={18} strokeWidth={2} /></div>
                                    <p className="fd-file-name">{selectedFile.name}</p>
                                    <p className="fd-file-meta">{selectedFile.name.split('.').pop().toUpperCase()} · {formatFileSize(selectedFile.size)}</p>
                                    {audioDuration && <p className="fd-file-meta">Duration: {audioDuration}</p>}
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                      {analysisState === 'idle' && (
                                        <button className="fd-analyze-btn" onClick={handleAnalyze}>
                                          Analyze Audio
                                        </button>
                                      )}
                                      <button className="fd-reset-btn" onClick={e => { e.stopPropagation(); handleReset(); }}>
                                        <RefreshCw size={10} /> Reset
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* RIGHT — status / result */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <AnimatePresence mode="wait">

                                {/* No file selected */}
                                {analysisState === 'idle' && !selectedFile && (
                                  <motion.div key="idle-empty"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }} className="fd-result-placeholder">
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                      <Shield size={30} strokeWidth={1.3} color="#c8cdd6" />
                                      <p style={{ fontSize: '12px', color: '#9ba2ad', marginTop: '10px', fontWeight: 500 }}>
                                        Upload an audio file to begin<br />fraud detection analysis
                                      </p>
                                      <p style={{ fontSize: '10px', color: '#b5bbc3', marginTop: '6px' }}>
                                        Demo files: pension fraud.wav · scholarship fraud.wav · bankotp.wav
                                      </p>
                                    </div>
                                  </motion.div>
                                )}

                                {/* File selected, waiting for analysis */}
                                {analysisState === 'idle' && selectedFile && (
                                  <motion.div key="idle-ready"
                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }} className="fd-result-placeholder">
                                    <div style={{ padding: '10px 0' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4fb34' }}></div>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#3a5a00' }}>Analysis Ready</span>
                                      </div>
                                      <p style={{ fontSize: '11px', color: '#7c828d', margin: '0 0 3px' }}>
                                        File: <strong>{selectedFile.name}</strong>
                                      </p>
                                      <p style={{ fontSize: '10px', color: '#9ba2ad', margin: 0 }}>
                                        Click "Analyze Audio" to run the fraud detection pipeline.
                                      </p>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Processing */}
                                {analysisState === 'processing' && (
                                  <motion.div key="processing"
                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}>
                                    <div className="fd-processing-area">
                                      <div className="fd-spinner-ring"></div>
                                      <div style={{ flex: 1 }}>
                                        {PROCESSING_STEPS.map((step, idx) => (
                                          <motion.div
                                            key={step}
                                            className={`fd-step-row${idx <= processingStep ? ' active' : ''}${idx < processingStep ? ' done' : ''}`}
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: idx <= processingStep ? 1 : 0.3, x: 0 }}
                                            transition={{ duration: 0.25, delay: idx * 0.04 }}>
                                            <span className="fd-step-dot">
                                              {idx < processingStep ? <Check size={9} /> : idx === processingStep ? '◉' : '○'}
                                            </span>
                                            <span className="fd-step-text">{step}</span>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Done — show result */}
                                {analysisState === 'done' && fraudResult && (
                                  <motion.div key="result"
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    style={{ overflow: 'auto' }}>
                                    <div className="fd-result-header">
                                      <div className={`fd-detection-badge${isCritical ? ' critical' : fraudResult.confidence === null ? ' unknown' : ' safe'}`}>
                                        {isCritical
                                          ? <AlertTriangle size={13} strokeWidth={2.5} />
                                          : fraudResult.confidence === null
                                            ? <Shield size={13} strokeWidth={2.5} />
                                            : <ShieldCheck size={13} strokeWidth={2.5} />}
                                        <span>{fraudResult.detection.toUpperCase()}</span>
                                      </div>
                                      <div className="fd-risk-pills">
                                        <span className={`fd-risk-pill${isCritical ? ' critical' : fraudResult.confidence === null ? ' unknown' : ' low'}`}>
                                          Risk: {fraudResult.risk}
                                        </span>
                                        <span className="fd-confidence-pill">{fraudResult.scoreLabel}</span>
                                      </div>
                                    </div>
                                    <div className="fd-ai-explanation">
                                      <div className="fd-ai-label">
                                        <Sparkles size={11} strokeWidth={2} />
                                        <span>AI Analysis</span>
                                      </div>
                                      <p className="fd-ai-text">{fraudResult.explanation}</p>
                                    </div>
                                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                      <button className="fd-reset-btn" onClick={handleReset}>
                                        <RefreshCw size={10} /> Analyze another file
                                      </button>
                                    </div>
                                  </motion.div>
                                )}

                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* ── USERS VIEW ────────────────────────────────────────────── */}
              {activeNav === 'users' && (
                <motion.div key="users-view" className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="subview-header">
                    <h2 className="subview-title">Team &amp; Collaborators</h2>
                    <button className="filter-btn active" onClick={() => showToast('Invite link copied!')}>+ Invite Member</button>
                  </div>
                  <div className="projects-grid">
                    {[
                      { name: 'Thomas Anderson', role: 'Lead UI/UX Designer', status: 'Active Now', hours: '44h', color: '#d4fb34' },
                      { name: 'Sarah Miller',    role: 'Frontend Engineer',   status: 'Active Now', hours: '38h', color: '#ff7830' },
                      { name: 'Alex Chen',       role: 'Product Manager',     status: 'In Meeting', hours: '32h', color: '#a855f7' },
                      { name: 'Elena Rostova',   role: 'Design Researcher',   status: 'Away',       hours: '29h', color: '#3b82f6' },
                      { name: 'David Kim',       role: 'Full Stack Dev',      status: 'Active Now', hours: '41h', color: '#10b981' },
                      { name: 'Maya Patel',      role: 'QA Lead',             status: 'Active Now', hours: '36h', color: '#ec4899' },
                    ].map(m => (
                      <div key={m.name} className="project-bento-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                            {m.name[0]}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800 }}>{m.name}</h4>
                            <span style={{ fontSize: '11px', color: '#7c828d' }}>{m.role}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>● {m.status}</span>
                          <span style={{ fontWeight: 700 }}>{m.hours} this week</span>
                        </div>
                        <button className="filter-btn" style={{ width: '100%', textAlign: 'center', background: '#f5f6fa' }}
                          onClick={() => { setActiveNav('chat'); showToast(`Opened chat with ${m.name}`); }}>
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── CHAT VIEW ─────────────────────────────────────────────── */}
              {activeNav === 'chat' && (
                <motion.div key="chat-view" className="chat-view-container"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="chat-threads-card">
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-dark)' }}>Discussions</span>
                    <div className="chat-thread-item active">
                      <div className="avatar-circle avatar-lime">SM</div>
                      <div><div className="chat-thread-name">Sarah Miller</div><div className="chat-thread-msg">The new bento dashboard looks...</div></div>
                    </div>
                    <div className="chat-thread-item" onClick={() => showToast('Switched to Alex Chen')}>
                      <div className="avatar-circle avatar-black">AC</div>
                      <div><div className="chat-thread-name">Alex Chen</div><div className="chat-thread-msg">Weekly stats updated?</div></div>
                    </div>
                    <div className="chat-thread-item" onClick={() => showToast('Switched to Design Team')}>
                      <div className="avatar-circle avatar-lime" style={{ background: 'var(--color-orange)', color: '#fff' }}>DT</div>
                      <div><div className="chat-thread-name">Design Team</div><div className="chat-thread-msg">Sprint review tomorrow 9 AM</div></div>
                    </div>
                  </div>
                  <div className="chat-main-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px' }}>Sarah Miller</span>
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>● Online</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#7c828d' }}>Frontend Engineer</span>
                    </div>
                    <div className="chat-messages-area">
                      {messages.map(m => (
                        <div key={m.id} className={`chat-bubble ${m.fromMe ? 'me' : 'them'}`}>
                          <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>{m.sender} · {m.time}</div>
                          {m.text}
                        </div>
                      ))}
                    </div>
                    <form className="chat-input-bar" onSubmit={handleSendMessage}>
                      <input type="text" placeholder="Write a message to team..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
                      <button type="submit" className="chat-send-btn"><Send size={15} /></button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ── SETTINGS VIEW ─────────────────────────────────────────── */}
              {activeNav === 'settings' && (
                <motion.div key="settings-view" className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="subview-header"><h2 className="subview-title">User Profile &amp; App Settings</h2></div>
                  <div className="settings-view-card">
                    <div className="settings-group">
                      <h4 className="settings-group-title">Personal Profile</h4>
                      {[['Full Name', 'name'], ['Email Address', 'email'], ['Workspace Role', 'role']].map(([label, key]) => (
                        <div key={key} className="settings-field-row">
                          <span className="settings-label">{label}</span>
                          <input className="settings-input" value={settingsForm[key]} onChange={e => setSettingsForm({ ...settingsForm, [key]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                    <div className="settings-group">
                      <h4 className="settings-group-title">Preferences</h4>
                      {[['Desktop Notifications', 'notifications'], ['Weekly Activity Digest', 'weeklyDigest']].map(([label, key]) => (
                        <div key={key} className="settings-field-row">
                          <span className="settings-label">{label}</span>
                          <div className={`settings-toggle ${settingsForm[key] ? 'on' : ''}`} onClick={() => setSettingsForm({ ...settingsForm, [key]: !settingsForm[key] })}>
                            <div className="settings-toggle-knob"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="save-settings-btn" onClick={() => showToast('✓ Settings updated successfully!')}>Save Changes</button>
                  </div>
                </motion.div>
              )}

              {/* ── PROFILE VIEW ──────────────────────────────────────────── */}
              {activeNav === 'profile' && (
                <motion.div key="profile-view" className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                  <div className="subview-header">
                    <div>
                      <h2 className="subview-title">User Profile</h2>
                      <p style={{ fontSize: '12px', color: '#7c828d', margin: '2px 0 0' }}>Manage your public identity, workspaces, and team achievements</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="filter-btn" onClick={() => setActiveNav('home')}>← Back to Home</button>
                      <button className="filter-btn active" onClick={() => showToast('Profile link copied to clipboard!')}>Share Profile</button>
                    </div>
                  </div>
                  <div className="profile-hero-card">
                    <div className="profile-banner-bg"><div className="profile-banner-glow"></div></div>
                    <div className="profile-hero-content">
                      <div className="profile-avatar-wrapper">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" alt="Thomas Anderson" className="profile-avatar-img" />
                        <div className="profile-online-badge" title="Online now"></div>
                      </div>
                      <div className="profile-hero-info">
                        <div className="profile-title-row">
                          <h3 className="profile-user-name">Thomas Anderson</h3>
                          <span className="profile-badge-pro">PRO MEMBER</span>
                        </div>
                        <p className="profile-user-role">Lead UI/UX Designer &amp; Design Systems Architect at Codexr</p>
                        <p className="profile-user-location">📍 Toronto, Ontario, Canada · UTC-4</p>
                      </div>
                      <div className="profile-hero-actions">
                        <button className="profile-primary-btn" onClick={() => { setActiveNav('settings'); showToast('Opened settings to edit profile'); }}>Edit Profile</button>
                      </div>
                    </div>
                  </div>
                  <div className="profile-stats-row">
                    <div className="profile-stat-box"><span className="profile-stat-num">24</span><span className="profile-stat-lbl">Active Projects</span></div>
                    <div className="profile-stat-box"><span className="profile-stat-num" style={{ color: 'var(--color-lime)' }}>98.4%</span><span className="profile-stat-lbl">Efficiency Rate</span></div>
                    <div className="profile-stat-box"><span className="profile-stat-num">1,240h</span><span className="profile-stat-lbl">Hours Tracked</span></div>
                    <div className="profile-stat-box"><span className="profile-stat-num" style={{ color: 'var(--color-orange)' }}>14</span><span className="profile-stat-lbl">Team Members</span></div>
                  </div>
                  <div className="profile-two-col">
                    <div className="profile-card-sub">
                      <h4 className="profile-section-title">About &amp; Bio</h4>
                      <p className="profile-bio-text">Digital product designer focusing on liquid organic interfaces, Bézier animations, and zero-scroll dashboard experiences. Currently leading the Codexr UI Design System.</p>
                      <h4 className="profile-section-title" style={{ marginTop: '14px' }}>Skills &amp; Expertise</h4>
                      <div className="profile-skills-wrap">
                        {['React 19', 'Liquid SVG', 'Framer Motion', 'Design Tokens', 'Figma', 'Prototyping', 'Tailwind/Vanilla CSS'].map((s, i) => (
                          <span key={i} className="profile-skill-pill">{s}</span>
                        ))}
                      </div>
                      <h4 className="profile-section-title" style={{ marginTop: '14px' }}>Connected Accounts</h4>
                      <div className="profile-connections-list">
                        {['GitHub', 'Figma Workspace', 'Dribbble Portfolio'].map(s => (
                          <div key={s} className="profile-conn-item"><span>{s}</span><span className="conn-status-badge">Connected</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="profile-card-sub">
                      <h4 className="profile-section-title">Recent Achievements</h4>
                      <div className="profile-timeline">
                        {[
                          { dot: 'lime',   title: 'Shipped Codexr Liquid Dashboard 2.0',     date: 'Today at 10:30 AM' },
                          { dot: 'orange', title: 'Created Bézier Fluid Scoop Sidebar',       date: 'Yesterday'         },
                          { dot: 'purple', title: '100vh Zero-Scroll Layout Optimization',   date: '3 days ago'        },
                        ].map(t => (
                          <div key={t.title} className="timeline-item">
                            <div className={`timeline-dot ${t.dot}`}></div>
                            <div className="timeline-info">
                              <span className="timeline-title">{t.title}</span>
                              <span className="timeline-date">{t.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="profile-tier-banner">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8c919d' }}>Plan Status</span>
                          <h5 style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800 }}>Codexr Enterprise Pro</h5>
                        </div>
                        <button className="profile-upgrade-btn" onClick={() => showToast('Managing subscription plan...')}>Manage Plan</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <motion.div className="toast-success"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
          <Check size={16} color="var(--color-lime)" />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </div>
  );
}
