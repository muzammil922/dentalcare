import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  Shield, 
  Zap, 
  CheckCircle,
  Star,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  Heart,
  Award,
  Globe,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Website() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isContactModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isContactModalOpen])
  const navigate = useNavigate()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignIn = () => {
    navigate('/login')
  }

  const features = [
    {
      icon: Users,
      title: "Patient Management",
      description: "Complete patient records with medical history, treatments, and appointments all in one place.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated appointment booking with real-time availability and intelligent reminders.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: FileText,
      title: "Digital Records",
      description: "Paperless documentation with secure cloud storage and instant access to patient files.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive insights into clinic performance, revenue, and patient trends.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with HIPAA compliance and data protection.",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Live synchronization across all devices with instant notifications and updates.",
      color: "from-cyan-500 to-cyan-600"
    }
  ]

  const stats = [
    { number: "10,000+", label: "Happy Patients" },
    { number: "500+", label: "Dental Clinics" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      clinic: "Bright Smile Dental",
      location: "New York, USA",
      rating: 5,
      text: "myDashy Pro completely revolutionized our clinic operations. Patient management is now effortless and our efficiency has increased by 40%. The automated scheduling system is a game-changer!",
      image: "👩‍⚕️",
      specialty: "General Dentistry"
    },
    {
      name: "Dr. Ahmed Hassan",
      clinic: "Family Dental Care",
      location: "Karachi, Pakistan",
      rating: 5,
      text: "The appointment scheduling system is incredible. Our patients love the automated reminders and we've reduced no-shows by 60%. The billing integration saves us hours every week.",
      image: "👨‍⚕️",
      specialty: "Pediatric Dentistry"
    },
    {
      name: "Dr. Maria Rodriguez",
      clinic: "Cosmetic Dentistry Plus",
      location: "Los Angeles, USA",
      rating: 5,
      text: "From patient records to billing, everything is streamlined. The reporting features help us make better business decisions. Our revenue has increased by 25% since implementation.",
      image: "👩‍⚕️",
      specialty: "Cosmetic Dentistry"
    },
    {
      name: "Dr. James Wilson",
      clinic: "Orthodontic Solutions",
      location: "London, UK",
      rating: 5,
      text: "The inventory management feature is outstanding. We never run out of supplies anymore, and the treatment planning tools have improved our patient outcomes significantly.",
      image: "👨‍⚕️",
      specialty: "Orthodontics"
    },
    {
      name: "Dr. Fatima Al-Zahra",
      clinic: "Modern Dental Clinic",
      location: "Dubai, UAE",
      rating: 5,
      text: "myDashy Pro's multi-language support is perfect for our diverse patient base. The staff management features have made our team more productive and organized.",
      image: "👩‍⚕️",
      specialty: "Oral Surgery"
    },
    {
      name: "Dr. Michael Chen",
      clinic: "Advanced Dental Care",
      location: "Toronto, Canada",
      rating: 5,
      text: "The integration with our existing systems was seamless. The analytics dashboard gives us insights we never had before. Highly recommended for any dental practice!",
      image: "👨‍⚕️",
      specialty: "Endodontics"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small clinics",
      features: [
        "Up to 100 patients",
        "Basic scheduling",
        "Patient records",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Most popular for growing clinics",
      features: [
        "Up to 500 patients",
        "Advanced scheduling",
        "Analytics dashboard",
        "Priority support",
        "Custom reports"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$149",
      period: "/month",
      description: "For large dental practices",
      features: [
        "Unlimited patients",
        "Multi-location support",
        "Advanced analytics",
        "24/7 phone support",
        "Custom integrations"
      ],
      popular: false
    }
  ]

  return (
    <motion.div 
      className="min-h-screen bg-white relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Custom Navbar Styles */}
      <style>{`
        nav[class*="fixed"] {
          z-index: 9999 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          height: 8vh !important;
          width: 100% !important;
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: none !important;
          transition: all 0.3s ease-in-out !important;
        }
        
        nav[class*="fixed"].scrolled {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(15px) !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 10px 10px -5px rgb(0 0 0 / 0.1) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
        }
        
        .navbar-content {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          height: 100% !important;
          width: 100% !important;
        }
        
        .navbar-text {
          font-weight: 600 !important;
          color: #1f2937 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      
      {/* Navigation */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 border-b border-gray-200 z-[9999] transition-all duration-300 ${isScrolled ? 'scrolled' : ''}`} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="navbar-content">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src="/lgo.png"
                  alt="myDashy Pro Logo"
                  className="w-6 h-6 rounded"
                />
              </div>
              <div>
                <h1 className="navbar-text text-lg font-bold">myDashy Pro</h1>
                <p className="text-xs text-gray-600 font-medium">Dental Management</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
              <a href="#pricing" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Pricing</a>
              <a href="#testimonials" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Reviews</a>
              <a href="#contact" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Contact</a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
              >
                Sign In
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
                <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Reviews</a>
                <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
                <button
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-xl font-semibold w-full"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-100 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Award className="w-4 h-4 mr-2" />
                Trusted by 500+ Dental Clinics
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
                Transform Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700"> Dental Practice</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                The most comprehensive dental clinic management system. Streamline operations, 
                enhance patient care, and grow your practice with powerful analytics and automation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-200"
                >
                  Watch Demo
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <img
                        src="/lgo.png"
                        alt="Logo"
                        className="w-5 h-5 rounded"
                      />
                    </div>
                    <span className="font-semibold text-gray-800">Dashboard</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>

                {/* Dashboard Cards Preview */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Patients</p>
                        <p className="text-2xl font-bold text-blue-800">1,247</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Today's Appointments</p>
                        <p className="text-2xl font-bold text-green-800">23</p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-purple-800">$45,230</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Completed</p>
                        <p className="text-2xl font-bold text-orange-800">18</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">New patient: Kainat</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Appointment completed: Muzammil</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Invoice generated: $450</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Everything You Need to Manage Your Clinic
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed specifically for dental practices to streamline operations 
              and enhance patient care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your practice size
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl p-8 border-2 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-2xl' 
                    : 'border-gray-100 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsContactModalOpen(true)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                      : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Get Started
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg"
            >
              <Star className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4"
            >
              Trusted by Dental Professionals
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700"> Worldwide</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Join thousands of dental professionals who have transformed their practice with myDashy Pro
            </motion.p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center text-2xl">
                        {testimonial.image}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{testimonial.name}</h4>
                        <p className="text-sm text-blue-600 font-medium">{testimonial.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="mb-6">
                    <div className="text-4xl text-blue-200 mb-2">"</div>
                    <p className="text-gray-600 leading-relaxed italic text-sm">
                      {testimonial.text}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-800 text-sm">{testimonial.clinic}</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-center text-white"
          >
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-blue-100 text-sm">Happy Clinics</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">50K+</div>
                <div className="text-blue-100 text-sm">Patients Managed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">99.9%</div>
                <div className="text-blue-100 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-blue-100 text-sm">Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ready to Transform Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Call to Action */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-semibold uppercase tracking-wide"
                >
                  Jion Our Community
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 leading-tight"
                >
                  Transform your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700"> Practice</span>
                </motion.h2>
              </div>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-lg"
              >
                Access your dental clinic dashboard, manage patients, track appointments, handle billing, communicate with staff, and much more - all from your web browser.
              </motion.p>



              {/* Get Started Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-start"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Side - Dashboard Features Table */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Dashboard Features Table */}
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Dashboard Features</h3>
                <div className="space-y-4">
                  {/* Staff Management */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Staff Management</h4>
                        <p className="text-sm text-gray-600">Manage team members & schedules</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  {/* User Settings */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">User Settings</h4>
                        <p className="text-sm text-gray-600">Configure preferences & permissions</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  {/* Automation */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Automation</h4>
                        <p className="text-sm text-gray-600">Automated workflows & reminders</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  {/* Inventory */}
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Inventory</h4>
                        <p className="text-sm text-gray-600">Track supplies & equipment</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  {/* Reports */}
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Reports</h4>
                        <p className="text-sm text-gray-600">Analytics & performance insights</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  {/* Patient Management */}
                  <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Patient Management</h4>
                        <p className="text-sm text-gray-600">Complete patient records & history</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <img
                    src="/lgo.png"
                    alt="myDashy Pro Logo"
                    className="w-6 h-6 rounded"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">myDashy Pro</h3>
                  <p className="text-sm text-gray-400">Dental Management</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                The most comprehensive dental clinic management system. Streamline operations, 
                enhance patient care, and grow your practice with powerful analytics and automation.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Reviews</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 myDashy Pro. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 md:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <img
                      src="/lgo.png"
                      alt="myDashy Pro Logo"
                      className="w-8 h-8 rounded"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Get Started with myDashy Pro</h2>
                    <p className="text-blue-100 text-sm">Transform your dental practice today</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Contact Information */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      Contact Information
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Phone Support</p>
                          <p className="text-gray-600 text-lg">+92 317 4718549</p>
                          <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM PKT</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Email Support</p>
                          <p className="text-gray-600 text-lg">aidev.muzammil@gmail.com</p>
                          <p className="text-sm text-gray-500">24/7 response within 2 hours</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Office Location</p>
                          <p className="text-gray-600 text-lg">74900 Karachi, Pakistan</p>
                          <p className="text-sm text-gray-500">Serving dental practices globally</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Why Choose myDashy Pro?</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>Free 30-day trial</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>No setup fees</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>24/7 customer support</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>Secure & HIPAA compliant</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    Start Your Free Trial
                  </h3>
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="john@dentalclinic.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="Bright Smile Dental Clinic"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Practice Size</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white">
                        <option value="">Select practice size</option>
                        <option value="1-5">1-5 staff members</option>
                        <option value="6-15">6-15 staff members</option>
                        <option value="16-50">16-50 staff members</option>
                        <option value="50+">50+ staff members</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tell us about your needs</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-white"
                        placeholder="What challenges are you facing with your current practice management system?"
                      ></textarea>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        I agree to the <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
                      </label>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <p className="text-center text-sm text-gray-500">
                      No credit card required • 30-day free trial • Cancel anytime
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
