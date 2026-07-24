import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WaveMark } from '../ui/Waveform'
import Reveal from '../ui/Reveal'

export default function CTA() {
  return (
    <section className="relative grain py-28 bg-ink overflow-hidden">
      <Reveal className="relative max-w-3xl mx-auto px-6 text-center">

        <WaveMark className="w-14 h-9 mx-auto mb-10" color="#2ba3ab" animate />

        <h2 className="font-display text-4xl lg:text-[3.4rem] font-semibold text-paper tracking-tight leading-[1.12] mb-6">
          Your next interview
          <br />
          shouldn't be your practice.
        </h2>

        <p className="text-lg text-paper/60 mb-11 leading-relaxed max-w-xl mx-auto">
          Two minutes, out loud, today. That's how it starts.
        </p>

        <Link to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-paper text-ink font-semibold text-lg hover:gap-3.5 transition-all">
          Start speaking — it's free <ArrowRight size={19} />
        </Link>

        <p className="handnote text-xl text-paper/40 mt-8">
          no credit card, no trial timer, no catch
        </p>
      </Reveal>
    </section>
  )
}
