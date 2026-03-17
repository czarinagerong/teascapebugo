import image_044f9b78ea41bf6b0bde808e7a68ca9526b34fd1 from '@/assets/044f9b78ea41bf6b0bde808e7a68ca9526b34fd1.png'
import image_642ba794c5be42786dce18e3c1fce573cc6a4103 from '@/assets/642ba794c5be42786dce18e3c1fce573cc6a4103.png'
import { MapPin, Clock, Phone, Facebook, Instagram, Utensils, Home, Navigation } from 'lucide-react';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const STORY_IMG = 'https://images.unsplash.com/photo-1758373149105-5b785d1343ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';
const CAFE_IMG = 'https://images.unsplash.com/photo-1770993189421-24f88a309320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';

interface WhyCard {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const WHY_CARDS: WhyCard[] = [
  {
    icon: <Utensils className="w-7 h-7" style={{ color: '#6B3F1E' }} />,
    title: 'Variety Beyond Milk Tea',
    desc: 'From classic milk tea to hearty ramen, pasta, pizza, and Filipino favorites — our menu has something for every craving.',
  },
  {
    icon: <Home className="w-7 h-7" style={{ color: '#6B3F1E' }} />,
    title: 'Cozy Rustic Atmosphere',
    desc: 'Step into a warm, earthy space designed to make you feel at home. The perfect spot to relax, work, or catch up with friends.',
  },
  {
    icon: <Navigation className="w-7 h-7" style={{ color: '#6B3F1E' }} />,
    title: 'Located in Bugo CDO',
    desc: 'Conveniently located along Bugo Highway, beside Diesto Clinic. Easy to find, easy to fall in love with.',
  },
];

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>
      {/* Page Header */}
      <div
        className="py-14 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #1a0e05 0%, #2e210e 55%, #4a3010 100%)' }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Teascape Bugo</p>
        <h1
          style={{ fontFamily: 'var(--font-display)', color: '#fff', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontStyle: 'italic' }}
        >
          About Us
        </h1>
        <p className="text-white/70 mt-2 text-sm max-w-xs mx-auto" style={{ fontFamily: 'var(--font-body)' }}>Our story, our people, and our promise to you</p>
      </div>

      {/* Our Story */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeIn delay={0.05} className="rounded-2xl overflow-hidden shadow-lg h-80 md:h-[28rem]">
              <ImageWithFallback
                src={image_642ba794c5be42786dce18e3c1fce573cc6a4103}
                alt="Teascape Bugo Story"
                className="w-full h-full object-cover"
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Our Story</p>
              <h2
                style={{ fontFamily: 'var(--font-display)', color: '#556419', fontWeight: 700, lineHeight: 1.3, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontStyle: 'italic' }}
                className="mb-5"
              >
                Inspired by Thai Tea Culture,<br />
                Brought Home to Bugo CDO
              </h2>
              <p className="leading-relaxed mb-4 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
                Teascape Bugo started as a dream inspired by the vibrant milk tea shop culture of Thailand — cozy corners, aromatic teas, and a sense of community that makes every visit special. Our owner, captivated by the Thai cafe experience, decided to bring that same magic to the streets of Bugo, Cagayan de Oro.
              </p>
              <p className="leading-relaxed mb-4 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
                What began as a humble milk tea shop has grown into a full-fledged cafe offering everything from signature cheesecake milk teas to Korean ramen, fresh pasta, and crispy pizzas. We believe great food and great tea are best enjoyed in a space that feels like a second home.
              </p>
              <p className="leading-relaxed mb-6 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
                At Teascape, our tagline isn't just a catchy phrase — it's a genuine invitation. Pull up a chair, take a deep breath, and let yourself truly{' '}
                <em className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#556419' }}>
                  escape the reality.
                </em>
              </p>
              <div className="w-10 h-0.5 rounded-full" style={{ backgroundColor: '#b88917' }} />
              <p className="text-sm italic mt-3" style={{ color: '#b88917', fontFamily: 'var(--font-display)' }}>
                "Escape the Reality" — our promise to every guest.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-14 px-4" style={{ backgroundColor: '#f4efe4' }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Why Us</p>
            <h2
              style={{ fontFamily: 'var(--font-display)', color: '#556419', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontStyle: 'italic' }}
            >
              Why Choose Teascape?
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {WHY_CARDS.map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.1}>
                <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#fff' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(107,63,30,0.08)' }}>
                    {card.icon}
                  </div>
                  <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#556419', fontStyle: 'italic' }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Visit Us */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Get in Touch</p>
              <h2
                style={{ fontFamily: 'var(--font-display)', color: '#556419', fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontStyle: 'italic' }}
                className="mb-6"
              >
                Visit Us in Bugo CDO
              </h2>
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>Address</p>
                  <div className="flex items-start gap-3 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#b88917' }} />
                    <span>Bugo Highway, Beside Diesto Clinic, Cagayan de Oro City</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>Business Hours</p>
                  <div className="flex items-start gap-3 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#b88917' }} />
                    <div>
                      <div>Mon – Sat: 7:00 AM – 9:00 PM</div>
                      <div>Sunday: 1:00 PM – 7:00 PM</div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>Phone</p>
                  <div className="flex items-center gap-3 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
                    <Phone className="w-4 h-4 shrink-0" style={{ color: '#b88917' }} />
                    <span>09053957046</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>Follow Us</p>
                  <div className="flex gap-3">
                    <a href="https://www.facebook.com/teascapebugobranch/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(107,63,30,0.1)' }} aria-label="Facebook">
                       <Facebook className="w-4 h-4" style={{ color: '#2e210e' }} />
                    </a>
                    <a href="https://www.instagram.com/teascape_cafe?utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(107,63,30,0.1)' }} aria-label="Instagram">
                       <Instagram className="w-4 h-4" style={{ color: '#2e210e' }} />
                    </a>
                  </div>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/y9XNEetJQHV1vVgu8"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
              >
                <Navigation className="w-4 h-4" /> Open in Maps
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg h-72 md:h-80">
              <ImageWithFallback
                src={image_044f9b78ea41bf6b0bde808e7a68ca9526b34fd1}
                alt="Teascape Bugo Cafe"
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}