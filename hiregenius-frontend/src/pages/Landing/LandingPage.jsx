import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, CheckCircle2, FileSearch, BrainCircuit,
  Users, BarChart3, Upload, Cpu, MessageSquare, Trophy,
  Zap, Shield, TrendingUp, Star, ChevronDown, ChevronUp,
  Globe, ExternalLink, Mail,
} from 'lucide-react';
import LandingNavbar from '../../components/Navbar/LandingNavbar';
import GradientButton from '../../components/GradientButton/GradientButton';
import GlassCard from '../../components/GlassCard/GlassCard';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import AnimatedCounter from '../../components/AnimatedCounter/AnimatedCounter';

const fade = { hidden:{opacity:0,y:28}, visible:{opacity:1,y:0,transition:{duration:0.5,ease:[0.22,1,0.36,1]}} };
const stagger = { hidden:{}, visible:{transition:{staggerChildren:0.09,delayChildren:0.12}} };
const reveal = { hidden:{opacity:0,y:32}, visible:{opacity:1,y:0,transition:{duration:0.45,ease:[0.22,1,0.36,1]}} };

const DEMO_CARDS = [
  { role:'Senior Frontend Engineer', company:'TechCorp', desc:'React & TypeScript specialist needed for product team.', tags:['React','TypeScript'], score:'Match: High', time:'~8s scoring' },
  { role:'ML Engineer', company:'DataVenture', desc:'Build and deploy machine learning pipelines at scale.', tags:['Python','PyTorch'], score:'Match: High', time:'~10s scoring' },
  { role:'Product Manager', company:'GrowthCo', desc:'Lead roadmap for B2B SaaS product with 10k+ users.', tags:['Roadmap','Analytics'], score:'Match: Medium', time:'~9s scoring' },
];

const HOW_IT_WORKS = [
  { icon:Upload,       step:'01', title:'Post a Job',             desc:'Create a job posting with required skills, experience, and role details. Our AI understands natural language JDs out of the box.' },
  { icon:Cpu,          step:'02', title:'AI Screens Resumes',     desc:'Every uploaded resume is parsed, scored, and matched against your job in under 10 seconds — no manual reading required.' },
  { icon:MessageSquare,step:'03', title:'AI Conducts Interviews', desc:'Role-specific questions are auto-generated. Candidates answer in-platform and the AI evaluates depth, clarity, and confidence.' },
  { icon:Trophy,       step:'04', title:'Get Ranked Shortlist',   desc:'Our Ranking Agent uses RAG over your candidate pool to surface the best fits with full explainability — not just scores.' },
];

const FEATURE_CATS = [
  { icon:FileSearch,  title:'Resume Screening', desc:'Upload PDF or DOCX resumes and receive an AI-generated score, skills gap analysis, and clear recommendation within seconds.', tags:['Skills Match','Gap Analysis','Recommendation','PDF/DOCX'] },
  { icon:BrainCircuit,title:'AI Interview',      desc:'Automatically generate role-specific interview questions and have the AI evaluate candidate responses for technical and communication quality.', tags:['Auto Q&A','Communication Score','Tech Depth','Confidence'] },
  { icon:Users,       title:'Candidate Ranking', desc:'Use RAG-powered ranking to surface your best candidates from the full applicant pool with detailed explanatory reasoning.', tags:['RAG Ranking','Top-N','Explainability','Batch'] },
  { icon:BarChart3,   title:'Analytics',         desc:'Track hiring trends, score distributions, and interview success rates across all your open roles in one real-time dashboard.', tags:['Trend Charts','Score Dist.','Success Rate','Export'] },
];

const BENEFITS = [
  { icon:Zap,       title:'Screen 10x Faster',       desc:'What once took a recruiter 3 days of reading now takes HireGenius AI under 30 minutes for 100 resumes. Reclaim your week.', tags:['Speed','Automation'] },
  { icon:Shield,    title:'Reduce Bias',              desc:'Objective AI scoring runs alongside human review so every candidate is evaluated on skills and experience — not subjective impressions.', tags:['Fair Hiring','Objective Scores'] },
  { icon:TrendingUp,title:'Actionable Insights',      desc:'From score distributions to skill gap trends, our analytics help you refine job descriptions and improve hiring quality over time.', tags:['Analytics','Continuous Improvement'] },
];

const CROSS_SELL = [
  { icon:BarChart3,   title:'Analytics Dashboard', desc:'Visualise hiring trends, score distributions, and team performance in one live dashboard.', href:'#features' },
  { icon:Globe,       title:'Interview Scheduler',  desc:'Calendar-based scheduling with automated candidate notifications and meeting link generation.', href:'#features' },
  { icon:BrainCircuit,title:'AI Interview Suite',   desc:'Auto-generate role-specific Q&A sets and evaluate answers at scale — no interviewer required.', href:'#features' },
];

