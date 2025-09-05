import Navbar from '@/components/Navbar';
import SwapCard from '@/components/SwapCard';
import FloatingOrbs from '@/components/FloatingOrbs';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

const Swap = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <FloatingOrbs />
      <Navbar />
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-12">
        {/* Hero-like header */}
        

        {/* Swap Card center with glow */}
        <section className="relative max-w-xl mx-auto">
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 blur-3xl" />
          <div className="relative">
            <SwapCard />
          </div>
        </section>

        {/* Feature chips under card */}
       
      </main>
    </div>
  );
};

export default Swap;


