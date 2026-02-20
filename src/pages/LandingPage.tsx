import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Satellite, Brain, Bell, Shield, ChevronDown, Play,
  ArrowRight, Mail, Phone, MapPin, Github, Linkedin, Twitter,
  Globe, Zap, Eye, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Animated counter ─── */
function Counter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Particle field (canvas) ─── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${p.o})`;
        ctx.fill();
      });
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16,185,129,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─── Grid overlay ─── */
function ScanGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ─── Feature card ─── */
const features = [
  { icon: Satellite, title: 'Real-Time Satellite Data', desc: 'Continuous monitoring using Sentinel-2 satellite imagery with 10m resolution covering vast terrain.', color: 'text-cyan' },
  { icon: Brain, title: 'Advanced AI Analysis', desc: 'Deep learning models trained on 10,000+ images detect mining activity with 94% accuracy.', color: 'text-primary' },
  { icon: Bell, title: 'Immediate Notifications', desc: 'Get real-time alerts when new illegal mining activity is detected in monitored zones.', color: 'text-accent' },
  { icon: Shield, title: 'Automated Reporting', desc: 'Generate court-ready reports with GPS evidence, satellite imagery, and AI analysis.', color: 'text-cyan' },
];

/* ─── Stats for hero ─── */
const heroStats = [
  { value: 1247, suffix: '+', label: 'Detections' },
  { value: 89, suffix: '', label: 'Critical Alerts' },
  { value: 24, suffix: '/7', label: 'Monitoring' },
  { value: 94, suffix: '%', label: 'Accuracy' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function LandingPage() {
  const navigate = useNavigate();
  const featRef = useRef(null);
  const featInView = useInView(featRef, { once: true, margin: '-80px' });
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.95]);

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <motion.header
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40"
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <Satellite className="w-6 h-6 text-cyan" />
            <span className="text-cyan">SAT</span><span className="text-primary">GUARD</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Technology</a>
            <a href="#cta" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <Button size="sm" className="hidden sm:flex gap-2 shadow-lg shadow-primary/20" onClick={() => navigate('/dashboard')}>
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      {/* ── HERO ── */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-screen flex items-center justify-center pt-16">
        <ParticleField />
        <ScanGrid />
        {/* radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary mb-8">
              <Globe className="w-4 h-4" /> AI-Powered Earth Protection
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
          >
            Detecting Illegal Mining{' '}
            <span className="bg-gradient-to-r from-cyan to-primary bg-clip-text text-transparent">from Space</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          >
            SATGUARD combines cutting-edge artificial intelligence with real-time satellite imagery to detect, monitor, and prevent illegal mining activities before irreversible damage occurs.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button size="lg" className="text-base px-8 shadow-xl shadow-primary/25 animate-pulse-glow" onClick={() => navigate('/dashboard')}>
              Launch Dashboard <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2 border-border/60">
              <Play className="w-4 h-4" /> Watch Demo
            </Button>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
          >
            {heroStats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  <Counter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-32 px-6" ref={featRef}>
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" variants={stagger} initial="hidden" animate={featInView ? 'visible' : 'hidden'}>
            <motion.p variants={fadeUp} className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How It Works</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold">Advanced Technology Protecting Our Planet</motion.h2>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={stagger} initial="hidden" animate={featInView ? 'visible' : 'hidden'}>
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group glass-card p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS STEPS ── */}
      <section id="stats" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Pipeline</p>
            <h2 className="text-3xl sm:text-4xl font-bold">From Satellite to Courtroom</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Satellite, step: '01', title: 'Capture', desc: 'Sentinel-2 satellites scan target regions every 5 days' },
              { icon: Eye, step: '02', title: 'Analyze', desc: 'AI models process multispectral imagery in real-time' },
              { icon: Zap, step: '03', title: 'Alert', desc: 'Instant notifications sent to authorities and stakeholders' },
              { icon: FileText, step: '04', title: 'Report', desc: 'Auto-generated legal reports with evidence packages' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary mb-1">{s.step}</span>
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-background to-cyan/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">Ready to Protect Your Region?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join 124 districts already using SATGUARD to combat illegal mining.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 shadow-lg shadow-primary/25">Request Demo</Button>
            <Button size="lg" variant="outline" className="text-base px-8">Contact Sales</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free trial for government agencies</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 text-lg font-extrabold mb-3">
              <Satellite className="w-5 h-5 text-cyan" />
              <span className="text-cyan">SAT</span><span className="text-primary">GUARD</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">AI-powered satellite analysis protecting Earth's resources from illegal mining.</p>
            <div className="flex gap-3 text-muted-foreground">
              <Linkedin className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
              <Github className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
            </div>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Documentation', 'API Access'] },
            { title: 'Resources', links: ['Case Studies', 'Blog', 'Research Papers', 'FAQs'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => <li key={l} className="hover:text-foreground cursor-pointer transition-colors">{l}</li>)}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@satguard.ai</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1800-XXX-XXXX</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> New Delhi, India</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>© 2024 SATGUARD. All rights reserved.</p>
          <p>Powered by AI & Satellite Technology</p>
        </div>
      </footer>
    </div>
  );
}