const TRUSTED_LOGOS = ['Velocity', 'Nexus', 'Helix', 'Orion', 'Prism', 'Apex'];

const FAQS = [
  { q:'How accurate is the AI resume scoring?', a:'Our scoring model evaluates skills match, experience level, and keyword alignment against your job description. In internal testing across 50,000+ resumes, it achieved 91% agreement with senior recruiter decisions on shortlisting.' },
  { q:'What file types are supported for resume upload?', a:'We support PDF and DOCX formats. Our parser handles a wide variety of resume layouts including multi-column, table-based, and creative formats.' },
  { q:'Can I customise the AI interview questions?', a:'Yes. By default, the AI generates role-specific questions from your JD. You can also add mandatory questions, adjust difficulty, and set a question count before triggering the interview.' },
  { q:'How does the candidate ranking work?', a:'Our Ranking Agent uses Retrieval-Augmented Generation (RAG) over your entire applicant pool. It retrieves the most relevant candidate profiles against the JD and ranks them with a natural language explanation for each placement.' },
  { q:'Is candidate data kept private?', a:'All resume data is stored with AES-256 encryption at rest. Data is scoped per organisation and never used to train shared models without explicit opt-in.' },
  { q:'How long does a full AI screening cycle take?', a:'Resume scoring takes under 10 seconds per resume. An AI interview evaluation returns results within 30 seconds of submission. End-to-end from upload to ranked shortlist can be completed in under an hour for 50 candidates.' },
  { q:'Do candidates know they are being evaluated by AI?', a:'Yes. Our platform surfaces a clear disclosure to candidates before they begin any AI-evaluated interview, in compliance with emerging AI transparency standards.' },
  { q:'Is there a free plan?', a:'HireGenius AI offers a free tier that includes up to 10 resume screenings and 3 AI interview evaluations per month, with no credit card required to start.' },
];

const FOOTER_LINKS = {
  Product: ['Resume Screening','AI Interview','Candidate Ranking','Analytics','Interview Scheduler','Changelog'],
  Company:  ['About Us','Blog','Careers','Press','Partners'],
  Legal:    ['Privacy Policy','Terms of Service','Security','Cookie Policy'],
};

