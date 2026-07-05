import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/stores/authStore'

const FEATURES = [
  {
    n: '01',
    title: 'Parse your resume',
    desc: 'Upload a PDF or DOCX and get a structured profile — skills, experience, and education — in seconds.',
  },
  {
    n: '02',
    title: 'See what actually fits',
    desc: 'Every listing gets a match score built from your real skills and experience, not just keyword overlap.',
  },
  {
    n: '03',
    title: 'Track it end to end',
    desc: 'Move applications through saved, applied, interviewing, and offer without losing track of anything.',
  },
]

export default function Landing() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full max-w-6xl mx-auto pt-4 px-4">
        <Navbar />
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-medium text-primary mb-4 tracking-wide"
          >
            Resume analysis &amp; job matching
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-[3.4rem] font-semibold tracking-tight leading-[1.08] mb-6 text-foreground"
          >
            Know which jobs are worth your time,{' '}
            <span className="text-primary">before you apply.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mb-9 leading-relaxed"
          >
            Upload your resume once. ResuMatrix parses it, scores every job listing against your
            actual skills and experience, and helps you track applications from save to offer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap items-center gap-3"
          >
            {user ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg transition-colors"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-transparent hover:bg-secondary text-foreground font-semibold rounded-lg border border-border transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 mt-28 pt-12 border-t border-border">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <span className="text-xs font-semibold text-muted-foreground tracking-wider">{feature.n}</span>
              <h3 className="text-base font-semibold text-foreground mt-2 mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ResuMatrix</p>
      </footer>
    </div>
  )
}
