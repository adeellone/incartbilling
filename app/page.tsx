"use client";
import { useEffect, useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:     #05112A;
    --navy2:    #0A1F44;
    --blue:     #1B6FEB;
    --blue2:    #3D8EFF;
    --cyan:     #00D4FF;
    --white:    #F5F8FF;
    --muted:    #8A9CC0;
    --card:     #0D1E3D;
    --border:   rgba(59,130,246,0.15);
    --glow:     rgba(27,111,235,0.3);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--navy);
    color: var(--white);
    overflow-x: hidden;
  }

  .sora { font-family: 'Sora', sans-serif; }

  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 60px;
    backdrop-filter: blur(16px);
    background: rgba(5,17,42,0.85);
    border-bottom: 1px solid var(--border);
    transition: all 0.3s;
  }
  .nav-logo {
    font-family: 'Sora', sans-serif;
    font-size: 22px; font-weight: 800;
    background: linear-gradient(135deg, #fff 0%, var(--cyan) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }
  .nav-logo span { color: var(--blue2); -webkit-text-fill-color: var(--blue2); }
  .nav-links { display: flex; gap: 36px; list-style: none; }
  .nav-links a {
    color: var(--muted); font-size: 14px; font-weight: 500;
    text-decoration: none; transition: color 0.2s; letter-spacing: 0.3px;
  }
  .nav-links a:hover { color: var(--white); }
  .nav-btn {
    background: var(--blue); color: #fff;
    padding: 10px 24px; border-radius: 8px;
    font-size: 14px; font-weight: 600;
    border: none; cursor: pointer; text-decoration: none;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .nav-btn:hover { background: var(--blue2); transform: translateY(-1px); }

  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 80px;
    position: relative; overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(27,111,235,0.25) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,212,255,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 10% 60%, rgba(27,111,235,0.1) 0%, transparent 60%);
  }
  .hero-grid {
    position: absolute; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(27,111,235,0.15);
    border: 1px solid rgba(27,111,235,0.3);
    border-radius: 100px; padding: 6px 16px;
    font-size: 13px; font-weight: 500; color: var(--cyan);
    margin-bottom: 28px; position: relative; z-index: 1;
    animation: fadeUp 0.6s ease both;
  }
  .badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--cyan); box-shadow: 0 0 8px var(--cyan);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.3); }
  }
  .hero h1 {
    font-family: 'Sora', sans-serif;
    font-size: clamp(42px, 7vw, 80px);
    font-weight: 800; line-height: 1.05; letter-spacing: -2px;
    position: relative; z-index: 1;
    animation: fadeUp 0.6s 0.1s ease both; max-width: 900px;
  }
  .hero h1 .grad {
    background: linear-gradient(135deg, var(--blue2) 0%, var(--cyan) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub {
    margin-top: 24px; font-size: clamp(16px, 2vw, 20px);
    color: var(--muted); line-height: 1.7;
    max-width: 580px; position: relative; z-index: 1;
    animation: fadeUp 0.6s 0.2s ease both; font-weight: 400;
  }
  .hero-btns {
    display: flex; gap: 14px; margin-top: 44px;
    position: relative; z-index: 1;
    animation: fadeUp 0.6s 0.3s ease both;
    flex-wrap: wrap; justify-content: center;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--blue) 0%, #0F52C7 100%);
    color: #fff; padding: 15px 36px; border-radius: 10px;
    border: none; cursor: pointer; font-size: 16px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; text-decoration: none;
    box-shadow: 0 8px 32px rgba(27,111,235,0.4); transition: all 0.25s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(27,111,235,0.55); }
  .btn-secondary {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border); color: var(--white);
    padding: 15px 36px; border-radius: 10px; cursor: pointer;
    font-size: 16px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; text-decoration: none;
    transition: all 0.25s; display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1px; background: var(--border);
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  }
  .stat-item { background: var(--navy); padding: 40px 24px; text-align: center; transition: background 0.2s; }
  .stat-item:hover { background: var(--card); }
  .stat-num {
    font-family: 'Sora', sans-serif; font-size: 42px; font-weight: 800;
    background: linear-gradient(135deg, var(--white), var(--blue2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1;
  }
  .stat-label { margin-top: 8px; font-size: 14px; color: var(--muted); font-weight: 500; letter-spacing: 0.3px; }

  .section { padding: 100px 60px; max-width: 1200px; margin: 0 auto; }
  .section-tag {
    display: inline-block; font-size: 12px; font-weight: 600;
    letter-spacing: 2px; text-transform: uppercase;
    color: var(--cyan); margin-bottom: 16px;
  }
  .section-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 800; line-height: 1.1; letter-spacing: -1px;
  }
  .section-sub { margin-top: 16px; font-size: 18px; color: var(--muted); line-height: 1.7; max-width: 560px; font-weight: 400; }

  .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 56px; }
  .service-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 32px; transition: all 0.3s;
    position: relative; overflow: hidden; cursor: default;
  }
  .service-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--blue), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .service-card:hover { border-color: rgba(27,111,235,0.4); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px var(--glow); }
  .service-card:hover::before { opacity: 1; }
  .service-icon {
    width: 52px; height: 52px; border-radius: 12px;
    background: rgba(27,111,235,0.15); border: 1px solid rgba(27,111,235,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 20px;
  }
  .service-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 10px; color: var(--white); }
  .service-desc { font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 400; }

  .steps-wrap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 56px; position: relative; }
  .steps-wrap::before {
    content: ''; position: absolute; top: 32px; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--blue), var(--cyan), var(--blue), transparent);
    z-index: 0;
  }
  .step-item { text-align: center; padding: 0 32px; position: relative; z-index: 1; }
  .step-num {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, var(--blue), #0A3A8F);
    border: 2px solid rgba(27,111,235,0.5);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: var(--white);
    margin: 0 auto 24px; box-shadow: 0 8px 32px rgba(27,111,235,0.35);
  }
  .step-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
  .step-desc { font-size: 14px; color: var(--muted); line-height: 1.7; }

  .spec-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-top: 56px; }
  .spec-item {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 24px 12px; text-align: center; transition: all 0.25s; cursor: default;
  }
  .spec-item:hover { border-color: rgba(27,111,235,0.45); transform: translateY(-3px); background: rgba(27,111,235,0.08); }
  .spec-icon { font-size: 28px; margin-bottom: 10px; }
  .spec-name { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0.3px; }

  .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 56px; }
  .why-card {
    background: linear-gradient(135deg, var(--card), rgba(27,111,235,0.06));
    border: 1px solid var(--border); border-radius: 16px; padding: 36px;
    position: relative; overflow: hidden;
  }
  .why-card::after {
    content: ''; position: absolute; bottom: -30px; right: -30px;
    width: 100px; height: 100px; border-radius: 50%;
    background: radial-gradient(circle, rgba(27,111,235,0.15), transparent);
  }
  .why-num {
    font-family: 'Sora', sans-serif; font-size: 54px; font-weight: 800;
    background: linear-gradient(135deg, var(--blue2), var(--cyan));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    line-height: 1; margin-bottom: 8px;
  }
  .why-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
  .why-desc { font-size: 14px; color: var(--muted); line-height: 1.7; }

  .cta-section {
    margin: 0 60px 100px;
    background: linear-gradient(135deg, rgba(27,111,235,0.2) 0%, rgba(0,212,255,0.08) 100%);
    border: 1px solid rgba(27,111,235,0.25); border-radius: 24px;
    padding: 80px 60px; text-align: center; position: relative; overflow: hidden;
  }
  .cta-section::before {
    content: ''; position: absolute; top: -50%; left: -10%; width: 120%; height: 200%;
    background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(27,111,235,0.12), transparent);
    pointer-events: none;
  }
  .cta-section h2 {
    font-family: 'Sora', sans-serif; font-size: clamp(28px, 4vw, 46px);
    font-weight: 800; letter-spacing: -1px; margin-bottom: 16px; position: relative; z-index: 1;
  }
  .cta-section p { color: var(--muted); font-size: 18px; margin-bottom: 40px; position: relative; z-index: 1; }
  .cta-btns { display: flex; gap: 14px; justify-content: center; position: relative; z-index: 1; flex-wrap: wrap; }

  footer {
    border-top: 1px solid var(--border); padding: 40px 60px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .footer-logo {
    font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 800;
    background: linear-gradient(135deg, #fff, var(--cyan));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .footer-copy { font-size: 13px; color: var(--muted); }
  .footer-links { display: flex; gap: 24px; }
  .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--white); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 900px) {
    .nav { padding: 16px 24px; }
    .nav-links { display: none; }
    .section { padding: 60px 24px; }
    .services-grid { grid-template-columns: 1fr 1fr; }
    .stats { grid-template-columns: repeat(2, 1fr); }
    .spec-grid { grid-template-columns: repeat(3, 1fr); }
    .why-grid { grid-template-columns: 1fr; }
    .steps-wrap { grid-template-columns: 1fr; gap: 32px; }
    .steps-wrap::before { display: none; }
    .cta-section { margin: 0 24px 60px; padding: 60px 32px; }
    footer { flex-direction: column; text-align: center; padding: 32px 24px; }
  }
  @media (max-width: 600px) {
    .services-grid { grid-template-columns: 1fr; }
    .spec-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

interface Service {
  icon: string;
  title: string;
  desc: string;
}

interface Specialty {
  icon: string;
  name: string;
}

interface WhyItem {
  num: string;
  title: string;
  desc: string;
}

interface Step {
  num: string;
  title: string;
  desc: string;
}

interface CountState {
  claims: number;
  providers: number;
  revenue: number;
  rate: number;
}

const SERVICES: Service[] = [
  { icon: "📋", title: "Medical Billing & Coding", desc: "Accurate ICD-10, CPT, and HCPCS coding with AI-assisted suggestions to reduce errors and maximize reimbursements." },
  { icon: "🔄", title: "Claims Submission", desc: "Automated EDI 837 claim generation and submission through major clearinghouses with real-time tracking." },
  { icon: "🚫", title: "Denial Management", desc: "Intelligent denial classification, automated appeal letter generation, and trend analytics to recover lost revenue." },
  { icon: "💰", title: "Revenue Cycle Management", desc: "End-to-end RCM from patient registration to final payment posting with full audit trails." },
  { icon: "✅", title: "Insurance Verification", desc: "Real-time eligibility checks and benefit verification before every appointment or claim submission." },
  { icon: "📊", title: "Reporting & Analytics", desc: "Comprehensive dashboards for AR aging, collection rates, denial trends, and revenue forecasting." },
];

const SPECS: Specialty[] = [
  { icon: "🏥", name: "General Practice" },
  { icon: "🧠", name: "Mental Health" },
  { icon: "🦷", name: "Dental" },
  { icon: "🩻", name: "Radiology" },
  { icon: "🫀", name: "Cardiology" },
  { icon: "🦴", name: "Orthopedics" },
];

const WHY: WhyItem[] = [
  { num: "98%", title: "Clean Claim Rate", desc: "Our automated scrubbing engine catches errors before submission, achieving industry-leading clean claim rates." },
  { num: "40%", title: "Faster Reimbursements", desc: "Automated workflows and real-time claim tracking reduce your average reimbursement cycle significantly." },
  { num: "24/7", title: "Dedicated Support", desc: "Our billing specialists and technical team are available around the clock to resolve issues fast." },
];

const STEPS: Step[] = [
  { num: "01", title: "Onboard Your Practice", desc: "Quick setup with your provider details, payer contracts, and EHR integration in under 24 hours." },
  { num: "02", title: "We Handle the Billing", desc: "Our platform automates coding, claim scrubbing, submission, and follow-up on every claim." },
  { num: "03", title: "You Get Paid Faster", desc: "Track payments in real-time on your dashboard and watch your revenue cycle transform." },
];

export default function Home(): JSX.Element {
  const [count, setCount] = useState<CountState>({ claims: 0, providers: 0, revenue: 0, rate: 0 });

  useEffect(() => {
    const targets: CountState = { claims: 50, providers: 500, revenue: 98, rate: 40 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        claims:    Math.round(targets.claims    * ease),
        providers: Math.round(targets.providers * ease),
        revenue:   Math.round(targets.revenue   * ease),
        rate:      Math.round(targets.rate      * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{STYLES}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">Incart<span>Billing</span></div>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#specialties">Specialties</a></li>
          <li><a href="#about">Why Us</a></li>
        </ul>
        <a href="/login" className="nav-btn">Get Started →</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-badge">
          <span className="badge-dot" />
          Powered by Incart Software
        </div>
        <h1 className="sora">
          Smarter Billing.<br />
          <span className="grad">Faster Revenue.</span>
        </h1>
        <p className="hero-sub">
          All-in-one medical billing and revenue cycle management platform — built for healthcare providers worldwide.
        </p>
        <div className="hero-btns">
          <a href="/register" className="btn-primary">Start Free Trial →</a>
          <a href="#services" className="btn-secondary">See How It Works</a>
        </div>
      </section>

      {/* STATS */}
      <div className="stats">
        <div className="stat-item">
          <div className="stat-num">${count.claims}M+</div>
          <div className="stat-label">Claims Processed</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{count.providers}+</div>
          <div className="stat-label">Providers Served</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{count.revenue}%</div>
          <div className="stat-label">Clean Claim Rate</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{count.rate}%</div>
          <div className="stat-label">Faster Reimbursements</div>
        </div>
      </div>

      {/* SERVICES */}
      <div id="services">
        <div className="section">
          <span className="section-tag">What We Offer</span>
          <h2 className="section-title sora">Everything your practice<br />needs to get paid</h2>
          <p className="section-sub">From claim creation to payment posting — fully automated, fully compliant.</p>
          <div className="services-grid">
            {SERVICES.map((s: Service, i: number) => (
              <div className="service-card" key={i}>
                <div className="service-icon">{s.icon}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ background: "rgba(13,30,61,0.5)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <span className="section-tag">Process</span>
          <h2 className="section-title sora">How Incart Billing works</h2>
          <p className="section-sub">Three simple steps to transform your revenue cycle.</p>
          <div className="steps-wrap">
            {STEPS.map((s: Step, i: number) => (
              <div className="step-item" key={i}>
                <div className="step-num">{s.num}</div>
                <div className="step-title sora">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPECIALTIES */}
      <div id="specialties">
        <div className="section">
          <span className="section-tag">Specialties</span>
          <h2 className="section-title sora">Built for every<br />medical specialty</h2>
          <p className="section-sub">Specialty-specific billing rules, codes, and workflows built in.</p>
          <div className="spec-grid">
            {SPECS.map((s: Specialty, i: number) => (
              <div className="spec-item" key={i}>
                <div className="spec-icon">{s.icon}</div>
                <div className="spec-name">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY US */}
      <div id="about" style={{ background: "rgba(13,30,61,0.5)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <span className="section-tag">Why Incart Billing</span>
          <h2 className="section-title sora">Results that speak<br />for themselves</h2>
          <p className="section-sub">We combine billing expertise with powerful automation to deliver real outcomes.</p>
          <div className="why-grid">
            {WHY.map((w: WhyItem, i: number) => (
              <div className="why-card" key={i}>
                <div className="why-num">{w.num}</div>
                <div className="why-title sora">{w.title}</div>
                <div className="why-desc">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2 className="sora">Ready to optimize your<br />revenue cycle?</h2>
        <p>Join hundreds of providers already using Incart Billing.</p>
        <div className="cta-btns">
          <a href="/register" className="btn-primary">Start Free Trial →</a>
          <a href="/contact" className="btn-secondary">Schedule a Demo</a>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">IncartBilling</div>
        <div className="footer-copy">© 2025 Incart Billing. Powered by Incart Software. All rights reserved.</div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">HIPAA</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  );
}