const sec = { maxWidth:1280, margin:'0 auto', padding:'120px 40px' };

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  return (
    <div style={{ backgroundColor:'var(--bg-base)', color:'var(--text-primary)', overflowX:'hidden' }}>
      <LandingNavbar />

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'160px 24px 100px', position:'relative', overflow:'hidden' }}>
        <div className="hero-glow" style={{ top:'-15%', left:'50%', transform:'translateX(-50%)' }} aria-hidden />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)', bottom:'10%', right:'8%', pointerEvents:'none' }} aria-hidden />
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:1 }}>

          {/* Pill badge */}
          <motion.div variants={fade}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:999, marginBottom:28, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', fontSize:13, fontWeight:600, color:'var(--primary)' }}>
              <Sparkles size={13} /> AI-Powered Recruitment Platform
            </div>
          </motion.div>

          <motion.h1 variants={fade} className="hero-heading" style={{ maxWidth:820, marginBottom:24 }}>
            Hire smarter with{' '}<span className="gradient-text">AI agents</span>{' '}that screen,<br />interview &amp; rank.
          </motion.h1>

          <motion.p variants={fade} style={{ fontSize:18, lineHeight:1.7, color:'var(--text-secondary)', maxWidth:560, marginBottom:40 }}>
            Post a job, let AI score every resume in under 10 seconds, auto-generate interviews, and surface your top candidates — all in one platform.
          </motion.p>

          <motion.div variants={fade} style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:56 }}>
            <GradientButton to="/register" size="lg" id="hero-cta">
              Start Screening Free <ArrowRight size={16} />
            </GradientButton>
            <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
              <Link to="/login" id="hero-login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 30px', borderRadius:'var(--radius-btn)', fontSize:15, fontWeight:600, color:'var(--text-primary)', border:'1px solid var(--border)', textDecoration:'none', background:'var(--bg-surface)' }}>
                Sign in <ArrowRight size={15} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero visual — mock dashboard card with floating overlay */}
          <motion.div variants={fade} style={{ position:'relative', width:'100%', maxWidth:860 }}>
            {/* Main dashboard mock */}
            <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:24, boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,var(--gradient-start),var(--gradient-end))', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={13} color="#fff" /></div>
                <span style={{ fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>HireGenius AI — Resume Screening Dashboard</span>
                <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                  {['#EF4444','#F59E0B','#22C55E'].map(c => <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }} />)}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                {[['Resumes Processed','1,248','↑ 23% this week'],['Avg. Match Score','78%','↑ 5pts vs last batch'],['Shortlisted','94','Top candidates']].map(([label,val,sub]) => (
                  <div key={label} style={{ background:'var(--bg-surface)', borderRadius:12, padding:16, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{val}</div>
                    <div style={{ fontSize:11, color:'var(--success)' }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--bg-surface)', borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                {[['Ava Chen','Senior Frontend Eng','React, TypeScript, Next.js',96,'Highly Recommended','#6366F1'],['Marcus Lee','ML Engineer','Python, PyTorch, AWS',88,'Highly Recommended','#22D3EE'],['Priya Mehta','Product Manager','Roadmap, Agile, SQL',74,'Consider','#22C55E']].map(([name,role,skills,score,rec,color],i) => (
                  <div key={name} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 16px', borderBottom: i<2 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff', flexShrink:0 }}>{name[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{role} · {skills}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:18, fontWeight:700, color: score>=90?'var(--success)':score>=75?'var(--primary)':'var(--warning)' }}>{score}%</div>
                      <div style={{ fontSize:10, color: score>=90?'var(--success)':score>=75?'var(--primary)':'var(--warning)', fontWeight:600 }}>{rec}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating overlay card */}
            <motion.div
              initial={{ opacity:0, x:40, y:-20 }} animate={{ opacity:1, x:0, y:0 }}
              transition={{ delay:0.6, duration:0.5, ease:[0.22,1,0.36,1] }}
              style={{ position:'absolute', top:-24, right:-32, background:'var(--bg-elevated)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:16, padding:'16px 20px', boxShadow:'0 12px 40px rgba(99,102,241,0.25)', backdropFilter:'blur(16px)', minWidth:180 }}
            >
              <div style={{ fontSize:11, fontWeight:600, color:'var(--secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>AI Resume Score</div>
              <div style={{ fontSize:32, fontWeight:800, background:'linear-gradient(135deg,var(--gradient-start),var(--gradient-end))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>92%</div>
              <div style={{ fontSize:12, color:'var(--success)', fontWeight:600, marginTop:4 }}>✓ Highly Recommended</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Scored in 8.2 seconds</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* DEMO CARDS ROW */}
      <section style={{ background:'var(--bg-surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={sec}>
          <SectionHeading eyebrow="Live Previews" title="See HireGenius AI in action" gradientWord="in action" subtitle="Three sample roles — showing what AI-powered screening looks like for real job types." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {DEMO_CARDS.map(({role,company,desc,tags,score,time},i) => (
              <motion.div key={role} initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.45,delay:i*0.1,ease:[0.22,1,0.36,1]}} whileHover={{y:-6,transition:{duration:0.2}}} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:28, cursor:'pointer', transition:'border-color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{company}</div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:10, lineHeight:1.3 }}>{role}</h3>
                <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:16 }}>{desc}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                  {tags.map(t => <span key={t} style={{ fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:999, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'var(--primary)' }}>{t}</span>)}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{time} · {score}</span>
                  <a href="/register" style={{ fontSize:13, fontWeight:600, color:'var(--primary)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>Start Demo <ArrowRight size={12} /></a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works">
        <div style={sec}>
          <SectionHeading eyebrow="How It Works" title="From job post to ranked shortlist" gradientWord="ranked shortlist" subtitle="Four intelligent steps — automated by multi-agent AI, with humans in the loop at every decision point." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24, position:'relative' }}>
            <div style={{ position:'absolute', top:36, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,var(--border),transparent)', zIndex:0 }} aria-hidden />
            {HOW_IT_WORKS.map(({icon:Icon,step,title,desc},i) => (
              <motion.div key={step} initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.45,delay:i*0.1,ease:[0.22,1,0.36,1]}} style={{ textAlign:'center', position:'relative', zIndex:1 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px', background:'linear-gradient(135deg,var(--gradient-start),var(--gradient-end))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(99,102,241,0.3)' }}>
                  <Icon size={28} color="#fff" />
                </div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'var(--primary)', marginBottom:8, textTransform:'uppercase' }}>Step {step}</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:10 }}>{title}</h3>
                <p style={{ fontSize:14, lineHeight:1.7, color:'var(--text-secondary)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE CATEGORY CARDS */}
      <section id="features" style={{ background:'var(--bg-surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={sec}>
          <SectionHeading eyebrow="Platform Modules" title="Everything your hiring team needs" gradientWord="hiring team" subtitle="One platform — from resume to hire decision — powered by multi-agent AI." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {FEATURE_CATS.map(({icon:Icon,title,desc,tags},i) => (
              <GlassCard key={title} delay={i*0.08}>
                <div style={{ width:52, height:52, borderRadius:'var(--radius-icon)', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <Icon size={24} style={{ color:'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:10 }}>{title}</h3>
                <p style={{ fontSize:14, lineHeight:1.7, color:'var(--text-secondary)', marginBottom:20 }}>{desc}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {tags.map(t => <span key={t} style={{ fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:999, background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>{t}</span>)}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAND */}
      <section style={{ background:'var(--bg-elevated)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', overflow:'hidden' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'64px 40px' }}>
          <p style={{ textAlign:'center', fontSize:15, fontWeight:600, color:'var(--text-secondary)', marginBottom:40 }}>
            Trusted by recruitment teams managing <span style={{ color:'var(--text-primary)' }}>50,000+ applications</span>
          </p>
          <div style={{ position:'relative', overflow:'hidden' }}>
            <motion.div
              animate={{ x:[0,-720] }} transition={{ repeat:Infinity, duration:22, ease:'linear' }}
              style={{ display:'flex', gap:40, width:'max-content' }}
            >
              {[...TRUSTED_LOGOS,...TRUSTED_LOGOS,...TRUSTED_LOGOS].map((name,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'center', minWidth:120, height:48, borderRadius:12, background:'var(--bg-surface)', border:'1px solid var(--border)', padding:'0 20px' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.04em' }}>{name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background:'var(--bg-base)' }}>
        <div style={{ ...sec, padding:'80px 40px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:48 }}>
            {[{value:10,suffix:'x',label:'Faster resume screening'},{value:98,suffix:'%',label:'Recruiter satisfaction'},{value:60,suffix:'%',label:'Reduction in time-to-hire'},{value:500,suffix:'+',label:'Hiring teams onboarded'}].map(({value,suffix,label}) => (
              <AnimatedCounter key={label} value={value} suffix={suffix} label={label} />
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" style={{ background:'var(--bg-surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={sec}>
          <SectionHeading eyebrow="Why HireGenius AI" title="Built for modern recruiting teams" gradientWord="modern recruiting" subtitle="Practical benefits that translate directly into faster, fairer, and smarter hiring decisions." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {BENEFITS.map(({icon:Icon,title,desc,tags},i) => (
              <motion.div key={title} initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.45,delay:i*0.1,ease:[0.22,1,0.36,1]}} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:32 }}>
                <div style={{ width:52, height:52, borderRadius:'var(--radius-icon)', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <Icon size={24} style={{ color:'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize:20, fontWeight:600, color:'var(--text-primary)', marginBottom:12 }}>{title}</h3>
                <p style={{ fontSize:14, lineHeight:1.7, color:'var(--text-secondary)', marginBottom:20 }}>{desc}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {tags.map(t => <span key={t} style={{ fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:999, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.18)', color:'var(--primary)' }}>{t}</span>)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CROSS-SELL */}
      <section>
        <div style={sec}>
          <SectionHeading eyebrow="Explore Platform" title="More tools inside HireGenius AI" gradientWord="HireGenius AI" subtitle="Every module is built to work together — one platform, end to end." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {CROSS_SELL.map(({icon:Icon,title,desc,href},i) => (
              <motion.a key={title} href={href} initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.45,delay:i*0.1,ease:[0.22,1,0.36,1]}} whileHover={{y:-6,transition:{duration:0.2}}} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, padding:28, textDecoration:'none', display:'block', cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{ width:48, height:48, borderRadius:12, background:'rgba(34,211,238,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <Icon size={22} style={{ color:'var(--secondary)' }} />
                </div>
                <h3 style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)', marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:12 }}>{desc}</p>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--secondary)', display:'inline-flex', alignItems:'center', gap:4 }}>Explore <ArrowRight size={12} /></span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}
      <section style={{ background:'var(--bg-surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ ...sec, maxWidth:860 }}>
          <SectionHeading eyebrow="About HireGenius AI" title="Rethinking how companies hire" gradientWord="how companies hire" />
          <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
            {[
              ['Why AI-assisted recruitment matters','Traditional hiring is bottlenecked by the sheer volume of applications. A single job posting can attract hundreds of resumes, and manually reviewing each one introduces both delays and unconscious bias. HireGenius AI replaces this bottleneck with a multi-agent system that reads, scores, and ranks every resume against your specific job description — delivering consistent, explainable results in seconds rather than days.'],
              ['More than a keyword filter','Unlike legacy ATS keyword matching, HireGenius AI understands context. Our scoring engine evaluates skills depth, experience relevance, and qualifications alignment holistically. The result is a score that reflects genuine candidate fit — not just whether certain words appear on the page. This means fewer false negatives, fewer overlooked candidates, and a shortlist you can trust.'],
              ['AI interviews that scale your process','The hardest part of scaling hiring isn\'t screening — it\'s the time cost of first-round interviews. HireGenius AI generates role-specific interview question sets from your job description and evaluates candidate responses for technical quality, communication clarity, and confidence. Your team gets a structured evaluation report for every candidate, ready for the human review that actually matters.'],
            ].map(([heading,body]) => (
              <motion.div key={heading} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}}>
                <h3 style={{ fontSize:20, fontWeight:600, color:'var(--text-primary)', marginBottom:12 }}>{heading}</h3>
                <p style={{ fontSize:15, lineHeight:1.8, color:'var(--text-secondary)' }}>{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div style={{ ...sec, maxWidth:860 }}>
          <SectionHeading eyebrow="FAQ" title="Questions about HireGenius AI" gradientWord="HireGenius AI" subtitle="Everything you need to know before getting started." />
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {FAQS.map(({q,a},i) => (
              <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-40px'}} transition={{duration:0.35,delay:i*0.04,ease:[0.22,1,0.36,1]}}>
                <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'20px 24px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', lineHeight:1.4 }}>{q}</span>
                    <span style={{ flexShrink:0, color:'var(--text-muted)' }}>{openFaq===i ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq===i && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.22,1,0.36,1]}} style={{overflow:'hidden'}}>
                        <div style={{ padding:'0 24px 20px', fontSize:14, lineHeight:1.8, color:'var(--text-secondary)' }}>{a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:'120px 24px', background:'var(--bg-surface)', borderTop:'1px solid var(--border)' }}>
        <motion.div initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{ maxWidth:760, margin:'0 auto', textAlign:'center', padding:'64px 48px', borderRadius:24, background:'var(--bg-elevated)', border:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,var(--gradient-start),var(--gradient-end))' }} />
          <div style={{ position:'absolute', top:'-40%', left:'50%', transform:'translateX(-50%)', width:400, height:300, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(99,102,241,0.1),transparent 70%)', pointerEvents:'none' }} aria-hidden />
          <h2 className="section-heading" style={{ color:'var(--text-primary)', marginBottom:16, position:'relative' }}>Ready to <span className="gradient-text">hire smarter?</span></h2>
          <p style={{ fontSize:16, color:'var(--text-secondary)', marginBottom:40, lineHeight:1.7, position:'relative' }}>Join hundreds of recruiting teams who have cut their time-to-hire by 60%. No credit card required.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', position:'relative' }}>
            <GradientButton to="/register" size="lg" id="cta-register">Create free account <ArrowRight size={16}/></GradientButton>
            <motion.div whileHover={{scale:1.02}} whileTap={{scale:0.98}}>
              <Link to="/login" id="cta-login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 30px', borderRadius:'var(--radius-btn)', fontSize:15, fontWeight:600, color:'var(--text-primary)', border:'1px solid var(--border)', textDecoration:'none' }}>Sign in</Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid var(--border)', background:'var(--bg-base)', padding:'64px 40px 40px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:48, marginBottom:64 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,var(--gradient-start),var(--gradient-end))', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={14} color="#fff"/></div>
                <span style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>HireGenius AI</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, maxWidth:200 }}>AI-powered recruitment platform for modern hiring teams.</p>
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                {[[Globe,'Website'],[ExternalLink,'LinkedIn'],[ExternalLink,'GitHub'],[Mail,'Email']].map(([Icon,label]) => (
                  <a key={label} href="#" aria-label={label} style={{ width:34, height:34, borderRadius:8, background:'var(--bg-surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', textDecoration:'none', transition:'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><Icon size={15}/></a>
                ))}
              </div>
            </div>
            {Object.entries(FOOTER_LINKS).map(([group,links]) => (
              <div key={group}>
                <h4 style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:16, letterSpacing:'0.08em', textTransform:'uppercase' }}>{group}</h4>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                  {links.map(link => (
                    <li key={link}><a href="#" style={{ fontSize:14, color:'var(--text-muted)', textDecoration:'none', transition:'color 0.15s' }} onMouseEnter={e=>e.target.style.color='var(--text-primary)'} onMouseLeave={e=>e.target.style.color='var(--text-muted)'}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>© {new Date().getFullYear()} HireGenius AI — Built for portfolio &amp; placement.</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
