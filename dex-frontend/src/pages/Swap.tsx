import Navbar from '@/components/Navbar';
import SwapCard from '@/components/SwapCard';
import FloatingOrbs from '@/components/FloatingOrbs';

const Swap = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <FloatingOrbs />
      <Navbar />
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          {/* Page Header */}
         
          
          {/* Swap Card */}
          <div className="w-full max-w-md">
            <SwapCard />
          </div>
          
         
        </div>
      </main>
    </div>
  );
};

export default Swap;


