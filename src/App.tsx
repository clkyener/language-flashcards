import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, TextField, Button, LinearProgress, Paper, FormControl, InputLabel, Select, MenuItem, Chip, Menu } from '@mui/material';
import React from 'react';
import { useFirebaseAuth, saveQuestionProgress, updateUserProgress } from './firebase';

type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface Phrase {
  original: string;
  english: string;
  audioUrl: string;
  level: ProficiencyLevel;
}

const LANGUAGES = {
  Swedish: { 
    name: 'Swedish', 
    flag: '🇸🇪',
    code: 'sv',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as ProficiencyLevel[]
  },
  German: { 
    name: 'German', 
    flag: '🇩🇪',
    code: 'de',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as ProficiencyLevel[]
  },
} as const;

type Language = keyof typeof LANGUAGES;

interface ProgressStats {
  date: string;
  correct: number;
  total: number;
  level: ProficiencyLevel;
}

interface FailedPhrase extends Phrase {
  lastAttemptDate: string;
  attempts: number;
}

interface UserProgress {
  phrasesStudied: number;
  correctAnswers: number;
  lastStudyDate: string;
  levelProgress: Record<ProficiencyLevel, {
    attempted: number;
    correct: number;
  }>;
  dailyStats: ProgressStats[];
  failedPhrases: FailedPhrase[];
}

