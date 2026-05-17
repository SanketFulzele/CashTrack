import { supabase } from "@/lib/supabase";

const Login = () => {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden px-4 sm:px-6">

      {/* Background blur shapes */}
      <div className="absolute w-48 h-48 sm:w-72 sm:h-72 bg-white/20 rounded-full blur-3xl top-10 left-5 sm:left-10"></div>
      <div className="absolute w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl bottom-10 right-5 sm:right-10"></div>

      {/* Card */}
      <div className="relative bg-white/90 backdrop-blur-md p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/40">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border">
            <img
              src="/cashtrack.png"
              alt="CashTrack Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          CashTrack
        </h1>
        <p className="text-gray-500 mt-2 mb-6 text-sm">
          Manage your expenses smarter
        </p>

        {/* Google Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            className=" sm:w-auto bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Sign in with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Secure login powered by Google
        </p>
      </div>
    </div>
  );
};

export default Login;