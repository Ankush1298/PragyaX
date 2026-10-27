import { useEffect, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "./api/client";
import type { User } from "./api/types";
import Layout from "./components/Layout";
import { Loading } from "./components/States";
import { navigate, useHashRoute } from "./hooks";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import SubjectsPage from "./pages/SubjectsPage";
import AssessmentPage from "./pages/AssessmentPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";
import ChallengePage from "./pages/ChallengePage";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(!!tokenStore.get());
  const [aiIsMock, setAiIsMock] = useState(true);
  const [page = "dashboard", param] = useHashRoute();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setUser(null);
    });
    api.health().then((h) => setAiIsMock(h.ai_is_mock)).catch(() => {});
    if (tokenStore.get()) {
      api
        .me()
        .then(setUser)
        .catch(() => tokenStore.clear())
        .finally(() => setChecking(false));
    }
  }, []);

  const onAuth = (u: User, token: string, isNew: boolean) => {
    tokenStore.set(token);
    setUser(u);
    // New learners follow the guided flow: chat -> subject -> assessment -> results -> dashboard.
    navigate(isNew ? "chat" : "dashboard");
  };

  const onLogout = async () => {
    await api.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  };

  if (checking) return <Loading label="Restoring your session…" />;
  if (!user) return <AuthPage onAuth={onAuth} />;

  const pages: Record<string, ReactNode> = {
    dashboard: <DashboardPage />,
    chat: <ChatPage />,
    subjects: <SubjectsPage />,
    assessment: <AssessmentPage />,
    results: <HistoryPage />,
    result: <ResultPage id={param ?? ""} />,
    challenge: <ChallengePage />,
  };

  return (
    <Layout user={user} active={page} aiIsMock={aiIsMock} onLogout={onLogout}>
      {pages[page] ?? <DashboardPage />}
    </Layout>
  );
}