interface UserSettings {
  selectedLevel: ProficiencyLevel;
  progress: Record<Language, UserProgress>;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
  settings: UserSettings;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  const { auth, logoutUser, getUserData } = useFirebaseAuth();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setDebugLogs(prev => [...prev, `Auth state changed: ${firebaseUser?.uid || 'null'}`]);
      if (firebaseUser) {
        // Get user data from Firestore
        const { data: userData, error } = await getUserData(firebaseUser.uid);
        setDebugLogs(prev => [...prev, `Firestore user data: ${JSON.stringify(userData)}`]);
        setDebugLogs(prev => [...prev, `Firestore error: ${error?.message || 'none'}`]);
        
        if (userData && !error) {
          const userWithData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            createdAt: userData.createdAt || new Date().toISOString(),
            settings: userData.settings || {
              selectedLevel: 'A1',
              progress: {
                Swedish: {
                  phrasesStudied: 0,
                  correctAnswers: 0,
                  lastStudyDate: new Date().toISOString(),
                  levelProgress: {
                    'A1': { attempted: 0, correct: 0 },
                    'A2': { attempted: 0, correct: 0 },
                    'B1': { attempted: 0, correct: 0 },
                    'B2': { attempted: 0, correct: 0 },
                    'C1': { attempted: 0, correct: 0 },
                    'C2': { attempted: 0, correct: 0 },
                  },
                  dailyStats: [],
                  failedPhrases: [],
                },
                German: {
                  phrasesStudied: 0,
                  correctAnswers: 0,
                  lastStudyDate: new Date().toISOString(),
                  levelProgress: {
                    'A1': { attempted: 0, correct: 0 },
                    'A2': { attempted: 0, correct: 0 },
                    'B1': { attempted: 0, correct: 0 },
                    'B2': { attempted: 0, correct: 0 },
                    'C1': { attempted: 0, correct: 0 },
                    'C2': { attempted: 0, correct: 0 },
                  },
                  dailyStats: [],
                  failedPhrases: [],
                },
              },
            },
          };
          setDebugLogs(prev => [...prev, `Setting user data: ${JSON.stringify(userWithData)}`]);
          setUser(userWithData);
          localStorage.setItem('user', JSON.stringify(userWithData));
        } else {
          setDebugLogs(prev => [...prev, 'No user data found in Firestore, creating new user']);
          // Create new user data if not exists
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            createdAt: new Date().toISOString(),
            settings: {
              selectedLevel: 'A1',
              progress: {
                Swedish: {
                  phrasesStudied: 0,
                  correctAnswers: 0,
                  lastStudyDate: new Date().toISOString(),
                  levelProgress: {
                    'A1': { attempted: 0, correct: 0 },
                    'A2': { attempted: 0, correct: 0 },
                    'B1': { attempted: 0, correct: 0 },
                    'B2': { attempted: 0, correct: 0 },
                    'C1': { attempted: 0, correct: 0 },
                    'C2': { attempted: 0, correct: 0 },
                  },
                  dailyStats: [],
                  failedPhrases: [],
                },
                German: {
                  phrasesStudied: 0,
                  correctAnswers: 0,
                  lastStudyDate: new Date().toISOString(),
                  levelProgress: {
                    'A1': { attempted: 0, correct: 0 },
                    'A2': { attempted: 0, correct: 0 },
                    'B1': { attempted: 0, correct: 0 },
                    'B2': { attempted: 0, correct: 0 },
                    'C1': { attempted: 0, correct: 0 },
                    'C2': { attempted: 0, correct: 0 },
                  },
                  dailyStats: [],
                  failedPhrases: [],
                },
              },
            },
          };
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      } else {
        setDebugLogs(prev => [...prev, 'User logged out']);
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => unsubscribe();
  }, [auth, getUserData]);

  const login = async () => {
    // This will be handled by the Firebase auth state change
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
      {/* Debug Panel Toggle Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 10000,
        }}
      >
        {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
      </Button>

      {/* Debug Panel */}
      {showDebugPanel && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 70,
            right: 20,
            width: '400px',
            height: '300px',
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white',
            overflow: 'auto',
            padding: '15px',
            fontSize: '12px',
            zIndex: 9999,
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', mb: 2, borderBottom: '1px solid white', pb: 1 }}>
            Debug Logs
          </Typography>
          {debugLogs.map((log, index) => (
            <Typography 
              key={index} 
              sx={{ 
                color: 'white', 
                fontSize: '12px', 
                mb: 1,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {log}
            </Typography>
          ))}
        </Box>
      )}
    </AuthContext.Provider>
  );
};

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { login } = useAuth();
  const { loginUser, registerUser, signInWithGoogle, resetPassword } = useFirebaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (isResetPassword) {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error.message);
        } else {
          setSuccessMessage('Password reset link has been sent to your email');
        }
        return;
      }

      const result = isLogin
        ? await loginUser(email, password)
        : await registerUser(email, password);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.user) {
        // The auth state change listener will handle setting the user data
        login(result.user.email || 'User');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.4,
          zIndex: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 2,
          p: 4,
          pointerEvents: 'none',
        }}
      >
        {[...Array(32)].map((_, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              height: '100px',
              backgroundColor: i % 2 === 0 ? '#006AA7' : '#FECC02',
              opacity: 0.1,
              transform: `rotate(${Math.random() * 45}deg)`,
            }}
          />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center', justifyContent: 'center' }}>
          {/* Left side - Welcome text and features */}
          <Box sx={{ flex: 1, width: '100%', maxWidth: { xs: '100%', md: '50%' } }}>
            <Box sx={{ p: 4 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #006AA7, #0086D4)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 4,
                }}
              >
                Welcome to Language Flashcards
              </Typography>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Your journey to language mastery begins here
              </Typography>
              <Box sx={{ mt: 4 }}>
                {[
                  { icon: '🎯', text: 'Learn Swedish and German' },
                  { icon: '📚', text: 'Progressive difficulty levels from A1 to C2' },
                  { icon: '📊', text: 'Track your progress and statistics' },
                  { icon: '🔄', text: 'Practice failed phrases to improve' },
                ].map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">{feature.icon}</Typography>
                    <Typography variant="body1">{feature.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Right side - Login form */}
          <Box sx={{ flex: 1, width: '100%', maxWidth: { xs: '100%', md: '50%' } }}>
            <Paper
              elevation={24}
              sx={{
                p: 6,
                maxWidth: 480,
                width: '100%',
                mx: 'auto',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <form onSubmit={handleSubmit}>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    textAlign: 'center',
                    mb: 4,
                  }}
                >
                  {isResetPassword 
                    ? 'Reset Password'
                    : isLogin 
                      ? 'Welcome Back' 
                      : 'Create Account'}
                </Typography>

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  variant="outlined"
                  autoFocus
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                {!isResetPassword && (
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}

                {isLogin && !isResetPassword && (
                  <Box sx={{ width: '100%', textAlign: 'right', mb: 2 }}>
                    <Button
                      variant="text"
                      onClick={() => {
                        setIsResetPassword(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      sx={{ 
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Box>
                )}

                {error && (
                  <Typography 
                    color="error" 
                    variant="body2" 
                    sx={{ mb: 2, textAlign: 'center' }}
                  >
                    {error}
                  </Typography>
                )}

                {successMessage && (
                  <Typography 
                    color="success.main" 
                    variant="body2" 
                    sx={{ mb: 2, textAlign: 'center' }}
                  >
                    {successMessage}
                  </Typography>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={!email.trim() || (!isResetPassword && !password.trim())}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #006AA7, #0086D4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #005586, #0073B1)',
                    },
                    mb: 2,
                  }}
                >
                  {isResetPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Sign Up'}
                </Button>

                {!isResetPassword && (
                  <>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', my: 2 }}>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                        or
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={async () => {
                        try {
                          const result = await signInWithGoogle();
                          if (result.error) {
                            setError(result.error.message);
                            return;
                          }
                          if (result.user) {
                            login(result.user.email || 'User');
                          }
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        style={{ width: 20, height: 20 }} 
                      />
                      Continue with Google
                    </Button>
                  </>
                )}

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  {isResetPassword ? (
                    <Button
                      variant="text"
                      onClick={() => {
                        setIsResetPassword(false);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Back to Sign In
                    </Button>
                  ) : (
                    <Button
                      variant="text"
                      onClick={() => setIsLogin(!isLogin)}
                      sx={{ textTransform: 'none' }}
                    >
                      {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </Button>
                  )}
                </Box>
              </form>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

interface FlashcardAppProps {
  containerId?: string;
  initialLanguage?: Language;
  initialLevel?: ProficiencyLevel;
  theme?: {
    primary?: string;
    secondary?: string;
    background?: {
      default?: string;
      paper?: string;
    };
  };
  onProgress?: (progress: {
    language: Language;
    level: ProficiencyLevel;
    correct: number;
    total: number;
  }) => void;
}

interface FailedPhrasesFilter {
  level: ProficiencyLevel | 'all';
  timeRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'recent' | 'attempts' | 'alphabetical';
}

// This is a placeholder. In a real app, this would be fetched from a backend
const phrases: Record<Language, Phrase[]> = {
  Swedish: [
    // A1 Level - Basic phrases
    { original: "Hej", english: "Hello", audioUrl: "/audio/sv/hej.mp3", level: "A1" },
    { original: "Tack", english: "Thank you", audioUrl: "/audio/sv/tack.mp3", level: "A1" },
    { original: "Ja", english: "Yes", audioUrl: "/audio/sv/ja.mp3", level: "A1" },
    { original: "Nej", english: "No", audioUrl: "/audio/sv/nej.mp3", level: "A1" },
    { original: "God morgon", english: "Good morning", audioUrl: "/audio/sv/god-morgon.mp3", level: "A1" },
    { original: "God natt", english: "Good night", audioUrl: "/audio/sv/god-natt.mp3", level: "A1" },
    { original: "Hur mår du?", english: "How are you?", audioUrl: "/audio/sv/hur-mar-du.mp3", level: "A1" },
    { original: "Jag mår bra", english: "I'm fine", audioUrl: "/audio/sv/jag-mar-bra.mp3", level: "A1" },
    { original: "Vad heter du?", english: "What's your name?", audioUrl: "/audio/sv/vad-heter-du.mp3", level: "A1" },
    { original: "Jag heter", english: "My name is", audioUrl: "/audio/sv/jag-heter.mp3", level: "A1" },

    // A2 Level - Basic conversations
    { original: "Var bor du?", english: "Where do you live?", audioUrl: "/audio/sv/var-bor-du.mp3", level: "A2" },
    { original: "Jag bor i", english: "I live in", audioUrl: "/audio/sv/jag-bor-i.mp3", level: "A2" },
    { original: "Vad gör du?", english: "What are you doing?", audioUrl: "/audio/sv/vad-gor-du.mp3", level: "A2" },
    { original: "Jag arbetar", english: "I'm working", audioUrl: "/audio/sv/jag-arbetar.mp3", level: "A2" },
    { original: "Jag studerar", english: "I'm studying", audioUrl: "/audio/sv/jag-studerar.mp3", level: "A2" },

    // B1 Level - More complex phrases
    { original: "Jag skulle vilja", english: "I would like to", audioUrl: "/audio/sv/jag-skulle-vilja.mp3", level: "B1" },
    { original: "Kan du hjälpa mig?", english: "Can you help me?", audioUrl: "/audio/sv/kan-du-hjalpa-mig.mp3", level: "B1" },
    { original: "Jag förstår inte", english: "I don't understand", audioUrl: "/audio/sv/jag-forstar-inte.mp3", level: "B1" },
    { original: "Kan du upprepa?", english: "Can you repeat that?", audioUrl: "/audio/sv/kan-du-upprepa.mp3", level: "B1" },
    { original: "Talar du engelska?", english: "Do you speak English?", audioUrl: "/audio/sv/talar-du-engelska.mp3", level: "B1" }
  ],
  German: [
    // A1 Level - Basic phrases
    { original: "Hallo", english: "Hello", audioUrl: "/audio/de/hallo.mp3", level: "A1" },
    { original: "Danke", english: "Thank you", audioUrl: "/audio/de/danke.mp3", level: "A1" },
    { original: "Ja", english: "Yes", audioUrl: "/audio/de/ja.mp3", level: "A1" },
    { original: "Nein", english: "No", audioUrl: "/audio/de/nein.mp3", level: "A1" },
    { original: "Guten Morgen", english: "Good morning", audioUrl: "/audio/de/guten-morgen.mp3", level: "A1" },
    { original: "Gute Nacht", english: "Good night", audioUrl: "/audio/de/gute-nacht.mp3", level: "A1" },
    { original: "Wie geht es dir?", english: "How are you?", audioUrl: "/audio/de/wie-geht-es-dir.mp3", level: "A1" },
    { original: "Mir geht es gut", english: "I'm fine", audioUrl: "/audio/de/mir-geht-es-gut.mp3", level: "A1" },
    { original: "Wie heißt du?", english: "What's your name?", audioUrl: "/audio/de/wie-heisst-du.mp3", level: "A1" },
    { original: "Ich heiße", english: "My name is", audioUrl: "/audio/de/ich-heisse.mp3", level: "A1" },

    // A2 Level - Basic conversations
    { original: "Wo wohnst du?", english: "Where do you live?", audioUrl: "/audio/de/wo-wohnst-du.mp3", level: "A2" },
    { original: "Ich wohne in", english: "I live in", audioUrl: "/audio/de/ich-wohne-in.mp3", level: "A2" },
    { original: "Was machst du?", english: "What are you doing?", audioUrl: "/audio/de/was-machst-du.mp3", level: "A2" },
    { original: "Ich arbeite", english: "I'm working", audioUrl: "/audio/de/ich-arbeite.mp3", level: "A2" },
    { original: "Ich studiere", english: "I'm studying", audioUrl: "/audio/de/ich-studiere.mp3", level: "A2" },

    // B1 Level - More complex phrases
    { original: "Ich möchte", english: "I would like to", audioUrl: "/audio/de/ich-mochte.mp3", level: "B1" },
    { original: "Kannst du mir helfen?", english: "Can you help me?", audioUrl: "/audio/de/kannst-du-mir-helfen.mp3", level: "B1" },
    { original: "Ich verstehe nicht", english: "I don't understand", audioUrl: "/audio/de/ich-verstehe-nicht.mp3", level: "B1" },
    { original: "Kannst du das wiederholen?", english: "Can you repeat that?", audioUrl: "/audio/de/kannst-du-das-wiederholen.mp3", level: "B1" },
    { original: "Sprichst du Englisch?", english: "Do you speak English?", audioUrl: "/audio/de/sprichst-du-englisch.mp3", level: "B1" }
  ]
};

const languageThemes = {
  Swedish: {
    primary: '#006AA7', // Swedish flag blue
    secondary: '#FECC02', // Swedish flag yellow
    gradient: {
      start: '#006AA7',
      end: '#0086D4',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    }
  },
  German: {
    primary: '#DD0000', // German flag red
    secondary: '#FFCE00', // German flag gold
    gradient: {
      start: '#DD0000',
      end: '#FF1A1A',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    }
  },
  default: {
    primary: '#2196f3',
    secondary: '#f50057',
    gradient: {
      start: '#2196f3',
      end: '#21cbf3',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    }
  }
};

function App({
  containerId = 'flashcard-app',
  initialLanguage,
  initialLevel,
  theme: customTheme,
  onProgress,
}: FlashcardAppProps = {}) {
  const { user, logout } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(initialLanguage || null);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(initialLevel || null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wasShowingAnswer, setWasShowingAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showStats, setShowStats] = useState(false);
  const [isFailedPhraseMode, setIsFailedPhraseMode] = useState(false);
  const [failedPhraseIndex, setFailedPhraseIndex] = useState(0);
  const [failedPhrasesFilter, setFailedPhrasesFilter] = useState<FailedPhrasesFilter>({
    level: 'all',
    timeRange: 'all',
    sortBy: 'recent'
  });
  const [lastAnswer, setLastAnswer] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add debug logs when user data changes
  useEffect(() => {
    if (user) {
      setDebugLogs(prev => [...prev, `User logged in: ${user.email}`]);
      setDebugLogs(prev => [...prev, `User progress: ${JSON.stringify(user.settings.progress)}`]);
    } else {
      setDebugLogs(prev => [...prev, 'No user logged in']);
    }
  }, [user]);

  // Use user's settings instead of separate state
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    return user?.settings || {
      selectedLevel: 'A1',
      progress: {
        Swedish: {
          phrasesStudied: 0,
          correctAnswers: 0,
          lastStudyDate: new Date().toISOString(),
          levelProgress: {
            'A1': { attempted: 0, correct: 0 },
            'A2': { attempted: 0, correct: 0 },
            'B1': { attempted: 0, correct: 0 },
            'B2': { attempted: 0, correct: 0 },
            'C1': { attempted: 0, correct: 0 },
            'C2': { attempted: 0, correct: 0 },
          },
          dailyStats: [],
          failedPhrases: [],
        },
        German: {
          phrasesStudied: 0,
          correctAnswers: 0,
          lastStudyDate: new Date().toISOString(),
          levelProgress: {
            'A1': { attempted: 0, correct: 0 },
            'A2': { attempted: 0, correct: 0 },
            'B1': { attempted: 0, correct: 0 },
            'B2': { attempted: 0, correct: 0 },
            'C1': { attempted: 0, correct: 0 },
            'C2': { attempted: 0, correct: 0 },
          },
          dailyStats: [],
          failedPhrases: [],
        },
      },
    };
  });

  // Save settings to user data whenever they change
  useEffect(() => {
    if (user) {
      const updatedUser = {
        ...user,
        settings: userSettings,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [userSettings, user]);

  // Notify parent about progress
  useEffect(() => {
    if (selectedLanguage && selectedLevel && onProgress) {
      onProgress({
        language: selectedLanguage,
        level: selectedLevel,
        correct: score,
        total: currentPhraseIndex + 1,
      });
    }
  }, [score, currentPhraseIndex, selectedLanguage, selectedLevel, onProgress]);

  const theme = useMemo(() => {
    const baseColors = selectedLanguage 
      ? languageThemes[selectedLanguage]
      : languageThemes.default;

    const colors = {
      primary: customTheme?.primary || baseColors.primary,
      secondary: customTheme?.secondary || baseColors.secondary,
      background: customTheme?.background || baseColors.background,
      gradient: baseColors.gradient,
    };

    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: colors.primary,
        },
        secondary: {
          main: colors.secondary,
        },
        background: colors.background,
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 500,
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              textTransform: 'none',
              fontSize: '1rem',
              padding: '10px 24px',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              background: `linear-gradient(145deg, ${colors.background.paper} 0%, ${colors.background.paper} 100%)`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
              },
            },
          },
        },
      },
    });
  }, [selectedLanguage, customTheme]);

  const filteredPhrases = useMemo(() => {
    if (!selectedLanguage || !selectedLevel) return [];
    return phrases[selectedLanguage].filter(
      phrase => phrase.level === selectedLevel
    );
  }, [selectedLanguage, selectedLevel]);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    // Don't reset level if user is returning to a language they've studied before
    if (!userSettings.progress[language].phrasesStudied) {
      setSelectedLevel(null);
    } else {
      setSelectedLevel(userSettings.selectedLevel);
    }
    setCurrentPhraseIndex(0);
    setScore(0);
  };

  const handleLevelSelect = (level: ProficiencyLevel) => {
    setSelectedLevel(level);
    setUserSettings(prev => ({
      ...prev,
      selectedLevel: level,
    }));
  };

  const handleAnswerSubmit = () => {
    if (!selectedLanguage || !selectedLevel || !inputRef.current) return;
    
    const currentPhrase = filteredPhrases[currentPhraseIndex];
    const userAnswer = inputRef.current.value.trim();
    const correct = userAnswer.toLowerCase() === currentPhrase.original.toLowerCase();
    
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }

    // Store the user's answer for display
    setLastAnswer(userAnswer);

    const today = new Date().toISOString().split('T')[0];
    
    // Save individual question progress to Firestore
    if (user) {
      saveQuestionProgress(
        user.id,
        selectedLanguage,
        currentPhrase.original, // Using the phrase as the question ID
        correct ? 'success' : 'failed'
      );
    }
    
    // Update progress with daily stats and failed phrases
    setUserSettings(prev => {
      const currentProgress = prev.progress[selectedLanguage];
      const dailyStats = currentProgress.dailyStats || [];
      const todayStats = dailyStats.find(stat => stat.date === today);
      const failedPhrases = currentProgress.failedPhrases || [];

      // Update failed phrases
      let updatedFailedPhrases = [...failedPhrases];
      if (!correct) {
        const existingFailedPhrase = failedPhrases.find(p => 
          p.original === currentPhrase.original && 
          p.level === currentPhrase.level
        );
        
        if (existingFailedPhrase) {
          updatedFailedPhrases = failedPhrases.map(p =>
            p.original === currentPhrase.original && p.level === currentPhrase.level
              ? { ...p, attempts: p.attempts + 1, lastAttemptDate: today }
              : p
          );
        } else {
          updatedFailedPhrases.push({
            ...currentPhrase,
            attempts: 1,
            lastAttemptDate: today
          });
        }
      } else {
        // Remove from failed phrases if correct
        updatedFailedPhrases = failedPhrases.filter(p => 
          p.original !== currentPhrase.original || 
          p.level !== currentPhrase.level
        );
      }

      const updatedDailyStats = todayStats
        ? dailyStats.map(stat =>
            stat.date === today
              ? { ...stat, correct: stat.correct + (correct ? 1 : 0), total: stat.total + 1 }
              : stat
          )
        : [...dailyStats, { date: today, correct: correct ? 1 : 0, total: 1, level: selectedLevel }];

      const updatedProgress = {
        ...prev,
        progress: {
          ...prev.progress,
          [selectedLanguage]: {
            ...currentProgress,
            phrasesStudied: currentProgress.phrasesStudied + 1,
            correctAnswers: currentProgress.correctAnswers + (correct ? 1 : 0),
            lastStudyDate: new Date().toISOString(),
            dailyStats: updatedDailyStats,
            failedPhrases: updatedFailedPhrases,
            levelProgress: {
              ...currentProgress.levelProgress,
              [selectedLevel]: {
                attempted: currentProgress.levelProgress[selectedLevel].attempted + 1,
                correct: currentProgress.levelProgress[selectedLevel].correct + (correct ? 1 : 0),
              },
            },
          },
        },
      };

      // Update progress in Firestore if user is logged in
      if (user) {
        updateUserProgress(user.id, updatedProgress.progress);
      }

      return updatedProgress;
    });
    
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (!selectedLanguage || !selectedLevel || !inputRef.current) return;
    
    if (currentPhraseIndex < filteredPhrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
    } else {
      // Show completion dialog and reset to first phrase
      setCurrentPhraseIndex(0);
      setScore(0);
      // Optional: Show a completion message
      alert(`Congratulations! You've completed all phrases for ${selectedLanguage} Level ${selectedLevel}. Starting over from the beginning.`);
    }
    
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    setShowAnswer(false);
    setIsCorrect(null);
  };

  // Function to filter and sort failed phrases
  const getFilteredFailedPhrases = (language: Language, filter: FailedPhrasesFilter) => {
    const failedPhrases = userSettings.progress[language].failedPhrases;
    const now = new Date();
    
    return failedPhrases
      .filter(phrase => {
        // Filter by level
        if (filter.level !== 'all' && phrase.level !== filter.level) {
          return false;
        }

        // Filter by time range
        const phraseDate = new Date(phrase.lastAttemptDate);
        switch (filter.timeRange) {
          case 'today':
            return phraseDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return phraseDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return phraseDate >= monthAgo;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        switch (filter.sortBy) {
          case 'recent':
            return new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime();
          case 'attempts':
            return b.attempts - a.attempts;
          case 'alphabetical':
            return a.original.localeCompare(b.original);
          default:
            return 0;
        }
      });
  };

  // Function to start failed phrases practice mode
  const startFailedPhrasesPractice = (language: Language) => {
    setSelectedLanguage(language);
    setIsFailedPhraseMode(true);
    setFailedPhraseIndex(0);
    setShowStats(false);
    setScore(0);
    setShowAnswer(false);
    setIsCorrect(null);
  };

  const CombinedSelector = () => {
    const getPhraseCountForLevel = (language: Language, level: ProficiencyLevel) => {
      return phrases[language].filter(phrase => phrase.level === level).length;
    };

    return (
      <Box sx={{ maxWidth: '100%', margin: '0 auto', padding: 2 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ 
            mb: 4,
            background: `linear-gradient(45deg, ${languageThemes.default.gradient.start} 30%, ${languageThemes.default.gradient.end} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Choose Your Language Journey
        </Typography>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 4,
          width: '100%',
        }}>
          {(Object.entries(LANGUAGES) as [Language, { name: string, flag: string }][]).map(([key, { name, flag }]) => (
            <Box key={key}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: `linear-gradient(145deg, ${languageThemes[key].background.paper} 0%, ${languageThemes[key].gradient.start} 100%)`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    mb: 3
                  }}>
                    <Typography 
                      variant="h5" 
                      component="span"
                      sx={{ fontSize: '2rem', lineHeight: 1 }}
                    >
                      {flag}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="h2"
                      sx={{ color: languageThemes[key].secondary }}
                    >
                      {name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {LANGUAGES[key].levels.map((level) => {
                      const phraseCount = getPhraseCountForLevel(key, level);
                      const isSelected = selectedLanguage === key && selectedLevel === level;
                      
                      return (
                        <Button
                          key={level}
                          variant={isSelected ? "contained" : "outlined"}
                          onClick={() => {
                            handleLanguageSelect(key);
                            handleLevelSelect(level);
                          }}
                          sx={{
                            py: 1.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: isSelected ? `${languageThemes[key].primary}!important` : 'transparent',
                            borderColor: languageThemes[key].primary,
                            color: isSelected ? '#fff' : languageThemes[key].primary,
                            '&:hover': {
                              backgroundColor: `${languageThemes[key].primary}22`,
                            },
                          }}
                        >
                          <Typography variant="body1">{level}</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography variant="caption">
                              {userSettings.progress[key].levelProgress[level].correct} / {userSettings.progress[key].levelProgress[level].attempted} completed
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {phraseCount} phrases available
                            </Typography>
                          </Box>
                        </Button>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const LanguageHeader = ({ language, level }: { language: Language; level?: ProficiencyLevel }) => (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        mb: 4,
        pt: 2
      }}
    >
      <Typography 
        variant="h3" 
        sx={{ 
          fontSize: '3rem',
          lineHeight: 1 
        }}
      >
        {LANGUAGES[language].flag}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <Typography 
          variant="h3"
          sx={{ 
            color: languageThemes[language].primary,
            fontWeight: 'bold'
          }}
        >
          {LANGUAGES[language].name}
        </Typography>
        {level && (
          <Typography 
            variant="h4"
            sx={{ 
              color: languageThemes[language].primary,
              opacity: 0.8
            }}
          >
            Level {level}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const FlashCard = () => {
    if (!selectedLanguage || !selectedLevel) return null;
    
    const currentPhrase = isFailedPhraseMode
      ? getFilteredFailedPhrases(selectedLanguage, failedPhrasesFilter)[failedPhraseIndex]
      : filteredPhrases[currentPhraseIndex];

    if (!currentPhrase) {
      return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h5" gutterBottom>
            {isFailedPhraseMode 
              ? "No failed phrases match your filters"
              : "No phrases available"}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setIsFailedPhraseMode(false);
              setSelectedLevel(null);
              setShowStats(true);
            }}
          >
            Back to Stats
          </Button>
        </Box>
      );
    }

    const progress = isFailedPhraseMode
      ? ((failedPhraseIndex + 1) / getFilteredFailedPhrases(selectedLanguage, failedPhrasesFilter).length) * 100
      : ((currentPhraseIndex + 1) / filteredPhrases.length) * 100;
    const colors = languageThemes[selectedLanguage];

    // Add global keyboard event listener
    useEffect(() => {
      const handleGlobalKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (showAnswer) {
            handleNext();
          } else {
            handleAnswerSubmit();
          }
        }
      };

      window.addEventListener('keydown', handleGlobalKeyPress);
      return () => window.removeEventListener('keydown', handleGlobalKeyPress);
    }, [showAnswer]);

    // Keep input focused
    useEffect(() => {
      const focusInput = () => {
        if (inputRef.current && !showAnswer) {
          inputRef.current.focus();
        }
      };
      
      focusInput();
      // Add a small delay to ensure focus after state updates
      const timeoutId = setTimeout(focusInput, 100);
      
      return () => clearTimeout(timeoutId);
    }, [showAnswer, currentPhraseIndex]);

    const playAudio = async () => {
      if (!selectedLanguage || !selectedLevel) return;
      const currentPhrase = filteredPhrases[currentPhraseIndex];
      
      const utterance = new SpeechSynthesisUtterance(currentPhrase.original);
      utterance.lang = selectedLanguage === 'Swedish' ? 'sv-SE' : 'de-DE';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      
      // Ensure input stays focused after playing audio
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    return (
      <Box sx={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: 2 }}>
        <LanguageHeader language={selectedLanguage} level={selectedLevel} />
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }} gap={4}>
          {/* Flashcard Column */}
          <Box>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentPhraseIndex + 1} / {filteredPhrases.length}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: `${colors.primary}22`,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(45deg, ${colors.gradient.start} 30%, ${colors.gradient.end} 90%)`,
                  }
                }}
              />
            </Box>
            
            <Paper 
              elevation={24}
              sx={{ 
                p: 3, 
                borderRadius: 4,
                background: `linear-gradient(145deg, ${colors.background.paper} 0%, ${colors.background.paper} 100%)`,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h5" 
                  align="center"
                  sx={{ mb: 1 }}
                >
                  {currentPhrase.english}
                </Typography>
                <Typography 
                  variant="body2" 
                  align="center"
                  color="text.secondary"
                >
                  Translate to {LANGUAGES[selectedLanguage].name}
                </Typography>
              </Box>

              <Box 
                component="form" 
                sx={{ 
                  mb: 3,
                  position: 'relative',
                  height: '56px'
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (showAnswer) {
                    handleNext();
                  } else {
                    handleAnswerSubmit();
                  }
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  disabled={showAnswer}
                  placeholder={`Type the ${LANGUAGES[selectedLanguage].name} translation...`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    padding: '0 16px',
                    fontSize: '1rem',
                    color: '#000000',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    cursor: showAnswer ? 'not-allowed' : 'text'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                    if (!showAnswer) {
                      setTimeout(() => e.target.focus(), 100);
                    }
                  }}
                />
              </Box>

              {showAnswer && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: 2,
                  backgroundColor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  border: 1,
                  borderColor: isCorrect ? 'success.main' : 'error.main',
                }}>
                  <Typography 
                    variant="h6" 
                    align="center"
                    color={isCorrect ? 'success.main' : 'error.main'}
                    sx={{ mb: 2 }}
                  >
                    {isCorrect ? '🎉 Correct!' : '😅 Almost there!'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Your answer:
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          color: isCorrect ? 'success.main' : 'error.main',
                          fontWeight: 'medium'
                        }}
                      >
                        {lastAnswer}
                      </Typography>
                    </Box>
                    {!isCorrect && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Correct answer:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="success.main"
                          sx={{ fontWeight: 'medium' }}
                        >
                          {currentPhrase.original}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    mb: 1
                  }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={playAudio}
                      onMouseDown={(e) => e.preventDefault()}
                      sx={{
                        minWidth: 'auto',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        padding: 0
                      }}
                    >
                      🔊
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                {!showAnswer ? (
                  <Button 
                    variant="contained" 
                    onClick={handleAnswerSubmit}
                    sx={{
                      background: `linear-gradient(45deg, ${colors.gradient.start} 30%, ${colors.gradient.end} 90%)`,
                      boxShadow: `0 3px 5px 2px ${colors.primary}33`,
                    }}
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    sx={{
                      background: `linear-gradient(45deg, ${colors.gradient.start} 30%, ${colors.gradient.end} 90%)`,
                      boxShadow: `0 3px 5px 2px ${colors.primary}33`,
                    }}
                  >
                    Next Phrase
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Progress Summary Column */}
          <Box>
            <Paper 
              elevation={24}
              sx={{ 
                p: 3, 
                borderRadius: 4,
                background: `linear-gradient(145deg, ${colors.background.paper} 0%, ${colors.background.paper} 100%)`,
                height: 'fit-content'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Level {selectedLevel} Progress
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Current Session
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Score:</Typography>
                  <Typography variant="body2">{score} / {currentPhraseIndex + 1}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Accuracy:</Typography>
                  <Typography variant="body2">
                    {currentPhraseIndex > 0 ? Math.round((score / (currentPhraseIndex + 1)) * 100) : 0}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Overall Level Progress
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Phrases Studied:</Typography>
                  <Typography variant="body2">
                    {userSettings.progress[selectedLanguage].levelProgress[selectedLevel].attempted}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Correct Answers:</Typography>
                  <Typography variant="body2">
                    {userSettings.progress[selectedLanguage].levelProgress[selectedLevel].correct}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Overall Accuracy:</Typography>
                  <Typography variant="body2">
                    {Math.round((userSettings.progress[selectedLanguage].levelProgress[selectedLevel].correct / 
                      userSettings.progress[selectedLanguage].levelProgress[selectedLevel].attempted) * 100) || 0}%
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Failed Phrases
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">In This Level:</Typography>
                  <Typography variant="body2">
                    {userSettings.progress[selectedLanguage].failedPhrases.filter(p => p.level === selectedLevel).length}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowStats(true)}
                sx={{ mt: 3 }}
              >
                View Full Progress
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  };

  const StatsView = () => {
    const [selectedStatsLanguage, setSelectedStatsLanguage] = useState<Language | null>(selectedLanguage);

    const calculateOverallAccuracy = (progress: UserProgress) => {
      if (progress.phrasesStudied === 0) return 0;
      return Math.round((progress.correctAnswers / progress.phrasesStudied) * 100);
    };

    const calculateLevelAccuracy = (levelStats: { attempted: number; correct: number }) => {
      if (levelStats.attempted === 0) return 0;
      return Math.round((levelStats.correct / levelStats.attempted) * 100);
    };

    const FailedPhrasesSection = ({ language }: { language: Language }) => {
      const failedPhrases = getFilteredFailedPhrases(language, failedPhrasesFilter);
      const totalFailed = userSettings.progress[language].failedPhrases.length;
      
      const stats = {
        totalAttempts: failedPhrases.reduce((sum, p) => sum + p.attempts, 0),
        averageAttempts: totalFailed ? (failedPhrases.reduce((sum, p) => sum + p.attempts, 0) / totalFailed).toFixed(1) : 0,
        mostFailed: failedPhrases.reduce((max, p) => p.attempts > max ? p.attempts : max, 0),
        byLevel: LANGUAGES[language].levels.reduce((acc, level) => ({
          ...acc,
          [level]: failedPhrases.filter(p => p.level === level).length
        }), {} as Record<ProficiencyLevel, number>)
      };

      return (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Failed Phrases ({failedPhrases.length})
              </Typography>
              <Button
                variant="contained"
                onClick={() => startFailedPhrasesPractice(language)}
                disabled={!failedPhrases.length}
              >
                Practice Failed Phrases
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small">
                <InputLabel>Level</InputLabel>
                <Select
                  value={failedPhrasesFilter.level}
                  onChange={(e) => setFailedPhrasesFilter(prev => ({
                    ...prev,
                    level: e.target.value as ProficiencyLevel | 'all'
                  }))}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  {LANGUAGES[language].levels.map(level => (
                    <MenuItem key={level} value={level}>Level {level}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={failedPhrasesFilter.timeRange}
                  onChange={(e) => setFailedPhrasesFilter(prev => ({
                    ...prev,
                    timeRange: e.target.value as FailedPhrasesFilter['timeRange']
                  }))}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={failedPhrasesFilter.sortBy}
                  onChange={(e) => setFailedPhrasesFilter(prev => ({
                    ...prev,
                    sortBy: e.target.value as FailedPhrasesFilter['sortBy']
                  }))}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="attempts">Most Attempts</MenuItem>
                  <MenuItem value="alphabetical">Alphabetical</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Failed Phrases Statistics */}
            <Box sx={{ mb: 3, display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">{stats.totalAttempts}</Typography>
                <Typography variant="body2">Total Failed Attempts</Typography>
              </Paper>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">{stats.averageAttempts}</Typography>
                <Typography variant="body2">Average Attempts per Phrase</Typography>
              </Paper>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">{stats.mostFailed}</Typography>
                <Typography variant="body2">Most Attempts on Single Phrase</Typography>
              </Paper>
            </Box>

            {/* Failed Phrases List */}
            {failedPhrases.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {failedPhrases.map((phrase, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {phrase.original}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={`Level ${phrase.level}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip 
                          label={`${phrase.attempts} attempts`}
                          size="small"
                          color={phrase.attempts > 3 ? "error" : "default"}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {phrase.english}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Last attempt: {new Date(phrase.lastAttemptDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No failed phrases match your current filters
              </Typography>
            )}
          </CardContent>
        </Card>
      );
    };

    return (
      <Box sx={{ maxWidth: '100%', margin: '0 auto', padding: 2 }}>
        {selectedStatsLanguage && <LanguageHeader language={selectedStatsLanguage} level={selectedLevel || undefined} />}
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ mb: 4 }}
        >
          Learning Progress
        </Typography>

        <Box sx={{ mb: 4, width: '100%' }}>
          <FormControl fullWidth>
            <InputLabel>Select Language</InputLabel>
            <Select
              value={selectedStatsLanguage || ''}
              onChange={(e) => setSelectedStatsLanguage(e.target.value as Language)}
              sx={{ mb: 2 }}
            >
              {Object.entries(LANGUAGES).map(([key, { name }]) => (
                <MenuItem key={key} value={key}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedStatsLanguage && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Overall Progress Card */}
            <Box>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overall Progress
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      Total Phrases Studied: {userSettings.progress[selectedStatsLanguage].phrasesStudied}
                    </Typography>
                    <Typography variant="body1">
                      Overall Accuracy: {calculateOverallAccuracy(userSettings.progress[selectedStatsLanguage])}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Study: {new Date(userSettings.progress[selectedStatsLanguage].lastStudyDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Level Progress Card */}
            <Box>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Progress by Level
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {LANGUAGES[selectedStatsLanguage].levels.map((level) => {
                      const levelStats = userSettings.progress[selectedStatsLanguage].levelProgress[level];
                      const accuracy = calculateLevelAccuracy(levelStats);
                      const totalPhrases = phrases[selectedStatsLanguage].filter(p => p.level === level).length;

                      return (
                        <Box key={level}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">
                              Level {level}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {levelStats.correct}/{totalPhrases} completed
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={(levelStats.correct / totalPhrases) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {accuracy}% accuracy
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <FailedPhrasesSection language={selectedStatsLanguage} />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedStatsLanguage(null);
                  setSelectedLanguage(null);
                  setSelectedLevel(null);
                  setShowStats(false);
                }}
              >
                Back to Languages
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setSelectedLanguage(selectedStatsLanguage);
                  if (wasShowingAnswer) {
                    if (currentPhraseIndex < filteredPhrases.length - 1) {
                      setCurrentPhraseIndex(currentPhraseIndex + 1);
                    }
                  }
                  setShowStats(false);
                  setShowAnswer(false);
                  setIsCorrect(null);
                  setWasShowingAnswer(false);
                  if (inputRef.current) {
                    inputRef.current.value = '';
                  }
                }}
              >
                Continue Practice
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Add a user menu to the header
  const UserMenu = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Button
          onClick={handleClick}
          startIcon={<Typography>👤</Typography>}
          endIcon={<Typography>▼</Typography>}
          sx={{ textTransform: 'none' }}
        >
          {user?.email}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
        >
          <MenuItem onClick={logout}>Logout</MenuItem>
        </Menu>
      </Box>
    );
  };

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        id={containerId}
        sx={{
          minHeight: '100vh',
          width: '100vw',
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
          position: 'relative',
          pt: '250px', // Add padding to prevent content from being hidden
        }}
      >
        {/* Debug Panel */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            bgcolor: '#000',
            color: '#fff',
            zIndex: 9999,
            p: 2,
            borderBottom: '2px solid red',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#fff', 
              mb: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              borderBottom: '1px solid #fff',
              pb: 1,
            }}
          >
            DEBUG PANEL
          </Typography>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {debugLogs.map((log, index) => (
              <Typography
                key={index}
                sx={{
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  mb: 1,
                  borderLeft: '2px solid #fff',
                  pl: 1,
                }}
              >
                {log}
              </Typography>
            ))}
          </Box>
        </Box>

        <UserMenu />
        <Container maxWidth={false} sx={{ width: '100%', height: '100%', maxWidth: 'none', px: 4 }}>
          <Box sx={{ py: 6, width: '100%' }}>
            {showStats ? (
              <StatsView />
            ) : (
              <>
                {(!selectedLanguage || !selectedLevel) && <CombinedSelector />}
                {selectedLanguage && selectedLevel && <FlashCard />}
              </>
            )}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default function AppWithAuth(props: FlashcardAppProps) {
  return (
    <AuthProvider>
      <App {...props} />
    </AuthProvider>
  );
}
