import { Button } from "@/components/ui/button"
import { Github, Linkedin, Mail, Phone, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom";

export default function Component() {
  const navigate = useNavigate();

  const projects = [
    {
      name: "Yoom",
      description:
        "Real-time video calling platform with meeting management and scalable architecture built with modern web technologies.",
      tech: ["NextJS", "Prisma", "Tailwind", "Stream", "ReactJS"],
      features: ["Real-Time Video Calls", "Meeting Management", "Fast Performance"],
      period: "May 2024 - June 2024",
    },
    {
      name: "AI-Content Generator",
      description: "AI-powered content creation platform for blogs and social media with Gemini integration.",
      tech: ["NextJS", "Clerk", "Tailwind", "Gemini", "Prisma"],
      features: ["AI Content Generation", "Backend Best Practices", "Gemini Integration"],
      period: "June 2024 - July 2024",
    },
  ]

  const experiences = [
    {
      title: "Enhanced Testing Framework",
      description:
        "Migrated from Jest to Vitest and added comprehensive tests across various components at The Palisadoes Foundation.",
    },
    {
      title: "Open Source Engagement",
      description:
        "Maintained a GitHub contribution streak of over 230 days and achieved 30+ merged PRs in open-source projects such as Layer5 and The Palisadoes Foundation.",
    },
  ];
  
  const skills = {
    frontend: ["HTML", "React JS", "JavaScript", "Bootstrap", "Tailwind CSS", "SASS/SCSS"],
    backend: ["Node JS", "Express JS", "MySQL", "PostgreSQL", "Rest APIs"],
    mobile: ["React Native", "Expo"],
    other: ["Git/GitHub", "Figma", "Python", "C++", "DSA"],
  }

  return (
    <div className="min-h-screen bg-white">


      {/* Hero Banner - Dark Blue Section */}
      <section className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assignment by Nishant for TLE Eliminators</h2>
            <Button onClick={() => navigate("/students")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Check Out</Button>
          </div>
        </div>
      </section>

      {/* Main Hero Section - Exact TLE Style */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="text-blue-600">Nishant</span> <span className="text-gray-900">Singh</span>
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Full Stack Development <span className="text-blue-600">Simplified</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Navigate your way to the top with my expertise in modern web technologies and thoughtfully curated projects
            for the dynamic world of software development.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium">
            Explore Projects
          </Button>
        </div>
      </section>

      {/* Why Choose Me Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">Why Choose Me?</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Left Card - Dark */}
            <div className="bg-gray-900 text-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4">Open Source Excellence</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                I understand that every project is at a different stage in their development journey. My contributions
                span across multiple organizations including The Palisadoes Foundation and Layer5, with proven expertise
                in testing frameworks, feature development, and performance optimization.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Enhanced Testing Frameworks</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Feature Implementation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Performance Testing</span>
                </div>
              </div>
            </div>

            {/* Right Card - Light */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Leadership & Innovation</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                As Development Head of Open Source Software Club and Web-Dev Lead at Google Developer Student's Club,
                I've successfully led teams and managed large-scale events including Innerve 8 Hackathon with 4000+
                participants.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Team Leadership (20+ developers)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Event Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Project Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">Featured Projects</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{project.name}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{project.period}</span>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {project.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">Key Achievements</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {experiences.map((exp, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{exp.title}</h3>
                <p className="text-gray-600 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">Technical Expertise</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Frontend</h3>
              <div className="space-y-2">
                {skills.frontend.map((skill, index) => (
                  <div key={index} className="text-gray-600">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Backend</h3>
              <div className="space-y-2">
                {skills.backend.map((skill, index) => (
                  <div key={index} className="text-gray-600">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mobile</h3>
              <div className="space-y-2">
                {skills.mobile.map((skill, index) => (
                  <div key={index} className="text-gray-600">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Other</h3>
              <div className="space-y-2">
                {skills.other.map((skill, index) => (
                  <div key={index} className="text-gray-600">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education & Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">Get In Touch</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Mail className="w-5 h-5" />
              <span>nishant.1703.developer@gmail.com</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <Phone className="w-5 h-5" />
              <span>+91-9649959730</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ExternalLink className="w-4 h-4 mr-2" />
              Portfolio
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">© {new Date().getFullYear()} Nishant Singh. Assignment for TLE Eliminators.</p>
        </div>
      </footer>
    </div>
  )
}
