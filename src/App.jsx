import { useState } from "react";
import Landing from "./Landing";
import LocalGame from "./LocalGame";
import OnlineGame from "./OnlineGame";

export default function App() {
  const [view, setView] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("g");
    return id ? { mode: "online", gameId: id } : { mode: "menu" };
  });

  function goLocal() {
    window.history.pushState({}, "", "/");
    setView({ mode: "local" });
  }

  function goOnline(id) {
    window.history.pushState({}, "", `?g=${id}`);
    setView({ mode: "online", gameId: id });
  }

  function goMenu() {
    window.history.pushState({}, "", "/");
    setView({ mode: "menu" });
  }

  if (view.mode === "local") return <LocalGame onBack={goMenu} />;
  if (view.mode === "online") return <OnlineGame gameId={view.gameId} onBack={goMenu} />;
  return <Landing onLocal={goLocal} onOnline={goOnline} />;
}
