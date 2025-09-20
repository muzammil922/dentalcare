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
  Globe
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Website() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
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
      name: "Dr. Sarah",
      clinic: "Bright Smile Dental",
      rating: 5,
      text: "myDashy Pro transformed our clinic operations. Patient management is now effortless and our efficiency has increased by 40%."
    },
    {
      name: "Dr. Mirhab",
      clinic: "Family Dental Care",
      rating: 5,
      text: "The analytics dashboard gives us insights we never had before. Revenue tracking and patient trends are crystal clear."
    },
    {
      name: "Dr. Abu Bakar",
      clinic: "Modern Dentistry",
      rating: 5,
      text: "Real-time scheduling and automated reminders have reduced no-shows by 60%. Our patients love the convenience."
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
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
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
                  onClick={handleSignIn}
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Trusted by Dental Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about myDashy Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-800">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.clinic}</p>
                </div>
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-gray-600">
              Get in touch with our team to learn more about myDashy Pro
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Phone</h3>
                  <p className="text-gray-600">+92 317 4718549</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Email</h3>
                  <p className="text-gray-600">aidev.muzammil@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Address</h3>
                  <p className="text-gray-600">74900 Karachi, Pakistan</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Support Hours</h3>
                  <p className="text-gray-600">24/7 Customer Support</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Tell us about your practice..."
                  ></textarea>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Send Message
                </motion.button>
              </form>
            </div>
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
    </motion.div>
  )
}
