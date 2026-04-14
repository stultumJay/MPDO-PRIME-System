import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, BarChart3, Users, FileText, ArrowRight, Lock, TrendingUp, 
  LayoutDashboard, MapPin, ClipboardList, DollarSign 
} from 'lucide-react';
import LoginModal from '../components/LoginModal';
import logo from '../assets/mpdo-logo.jpg';
import hero_1 from '../assets/placeholder_1.jpg';
import hero_2 from '../assets/placeholder_3.jpg';
import hero_3 from '../assets/placeholder_2.jpg';


export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { title: "Monitor Project", desc: "Real-time oversight of all municipal projects with visual status categorization and comprehensive tracking.", icon: LayoutDashboard },
    { title: "Issue Logs", desc: "Record and track bottlenecks, weather delays, or material shortages with corrective action repositories..", icon: ClipboardList },
    { title: "Physical Progress", desc: "Track infrastructure completion percentages.", icon: TrendingUp },
    { title: "Financial Tracking", desc: "Monitor budget utilization, allotment releases, obligations, and actual disbursements in real-time.", icon: DollarSign },
    { title: "Document Tracking", desc: "Automatic linking of project records to official tracking IDs and physical document trails.", icon: FileText },
    { title: "Locational Monitoring", desc: "GIS-based monitoring and geo-tagged updates ensure projects are implemented in their intended locations.", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-accent selection:text-white">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md py-4 border-b border-slate-200' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="MPDO Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight uppercase">Alubijid <span className="text-accent">PRIME</span></span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-accent">Features</a>
            <a href="#mission" className="hover:text-accent">Mission</a>
            <a href="#stakeholders" className="hover:text-accent">Stakeholders</a>
          </div>
          <button onClick={() => setIsLoginModalOpen(true)} className="px-5 py-2 bg-accent text-white text-sm font-bold rounded flex items-center gap-2">
            <Lock className="w-4 h-4" /> Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 flex flex-col items-center overflow-hidden bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-[0.9]">
              MPDO Project <br /> <span className="text-accent">Monitoring</span> System
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"> A centralized, cloud-based platform designed to modernize project tracking, strengthen transparency, and support evidence-based planning for the Municipal Planning and Development Office. </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setIsLoginModalOpen(true)} className="btn-primary">Get Started <ArrowRight className="w-4 h-4" /></button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary">Explore Features</button>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual - Updated with Image Placeholders */}
        <div className="mt-20 w-full max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <img src={hero_1} alt="Visual 1" className="rounded-2xl shadow-lg h-64 w-full object-cover animate-fade-in-up" />
            <img src={hero_2} alt="Visual 2" className="rounded-2xl shadow-lg h-64 w-full object-cover animate-fade-in-up [animation-delay:200ms]" />
            <img src={hero_3} alt="Visual 3" className="rounded-2xl shadow-lg h-64 w-full object-cover animate-fade-in-up [animation-delay:400ms]" />
          </div>
        </div>
      </section>

      {/* Features - Updated to 2 Rows, 3 Columns */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-accent font-bold text-sm uppercase tracking-widest mb-4">Features</h2>
            <h3 className="text-4xl font-bold text-slate-900">System Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="feature-card group">
                <div className="icon-box"><f.icon className="w-6 h-6" /></div>
                <h4 className="text-xl font-bold mb-3">{f.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Mission & Vision Section */}
      <section id="mission" className="py-24 border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-accent font-bold text-sm uppercase tracking-widest mb-6">Our Mission</h3>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed italic text-slate-800">
                "To develop a God-fearing and family-centered citizenry, highly motivated and empowered for their participation on local affairs with committed civil servants to attain a self-reliant community."
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-accent font-bold text-sm uppercase tracking-widest mb-6">Our Vision</h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Alubijid is a watershed cradle and center of education for West Misamis Oriental, provider of airport and commercial related services, an agri-industrial community with diversified, high yielding farms... inspired by a concerned, responsible and dynamic government.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="stakeholders" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-accent font-bold text-sm uppercase tracking-widest mb-4">Stakeholders</h2>
            <h3 className="text-4xl font-bold text-slate-900">Value for Everyone</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                role: "For the LCE", 
                title: "Mayor / Governor", 
                benefit: "Ensures that the executive branch's vision is properly funded and implemented.",
                icon: Shield
              },
              { 
                role: "For the Sanggunian", 
                title: "Local Council", 
                benefit: "Provides accurate data to evaluate budget proposals and exercise their oversight function.",
                icon: BarChart3
              },
              { 
                role: "For the Public", 
                title: "Citizens & CSOs", 
                benefit: "Develops trust in government by providing verified, timely access to data and reducing potential corruption.",
                icon: Users
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center group"
              >
                {/* Using the updated icon-box class from index.css */}
                <div className="icon-box w-20 h-20 mx-auto rounded-full shadow-lg shadow-accent/5">
                  <item.icon className="w-10 h-10" />
                </div>
                <div className="text-accent font-bold text-sm mb-1 uppercase tracking-widest">{item.role}</div>
                <h4 className="text-2xl font-bold mb-4 text-slate-900">{item.title}</h4>
                <p className="text-slate-600 leading-relaxed">{item.benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="MPDO Logo" 
              className="w-6 h-6 object-contain"
            />            
            <span className="font-bold tracking-tight uppercase text-slate-900">
              Alubijid <span className="text-accent">PRIME</span>
            </span>
          </div>
          
          <p className="text-slate-400 text-xs text-center md:text-left">
            © {new Date().getFullYear()} LGU Alubijid MPDO. <br className="md:hidden" />
            Corner Rizal & Balacuit Streets, Poblacion, Alubijid, Misamis Oriental.
          </p>
          
          <div className="flex gap-6 text-slate-400 text-xs font-medium">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}