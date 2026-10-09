import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lottie from 'lottie-web';
import cuteBabyGirlAnimation from './assets/cute-baby-girl.json';
import './dashbord1.css';

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
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet'
      }
    });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cute-baby-animation"
      title="Cute Baby Girl"
    />
  );
}
import {
  Folder,
  Home,
  Calendar,
  BarChart2,
  Users,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Search,
  Bell,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ArrowRight,
  Edit3,
  Cloud,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  Send,
  Download,
  FileText,
  Check,
  ChevronRight,
  Mail,
  ShieldCheck
} from 'lucide-react';

// Animated bar graph data
const barData = [
  { label: 'Mon', value: 62, active: false },
  { label: 'Tue', value: 85, active: false },
  { label: 'Wed', value: 47, active: false },
  { label: 'Thu', value: 91, active: true },
  { label: 'Fri', value: 73, active: false },
  { label: 'Sat', value: 38, active: false },
  { label: 'Sun', value: 55, active: false },
];

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [timeUnit, setTimeUnit] = useState('hours');
  const [sidebarHeight, setSidebarHeight] = useState(() =>
    typeof window !== 'undefined' ? Math.max(window.innerHeight - 16, 600) : 780
  );
  const [scoopY, setScoopY] = useState(136);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [barTooltip, setBarTooltip] = useState(null);
  const barChartRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');

  // Chat State for interactive messages view
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Sarah Miller', text: 'Hey Thomas! The new bento dashboard looks incredible 🔥', time: '10:25 AM', fromMe: false },
    { id: 2, sender: 'Thomas', text: 'Thanks Sarah! Just refined the liquid spring sidebar.', time: '10:30 AM', fromMe: true },
    { id: 3, sender: 'Alex Chen', text: 'Are the weekly task statistics updated for March?', time: '10:34 AM', fromMe: false }
  ]);
  const [newMsg, setNewMsg] = useState('');

  // Calendar State
  const [selectedDay, setSelectedDay] = useState('Mon');

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: 'Thomas Anderson',
    email: 'thomas@codexr.design',
    role: 'Lead UI/UX Designer',
    notifications: true,
    soundEffects: false,
    weeklyDigest: true
  });

  const sidebarRef = useRef(null);
  const navItemRefs = useRef({});

  const navItems = [
    { id: 'folder', icon: Folder, label: 'Projects' },
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'chart', icon: BarChart2, label: 'Analytics' },
    { id: 'users', icon: Users, label: 'Team' },
    { id: 'chat', icon: MessageSquare, label: 'Messages' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // Dynamically update scoop Y coordinate to track active button synchronously before paint
  const updatePositions = () => {
    if (sidebarRef.current) {
      const h = sidebarRef.current.offsetHeight;
      if (h > 0) setSidebarHeight(h);
      const activeEl = navItemRefs.current[activeNav];
      if (activeEl) {
        const parentRect = sidebarRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const center = activeRect.top - parentRect.top + activeRect.height / 2;
        if (center > 0) setScoopY(center);
      }
    }
  };

  useLayoutEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => {
      window.removeEventListener('resize', updatePositions);
    };
  }, [activeNav]);

  // Trigger bar animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setBarsAnimated(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'Thomas',
      text: newMsg,
      time: '10:38 AM',
      fromMe: true
    };
    setMessages((prev) => [...prev, msg]);
    setNewMsg('');
  };

  // SVG Path for Liquid Wave Scoop
  const getSidebarPath = (h, y) => {
    const w = 76;
    const scoopDepth = 20; // Inward indentation depth
    const scoopSpan = 44;  // Half-span
    const yTop = Math.max(30, y - scoopSpan);
    const yBottom = Math.min(h - 30, y + scoopSpan);

    return `M 36,0 L ${w},0 L ${w},${yTop} C ${w},${y - 22} ${scoopDepth},${y - 24} ${scoopDepth},${y} C ${scoopDepth},${y + 24} ${w},${y + 22} ${w},${yBottom} L ${w},${h} L 36,${h} A 36,36 0 0,1 0,${h - 36} L 0,36 A 36,36 0 0,1 36,0 Z`;
  };

  const chartDays = [
    { day: 'Mon', count: 3, topLabel: '4h' },
    { day: 'Tue', count: 4, topLabel: '6h' },
    { day: 'Wed', count: 5, topLabel: '8h' },
    { day: 'Thu', count: 2, topLabel: '2h' },
    { day: 'Fri', count: 4, topLabel: '4h' },
    { day: 'Sat', count: 2, topLabel: '2h' },
    { day: 'Sun', count: 2, topLabel: '1h' },
  ];

  return (
    <div className="dashboard-viewport">
      <div className="dashboard-container">
        {/* =========================================================
            CUSTOM BLACK LIQUID SCOOP SIDEBAR WITH FRAMER MOTION
            ========================================================= */}
        <aside className="sidebar-wrapper" ref={sidebarRef}>
          {/* Framer Motion smoothly animates the liquid wave path */}
          <svg
            className="sidebar-svg-bg"
            viewBox={`0 0 76 ${sidebarHeight}`}
            preserveAspectRatio="none"
          >
            <motion.path
              d={getSidebarPath(sidebarHeight, scoopY)}
              initial={false}
              animate={{ d: getSidebarPath(sidebarHeight, scoopY) }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 24,
                mass: 0.8
              }}
              fill="#0e0f12"
            />
          </svg>

          <div className="sidebar-content">
            {/* Top diamond logo */}
            <motion.div
              className="sidebar-logo"
              title="Codexr Dashboard"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveNav('home');
                showToast('Returned to Dashboard Home');
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                  x="12"
                  y="2"
                  width="8"
                  height="8"
                  transform="rotate(45 12 2)"
                  fill="#ffffff"
                  rx="1.5"
                />
                <rect
                  x="12"
                  y="12"
                  width="8"
                  height="8"
                  transform="rotate(45 12 12)"
                  fill="#ffffff"
                  rx="1.5"
                />
              </svg>
            </motion.div>

            {/* Navigation items column */}
            <nav className="sidebar-nav">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <motion.button
                    key={item.id}
                    ref={(el) => (navItemRefs.current[item.id] = el)}
                    className={`sidebar-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveNav(item.id)}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1.15 : 1,
                        color: isActive ? '#0e0f12' : '#ffffff',
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                    >
                      <IconComponent
                        size={19}
                        strokeWidth={isActive ? 2.6 : 1.8}
                        fill={isActive ? '#0e0f12' : 'none'}
                      />
                    </motion.div>
                  </motion.button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="sidebar-bottom">
              <motion.button
                className={`sidebar-avatar-btn ${activeNav === 'profile' ? 'active' : ''}`}
                title="User Profile"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setActiveNav('profile');
                  showToast('Viewing Thomas Anderson Profile');
                }}
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

        {/* =========================================================
            MAIN DASHBOARD AREA (ZERO PAGE SCROLL)
            ========================================================= */}
        <main className="dashboard-main">
          {/* TOP HEADER */}
          <header className="dashboard-header">
            <div className="header-user-welcome">
              <h1 className="header-greeting">
                Hi Thomas
                <CuteBabyGirlAnimation />
              </h1>
              <p className="header-subtext">Glad to see you again!</p>
            </div>

            <div className="header-actions">
              {/* Home & Add tasks pill group */}
              <div className="nav-pills-group">
                <button
                  className={`nav-pill-btn ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('home');
                    setActiveNav('home');
                  }}
                >
                  <Home size={13} /> Home
                </button>
                <button
                  className={`nav-pill-btn ${activeTab === 'add' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('add');
                    showToast('+ Add Task modal opened');
                  }}
                >
                  <Plus size={13} /> Add tasks
                </button>
              </div>

              {/* Search pill */}
              <div className="header-search">
                <Search size={14} />
                <input type="text" placeholder="Search" />
              </div>

              {/* Bell notification */}
              <button
                className="header-icon-btn"
                title="Notifications"
                onClick={() => showToast('You have 3 unread notifications')}
              >
                <Bell size={17} />
                <span className="notification-dot"></span>
              </button>

              {/* Time display */}
              <div className="header-time-pill">10:37 AM</div>

              {/* Weather status */}
              <div className="header-weather">
                <span className="weather-date">29 May, Monday</span>
                <span className="weather-temp">
                  Cloudy <Cloud size={13} fill="#111114" /> 21°C
                </span>
              </div>
            </div>
          </header>

          {/* =========================================================
              VIEW SWITCHER WITH FRAMER MOTION TRANSITIONS
              ========================================================= */}
          <div className="view-container">
            <AnimatePresence mode="wait">
              {/* ===================== HOME VIEW ===================== */}
              {activeNav === 'home' && (
                <motion.div
                  key="home-view"
                  className="home-view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* TOP BENTO GRID (4 CARDS) */}
                  <section className="top-bento-grid">
                    {/* Card 1: 44 hours at work */}
                    <motion.div
                      className="bento-card-hours"
                      whileHover={{ scale: 1.02, rotate: 0 }}
                      onClick={() => setActiveNav('chart')}
                    >
                      <div className="card-top-badge badge-lime">
                        <Clock size={18} strokeWidth={2.4} />
                      </div>

                      {/* Organic Lime Wavy Vector */}
                      <svg className="card-wavy-art" viewBox="0 0 160 160" fill="none">
                        <path
                          d="M45 0C70 42 42 70 82 102C122 132 160 108 160 160V0H45Z"
                          fill="#eafcb0"
                          opacity="0.8"
                        />
                        <path
                          d="M82 0C106 32 90 60 118 82C144 102 160 90 160 138V0H82Z"
                          fill="#d4fb34"
                          opacity="0.7"
                        />
                      </svg>

                      <div className="card-main-stat">
                        <h2 className="stat-value">1.42M</h2>
                        <p className="stat-label">Total Events</p>
                      </div>

                      <div className="card-drag-cursor">👆</div>
                    </motion.div>

                    {/* Card 2: 13 tasks completed */}
                    <motion.div
                      className="bento-card-tasks"
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => setActiveNav('folder')}
                    >
                      <div className="card-top-badge badge-orange">
                        <Folder size={18} strokeWidth={2.4} fill="#ffffff" />
                      </div>

                      {/* Organic Peach Wavy Contours */}
                      <svg className="card-wavy-art" viewBox="0 0 160 160" fill="none">
                        <path
                          d="M38 0C60 45 46 76 86 106C126 136 160 115 160 160V0H38Z"
                          fill="#ffe5d6"
                          opacity="0.85"
                        />
                        <path
                          d="M72 0C95 34 84 62 114 84C140 104 160 92 160 138V0H72Z"
                          fill="#ffb285"
                          opacity="0.65"
                        />
                        <path
                          d="M28 0C50 48 36 80 76 115C116 145 155 128 160 168"
                          stroke="#ffa674"
                          strokeWidth="1.2"
                          opacity="0.45"
                          fill="none"
                        />
                        <path
                          d="M52 0C75 42 61 72 95 103C129 129 155 115 160 148"
                          stroke="#ffa674"
                          strokeWidth="1.2"
                          opacity="0.35"
                          fill="none"
                        />
                      </svg>

                      <div className="card-main-stat">
                        <h2 className="stat-value">47</h2>
                        <p className="stat-label">active threats</p>
                      </div>
                    </motion.div>

                    {/* Card 3: AI Dropzone / Threat Uploader (Dashed) */}
                    <motion.div
                      className="bento-card-add"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => showToast('Threat uploader ready!')}
                    >
                      <div className="add-widget-pill-tooltip">
                        <Info size={10} />
                        <span>Drag &amp; drop or click to upload</span>
                      </div>

                      <h3 className="add-widget-title">AI Dropzone /&nbsp;Threat Uploader</h3>

                      <div className="add-widget-plus-btn dropzone-plus">
                        <span className="dropzone-plus-text">{`{+}`}</span>
                      </div>

                      <p className="dropzone-subtext">Upload documents, MP3, JPG,<br/>or paste phishing links.</p>
                    </motion.div>

                    {/* Card 4: Go premium (Warm Orange) */}
                    <motion.div
                      className="bento-card-premium"
                      whileHover={{ scale: 1.02, rotate: 0 }}
                      onClick={() => showToast('Premium plan: $93.7/mo')}
                    >
                      {/* Topographic Lines Background */}
                      <svg className="premium-topo-bg" viewBox="0 0 200 200" fill="none">
                        <path
                          d="M-20 55 Q 60 15, 140 65 T 260 45"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <path
                          d="M-20 95 Q 70 55, 150 105 T 270 85"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <path
                          d="M-20 135 Q 80 95, 160 145 T 280 125"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <path
                          d="M-20 175 Q 90 135, 170 185 T 290 165"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          fill="none"
                        />
                      </svg>

                      <div className="premium-top-arrow">
                        <ArrowUpRight size={17} strokeWidth={2.6} />
                      </div>

                      <div className="premium-text">
                        <h2 className="premium-title" style={{ fontSize: '15px', lineHeight: 1.2 }}>CRITICAL: Digital impersonation</h2>
                        <p className="premium-price">Voice impersonation detected</p>
                      </div>

                      <div className="premium-tags">
                        <span className="premium-tag-pill" style={{ background: '#fff0ed', color: '#c0392b', fontWeight: 800 }}>⚠ ALERT</span>
                        <span className="premium-tag-pill">live threat</span>
                      </div>

                      <div className="card-drag-cursor">👆</div>
                    </motion.div>
                  </section>

                  {/* MIDDLE SECTION: ANIMATED BAR GRAPH & AI DETECTION CARD */}
                  <section className="middle-grid">
                    {/* Animated Bar Graph Card */}
                    <div className="chart-card bar-chart-card" ref={barChartRef}>
                      <div className="bar-chart-header">
                        <div>
                          <h3 className="bar-chart-title">Threat Activity</h3>
                          <p className="bar-chart-subtitle">Events detected this week</p>
                        </div>
                        <div className="bar-chart-legend">
                          <span className="bar-legend-dot" style={{ background: '#AFA3E8' }}></span>
                          <span className="bar-legend-label">Events</span>
                          <span className="bar-legend-dot" style={{ background: '#8174C7', marginLeft: '10px' }}></span>
                          <span className="bar-legend-label">Peak</span>
                        </div>
                      </div>

                      {/* Gridlines */}
                      <div className="bar-chart-grid">
                        {[100, 75, 50, 25].map((tick) => (
                          <div key={tick} className="bar-grid-row">
                            <span className="bar-grid-label">{tick}</span>
                            <div className="bar-grid-line"></div>
                          </div>
                        ))}
                      </div>

                      {/* Bars */}
                      <div className="bar-chart-stage">
                        {barData.map((bar, idx) => (
                          <div
                            key={bar.label}
                            className="bar-col-wrapper"
                            onMouseEnter={() => { setHoveredBar(idx); setBarTooltip(bar); }}
                            onMouseLeave={() => { setHoveredBar(null); setBarTooltip(null); }}
                          >
                            {/* Tooltip */}
                            {hoveredBar === idx && barTooltip && (
                              <div className="bar-tooltip">
                                <span className="bar-tooltip-label">{barTooltip.label}</span>
                                <span className="bar-tooltip-val">{barTooltip.value} events</span>
                              </div>
                            )}
                            <div
                              className={`bar-column-fill ${hoveredBar === idx || bar.active ? 'bar-active' : ''}`}
                              style={{
                                height: barsAnimated ? `${bar.value}%` : '0%',
                                transitionDelay: `${idx * 60}ms`,
                              }}
                            ></div>
                            <span className="bar-day-label">{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Detection Scenarios Card (Lime green bg preserved) */}
                    <div className="stats-card-lime">
                      <div className="stats-card-header">
                        <div className="stats-icon-badge">
                          <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <h2 className="stats-card-title">
                          AI Detection<br />Scenarios
                        </h2>
                      </div>

                      <div className="stats-months-list">
                        {/* High Risk */}
                        <div className="month-stat-row">
                          <div className="risk-label-row">
                            <span className="month-label">High Risk</span>
                            <span className="risk-pct risk-high">78%</span>
                          </div>
                          <div className="month-progress-capsule risk-capsule-high">
                            <div className="month-indicator-pill risk-pill-high" style={{ width: '78%' }}></div>
                          </div>
                        </div>

                        {/* Medium Risk */}
                        <div className="month-stat-row">
                          <div className="risk-label-row">
                            <span className="month-label">Medium Risk</span>
                            <span className="risk-pct risk-medium">53%</span>
                          </div>
                          <div className="month-progress-capsule active-green risk-capsule-medium">
                            <div className="month-indicator-pill risk-pill-medium" style={{ width: '53%' }}></div>
                          </div>
                        </div>

                        {/* Low Risk */}
                        <div className="month-stat-row">
                          <div className="risk-label-row">
                            <span className="month-label">Low Risk</span>
                            <span className="risk-pct risk-low">21%</span>
                          </div>
                          <div className="month-progress-capsule">
                            <div className="month-indicator-pill risk-pill-low" style={{ width: '21%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="stats-card-footer"
                        onClick={() => setActiveNav('chart')}
                      >
                        <span className="stats-footer-text">View full analysis</span>
                        <div className="stats-arrow-circle">
                          <ArrowRight size={14} strokeWidth={2.4} />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* BOTTOM SECTION: LAST NOTES & TEAMWORK OVERVIEW */}
                  <section className="bottom-grid">
                    {/* Last Notes Table Card */}
                    <div className="notes-card">
                      <div className="notes-card-header">
                        <div className="notes-title-group">
                          <Calendar size={16} />
                          <h3 className="notes-title">Last notes</h3>
                        </div>

                        <div className="notes-actions">
                          <button
                            className="notes-edit-btn"
                            title="Edit notes"
                            onClick={() => showToast('Editing notes...')}
                          >
                            <Edit3 size={13} />
                          </button>

                          <div
                            className="notes-avatars-group"
                            onClick={() => setActiveNav('users')}
                            title="View Team"
                          >
                            <div className="avatar-circle avatar-lime">😊</div>
                            <div className="avatar-circle avatar-black">
                              <User size={12} strokeWidth={2.4} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <table className="notes-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <div className="note-type-cell">
                                <span className="type-icon-box design">
                                  <Sparkles size={12} />
                                </span>
                                <span>Design</span>
                              </div>
                            </td>
                            <td>28.05.2023</td>
                            <td>
                              <span className="status-badge">
                                <Clock size={12} /> 43%
                              </span>
                            </td>
                            <td>12 hours</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="note-type-cell">
                                <span className="type-icon-box dev">
                                  <CheckCircle2 size={12} />
                                </span>
                                <span>Development</span>
                              </div>
                            </td>
                            <td>29.05.2023</td>
                            <td>
                              <span className="status-badge">
                                <Clock size={12} /> 86%
                              </span>
                            </td>
                            <td>18 hours</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="note-type-cell">
                                <span className="type-icon-box marketing">
                                  <TrendingUp size={12} />
                                </span>
                                <span>Marketing</span>
                              </div>
                            </td>
                            <td>30.05.2023</td>
                            <td>
                              <span className="status-badge">
                                <Clock size={12} /> 92%
                              </span>
                            </td>
                            <td>6 hours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Teamwork Overview Card */}
                    <div
                      className="teamwork-card"
                      onClick={() => setActiveNav('users')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="teamwork-header">
                        <div className="teamwork-badge">
                          <BarChart2 size={18} strokeWidth={2.5} />
                        </div>
                        <h3 className="teamwork-title">
                          Teamwork<br />overview
                        </h3>
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

              {/* ===================== PROJECTS (FOLDER) VIEW ===================== */}
              {activeNav === 'folder' && (
                <motion.div
                  key="folder-view"
                  className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="subview-header">
                    <h2 className="subview-title">Projects & Workspaces</h2>
                    <div className="subview-filters">
                      <button className="filter-btn active">All Projects (6)</button>
                      <button className="filter-btn">In Progress (4)</button>
                      <button className="filter-btn">Completed (2)</button>
                      <button
                        className="filter-btn"
                        style={{ background: 'var(--color-lime)', color: '#0e0f12' }}
                        onClick={() => showToast('New Project created!')}
                      >
                        + New Project
                      </button>
                    </div>
                  </div>

                  <div className="projects-grid">
                    <div className="project-bento-card">
                      <div className="project-card-top">
                        <span className="project-tag lime">Design System</span>
                        <ArrowUpRight size={18} color="#7c828d" />
                      </div>
                      <div>
                        <h3 className="project-name">Codexr UI Kit 2.0</h3>
                        <p className="project-desc">Liquid organic dashboard tokens & icons</p>
                        <div className="project-progress-track">
                          <div className="project-progress-fill lime" style={{ width: '85%' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>85% Completed</span>
                      </div>
                    </div>

                    <div className="project-bento-card">
                      <div className="project-card-top">
                        <span className="project-tag orange">Mobile App</span>
                        <ArrowUpRight size={18} color="#7c828d" />
                      </div>
                      <div>
                        <h3 className="project-name">Forex Review App</h3>
                        <p className="project-desc">Interactive trading analytics & charts</p>
                        <div className="project-progress-track">
                          <div className="project-progress-fill orange" style={{ width: '62%' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>62% Completed</span>
                      </div>
                    </div>

                    <div className="project-bento-card">
                      <div className="project-card-top">
                        <span className="project-tag purple">Marketing</span>
                        <ArrowUpRight size={18} color="#7c828d" />
                      </div>
                      <div>
                        <h3 className="project-name">Summer Campaign 2026</h3>
                        <p className="project-desc">Bento promotional page & landing</p>
                        <div className="project-progress-track">
                          <div className="project-progress-fill purple" style={{ width: '94%' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>94% Completed</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Files */}
                  <div className="notes-card" style={{ flex: 1, minHeight: '140px' }}>
                    <div className="notes-card-header">
                      <h3 className="notes-title">Recent Project Assets</h3>
                      <button className="notes-edit-btn" onClick={() => showToast('Uploading asset...')}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <table className="notes-table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Workspace</th>
                          <th>Modified</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="note-type-cell">
                              <span className="type-icon-box design">
                                <FileText size={12} />
                              </span>
                              <span>dashboard-v2-components.fig</span>
                            </div>
                          </td>
                          <td>Codexr UI Kit</td>
                          <td>Today, 10:15 AM</td>
                          <td>
                            <button
                              onClick={() => showToast('Downloading file...')}
                              style={{ color: 'var(--color-orange)', cursor: 'pointer' }}
                            >
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div className="note-type-cell">
                              <span className="type-icon-box dev">
                                <FileText size={12} />
                              </span>
                              <span>liquid-scoop-sidebar.svg</span>
                            </div>
                          </td>
                          <td>Core Components</td>
                          <td>Yesterday</td>
                          <td>
                            <button
                              onClick={() => showToast('Downloading file...')}
                              style={{ color: 'var(--color-orange)', cursor: 'pointer' }}
                            >
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ===================== CALENDAR VIEW ===================== */}
              {activeNav === 'calendar' && (
                <motion.div
                  key="calendar-view"
                  className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="subview-header">
                    <h2 className="subview-title">Weekly Schedule & Events</h2>
                    <button
                      className="filter-btn active"
                      onClick={() => showToast('New event added')}
                    >
                      + Schedule Meeting
                    </button>
                  </div>

                  <div className="calendar-view-grid">
                    <div className="calendar-days-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>May 2026</span>
                        <span style={{ fontSize: '12px', color: '#7c828d' }}>Week 22</span>
                      </div>

                      <div className="calendar-week-pills">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                          <div
                            key={day}
                            className={`cal-day-pill ${selectedDay === day ? 'active' : ''}`}
                            onClick={() => setSelectedDay(day)}
                          >
                            <span>{day}</span>
                            <span style={{ fontSize: '13px' }}>{25 + i}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '12px', padding: '12px', background: '#f5f7fa', borderRadius: '16px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 6px' }}>Day Overview ({selectedDay})</h4>
                        <p style={{ fontSize: '11px', color: '#7c828d', margin: 0 }}>
                          4 events scheduled • 6 hours total work
                        </p>
                      </div>
                    </div>

                    <div className="schedule-events-list">
                      <div className="schedule-event-card">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8e94a0', fontWeight: 600 }}>09:30 AM - 10:30 AM</span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>Design System Sync</h4>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>Room A • with Sarah & Alex</span>
                        </div>
                        <span className="status-badge" style={{ color: 'var(--color-orange)' }}>
                          Upcoming
                        </span>
                      </div>

                      <div className="schedule-event-card lime-border">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8e94a0', fontWeight: 600 }}>11:00 AM - 01:00 PM</span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>Bento Dashboard Refinement</h4>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>Figma workspace</span>
                        </div>
                        <span className="status-badge" style={{ color: '#557500' }}>
                          In Progress
                        </span>
                      </div>

                      <div className="schedule-event-card">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8e94a0', fontWeight: 600 }}>03:00 PM - 04:00 PM</span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700 }}>Client Product Demo</h4>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>Google Meet link</span>
                        </div>
                        <span className="status-badge">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ===================== ANALYTICS (CHART) VIEW ===================== */}
              {activeNav === 'chart' && (
                <motion.div
                  key="chart-view"
                  className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="subview-header">
                    <h2 className="subview-title">Performance Analytics</h2>
                    <div className="subview-filters">
                      <button className="filter-btn active">This Month</button>
                      <button className="filter-btn">Last Quarter</button>
                    </div>
                  </div>

                  <div className="projects-grid">
                    <div className="project-bento-card" style={{ background: '#ddf876' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Total Productive Hours</span>
                      <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0' }}>142.5 hrs</h2>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>↑ +14% vs last month</span>
                    </div>

                    <div className="project-bento-card" style={{ background: '#ffe8dc' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Tasks Completed</span>
                      <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0' }}>38 tasks</h2>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>↑ 94% on-time delivery</span>
                    </div>

                    <div className="project-bento-card">
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Efficiency Score</span>
                      <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0' }}>98.4%</h2>
                      <span style={{ fontSize: '11px', color: '#7c828d' }}>Top 5% across organization</span>
                    </div>
                  </div>

                  {/* Monthly Graph Card */}
                  <div className="notes-card" style={{ flex: 1, minHeight: '160px' }}>
                    <div className="notes-card-header">
                      <h3 className="notes-title">Weekly Output Trend</h3>
                      <span style={{ fontSize: '12px', color: '#7c828d' }}>Target: 40h/week</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', padding: '0 20px' }}>
                      {[
                        { label: 'W1', h: '65%', val: '38h' },
                        { label: 'W2', h: '80%', val: '42h' },
                        { label: 'W3', h: '95%', val: '46h' },
                        { label: 'W4 (Current)', h: '88%', val: '44h' }
                      ].map((bar) => (
                        <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{bar.val}</span>
                          <div style={{ width: '48px', height: bar.h, background: 'var(--color-dark)', borderRadius: '12px' }}></div>
                          <span style={{ fontSize: '11px', color: '#7c828d' }}>{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ===================== TEAM (USERS) VIEW ===================== */}
              {activeNav === 'users' && (
                <motion.div
                  key="users-view"
                  className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="subview-header">
                    <h2 className="subview-title">Team & Collaborators</h2>
                    <button className="filter-btn active" onClick={() => showToast('Invite link copied!')}>
                      + Invite Member
                    </button>
                  </div>

                  <div className="projects-grid">
                    {[
                      { name: 'Thomas Anderson', role: 'Lead UI/UX Designer', status: 'Active Now', hours: '44h', color: '#d4fb34' },
                      { name: 'Sarah Miller', role: 'Frontend Engineer', status: 'Active Now', hours: '38h', color: '#ff7830' },
                      { name: 'Alex Chen', role: 'Product Manager', status: 'In Meeting', hours: '32h', color: '#a855f7' },
                      { name: 'Elena Rostova', role: 'Design Researcher', status: 'Away', hours: '29h', color: '#3b82f6' },
                      { name: 'David Kim', role: 'Full Stack Dev', status: 'Active Now', hours: '41h', color: '#10b981' },
                      { name: 'Maya Patel', role: 'QA Lead', status: 'Active Now', hours: '36h', color: '#ec4899' }
                    ].map((member) => (
                      <div key={member.name} className="project-bento-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: member.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px'
                            }}
                          >
                            {member.name[0]}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800 }}>{member.name}</h4>
                            <span style={{ fontSize: '11px', color: '#7c828d' }}>{member.role}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>● {member.status}</span>
                          <span style={{ fontWeight: 700 }}>{member.hours} this week</span>
                        </div>

                        <button
                          className="filter-btn"
                          style={{ width: '100%', textAlign: 'center', background: '#f5f6fa' }}
                          onClick={() => {
                            setActiveNav('chat');
                            showToast(`Opened chat with ${member.name}`);
                          }}
                        >
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ===================== CHAT (MESSAGES) VIEW ===================== */}
              {activeNav === 'chat' && (
                <motion.div
                  key="chat-view"
                  className="chat-view-container"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="chat-threads-card">
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-dark)' }}>Discussions</span>
                    <div className="chat-thread-item active">
                      <div className="avatar-circle avatar-lime">SM</div>
                      <div>
                        <div className="chat-thread-name">Sarah Miller</div>
                        <div className="chat-thread-msg">The new bento dashboard looks...</div>
                      </div>
                    </div>

                    <div className="chat-thread-item" onClick={() => showToast('Switched to Alex Chen')}>
                      <div className="avatar-circle avatar-black">AC</div>
                      <div>
                        <div className="chat-thread-name">Alex Chen</div>
                        <div className="chat-thread-msg">Weekly stats updated?</div>
                      </div>
                    </div>

                    <div className="chat-thread-item" onClick={() => showToast('Switched to Design Team')}>
                      <div className="avatar-circle avatar-lime" style={{ background: 'var(--color-orange)', color: '#fff' }}>DT</div>
                      <div>
                        <div className="chat-thread-name">Design Team</div>
                        <div className="chat-thread-msg">Sprint review tomorrow 9 AM</div>
                      </div>
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
                      {messages.map((m) => (
                        <div key={m.id} className={`chat-bubble ${m.fromMe ? 'me' : 'them'}`}>
                          <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>{m.sender} • {m.time}</div>
                          {m.text}
                        </div>
                      ))}
                    </div>

                    <form className="chat-input-bar" onSubmit={handleSendMessage}>
                      <input
                        type="text"
                        placeholder="Write a message to team..."
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                      />
                      <button type="submit" className="chat-send-btn">
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ===================== SETTINGS VIEW ===================== */}
              {activeNav === 'settings' && (
                <motion.div
                  key="settings-view"
                  className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="subview-header">
                    <h2 className="subview-title">User Profile & App Settings</h2>
                  </div>

                  <div className="settings-view-card">
                    <div className="settings-group">
                      <h4 className="settings-group-title">Personal Profile</h4>
                      <div className="settings-field-row">
                        <span className="settings-label">Full Name</span>
                        <input
                          className="settings-input"
                          value={settingsForm.name}
                          onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        />
                      </div>
                      <div className="settings-field-row">
                        <span className="settings-label">Email Address</span>
                        <input
                          className="settings-input"
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        />
                      </div>
                      <div className="settings-field-row">
                        <span className="settings-label">Workspace Role</span>
                        <input
                          className="settings-input"
                          value={settingsForm.role}
                          onChange={(e) => setSettingsForm({ ...settingsForm, role: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="settings-group">
                      <h4 className="settings-group-title">Preferences</h4>
                      <div className="settings-field-row">
                        <span className="settings-label">Desktop Notifications</span>
                        <div
                          className={`settings-toggle ${settingsForm.notifications ? 'on' : ''}`}
                          onClick={() => setSettingsForm({ ...settingsForm, notifications: !settingsForm.notifications })}
                        >
                          <div className="settings-toggle-knob"></div>
                        </div>
                      </div>

                      <div className="settings-field-row">
                        <span className="settings-label">Weekly Activity Digest</span>
                        <div
                          className={`settings-toggle ${settingsForm.weeklyDigest ? 'on' : ''}`}
                          onClick={() => setSettingsForm({ ...settingsForm, weeklyDigest: !settingsForm.weeklyDigest })}
                        >
                          <div className="settings-toggle-knob"></div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="save-settings-btn"
                      onClick={() => showToast('✓ Settings updated successfully!')}
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ===================== USER PROFILE VIEW ===================== */}
              {activeNav === 'profile' && (
                <motion.div
                  key="profile-view"
                  className="subview-wrapper"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="subview-header">
                    <div>
                      <h2 className="subview-title">User Profile</h2>
                      <p style={{ fontSize: '12px', color: '#7c828d', margin: '2px 0 0' }}>
                        Manage your public identity, workspaces, and team achievements
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="filter-btn"
                        onClick={() => setActiveNav('home')}
                      >
                        ← Back to Home
                      </button>
                      <button
                        className="filter-btn active"
                        onClick={() => showToast('Profile link copied to clipboard!')}
                      >
                        Share Profile
                      </button>
                    </div>
                  </div>

                  {/* Profile Hero Card */}
                  <div className="profile-hero-card">
                    <div className="profile-banner-bg">
                      <div className="profile-banner-glow"></div>
                    </div>
                    <div className="profile-hero-content">
                      <div className="profile-avatar-wrapper">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                          alt="Thomas Anderson"
                          className="profile-avatar-img"
                        />
                        <div className="profile-online-badge" title="Online now"></div>
                      </div>

                      <div className="profile-hero-info">
                        <div className="profile-title-row">
                          <h3 className="profile-user-name">Thomas Anderson</h3>
                          <span className="profile-badge-pro">PRO MEMBER</span>
                        </div>
                        <p className="profile-user-role">
                          Lead UI/UX Designer &amp; Design Systems Architect at Codexr
                        </p>
                        <p className="profile-user-location">📍 Toronto, Ontario, Canada · UTC-4</p>
                      </div>

                      <div className="profile-hero-actions">
                        <button
                          className="profile-primary-btn"
                          onClick={() => {
                            setActiveNav('settings');
                            showToast('Opened settings to edit profile');
                          }}
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Stat Highlights */}
                  <div className="profile-stats-row">
                    <div className="profile-stat-box">
                      <span className="profile-stat-num">24</span>
                      <span className="profile-stat-lbl">Active Projects</span>
                    </div>
                    <div className="profile-stat-box">
                      <span className="profile-stat-num" style={{ color: 'var(--color-lime)' }}>98.4%</span>
                      <span className="profile-stat-lbl">Efficiency Rate</span>
                    </div>
                    <div className="profile-stat-box">
                      <span className="profile-stat-num">1,240h</span>
                      <span className="profile-stat-lbl">Hours Tracked</span>
                    </div>
                    <div className="profile-stat-box">
                      <span className="profile-stat-num" style={{ color: 'var(--color-orange)' }}>14</span>
                      <span className="profile-stat-lbl">Team Members</span>
                    </div>
                  </div>

                  {/* Profile Two Column Body */}
                  <div className="profile-two-col">
                    {/* Left: About & Skills */}
                    <div className="profile-card-sub">
                      <h4 className="profile-section-title">About &amp; Bio</h4>
                      <p className="profile-bio-text">
                        Digital product designer focusing on liquid organic interfaces, Bézier animations,
                        and zero-scroll dashboard experiences. Currently leading the Codexr UI Design System.
                      </p>

                      <h4 className="profile-section-title" style={{ marginTop: '14px' }}>Skills &amp; Expertise</h4>
                      <div className="profile-skills-wrap">
                        {['React 19', 'Liquid SVG', 'Framer Motion', 'Design Tokens', 'Figma', 'Prototyping', 'Tailwind/Vanilla CSS'].map((skill, i) => (
                          <span key={i} className="profile-skill-pill">{skill}</span>
                        ))}
                      </div>

                      <h4 className="profile-section-title" style={{ marginTop: '14px' }}>Connected Accounts</h4>
                      <div className="profile-connections-list">
                        <div className="profile-conn-item">
                          <span>GitHub</span>
                          <span className="conn-status-badge">Connected</span>
                        </div>
                        <div className="profile-conn-item">
                          <span>Figma Workspace</span>
                          <span className="conn-status-badge">Connected</span>
                        </div>
                        <div className="profile-conn-item">
                          <span>Dribbble Portfolio</span>
                          <span className="conn-status-badge">Connected</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Recent Achievements & Work */}
                    <div className="profile-card-sub">
                      <h4 className="profile-section-title">Recent Achievements</h4>
                      <div className="profile-timeline">
                        <div className="timeline-item">
                          <div className="timeline-dot lime"></div>
                          <div className="timeline-info">
                            <span className="timeline-title">Shipped Codexr Liquid Dashboard 2.0</span>
                            <span className="timeline-date">Today at 10:30 AM</span>
                          </div>
                        </div>
                        <div className="timeline-item">
                          <div className="timeline-dot orange"></div>
                          <div className="timeline-info">
                            <span className="timeline-title">Created Bézier Fluid Scoop Sidebar</span>
                            <span className="timeline-date">Yesterday</span>
                          </div>
                        </div>
                        <div className="timeline-item">
                          <div className="timeline-dot purple"></div>
                          <div className="timeline-info">
                            <span className="timeline-title">100vh Zero-Scroll Layout Optimization</span>
                            <span className="timeline-date">3 days ago</span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-tier-banner">
                        <div>
                          <span style={{ fontSize: '11px', color: '#8c919d' }}>Plan Status</span>
                          <h5 style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800 }}>Codexr Enterprise Pro</h5>
                        </div>
                        <button
                          className="profile-upgrade-btn"
                          onClick={() => showToast('Managing subscription plan...')}
                        >
                          Manage Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <motion.div
          className="toast-success"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
        >
          <Check size={16} color="var(--color-lime)" />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </div>
  );
}
