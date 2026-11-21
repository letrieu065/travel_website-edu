import { Suspense } from "react";
import HomePage from "../components/pages/user/HomePage"


export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-[#FACC15] rounded-full animate-spin"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
