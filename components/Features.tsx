import { Shield, Zap, Clock, Users } from 'lucide-react';

const features = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Growing Revenue",
    description: "Start with signing up for milestone-based funding",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Best in Class Security",
    description: "Multi-sig wallets and quadratic voting",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Community Power",
    description: "Decentralized decision making",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Growth Potential",
    description: "Build reputation for future funding",
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-black dark:bg-white text-white dark:text-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white dark:text-black mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-black p-6 rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-transform"
            >
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full border-2 border-black dark:border-white flex items-center justify-center mb-4">
                <span className="text-white dark:text-black">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">{feature.title}</h3>
              <p className="text-black dark:text-white">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

