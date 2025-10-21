import { useState, useEffect } from "react";
import { Code, Database, Map, ArrowRight, Download, Mail, Github, Linkedin, ExternalLink } from "lucide-react";

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const skills = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Web Development",
      description: "Crafting responsive and scalable web applications with modern frameworks and best practices.",
      tech: ["React", "Node.js", "Django", "TypeScript"],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Data Science",
      description: "Transforming raw data into actionable insights through advanced analytics and ML.",
      tech: ["Python", "Machine Learning", "EDA", "Predictive Modeling"],
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Map className="w-8 h-8" />,
      title: "Geospatial Engineering",
      description: "Building powerful mapping and spatial analysis tools for real-world impact.",
      tech: ["PostGIS", "Leaflet", "QGIS", "Spatial Analysis"],
      gradient: "from-emerald-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
          }}
        />
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main Content */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className={`text-center max-w-5xl transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Greeting */}
          <div className="inline-block mb-6">
            <p className="text-sm sm:text-base font-medium tracking-widest uppercase bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Hello, I am
            </p>
          </div>

          {/* Name */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
            Clinton{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
              Arogo
            </span>
          </h1>

          {/* Roles with Typing Effect */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
            {["Geospatial Engineer", "Web Developer", "Data Scientist"].map((role, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-sm sm:text-base text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                {role}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 leading-relaxed mb-10 max-w-3xl mx-auto px-4">
            I specialize in building intelligent systems that bridge{" "}
            <span className="text-blue-400 font-semibold">data science</span>,{" "}
            <span className="text-cyan-400 font-semibold">geospatial technology</span>, and modern{" "}
            <span className="text-teal-400 font-semibold">web development</span>.
            Creating solutions that make data-driven decision-making accessible, visual, and impactful.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <a
              href="#projects"
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 font-semibold"
            >
              View My Work
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-white/5 backdrop-blur-sm border-2 border-white/20 rounded-full hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 font-semibold"
            >
              <Download className="w-5 h-5" />
              Download Resume
            </a>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-16">
            <a href="https://github.com/ArogoClin" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all hover:scale-110">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/clintone-omondi/" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all hover:scale-110">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#contact" className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all hover:scale-110">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Skills Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full px-4 mt-20">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {/* Gradient Accent */}
              <div className={`absolute inset-0 bg-gradient-to-br ${skill.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`inline-flex p-3 bg-gradient-to-br ${skill.gradient} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {skill.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                {skill.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                {skill.description}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2">
                {skill.tech.map((tech, techIdx) => (
                  <span
                    key={techIdx}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 group-hover:bg-white/10 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Section */}
        <div className="mt-32 text-center max-w-3xl px-4">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Let's Build Something Amazing Together
          </h3>
          <p className="text-gray-400 text-lg mb-8">
            Interested in collaborating or learning more about my work? I'd love to hear from you.
          </p>
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 transition-all duration-300 hover:scale-105 font-semibold text-lg"
          >
            Get In Touch
            <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;